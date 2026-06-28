// ============================================================
// Windsor.ai — Instagram live connector.
// Phase 1: account + daily series (fast). Phase 2: per-post
// insights (last 30 days live, rest from localStorage cache).
// Ported from fetchLive() in Dashboard.dc.html.
// ============================================================

import { ymd } from './dates'
import { WINDSOR_KEY, HANDLE, BRAND_NAME } from './constants'
import { readCache, saveCache } from './cache'
import type { Profile, DailyRow, FollowRow, MediaPost } from './types'

const num = (v: unknown): number => (v == null || v === '' ? 0 : +(v as number) || 0)
const isDate = (s: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(s)
const fd = (d: Date): string => ymd(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())))

async function getF(fields: string, days: number, to: Date): Promise<Record<string, unknown>[]> {
  const f0 = fd(new Date(to.getTime() - days * 86400000))
  const u =
    'https://connectors.windsor.ai/instagram?api_key=' +
    encodeURIComponent(WINDSOR_KEY) +
    '&date_from=' +
    f0 +
    '&date_to=' +
    fd(to) +
    '&fields=' +
    encodeURIComponent(fields) +
    '&_cb=' +
    Date.now()
  const r = await fetch(u, { cache: 'no-store' })
  if (!r.ok) throw new Error('Windsor HTTP ' + r.status)
  const j = await r.json()
  const arr: Record<string, unknown>[] = j && j.data ? j.data : Array.isArray(j) ? j : []
  return arr.filter((x) => String(x.username || '').toLowerCase() === HANDLE.toLowerCase())
}

export interface LiveAccount {
  profile: Profile
  daily: DailyRow[]
  follows: FollowRow[]
  actSum: number
}

/** Phase 1: account + daily series. Throws on insufficient data. */
export async function fetchAccount(): Promise<LiveAccount> {
  const to = new Date()
  const [profR, dRows, fRows] = await Promise.all([
    getF('followers_count,name,username,media_count', 7, to),
    getF('date,views,reach,total_interactions,shares,likes,comments,saves,profile_links_taps,username', 60, to),
    getF('date,follows_and_unfollows,username', 60, to),
  ])
  const daily: DailyRow[] = dRows
    .map((r) => ({
      date: String(r.date).slice(0, 10),
      views: num(r.views),
      reach: num(r.reach),
      interactions: num(r.total_interactions),
      taps: r.profile_links_taps == null ? null : num(r.profile_links_taps),
      shares: num(r.shares),
      likes: num(r.likes),
      comments: num(r.comments),
      saves: num(r.saves),
    }))
    .filter((r) => isDate(r.date))
    .sort((a, b) => (a.date < b.date ? -1 : 1))
  if (daily.length < 2) throw new Error('Sem série diária suficiente para @' + HANDLE + ' nesse período.')

  const fmap: Record<string, number | null> = {}
  fRows.forEach((r) => {
    const d = String(r.date).slice(0, 10)
    if (isDate(d)) fmap[d] = r.follows_and_unfollows == null ? null : num(r.follows_and_unfollows)
  })
  const follows: FollowRow[] = daily.map((d) => ({ date: d.date, net: d.date in fmap ? fmap[d.date] : 0 }))

  const prof = (profR[0] || {}) as Record<string, unknown>
  let nm = String(prof.name || '@' + HANDLE).trim()
  nm = BRAND_NAME || nm.split('|')[0].split('—')[0].trim() || '@' + HANDLE // nome de marca fixo
  const profile: Profile = {
    name: nm,
    handle: HANDLE,
    initial: (nm[0] || 'D').toUpperCase(),
    followers: num(prof.followers_count),
  }
  const actSum = daily.reduce((a, d) => a + d.reach + d.views + d.interactions, 0)
  return { profile, daily, follows, actSum }
}

/** Phase 2: per-post media. Merges last-30-day live fetch with cache. */
export async function fetchMedia(): Promise<{ media: MediaPost[]; ckey: string; savedAt: string }> {
  const to = new Date()
  const ckey = 'dbi_posts_cache_' + HANDLE.toLowerCase()
  const { cached, seeded } = readCache(ckey)
  // 1ª vez (sem cache): semeia o histórico disponível; depois só 30 dias
  const win = seeded ? 30 : 180
  const mRows = await getF(
    'media_id,timestamp,media_type,media_product_type,media_caption,media_like_count,media_comments_count,media_reach,media_saved,media_shares,media_views,media_url,media_thumbnail_url,username',
    win,
    to
  )
  const fresh: MediaPost[] = mRows
    .map((r, i) => {
      const likes = num(r.media_like_count)
      const comments = num(r.media_comments_count)
      const shares = num(r.media_shares)
      const saves = num(r.media_saved)
      const reach = num(r.media_reach)
      const views = num(r.media_views)
      const eng = num(r.media_engagement) || likes + comments + shares + saves
      const type = r.media_product_type === 'REELS' ? 'REELS' : (r.media_type as string) || 'IMAGE'
      return {
        id: (r.media_id as string) || null,
        ts: String(r.timestamp || '').slice(0, 10),
        type,
        likes,
        comments,
        shares,
        saves,
        views,
        reach,
        eng,
        caption: String(r.media_caption || 'Sem legenda').replace(/\s+/g, ' ').trim().slice(0, 140),
        coverIdx: i,
        cover: String(r.media_url || r.media_thumbnail_url || ''),
        thumb: String(r.media_thumbnail_url || r.media_url || ''),
      } as MediaPost
    })
    .filter((p) => isDate(p.ts) && p.id)

  // corte de 30 dias: cache fornece tudo anterior, fetch fornece os últimos 30 dias
  const cutoff = fd(new Date(to.getTime() - 30 * 86400000))
  const byId: Record<string, MediaPost> = {}
  cached.filter((p) => p && p.id && String(p.ts) < cutoff).forEach((p) => {
    byId[p.id as string] = p
  })
  // capas já embutidas (data URL) — carrega do cache para não rebaixar de novo
  const cdById: Record<string, string> = {}
  cached.forEach((p) => {
    if (p && p.id && p.coverData) cdById[p.id as string] = p.coverData
  })
  fresh.forEach((p) => {
    if (cdById[p.id as string]) p.coverData = cdById[p.id as string]
    byId[p.id as string] = p
  })
  const media = Object.values(byId)
    .filter((p) => isDate(p.ts) && p.id)
    .sort((a, b) => (a.ts < b.ts ? -1 : 1))
  const savedAt = fd(to)
  // persiste tudo até hoje, para a próxima atualização puxar só 30 dias
  saveCache(ckey, media, savedAt)
  return { media, ckey, savedAt }
}
