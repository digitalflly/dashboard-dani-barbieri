// ============================================================
// Shared data-model types
// ============================================================

export interface Profile {
  name: string
  handle: string
  initial: string
  followers: number
}

export interface DailyRow {
  date: string
  views: number
  reach: number
  interactions: number
  taps: number | null
  shares: number
  likes: number
  comments: number
  saves: number
}

export interface FollowRow {
  date: string
  net: number | null
}

export interface MediaPost {
  id: string | null
  ts: string
  type: string
  likes: number
  comments: number
  shares: number
  saves: number
  views: number
  reach: number
  eng: number
  caption: string
  coverIdx: number
  cover?: string
  thumb?: string
  coverData?: string
}

export interface RawData {
  profile: Profile
  daily: DailyRow[]
  follows: FollowRow[]
  media: MediaPost[]
}

export interface WeekDef {
  iso: string
  week: number
  year: number
  start: string
  end: string
  label: string
}

export interface MonthDef {
  value: string
  label: string
}

export interface TimelinePoint {
  date: string
  value: number
}

export interface Model {
  raw: RawData
  profile: Profile
  daily: DailyRow[]
  follows: FollowRow[]
  media: MediaPost[]
  timeline: TimelinePoint[]
  weeks: WeekDef[]
  months: MonthDef[]
  DEFAULT_WEEK: WeekDef
  postCounts: Record<string, number>
  minDate: string
  maxDate: string
  followers: number
  lastSync: string
}

export interface Window {
  start: string
  end: string
  kind: 'week' | 'month' | 'all'
  label: string
  prev: { start: string; end: string } | null
}

export interface Agg {
  views: number
  reach: number
  interactions: number
  taps: number
  shares: number
  likes: number
  comments: number
  saves: number
  postCount: number
}

// ---- Facebook Ads ----
export interface AdRow {
  name: string
  thumb: string
  impressions: number
  reach: number
  linkClicks: number
  lpViews: number
  leads: number
  spend: number
}
export interface AdsetRow {
  name: string
  impressions: number
  reach: number
  linkClicks: number
  lpViews: number
  leads: number
  spend: number
}

// ---- Funnels (Google Sheet) ----
export interface FunnelChartSpec {
  title: string
  eyebrow: string
  col: number
  kind?: string
  horizontal?: boolean
  donut?: boolean
  dropNI?: boolean
}
export interface FunnelSpec {
  key: string
  name: string
  gid: string
  dateCol: number
  statusCol: number
  scoreCol?: number
  statusMap: Record<string, string>
  charts: FunnelChartSpec[]
}
export interface FunnelData {
  rows: string[][]
  minD: string | null
  maxD: string | null
  months: MonthDef[]
}
export interface TallyItem {
  label: string
  count: number
}
export interface BuiltChart {
  title: string
  eyebrow: string
  horizontal: boolean
  donut: boolean
  items: TallyItem[]
}
export interface BuiltFunnel {
  name: string
  total: number
  range: [string | null, string | null]
  volume: TallyItem[]
  status: TallyItem[]
  completed: number
  completedPct: number
  scoreAvg: number | null
  revMedian: number | null
  charts: BuiltChart[]
}
