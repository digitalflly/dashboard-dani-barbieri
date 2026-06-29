// ============================================================
// Date helpers (UTC) + deterministic RNG
// Ported verbatim from Dashboard.dc.html so generated demo data
// and ISO-week math stay byte-identical.
// ============================================================

export const MONTH_NAMES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** Mulberry32-style seeded PRNG returning a function of () => [0,1). */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function ymd(d: Date): string {
  return (
    d.getUTCFullYear() +
    '-' +
    String(d.getUTCMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getUTCDate()).padStart(2, '0')
  )
}

export function parse(s: string): Date {
  const p = s.split('-').map(Number)
  return new Date(Date.UTC(p[0], p[1] - 1, p[2]))
}

export function addDays(s: string, n: number): string {
  const d = parse(s)
  d.setUTCDate(d.getUTCDate() + n)
  return ymd(d)
}

export function isoWeek(s: string): { year: number; week: number } {
  const d = parse(s)
  const day = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - day + 3)
  const ft = new Date(Date.UTC(d.getUTCFullYear(), 0, 4))
  const w = 1 + Math.round(((d.getTime() - ft.getTime()) / 86400000 - 3 + ((ft.getUTCDay() + 6) % 7)) / 7)
  return { year: d.getUTCFullYear(), week: w }
}

export function monday(s: string): string {
  const d = parse(s)
  const day = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - day)
  return ymd(d)
}

export function ddmm(s: string): string {
  const p = s.split('-')
  return p[2] + '/' + p[1]
}

// último dia do mês ym ("YYYY-MM") como "YYYY-MM-DD"
export function lastDayOf(ym: string): string {
  const y = +ym.slice(0, 4)
  const m = +ym.slice(5, 7)
  return ym + '-' + String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, '0')
}

// intervalo padrão dos funis: mês atual + 2 meses anteriores, limitado ao período disponível
export function defaultFunnelRange(
  minD: string | null,
  maxD: string | null
): { from: string; to: string } {
  const t = new Date()
  const y = t.getFullYear()
  const m = t.getMonth()
  const pad = (n: number): string => String(n).padStart(2, '0')
  const first = new Date(Date.UTC(y, m - 2, 1))
  const last = new Date(Date.UTC(y, m + 1, 0))
  const iso = (d: Date): string =>
    d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate())
  let from = iso(first)
  let to = iso(last)
  if (minD && from < minD) from = minD
  if (maxD && to > maxD) to = maxD
  return { from, to }
}
