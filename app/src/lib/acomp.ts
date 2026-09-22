// ============================================================
// Acompanhamento page view-models: two expandable trees
// (month → week → day). "Conteúdo" summarizes Reels/Carrossel
// averages per period; "Aquisição" summarizes lead volume,
// qualified leads and cost from the Aplicação Direta funnel.
// Ported from contentRows() / aquisicaoRows() in Dashboard.dc.html.
// ============================================================

import { fmtNum, fmtPct } from './format'
import { windowOf } from './model'
import { monday, addDays, ddmm } from './dates'
import { ADS_CAMPAIGN_MATCH } from './constants'
import type { Model } from './types'
import type { DashState } from './useDashboard'

const MN = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export interface AcompRow {
  key: string
  level: number
  label: string
  indent: number
  caret: string
  hasChildren: boolean
  leaf: boolean
}
export interface ContentRow extends AcompRow {
  reelsReach: string
  reelsPlays: string
  carrSave: string
  carrShare: string
}
export interface AquisicaoRow extends AcompRow {
  leads: string
  qual: string
  custo: string
  pct: string
}

interface CNode {
  rReach: number
  rViews: number
  rN: number
  cSave: number
  cShare: number
  cN: number
}
interface ANode {
  leads: number
  qual: number
  decl: number
  spend: number
}

export function contentRows(M: Model, S: DashState): ContentRow[] {
  const win = windowOf(M, S)
  const media = (M.media || []).filter((p) => p.ts >= win.start && p.ts <= win.end)
  const mk = (): CNode => ({ rReach: 0, rViews: 0, rN: 0, cSave: 0, cShare: 0, cN: 0 })
  const T: Record<string, { n: CNode; w: Record<string, { n: CNode; d: Record<string, CNode> }> }> = {}
  const touch = (ym: string, wk: string, day: string): CNode[] => {
    const Mo = T[ym] || (T[ym] = { n: mk(), w: {} })
    const W = Mo.w[wk] || (Mo.w[wk] = { n: mk(), d: {} })
    const D = W.d[day] || (W.d[day] = mk())
    return [Mo.n, W.n, D]
  }
  media.forEach((p) => {
    const ym = p.ts.slice(0, 7)
    const wk = monday(p.ts)
    const isR = p.type === 'REELS'
    const isC = p.type === 'CAROUSEL_ALBUM'
    if (!isR && !isC) return
    touch(ym, wk, p.ts).forEach((n) => {
      if (isR) {
        n.rReach += p.reach || 0
        n.rViews += p.views || 0
        n.rN++
      } else {
        n.cSave += p.saves || 0
        n.cShare += p.shares || 0
        n.cN++
      }
    })
  })
  const exp = S.ctExpanded || {}
  const avg = (s: number, c: number, dec: boolean): string => (c ? (dec ? (s / c).toFixed(1).replace('.', ',') : fmtNum(Math.round(s / c))) : '—')
  const fmtRow = (key: string, level: number, label: string, n: CNode): ContentRow => ({
    key,
    level,
    label,
    indent: level * 18,
    reelsReach: avg(n.rReach, n.rN, false),
    reelsPlays: avg(n.rViews, n.rN, false),
    carrSave: avg(n.cSave, n.cN, true),
    carrShare: avg(n.cShare, n.cN, true),
    hasChildren: level < 2,
    leaf: level >= 2,
    caret: level < 2 ? (exp[key] ? '−' : '+') : '',
  })
  const out: ContentRow[] = []
  Object.keys(T).sort().reverse().forEach((ym) => {
    const Mo = T[ym]
    out.push(fmtRow(ym, 0, MN[+ym.slice(5, 7) - 1] + ' ' + ym.slice(0, 4), Mo.n))
    if (exp[ym]) {
      Object.keys(Mo.w).sort().reverse().forEach((wk) => {
        const W = Mo.w[wk]
        out.push(fmtRow(ym + '|' + wk, 1, 'Semana ' + ddmm(wk) + '–' + ddmm(addDays(wk, 6)), W.n))
        if (exp[ym + '|' + wk]) {
          Object.keys(W.d).sort().reverse().forEach((day) => out.push(fmtRow(ym + '|' + wk + '|' + day, 2, ddmm(day), W.d[day])))
        }
      })
    }
  })
  return out
}

export function aquisicaoRows(M: Model, S: DashState): AquisicaoRow[] {
  const win = windowOf(M, S)
  const rows = (S.aplicLeadsRows || []).filter((r) => (!win.start || r.date >= win.start) && (!win.end || r.date <= win.end))
  const spendBy: Record<string, number> = {}
  ;(S.adsRaw || []).forEach((x) => {
    if (x.date && ADS_CAMPAIGN_MATCH.aplicacao.test(x.campaign) && (!win.start || x.date >= win.start) && (!win.end || x.date <= win.end))
      spendBy[x.date] = (spendBy[x.date] || 0) + (x.spend || 0)
  })
  const QUAL = ['15_a_50_mil', '50_a_100_mil', '100_a_200_mil', '200_a_500_mil', 'acima_de_500_mil']
  const DECL = ['abaixo_de_8_mil', '8_a_15_mil', 'abaixo_de_15_mil'].concat(QUAL)
  const mk = (): ANode => ({ leads: 0, qual: 0, decl: 0, spend: 0 })
  const T: Record<string, { n: ANode; w: Record<string, { n: ANode; d: Record<string, ANode> }> }> = {}
  const touch = (ym: string, wk: string, day: string): ANode[] => {
    const Mo = T[ym] || (T[ym] = { n: mk(), w: {} })
    const W = Mo.w[wk] || (Mo.w[wk] = { n: mk(), d: {} })
    const D = W.d[day] || (W.d[day] = mk())
    return [Mo.n, W.n, D]
  }
  rows.forEach((r) => {
    const ym = r.date.slice(0, 7)
    const wk = monday(r.date)
    const q = QUAL.indexOf(r.faixa) >= 0 ? 1 : 0
    const dc = DECL.indexOf(r.faixa) >= 0 ? 1 : 0
    touch(ym, wk, r.date).forEach((n) => {
      n.leads++
      n.qual += q
      n.decl += dc
    })
  })
  Object.keys(spendBy).forEach((day) => {
    const ym = day.slice(0, 7)
    const wk = monday(day)
    touch(ym, wk, day).forEach((n) => (n.spend += spendBy[day]))
  })
  const exp = S.aqExpanded || {}
  const fmtRow = (key: string, level: number, label: string, n: ANode): AquisicaoRow => ({
    key,
    level,
    label,
    indent: level * 18,
    leads: fmtNum(n.leads),
    qual: fmtNum(n.qual),
    custo: n.qual ? 'R$ ' + fmtNum(Math.round(n.spend / n.qual)) : '—',
    pct: n.decl ? fmtPct((n.qual / n.decl) * 100) : '—',
    hasChildren: level < 2,
    leaf: level >= 2,
    caret: level < 2 ? (exp[key] ? '−' : '+') : '',
  })
  const out: AquisicaoRow[] = []
  Object.keys(T).sort().reverse().forEach((ym) => {
    const Mo = T[ym]
    out.push(fmtRow(ym, 0, MN[+ym.slice(5, 7) - 1] + ' ' + ym.slice(0, 4), Mo.n))
    if (exp[ym]) {
      Object.keys(Mo.w).sort().reverse().forEach((wk) => {
        const W = Mo.w[wk]
        out.push(fmtRow(ym + '|' + wk, 1, 'Semana ' + ddmm(wk) + '–' + ddmm(addDays(wk, 6)), W.n))
        if (exp[ym + '|' + wk]) {
          Object.keys(W.d).sort().reverse().forEach((day) => out.push(fmtRow(ym + '|' + wk + '|' + day, 2, ddmm(day), W.d[day])))
        }
      })
    }
  })
  return out
}
