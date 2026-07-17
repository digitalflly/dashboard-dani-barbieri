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
import { FUNNELS } from './constants'
import { NEA_VENDAS } from './neaVendasData'
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

// KPIs + indicadores por dia da NEA 2ª Edição (a partir do snapshot manual)
function neaVendasVM(): { kpis: { label: string; value: string }[]; daily: NeaDailyView[]; note: string } {
  const NV = NEA_VENDAS
  const dec = (v: number, n: number): string => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: n, maximumFractionDigits: n })
  const rMoney = (v: number): string => 'R$ ' + dec(v, 2)
  const kpis = [
    { label: 'Investimento com imposto', value: rMoney(NV.investimentoComImposto) },
    { label: 'Ingressos', value: fmtNum(NV.ingressos) },
    { label: 'Faturamento bruto aprox.', value: rMoney(NV.faturamentoBruto) },
    { label: 'Orderbumps', value: fmtNum(NV.orderbumps) },
    { label: 'Taxa de conversão orderbump', value: dec(NV.taxaConvOrderbump, 1) + '%' },
    { label: 'Ritmo médio', value: dec(NV.ritmoMedio, 1) + ' /dia' },
    { label: 'Ticket médio', value: rMoney(NV.ticketMedio) },
    { label: 'Custo / compra geral', value: rMoney(NV.custoCompraGeral) },
    { label: 'Ingressos [ads]', value: fmtNum(NV.ingressosAds) },
    { label: 'Ingressos [org]', value: fmtNum(NV.ingressosOrg) },
  ]
  const daily: NeaDailyView[] = NV.porDia.map((r) => ({
    d: r.d,
    inv: rMoney(r.inv),
    ing: fmtNum(r.ing),
    fat: rMoney(r.fat),
    ob: fmtNum(r.ob),
    conv: r.conv ? dec(r.conv, 1) + '%' : '—',
    compras: fmtNum(r.compras),
    tk: r.tk == null ? '—' : rMoney(r.tk),
    cst: r.cst == null ? '—' : rMoney(r.cst),
    ads: fmtNum(r.ads),
    org: fmtNum(r.org),
  }))
  const note = 'planilha vendas-nea · ' + NV.periodo + ' · atualizado ' + NV.atualizadoEm
  return { kpis, daily, note }
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
      const nea = key === 'nea2' ? neaVendasVM() : null
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
        neaVendasShow: !!nea,
        neaVendasNote: nea?.note || '',
        neaKpis: nea?.kpis || [],
        neaDaily: nea?.daily || [],
      }
    }
    return {
      funnelTabs,
      candFilters,
      candStatusBtns: [],
      candReady: true,
      candLoadingView: false,
      candStatusLabel: '',
      ...NO_NEA,
      candKpis: [],
      candCharts: [],
      cfgs: {},
      invest: investFunnel(key, 0, adsState, winFrom, winTo),
      leadsView: false,
      showStatusBtns: false,
      statusGroupLabel: 'Status',
      statusMode: 'status',
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
