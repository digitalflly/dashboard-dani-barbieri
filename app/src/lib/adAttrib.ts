// ============================================================
// Atribuição de leads das planilhas aos anúncios do Facebook Ads
// (Windsor), para o % MQL por anúncio do funil de Aplicação Direta.
//
// Ordem de resolução de cada lead:
//  1. ad_id (planilha nativa da Meta) → nome atual do anúncio;
//  2. conjunto (adset_id da Meta / utm_term do Respondi) + nome do
//     anúncio (ad_name / utm_content): igual após normalizar, ou o
//     mais parecido dentro do conjunto (tolera "— Cópia" e nomes
//     antigos/com erro de digitação);
//  3. sem conjunto: nome igual após normalizar, ou muito parecido.
// Se o lead traz ad_id ou conjunto que não está entre os anúncios do
// funil (ex.: campanha de outro nome), ele não é atribuído — melhor
// ficar de fora do que cair no anúncio errado por semelhança de nome.
// O nome devolvido é o mesmo da linha da tabela de anúncios (a
// tabela agrega por nome).
// ============================================================

import type { AdDailyRow } from './types'
import { faixaGroup } from './acomp'

export interface LeadAdRef {
  adId?: string
  adName?: string
  adsetId?: string
}

// MQL = faixa de faturamento ≥ R$ 15 mil (A, B, D ou "15 a 50 mil") e perfil ok
// — mesma regra da aba Acompanhamento.
const FAIXA_MQL = ['A', 'B', 'D', 'AB']
export function isMqlLead(r: { faixa: string; perfilOk?: boolean }): boolean {
  const g = faixaGroup(r.faixa)
  return !!g && FAIXA_MQL.indexOf(g) >= 0 && r.perfilOk !== false
}

export function normAdName(s: string): string {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\bcopia\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function lev(a: string, b: string): number {
  if (a === b) return 0
  const m = a.length
  const n = b.length
  if (!m || !n) return m || n
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const cur = [i]
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = cur
  }
  return prev[n]
}
// a planilha da Meta grava ids com prefixo (ex.: "ag:1202…"); o Respondi às vezes
// corrompe o utm_term em notação científica ("1,2025E+17") — aí não há id válido
const idOf = (s?: string): string => (String(s || '').match(/\d{12,}/) || [''])[0]

const sim = (a: string, b: string): number => 1 - lev(a, b) / Math.max(a.length, b.length, 1)

interface Cand {
  name: string
  norm: string
  impr: number
}

// monta o resolvedor a partir das linhas diárias do Windsor (todas as datas do funil)
export function buildAdResolver(rows: AdDailyRow[]): (ref: LeadAdRef) => string | null {
  const byId: Record<string, { name: string; date: string }> = {}
  const byName: Record<string, Cand> = {}
  const bySet: Record<string, Record<string, Cand>> = {}
  rows.forEach((r) => {
    if (!r.ad) return
    // nome mais recente de cada ad_id (anúncios renomeados)
    if (r.adId && (!byId[r.adId] || r.date >= byId[r.adId].date)) byId[r.adId] = { name: r.ad, date: r.date }
    const c = byName[r.ad] || (byName[r.ad] = { name: r.ad, norm: normAdName(r.ad), impr: 0 })
    c.impr += r.impressions
    if (r.adsetId) {
      const s = bySet[r.adsetId] || (bySet[r.adsetId] = {})
      s[r.ad] = c
    }
  })
  const all = Object.values(byName)
  const best = (n: string, cands: Cand[], min: number): string | null => {
    const exact = cands.filter((c) => c.norm === n).sort((a, b) => b.impr - a.impr)
    if (exact.length) return exact[0].name
    let top: Cand | null = null
    let topS = 0
    cands.forEach((c) => {
      const s = sim(n, c.norm)
      if (s > topS || (s === topS && top && c.impr > top.impr)) {
        top = c
        topS = s
      }
    })
    return top && topS >= min ? (top as Cand).name : null
  }
  const cache: Record<string, string | null> = {}
  return (ref: LeadAdRef): string | null => {
    const adId = idOf(ref.adId)
    if (adId) return byId[adId] ? byId[adId].name : null // id fora do funil: não atribui
    const n = normAdName(ref.adName || '')
    if (!n) return null
    const setId = idOf(ref.adsetId)
    const key = setId + '|' + n
    if (key in cache) return cache[key]
    let out: string | null
    if (setId) out = bySet[setId] ? best(n, Object.values(bySet[setId]), 0.75) : null // conjunto fora do funil
    else out = best(n, all, 0.9)
    cache[key] = out
    return out
  }
}
