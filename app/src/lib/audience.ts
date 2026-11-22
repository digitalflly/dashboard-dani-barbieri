// ============================================================
// Audiência — demografia dos seguidores lida ao vivo do conector
// Instagram do Windsor. Porta fiel do fetchAudiencia()/audVals()
// do Dashboard.dc.html (design mirror):
//   KPIs do período, persona predominante, gênero, faixa etária,
//   top cidades e top estados — tudo a partir do snapshot lifetime
//   de gênero/idade/cidade + a série diária de alcance/interações.
// A análise de qualificação (@/bio) é curada e vive em audienceQual.
// ============================================================

import { WINDSOR_KEY, HANDLE, ACCENT } from './constants'
import { ymd } from './dates'
import { fmtNum } from './format'
import type { Model } from './types'
import type { DashState } from './useDashboard'

// piso da série diária de audiência (início do rastreamento confiável),
// igual ao FLOOR do planoWin no mirror. A aba não tem filtro de data, então
// "no período" = tudo o que foi rastreado desde o piso.
const AUD_FLOOR = '2026-08-17'

// ---------- tipos de dados ----------
export interface AudDaily {
  date: string
  reach: number
  inter: number
  engaged: number
  newf: number
}
export interface AudGeo {
  name: string
  size: number
}
export interface AudienceData {
  daily: AudDaily[]
  followers: number
  ga: AudGeo[] // audience_gender_age_name -> size (snapshot lifetime)
  city: AudGeo[] // city -> audience_city_size (snapshot lifetime)
  fetchedAt: string
}

// ---------- fetch ao vivo ----------
const num = (v: unknown): number => (v == null || v === '' ? 0 : +(v as number) || 0)
const isDate = (s: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(s)
const fd = (d: Date): string => ymd(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())))

// O endpoint REST (api_key) EXIGE date_from/date_to. Além disso, cada campo vive
// numa "tabela" do conector e tem regras próprias — ex.: `follower_count` só
// aceita os últimos 30 dias (fora disso → HTTP 400). Por isso separamos as
// consultas por tabela/limite e filtramos por `username` (mesmo padrão da aba
// Conta, que funciona), deixando as tabelas lifetime (demografia) tolerantes a
// falha para não derrubar a página inteira.
async function pull(fields: string, from: string, to: string): Promise<Record<string, unknown>[]> {
  const url =
    'https://connectors.windsor.ai/instagram?api_key=' +
    encodeURIComponent(WINDSOR_KEY) +
    '&date_from=' +
    from +
    '&date_to=' +
    to +
    '&fields=' +
    encodeURIComponent(fields) +
    '&_cb=' +
    Date.now()
  const r = await fetch(url, { cache: 'no-store' })
  if (!r.ok) throw new Error('Instagram HTTP ' + r.status)
  const j = await r.json()
  if (j && j.error) throw new Error(String(j.error).slice(0, 120))
  return j && j.data ? j.data : Array.isArray(j) ? j : []
}

const isMine = (r: Record<string, unknown>): boolean => String(r.username ?? '').toLowerCase() === HANDLE.toLowerCase()
const safe = (p: Promise<Record<string, unknown>[]>): Promise<Record<string, unknown>[]> => p.catch(() => [] as Record<string, unknown>[])

// agrega por rótulo pegando o MAIOR valor (snapshot lifetime pode repetir por dia).
function dedupeMax(rows: Record<string, unknown>[], nameKey: string, sizeKey: string): AudGeo[] {
  const by: Record<string, number> = {}
  rows.forEach((r) => {
    const name = String(r[nameKey] ?? '').trim()
    if (!name) return
    by[name] = Math.max(by[name] || 0, num(r[sizeKey]))
  })
  return Object.keys(by)
    .map((name) => ({ name, size: by[name] }))
    .sort((a, b) => b.size - a.size)
}

/** Lê a série diária + os snapshots de perfil/gênero-idade/cidade. */
export async function fetchAudience(): Promise<AudienceData> {
  const now = new Date()
  const today = fd(now)
  const d30 = fd(new Date(now.getTime() - 29 * 86400000)) // limite do follower_count
  const d7 = fd(new Date(now.getTime() - 7 * 86400000)) // janela recente p/ snapshots

  const [dailyRaw, newfRaw, profRaw, gaRaw, cityRaw] = await Promise.all([
    safe(pull('date,reach,total_interactions,accounts_engaged,username', '2026-08-01', today)),
    safe(pull('date,follower_count,username', d30, today)),
    safe(pull('followers_count,username', d7, today)),
    safe(pull('audience_gender_age_name,audience_gender_age_size', d7, today)),
    safe(pull('city,audience_city_size', d7, today)),
  ])

  // novos seguidores por dia (follower_count, só últimos ~30 dias)
  const newfBy: Record<string, number> = {}
  newfRaw.filter(isMine).forEach((r) => {
    const d = String(r.date ?? '').slice(0, 10)
    if (isDate(d)) newfBy[d] = num(r.follower_count)
  })

  const dailyRows: AudDaily[] = dailyRaw
    .filter(isMine)
    .map((r) => {
      const date = String(r.date ?? '').slice(0, 10)
      return { date, reach: num(r.reach), inter: num(r.total_interactions), engaged: num(r.accounts_engaged), newf: newfBy[date] || 0 }
    })
    .filter((d) => isDate(d.date))
    .sort((a, b) => (a.date < b.date ? -1 : 1))

  // followers: maior followers_count da janela (cresce, então o máximo ≈ o mais recente)
  const followers = profRaw.filter(isMine).reduce((a, r) => Math.max(a, num(r.followers_count)), 0)
  // tabelas lifetime não trazem username por linha — mantém todas (a chave é da conta)
  const gaRows = dedupeMax(gaRaw, 'audience_gender_age_name', 'audience_gender_age_size')
  const cityRows = dedupeMax(cityRaw, 'city', 'audience_city_size')

  if (!dailyRows.length && !followers && !gaRows.length) throw new Error('Sem dados ao vivo para @' + HANDLE + '.')

  return { daily: dailyRows, followers, ga: gaRows, city: cityRows, fetchedAt: today }
}

// ---------- view-model ----------
export interface AudKpi {
  label: string
  value: string
  sub: string
  accent: string
}
export interface AudBar {
  label: string
  value: string
  pct: string
  width: string
}
export interface AudPersona {
  gender: string
  age: string
  state: string
}
export interface AudienceVM {
  ready: boolean
  loading: boolean
  error: string
  fetchedAt: string
  kpis: AudKpi[]
  persona: AudPersona
  gender: AudBar[]
  age: AudBar[]
  cities: AudBar[]
  states: AudBar[]
  demoNote: string
}

const AGES = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+']
const G_LAB: Record<string, string> = { F: 'Feminino', M: 'Masculino', U: 'Não informado' }
const pct0 = (v: number): string => v.toFixed(0) + '%'
const pct1 = (v: number): string => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%'
const width1 = (v: number): string => v.toFixed(1) + '%'

function stateOf(city: string): string {
  const p = city.split(',')
  return p.length > 1 ? p[p.length - 1].replace(/\(state\)/i, '').trim() || '—' : '—'
}

export function audienceVM(_M: Model, S: DashState): AudienceVM {
  const base: AudienceVM = {
    ready: false,
    loading: !!S.audLoading,
    error: S.audError || '',
    fetchedAt: '',
    kpis: [],
    persona: { gender: '', age: '', state: '' },
    gender: [],
    age: [],
    cities: [],
    states: [],
    demoNote: '',
  }
  const A = S.audData
  if (!A) return base
  base.ready = true
  base.fetchedAt = A.fetchedAt

  // ----- série diária desde o piso de rastreamento (aba sem filtro de data) -----
  const daily = A.daily.filter((r) => r.date >= AUD_FLOOR)
  const sum = (k: keyof AudDaily): number => daily.reduce((a, r) => a + (+(r[k] as number) || 0), 0)
  const reach = sum('reach')
  const inter = sum('inter')
  const engAcc = sum('engaged')
  const newf = sum('newf')
  const followers = A.followers
  const days = daily.length || 1
  const engRate = reach ? (inter / reach) * 100 : 0
  base.kpis = [
    { label: 'Seguidores', value: fmtNum(followers), sub: (newf >= 0 ? '+' : '') + fmtNum(newf) + ' no período', accent: ACCENT },
    { label: 'Alcance no período', value: fmtNum(reach), sub: fmtNum(reach / days) + '/dia', accent: ACCENT },
    { label: 'Interações', value: fmtNum(inter), sub: fmtNum(engAcc) + ' contas engajadas', accent: ACCENT },
    { label: 'Engajamento / alcance', value: pct1(engRate), sub: 'interações ÷ alcance', accent: ACCENT },
  ]

  // ----- gênero + idade (snapshot lifetime) -----
  const gmap: Record<string, number> = { F: 0, M: 0, U: 0 }
  const amap: Record<string, number> = {}
  A.ga.forEach((r) => {
    const p = r.name.split('.')
    if (p[0] in gmap) gmap[p[0]] += r.size
    if (p[1]) amap[p[1]] = (amap[p[1]] || 0) + r.size
  })
  const gaTot = A.ga.reduce((a, r) => a + r.size, 0) || 1
  const gMax = Math.max(1, gmap.F, gmap.M, gmap.U)
  base.gender = (['F', 'M', 'U'] as const)
    .filter((g) => gmap[g] > 0)
    .map((g) => ({ label: G_LAB[g], value: fmtNum(gmap[g]), pct: pct0((gmap[g] / gaTot) * 100), width: width1((gmap[g] / gMax) * 100) }))
  const aMax = Math.max(1, ...AGES.map((a) => amap[a] || 0))
  base.age = AGES.map((a) => ({
    label: a + ' anos',
    value: fmtNum(amap[a] || 0),
    pct: pct0(((amap[a] || 0) / gaTot) * 100),
    width: width1(((amap[a] || 0) / aMax) * 100),
  }))

  // ----- cidades + estados (snapshot lifetime) -----
  const cities = A.city.slice().sort((a, b) => b.size - a.size)
  const cMax = cities.length ? cities[0].size || 1 : 1
  base.cities = cities.slice(0, 8).map((r) => ({
    label: r.name.split(',')[0],
    value: fmtNum(r.size),
    pct: followers ? width1((r.size / followers) * 100) : '',
    width: width1((r.size / cMax) * 100),
  }))
  const smap: Record<string, number> = {}
  cities.forEach((r) => {
    const st = stateOf(r.name)
    smap[st] = (smap[st] || 0) + r.size
  })
  const states = Object.entries(smap).sort((a, b) => b[1] - a[1])
  const sMax = states.length ? states[0][1] : 1
  base.states = states.slice(0, 8).map((e) => ({
    label: e[0],
    value: fmtNum(e[1]),
    pct: followers ? width1((e[1] / followers) * 100) : '',
    width: width1((e[1] / sMax) * 100),
  }))

  // ----- persona predominante -----
  if (A.ga.length) {
    const gWin = [
      ['Feminino', gmap.F],
      ['Masculino', gmap.M],
      ['Não informado', gmap.U],
    ].sort((a, b) => (b[1] as number) - (a[1] as number))[0]
    const aWin = AGES.map((a) => [a, amap[a] || 0] as [string, number]).sort((a, b) => b[1] - a[1])[0]
    const sWin = states[0] || ['—', 0]
    base.persona = { gender: String(gWin[0]), age: aWin[0] + ' anos', state: String(sWin[0]) }
    base.demoNote = 'Foto atual de quem segue o perfil — ' + fmtNum(gaTot) + ' seguidores classificados por gênero e idade'
  } else {
    // gênero/idade ao vivo indisponíveis (tabela lifetime) — mantém KPIs e geografia
    base.age = []
    base.persona = { gender: '—', age: '—', state: states[0] ? String(states[0][0]) : '—' }
    base.demoNote = 'Demografia (gênero, idade) ao vivo indisponível no momento — toque em Atualizar.'
  }

  return base
}
