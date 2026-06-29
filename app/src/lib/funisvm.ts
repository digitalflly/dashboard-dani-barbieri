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
}

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

  const adsState: AdsState = { adsRaw: S.adsRaw, adsError: S.adsError, adsLoading: S.adsLoading }
  const { from: winFrom, to: winTo } = effWindow(S)

  // ---- funil só de anúncios (ex.: Seguidores) — sem planilha de leads ----
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
  }
}
