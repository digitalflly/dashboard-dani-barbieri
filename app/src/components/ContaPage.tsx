import type { CSSProperties } from 'react'
import type { Dashboard } from '../lib/useDashboard'
import { contaVM } from '../lib/viewmodel'
import ChartCanvas from './ChartCanvas'

const eyebrow: CSSProperties = {
  fontSize: 11,
  letterSpacing: 'var(--ls-label)',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
}
const chartTitle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontWeight: 600,
  letterSpacing: '-0.01em',
  fontSize: 20,
  color: 'var(--text-strong)',
  lineHeight: 1.1,
}
const chartBox: CSSProperties = { height: 230, position: 'relative' }

export default function ContaPage({ dash }: { dash: Dashboard }) {
  const { model: M, state: S, setState } = dash
  const v = contaVM(M, S)

  return (
    <div>
      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 10, marginBottom: 18 }}>
        {v.kpis.map((k, i) => (
          <div
            key={i}
            className="b-card"
            style={{
              padding: '12px 12px',
              minHeight: 104,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderTop: `3px solid ${k.accent}`,
            }}
          >
            <div style={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', lineHeight: 1.25 }}>
              {k.label}
            </div>
            <div>
              <div style={{ fontSize: 21, fontWeight: 600, color: 'var(--text-strong)', lineHeight: 1.05, letterSpacing: '-0.02em' }}>{k.value}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4, minHeight: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: k.deltaColor }}>{k.deltaText}</span>
                <span style={{ fontSize: 11, color: 'var(--ink-300)' }}>{k.sub}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* charts 1 & 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="b-card" style={{ padding: '20px 22px' }}>
          <div style={eyebrow}>Crescimento</div>
          <div style={{ ...chartTitle, marginBottom: 12 }}>Seguidores no período</div>
          <div style={chartBox}>
            <ChartCanvas id="chart-followers" config={v.chartCfgs['chart-followers']} />
          </div>
        </div>
        <div className="b-card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={eyebrow}>Por dia da semana</div>
              <div style={chartTitle}>Métrica por semana</div>
            </div>
            <select
              className="b-select"
              value={S.metric2}
              onChange={(e) => setState({ metric2: e.target.value })}
              style={{ height: 34, padding: '0 10px', minWidth: 180 }}
            >
              {v.metric2Options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div style={chartBox}>
            <ChartCanvas id="chart-metric2" config={v.chartCfgs['chart-metric2']} />
          </div>
        </div>
      </div>

      {/* charts 3 & 4 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="b-card" style={{ padding: '20px 22px' }}>
          <div style={eyebrow}>Por dia da semana</div>
          <div style={{ ...chartTitle, marginBottom: 12 }}>% engajamento seguidores</div>
          <div style={chartBox}>
            <ChartCanvas id="chart-engfollowers" config={v.chartCfgs['chart-engfollowers']} />
          </div>
        </div>
        <div className="b-card" style={{ padding: '20px 22px' }}>
          <div style={eyebrow}>Por dia da semana</div>
          <div style={{ ...chartTitle, marginBottom: 12 }}>% engajamento geral</div>
          <div style={chartBox}>
            <ChartCanvas id="chart-enggeneral" config={v.chartCfgs['chart-enggeneral']} />
          </div>
        </div>
      </div>
    </div>
  )
}
