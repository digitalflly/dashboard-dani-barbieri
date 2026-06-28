import type { CSSProperties } from 'react'
import type { Dashboard } from '../lib/useDashboard'
import { insightsVM } from '../lib/viewmodel'
import { ACCENT } from '../lib/constants'

const eyebrow: CSSProperties = {
  fontSize: 11,
  letterSpacing: 'var(--ls-label)',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
}
const sectionTitle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontWeight: 600,
  letterSpacing: '-0.01em',
  fontSize: 20,
  color: 'var(--text-strong)',
}

export default function InsightsPage({ dash }: { dash: Dashboard }) {
  const { model: M, state: S, setState } = dash
  const v = insightsVM(M, S)
  const accent = ACCENT

  return (
    <div>
      {/* média do período */}
      <div className="b-card" style={{ padding: '22px 24px', marginBottom: 18 }}>
        <div style={eyebrow}>{v.avgEyebrow}</div>
        <div style={{ ...sectionTitle, marginBottom: 16 }}>{v.avgTitle}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {v.averages.map((a, i) => (
            <div key={i} style={{ borderLeft: `2px solid ${accent}`, paddingLeft: 12 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{a.label}</div>
              <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-strong)', marginTop: 3, letterSpacing: '-0.02em' }}>{a.value}</div>
            </div>
          ))}
        </div>
      </div>

      {v.noMetrics && (
        <div
          className="b-card"
          style={{ padding: '18px 22px', display: 'flex', gap: 11, alignItems: 'flex-start', background: 'var(--warning-bg)', borderColor: 'transparent' }}
        >
          <span style={{ flex: 'none', width: 8, height: 8, borderRadius: 999, background: 'var(--warning)', marginTop: 6 }}></span>
          <span data-keepcase="1" style={{ fontSize: 13, color: 'var(--wine-900)', lineHeight: 1.55 }}>
            {v.metricsNote} Por isso o ranking Top 3 e os aprendizados por publicação ficam indisponíveis ao vivo — selecione o snapshot de demonstração para vê-los.
          </span>
        </div>
      )}

      {/* top 3 */}
      {v.metricsAvailable && (
        <div className="b-card" style={{ padding: '22px 24px', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
            <div>
              <div style={eyebrow}>Ranking</div>
              <div style={sectionTitle}>Top 3 conteúdos</div>
            </div>
            <select
              className="b-select"
              value={S.topMetric}
              onChange={(e) => setState({ topMetric: e.target.value })}
              style={{ height: 36, padding: '0 12px', minWidth: 220 }}
            >
              {v.topMetricOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {v.top3.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-lg)', padding: 12 }}>
                <div style={t.coverStyle}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'rgba(250,248,247,0.25)' }}>{t.rank}</span>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div data-keepcase="1" style={{ fontSize: 12, color: 'var(--text-strong)', fontWeight: 500, lineHeight: 1.3, overflow: 'hidden', maxHeight: 32 }}>
                    {t.caption}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    {t.typeLabel} · {t.date}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: accent, marginTop: 6, letterSpacing: '-0.02em' }}>{t.metricValue}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* worked / not worked */}
      {v.metricsAvailable && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="b-card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ width: 9, height: 9, borderRadius: 999, background: 'var(--success)' }}></span>
              <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '-0.01em', fontSize: 19, color: 'var(--text-strong)' }}>O que funcionou</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {v.worked.map((w, i) => (
                <div key={i} style={{ borderLeft: '2px solid var(--success)', paddingLeft: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)', lineHeight: 1.35 }}>{w.title}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-body)', lineHeight: 1.45, marginTop: 3 }}>{w.detail}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="b-card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ width: 9, height: 9, borderRadius: 999, background: 'var(--danger)' }}></span>
              <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '-0.01em', fontSize: 19, color: 'var(--text-strong)' }}>O que não funcionou</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {v.notWorked.map((w, i) => (
                <div key={i} style={{ borderLeft: '2px solid var(--danger)', paddingLeft: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)', lineHeight: 1.35 }}>{w.title}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-body)', lineHeight: 1.45, marginTop: 3 }}>{w.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
