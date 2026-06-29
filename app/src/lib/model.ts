// ============================================================
// buildModel(raw) — the single brain. Same code serves the
// embedded snapshot and the live API response. Ported from
// Dashboard.dc.html (buildModel + windowOf/agg/tl helpers).
// ============================================================

import { ymd, parse, addDays, isoWeek, monday, ddmm, MONTH_NAMES } from './dates'
import { WEEK_COLORS } from './constants'
import { genRaw } from './demo'
import type { RawData, Model, Window, Agg, WeekDef, MonthDef, DailyRow } from './types'

export function buildModel(raw?: RawData): Model {
  raw = raw || genRaw()
  const daily = raw.daily
  const follows = raw.follows
  const media = raw.media
  const dDates = daily.map((d) => d.date)
  // Periods span daily + media dates so the week/month filters cover every post,
  // even posts older than the (lighter) daily series window.
  const allDates = dDates.concat(media.map((p) => p.ts).filter(Boolean)).slice().sort()
  const minDate = allDates[0] || dDates[0]
  const maxDate = allDates[allDates.length - 1] || dDates[dDates.length - 1]
  const dailyMax = dDates[dDates.length - 1] || maxDate

  // weeks
  const weeks: WeekDef[] = []
  let m = monday(minDate)
  while (m <= maxDate) {
    const iw = isoWeek(m)
    const endW = addDays(m, 6)
    weeks.push({
      iso: iw.year + '-W' + String(iw.week).padStart(2, '0'),
      week: iw.week,
      year: iw.year,
      start: m,
      end: endW,
      label: iw.week + ' · ' + ddmm(m) + '–' + ddmm(endW),
    })
    m = addDays(m, 7)
  }
  // months
  const monthSet: string[] = []
  allDates.forEach((d) => {
    const ym = d.slice(0, 7)
    if (!monthSet.includes(ym)) monthSet.push(ym)
  })
  monthSet.sort()
  const months: MonthDef[] = monthSet.map((ym) => ({
    value: ym,
    label: MONTH_NAMES[Number(ym.slice(5, 7)) - 1] + ' ' + ym.slice(0, 4),
  }))

  // follower timeline (reconstruct backward)
  const followers = raw.profile.followers
  const tl = daily.map((r) => ({ date: r.date, value: 0 }))
  if (tl.length) {
    tl[tl.length - 1].value = followers
    for (let i = tl.length - 2; i >= 0; i--) {
      const net = follows[i + 1]?.net || 0
      tl[i].value = tl[i + 1].value - net
    }
  }

  // post counts per week
  const postCounts: Record<string, number> = {}
  weeks.forEach((w) => {
    postCounts[w.iso] = 0
  })
  media.forEach((p) => {
    const w = weeks.find((w) => p.ts >= w.start && p.ts <= w.end)
    if (w) postCounts[w.iso]++
  })

  // semana padrão: a mais recente COM posts; senão a semana da data mais recente
  const weekOfLatestData =
    weeks.find((w) => dailyMax >= w.start && dailyMax <= w.end) || weeks[weeks.length - 1]
  let weekWithPosts: WeekDef | null = null
  for (let i = weeks.length - 1; i >= 0; i--) {
    if (postCounts[weeks[i].iso] > 0) {
      weekWithPosts = weeks[i]
      break
    }
  }
  const DEFAULT_WEEK = weekWithPosts || weekOfLatestData

  const md = parse(dailyMax)
  const fmtSync =
    md.getUTCDate() + ' ' + MONTH_NAMES[md.getUTCMonth()] + ' ' + md.getUTCFullYear() + ' · 14:30'
  return {
    raw,
    profile: raw.profile,
    daily,
    follows,
    media,
    timeline: tl,
    weeks,
    months,
    DEFAULT_WEEK,
    postCounts,
    minDate,
    maxDate,
    followers,
    lastSync: fmtSync,
  }
}

export interface PeriodState {
  week: string
  month: string
}

export function windowOf(M: Model, state: PeriodState): Window {
  if (state.week !== 'all') {
    const w = M.weeks.find((x) => x.iso === state.week) || M.DEFAULT_WEEK
    const idx = M.weeks.indexOf(w)
    const prev = idx > 0 ? M.weeks[idx - 1] : null
    return {
      start: w.start,
      end: w.end,
      kind: 'week',
      label: w.label,
      prev: prev ? { start: prev.start, end: prev.end } : null,
    }
  }
  if (state.month !== 'all') {
    const ym = state.month
    const inMonth = M.daily.filter((r) => r.date.slice(0, 7) === ym).map((r) => r.date)
    const start = inMonth[0]
    const end = inMonth[inMonth.length - 1]
    const mi = M.months.findIndex((x) => x.value === ym)
    const pm = mi > 0 ? M.months[mi - 1] : null
    let prev: { start: string; end: string } | null = null
    if (pm) {
      const pin = M.daily.filter((r) => r.date.slice(0, 7) === pm.value).map((r) => r.date)
      prev = { start: pin[0], end: pin[pin.length - 1] }
    }
    const lbl = M.months.find((x) => x.value === ym)!.label
    return { start, end, kind: 'month', label: lbl, prev }
  }
  return { start: M.minDate, end: M.maxDate, kind: 'all', label: 'todo o período', prev: null }
}

export function agg(M: Model, start: string, end: string): Agg {
  const rows = M.daily.filter((r) => r.date >= start && r.date <= end)
  const s: Agg = {
    views: 0,
    reach: 0,
    interactions: 0,
    taps: 0,
    shares: 0,
    likes: 0,
    comments: 0,
    saves: 0,
    postCount: 0,
  }
  rows.forEach((r) => {
    s.views += r.views
    s.reach += r.reach
    s.interactions += r.interactions
    if (r.taps != null) s.taps += r.taps
    s.shares += r.shares
    s.likes += r.likes
    s.comments += r.comments
    s.saves += r.saves
  })
  s.postCount = M.media.filter((p) => p.ts >= start && p.ts <= end).length
  return s
}

export function tlAt(M: Model, date: string): number | null {
  let v: number | null = null
  M.timeline.forEach((t) => {
    if (t.date <= date) v = t.value
  })
  return v
}

export function weeksInWindow(M: Model, win: Window): WeekDef[] {
  return M.weeks.filter((w) => w.start <= win.end && w.end >= win.start)
}

export function dailyAt(M: Model, date: string): DailyRow | null {
  return M.daily.find((r) => r.date === date) || null
}

export interface WeekdayDataset {
  label: string
  data: (number | null)[]
  color: string
}

export function weekdayDatasets(
  M: Model,
  win: Window,
  valueFn: (row: DailyRow) => number | null
): WeekdayDataset[] {
  const wk = weeksInWindow(M, win)
  return wk.map((w, i) => {
    const data: (number | null)[] = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(w.start, d)
      const row = dailyAt(M, date)
      data.push(row ? valueFn(row) : null)
    }
    return { label: 'sem ' + w.week, data, color: WEEK_COLORS[i % WEEK_COLORS.length] }
  })
}

export function nowStamp(): string {
  const now = new Date()
  return (
    now.getDate() +
    ' ' +
    MONTH_NAMES[now.getMonth()] +
    ' ' +
    now.getFullYear() +
    ' · ' +
    String(now.getHours()).padStart(2, '0') +
    ':' +
    String(now.getMinutes()).padStart(2, '0')
  )
}

export { ymd }
