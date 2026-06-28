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

  const adsState: AdsState = { ads: S.ads, adsets: S.adsets, adsError: S.adsError, adsLoading: S.adsLoading }

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
      invest: investFunnel(key, 0, adsState),
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

  const invest = investFunnel(key, C.total, adsState)

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
  }
}
