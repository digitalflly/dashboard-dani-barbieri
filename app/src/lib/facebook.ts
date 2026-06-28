// ============================================================
// Windsor.ai — Facebook Ads live connector.
// Reads ad account 450830237045296, splits campaigns by name
// into the "Sessão Premium" and "Diagnóstico" funnels.
// Ported from fetchAds() in Dashboard.dc.html.
// ============================================================

import { ymd } from './dates'
import { WINDSOR_KEY, ADS_ACCOUNT_ID, ADS_CAMPAIGN_MATCH } from './constants'
import type { AdRow, AdsetRow } from './types'

const num = (v: unknown): number => (v == null || v === '' ? 0 : +(v as number) || 0)
const fd = (d: Date): string => ymd(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())))

export interface AdsResult {
  ads: Record<string, AdRow[]>
  adsets: Record<string, AdsetRow[]>
}

export async function fetchAds(): Promise<AdsResult> {
  const to = new Date()
  const from = new Date(to.getTime() - 180 * 86400000)
  const fields =
    'account_name,account_id,campaign,adset_name,ad_name,thumbnail_url,impressions,reach,inline_link_clicks,actions_landing_page_view,actions_lead,spend'
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

  const buildSet = (camRe: RegExp): { ads: AdRow[]; adsets: AdsetRow[] } => {
    const sub = base.filter((x) => camRe.test((x.campaign as string) || ''))
    const byAd: Record<string, AdRow> = {}
    const byAdset: Record<string, AdsetRow> = {}
    sub.forEach((x) => {
      const k = (x.ad_name as string) || '(sem nome)'
      if (!byAd[k])
        byAd[k] = { name: k, thumb: '', impressions: 0, reach: 0, linkClicks: 0, lpViews: 0, leads: 0, spend: 0 }
      const a = byAd[k]
      a.impressions += num(x.impressions)
      a.reach += num(x.reach)
      a.linkClicks += num(x.inline_link_clicks)
      a.lpViews += num(x.actions_landing_page_view)
      a.leads += num(x.actions_lead)
      a.spend += num(x.spend)
      if (!a.thumb && x.thumbnail_url) a.thumb = x.thumbnail_url as string

      const sk = (x.adset_name as string) || '(sem conjunto)'
      if (!byAdset[sk])
        byAdset[sk] = { name: sk, impressions: 0, reach: 0, linkClicks: 0, lpViews: 0, leads: 0, spend: 0 }
      const s = byAdset[sk]
      s.impressions += num(x.impressions)
      s.reach += num(x.reach)
      s.linkClicks += num(x.inline_link_clicks)
      s.lpViews += num(x.actions_landing_page_view)
      s.leads += num(x.actions_lead)
      s.spend += num(x.spend)
    })
    return {
      ads: Object.values(byAd).sort((a, b) => b.impressions - a.impressions),
      adsets: Object.values(byAdset).sort((a, b) => b.impressions - a.impressions),
    }
  }

  const premium = buildSet(ADS_CAMPAIGN_MATCH.premium)
  const diagnostico = buildSet(ADS_CAMPAIGN_MATCH.diagnostico)
  return {
    ads: { premium: premium.ads, diagnostico: diagnostico.ads },
    adsets: { premium: premium.adsets, diagnostico: diagnostico.adsets },
  }
}
