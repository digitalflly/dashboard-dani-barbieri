// ============================================================
// Native lead sheets (Google Sheets CSV) — volume/day + faixa de
// faturamento for the Aplicação Direta and Isca funnels.
// Ported from fetchAplicLeads / fetchIscaLeads in Dashboard.dc.html.
// ============================================================

import { parseCSV } from './sheets'
import { SHEET_ID } from './constants'

// planilha de leads da Aplicação Direta — volume por dia + faixa de faturamento
export async function fetchAplicLeads(): Promise<{ by: Record<string, number>; rows: { date: string; faixa: string }[] }> {
  const url =
    'https://docs.google.com/spreadsheets/d/10x1BkVrMMnhKODfU0J8_J2JB2sYLlsMbQNNXWTGDMuc/export?format=csv&gid=1528543515&_cb=' +
    Date.now()
  const r = await fetch(url, { cache: 'no-store' })
  if (!r.ok) throw new Error('Planilha HTTP ' + r.status)
  const rows = parseCSV(await r.text())
  if (!rows.length) throw new Error('vazia')
  const head = rows[0].map((h) => String(h || '').toLowerCase().trim())
  const ci = head.findIndex((h) => /created.?time/.test(h))
  const col = ci >= 0 ? ci : 1
  const fi = head.findIndex((h) => /faturamento/.test(h))
  const by: Record<string, number> = {}
  const rowsF: { date: string; faixa: string }[] = []
  rows.slice(1).forEach((rw) => {
    const v = String(rw[col] || '')
    const m = v.match(/(\d{4})-(\d{2})-(\d{2})/)
    if (m) {
      const d = m[1] + '-' + m[2] + '-' + m[3]
      by[d] = (by[d] || 0) + 1
      rowsF.push({ date: d, faixa: fi >= 0 ? String(rw[fi] || '').trim() : '' })
    }
  })
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
