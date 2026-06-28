// ============================================================
// buildFunnel() — turns sheet rows into KPIs, volume series,
// status bars and the per-chart tallies. Ported from
// buildFunnel / bucketRevenue / bucketClients / parseRevenue /
// parseClients and the short-label helpers in Dashboard.dc.html.
// ============================================================

import { addDays, ddmm } from './dates'
import type { FunnelSpec, BuiltFunnel, BuiltChart, TallyItem } from './types'

const parseDate = (s: string): string | null => {
  const m = String(s || '').match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (m) return m[3] + '-' + m[2] + '-' + m[1]
  const m2 = String(s || '').match(/(\d{4})-(\d{2})-(\d{2})/)
  return m2 ? m2[0] : null
}

export function parseRevenue(s: string): number | null {
  s = String(s || '').toLowerCase().trim()
  if (!s) return null
  const hasMil = /mil|\bk\b/.test(s)
  let n = s.replace(/r\$|reais|mil|\bk\b/g, '').replace(/\s/g, '')
  if (n.indexOf(',') > -1 && n.indexOf('.') > -1) n = n.replace(/\./g, '').replace(',', '.')
  else n = n.replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')
  let v = parseFloat(n)
  if (isNaN(v)) return null
  if (hasMil) v *= 1000
  if (!hasMil && v > 0 && v < 100) v *= 1000 // "2","5" → milhares
  return v
}

export function parseClients(s: string): number | null {
  s = String(s || '').toLowerCase()
  if (/não sei|nao sei|n\/a/.test(s)) return null
  const m = s.match(/\d+/)
  return m ? parseInt(m[0], 10) : null
}

function bucketRevenue(body: string[][], col: number): TallyItem[] {
  const buckets = [
    { label: 'até 3 mil', min: 0, max: 3000 },
    { label: '3–6 mil', min: 3000, max: 6000 },
    { label: '6–10 mil', min: 6000, max: 10000 },
    { label: '10–20 mil', min: 10000, max: 20000 },
    { label: '20 mil +', min: 20000, max: Infinity },
  ]
  const out = buckets.map((b) => ({ label: b.label, count: 0 }))
  body.forEach((r) => {
    const v = parseRevenue(r[col])
    if (v == null) return
    const bi = buckets.findIndex((b) => v >= b.min && v < b.max)
    if (bi >= 0) out[bi].count++
  })
  return out // "não informado" omitido a pedido
}

function bucketClients(body: string[][], col: number): TallyItem[] {
  const cb = [
    { label: '1–10', min: 1, max: 11 },
    { label: '11–30', min: 11, max: 31 },
    { label: '31–60', min: 31, max: 61 },
    { label: '61–100', min: 61, max: 101 },
    { label: '100 +', min: 101, max: Infinity },
  ]
  const out = cb.map((b) => ({ label: b.label, count: 0 }))
  let ni = 0
  body.forEach((r) => {
    const v = parseClients(r[col])
    if (v == null || v <= 0) {
      ni++
      return
    }
    const bi = cb.findIndex((b) => v >= b.min && v < b.max)
    if (bi >= 0) out[bi].count++
  })
  if (ni) out.push({ label: '(não informado)', count: ni })
  return out
}

export function buildFunnel(spec: FunnelSpec, body: string[][]): BuiltFunnel {
  const N = body.length
  const tally = (idx: number, clean?: (v: string) => string): TallyItem[] => {
    const m: Record<string, number> = {}
    body.forEach((r) => {
      let v = (r[idx] || '').trim()
      if (clean) v = clean(v)
      if (!v) v = '(não informado)'
      m[v] = (m[v] || 0) + 1
    })
    return Object.entries(m)
      .map(([label, count]) => ({ label, count }))
      .sort(
        (a, b) =>
          (Number(a.label === '(não informado)') - Number(b.label === '(não informado)')) ||
          b.count - a.count
      )
  }

  // volume por dia (preenche todos os dias do intervalo, mesmo os zerados)
  const dayCount: Record<string, number> = {}
  let minD: string | null = null
  let maxD: string | null = null
  for (const r of body) {
    const d = parseDate(r[spec.dateCol])
    if (!d) continue
    if (!minD || d < minD) minD = d
    if (!maxD || d > maxD) maxD = d
    dayCount[d] = (dayCount[d] || 0) + 1
  }
  const volume: TallyItem[] = []
  if (minD && maxD) {
    let cur: string = minD
    let guard = 0
    while (cur <= maxD && guard < 2000) {
      volume.push({ label: ddmm(cur), count: dayCount[cur] || 0 })
      cur = addDays(cur, 1)
      guard++
    }
  }

  // status
  const sm = spec.statusMap || {}
  const status = tally(spec.statusCol, (v) => (sm[v] !== undefined ? sm[v] : v || 'Sem status'))
  const completed = body.filter((r) => {
    const v = (r[spec.statusCol] || '').trim()
    return sm[v] === 'Completas'
  }).length

  // helpers de rótulo
  const cenShort = (v: string): string => {
    const m = v.match(/CEN[ÁA]RIO\s*(\d+)/i)
    if (!m) return v || ''
    const tail = v.split(/Vendo/i)[1]
    return 'Cenário ' + m[1] + (tail ? ' · vende' + tail : '')
  }
  const estrShort = (v: string): string => {
    if (/outra pessoa|atuo sozinha\b/i.test(v) && /espa[çc]o/i.test(v)) return 'Espaço de terceiros / sozinha'
    if (/secret[áa]ria/i.test(v)) return 'Clínica própria + secretária'
    if (/1 a 5/i.test(v)) return 'Clínica + 1–5 colaboradoras'
    if (/mais de 6/i.test(v)) return 'Clínica + 6+ colaboradoras'
    return v || ''
  }
  const clinShort = (v: string): string => {
    if (/sim/i.test(v)) return 'Clínica própria'
    if (/n[ãa]o/i.test(v)) return 'Domicílio / espaço alugado'
    return v || ''
  }
  const fatDiagShort = (v: string): string =>
    (v || '').replace(/\s*\(ao m[êe]s\)/i, '').replace(/MIL/g, 'mil').trim()
  const equipeShort = (v: string): string => {
    if (/sozinha/i.test(v)) return 'Trabalho sozinha'
    if (/secret[áa]ria/i.test(v)) return 'Eu e uma secretária'
    if (/time|acima de|profis/i.test(v)) return 'Time de 3+ profissionais'
    return v || ''
  }

  // charts conforme a spec
  const charts: BuiltChart[] = spec.charts.map((c) => {
    let items: TallyItem[]
    if (c.kind === 'revenue') items = bucketRevenue(body, c.col)
    else if (c.kind === 'clients') items = bucketClients(body, c.col)
    else if (c.kind === 'cenario') items = tally(c.col, cenShort)
    else if (c.kind === 'estrutura') items = tally(c.col, estrShort)
    else if (c.kind === 'clinica') items = tally(c.col, clinShort)
    else if (c.kind === 'fatdiag') items = tally(c.col, fatDiagShort)
    else if (c.kind === 'equipe') items = tally(c.col, equipeShort)
    else items = tally(c.col, (v) => (v.length > 0 ? v.replace(/\s*\[.*?\]\s*/g, ' ').trim() : v))
    if (c.dropNI) items = items.filter((it) => it.label !== '(não informado)')
    return { title: c.title, eyebrow: c.eyebrow, horizontal: !!c.horizontal, donut: !!c.donut, items }
  })

  // pontuação (só diagnóstico)
  let scoreAvg: number | null = null
  if (spec.scoreCol != null) {
    const sv = body
      .map((r) => parseFloat(String(r[spec.scoreCol!] || '').replace(',', '.')))
      .filter((v) => !isNaN(v) && v > 0)
    scoreAvg = sv.length ? sv.reduce((a, b) => a + b, 0) / sv.length : null
  }

  // mediana de faturamento (premium tem texto livre)
  let revMedian: number | null = null
  if (spec.charts.some((c) => c.kind === 'revenue')) {
    const rc = spec.charts.find((c) => c.kind === 'revenue')!.col
    const rv = body
      .map((r) => parseRevenue(r[rc]))
      .filter((v): v is number => v != null)
      .sort((a, b) => a - b)
    revMedian = rv.length ? rv[Math.floor(rv.length / 2)] : null
  }

  return {
    name: spec.name,
    total: N,
    range: [minD, maxD],
    volume,
    status,
    completed,
    completedPct: N ? (completed / N) * 100 : 0,
    scoreAvg,
    revMedian,
    charts,
  }
}
