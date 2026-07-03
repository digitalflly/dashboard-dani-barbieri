// ============================================================
// Golden Ticket — agrega o snapshot estático por imersão (IEB/AMB/NEA)
// no formato AdRow/AdsetRow usado pelo funil de investimento.
// Ported de goldenAgg() em Dashboard.dc.html.
// ============================================================

import { GOLDEN_TICKET, type GtRow } from './goldenTicketData'
import type { AdRow, AdsetRow } from './types'

const mapRow = (thumbs: Record<string, string>) => (a: GtRow): AdRow => ({
  name: a.n,
  thumb: thumbs[a.n] || '',
  impressions: a.impr,
  reach: a.reach,
  linkClicks: a.lc,
  lpViews: a.lp,
  leads: a.lead,
  checkout: a.ic,
  purchases: a.pur,
  revenue: a.rev,
  spend: a.spend,
})

export function goldenAgg(
  imersao: string,
  thumbs: Record<string, string> = {}
): { ads: AdRow[]; adsets: AdsetRow[] } {
  const g = GOLDEN_TICKET[imersao]
  if (!g) return { ads: [], adsets: [] }
  const map = mapRow(thumbs)
  const bySpend = (a: { spend: number }, b: { spend: number }): number => b.spend - a.spend
  return {
    ads: (g.byAd || []).map(map).sort(bySpend),
    adsets: (g.byAdset || []).map(map).sort(bySpend),
  }
}
