// ============================================================
// Google Sheet (lead forms) — one tab per funnel, read live as CSV.
// Ported from parseCSV / parseRowDate / fetchFunnel.
// ============================================================

import { MONTH_NAMES } from './dates'
import { SHEET_ID, FUNNELS } from './constants'
import type { FunnelSpec, FunnelData, MonthDef } from './types'

export function funnelSpec(key: string): FunnelSpec | undefined {
  return FUNNELS.find((f) => f.key === key)
}

export function parseCSV(txt: string): string[][] {
  const rows: string[][] = []
  let cur: string[] = []
  let val = ''
  let q = false
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i]
    if (q) {
      if (c === '"') {
        if (txt[i + 1] === '"') {
          val += '"'
          i++
        } else q = false
      } else val += c
    } else {
      if (c === '"') q = true
      else if (c === ',') {
        cur.push(val)
        val = ''
      } else if (c === '\r') {
        /* skip */
      } else if (c === '\n') {
        cur.push(val)
        rows.push(cur)
        cur = []
        val = ''
      } else val += c
    }
  }
  if (val.length || cur.length) {
    cur.push(val)
    rows.push(cur)
  }
  return rows
}

export function parseRowDate(s: string): string | null {
  const m = String(s || '').match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (m) return m[3] + '-' + m[2] + '-' + m[1]
  const m2 = String(s || '').match(/(\d{4})-(\d{2})-(\d{2})/)
  return m2 ? m2[0] : null
}

export async function fetchFunnel(key: string): Promise<FunnelData> {
  const spec = funnelSpec(key)
  if (!spec) throw new Error('Funil desconhecido: ' + key)
  const url =
    'https://docs.google.com/spreadsheets/d/' +
    SHEET_ID +
    '/export?format=csv&gid=' +
    spec.gid +
    '&_cb=' +
    Date.now()
  const r = await fetch(url, { cache: 'no-store' })
  if (!r.ok) throw new Error('Planilha HTTP ' + r.status)
  const rows = parseCSV(await r.text())
  // considera apenas linhas com STATUS FORMULÁRIO preenchido
  const body = rows
    .slice(1)
    .filter((r) => r.length >= 4 && (r[1] || '').trim() && (r[spec.statusCol] || '').trim())
  // meta de datas para os filtros
  let minD: string | null = null
  let maxD: string | null = null
  const monthSet: Record<string, boolean> = {}
  body.forEach((r) => {
    const d = parseRowDate(r[spec.dateCol])
    if (!d) return
    if (!minD || d < minD) minD = d
    if (!maxD || d > maxD) maxD = d
    monthSet[d.slice(0, 7)] = true
  })
  const months: MonthDef[] = Object.keys(monthSet)
    .sort()
    .map((ym) => ({ value: ym, label: MONTH_NAMES[+ym.slice(5, 7) - 1] + ' ' + ym.slice(0, 4) }))
  return { rows: body, minD, maxD, months }
}
