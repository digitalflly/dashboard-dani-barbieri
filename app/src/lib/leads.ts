// ============================================================
// Native lead sheets (Google Sheets CSV) — volume/day + faixa de
// faturamento for the Aplicação Direta and Isca funnels.
// Ported from fetchAplicLeads / fetchIscaLeads in Dashboard.dc.html.
// ============================================================

import { parseCSV } from './sheets'
import { SHEET_ID } from './constants'

// planilha de leads da Aplicação Direta — volume por dia + faixa de faturamento.
// A partir de 2026-07-28 usa as planilhas novas (form nativo, sem cabeçalho);
// antes disso, a planilha antiga. Dedupe por id, ignora leads de teste.
export async function fetchAplicLeads(): Promise<{ by: Record<string, number>; rows: { date: string; faixa: string }[] }> {
  const CUT = '2026-07-28'
  const OLD_GID = '1528543515'
  const NEW_GIDS = ['2053208403', '295805099', '1933064365']
  const FAIXA_RE = /^(abaixo_de_8_mil|8_a_15_mil|abaixo_de_15_mil|15_a_50_mil|50_a_100_mil|100_a_200_mil|200_a_500_mil|acima_de_500_mil)$/i
  const findFaixa = (rw: string[]): string => {
    for (const c of rw) {
      const v = String(c || '').toLowerCase().trim()
      if (FAIXA_RE.test(v)) return v
    }
    return ''
  }
  const load = async (gid: string): Promise<{ id: string; date: string; faixa: string }[]> => {
    const url = 'https://docs.google.com/spreadsheets/d/10x1BkVrMMnhKODfU0J8_J2JB2sYLlsMbQNNXWTGDMuc/export?format=csv&gid=' + gid + '&_cb=' + Date.now()
    const r = await fetch(url, { cache: 'no-store' })
    if (!r.ok) throw new Error('Planilha HTTP ' + r.status)
    const rows = parseCSV(await r.text())
    if (!rows.length) return []
    const h0 = rows[0].map((h) => String(h || '').toLowerCase().trim())
    const hasHeader = h0.some((h) => /created.?time/.test(h))
    let ci: number
    let idc: number
    let body: string[][]
    if (hasHeader) {
      ci = h0.findIndex((h) => /created.?time/.test(h))
      if (ci < 0) ci = 1
      idc = h0.findIndex((h) => /^id$/.test(h))
      body = rows.slice(1)
    } else {
      ci = 1
      idc = 0
      body = rows // layout do form nativo (sem cabeçalho)
    }
    const out: { id: string; date: string; faixa: string }[] = []
    body.forEach((rw) => {
      const joined = rw.join(' ').toLowerCase()
      if (/test lead|<test|test@meta\.com/.test(joined)) return // ignora leads de teste
      const v = String(rw[ci] || '')
      const m = v.match(/(\d{4})-(\d{2})-(\d{2})/)
      if (m) out.push({ id: String(rw[idc >= 0 ? idc : 0] || ''), date: m[1] + '-' + m[2] + '-' + m[3], faixa: findFaixa(rw) })
    })
    return out
  }
  const results = await Promise.all([load(OLD_GID), ...NEW_GIDS.map(load)])
  const oldRows = results[0]
  const newRows = ([] as { id: string; date: string; faixa: string }[]).concat(...results.slice(1))
  // dedupe novos por id, mantém >= CUT; antigos ficam < CUT
  const seen = new Set<string>()
  const newDedup: { id: string; date: string; faixa: string }[] = []
  newRows.forEach((r) => {
    if (r.date < CUT) return
    const k = r.id || r.date + '|' + r.faixa
    if (seen.has(k)) return
    seen.add(k)
    newDedup.push(r)
  })
  const rowsF = [...oldRows.filter((r) => r.date < CUT), ...newDedup].map((r) => ({ date: r.date, faixa: r.faixa }))
  const by: Record<string, number> = {}
  rowsF.forEach((r) => { by[r.date] = (by[r.date] || 0) + 1 })
  return { by, rows: rowsF }
}

// planilha de leads (aba 1) do funil Isca — volume por dia
export async function fetchIscaLeads(): Promise<{ by: Record<string, number> }> {
  const url = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/export?format=csv&gid=1031730554&_cb=' + Date.now()
  const r = await fetch(url, { cache: 'no-store' })
  if (!r.ok) throw new Error('Planilha HTTP ' + r.status)
  const rows = parseCSV(await r.text())
  if (!rows.length) throw new Error('vazia')
  const head = rows[0].map((h) => String(h || '').toLowerCase().trim())
  let ci = head.findIndex((h) => /created.?time|data|date|carimbo|timestamp/.test(h))
  if (ci < 0) ci = 0
  const by: Record<string, number> = {}
  rows.slice(1).forEach((rw) => {
    const v = String(rw[ci] || '')
    let d: string | null = null
    const m = v.match(/(\d{4})-(\d{2})-(\d{2})/)
    if (m) d = m[1] + '-' + m[2] + '-' + m[3]
    else {
      const b = v.match(/(\d{2})\/(\d{2})\/(\d{4})/)
      if (b) d = b[3] + '-' + b[2] + '-' + b[1]
    }
    if (d) by[d] = (by[d] || 0) + 1
  })
  return { by }
}
