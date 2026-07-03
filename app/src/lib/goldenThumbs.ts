// ============================================================
// Golden Ticket — capas + links dos anúncios. Busca as thumbnails
// e o instagram_permalink_url no conector Windsor (por janela de
// imersão), embute a capa como JPEG reduzido (canvas) e cacheia
// tudo no localStorage. As capas continuam aparecendo após as URLs
// assinadas do Facebook expirarem; o link abre o post no Instagram.
// Ported de fetchGoldenThumbs()/embedImg() em Dashboard.dc.html.
// ============================================================

import { WINDSOR_KEY } from './constants'
import { GOLDEN_TICKET } from './goldenTicketData'

// mapa: imersão -> { nome do anúncio -> dataURL | permalink }
export type GtThumbs = Record<string, Record<string, string>>
export type GtLinks = Record<string, Record<string, string>>

const LS_THUMBS = 'gt_thumbs_v1'
const LS_LINKS = 'gt_links_v1'

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

const loadLS = (k: string): Record<string, Record<string, string>> => {
  try {
    return JSON.parse(localStorage.getItem(k) || '{}')
  } catch {
    return {}
  }
}
const saveLS = (k: string, map: Record<string, Record<string, string>>): void => {
  try {
    localStorage.setItem(k, JSON.stringify(map || {}))
  } catch {
    /* quota / indisponível — ignora */
  }
}

export const loadGtThumbs = (): GtThumbs => loadLS(LS_THUMBS)
export const saveGtThumbs = (map: GtThumbs): void => saveLS(LS_THUMBS, map)
export const loadGtLinks = (): GtLinks => loadLS(LS_LINKS)
export const saveGtLinks = (map: GtLinks): void => saveLS(LS_LINKS, map)

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

// true se ainda faltam capas OU links para a imersão
export function needsGtAssets(
  imersao: string,
  haveThumbs: Record<string, string>,
  haveLinks: Record<string, string>
): boolean {
  const g = GOLDEN_TICKET[imersao]
  if (!g) return false
  return (g.byAd || []).some((a) => !haveThumbs[a.n] || !haveLinks[a.n])
}

// busca capas + links faltantes; retorna os mapas mesclados da imersão, ou null se nada mudou
export async function fetchGoldenAssets(
  imersao: string,
  haveThumbs: Record<string, string>,
  haveLinks: Record<string, string>
): Promise<{ thumbs: Record<string, string>; links: Record<string, string> } | null> {
  const win = GT_WIN[imersao]
  const re = GT_RE[imersao]
  const g = GOLDEN_TICKET[imersao]
  if (!win || !re || !g) return null
  try {
    const fields = encodeURIComponent('campaign,ad_name,thumbnail_url,instagram_permalink_url,spend')
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
      (x: Record<string, unknown>) => re.test((x.campaign as string) || '')
    )
    // melhor peça por anúncio = a de maior gasto (para capa e link)
    const best: Record<string, { url: string; permalink: string; sp: number }> = {}
    rows.forEach((x) => {
      const n = (x.ad_name as string) || '(sem nome)'
      const sp = +(x.spend as number) || 0
      if (!best[n] || sp > best[n].sp) {
        best[n] = {
          url: (x.thumbnail_url as string) || best[n]?.url || '',
          permalink: (x.instagram_permalink_url as string) || best[n]?.permalink || '',
          sp,
        }
      }
    })

    // links: mescla os já cacheados com os novos (baratos, sem download)
    const links: Record<string, string> = { ...haveLinks }
    let linksChanged = false
    Object.keys(best).forEach((n) => {
      if (best[n].permalink && !links[n]) {
        links[n] = best[n].permalink
        linksChanged = true
      }
    })

    // capas: embute as que ainda faltam (com thumbnail_url disponível)
    const thumbs: Record<string, string> = { ...haveThumbs }
    const names = Object.keys(best).filter((n) => !thumbs[n] && best[n].url)
    let thumbsChanged = false
    let i = 0
    const worker = async (): Promise<void> => {
      while (i < names.length) {
        const n = names[i++]
        const d = await embedImg(best[n].url)
        if (d) {
          thumbs[n] = d
          thumbsChanged = true
        }
      }
    }
    await Promise.all([worker(), worker(), worker(), worker(), worker(), worker()])

    if (!thumbsChanged && !linksChanged) return null
    return { thumbs, links }
  } catch {
    return null
  }
}
