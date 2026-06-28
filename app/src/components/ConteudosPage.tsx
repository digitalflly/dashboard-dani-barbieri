import type { Dashboard } from '../lib/useDashboard'
import { contentVM } from '../lib/viewmodel'

export default function ConteudosPage({ dash }: { dash: Dashboard }) {
  const { model: M, state: S } = dash
  const v = contentVM(M, S)

  return (
    <div>
      {v.noMetrics && (
        <div
          className="b-card"
          style={{
            padding: '13px 16px',
            marginBottom: 18,
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
            background: 'var(--warning-bg)',
            borderColor: 'transparent',
          }}
        >
          <span style={{ flex: 'none', width: 7, height: 7, borderRadius: 999, background: 'var(--warning)', marginTop: 6 }}></span>
          <span data-keepcase="1" style={{ fontSize: 12, color: 'var(--wine-900)', lineHeight: 1.5 }}>
            {v.metricsNote}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '-0.01em', fontSize: 20, color: 'var(--text-strong)' }}>
          Conteúdos postados
        </div>
        <span className="b-badge">{v.postedCount}</span>
      </div>

      {v.hasPosted && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(248px, 1fr))', gap: 18, marginBottom: 34 }}>
          {v.posted.map((c, i) => (
            <div key={i} className="b-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={c.coverStyle}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 80, color: 'rgba(250,248,247,0.16)', lineHeight: 1, userSelect: 'none' }}>
                  {M.profile.initial}
                </span>
                <span
                  className="b-badge"
                  style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    background: 'rgba(39,21,13,0.62)',
                    color: 'var(--surface-card)',
                    border: 0,
                    backdropFilter: 'blur(2px)',
                  }}
                >
                  {c.typeLabel}
                </span>
                <span
                  style={{
                    position: 'absolute',
                    bottom: 10,
                    right: 12,
                    fontSize: 12,
                    color: 'var(--surface-card)',
                    fontWeight: 500,
                    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                  }}
                >
                  {c.date}
                </span>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div
                  data-keepcase="1"
                  style={{ fontSize: 13, color: 'var(--text-strong)', fontWeight: 500, lineHeight: 1.35, height: 36, overflow: 'hidden' }}
                >
                  {c.caption}
                </div>
                <div style={{ display: 'flex', gap: 14, margin: '11px 0 12px', fontSize: 12, color: 'var(--text-body)' }}>
                  <span>♥ {c.likes}</span>
                  <span>◷ {c.comments}</span>
                  <span>↗ {c.shares}</span>
                  <span>⤓ {c.saves}</span>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '6px 14px',
                    borderTop: '1px solid var(--border-soft)',
                    paddingTop: 11,
                  }}
                >
                  {c.metrics.map((m, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-strong)' }}>{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {v.contentEmpty && (
        <div className="b-card b-card--bare" style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
          Nenhum conteúdo publicado neste período.
        </div>
      )}
    </div>
  )
}
