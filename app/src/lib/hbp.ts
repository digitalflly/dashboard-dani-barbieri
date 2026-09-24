// ============================================================
// Live HBP sales (Google Sheet "vendas"). The current month and the
// previous month are read live from the sheet and merged over the
// frozen RESULTADOS_VENDAS snapshot; older months stay frozen.
// Ported from fetchVendasHBP() / hbpWindow() in Dashboard.dc.html.
// ============================================================

import { parseCSV } from './sheets'
import type { ResVendaMes } from './resultadosVendasData'

// [mês anterior, mês atual] em YYYY-MM
export function hbpWindow(): [string, string] {
  const d = new Date()
  const cur = d.toISOString().slice(0, 7)
  const p = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)).toISOString().slice(0, 7)
  return [p, cur]
}

const KNOWN = ['golden ticket', 'sessão premium', 'aplicação direta', 'diagnóstico']

const parseNum = (v: unknown): number => {
  let s = String(v || '').replace(/[^\d.,-]/g, '')
  if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.')
  else s = s.replace(/[.,](?=\d{3}(\D|$))/g, '')
  const n = parseFloat(s)
  return isNaN(n) ? 0 : n
}

export async function fetchVendasHBP(): Promise<Record<string, ResVendaMes>> {
  const url = 'https://docs.google.com/spreadsheets/d/1jPnVK6OHycOXFRWqwoB54PKZL86wvjUa--SfMoiVQWI/export?format=csv&_cb=' + Date.now()
  const r = await fetch(url, { cache: 'no-store' })
  if (!r.ok) throw new Error('HTTP ' + r.status)
  const rows = parseCSV(await r.text())
  if (rows.length < 2) throw new Error('vazia')
  const H = rows[0].map((h) => String(h || '').toLowerCase().trim())
  let cD = H.findIndex((h) => /^data|date/.test(h))
  if (cD < 0) cD = 1
  let cF = H.findIndex((h) => /funil|origem/.test(h))
  if (cF < 0) cF = 2
  let cV = H.findIndex((h) => /valor|pre[çc]o|ticket|fatur/.test(h))
  if (cV < 0) cV = 3
  const win = hbpWindow()
  const out: Record<string, ResVendaMes> = {}
  win.forEach((ym) => (out[ym] = { vendas: 0, fat: 0, byFunil: {} }))
  rows.slice(1).forEach((rw) => {
    const v = String(rw[cD] || '').trim()
    let ym: string | null = null
    let m: RegExpMatchArray | null
    if ((m = v.match(/(\d{4})-(\d{2})-\d{2}/))) ym = m[1] + '-' + m[2]
    else if ((m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/))) ym = m[3] + '-' + String(m[1]).padStart(2, '0')
    if (!ym || !out[ym]) return
    const parts = String(rw[cF] || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean)
    const f = parts.find((p) => KNOWN.indexOf(p) >= 0) || parts[0] || ''
    const val = parseNum(rw[cV])
    const o = out[ym]
    o.vendas++
    o.fat += val
    const b = o.byFunil[f] || (o.byFunil[f] = { c: 0, rev: 0 })
    b.c++
    b.rev += val
  })
  return out
}
