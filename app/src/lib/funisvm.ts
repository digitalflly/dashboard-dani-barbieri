// ============================================================
// View-model for the "Dados dos Funis" page. Ported from
// candVals() in Dashboard.dc.html. Pure: handlers wired in the
// component. Returns the chart configs keyed by canvas id.
// ============================================================

import { fmtNum, fmtPct } from './format'
import { funnelSpec, parseRowDate } from './sheets'
import { buildFunnel } from './funnel'
import { lineCfg, barCfg, doughnutCfg } from './charts'
import { investFunnel, type InvestVM, type AdsState } from './invest'
import { adsAgg, dailyAgg } from './facebook'
import { FUNNELS, ADS_CAMPAIGN_MATCH } from './constants'
import { MONTH_NAMES, lastDayOf } from './dates'
import type { ChartConfiguration } from 'chart.js'
import type { MonthDef } from './types'
import type { DashState } from './useDashboard'

export interface FunnelTab {
  key: string
  label: string
  active: boolean
  inactive: boolean
}
export interface StatusBtn {
  key: string
  label: string
  active: boolean
  inactive: boolean
}
export interface CandFilters {
  month: string
  from: string
  to: string
  monthOptions: MonthDef[]
  min: string
  max: string
  hasFilter: boolean
}
export interface CandKpi {
  label: string
  value: string
}
export interface CandChart {
  id: string
  legendId: string
  title: string
  eyebrow: string
  donut: boolean
  bar: boolean
}
export interface FunisVM {
  funnelTabs: FunnelTab[]
  candFilters: CandFilters
  candStatusBtns: StatusBtn[]
  candReady: boolean
  candLoadingView: boolean
  candStatusLabel: string
  candKpis: CandKpi[]
  candCharts: CandChart[]
  cfgs: Record<string, ChartConfiguration>
  invest: InvestVM
  leadsView: boolean
  showStatusBtns: boolean
  statusGroupLabel: string
  statusMode: 'status' | 'imersao'
  // NEA 2ª Edição — seção de vendas
  neaVendasShow: boolean
  neaVendasNote: string
  neaKpis: { label: string; value: string }[]
  neaDaily: NeaDailyView[]
}

export interface NeaDailyView {
  d: string
  inv: string
  ing: string
  fat: string
  ob: string
  conv: string
  compras: string
  tk: string
  cst: string
  ads: string
  org: string
}

// KPIs + indicadores por dia da NEA 2ª Edição — 100% dados reais das
// campanhas "NEA 2.0" do gerenciador (compras/receita), sem planilha.
function neaLiveVM(S: DashState, from: string, to: string): { kpis: { label: string; value: string }[]; daily: NeaDailyView[] } {
  const agg = adsAgg(S.adsRaw, ADS_CAMPAIGN_MATCH.nea2, from, to)
  const days = dailyAgg(S.adsRaw, ADS_CAMPAIGN_MATCH.nea2, from, to).filter((o) => o.spend > 0 || o.pur > 0)
  const liveSpend = agg.ads.reduce((a, x) => a + (x.spend || 0), 0)
  const livePurch = agg.ads.reduce((a, x) => a + (x.purchases || 0), 0)
  const liveRev = agg.ads.reduce((a, x) => a + (x.revenue || 0), 0)
  const liveDays = days.length
  const dec = (v: number, n: number): string => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: n, maximumFractionDigits: n })
  const rMoney = (v: number): string => 'R$ ' + dec(v, 2)
  const kpis = [
    { label: 'Investimento com imposto', value: rMoney(liveSpend * 1.1215) },
    { label: 'Ingressos', value: fmtNum(livePurch) },
    { label: 'Faturamento bruto aprox.', value: rMoney(liveRev) },
    { label: 'Orderbumps', value: fmtNum(0) },
    { label: 'Taxa de conversão orderbump', value: '0,0%' },
    { label: 'Ritmo médio', value: dec(liveDays ? livePurch / liveDays : 0, 1) + ' /dia' },
    { label: 'Ticket médio', value: rMoney(livePurch ? liveRev / livePurch : 0) },
    { label: 'Custo / compra geral', value: rMoney(livePurch ? liveSpend / livePurch : 0) },
    { label: 'Ingressos [ads]', value: fmtNum(livePurch) },
    { label: 'Ingressos [org]', value: fmtNum(0) },
  ]
  const daily: NeaDailyView[] = days
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((o) => {
      const dd = o.date.split('-')
      return {
        d: dd[2] + '/' + dd[1],
        inv: rMoney(o.spend * 1.1215),
        ing: fmtNum(o.pur),
        fat: rMoney(o.rev),
        ob: fmtNum(0),
        conv: '—',
        compras: fmtNum(o.pur),
        tk: o.pur ? rMoney(o.rev / o.pur) : '—',
        cst: o.pur ? rMoney(o.spend / o.pur) : '—',
        ads: fmtNum(o.pur),
        org: fmtNum(0),
      }
    })
  return { kpis, daily }
}

const NO_NEA = { neaVendasShow: false, neaVendasNote: '', neaKpis: [], neaDaily: [] as NeaDailyView[] }

// janela de data efetiva (mês selecionado OU intervalo) — usada nos anúncios
function effWindow(S: DashState): { from: string; to: string } {
  let from = S.candFrom || ''
  let to = S.candTo || ''
  if (S.candMonth !== 'all') {
    from = S.candMonth + '-01'
    to = lastDayOf(S.candMonth)
  }
  return { from, to }
}

// meses disponíveis no funil só de anúncios, derivados do período do conector
function adsMonths(minD: string | null, maxD: string | null): MonthDef[] {
  const out: MonthDef[] = []
  if (minD && maxD) {
    let ym = minD.slice(0, 7)
    const end = maxD.slice(0, 7)
    let g = 0
    while (ym <= end && g < 48) {
      out.push({ value: ym, label: MONTH_NAMES[+ym.slice(5, 7) - 1] + ' ' + ym.slice(0, 4) })
      const y = +ym.slice(0, 4)
      const m = +ym.slice(5, 7)
      const nd = new Date(Date.UTC(y, m, 1))
      ym = nd.getUTCFullYear() + '-' + String(nd.getUTCMonth() + 1).padStart(2, '0')
      g++
    }
  }
  return out
}

export function funisVM(S: DashState): FunisVM {
  const key = S.funnel
  const spec = funnelSpec(key)!
  const F = S.funnelData[key]
  const loading = !!S.funnelLoading[key]
  const err = S.funnelError[key] || ''
  const fmtMil = (v: number | null): string =>
    v == null
      ? '—'
      : v >= 1000
        ? 'R$ ' + (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mil'
        : 'R$ ' + fmtNum(v)

  const funnelTabs: FunnelTab[] = FUNNELS.map((f) => ({
    key: f.key,
    label: f.name,
    active: f.key === key,
    inactive: f.key !== key,
  }))

  const adsState: AdsState = {
    adsRaw: S.adsRaw,
    adsError: S.adsError,
    adsLoading: S.adsLoading,
    gtThumbs: S.gtThumbs,
    gtLinks: S.gtLinks,
  }
  const { from: winFrom, to: winTo } = effWindow(S)

  // ---- funil só de anúncios (ex.: Seguidores, Golden Ticket) — sem planilha de leads ----
  if (spec.adsOnly) {
    const candFilters: CandFilters = {
      month: S.candMonth,
      from: S.candFrom,
      to: S.candTo,
      monthOptions: [{ value: 'all', label: 'Todos os meses' }, ...adsMonths(S.adsMinD, S.adsMaxD)],
      min: S.adsMinD || '',
      max: S.adsMaxD || '',
      hasFilter: S.candMonth !== 'all' || !!S.candFrom || !!S.candTo,
    }
    // Golden Ticket — seletor de imersão (IEB/AMB/NEA) no lugar do status; snapshot estático
    if (spec.golden) {
      const IM = [
        { key: 'ieb', label: 'IEB' },
        { key: 'amb', label: 'AMB' },
        { key: 'nea', label: 'NEA' },
      ]
      const imBtns: StatusBtn[] = IM.map((b) => ({
        key: b.key,
        label: b.label,
        active: S.imersao === b.key,
        inactive: S.imersao !== b.key,
      }))
      return {
        funnelTabs,
        candFilters,
        candStatusBtns: spec.noImersao ? [] : imBtns,
        candReady: true,
        candLoadingView: false,
        candStatusLabel: '',
        candKpis: [],
        candCharts: [],
        cfgs: {},
        invest: investFunnel(key, 0, adsState, '', '', S.imersao),
        leadsView: false,
        showStatusBtns: !spec.noImersao,
        statusGroupLabel: 'Imersão',
        statusMode: 'imersao',
        ...NO_NEA,
      }
    }
    // NEA 2ª Edição — 100% dados reais das campanhas "NEA 2.0" (seção de vendas)
    const nea = spec.nea2 ? neaLiveVM(S, winFrom, winTo) : null
    return {
      funnelTabs,
      candFilters,
      candStatusBtns: [],
      candReady: true,
      candLoadingView: false,
      candStatusLabel: '',
      candKpis: [],
      candCharts: [],
      cfgs: {},
      invest: investFunnel(key, 0, adsState, winFrom, winTo),
      leadsView: false,
      showStatusBtns: false,
      statusGroupLabel: 'Status',
      statusMode: 'status',
      neaVendasShow: !!nea,
      neaVendasNote: '',
      neaKpis: nea?.kpis || [],
      neaDaily: nea?.daily || [],
    }
  }

  const monthOpts: MonthDef[] = [{ value: 'all', label: 'Todos os meses' }, ...(F ? F.months : [])]
  const candFilters: CandFilters = {
    month: S.candMonth,
    from: S.candFrom,
    to: S.candTo,
    monthOptions: monthOpts,
    min: F && F.minD ? F.minD : '',
    max: F && F.maxD ? F.maxD : '',
    hasFilter: S.candMonth !== 'all' || !!S.candFrom || !!S.candTo,
  }

  if (!F) {
    return {
      funnelTabs,
      candFilters,
      candStatusBtns: [],
      candReady: false,
      candLoadingView: true,
      candStatusLabel: err
        ? ('erro ao ler a aba: ' + err).slice(0, 90)
        : loading
          ? 'lendo a planilha…'
          : 'aba não carregada',
      candKpis: [],
      candCharts: [],
      cfgs: {},
      invest: investFunnel(key, 0, adsState, winFrom, winTo),
      leadsView: true,
      showStatusBtns: true,
      statusGroupLabel: 'Status',
      statusMode: 'status',
      ...NO_NEA,
    }
  }

  // botões de status do formulário (canto superior direito)
  const sf = S.candStatusFilter
  const candStatusBtns: StatusBtn[] = [
    { key: 'completas', label: 'Completas' },
    { key: 'incompletas', label: 'Incompletas' },
  ].map((b) => ({ key: b.key, label: b.label, active: sf === b.key, inactive: sf !== b.key }))

  // aplica filtro de mês / intervalo de datas + status sobre as linhas brutas
  const rows = F.rows.filter((r) => {
    if (sf !== 'all') {
      const lbl = spec.statusMap[(r[spec.statusCol] || '').trim()]
      if (sf === 'completas' && lbl !== 'Completas') return false
      if (sf === 'incompletas' && lbl !== 'Incompletas') return false
    }
    const d = parseRowDate(r[spec.dateCol])
    if (!d) return S.candMonth === 'all' && !S.candFrom && !S.candTo
    if (S.candMonth !== 'all' && d.slice(0, 7) !== S.candMonth) return false
    if (S.candFrom && d < S.candFrom) return false
    if (S.candTo && d > S.candTo) return false
    return true
  })
  const C = buildFunnel(spec, rows)

  const cfgs: Record<string, ChartConfiguration> = {
    'cand-volume': lineCfg(
      C.volume.map((v) => v.label),
      [{ label: 'leads', data: C.volume.map((v) => v.count), color: '#771520', fill: true, fillColor: 'rgba(119,21,32,0.08)' }],
      { zero: true }
    ),
  }
  const candCharts: CandChart[] = C.charts.map((ch, i) => {
    const id = 'cand-c' + i
    cfgs[id] = ch.donut ? doughnutCfg(ch.items) : barCfg(ch.items, { horizontal: ch.horizontal })
    return { id, legendId: id + '-lg', title: ch.title, eyebrow: ch.eyebrow || '', donut: !!ch.donut, bar: !ch.donut }
  })

  const candKpis: CandKpi[] = [
    { label: 'Total de leads', value: fmtNum(C.total) },
    { label: 'Completas', value: fmtPct(C.completedPct) },
  ]
  if (C.scoreAvg != null)
    candKpis.push({ label: 'Pontuação média', value: C.scoreAvg.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) })
  if (C.revMedian != null) candKpis.push({ label: 'Faturamento mediano', value: fmtMil(C.revMedian) })

  const invest = investFunnel(key, C.total, adsState, winFrom, winTo)

  return {
    funnelTabs,
    candFilters,
    candStatusBtns,
    candReady: true,
    candLoadingView: false,
    candStatusLabel: loading ? 'atualizando…' : C.name + ' · ' + fmtNum(C.total) + ' leads',
    candKpis,
    candCharts,
    cfgs,
    invest,
    leadsView: true,
    showStatusBtns: true,
    statusGroupLabel: 'Status',
    statusMode: 'status',
    ...NO_NEA,
  }
}
