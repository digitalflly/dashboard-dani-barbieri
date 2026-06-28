// ============================================================
// Durable post / cover cache (localStorage).
// First load seeds history; later refreshes fetch only the last
// 30 days and merge. Covers from Jan/2026 are downloaded and
// embedded as small JPEG data-URLs so they survive the expiry of
// Instagram's signed CDN URLs.
// Ported from saveCache / embedCover / persistCovers.
// ============================================================

import type { MediaPost } from './types'

interface CacheBlob {
  posts: MediaPost[]
  savedAt: string
}

export function readCache(ckey: string): { cached: MediaPost[]; seeded: boolean } {
  let cached: MediaPost[] = []
  let seeded = false
  try {
    const raw = localStorage.getItem(ckey)
    if (raw) {
      const o = JSON.parse(raw) as CacheBlob
      if (o && Array.isArray(o.posts)) {
        cached = o.posts
        seeded = o.posts.length > 0
      }
    }
  } catch {
    /* ignore */
  }
  return { cached, seeded }
}

// grava o cache; se estourar a cota, regrava sem as capas embutidas
export function saveCache(ckey: string, media: MediaPost[], savedAt: string): boolean {
  try {
    localStorage.setItem(ckey, JSON.stringify({ posts: media, savedAt }))
    return true
  } catch {
    try {
      localStorage.setItem(
        ckey,
        JSON.stringify({
          posts: media.map((p) => {
            const q = { ...p }
            delete q.coverData
            return q
          }),
          savedAt,
        })
      )
    } catch {
      /* ignore */
    }
    return false
  }
}

// baixa uma imagem e devolve um JPEG reduzido como data URL (ou null)
export function embedCover(url: string): Promise<string | null> {
  return new Promise((res) => {
    if (!url || !/^https?:/.test(url)) return res(null)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    let done = false
    const finish = (v: string | null) => {
      if (!done) {
        done = true
        res(v)
      }
    }
    const to = setTimeout(() => finish(null), 12000)
    img.onload = () => {
      clearTimeout(to)
      try {
        const max = 240
        let w = img.naturalWidth || max
        let h = img.naturalHeight || max
        const s = Math.min(1, max / Math.max(w, h))
        w = Math.max(1, Math.round(w * s))
        h = Math.max(1, Math.round(h * s))
        const c = document.createElement('canvas')
        c.width = w
        c.height = h
        c.getContext('2d')!.drawImage(img, 0, 0, w, h)
        finish(c.toDataURL('image/jpeg', 0.7))
      } catch {
        finish(null)
      }
    }
    img.onerror = () => {
      clearTimeout(to)
      finish(null)
    }
    img.src = url
  })
}

// embute, em background, as capas dos posts desde jan/2026 ainda não guardadas
export async function persistCovers(
  media: MediaPost[],
  ckey: string,
  savedAt: string,
  onProgress?: () => void
): Promise<void> {
  const SINCE = '2026-01-01'
  const targets = media.filter((p) => p && p.ts >= SINCE && !p.coverData && (p.thumb || p.cover))
  if (!targets.length) return
  let i = 0
  const conc = 6
  const work = async () => {
    while (i < targets.length) {
      const p = targets[i++]
      const d = await embedCover((p.thumb || p.cover) as string)
      if (d) p.coverData = d
    }
  }
  await Promise.all(Array.from({ length: conc }, work))
  if (onProgress) onProgress()
  saveCache(ckey, media, savedAt)
}
