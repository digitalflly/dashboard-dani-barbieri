// ============================================================
// Acompanhamento page view-models: two expandable trees
// (month → week → day) + two daily/weekly line charts.
// "Conteúdo" summarizes Reels/Carrossel averages per period;
// "Aquisição" summarizes lead volume, qualified leads (MQL),
// cost and faturamento-band mix from the Aplicação Direta funnel.
// Ported from contentRows()/aquisicaoRows()/buildAcompCfgs() +
// faixaGroup()/planoWin() in Dashboard.dc.html.
// ============================================================

import type { ChartConfiguration } from 'chart.js'
import { fmtNum, fmtPct } from './format'
import { windowOf } from './model'
import { lineCfg } from './charts'
import { monday, addDays, ddmm } from './dates'
import { ADS_CAMPAIGN_MATCH } from './constants'
import type { Model, MediaPost } from './types'
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
  fx: { v: string }[]
}
export interface FaixaCol {
  key: string
  label: string
  tip: string
}

export const FAIXA_COLS: FaixaCol[] = [
  { key: 'A', label: 'Faixa A', tip: 'R$ 20 a 50 mil' },
  { key: 'B', label: 'Faixa B', tip: 'R$ 15 a 20 mil' },
  { key: 'C', label: 'Faixa C', tip: 'R$ 8 a 15 mil' },
  { key: 'D', label: 'Faixa D', tip: 'acima de R$ 50 mil' },
  { key: 'Q', label: 'Desqualificado', tip: 'até R$ 8 mil' },
  { key: 'AB', label: 'R$ 15 a 50 mil', tip: 'resposta "15 a 50 mil" — não dá pra separar Faixa A de Faixa B' },
  { key: 'U', label: 'Abaixo de R$ 15 mil', tip: 'resposta "abaixo de 15 mil" — não dá pra separar Faixa C de Desqualificado' },
]
const FAIXA_MQL = ['A', 'B', 'D', 'AB']
const GKEYS = ['A', 'B', 'C', 'D', 'Q', 'AB', 'U']

export const ACOMP_METRIC_OPTIONS = [
  { value: 'reelsReach', label: 'Reels · alcance médio' },
  { value: 'reelsPlays', label: 'Reels · plays médio' },
  { value: 'carrSave', label: 'Carrossel · salvamento médio' },
  { value: 'carrShare', label: 'Carrossel · compartilhamento médio' },
]
interface AcompMetric {
  key: string
  type: 'reel' | 'carr'
  fn: (p: MediaPost) => number
}
const ACOMP_METRICS: AcompMetric[] = [
  { key: 'reelsReach', type: 'reel', fn: (p) => p.reach || 0 },
  { key: 'reelsPlays', type: 'reel', fn: (p) => p.views || 0 },
  { key: 'carrSave', type: 'carr', fn: (p) => p.saves || 0 },
  { key: 'carrShare', type: 'carr', fn: (p) => p.shares || 0 },
]
export const AQ_METRIC_OPTIONS = [
  { value: 'leads', label: 'Leads gerados' },
  { value: 'qual', label: 'Leads qualificados' },
  { value: 'custo', label: 'Custo/lead qualificado' },
  { value: 'pct', label: '% MQL' },
  ...FAIXA_COLS.map((c) => ({ value: 'fx_' + c.key, label: '% ' + c.label })),
]

// classifica a resposta de faturamento do formulário (novo e antigo) em faixas
export function faixaGroup(f: string): string {
  const s = String(f || '').toLowerCase().replace(/é/g, 'e')
  if (!s) return ''
  let m: RegExpMatchArray | null
  if ((m = s.match(/^(?:abaixo_de|ate)_(\d+)_mil$/))) {
    const n = +m[1]
    return n <= 8 ? 'Q' : n <= 15 ? 'U' : ''
  }
  if ((m = s.match(/^acima_de_(\d+)_mil$/))) return +m[1] >= 50 ? 'D' : ''
  if ((m = s.match(/^(\d+)_a_(\d+)_mil$/))) {
    const a = +m[1]
    const b = +m[2]
    if (a >= 50) return 'D'
    if (a === 20 && b === 50) return 'A'
    if (a === 15 && b === 20) return 'B'
    if (a === 15 && b === 50) return 'AB'
    if (a === 8 && b === 15) return 'C'
    if (b <= 8) return 'Q'
    if (a >= 20) return 'A'
    if (a >= 15) return b <= 20 ? 'B' : 'AB'
    if (a >= 8) return 'C'
  }
  return ''
}

// Acompanhamento: janela sempre a partir da semana de 17/08/2026
export function planoWin(M: Model, S: DashState): { start: string; end: string } {
  const w = windowOf(M, S)
  const FLOOR = '2026-08-17'
  return { start: !w.start || w.start < FLOOR ? FLOOR : w.start, end: w.end }
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
  g: Record<string, number>
}

export function contentRows(M: Model, S: DashState): ContentRow[] {
  const win = planoWin(M, S)
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
  const win = planoWin(M, S)
  const rows = (S.aplicLeadsRows || []).filter((r) => (!win.start || r.date >= win.start) && (!win.end || r.date <= win.end))
  const spendBy: Record<string, number> = {}
  ;(S.adsRaw || []).forEach((x) => {
    if (x.date && ADS_CAMPAIGN_MATCH.aplicacao.test(x.campaign) && (!win.start || x.date >= win.start) && (!win.end || x.date <= win.end))
      spendBy[x.date] = (spendBy[x.date] || 0) + (x.spend || 0)
  })
  const mk = (): ANode => ({ leads: 0, qual: 0, decl: 0, spend: 0, g: { A: 0, B: 0, C: 0, D: 0, Q: 0, AB: 0, U: 0 } })
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
    const gr = faixaGroup(r.faixa)
    const q = gr && FAIXA_MQL.indexOf(gr) >= 0 && r.perfilOk !== false ? 1 : 0
    const dc = gr ? 1 : 0
    touch(ym, wk, r.date).forEach((n) => {
      n.leads++
      n.qual += q
      n.decl += dc
      if (gr) n.g[gr]++
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
    fx: FAIXA_COLS.map((c) => ({ v: n.decl ? fmtPct((n.g[c.key] / n.decl) * 100) : '—' })),
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

// aplica formato aos ticks do eixo Y e ao tooltip
function applyFmt(cfg: ChartConfiguration, fmt: (v: number | null) => string, label: string): void {
  const o = (cfg.options = cfg.options || {}) as Record<string, unknown>
  const scales = (o.scales = (o.scales || {}) as Record<string, unknown>)
  const y = (scales.y = (scales.y || {}) as Record<string, unknown>)
  const yt = (y.ticks = (y.ticks || {}) as Record<string, unknown>)
  yt.callback = (v: number | string) => fmt(+v)
  const plugins = (o.plugins = (o.plugins || {}) as Record<string, unknown>)
  const tt = (plugins.tooltip = (plugins.tooltip || {}) as Record<string, unknown>)
  const cb = (tt.callbacks = (tt.callbacks || {}) as Record<string, unknown>)
  cb.label = (c: { parsed: { y: number | null } }) => ' ' + label + ': ' + fmt(c.parsed.y)
}

// linha diária da métrica de conteúdo selecionada (acima da tabela)
export function acompLineCfg(M: Model, S: DashState): ChartConfiguration | null {
  const win = planoWin(M, S)
  const media = (M.media || []).filter((p) => p.ts >= win.start && p.ts <= win.end)
  const MET = ACOMP_METRICS.find((m) => m.key === (S.acompMetric || 'reelsReach')) || ACOMP_METRICS[0]
  const label = ACOMP_METRIC_OPTIONS.find((o) => o.value === MET.key)?.label || 'métrica'
  const pred = MET.type === 'reel' ? (p: MediaPost) => p.type === 'REELS' : (p: MediaPost) => p.type === 'CAROUSEL_ALBUM'
  const dec = MET.type === 'carr'
  const days = [...new Set(media.filter(pred).map((p) => p.ts))].sort()
  const avgOn = (day: string): number => {
    const a = media.filter((p) => p.ts === day && pred(p))
    return a.length ? a.reduce((s, p) => s + MET.fn(p), 0) / a.length : 0
  }
  if (!days.length) return null
  const data = days.map((d) => { const v = avgOn(d); return dec ? +v.toFixed(1) : Math.round(v) })
  const cfg = lineCfg(days.map(ddmm), [{ label, data, color: '#771520', fill: true, fillColor: 'rgba(119,21,32,0.08)' }], { zero: true })
  applyFmt(cfg, (v) => (v == null ? '—' : dec ? Number(v).toFixed(1).replace('.', ',') : fmtNum(Math.round(v))), label)
  return cfg
}

// linha da métrica de aquisição — por semana (padrão) ou por dia (drill numa semana)
export function aqLineCfg(M: Model, S: DashState, onDrill: (week: string) => void): { cfg: ChartConfiguration | null; title: string; drill: boolean } {
  const win = planoWin(M, S)
  const aqRows = (S.aplicLeadsRows || []).filter((r) => (!win.start || r.date >= win.start) && (!win.end || r.date <= win.end))
  const aqSpend: Record<string, number> = {}
  ;(S.adsRaw || []).forEach((x) => {
    if (x.date && ADS_CAMPAIGN_MATCH.aplicacao.test(x.campaign) && (!win.start || x.date >= win.start) && (!win.end || x.date <= win.end))
      aqSpend[x.date] = (aqSpend[x.date] || 0) + (x.spend || 0)
  })
  const mkg = (): ANode & { sp?: number } => ({ leads: 0, qual: 0, decl: 0, spend: 0, g: { A: 0, B: 0, C: 0, D: 0, Q: 0, AB: 0, U: 0 } })
  const aqBy: Record<string, ANode> = {}
  aqRows.forEach((r) => {
    const o = aqBy[r.date] || (aqBy[r.date] = mkg())
    const gr = faixaGroup(r.faixa)
    o.leads++
    if (gr) {
      o.decl++
      o.g[gr]++
      if (FAIXA_MQL.indexOf(gr) >= 0 && r.perfilOk !== false) o.qual++
    }
  })
  const aqDaysAll = [...new Set(Object.keys(aqBy).concat(Object.keys(aqSpend)))].sort()
  const aqKey = S.aqMetric || 'qual'
  const aqCalc = (o: ANode, sp: number): number | null => {
    if (aqKey === 'leads') return o.leads
    if (aqKey === 'qual') return o.qual
    if (aqKey === 'custo') return o.qual ? +(sp / o.qual).toFixed(2) : null
    if (aqKey.indexOf('fx_') === 0) {
      const k = aqKey.slice(3)
      return o.decl ? +((o.g[k] / o.decl) * 100).toFixed(1) : null
    }
    return o.decl ? +((o.qual / o.decl) * 100).toFixed(1) : null
  }
  const aqWeek = S.aqWeek || null
  let labels: string[] = []
  let data: (number | null)[] = []
  let keys: string[] = []
  if (aqWeek) {
    const days = aqDaysAll.filter((d) => monday(d) === aqWeek)
    labels = days.map(ddmm)
    data = days.map((d) => aqCalc(aqBy[d] || mkg(), aqSpend[d] || 0))
  } else {
    const wk: Record<string, ANode & { sp: number }> = {}
    aqDaysAll.forEach((d) => {
      const w = monday(d)
      const o = wk[w] || (wk[w] = { ...mkg(), sp: 0 } as ANode & { sp: number })
      const b = aqBy[d] || mkg()
      o.leads += b.leads
      o.qual += b.qual
      o.decl += b.decl
      GKEYS.forEach((k) => (o.g[k] += b.g[k]))
      o.sp += aqSpend[d] || 0
    })
    keys = Object.keys(wk).sort()
    labels = keys.map((w) => ddmm(w) + '–' + ddmm(addDays(w, 6)))
    data = keys.map((w) => aqCalc(wk[w], wk[w].sp))
  }
  const label = AQ_METRIC_OPTIONS.find((o) => o.value === aqKey)?.label || 'métrica'
  if (!labels.length) return { cfg: null, title: '', drill: !!aqWeek }
  const cfg = lineCfg(labels, [{ label, data: data as number[], color: '#771520', fill: true, fillColor: 'rgba(119,21,32,0.08)' }], { zero: true })
  const ds = cfg.data!.datasets![0] as unknown as Record<string, unknown>
  ds.spanGaps = true
  ds.pointRadius = aqWeek ? 3 : 5
  ds.pointHoverRadius = aqWeek ? 5 : 7
  const fmtAq = (v: number | null): string =>
    v == null ? '—' : aqKey === 'custo' ? 'R$ ' + fmtNum(Math.round(v)) : aqKey === 'pct' || aqKey.indexOf('fx_') === 0 ? fmtPct(v) : fmtNum(Math.round(v))
  applyFmt(cfg, fmtAq, label)
  if (!aqWeek) {
    ;(cfg.options as Record<string, unknown>).onClick = (_e: unknown, els: { index: number }[]) => {
      if (els && els.length) {
        const w = keys[els[0].index]
        if (w) onDrill(w)
      }
    }
  }
  const title = aqWeek ? 'Semana ' + ddmm(aqWeek) + '–' + ddmm(addDays(aqWeek, 6)) + ' · por dia' : 'Por semana · clique em uma semana para ver os dias'
  return { cfg, title, drill: !!aqWeek }
}
