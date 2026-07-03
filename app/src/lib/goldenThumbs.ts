// ============================================================
// Golden Ticket — capas dos anúncios. Busca as thumbnails no
// conector Windsor (por janela de imersão), embute como JPEG
// reduzido (canvas) e cacheia no localStorage, para continuarem
// aparecendo após as URLs assinadas do Facebook expirarem.
// Ported de fetchGoldenThumbs()/embedImg() em Dashboard.dc.html.
// ============================================================

import { WINDSOR_KEY } from './constants'
import { GOLDEN_TICKET } from './goldenTicketData'

// mapa: imersão -> { nome do anúncio -> dataURL }
export type GtThumbs = Record<string, Record<string, string>>

const LS_KEY = 'gt_thumbs_v1'

const GT_WIN: Record<string, [string, string]> = {
  ieb: ['2025-06-01', '2025-08-31'],
  amb: ['2025-12-01', '2026-01-31'],
  nea: ['2026-06-01', '2026-06-30'],
}
const GT_RE: Record<string, RegExp> = {
  ieb: /\[IEB\]/i,
  amb: /\[AMB\]/i,
  nea: /\[NEA\]/i,
}

export function loadGtThumbs(): GtThumbs {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}')
  } catch {
    return {}
  }
}
export function saveGtThumbs(map: GtThumbs): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(map || {}))
  } catch {
    /* quota / indisponível — ignora */
  }
}

// baixa a imagem e a embute como JPEG reduzido (máx. 150px); null se falhar/tainted
function embedImg(url: string): Promise<string | null> {
  return new Promise((res) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    let done = false
    const to = setTimeout(() => {
      if (!done) {
        done = true
        res(null)
      }
    }, 8000)
    img.onload = () => {
      if (done) return
      done = true
      clearTimeout(to)
      try {
        const s = Math.min(1, 150 / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * s))
        const h = Math.max(1, Math.round(img.height * s))
        const c = document.createElement('canvas')
        c.width = w
        c.height = h
        c.getContext('2d')!.drawImage(img, 0, 0, w, h)
        res(c.toDataURL('image/jpeg', 0.62))
      } catch {
        res(null)
      }
    }
    img.onerror = () => {
      if (done) return
      done = true
      clearTimeout(to)
      res(null)
    }
    img.src = url
  })
}

// true se ainda faltam capas para a imersão
export function needsGtThumbs(imersao: string, have: Record<string, string>): boolean {
  const g = GOLDEN_TICKET[imersao]
  if (!g) return false
  return (g.byAd || []).some((a) => !have[a.n])
}

// busca as capas faltantes; retorna o mapa da imersão (have + novas) ou null se nada mudou
export async function fetchGoldenThumbs(
  imersao: string,
  have: Record<string, string>
): Promise<Record<string, string> | null> {
  const win = GT_WIN[imersao]
  const re = GT_RE[imersao]
  const g = GOLDEN_TICKET[imersao]
  if (!win || !re || !g) return null
  try {
    const fields = encodeURIComponent('campaign,ad_name,thumbnail_url,spend')
    const url =
      'https://connectors.windsor.ai/facebook?api_key=' +
      WINDSOR_KEY +
      '&date_from=' +
      win[0] +
      '&date_to=' +
      win[1] +
      '&fields=' +
      fields +
      '&_cb=' +
      Date.now()
    const r = await fetch(url, { cache: 'no-store' })
    const jj = await r.json()
    const rows: Record<string, unknown>[] = (jj.data || []).filter(
      (x: Record<string, unknown>) => re.test((x.campaign as string) || '') && x.thumbnail_url
    )
    // melhor thumbnail por anúncio = a de maior gasto
    const best: Record<string, { url: string; sp: number }> = {}
    rows.forEach((x) => {
      const n = (x.ad_name as string) || '(sem nome)'
      const sp = +(x.spend as number) || 0
      if (!best[n] || sp > best[n].sp) best[n] = { url: x.thumbnail_url as string, sp }
    })
    const map: Record<string, string> = { ...have }
    const names = Object.keys(best).filter((n) => !map[n])
    if (!names.length) return null
    let i = 0
    const worker = async (): Promise<void> => {
      while (i < names.length) {
        const n = names[i++]
        const d = await embedImg(best[n].url)
        if (d) map[n] = d
      }
    }
    await Promise.all([worker(), worker(), worker(), worker(), worker(), worker()])
    return map
  } catch {
    return null
  }
}
