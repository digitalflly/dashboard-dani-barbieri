// ============================================================
// Number / percentage / delta formatting (pt-BR)
// ============================================================

export function fmtNum(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—'
  return new Intl.NumberFormat('pt-BR').format(Math.round(n))
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null || isNaN(n) || !isFinite(n)) return '—'
  return (
    n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'
  )
}

export interface Delta {
  text: string
  color: string
  sub: string
}

export function delta(cur: number | null, prev: number | null): Delta {
  if (prev == null || prev === 0) return { text: '—', color: 'var(--ink-300)', sub: '' }
  if (cur == null) return { text: '—', color: 'var(--ink-300)', sub: '' }
  const v = ((cur - prev) / prev) * 100
  const up = v >= 0
  return {
    text: (up ? '▲ ' : '▼ ') + fmtPct(Math.abs(v)),
    color: up ? 'var(--success)' : 'var(--danger)',
    sub: '',
  }
}
