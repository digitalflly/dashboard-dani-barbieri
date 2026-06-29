// ============================================================
// Windsor.ai — Facebook Ads live connector.
// Reads ad account 450830237045296 as daily rows, then aggregates
// client-side by campaign (regex) + date range so the funnel date
// filter also scopes the paid-media numbers.
// Ported from fetchAds()/adsAgg()/turbinaAgg() in Dashboard.dc.html.
// ============================================================

import { ymd } from './dates'
import { WINDSOR_KEY, ADS_ACCOUNT_ID } from './constants'
import type { AdRow, AdsetRow, AdDailyRow, TurbinaRow } from './types'

const num = (v: unknown): number => (v == null || v === '' ? 0 : +(v as number) || 0)
const fd = (d: Date): string => ymd(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())))

export interface AdsResult {
  raw: AdDailyRow[]
  minD: string | null
  maxD: string | null
}

export async function fetchAds(): Promise<AdsResult> {
  const to = new Date()
  const from = new Date(to.getTime() - 180 * 86400000)
  const fields =
    'account_id,date,campaign,adset_name,ad_name,thumbnail_url,impressions,reach,inline_link_clicks,actions_landing_page_view,actions_lead,spend'
  const url =
    'https://connectors.windsor.ai/facebook?api_key=' +
    encodeURIComponent(WINDSOR_KEY) +
    '&date_from=' +
    fd(from) +
    '&date_to=' +
    fd(to) +
    '&fields=' +
    encodeURIComponent(fields) +
    '&_cb=' +
    Date.now()
  const r = await fetch(url, { cache: 'no-store' })
  if (!r.ok) throw new Error('Facebook HTTP ' + r.status)
  const j = await r.json()
  if (j.error) throw new Error(String(j.error).slice(0, 120))
  const all: Record<string, unknown>[] = j.data || []
  const base = all.filter((x) => String(x.account_id || '').replace(/\D/g, '') === ADS_ACCOUNT_ID)

  // guarda as linhas diárias para filtrar por data no cliente
  const raw: AdDailyRow[] = base.map((x) => ({
    date: String(x.date || '').slice(0, 10),
    campaign: (x.campaign as string) || '',
    ad: (x.ad_name as string) || '(sem nome)',
    adset: (x.adset_name as string) || '(sem conjunto)',
    thumb: (x.thumbnail_url as string) || '',
    impressions: num(x.impressions),
    reach: num(x.reach),
    linkClicks: num(x.inline_link_clicks),
    lpViews: num(x.actions_landing_page_view),
    leads: num(x.actions_lead),
    spend: num(x.spend),
  }))
  let mn: string | null = null
  let mx: string | null = null
  raw.forEach((rw) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(rw.date)) {
      if (!mn || rw.date < mn) mn = rw.date
      if (!mx || rw.date > mx) mx = rw.date
    }
  })
  return { raw, minD: mn, maxD: mx }
}

// agrega anúncios/conjuntos por campanha (regex) e intervalo de datas
export function adsAgg(
  raw: AdDailyRow[] | null,
  camRe: RegExp,
  from: string,
  to: string
): { ads: AdRow[]; adsets: AdsetRow[] } {
  const rows = (raw || []).filter(
    (x) => camRe.test(x.campaign) && (!from || x.date >= from) && (!to || x.date <= to)
  )
  const byAd: Record<string, AdRow> = {}
  const byAdset: Record<string, AdsetRow> = {}
  rows.forEach((x) => {
    const a =
      byAd[x.ad] ||
      (byAd[x.ad] = { name: x.ad, thumb: '', impressions: 0, reach: 0, linkClicks: 0, lpViews: 0, leads: 0, spend: 0 })
    a.impressions += x.impressions
    a.reach += x.reach
    a.linkClicks += x.linkClicks
    a.lpViews += x.lpViews
    a.leads += x.leads
    a.spend += x.spend
    if (!a.thumb && x.thumb) a.thumb = x.thumb

    const s =
      byAdset[x.adset] ||
      (byAdset[x.adset] = { name: x.adset, impressions: 0, reach: 0, linkClicks: 0, lpViews: 0, leads: 0, spend: 0 })
    s.impressions += x.impressions
    s.reach += x.reach
    s.linkClicks += x.linkClicks
    s.lpViews += x.lpViews
    s.leads += x.leads
    s.spend += x.spend
  })
  return {
    ads: Object.values(byAd).sort((a, b) => b.impressions - a.impressions),
    adsets: Object.values(byAdset).sort((a, b) => b.impressions - a.impressions),
  }
}

// agrega turbinamento por campanha + intervalo de datas
export function turbinaAgg(
  raw: AdDailyRow[] | null,
  re: RegExp,
  from: string,
  to: string
): TurbinaRow[] {
  const rows = (raw || []).filter(
    (x) => re.test(x.campaign) && (!from || x.date >= from) && (!to || x.date <= to)
  )
  const byCamp: Record<string, TurbinaRow> = {}
  rows.forEach((x) => {
    const t =
      byCamp[x.campaign] ||
      (byCamp[x.campaign] = { name: x.campaign, impressions: 0, reach: 0, linkClicks: 0, lpViews: 0, spend: 0, thumb: '' })
    t.impressions += x.impressions
    t.reach += x.reach
    t.linkClicks += x.linkClicks
    t.lpViews += x.lpViews
    t.spend += x.spend
    if (!t.thumb && x.thumb) t.thumb = x.thumb
  })
  return Object.values(byCamp).sort((a, b) => b.spend - a.spend)
}
