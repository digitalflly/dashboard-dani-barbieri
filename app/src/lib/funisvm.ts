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
import { MONTH_NAMES, lastDayOf, addDays } from './dates'
import { GOLDEN_TRAFEGO } from './goldenTrafegoData'
import { GOLDEN_VENDAS } from './goldenVendasData'
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
  // NEA 2ª Edição / Golden — seção de vendas
  neaVendasShow: boolean
  neaVendasNote: string
  neaKpis: { label: string; value: string }[]
  neaDaily: NeaDailyView[]
  // faixas de faturamento (funil Aplicação Direta)
  aplicBands: AplicBand[]
  aplicBandShow: boolean
}

export interface AplicBand {
  label: string
  count: string
  pct: number
  width: string
  color: string
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

// gráfico "Ingressos por dia" (barra) + custo/compra (linha) — Golden Ticket
function goldenIngressosChart(
  chartSrc: { iso: string; ing: number }[],
  spendByIso: Record<string, number>
): ChartConfiguration | null {
  if (!chartSrc.length) return null
  const byIso: Record<string, number> = {}
  chartSrc.forEach((r) => (byIso[r.iso] = r.ing))
  const labels: string[] = []
  const data: number[] = []
  const cpa: (number | null)[] = []
  let cur = chartSrc[0].iso
  const hi = chartSrc[chartSrc.length - 1].iso
  let g = 0
  while (cur <= hi && g < 800) {
    const p = cur.split('-')
    labels.push(p[2] + '/' + p[1])
    const ingD = byIso[cur] || 0
    data.push(ingD)
    const sp = spendByIso[cur] || 0
    cpa.push(ingD && sp ? +(sp / ingD).toFixed(2) : null)
    cur = addDays(cur, 1)
    g++
  }
  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { type: 'bar', label: 'ingressos', data, backgroundColor: '#771520', borderRadius: 4, borderSkipped: false, maxBarThickness: 38, yAxisID: 'y', order: 2 },
        { type: 'line', label: 'custo/compra', data: cpa, borderColor: '#C2A05B', backgroundColor: '#C2A05B', borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#C2A05B', tension: 0.3, spanGaps: true, yAxisID: 'y1', order: 1 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top', align: 'end', labels: { boxWidth: 12, boxHeight: 12, font: { family: 'Arimo', size: 11 }, color: '#6E595D', usePointStyle: true } },
        tooltip: {
          backgroundColor: '#271217', titleColor: '#F6EFE8', bodyColor: '#EAD9C9', borderColor: '#4A3338', borderWidth: 1, padding: 10, cornerRadius: 8,
          titleFont: { family: 'Arimo', weight: 600 }, bodyFont: { family: 'Arimo' },
          callbacks: {
            label: (c: { dataset: { label?: string }; parsed: { y: number | null } }) =>
              c.dataset.label === 'custo/compra'
                ? 'Custo/compra: R$ ' + (c.parsed.y == null ? '—' : c.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
                : fmtNum(c.parsed.y || 0) + ' ingressos',
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: 'Arimo', size: 10 }, color: '#6E595D', autoSkip: false } },
        y: { beginAtZero: true, position: 'left', grid: { color: 'rgba(119,21,32,0.07)' }, ticks: { font: { family: 'Arimo', size: 10.5 }, color: '#6E595D', precision: 0, callback: (v: number | string) => fmtNum(+v) } },
        y1: { beginAtZero: true, position: 'right', grid: { display: false }, ticks: { font: { family: 'Arimo', size: 10.5 }, color: '#9A7637', callback: (v: number | string) => 'R$ ' + fmtNum(+v) } },
      },
    },
  } as unknown as ChartConfiguration
}

// faixas de faturamento declaradas na planilha de leads (funil Aplicação Direta)
function aplicBandsVM(S: DashState, winFrom: string, winTo: string): { aplicBands: AplicBand[]; aplicBandShow: boolean } {
  const rowsF = (S.aplicLeadsRows || []).filter((r) => (!winFrom || r.date >= winFrom) && (!winTo || r.date <= winTo))
  const norm = (v: string): string => String(v || '').toLowerCase().replace(/^ac[oó]ma/, 'acima')
  const order = ['abaixo_de_15_mil', '15_a_50_mil', '50_a_100_mil', '100_a_200_mil', '200_a_500_mil', 'acima_de_500_mil']
  const LABELS: Record<string, string> = {
    abaixo_de_15_mil: 'Abaixo de R$ 15 mil',
    '15_a_50_mil': 'R$ 15 a 50 mil',
    '50_a_100_mil': 'R$ 50 a 100 mil',
    '100_a_200_mil': 'R$ 100 a 200 mil',
    '200_a_500_mil': 'R$ 200 a 500 mil',
    acima_de_500_mil: 'Acima de R$ 500 mil',
  }
  const label = (k: string): string => LABELS[k] || (k ? k.replace(/_/g, ' ') : '(não informado)')
  const tally: Record<string, number> = {}
  rowsF.forEach((r) => { const k = norm(r.faixa) || ''; tally[k] = (tally[k] || 0) + 1 })
  const keys = Object.keys(tally).sort((a, b) => {
    const ia = order.indexOf(a)
    const ib = order.indexOf(b)
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
  })
  const totalF = keys.reduce((a, k) => a + tally[k], 0)
  const ramp = ['#4A0C13', '#5F111A', '#771520', '#9A2230', '#B7404E', '#CE6B77', '#E0A0A8']
  const sq = keys.map((k) => Math.sqrt(tally[k]))
  const sqT = sq.reduce((a, v) => a + v, 0) || 1
  const aplicBands: AplicBand[] = keys.map((k, i) => ({
    label: label(k),
    count: fmtNum(tally[k]),
    pct: totalF ? (tally[k] / totalF) * 100 : 0,
    width: (sq[i] / sqT) * 100 + '%',
    color: ramp[Math.min(i, ramp.length - 1)],
  }))
  return { aplicBands, aplicBandShow: totalF > 0 }
}

const NO_NEA = {
  neaVendasShow: false,
  neaVendasNote: '',
  neaKpis: [] as { label: string; value: string }[],
  neaDaily: [] as NeaDailyView[],
  aplicBands: [] as AplicBand[],
  aplicBandShow: false,
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

  const funnelTabs: FunnelTab[] = FUNNELS.filter((f) => !f.hidden).map((f) => ({
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
    aplicLeadsBy: S.aplicLeadsBy,
    aplicLeadsRows: S.aplicLeadsRows,
    iscaLeadsBy: S.iscaLeadsBy,
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
    // Golden Ticket — seletor de produto (IEB/AMB/NEA/NEA2.0); vendas + tráfego CONGELADOS por imersão
    if (spec.golden) {
      const IM = [
        { key: 'ieb', label: 'IEB' },
        { key: 'amb', label: 'AMB' },
        { key: 'nea', label: 'NEA' },
        { key: 'nea2', label: 'NEA 2.0' },
      ]
      const imBtns: StatusBtn[] = IM.map((b) => ({
        key: b.key,
        label: b.label,
        active: S.imersao === b.key,
        inactive: S.imersao !== b.key,
      }))
      const invG = investFunnel(key, 0, adsState, winFrom, winTo, S.imersao)
      const dec = (v: number, n: number): string => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: n, maximumFractionDigits: n })
      const rMoney = (v: number): string => 'R$ ' + dec(v, 2)
      const GV = GOLDEN_VENDAS[S.imersao] || null
      const spend = invG.investSpend || 0
      // gasto de tráfego por dia (snapshot congelado)
      const spendByIso: Record<string, number> = {}
      const gt = GOLDEN_TRAFEGO[S.imersao]
      if (gt && gt.daily) gt.daily.forEach(([d, s]) => { spendByIso[d] = (spendByIso[d] || 0) + (s || 0) })
      const adDays = Object.keys(spendByIso).filter((d) => spendByIso[d] > 0).sort()
      const lastAdIso = adDays.length ? adDays[adDays.length - 1] : null
      // vendas: período todo por padrão; recorta só quando há filtro aplicado
      const noFilter = S.candMonth === 'all' && !S.candFrom && !S.candTo
      const porDia = GV
        ? noFilter
          ? GV.porDia || []
          : (GV.porDia || []).filter((r) => (!winFrom || r.iso >= winFrom) && (!winTo || r.iso <= winTo))
        : []
      const porDiaCap = lastAdIso ? porDia.filter((r) => r.iso <= lastAdIso) : porDia
      const sum = (f: keyof (typeof porDia)[number]): number => porDia.reduce((a, r) => a + ((r[f] as number) || 0), 0)
      const ing = sum('ing'), fat = sum('fat'), ob = sum('ob'), compras = sum('compras'), adsV = sum('ads'), orgV = sum('org')
      const days = porDia.length || 1
      const obBuyersPct = GV ? GV.taxaConvOrderbump : 0
      const neaKpis = GV
        ? [
            { label: 'Investimento com imposto', value: rMoney(spend * 1.1215) },
            { label: 'Ingressos', value: fmtNum(ing) },
            { label: 'Faturamento bruto aprox.', value: rMoney(fat) },
            { label: 'Orderbumps', value: fmtNum(ob) },
            { label: 'Taxa de conversão orderbump', value: dec(obBuyersPct, 1) + '%' },
            { label: 'Ritmo médio', value: dec(compras / days, 1) + ' /dia' },
            { label: 'Ticket médio', value: rMoney(compras ? fat / compras : 0) },
            { label: 'Custo / compra geral', value: rMoney(compras ? spend / compras : 0) },
            { label: 'Ingressos [ads]', value: fmtNum(adsV) },
            { label: 'Ingressos [org]', value: fmtNum(orgV) },
          ]
        : []
      const neaDaily: NeaDailyView[] = GV
        ? porDia
            .slice()
            .sort((a, b) => b.iso.localeCompare(a.iso))
            .map((r) => {
              const spD = spendByIso[r.iso] || 0
              return {
                d: r.d,
                inv: spD ? rMoney(spD * 1.1215) : '—',
                ing: fmtNum(r.ing),
                fat: rMoney(r.fat),
                ob: fmtNum(r.ob),
                conv: r.compras ? dec((r.ob / r.compras) * 100, 1) + '%' : '—',
                compras: fmtNum(r.compras),
                tk: r.compras ? rMoney(r.fat / r.compras) : '—',
                cst: r.compras && spD ? rMoney(spD / r.compras) : '—',
                ads: fmtNum(r.ads),
                org: fmtNum(r.org),
              }
            })
        : []
      // gráfico Ingressos por dia (barras) + custo/compra do dia (linha)
      const chartSrc = GV ? porDiaCap.slice().sort((a, b) => a.iso.localeCompare(b.iso)) : []
      const goldenChart = chartSrc.length ? goldenIngressosChart(chartSrc, spendByIso) : null

      return {
        funnelTabs,
        candFilters,
        candStatusBtns: imBtns,
        candReady: true,
        candLoadingView: false,
        candStatusLabel: '',
        candKpis: [],
        candCharts: [],
        cfgs: {},
        invest: { ...invG, investChart: goldenChart, investChartShow: !!goldenChart, investChartTitle: 'Ingressos por dia' },
        leadsView: false,
        showStatusBtns: true,
        statusGroupLabel: 'Produto',
        statusMode: 'imersao',
        neaVendasShow: neaKpis.length > 0,
        neaVendasNote: '',
        neaKpis,
        neaDaily,
        aplicBands: [],
        aplicBandShow: false,
      }
    }
    // NEA 2ª Edição — 100% dados reais das campanhas "NEA 2.0" (seção de vendas)
    const nea = spec.nea2 ? neaLiveVM(S, winFrom, winTo) : null
    // faixas de faturamento (planilha de leads da Aplicação) — banda degradê
    const { aplicBands, aplicBandShow } = key === 'aplicacao' ? aplicBandsVM(S, winFrom, winTo) : { aplicBands: [], aplicBandShow: false }
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
      aplicBands,
      aplicBandShow,
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
