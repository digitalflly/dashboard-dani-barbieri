// ============================================================
// Demo / snapshot data generator — the offline source of truth.
// Ported verbatim from genRaw() in Dashboard.dc.html.
// ============================================================

import { rng, parse, addDays } from './dates'
import type { RawData, DailyRow, FollowRow, MediaPost } from './types'

export function genRaw(): RawData {
  const rnd = rng(20260621)
  const start = '2026-05-04'
  const end = '2026-06-21'
  const days: string[] = []
  let cur = start
  while (cur <= end) {
    days.push(cur)
    cur = addDays(cur, 1)
  }
  const N = days.length
  const daily: DailyRow[] = []
  const follows: FollowRow[] = []
  days.forEach((date, i) => {
    const dow = (parse(date).getUTCDay() + 6) % 7 // Mon0
    const wkMult = dow >= 5 ? 0.86 : 1.0
    const reach = Math.round((8200 + i * 70) * wkMult * (0.82 + 0.34 * rnd()))
    const views = Math.round(reach * (1.5 + 0.8 * rnd()))
    const interactions = Math.round(reach * (0.042 + 0.03 * rnd()))
    const likes = Math.round(interactions * (0.6 + 0.06 * rnd()))
    const comments = Math.round(interactions * (0.06 + 0.03 * rnd()))
    const shares = Math.round(interactions * (0.11 + 0.06 * rnd()))
    let saves = interactions - likes - comments - shares
    if (saves < 0) saves = Math.round(interactions * 0.1)
    const apuracao = i >= N - 2 // last 2 days em apuração
    const taps = apuracao ? null : Math.round(reach * (0.007 + 0.006 * rnd()))
    const net = apuracao ? null : Math.round(-12 + 150 * rnd() * rnd())
    daily.push({ date, views, reach, interactions, taps, shares, likes, comments, saves })
    follows.push({ date, net })
  })

  // media posts
  const caps = [
    'Couro curtido em Minas, dobrado à mão',
    'Bastidores do atelier nesta manhã',
    'Nova coleção Voyage — primeiras peças',
    'O tempo que cada peça precisa',
    'Processo de costura, ponto a ponto',
    'Café & conversa sobre ofício',
    'Detalhe da fivela em bronze escovado',
    'Da prancha de corte à peça final',
    'Edição limitada — apenas 12 unidades',
    'Como cuidamos do couro vegetal',
    'Pequenas marcas que contam história',
    'Encomenda especial entregue hoje',
    'Voltamos com o tom terroso de sempre',
    'Teste de textura para a próxima linha',
    'Um domingo lento no ateliê',
    'Pespontos que levam horas',
  ]
  const types = [
    'REELS', 'REELS', 'CAROUSEL_ALBUM', 'IMAGE', 'REELS', 'CAROUSEL_ALBUM', 'REELS', 'IMAGE',
    'CAROUSEL_ALBUM', 'REELS', 'REELS', 'IMAGE', 'CAROUSEL_ALBUM', 'REELS', 'REELS', 'IMAGE',
  ]
  const media: MediaPost[] = []
  const mr = rng(77731)
  const offsets = [1, 3, 5]
  let k = 0
  for (let wStart = 0; wStart < N; wStart += 7) {
    for (let j = 0; j < offsets.length; j++) {
      const di = wStart + offsets[j]
      if (di >= N) break
      const date = days[di]
      const type = types[k % types.length]
      const isTest = k === 4 || k === 13
      let reach: number
      if (isTest) reach = 120 + Math.round(mr() * 340)
      else if (type === 'REELS') reach = 6000 + Math.round(mr() * 34000)
      else reach = 3200 + Math.round(mr() * 14000)
      const viewMult = type === 'REELS' ? 1.6 + mr() * 1.4 : 1.02 + mr() * 0.18
      const views = Math.round(reach * viewMult)
      const baseEng = reach * (0.05 + 0.05 * mr())
      const likes = Math.round(baseEng * (0.62 + 0.06 * mr()))
      const comments = Math.round(baseEng * (0.05 + 0.04 * mr()))
      const shares = Math.round(baseEng * (0.1 + 0.08 * mr()))
      const saves = Math.round(baseEng * (0.12 + 0.1 * mr()))
      const eng = likes + comments + shares + saves
      media.push({
        id: 'p' + k,
        ts: date,
        type,
        likes,
        comments,
        shares,
        saves,
        views,
        reach,
        eng,
        caption: caps[k % caps.length],
        coverIdx: k,
      })
      k++
    }
  }

  return {
    profile: { name: 'Danielle Barbieri', handle: 'danibarbieribeauty', initial: 'D', followers: 38243 },
    daily,
    follows,
    media,
  }
}
