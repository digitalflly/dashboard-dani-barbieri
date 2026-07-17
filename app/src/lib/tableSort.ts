// ============================================================
// Ordenação de tabelas por clique no cabeçalho — delegação global
// (funciona em qualquer <table> com thead+tbody dentro do painel).
// Ported de wireSort() em Dashboard.dc.html.
// ============================================================

interface SortState {
  __sortIdx?: number
  __sortDir?: number
}

function parseVal(td: Element | null): { n: number; s: string } {
  const raw = ((td?.textContent as string) || '').trim()
  if (raw === '' || raw === '—' || raw === '-') return { n: NaN, s: '' }
  let c = raw.replace(/[^\d,.-]/g, '')
  if (c.indexOf(',') >= 0)
    c = c.replace(/\./g, '').replace(',', '.') // pt-BR: ponto=milhar, vírgula=decimal
  else if ((c.match(/\./g) || []).length > 1) c = c.replace(/\./g, '') // 1.234.567 sem decimal
  const n = parseFloat(c)
  return { n: c === '' || isNaN(n) ? NaN : n, s: raw.toLowerCase() }
}

// instala o listener de ordenação; retorna a função de limpeza
export function installTableSort(): () => void {
  const handler = (e: MouseEvent): void => {
    const target = e.target as HTMLElement | null
    const th = target?.closest?.('th') as HTMLElement | null
    if (!th) return
    const tr = th.parentElement
    const thead = tr?.parentElement
    if (!thead || thead.tagName !== 'THEAD') return
    const table = thead.closest('table') as (HTMLTableElement & SortState) | null
    if (!table) return
    const tbody = table.querySelector('tbody')
    if (!tbody) return
    const rows = [...tbody.querySelectorAll(':scope > tr')].filter((r) => r.querySelector('td'))
    if (rows.length < 2) return
    const ths = [...tr.children]
    const idx = ths.indexOf(th)
    if (idx < 0) return
    const dir = table.__sortIdx === idx && table.__sortDir === 1 ? -1 : 1
    table.__sortIdx = idx
    table.__sortDir = dir
    rows.sort((a, b) => {
      const av = parseVal(a.children[idx] || a.lastElementChild)
      const bv = parseVal(b.children[idx] || b.lastElementChild)
      let cmp: number
      if (!isNaN(av.n) && !isNaN(bv.n)) cmp = av.n - bv.n
      else if (isNaN(av.n) && isNaN(bv.n)) cmp = av.s.localeCompare(bv.s, 'pt')
      else cmp = isNaN(av.n) ? 1 : -1 // vazios sempre no fim
      return cmp * dir
    })
    rows.forEach((r) => tbody.appendChild(r))
    ths.forEach((h) => {
      const a = (h as HTMLElement).querySelector('.sortarrow')
      if (a) a.remove()
    })
    const arrow = document.createElement('span')
    arrow.className = 'sortarrow'
    arrow.textContent = dir === 1 ? '▲' : '▼'
    th.appendChild(arrow)
  }
  document.addEventListener('click', handler, true)
  return () => document.removeEventListener('click', handler, true)
}
