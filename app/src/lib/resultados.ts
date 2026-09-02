// ============================================================
// resultadosVM() — "Resultados Mensais" page. Monthly KPIs, per-funnel
// ROAS table (with top creatives), impulsionamentos, and a monthly
// faturamento × vendas chart. Ported from resultadosVals() in
// Dashboard.dc.html. Blends live ad rows with frozen monthly snapshots.
// ============================================================

import type { ChartConfiguration } from 'chart.js'
import { fmtNum, fmtPct } from './format'
import { ADS_CAMPAIGN_MATCH } from './constants'
import { RESULTADOS_VENDAS } from './resultadosVendasData'
import { RESULTADOS_PRODUTO } from './resultadosProdutoData'
import { RESULTADOS_TRAFEGO } from './resultadosTrafegoData'
import { GOLDEN_VENDAS } from './goldenVendasData'
import { GOLDEN_TRAFEGO } from './goldenTrafegoData'
import type { AdDailyRow } from './types'
import type { DashState } from './useDashboard'

export interface ResKpi {
  label: string
  value: string
  detail: string
}
export interface ResCreative {
  n: string
  link: string
  noLink: boolean
  res: string
  ctr: string
}
export interface ResFunilRow {
  label: string
  invest: string
  creatives: ResCreative[]
  res: string
  vendasHbp: string
  fatHbp: string
  roas: string
}
export interface ResImpRow {
  name: string
  invest: string
  reach: string
  impressions: string
  visitas: string
}
export interface ResMonth {
  ym: string
  label: string
  kpis: ResKpi[]
  funilRows: ResFunilRow[]
  funilShow: boolean
  impRows: ResImpRow[]
  impShow: boolean
  impTotal: string
}
export interface ResultadosVM {
  resMonths: ResMonth[]
  resMonthsShow: boolean
  resChartShow: boolean
  resChart: ChartConfiguration | null
}

const MN = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const MN2 = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export function resultadosVM(S: DashState): ResultadosVM {
  const RV = RESULTADOS_VENDAS.meses || {}
  const PROD = RESULTADOS_PRODUTO
  const TF = RESULTADOS_TRAFEGO
  const raw: AdDailyRow[] = S.adsRaw || []
  const money = (v: number): string => 'R$ ' + fmtNum(Math.round(v))
  const BOOST = ADS_CAMPAIGN_MATCH.turbinamento
  const curYm = new Date().toISOString().slice(0, 7)

  const TYPES: { key: string; label: string; re: RegExp; hbp?: string }[] = [
    { key: 'aplicacao', label: 'Aplicação Direta', re: ADS_CAMPAIGN_MATCH.aplicacao, hbp: 'aplicação direta' },
    { key: 'isca', label: 'Isca', re: ADS_CAMPAIGN_MATCH.isca },
    { key: 'low', label: 'Low Ticket', re: ADS_CAMPAIGN_MATCH.low },
    { key: 'seguidores', label: 'Seguidores', re: /seguidores/i },
    { key: 'premium', label: 'Sessão Premium', re: ADS_CAMPAIGN_MATCH.premium, hbp: 'sessão premium' },
    { key: 'diagnostico', label: 'Diagnóstico', re: ADS_CAMPAIGN_MATCH.diagnostico, hbp: 'diagnóstico' },
    { key: 'golden', label: 'Golden Ticket', re: /(\bamb\b|\bnea\b|\bieb\b|nea\s*2\.?0)/i, hbp: 'golden ticket' },
  ]

  // meses disponíveis (jan → último com gasto ou venda), respeitando o filtro
  const ymSet = new Set<string>()
  raw.forEach((x) => { if (x.date) ymSet.add(x.date.slice(0, 7)) })
  Object.keys(RV).forEach((k) => ymSet.add(k))
  Object.keys(PROD).forEach((k) => ymSet.add(k))
  let yms = [...ymSet].filter((y) => y >= '2026-01').sort()
  if (S.month && S.month !== 'all') yms = yms.filter((y) => y === S.month)

  const resMonths: ResMonth[] = yms
    .map((ym): ResMonth => {
      const monthRows = raw.filter((x) => x.date && x.date.slice(0, 7) === ym)
      const liveInv = monthRows.reduce((a, x) => a + (x.spend || 0), 0)
      const liveLeads = monthRows.reduce((a, x) => a + (x.leads || 0), 0)
      const invest = ym !== curYm && TF[ym] ? TF[ym].invest : liveInv
      const leads = ym !== curYm && TF[ym] ? TF[ym].leads : liveLeads
      const sv = RV[ym] || { vendas: 0, fat: 0, byFunil: {} }
      const roas = invest ? sv.fat / invest : null
      // vendas golden (imersões) no mês
      let gVend = 0
      let gFat = 0
      ;['ieb', 'amb', 'nea', 'nea2'].forEach((k) => {
        const g = GOLDEN_VENDAS[k]
        if (!g || !g.porDia) return
        g.porDia.forEach((r) => {
          if (r.iso && r.iso.slice(0, 7) === ym) {
            gVend += r.ing || 0
            gFat += r.fat || 0
          }
        })
      })
      const kpis: ResKpi[] = [
        { label: 'Investido em tráfego', value: money(invest), detail: '' },
        { label: 'Vendas Golden', value: fmtNum(gVend), detail: gFat > 0 ? money(gFat) : '' },
        { label: 'Leads gerados', value: fmtNum(leads), detail: '' },
        { label: 'Vendas HBP', value: fmtNum(sv.vendas), detail: '' },
        { label: 'Faturamento HBP', value: money(sv.fat), detail: '' },
        { label: 'ROAS', value: roas != null ? roas.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'x' : '—', detail: '' },
      ]
      // funis ativos (exclui impulsionamento, tratado à parte)
      const funilRows: ResFunilRow[] = []
      TYPES.forEach((t) => {
        const rws = monthRows.filter((x) => t.re.test(x.campaign) && !BOOST.test(x.campaign))
        const sp = rws.reduce((a, x) => a + (x.spend || 0), 0)
        if (sp <= 0) return
        const res = rws.reduce((a, x) => a + (x.leads || 0) + (x.purchases || 0), 0)
        const adAgg: Record<string, { name: string; link: string; res: number; imp: number; clk: number }> = {}
        rws.forEach((x) => {
          const a =
            adAgg[x.ad] ||
            (adAgg[x.ad] = { name: x.ad, link: x.permalink || (x.adId ? 'https://www.facebook.com/ads/library/?id=' + x.adId : ''), res: 0, imp: 0, clk: 0 })
          a.res += (x.leads || 0) + (x.purchases || 0)
          a.imp += x.impressions || 0
          a.clk += x.linkClicks || 0
          if (!a.link && x.permalink) a.link = x.permalink
        })
        const top: ResCreative[] = Object.values(adAgg)
          .filter((a) => a.res > 0)
          .sort((a, b) => b.res - a.res)
          .slice(0, 3)
          .map((a, i) => ({ n: i + 1 + '. ' + a.name, link: a.link || '', noLink: !a.link, res: fmtNum(a.res), ctr: a.imp ? fmtPct((a.clk / a.imp) * 100) : '—' }))
        const hb = t.hbp ? sv.byFunil[t.hbp] || { c: 0, rev: 0 } : { c: 0, rev: 0 }
        const froas = sp ? hb.rev / sp : null
        funilRows.push({
          label: t.label,
          invest: money(sp),
          creatives: top,
          res: fmtNum(res),
          vendasHbp: fmtNum(hb.c),
          fatHbp: money(hb.rev),
          roas: froas != null && hb.rev > 0 ? froas.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'x' : '—',
        })
      })
      // impulsionamento
      const impR = monthRows.filter((x) => BOOST.test(x.campaign))
      const impByC: Record<string, { name: string; spend: number; reach: number; impressions: number; linkClicks: number }> = {}
      impR.forEach((x) => {
        const c = impByC[x.campaign] || (impByC[x.campaign] = { name: x.campaign, spend: 0, reach: 0, impressions: 0, linkClicks: 0 })
        c.spend += x.spend || 0
        c.reach += x.reach || 0
        c.impressions += x.impressions || 0
        c.linkClicks += x.linkClicks || 0
      })
      const impRows: ResImpRow[] = Object.values(impByC)
        .sort((a, b) => b.linkClicks - a.linkClicks)
        .slice(0, 5)
        .map((c) => ({
          name: c.name.replace(/^.*?do instagram:?\s*/i, '').slice(0, 60) || c.name.slice(0, 60),
          invest: money(c.spend),
          reach: fmtNum(c.reach),
          impressions: fmtNum(c.impressions),
          visitas: fmtNum(c.linkClicks),
        }))
      const impTotal = impR.reduce((a, x) => a + (x.spend || 0), 0)
      return {
        ym,
        label: MN[+ym.slice(5, 7) - 1] + ' ' + ym.slice(0, 4),
        kpis,
        funilRows,
        funilShow: funilRows.length > 0,
        impRows,
        impShow: impRows.length > 0,
        impTotal: money(impTotal),
      }
    })
    .filter((mo) => mo.funilShow || mo.impShow || mo.kpis[3].value !== '0')

  // gráfico mensal (todos os meses): faturamento (barras), vendas HBP (linha), Golden (marcador)
  const allYms = [...ymSet].filter((y) => y >= '2026-01').sort()
  let resChart: ChartConfiguration | null = null
  if (allYms.length) {
    const invArr: number[] = []
    const fatArr: number[] = []
    const vArr: number[] = []
    const labs: string[] = []
    const gtArr: (number | null)[] = []
    // Golden = mês do ÚLTIMO dia de cada campanha (quando o golden ticket de fato aconteceu)
    const goldRe = /(\bamb\b|\bnea\b|\bieb\b|nea\s*2\.?0)/i
    const goldMonths = new Set<string>()
    Object.keys(GOLDEN_TRAFEGO).forEach((k) => {
      const days = (GOLDEN_TRAFEGO[k].daily || []).filter(([, s]) => s > 0).map(([d]) => d).sort()
      if (days.length) goldMonths.add(days[days.length - 1].slice(0, 7))
    })
    const liveGold: Record<string, string> = {}
    raw.forEach((x) => {
      if (x.date && goldRe.test(x.campaign) && (x.spend || 0) > 0) {
        const p = /nea\s*2\.?0/i.test(x.campaign) ? 'nea2' : /\bamb\b/i.test(x.campaign) ? 'amb' : /\bnea\b/i.test(x.campaign) ? 'nea' : 'ieb'
        if (!liveGold[p] || x.date > liveGold[p]) liveGold[p] = x.date
      }
    })
    Object.values(liveGold).forEach((d) => goldMonths.add(d.slice(0, 7)))
    allYms.forEach((ym) => {
      const mr = raw.filter((x) => x.date && x.date.slice(0, 7) === ym)
      const inv = ym !== curYm && TF[ym] ? TF[ym].invest : mr.reduce((a, x) => a + (x.spend || 0), 0)
      const sv = RV[ym] || { vendas: 0, fat: 0, byFunil: {} }
      const gt = goldMonths.has(ym)
      labs.push(MN2[+ym.slice(5, 7) - 1] + (gt ? ' ◆' : ''))
      invArr.push(Math.round(inv))
      fatArr.push(Math.round(sv.fat))
      vArr.push(sv.vendas)
      gtArr.push(gt ? sv.vendas : null)
    })
    resChart = {
      data: {
        labels: labs,
        datasets: [
          { type: 'bar', label: 'Faturamento HBP', data: fatArr, backgroundColor: '#771520', borderRadius: 4, borderSkipped: false, maxBarThickness: 34, categoryPercentage: 0.9, barPercentage: 0.9, yAxisID: 'y', order: 2 },
          { type: 'line', label: 'Vendas HBP', data: vArr, borderColor: '#3B0A10', backgroundColor: '#3B0A10', borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#3B0A10', tension: 0.3, yAxisID: 'y1', order: 1 },
          { type: 'scatter', label: 'Golden Ticket', data: gtArr, borderColor: '#C2A05B', backgroundColor: '#C2A05B', pointStyle: 'rectRot', pointRadius: 8, pointHoverRadius: 9, yAxisID: 'y1', order: 0 },
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
              label: (c: { dataset: { label?: string }; parsed: { y: number } }) =>
                c.dataset.label === 'Golden Ticket'
                  ? 'Golden Ticket ativo'
                  : c.dataset.label === 'Vendas HBP'
                    ? fmtNum(c.parsed.y) + ' vendas'
                    : c.dataset.label + ': R$ ' + fmtNum(c.parsed.y),
              footer: (items: { dataIndex: number }[]) => {
                const i = items && items[0] ? items[0].dataIndex : -1
                return i >= 0 ? 'Investido em tráfego: R$ ' + fmtNum(invArr[i] || 0) : ''
              },
            },
            footerFont: { family: 'Arimo', weight: 400 },
            footerColor: '#C2A05B',
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: 'Arimo', size: 11 }, color: '#6E595D' } },
          y: { beginAtZero: true, position: 'left', grid: { color: 'rgba(119,21,32,0.07)' }, ticks: { font: { family: 'Arimo', size: 10 }, color: '#6E595D', callback: (v: number | string) => 'R$ ' + fmtNum(+v) } },
          y1: { beginAtZero: true, position: 'right', grid: { display: false }, ticks: { font: { family: 'Arimo', size: 10 }, color: '#3B0A10', precision: 0, callback: (v: number | string) => fmtNum(+v) } },
        },
      },
    } as unknown as ChartConfiguration
  }

  return { resMonths, resMonthsShow: resMonths.length > 0, resChartShow: !!resChart, resChart }
}
