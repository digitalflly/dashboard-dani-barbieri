// ============================================================
// View-model builders for the Conta / Conteúdos / Insights pages.
// Ported from renderVals() in Dashboard.dc.html. Pure functions:
// event handlers are wired in the components.
// ============================================================

import { ddmm } from './dates'
import { fmtNum, fmtPct, delta } from './format'
import { windowOf, agg, tlAt, weekdayDatasets } from './model'
import { lineCfg, type LineOpts } from './charts'
import { learnings, type Learning } from './learnings'
import { ACCENT, COVER_BG } from './constants'
import type { Model, MonthDef, MediaPost, DailyRow } from './types'
import type { ChartConfiguration } from 'chart.js'
import type { CSSProperties } from 'react'
import type { DashState } from './useDashboard'

export function typeLabel(t: string): string {
  return t === 'REELS' ? 'Reel' : t === 'CAROUSEL_ALBUM' ? 'Carrossel' : 'Imagem'
}

export function monthOptions(M: Model): MonthDef[] {
  return [{ value: 'all', label: 'Todos os meses' }, ...M.months]
}
export function weekOptions(M: Model): { value: string; label: string }[] {
  return [{ value: 'all', label: 'Todas as semanas' }, ...M.weeks.map((w) => ({ value: w.iso, label: w.label }))]
}

export interface HeaderVM {
  sourceLabel: string
  sourceColor: string
  dormant: boolean
  pageTitle: string
  showFilters: boolean
  showFunnelFilters: boolean
  refreshLabel: string
}

export function headerVM(M: Model, S: DashState): HeaderVM {
  const sourceLabel = S.dataError
    ? ('erro: ' + S.dataError).slice(0, 58)
    : S.mediaLoading
      ? 'ao vivo · @' + M.profile.handle + ' · carregando publicações…'
      : S.refreshing
        ? 'buscando dados ao vivo…'
        : S.live
          ? 'ao vivo · @' + M.profile.handle
          : 'snapshot de demonstração'
  const sourceColor = S.dataError
    ? 'var(--danger)'
    : S.mediaLoading
      ? 'var(--warning)'
      : S.live
        ? 'var(--success)'
        : 'var(--ink-300)'
  const pageTitle =
    S.page === 'conta'
      ? 'Dados da Conta'
      : S.page === 'conteudos'
        ? 'Dados dos Conteúdos'
        : S.page === 'insights'
          ? 'Insights dos Conteúdos'
          : 'Dados dos Funis'
  return {
    sourceLabel,
    sourceColor,
    dormant: S.dormant && !S.mediaLoading,
    pageTitle,
    showFilters: S.page !== 'candidaturas',
    showFunnelFilters: S.page === 'candidaturas',
    refreshLabel: S.refreshing ? 'Atualizando…' : 'Atualizar',
  }
}

// ---- shared period context ----
function ctx(M: Model, S: DashState) {
  const win = windowOf(M, S)
  const followers = M.followers
  const cur = agg(M, win.start, win.end)
  const prev = win.prev ? agg(M, win.prev.start, win.prev.end) : null
  const curF = tlAt(M, win.end)
  const prevF = win.prev ? tlAt(M, win.prev.end) : null
  const PM = S.postMetrics !== false
  const isTest = (p: MediaPost) => PM && p.type === 'REELS' && p.reach < 500
  const winMedia = M.media
    .filter((p) => p.ts >= win.start && p.ts <= win.end)
    .slice()
    .sort((a, b) => (a.ts < b.ts ? 1 : -1))
  return { win, followers, cur, prev, curF, prevF, PM, isTest, contentMedia: winMedia }
}

// ---- CONTA ----
export interface KpiVM {
  label: string
  value: string
  accent: string
  deltaText: string
  deltaColor: string
  sub: string
}
export interface ContaVM {
  kpis: KpiVM[]
  chartCfgs: Record<string, ChartConfiguration>
  metric2Options: { value: string; label: string }[]
}

export function contaVM(M: Model, S: DashState): ContaVM {
  const { win, followers, cur, prev, curF, prevF } = ctx(M, S)
  const accent = ACCENT
  const engG = cur.reach ? (cur.interactions / cur.reach) * 100 : 0
  const engF = followers ? (cur.interactions / followers) * 100 : 0
  const pEngG = prev && prev.reach ? (prev.interactions / prev.reach) * 100 : null
  const pEngF = prev ? (prev.interactions / followers) * 100 : null

  const mk = (label: string, value: string, d: ReturnType<typeof delta>, sub = ''): KpiVM => ({
    label,
    value,
    accent,
    deltaText: d.text,
    deltaColor: d.color,
    sub: sub || d.sub || '',
  })
  const kpis: KpiVM[] = [
    mk('Seguidores', fmtNum(curF), delta(curF, prevF), win.prev ? (curF! - prevF! >= 0 ? '+' : '') + fmtNum(curF! - prevF!) : ''),
    mk('Visualizações', fmtNum(cur.views), delta(cur.views, prev ? prev.views : null)),
    mk('Alcance', fmtNum(cur.reach), delta(cur.reach, prev ? prev.reach : null)),
    mk('Interações', fmtNum(cur.interactions), delta(cur.interactions, prev ? prev.interactions : null)),
    mk('Cliques na bio', fmtNum(cur.taps), delta(cur.taps, prev ? prev.taps : null)),
    mk('Conteúdos', String(cur.postCount), delta(cur.postCount, prev ? prev.postCount : null)),
    mk('% engajamento geral', fmtPct(engG), delta(engG, pEngG)),
    mk('% engajamento seguidores', fmtPct(engF), delta(engF, pEngF)),
  ]

  const flWin = M.timeline.filter((t) => t.date >= win.start && t.date <= win.end)
  const metricFns: Record<string, (r: DailyRow) => number | null> = {
    views: (r) => r.views,
    reach: (r) => r.reach,
    interactionRate: (r) => (r.reach ? (r.interactions / r.reach) * 100 : null),
    saveRate: (r) => (r.reach ? (r.saves / r.reach) * 100 : null),
    shareRate: (r) => (r.reach ? (r.shares / r.reach) * 100 : null),
  }
  const metric2Pct = S.metric2 !== 'views' && S.metric2 !== 'reach'
  const wdLabels = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']
  const lo = (o: LineOpts) => o
  const chartCfgs: Record<string, ChartConfiguration> = {
    'chart-followers': lineCfg(
      flWin.map((t) => ddmm(t.date)),
      [{ label: 'seguidores', data: flWin.map((t) => t.value), color: accent, fill: true, fillColor: 'rgba(119,21,32,0.08)' }],
      lo({ zero: false })
    ),
    'chart-metric2': lineCfg(wdLabels, weekdayDatasets(M, win, metricFns[S.metric2]), lo({ pct: metric2Pct, zero: metric2Pct })),
    'chart-engfollowers': lineCfg(
      wdLabels,
      weekdayDatasets(M, win, (r) => (followers ? (r.interactions / followers) * 100 : null)),
      lo({ pct: true, zero: true })
    ),
    'chart-enggeneral': lineCfg(
      wdLabels,
      weekdayDatasets(M, win, (r) => (r.reach ? (r.interactions / r.reach) * 100 : null)),
      lo({ pct: true, zero: true })
    ),
  }
  const metric2Options = [
    { value: 'views', label: 'Visualizações' },
    { value: 'reach', label: 'Alcance' },
    { value: 'interactionRate', label: 'Taxa de Interação' },
    { value: 'saveRate', label: 'Taxa de Salvamento' },
    { value: 'shareRate', label: 'Taxa de Compartilhamento' },
  ]
  return { kpis, chartCfgs, metric2Options }
}

// ---- CONTEUDOS ----
export interface CardMetric {
  label: string
  value: string
}
export interface CardVM {
  typeLabel: string
  date: string
  caption: string
  likes: string
  comments: string
  shares: string
  saves: string
  coverStyle: CSSProperties
  metrics: CardMetric[]
}
export interface ContentVM {
  posted: CardVM[]
  postedCount: string
  hasPosted: boolean
  contentEmpty: boolean
  noMetrics: boolean
  metricsNote: string
}

export function contentVM(M: Model, S: DashState): ContentVM {
  const { followers, PM, isTest, contentMedia } = ctx(M, S)
  const cardOf = (p: MediaPost): CardVM => {
    const dayRow = M.daily.find((r) => r.date === p.ts) || null
    const taps = dayRow ? dayRow.taps : null
    const baseBg = COVER_BG[p.coverIdx % COVER_BG.length]
    const src = p.coverData || p.cover
    const coverBase: CSSProperties = {
      position: 'relative',
      height: 150,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }
    const coverStyle: CSSProperties = src
      ? {
          ...coverBase,
          background: `linear-gradient(rgba(39,21,13,0.12), rgba(39,21,13,0.40)), center/cover no-repeat url("${src}"), ${baseBg}`,
        }
      : {
          ...coverBase,
          background: baseBg,
          backgroundImage: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.10), transparent 60%)',
        }
    return {
      typeLabel: typeLabel(p.type),
      date: ddmm(p.ts),
      caption: p.caption,
      likes: PM ? fmtNum(p.likes) : '—',
      comments: PM ? fmtNum(p.comments) : '—',
      shares: PM ? fmtNum(p.shares) : '—',
      saves: PM ? fmtNum(p.saves) : '—',
      coverStyle,
      metrics: [
        { label: 'Visualizações', value: PM ? fmtNum(p.views) : '—' },
        { label: 'Alcance', value: PM ? fmtNum(p.reach) : '—' },
        { label: 'Interações', value: PM ? fmtNum(p.eng) : '—' },
        { label: '% Eng. geral', value: PM ? fmtPct(p.reach ? (p.eng / p.reach) * 100 : null) : '—' },
        { label: '% Eng. seguidor', value: PM ? fmtPct((p.eng / followers) * 100) : '—' },
        { label: 'Tx. salvamento', value: PM ? fmtPct(p.reach ? (p.saves / p.reach) * 100 : null) : '—' },
        { label: 'Tx. compart.', value: PM ? fmtPct(p.reach ? (p.shares / p.reach) * 100 : null) : '—' },
        { label: 'Cliques na bio', value: PM ? (taps == null ? '—' : fmtNum(taps)) : '—' },
      ],
    }
  }
  const posted = contentMedia.filter((p) => !isTest(p)).map(cardOf)
  return {
    posted,
    postedCount: String(posted.length),
    hasPosted: posted.length > 0,
    contentEmpty: posted.length === 0,
    noMetrics: !PM,
    metricsNote: metricsNote(M),
  }
}

function metricsNote(M: Model): string {
  return (
    'Este conector do Windsor não detalha métricas por publicação para @' +
    M.profile.handle +
    ' — capa, legenda, tipo e data são reais; números por post aparecem como —. Os indicadores de conta e a série diária estão ao vivo.'
  )
}

// ---- INSIGHTS ----
export interface AverageVM {
  label: string
  value: string
}
export interface Top3VM {
  rank: string
  caption: string
  typeLabel: string
  date: string
  metricValue: string
  coverStyle: CSSProperties
}
export interface InsightsVM {
  averages: AverageVM[]
  avgEyebrow: string
  avgTitle: string
  top3: Top3VM[]
  topMetricOptions: { value: string; label: string }[]
  worked: Learning[]
  notWorked: Learning[]
  metricsAvailable: boolean
  noMetrics: boolean
  metricsNote: string
}

export function insightsVM(M: Model, S: DashState): InsightsVM {
  const { win, followers, cur, PM, isTest, contentMedia } = ctx(M, S)
  const winDays = M.daily.filter((r) => r.date >= win.start && r.date <= win.end)
  const nd = winDays.length || 1
  const valid = contentMedia.filter((p) => p.reach > 0 && !isTest(p))
  const n = valid.length || 1
  const sum = (f: (p: MediaPost) => number) => valid.reduce((a, p) => a + f(p), 0)
  const engG = cur.reach ? (cur.interactions / cur.reach) * 100 : 0
  const engF = followers ? (cur.interactions / followers) * 100 : 0

  const averages: AverageVM[] = PM
    ? [
        { label: 'Alcance', value: fmtNum(sum((p) => p.reach) / n) },
        { label: 'Visualizações', value: fmtNum(sum((p) => p.views) / n) },
        { label: 'Interações', value: fmtNum(sum((p) => p.eng) / n) },
        { label: 'Comentários', value: fmtNum(sum((p) => p.comments) / n) },
        { label: 'Compartilhamentos', value: fmtNum(sum((p) => p.shares) / n) },
        { label: 'Salvamentos', value: fmtNum(sum((p) => p.saves) / n) },
        { label: '% engajamento geral', value: fmtPct(sum((p) => p.reach) ? (sum((p) => p.eng) / sum((p) => p.reach)) * 100 : null) },
        { label: '% engajamento seguidores', value: fmtPct((sum((p) => p.eng) / n / followers) * 100) },
      ]
    : [
        { label: 'Alcance / dia', value: fmtNum(cur.reach / nd) },
        { label: 'Visualizações / dia', value: fmtNum(cur.views / nd) },
        { label: 'Interações / dia', value: fmtNum(cur.interactions / nd) },
        { label: 'Likes / dia', value: fmtNum(cur.likes / nd) },
        { label: 'Comentários / dia', value: fmtNum(cur.comments / nd) },
        { label: 'Salvamentos / dia', value: fmtNum(cur.saves / nd) },
        { label: '% engajamento geral', value: fmtPct(engG) },
        { label: '% engajamento seguidores', value: fmtPct(engF) },
      ]

  const topMetricOptions = [
    { value: 'views', label: 'Visualizações' },
    { value: 'reach', label: 'Alcance' },
    { value: 'eng', label: 'Interações' },
    { value: 'engG', label: '% Eng. geral' },
    { value: 'engF', label: '% Eng. seguidor' },
    { value: 'saveRate', label: 'Tx. salvamento' },
    { value: 'shareRate', label: 'Tx. compart.' },
  ]
  const tmFn: Record<string, (p: MediaPost) => number> = {
    views: (p) => p.views,
    reach: (p) => p.reach,
    eng: (p) => p.eng,
    engG: (p) => (p.reach ? (p.eng / p.reach) * 100 : 0),
    engF: (p) => (p.eng / followers) * 100,
    saveRate: (p) => (p.reach ? (p.saves / p.reach) * 100 : 0),
    shareRate: (p) => (p.reach ? (p.shares / p.reach) * 100 : 0),
  }
  const tmPct = ['engG', 'engF', 'saveRate', 'shareRate'].includes(S.topMetric)
  const top3: Top3VM[] = valid
    .slice()
    .sort((a, b) => tmFn[S.topMetric](b) - tmFn[S.topMetric](a))
    .slice(0, 3)
    .map((p, i) => ({
      rank: String(i + 1),
      caption: p.caption,
      typeLabel: typeLabel(p.type),
      date: ddmm(p.ts),
      metricValue: tmPct ? fmtPct(tmFn[S.topMetric](p)) : fmtNum(tmFn[S.topMetric](p)),
      coverStyle: {
        width: 56,
        height: 56,
        flex: 'none',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: COVER_BG[p.coverIdx % COVER_BG.length],
      },
    }))

  const { worked, notWorked } = learnings(valid, followers)
  return {
    averages,
    avgEyebrow: PM ? 'Média por post no período' : 'Média diária no período',
    avgTitle: PM ? 'Desempenho médio' : 'Desempenho médio diário',
    top3,
    topMetricOptions,
    worked,
    notWorked,
    metricsAvailable: PM,
    noMetrics: !PM,
    metricsNote: metricsNote(M),
  }
}
