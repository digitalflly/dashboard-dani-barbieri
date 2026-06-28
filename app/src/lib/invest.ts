// ============================================================
// investFunnel() — paid-media (Facebook Ads) section: KPIs,
// conversion funnel stages, per-ad and per-adset tables. Falls
// back to estimates while ads load / when none exist.
// Ported from investFunnel() in Dashboard.dc.html.
// ============================================================

import type { CSSProperties } from 'react'
import { fmtNum, fmtPct } from './format'
import type { AdRow, AdsetRow } from './types'

export interface AdsState {
  ads: Record<string, AdRow[]> | null
  adsets: Record<string, AdsetRow[]> | null
  adsError: string
  adsLoading: boolean
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
export interface InvestVM {
  investShow: boolean
  investStages: InvestStage[]
  investStats: InvestStat[]
  investAds: InvestAdRow[]
  investAdsets: InvestAdsetRow[]
  investEyebrow: string
  adsStatus: string
}

const money2 = (v: number): string =>
  'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function investFunnel(key: string, total: number, st: AdsState): InvestVM {
  if (key !== 'premium' && key !== 'diagnostico') {
    return {
      investShow: false,
      investStages: [],
      investStats: [],
      investAds: [],
      investAdsets: [],
      investEyebrow: '',
      adsStatus: '',
    }
  }
  const T = Math.max(total, 1)
  const ads = st.ads && st.ads[key]
  const fbPrefix = key === 'diagnostico' ? 'Diagnóstico' : 'Sessão Premium'
  const investEyebrow = key === 'diagnostico' ? 'funil diagnóstico' : 'funil sessão premium'
  const hasReal = !!ads && ads.length > 0

  let alcance: number, impressoes: number, cliques: number, lpViews: number, leadsGer: number, investido: number
  if (hasReal) {
    const sum = (f: keyof AdRow): number => ads!.reduce((a, x) => a + ((x[f] as number) || 0), 0)
    alcance = sum('reach')
    impressoes = sum('impressions')
    cliques = sum('linkClicks')
    lpViews = sum('lpViews')
    leadsGer = sum('leads')
    investido = sum('spend')
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
  const connectRate = cliques ? (lpViews / cliques) * 100 : 0
  const div = (a: number, b: number): number | null => (b ? a / b : null)

  const raw = [
    { label: 'Alcance', value: alcance, conv: null as number | null, cost: null as string | null, freq: null as number | null },
    { label: 'Impressões', value: impressoes, conv: div(impressoes, alcance), freq: div(impressoes, alcance), cost: null as string | null },
    { label: 'Cliques no link', value: cliques, conv: div(cliques, impressoes), cost: money2(cpc), freq: null as number | null },
    { label: 'Visualizações da página', value: lpViews, conv: div(lpViews, cliques), cost: null as string | null, freq: null as number | null },
    { label: 'Leads do gerenciador', value: leadsGer, conv: div(leadsGer, lpViews), cost: money2(custoGer), freq: null as number | null },
    { label: 'Leads da planilha', value: leadsPlan, conv: div(leadsPlan, leadsGer), cost: money2(custoPlan), freq: null as number | null },
  ]
  const widths = [100, 93, 84, 73, 62, 52]
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
    { label: 'Custo / lead planilha', value: money2(custoPlan) },
  ]

  let investAds: InvestAdRow[]
  if (hasReal) {
    investAds = ads!.slice(0, 12).map((a, i) => ({
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
      impr: fmtNum(a.impressions),
      clk: fmtNum(a.linkClicks),
      lpv: fmtNum(a.lpViews),
      cr: fmtPct(a.linkClicks ? (a.lpViews / a.linkClicks) * 100 : 0),
      leads: fmtNum(a.leads),
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
        impr: fmtNum(impr),
        clk: fmtNum(clk),
        lpv: fmtNum(lpv),
        cr: fmtPct(clk ? (lpv / clk) * 100 : 0),
        leads: fmtNum(leads),
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

  const adsets = st.adsets && st.adsets[key]
  const hasRealSet = !!adsets && adsets.length > 0
  let investAdsets: InvestAdsetRow[]
  if (hasRealSet) {
    investAdsets = adsets!.slice(0, 30).map((a, i) => ({
      idx: i,
      name: a.name,
      impr: fmtNum(a.impressions),
      clk: fmtNum(a.linkClicks),
      lpv: fmtNum(a.lpViews),
      cr: fmtPct(a.linkClicks ? (a.lpViews / a.linkClicks) * 100 : 0),
      leads: fmtNum(a.leads),
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
        leads: fmtNum(leads),
      }
    })
  }

  return { investShow: true, investStages, investStats, investAds, investAdsets, investEyebrow, adsStatus }
}
