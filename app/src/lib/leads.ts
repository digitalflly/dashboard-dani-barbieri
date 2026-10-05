// ============================================================
// Native lead sheets (Google Sheets CSV/HTML) for the funnels.
// Aplicação Direta merges every tab of the lead sheet (gids
// discovered from the htmlview) + the external "Respondi" form,
// dedupes by id, reads row colors (orange = will be scheduled,
// green = closed) and flags MQL profile. Ported from
// fetchAplicLeads() / fetchIscaLeads() in Dashboard.dc.html.
// ============================================================

import { parseCSV } from './sheets'
import { SHEET_ID } from './constants'

export interface AplicLeadRow {
  date: string
  faixa: string
  perfilOk: boolean
  status?: string // 'ag' (laranja) | 'fe' (verde) | undefined
}

interface RawLead {
  id: string
  ts: string
  date: string
  faixa: string
  perfilOk: boolean
  status?: string
}

const SHEET = '10x1BkVrMMnhKODfU0J8_J2JB2sYLlsMbQNNXWTGDMuc'
const RESPONDI = '1JxA4fzAR_lSX8c4GP0pm_A_wJc_npKamcJHVw--wPuQ'
const FALLBACK_GIDS = ['1528543515', '2053208403', '295805099', '1933064365', '197355336']
const FAIXA_RE = /^(abaixo_de_\d+_mil|at[eé]_\d+_mil|\d+_a_\d+_mil|acima_de_\d+_mil)$/i
// perfis de saúde/estética que contam como MQL mesmo marcando área "outro"
const MED = /m[eé]dic|biom[eé]dic|dentist|harmoniza|\bhof\b|micropigment|design(?:er)? de sobrancelh|sobrancelh|fisioterap|dermato/

const norm = (s: unknown): string => String(s || '').toLowerCase().trim()
const findFaixa = (rw: string[]): string => {
  for (const c of rw) {
    const v = norm(c)
    if (FAIXA_RE.test(v)) return v
  }
  return ''
}

async function loadTab(gid: string): Promise<RawLead[]> {
  const url = 'https://docs.google.com/spreadsheets/d/' + SHEET + '/export?format=csv&gid=' + gid + '&_cb=' + Date.now()
  const r = await fetch(url, { cache: 'no-store' })
  if (!r.ok) throw new Error('Planilha HTTP ' + r.status)
  const rows = parseCSV(await r.text())
  if (!rows.length) return []
  const h0 = rows[0].map((h) => norm(h))
  const hasHeader = h0.some((h) => /created.?time/.test(h))
  let ci: number
  let idc: number
  let body: string[][]
  let cArea = -1
  let cProf = -1
  if (hasHeader) {
    ci = h0.findIndex((h) => /created.?time/.test(h))
    if (ci < 0) ci = 1
    idc = h0.findIndex((h) => /^id$/.test(h))
    cArea = h0.findIndex((h) => /rea_de_atua|area_de_atua/.test(h))
    cProf = h0.findIndex((h) => /profiss/.test(h))
    body = rows.slice(1)
  } else {
    ci = 1
    idc = 0
    body = rows
  }
  const out: RawLead[] = []
  body.forEach((rw) => {
    const joined = rw.join(' ').toLowerCase()
    if (/test lead|<test|test@meta\.com/.test(joined)) return
    const v = String(rw[ci] || '')
    // data do lead no fuso de Brasília (created_time vem em -05:00 do gerenciador)
    let date = ''
    const dt = /T\d{2}:\d{2}/.test(v) ? new Date(v) : null
    if (dt && !isNaN(dt.getTime())) {
      const b = new Date(dt.getTime() - 3 * 3600000)
      date = b.getUTCFullYear() + '-' + String(b.getUTCMonth() + 1).padStart(2, '0') + '-' + String(b.getUTCDate()).padStart(2, '0')
    } else {
      const mm = v.match(/(\d{4})-(\d{2})-(\d{2})/)
      if (mm) date = mm[1] + '-' + mm[2] + '-' + mm[3]
    }
    if (!date) return
    const area = cArea >= 0 ? norm(rw[cArea]) : ''
    const prof = cProf >= 0 ? norm(rw[cProf]) : ''
    const areaOutro = cArea >= 0 ? /^outr[oa]s?\b/.test(area) : rw.some((c) => /^outr[oa]s?$/.test(norm(c)))
    const profMed = (cProf >= 0 && MED.test(prof)) || (cArea >= 0 && MED.test(area))
    out.push({ id: String(rw[idc >= 0 ? idc : 0] || ''), ts: v, date, faixa: findFaixa(rw), perfilOk: profMed || !areaOutro })
  })
  return out
}

// cores das linhas (laranja = será agendado, verde = fechou)
function colorKind(hex: string): string {
  const h = hex.replace('#', '')
  const x = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const r = parseInt(x.slice(0, 2), 16)
  const g = parseInt(x.slice(2, 4), 16)
  const b = parseInt(x.slice(4, 6), 16)
  if (g > r + 15 && g > b + 15) return 'fe'
  if (r > 200 && g >= 90 && g <= 200 && b < 130) return 'ag'
  return ''
}

async function loadColors(gid: string): Promise<Record<string, string>> {
  const res: Record<string, string> = {}
  try {
    const t = await (await fetch('https://docs.google.com/spreadsheets/d/' + SHEET + '/htmlview/sheet?headers=true&gid=' + gid + '&_cb=' + Date.now(), { cache: 'no-store' })).text()
    const kindOf: Record<string, string> = {}
    for (const m of t.matchAll(/\.(s\d+)\{([^}]*)\}/g)) {
      const bg = (m[2].match(/background-color:\s*(#[0-9a-f]{3,6})/i) || [])[1]
      if (bg) {
        const k = colorKind(bg.toLowerCase())
        if (k) kindOf[m[1]] = k
      }
    }
    for (const tr of t.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
      const cells = [...tr[1].matchAll(/<td([^>]*)>([\s\S]*?)<\/td>/g)]
      let k = ''
      for (const c of cells) {
        const ks = ((c[1].match(/class="([^"]+)"/) || [])[1] || '').split(' ')
        const f = ks.map((z) => kindOf[z]).find(Boolean)
        if (f) {
          k = f
          if (f === 'fe') break
        }
      }
      if (!k) continue
      const txt = cells.map((c) => c[2].replace(/<[^>]+>/g, '').trim())
      const id = txt.find((z) => /^l:\d+/.test(z))
      const ts = txt.find((z) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(z))
      ;[id, ts].filter(Boolean).forEach((key) => {
        if (res[key as string] !== 'fe') res[key as string] = k
      })
    }
  } catch {
    /* ignore */
  }
  return res
}

function respondiFaixa(raw: string): string {
  const s = String(raw || '').toLowerCase().replace(/\s+/g, ' ').trim()
  if (!s) return ''
  let m: RegExpMatchArray | null
  if ((m = s.match(/(\d+)\s*a\s*(\d+)\s*mil/))) return m[1] + '_a_' + m[2] + '_mil'
  if ((m = s.match(/(?:at[eé]|abaixo de)\s*r?\$?\s*(\d+)\s*mil/))) return (/abaixo/.test(s) ? 'abaixo_de_' : 'ate_') + m[1] + '_mil'
  if ((m = s.match(/acima de\s*r?\$?\s*(\d+)\s*mil/))) return 'acima_de_' + m[1] + '_mil'
  return ''
}

async function loadRespondi(): Promise<RawLead[]> {
  const r = await fetch('https://docs.google.com/spreadsheets/d/' + RESPONDI + '/export?format=csv&gid=0&_cb=' + Date.now(), { cache: 'no-store' })
  if (!r.ok) throw new Error('Respondi HTTP ' + r.status)
  const rows = parseCSV(await r.text())
  if (!rows.length) return []
  const h = rows[0].map((x) => norm(x))
  const cD = h.findIndex((x) => /^data$/.test(x))
  const cId = h.findIndex((x) => /^id$/.test(x))
  const cF = h.findIndex((x) => /faturamento/.test(x))
  const cA = h.findIndex((x) => /rea de atua/.test(x))
  const cP = h.findIndex((x) => /profiss/.test(x))
  const out: RawLead[] = []
  rows.slice(1).forEach((rw) => {
    const d = String(rw[cD] || '').match(/(\d{4})-(\d{2})-(\d{2})/)
    if (!d) return
    if (/test/i.test(String(rw[0] || ''))) return
    const area = norm(rw[cA])
    const prof = cP >= 0 ? norm(rw[cP]) : ''
    const perfilOk = MED.test(area) || MED.test(prof) || !/^outr[oa]s?\b/.test(area)
    out.push({ id: 'r:' + String(rw[cId] || rw.join('|')), ts: String(rw[cD] || ''), date: d[1] + '-' + d[2] + '-' + d[3], faixa: respondiFaixa(rw[cF]), perfilOk })
  })
  return out
}

export async function fetchAplicLeads(): Promise<{ by: Record<string, number>; rows: AplicLeadRow[] }> {
  // descobre os gids das abas pela htmlview (abas novas entram sozinhas)
  let gids = FALLBACK_GIDS
  try {
    const ht = await (await fetch('https://docs.google.com/spreadsheets/d/' + SHEET + '/htmlview?_cb=' + Date.now(), { cache: 'no-store' })).text()
    const found = [...new Set([...ht.matchAll(/gid=(\d+)/g)].map((m) => m[1]))]
    if (found.length) gids = found
  } catch {
    /* usa o fallback */
  }
  const settled = await Promise.allSettled(gids.map(loadTab).concat([loadRespondi()]))
  const colorMaps = await Promise.all(gids.map(loadColors))
  const COLOR: Record<string, string> = Object.assign({}, ...colorMaps)
  const all: RawLead[] = ([] as RawLead[]).concat(
    ...settled.filter((s): s is PromiseFulfilledResult<RawLead[]> => s.status === 'fulfilled').map((s) => s.value)
  )
  all.forEach((r) => {
    const k = COLOR[r.id] || COLOR[r.ts] || ''
    if (k) r.status = k
  })
  // dedupe por id entre todas as abas; mantém a marcação mais avançada (fe > ag)
  const seen: Record<string, RawLead> = {}
  const rowsF: RawLead[] = []
  all.forEach((r) => {
    const k = r.id || r.date + '|' + r.faixa
    const prev = seen[k]
    if (prev) {
      if (r.status === 'fe' || (r.status === 'ag' && !prev.status)) prev.status = r.status
      return
    }
    seen[k] = r
    rowsF.push(r)
  })
  const by: Record<string, number> = {}
  rowsF.forEach((r) => { by[r.date] = (by[r.date] || 0) + 1 })
  return { by, rows: rowsF.map((r) => ({ date: r.date, faixa: r.faixa, perfilOk: r.perfilOk, status: r.status })) }
}

// planilha de leads (aba 1) do funil Isca — volume por dia
export async function fetchIscaLeads(): Promise<{ by: Record<string, number> }> {
  const url = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/export?format=csv&gid=1031730554&_cb=' + Date.now()
  const r = await fetch(url, { cache: 'no-store' })
  if (!r.ok) throw new Error('Planilha HTTP ' + r.status)
  const rows = parseCSV(await r.text())
  if (!rows.length) throw new Error('vazia')
  const head = rows[0].map((h) => norm(h))
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
