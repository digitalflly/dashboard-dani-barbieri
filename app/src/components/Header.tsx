import type { CSSProperties } from 'react'
import type { Dashboard, PageKey } from '../lib/useDashboard'
import { headerVM, monthOptions, weekOptions } from '../lib/viewmodel'
import type { CandFilters } from '../lib/funisvm'
import { ACCENT } from '../lib/constants'

const labelCap: CSSProperties = {
  fontSize: 10,
  letterSpacing: 'var(--ls-label)',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
}

const PAGES: { key: PageKey; label: string }[] = [
  { key: 'conta', label: 'Dados da Conta' },
  { key: 'conteudos', label: 'Dados dos Conteúdos' },
  { key: 'insights', label: 'Insights dos Conteúdos' },
  { key: 'candidaturas', label: 'Dados dos Funis' },
]

export default function Header({ dash, candFilters }: { dash: Dashboard; candFilters: CandFilters }) {
  const { model: M, state: S, setState, setPage, onRefresh } = dash
  const hv = headerVM(M, S)

  const navStyle = (active: boolean): CSSProperties => ({
    fontFamily: 'var(--font-sans)',
    fontSize: 13,
    fontWeight: active ? 600 : 500,
    cursor: 'pointer',
    padding: '8px 16px',
    borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
    border: `1px solid ${active ? 'var(--border-soft)' : 'transparent'}`,
    borderBottom: `2px solid ${active ? ACCENT : 'transparent'}`,
    background: active ? 'var(--surface-page)' : 'transparent',
    color: active ? 'var(--text-strong)' : 'var(--text-muted)',
  })

  return (
    <header
      style={{
        background: 'var(--surface-card)',
        borderBottom: '1px solid var(--border-soft)',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '18px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            className="b-avatar b-avatar--lg"
            style={{ background: 'var(--wine-800)', color: 'var(--surface-card)', fontFamily: 'var(--font-display)', fontSize: 24 }}
          >
            {M.profile.initial}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, lineHeight: 1, color: 'var(--text-strong)', letterSpacing: '-0.01em' }}>
              {M.profile.name}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>@{M.profile.handle} · análise de marketing</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'right', lineHeight: 1.3 }}>
            <div style={{ fontSize: 11, letterSpacing: 'var(--ls-label)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Atualizado</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)', whiteSpace: 'nowrap' }}>{S.lastSync}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end', marginTop: 3 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: hv.sourceColor }}></span>
              <span style={{ fontSize: 10.5, color: hv.sourceColor }}>{hv.sourceLabel}</span>
            </div>
          </div>
          <button className="b-btn b-btn--primary" onClick={onRefresh} disabled={S.refreshing} style={{ minWidth: 128 }}>
            {hv.refreshLabel}
          </button>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 32px 14px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 24,
          flexWrap: 'wrap',
        }}
      >
        <nav style={{ display: 'flex', gap: 4 }}>
          {PAGES.map((p) => (
            <button key={p.key} onClick={() => setPage(p.key)} style={navStyle(S.page === p.key)}>
              {p.label}
            </button>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          {hv.showFilters && (
            <>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={labelCap}>Mês</span>
                <select
                  className="b-select"
                  value={S.month}
                  onChange={(e) => setState({ month: e.target.value, week: 'all' })}
                  style={{ height: 38, padding: '0 12px', minWidth: 150 }}
                >
                  {monthOptions(M).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={labelCap}>Semana</span>
                <select
                  className="b-select"
                  value={S.week}
                  onChange={(e) => setState({ week: e.target.value })}
                  style={{ height: 38, padding: '0 12px', minWidth: 230 }}
                >
                  {weekOptions(M).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}

          {hv.showFunnelFilters && (
            <>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={labelCap}>Mês</span>
                <select
                  className="b-select"
                  value={candFilters.month}
                  onChange={(e) => setState({ candMonth: e.target.value, candFrom: '', candTo: '' })}
                  style={{ height: 38, padding: '0 12px', minWidth: 150 }}
                >
                  {candFilters.monthOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={labelCap}>Data inicial</span>
                <input
                  type="date"
                  className="b-select"
                  value={candFilters.from}
                  min={candFilters.min}
                  max={candFilters.max}
                  onChange={(e) => setState({ candFrom: e.target.value, candMonth: 'all' })}
                  style={{ height: 38, padding: '0 12px' }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={labelCap}>Data final</span>
                <input
                  type="date"
                  className="b-select"
                  value={candFilters.to}
                  min={candFilters.min}
                  max={candFilters.max}
                  onChange={(e) => setState({ candTo: e.target.value, candMonth: 'all' })}
                  style={{ height: 38, padding: '0 12px' }}
                />
              </label>
              {candFilters.hasFilter && (
                <button
                  onClick={() => setState({ candMonth: 'all', candFrom: '', candTo: '' })}
                  style={{
                    height: 38,
                    padding: '0 14px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 12,
                    cursor: 'pointer',
                    borderRadius: 6,
                    border: '1px solid var(--border-strong)',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                  }}
                >
                  Limpar
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}
