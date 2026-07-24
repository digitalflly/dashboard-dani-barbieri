// ============================================================
// investFunnel() — paid-media (Facebook Ads) section: KPIs,
// conversion funnel stages, per-ad and per-adset tables. Aggregates
// the raw daily rows by campaign + date range; falls back to
// estimates while ads load / when none exist.
//
// The "seguidores" funnel is ads-only: it swaps the conversion card
// for a "Turbinamento" panel and relabels results as profile visits.
// Ported from investFunnel() in Dashboard.dc.html.
// ============================================================

import type { CSSProperties } from 'react'
import type { ChartConfiguration } from 'chart.js'
import { fmtNum, fmtPct } from './format'
import { adsAgg, turbinaAgg, dailyAgg } from './facebook'
import { goldenAgg } from './golden'
import { ADS_CAMPAIGN_MATCH, FUNNELS } from './constants'
import type { AdRow, AdDailyRow } from './types'

export interface AdsState {
  adsRaw: AdDailyRow[] | null
  adsError: string
  adsLoading: boolean
  // capas do Golden Ticket por imersão (nome do anúncio -> dataURL)
  gtThumbs?: Record<string, Record<string, string>>
  // links do Golden Ticket por imersão (nome do anúncio -> instagram_permalink_url)
  gtLinks?: Record<string, Record<string, string>>
}

export interface InvestStage {
  label: string
  value: string
  left: string
  barStyle: CSSProperties
}
export interface InvestStat {
  label: string
  value: string
}
export interface InvestAdRow {
  idx: number
  name: string
  thumbStyle: CSSProperties
  permalink: string
  impr: string
  clk: string
  lpv: string
  cr: string
  leads: string
}
export interface InvestAdsetRow {
  idx: number
  name: string
  impr: string
  clk: string
  lpv: string
  cr: string
  leads: string
}
export interface TurbinaItem {
  idx: number
  name: string
  visitas: string
  spend: string
  permalink: string
}
export interface TurbinaSummary {
  label: string
  value: string
}
export interface InvestDailyRow {
  d: string
  gasto: string
  compras: string
  cpa: string
  ctr: string
  cpm: string
  conv: string
  carreg: string
}
export interface InvestVM {
  investShow: boolean
  isSeg: boolean
  isGolden: boolean
  noPlan: boolean
  investDaily: InvestDailyRow[]
  investDailyShow: boolean
  investChart: ChartConfiguration | null
  investStages: InvestStage[]
  investStats: InvestStat[]
  investAds: InvestAdRow[]
  investAdsets: InvestAdsetRow[]
  investEyebrow: string
  adsStatus: string
  // funil seguidores
  convShow: boolean
  turbinaShow: boolean
  turbina: TurbinaItem[]
  turbinaSummary: TurbinaSummary[]
  showLpCr: boolean
  adsResultLabel: string
  adsetResultLabel: string
}

const EMPTY_INVEST: InvestVM = {
  investShow: false,
  isSeg: false,
  isGolden: false,
  noPlan: false,
  investDaily: [],
  investDailyShow: false,
  investChart: null,
  investStages: [],
  investStats: [],
  investAds: [],
  investAdsets: [],
  investEyebrow: '',
  adsStatus: '',
  convShow: true,
  turbinaShow: false,
  turbina: [],
  turbinaSummary: [],
  showLpCr: true,
  adsResultLabel: 'Leads do gerenciador',
  adsetResultLabel: 'Leads',
}

const money2 = (v: number): string =>
  'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function investFunnel(
  key: string,
  total: number,
  st: AdsState,
  from = '',
  to = '',
  imersao = ''
): InvestVM {
  const spec = FUNNELS.find((f) => f.key === key)
  const isGolden = !!spec?.golden
  const isNea2 = key === 'nea2'
  const usePurchase = isGolden || isNea2 // funil de compras (checkout → compras)
  const imersaoKey = spec?.imersaoFixed || imersao
  if (key !== 'premium' && key !== 'diagnostico' && key !== 'seguidores' && !isGolden && !isNea2) {
    return EMPTY_INVEST
  }
  const isSeg = key === 'seguidores'
  const noPlan = isSeg || isGolden || isNea2
  const IMLABEL: Record<string, string> = { ieb: 'IEB', amb: 'AMB', nea: 'NEA' }

  // Turbinamento (só no funil Seguidores) — substitui o card "Dados de conversão"
  let convShow = true
  let turbinaShow = false
  let turbina: TurbinaItem[] = []
  let turbinaSummary: TurbinaSummary[] = []
  if (isSeg) {
    convShow = false
    turbinaShow = true
    const tb = turbinaAgg(st.adsRaw, ADS_CAMPAIGN_MATCH.turbinamento, from, to)
    const tspend = tb.reduce((a, x) => a + (x.spend || 0), 0)
    const tvis = tb.reduce((a, x) => a + (x.linkClicks || 0), 0)
    turbinaSummary = [
      { label: 'Publicações', value: fmtNum(tb.length) },
      { label: 'Investimento', value: 'R$ ' + fmtNum(tspend) },
      { label: 'Visitas ao perfil', value: fmtNum(tvis) },
    ]
    turbina = tb.map((x, i) => ({
      idx: i,
      name:
        String(x.name || '')
          .replace(/^Post do Instagram:\s*/i, '')
          .replace(/^Publica[çc][ãa]o do Instagram:\s*/i, '')
          .slice(0, 70) || '(sem título)',
      visitas: fmtNum(x.linkClicks),
      spend: 'R$ ' + fmtNum(x.spend),
      permalink: x.permalink || '',
    }))
  }

  const T = Math.max(total, 1)
  const agg = isGolden
    ? goldenAgg(imersaoKey, st.gtThumbs?.[imersaoKey] || {}, st.gtLinks?.[imersaoKey] || {})
    : adsAgg(st.adsRaw, ADS_CAMPAIGN_MATCH[key] || /^\b$/, from, to)
  const ads = agg.ads
  const fbPrefix = key === 'diagnostico' ? 'Diagnóstico' : isSeg ? 'Seguidores' : isNea2 ? 'NEA 2.0' : isGolden ? 'Golden Ticket' : 'Sessão Premium'
  const investEyebrow =
    key === 'diagnostico'
      ? 'funil diagnóstico'
      : isSeg
        ? 'funil seguidores'
        : isNea2
          ? 'nea 2ª edição'
          : isGolden
            ? 'golden ticket · imersão ' + (IMLABEL[imersaoKey] || '')
            : 'funil sessão premium'
  const hasReal = ads.length > 0

  let alcance: number, impressoes: number, cliques: number, lpViews: number, leadsGer: number, investido: number
  let checkout = 0
  let compras = 0
  if (hasReal) {
    const sum = (f: keyof AdRow): number => ads.reduce((a, x) => a + ((x[f] as number) || 0), 0)
    alcance = sum('reach')
    impressoes = sum('impressions')
    cliques = sum('linkClicks')
    lpViews = sum('lpViews')
    leadsGer = sum('leads')
    investido = sum('spend')
    checkout = sum('checkout')
    compras = sum('purchases')
  } else {
    // fallback estimado enquanto carrega / se não houver anúncios
    leadsGer = Math.round(T / 0.85)
    lpViews = Math.round(leadsGer / 0.16)
    cliques = Math.round(lpViews / 0.78)
    impressoes = Math.round(cliques / 0.011)
    alcance = Math.round(impressoes / 0.62)
    investido = Math.round((impressoes / 1000) * 12.5)
  }
  const leadsPlan = T
  const cpm = impressoes ? (investido / impressoes) * 1000 : 0
  const cpc = cliques ? investido / cliques : 0
  const custoGer = leadsGer ? investido / leadsGer : 0
  const custoPlan = leadsPlan ? investido / leadsPlan : 0
  const custoCompra = compras ? investido / compras : 0
  const connectRate = cliques ? (lpViews / cliques) * 100 : 0
  const div = (a: number, b: number): number | null => (b ? a / b : null)

  type Stage = { label: string; value: number; conv: number | null; cost: string | null; freq: number | null }
  let raw: Stage[]
  if (usePurchase) {
    raw = [
      { label: 'Alcance', value: alcance, conv: null, cost: null, freq: null },
      { label: 'Impressões', value: impressoes, conv: div(impressoes, alcance), freq: div(impressoes, alcance), cost: null },
      { label: 'Cliques no link', value: cliques, conv: div(cliques, impressoes), cost: money2(cpc), freq: null },
      { label: 'Visualizações da página', value: lpViews, conv: div(lpViews, cliques), cost: null, freq: null },
      { label: 'Finalização de compra', value: checkout, conv: div(checkout, lpViews), cost: money2(checkout ? investido / checkout : 0), freq: null },
      { label: 'Compras', value: compras, conv: div(compras, checkout), cost: money2(custoCompra), freq: null },
    ]
  } else {
    raw = [
      { label: 'Alcance', value: alcance, conv: null, cost: null, freq: null },
      { label: 'Impressões', value: impressoes, conv: div(impressoes, alcance), freq: div(impressoes, alcance), cost: null },
      { label: 'Cliques no link', value: cliques, conv: div(cliques, impressoes), cost: money2(cpc), freq: null },
      { label: 'Visualizações da página', value: lpViews, conv: div(lpViews, cliques), cost: null, freq: null },
      { label: 'Leads do gerenciador', value: leadsGer, conv: div(leadsGer, lpViews), cost: money2(custoGer), freq: null },
    ]
    if (!noPlan)
      raw.push({ label: 'Leads da planilha', value: leadsPlan, conv: div(leadsPlan, leadsGer), cost: money2(custoPlan), freq: null })
  }
  const widths = usePurchase ? [100, 92, 83, 74, 65, 56] : noPlan ? [100, 92, 82, 70, 58] : [100, 93, 84, 73, 62, 52]
  const investStages: InvestStage[] = raw.map((s, i) => {
    const convStr =
      s.freq != null
        ? s.freq.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : s.conv == null
          ? ''
          : fmtPct(s.conv * 100)
    const left = convStr ? (s.cost ? convStr + '  -  ' + s.cost : convStr) : ''
    return { label: s.label, value: fmtNum(s.value), left, barStyle: { width: `${widths[i]}%`, background: '#771520' } }
  })

  const investStats: InvestStat[] = [
    { label: hasReal ? 'Investimento' : 'Investimento (estim.)', value: 'R$ ' + fmtNum(investido) },
    { label: 'CPM', value: money2(cpm) },
    { label: 'Custo por clique', value: money2(cpc) },
    { label: 'Connect rate', value: fmtPct(connectRate) },
    {
      label: usePurchase ? 'Custo / compra' : noPlan ? 'Custo / lead gerenciador' : 'Custo / lead planilha',
      value: money2(usePurchase ? custoCompra : noPlan ? custoGer : custoPlan),
    },
  ]

  let investAds: InvestAdRow[]
  if (hasReal) {
    investAds = ads.slice(0, 12).map((a, i) => ({
      idx: i,
      name: a.name,
      thumbStyle: {
        width: 42,
        height: 42,
        flex: 'none',
        borderRadius: 5,
        background: a.thumb
          ? `#3D0A11 center/cover no-repeat url("${a.thumb}")`
          : 'linear-gradient(135deg, #771520, #3D0A11)',
      },
      permalink: a.permalink || '',
      impr: fmtNum(a.impressions),
      clk: fmtNum(a.linkClicks),
      lpv: fmtNum(a.lpViews),
      cr: fmtPct(a.linkClicks ? (a.lpViews / a.linkClicks) * 100 : 0),
      leads: fmtNum(usePurchase ? a.purchases || 0 : isSeg ? a.linkClicks : a.leads),
    }))
  } else {
    const adNames = [
      fbPrefix + ' · Depoimento',
      fbPrefix + ' · VSL Curta',
      fbPrefix + ' · Carrossel',
      fbPrefix + ' · Reels Bastidores',
      fbPrefix + ' · Prova Social',
    ]
    const w = [0.3, 0.24, 0.19, 0.15, 0.12]
    const adCr = [0.82, 0.76, 0.8, 0.74, 0.78]
    const thumbBg = ['#771520', '#8A1A24', '#5A0F18', '#9E2230', '#6B131D']
    investAds = adNames.map((nm, i) => {
      const impr = Math.round(impressoes * w[i])
      const clk = Math.round(cliques * w[i])
      const lpv = Math.round(clk * adCr[i])
      const leads = Math.round(leadsGer * w[i])
      return {
        idx: i,
        name: nm,
        thumbStyle: {
          width: 42,
          height: 42,
          flex: 'none',
          borderRadius: 5,
          background: `linear-gradient(135deg, ${thumbBg[i]}, #3D0A11)`,
        },
        permalink: '',
        impr: fmtNum(impr),
        clk: fmtNum(clk),
        lpv: fmtNum(lpv),
        cr: fmtPct(clk ? (lpv / clk) * 100 : 0),
        leads: fmtNum(isSeg ? clk : leads),
      }
    })
  }

  const adsStatus = st.adsError
    ? ('Facebook Ads: ' + st.adsError).slice(0, 80)
    : st.adsLoading
      ? 'carregando anúncios do Facebook…'
      : hasReal
        ? ''
        : 'dados estimados'

  const adsets = agg.adsets
  const hasRealSet = adsets.length > 0
  let investAdsets: InvestAdsetRow[]
  if (hasRealSet) {
    investAdsets = adsets.slice(0, 30).map((a, i) => ({
      idx: i,
      name: a.name,
      impr: fmtNum(a.impressions),
      clk: fmtNum(a.linkClicks),
      lpv: fmtNum(a.lpViews),
      cr: fmtPct(a.linkClicks ? (a.lpViews / a.linkClicks) * 100 : 0),
      leads: fmtNum(usePurchase ? a.purchases || 0 : isSeg ? a.linkClicks : a.leads),
    }))
  } else {
    const setNames = [
      fbPrefix + ' · Aberto',
      fbPrefix + ' · Lookalike',
      fbPrefix + ' · Interesses',
      fbPrefix + ' · Remarketing',
    ]
    const w = [0.38, 0.27, 0.21, 0.14]
    const setCr = [0.8, 0.78, 0.81, 0.83]
    investAdsets = setNames.map((nm, i) => {
      const impr = Math.round(impressoes * w[i])
      const clk = Math.round(cliques * w[i])
      const lpv = Math.round(clk * setCr[i])
      const leads = Math.round(leadsGer * w[i])
      return {
        idx: i,
        name: nm,
        impr: fmtNum(impr),
        clk: fmtNum(clk),
        lpv: fmtNum(lpv),
        cr: fmtPct(clk ? (lpv / clk) * 100 : 0),
        leads: fmtNum(isSeg ? clk : leads),
      }
    })
  }

  // ── Dados diários (por dia) — do gerenciador, por funil ──
  const dailyRe = isGolden
    ? new RegExp('\\[' + (imersaoKey || 'nea').toUpperCase() + '\\]', 'i')
    : ADS_CAMPAIGN_MATCH[key] || /^\b$/
  const fmtD = (iso: string): string => {
    const p = (iso || '').split('-')
    return p.length === 3 ? p[2] + '/' + p[1] : iso
  }
  const daySrc = dailyAgg(st.adsRaw, dailyRe, from, to).filter((o) => o.spend > 0 || o.pur > 0 || o.leads > 0 || o.clk > 0)
  // "resultado" por dia = compras (NEA 2.0 / Golden), visitas (Seguidores) ou leads
  const resultOf = (o: (typeof daySrc)[number]): number => (usePurchase ? o.pur : isSeg ? o.clk : o.leads)
  const investDaily: InvestDailyRow[] = daySrc.map((o) => {
    const res = resultOf(o)
    const cpa = res ? o.spend / res : null
    const ctr = o.imp ? (o.clk / o.imp) * 100 : null
    const cpmD = o.imp ? (o.spend / o.imp) * 1000 : null
    const conv = o.lpv ? (res / o.lpv) * 100 : null
    const carreg = o.clk ? (o.lpv / o.clk) * 100 : null
    return {
      d: fmtD(o.date),
      gasto: money2(o.spend),
      compras: fmtNum(res),
      cpa: cpa == null ? '—' : money2(cpa),
      ctr: ctr == null ? '—' : fmtPct(ctr),
      cpm: cpmD == null ? '—' : money2(cpmD),
      conv: conv == null ? '—' : fmtPct(conv),
      carreg: carreg == null ? '—' : fmtPct(carreg),
    }
  })
  const investDailyShow = isNea2 && investDaily.length > 0

  // ── gráfico "Ingressos por dia" (barra) + CPA (linha) — só na NEA 2ª Edição ──
  const chartSrc = daySrc.slice().reverse() // cronológico
  const chartData = chartSrc.map((o) => resultOf(o))
  const cpaData = chartSrc.map((o, i) => {
    const res = chartData[i]
    return res ? +(o.spend / res).toFixed(2) : null
  })
  const investChart: ChartConfiguration | null = isNea2 && chartSrc.length
    ? ({
        type: 'bar',
        data: {
          labels: chartSrc.map((o) => fmtD(o.date)),
          datasets: [
            { type: 'bar', label: 'ingressos', data: chartData, backgroundColor: '#771520', borderRadius: 4, borderSkipped: false, maxBarThickness: 38, yAxisID: 'y', order: 2 },
            { type: 'line', label: 'CPA', data: cpaData, borderColor: '#C2A05B', backgroundColor: '#C2A05B', borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#C2A05B', tension: 0.3, spanGaps: true, yAxisID: 'y1', order: 1 },
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
                  c.dataset.label === 'CPA'
                    ? 'CPA: R$ ' + (c.parsed.y == null ? '—' : c.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
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
      } as unknown as ChartConfiguration)
    : null

  return {
    investShow: true,
    isSeg,
    isGolden,
    noPlan,
    investDaily,
    investDailyShow,
    investChart,
    investStages,
    investStats,
    investAds,
    investAdsets,
    investEyebrow,
    adsStatus,
    convShow,
    turbinaShow,
    turbina,
    turbinaSummary,
    showLpCr: !isSeg,
    adsResultLabel: usePurchase ? 'Compras' : isSeg ? 'Visitas ao perfil' : 'Leads do gerenciador',
    adsetResultLabel: usePurchase ? 'Compras' : isSeg ? 'Visitas ao perfil' : 'Leads',
  }
}
