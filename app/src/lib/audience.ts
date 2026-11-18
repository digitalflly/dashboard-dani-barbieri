// ============================================================
// Audiência — análise de qualificação dos seguidores.
// Fase 1 (nova): demografia (gênero/idade, país, cidade) +
// split seguidor/não-seguidor, lidos ao vivo do conector
// Instagram do Windsor (mesmas chaves da aba Conta).
// VM combina 4 blocos: fit com ICP, qualidade/ativação,
// geografia (nacional x local) e ponte com vendas.
// ============================================================

import type { ChartConfiguration } from 'chart.js'
import { WINDSOR_KEY, HANDLE, ACCENT } from './constants'
import { ymd } from './dates'
import { fmtNum, fmtPct } from './format'
import { lineCfg, rampColors, doughnutCfg } from './charts'
import { faixaGroup } from './acomp'
import { RESULTADOS_VENDAS, type ResVendaMes } from './resultadosVendasData'
import type { Model, TallyItem } from './types'
import type { DashState } from './useDashboard'

// ---------- tipos de dados ----------
export interface GenderAge {
  gender: string // 'F' | 'M' | 'U'
  age: string // '25-34' etc
  size: number
}
export interface GeoItem {
  name: string
  size: number
}
export interface ReachDay {
  date: string
  reach: number
  reachF: number
  reachNF: number
  viewsF: number
  viewsNF: number
  engaged: number
}
export interface AudienceData {
  genderAge: GenderAge[]
  countries: GeoItem[]
  cities: GeoItem[]
  reach: ReachDay[]
  total: number
  fetchedAt: string
}

// ---------- fetch ao vivo ----------
const num = (v: unknown): number => (v == null || v === '' ? 0 : +(v as number) || 0)
const isDate = (s: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(s)
const fd = (d: Date): string => ymd(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())))

async function wq(fields: string, from: string, to: string): Promise<Record<string, unknown>[]> {
  const u =
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
  const r = await fetch(u, { cache: 'no-store' })
  if (!r.ok) throw new Error('Windsor HTTP ' + r.status)
  const j = await r.json()
  const arr: Record<string, unknown>[] = j && j.data ? j.data : Array.isArray(j) ? j : []
  // filtro leniente por conta: as tabelas demográficas (lifetime) não trazem o campo
  // username por linha, então mantemos linhas sem username e filtramos as que o têm.
  return arr.filter((x) => {
    const u2 = x.username
    return u2 == null || u2 === '' || String(u2).toLowerCase() === HANDLE.toLowerCase()
  })
}

// agrega por chave de rótulo pegando o MAIOR valor (tabelas lifetime podem repetir
// o mesmo total por dia no intervalo — o max recupera o snapshot correto).
function dedupeMax(rows: Record<string, unknown>[], nameKey: string, sizeKey: string): GeoItem[] {
  const by: Record<string, number> = {}
  rows.forEach((r) => {
    const name = String(r[nameKey] ?? '').trim()
    if (!name) return
    by[name] = Math.max(by[name] || 0, num(r[sizeKey]))
  })
  return Object.keys(by).map((name) => ({ name, size: by[name] })).sort((a, b) => b.size - a.size)
}

/** Lê demografia + split seguidor/não-seguidor ao vivo. Lança se faltar demografia. */
export async function fetchAudience(): Promise<AudienceData> {
  const to = new Date()
  const from = fd(new Date(to.getTime() - 120 * 86400000))
  const [gaRows, coRows, ciRows, rsRows] = await Promise.all([
    wq('audience_gender_age_name,audience_gender_age_size,username', from, fd(to)),
    wq('audience_country_name,audience_country_size,username', from, fd(to)),
    wq('city,audience_city_size,username', from, fd(to)),
    wq('date,reach,reach_followers,reach_non_followers,views_followers,views_non_followers,accounts_engaged,username', from, fd(to)),
  ])

  const gaMax = dedupeMax(gaRows, 'audience_gender_age_name', 'audience_gender_age_size')
  const genderAge: GenderAge[] = gaMax
    .map((g) => {
      const [gender, age] = g.name.split('.')
      return { gender: gender || 'U', age: age || '', size: g.size }
    })
    .filter((g) => g.age)
  const total = genderAge.reduce((a, g) => a + g.size, 0)
  if (!genderAge.length || total === 0) throw new Error('Sem dados de demografia para @' + HANDLE + '.')

  const countries = dedupeMax(coRows, 'audience_country_name', 'audience_country_size')
  const cities = dedupeMax(ciRows, 'city', 'audience_city_size')

  // split diário (série real, uma linha por dia)
  const rbyDate: Record<string, ReachDay> = {}
  rsRows.forEach((r) => {
    const d = String(r.date ?? '').slice(0, 10)
    if (!isDate(d)) return
    rbyDate[d] = {
      date: d,
      reach: num(r.reach),
      reachF: num(r.reach_followers),
      reachNF: num(r.reach_non_followers),
      viewsF: num(r.views_followers),
      viewsNF: num(r.views_non_followers),
      engaged: num(r.accounts_engaged),
    }
  })
  const reach = Object.values(rbyDate).sort((a, b) => (a.date < b.date ? -1 : 1))

  return { genderAge, countries, cities, reach, total, fetchedAt: fd(to) }
}

// ---------- helpers de gráfico (rótulos próprios: "seguidores") ----------
const darkTT = {
  backgroundColor: '#271217',
  titleColor: '#F6EFE8',
  bodyColor: '#EAD9C9',
  borderColor: '#4A3338',
  borderWidth: 1,
  padding: 10,
  cornerRadius: 8,
  titleFont: { family: 'Arimo', weight: 'bold' as const },
  bodyFont: { family: 'Arimo' },
}

function audBarCfg(items: TallyItem[], opts: { horizontal?: boolean } = {}): ChartConfiguration {
  const horizontal = !!opts.horizontal
  const colors = rampColors(items.length)
  const cfg: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels: items.map((i) => i.label),
      datasets: [{ data: items.map((i) => i.count), backgroundColor: colors, borderRadius: 4, borderSkipped: false, maxBarThickness: 44 }],
    },
    options: {
      indexAxis: horizontal ? 'y' : 'x',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { ...darkTT, callbacks: { label: (c) => fmtNum((horizontal ? c.parsed.x : c.parsed.y) as number) + ' seguidores' } },
      },
      scales: {
        x: {
          grid: { display: horizontal, color: 'rgba(119,21,32,0.07)' },
          ticks: {
            font: { family: 'Arimo', size: 10 },
            color: '#6E595D',
            autoSkip: false,
            maxRotation: 0,
            callback: horizontal
              ? (v) => fmtNum(v as number)
              : function (this: { getLabelForValue: (v: number) => string }, v) {
                  const l = this.getLabelForValue(v as number)
                  return l.length > 15 ? l.slice(0, 14) + '…' : l
                },
          },
        },
        y: {
          beginAtZero: true,
          grid: { display: !horizontal, color: 'rgba(119,21,32,0.07)' },
          ticks: {
            font: { family: 'Arimo', size: 10.5 },
            color: '#6E595D',
            autoSkip: false,
            callback: horizontal
              ? function (this: { getLabelForValue: (v: number) => string }, v) {
                  return this.getLabelForValue(v as number)
                }
              : (v) => fmtNum(v as number),
          },
        },
      },
    },
  }
  return cfg as ChartConfiguration
}

// ---------- view-model ----------
export interface AudKpi {
  label: string
  value: string
  sub: string
  accent: string
}
export interface AudChip {
  label: string
  value: string
  hint: string
}
export interface AudFunnelStage {
  label: string
  value: string
  rate: string
  note: string
}
export interface AudienceVM {
  ready: boolean
  loading: boolean
  error: string
  fetchedAt: string
  base: string
  baseN: number
  // bloco 1 — fit com ICP
  fitScore: string
  fitHeadline: string
  fitChips: AudChip[]
  genderDonut: ChartConfiguration
  genderLegend: { label: string; value: string; color: string }[]
  ageBars: ChartConfiguration
  ageTable: { age: string; total: string; pct: string; isCore: boolean }[]
  // bloco 2 — qualidade / ativação
  qualityKpis: AudKpi[]
  followerReachLine: ChartConfiguration | null
  qualityNote: string
  // bloco 3 — geografia
  brShare: string
  nonBrShare: string
  cityBars: ChartConfiguration
  stateBars: ChartConfiguration
  topCountries: { name: string; size: string; pct: string }[]
  localNote: string
  // bloco 4 — ponte com vendas
  funnel: AudFunnelStage[]
  funnelNote: string
}

const AGE_ORDER = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+']
const CORE_AGES = new Set(['25-34', '35-44', '45-54']) // 25-54 = núcleo de decisão/compra
const COUNTRY_NAMES: Record<string, string> = {
  BR: 'Brasil', PT: 'Portugal', US: 'Estados Unidos', ES: 'Espanha', GB: 'Reino Unido', IT: 'Itália',
  IE: 'Irlanda', PY: 'Paraguai', FR: 'França', CA: 'Canadá', AR: 'Argentina', AU: 'Austrália', JP: 'Japão',
  DE: 'Alemanha', CH: 'Suíça', MX: 'México', CL: 'Chile', CO: 'Colômbia', UY: 'Uruguai', AE: 'Emirados Árabes',
}

function stateOf(city: string): string {
  // "Ribeirão Prêto, São Paulo (state)" | "São Luís, Maranhão"
  const parts = city.split(',')
  const tail = (parts[parts.length - 1] || '').replace(/\(state\)/i, '').trim()
  return tail || '—'
}

export function audienceVM(M: Model, S: DashState): AudienceVM {
  const empty = (): ChartConfiguration => ({ type: 'bar', data: { labels: [], datasets: [] } }) as ChartConfiguration
  const A = S.audData
  const base: AudienceVM = {
    ready: false,
    loading: !!S.audLoading,
    error: S.audError || '',
    fetchedAt: '',
    base: '—',
    baseN: 0,
    fitScore: '—',
    fitHeadline: '',
    fitChips: [],
    genderDonut: empty(),
    genderLegend: [],
    ageBars: empty(),
    ageTable: [],
    qualityKpis: [],
    followerReachLine: null,
    qualityNote: '',
    brShare: '—',
    nonBrShare: '—',
    cityBars: empty(),
    stateBars: empty(),
    topCountries: [],
    localNote: '',
    funnel: [],
    funnelNote: '',
  }
  if (!A) return base

  const tot = A.total
  base.ready = true
  base.fetchedAt = A.fetchedAt
  base.baseN = tot
  base.base = fmtNum(tot)

  // ----- bloco 1: fit com ICP -----
  const byGender: Record<string, number> = { F: 0, M: 0, U: 0 }
  const byAge: Record<string, number> = {}
  A.genderAge.forEach((g) => {
    byGender[g.gender] = (byGender[g.gender] || 0) + g.size
    byAge[g.age] = (byAge[g.age] || 0) + g.size
  })
  const femShare = tot ? (byGender.F / tot) * 100 : 0
  const women2554 = A.genderAge.filter((g) => g.gender === 'F' && CORE_AGES.has(g.age)).reduce((a, g) => a + g.size, 0)
  const age2554 = AGE_ORDER.filter((a) => CORE_AGES.has(a)).reduce((a, k) => a + (byAge[k] || 0), 0)
  const brSize = (A.countries.find((c) => c.name === 'BR') || { size: 0 }).size
  const coTotal = A.countries.reduce((a, c) => a + c.size, 0) || 1
  const brShare = (brSize / coTotal) * 100
  // índice de fit = fatia estimada da base que é mulher 25-54 E no Brasil
  const women2554Share = tot ? (women2554 / tot) * 100 : 0
  const fitScore = women2554Share * (brShare / 100)
  base.fitScore = fmtPct(fitScore)
  base.fitHeadline =
    fitScore >= 60
      ? 'Forte aderência ao perfil de cliente ideal'
      : fitScore >= 40
        ? 'Aderência moderada ao perfil de cliente ideal'
        : 'Aderência baixa — audiência dispersa do ICP'
  base.fitChips = [
    { label: 'Mulheres', value: fmtPct(femShare), hint: 'do total de seguidores' },
    { label: 'Faixa 25-54 anos', value: fmtPct(tot ? (age2554 / tot) * 100 : 0), hint: 'idade de decisão/compra' },
    { label: 'No Brasil', value: fmtPct(brShare), hint: 'seu mercado' },
    { label: 'Mulheres 25-54', value: fmtPct(women2554Share), hint: 'núcleo do ICP' },
  ]

  // donut de gênero
  const gLabels: Record<string, string> = { F: 'Mulheres', M: 'Homens', U: 'Não identificado' }
  const gItems: TallyItem[] = ['F', 'M', 'U'].filter((k) => byGender[k] > 0).map((k) => ({ label: gLabels[k], count: byGender[k] }))
  base.genderDonut = doughnutCfg(gItems)
  const gColors = rampColors(gItems.length)
  base.genderLegend = gItems.map((it, i) => ({ label: it.label, value: fmtPct(tot ? (it.count / tot) * 100 : 0), color: gColors[i] }))

  // barras de idade (todos os gêneros)
  const ageItems: TallyItem[] = AGE_ORDER.filter((a) => (byAge[a] || 0) > 0).map((a) => ({ label: a, count: byAge[a] }))
  base.ageBars = audBarCfg(ageItems)
  base.ageTable = AGE_ORDER.filter((a) => (byAge[a] || 0) > 0).map((a) => ({
    age: a,
    total: fmtNum(byAge[a]),
    pct: fmtPct(tot ? (byAge[a] / tot) * 100 : 0),
    isCore: CORE_AGES.has(a),
  }))

  // ----- bloco 2: qualidade / ativação -----
  const R = A.reach
  const rf = R.reduce((a, d) => a + d.reachF, 0)
  const rnf = R.reduce((a, d) => a + d.reachNF, 0)
  const vf = R.reduce((a, d) => a + d.viewsF, 0)
  const vnf = R.reduce((a, d) => a + d.viewsNF, 0)
  const followerReachShare = rf + rnf ? (rf / (rf + rnf)) * 100 : 0
  const followerViewShare = vf + vnf ? (vf / (vf + vnf)) * 100 : 0
  const engDays = R.filter((d) => d.engaged > 0)
  const avgEng = engDays.length ? engDays.reduce((a, d) => a + d.engaged, 0) / engDays.length : 0
  const engShareDay = tot ? (avgEng / tot) * 100 : 0
  const accent = ACCENT
  base.qualityKpis = [
    { label: 'Alcance vindo de seguidores', value: fmtPct(followerReachShare), sub: 'nos últimos ' + R.length + ' dias', accent },
    { label: 'Views vindos de seguidores', value: fmtPct(followerViewShare), sub: 'quanto a base consome', accent },
    { label: 'Contas engajadas / dia', value: fmtNum(avgEng), sub: 'média no período', accent },
    { label: 'Engajamento diário da base', value: fmtPct(engShareDay), sub: 'contas engajadas ÷ seguidores', accent },
  ]
  if (R.length >= 2) {
    const labels = R.map((d) => d.date.slice(5).replace('-', '/'))
    const series = R.map((d) => (d.reachF + d.reachNF ? +((d.reachF / (d.reachF + d.reachNF)) * 100).toFixed(1) : null))
    base.followerReachLine = lineCfg(
      labels,
      [{ label: '% alcance de seguidores', data: series, color: accent, fill: true, fillColor: 'rgba(119,21,32,0.08)' }],
      { pct: true, zero: true }
    )
  }
  base.qualityNote =
    followerReachShare < 30
      ? 'A maior parte do alcance vem de não-seguidores (descoberta/anúncios). A base atual é grande, mas uma fatia pequena vê o conteúdo recorrentemente — há espaço para reativar seguidores.'
      : 'Boa parcela do alcance vem da própria base — sinal de seguidores ativos e fiéis ao conteúdo.'

  // ----- bloco 3: geografia -----
  base.brShare = fmtPct(brShare)
  base.nonBrShare = fmtPct(100 - brShare)
  const cityItems: TallyItem[] = A.cities.slice(0, 10).map((c) => ({ label: c.name.split(',')[0].trim(), count: c.size }))
  base.cityBars = audBarCfg(cityItems, { horizontal: true })
  const stBy: Record<string, number> = {}
  A.cities.forEach((c) => {
    const st = stateOf(c.name)
    stBy[st] = (stBy[st] || 0) + c.size
  })
  const stateItems: TallyItem[] = Object.keys(stBy)
    .map((st) => ({ label: st, count: stBy[st] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
  base.stateBars = audBarCfg(stateItems, { horizontal: true })
  base.topCountries = A.countries.slice(0, 6).map((c) => ({
    name: COUNTRY_NAMES[c.name] || c.name,
    size: fmtNum(c.size),
    pct: fmtPct((c.size / coTotal) * 100),
  }))
  const topCity = A.cities[0]
  const cityShare = topCity ? (topCity.size / (A.cities.reduce((a, c) => a + c.size, 0) || 1)) * 100 : 0
  base.localNote = topCity
    ? 'Forte concentração em ' +
      topCity.name.split(',')[0].trim() +
      ' (' +
      fmtPct(cityShare) +
      ' das cidades mapeadas). Audiência com núcleo regional + alcance nacional.'
    : ''

  // ----- bloco 4: ponte com vendas -----
  const rows = S.aplicLeadsRows || []
  const MQL = new Set(['A', 'B', 'D', 'AB'])
  let leads = 0
  let qual = 0
  let minD = ''
  let maxD = ''
  rows.forEach((r) => {
    leads++
    const g = faixaGroup(r.faixa)
    if (g && MQL.has(g) && r.perfilOk !== false) qual++
    if (!minD || r.date < minD) minD = r.date
    if (!maxD || r.date > maxD) maxD = r.date
  })
  // vendas 2026 (snapshot congelado + override ao vivo do mês corrente/anterior)
  const meses: Record<string, ResVendaMes> = { ...RESULTADOS_VENDAS.meses, ...(S.rvLive || {}) }
  const vendas = Object.values(meses).reduce((a, m) => a + (m.vendas || 0), 0)
  const followers = M.followers || tot
  const fmtRange = (a: string, b: string): string =>
    a && b ? a.slice(8) + '/' + a.slice(5, 7) + '–' + b.slice(8) + '/' + b.slice(5, 7) : 'período com dados'
  base.funnel = [
    { label: 'Seguidores', value: fmtNum(followers), rate: '', note: 'base atual do perfil' },
    { label: 'Leads gerados', value: fmtNum(leads), rate: '', note: fmtRange(minD, maxD) },
    {
      label: 'Leads qualificados (MQL)',
      value: fmtNum(qual),
      rate: leads ? fmtPct((qual / leads) * 100) + ' dos leads' : '',
      note: 'faturamento ≥ R$ 15 mil/mês + perfil',
    },
    { label: 'Vendas', value: fmtNum(vendas), rate: '', note: 'fechamentos em 2026' },
  ]
  base.funnelNote =
    'A demografia acima mostra que o perfil certo te segue; esta ponte mostra quanto dessa audiência avança até virar cliente. ' +
    'Os leads vêm das planilhas de aquisição (Aplicação Direta + Respondi) e as vendas do fechamento mensal — janelas diferentes, por isso leia cada etapa como volume, não como taxa direta entre pontas.'

  return base
}
