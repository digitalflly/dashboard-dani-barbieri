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
  // link do post no Instagram (instagram_permalink_url do Windsor) — abre a peça
  permalink?: string
  impressions: number
  reach: number
  linkClicks: number
  lpViews: number
  leads: number
  spend: number
  // Golden Ticket (e-commerce) — só no snapshot estático
  checkout?: number
  purchases?: number
  revenue?: number
}
export interface AdsetRow {
  name: string
  impressions: number
  reach: number
  linkClicks: number
  lpViews: number
  leads: number
  spend: number
  checkout?: number
  purchases?: number
  revenue?: number
}
// linha diária bruta do conector do Facebook (agregada no cliente por intervalo)
export interface AdDailyRow {
  date: string
  campaign: string
  ad: string
  adset: string
  thumb: string
  permalink: string
  adId: string
  impressions: number
  reach: number
  linkClicks: number
  lpViews: number
  leads: number
  checkout: number
  purchases: number
  revenue: number
  spend: number
}
// turbinamento — agregado por campanha (funil Seguidores)
export interface TurbinaRow {
  name: string
  impressions: number
  reach: number
  linkClicks: number
  lpViews: number
  spend: number
  thumb: string
  permalink: string
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
  // funil só de anúncios (ex.: Seguidores) — sem planilha de leads
  adsOnly?: boolean
  // funil Golden Ticket — snapshot estático por imersão (IEB/AMB/NEA)
  golden?: boolean
  // imersão fixa (ex.: Golden com uma única imersão)
  imersaoFixed?: string
  // esconde o seletor de imersão (funil de imersão única)
  noImersao?: boolean
  // NEA 2ª Edição — 100% dados reais das campanhas "NEA 2.0"
  nea2?: boolean
  // funil de compras (usa checkout → compras em vez de leads)
  purchaseFunnel?: boolean
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
