// ============================================================
// Audiência — demografia dos seguidores lida ao vivo do conector
// Instagram do Windsor. Porta fiel do fetchAudiencia()/audVals()
// do Dashboard.dc.html (design mirror):
//   KPIs do período, persona predominante, gênero, faixa etária,
//   top cidades e top estados — tudo a partir do snapshot lifetime
//   de gênero/idade/cidade + a série diária de alcance/interações.
// A análise de qualificação (@/bio) é curada e vive em audienceQual.
// ============================================================

import { WINDSOR_KEY, IG_ACCOUNT_ID, HANDLE, ACCENT } from './constants'
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

async function pull(fields: string, extra?: string): Promise<Record<string, unknown>[]> {
  const url =
    'https://connectors.windsor.ai/instagram?api_key=' +
    encodeURIComponent(WINDSOR_KEY) +
    '&fields=' +
    encodeURIComponent(fields) +
    (extra || '') +
    '&_cb=' +
    Date.now()
  const r = await fetch(url, { cache: 'no-store' })
  if (!r.ok) throw new Error('Instagram HTTP ' + r.status)
  const j = await r.json()
  if (j && j.error) throw new Error(String(j.error).slice(0, 120))
  const arr: Record<string, unknown>[] = j && j.data ? j.data : Array.isArray(j) ? j : []
  return arr.filter((x) => String(x.account_id ?? '') === IG_ACCOUNT_ID)
}

/** Lê a série diária + os snapshots de perfil/gênero-idade/cidade. Lança se faltar demografia. */
export async function fetchAudience(): Promise<AudienceData> {
  const today = ymd(new Date())
  const [daily, prof, ga, city] = await Promise.all([
    pull('account_id,date,reach,total_interactions,accounts_engaged,follower_count', '&date_from=2026-08-01&date_to=' + today),
    pull('account_id,followers_count,follows_count,media_count'),
    pull('account_id,audience_gender_age_name,audience_gender_age_size'),
    pull('account_id,city,audience_city_size'),
  ])

  const dailyRows: AudDaily[] = daily
    .map((r) => ({
      date: String(r.date ?? '').slice(0, 10),
      reach: num(r.reach),
      inter: num(r.total_interactions),
      engaged: num(r.accounts_engaged),
      newf: num(r.follower_count),
    }))
    .filter((d) => isDate(d.date))
    .sort((a, b) => (a.date < b.date ? -1 : 1))

  const followers = num((prof[0] || {}).followers_count)
  const gaRows: AudGeo[] = ga
    .map((r) => ({ name: String(r.audience_gender_age_name ?? '').trim(), size: num(r.audience_gender_age_size) }))
    .filter((g) => g.name)
  const cityRows: AudGeo[] = city
    .map((r) => ({ name: String(r.city ?? '').trim(), size: num(r.audience_city_size) }))
    .filter((c) => c.name)

  if (!gaRows.length) throw new Error('Sem dados de demografia para @' + HANDLE + '.')

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
  const gWin = [
    ['Feminino', gmap.F],
    ['Masculino', gmap.M],
    ['Não informado', gmap.U],
  ].sort((a, b) => (b[1] as number) - (a[1] as number))[0]
  const aWin = AGES.map((a) => [a, amap[a] || 0] as [string, number]).sort((a, b) => b[1] - a[1])[0]
  const sWin = states[0] || ['—', 0]
  base.persona = { gender: String(gWin[0]), age: aWin[0] + ' anos', state: String(sWin[0]) }
  base.demoNote = 'Foto atual de quem segue o perfil — ' + fmtNum(gaTot) + ' seguidores classificados por gênero e idade'

  return base
}
