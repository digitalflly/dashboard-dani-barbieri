import type { CSSProperties } from 'react'
import type { Dashboard } from '../lib/useDashboard'
import {
  contentRows,
  aquisicaoRows,
  acompLineCfg,
  aqLineCfg,
  ACOMP_METRIC_OPTIONS,
  AQ_METRIC_OPTIONS,
  FAIXA_COLS,
  type ContentRow,
  type AquisicaoRow,
} from '../lib/acomp'
import { ddmm, addDays } from '../lib/dates'
import ChartCanvas from './ChartCanvas'

const eyebrow: CSSProperties = { fontSize: 11, letterSpacing: 'var(--ls-label)', textTransform: 'uppercase', color: 'var(--text-muted)' }
const th: CSSProperties = { fontSize: 10, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, verticalAlign: 'bottom', lineHeight: 1.3 }
const sectionTitle: CSSProperties = { fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '-0.01em', fontSize: 22, color: 'var(--text-strong)' }
const selectStyle: CSSProperties = { height: 34, padding: '0 12px', minWidth: 210 }

function LabelCell({ r, onToggle }: { r: ContentRow | AquisicaoRow; onToggle: (key: string) => void }) {
  if (r.hasChildren) {
    return (
      <button
        onClick={() => onToggle(r.key)}
        style={{ cursor: 'pointer', background: 'transparent', border: 'none', padding: 0, fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center', gap: 7, marginLeft: r.indent }}
      >
        <span style={{ color: '#771520', fontSize: 10, width: 10 }}>{r.caret}</span>
        {r.label}
      </button>
    )
  }
  return <span style={{ display: 'inline-block', marginLeft: r.indent, paddingLeft: 17, color: 'var(--text-body)' }}>{r.label}</span>
}

export default function AcompanhamentoPage({ dash }: { dash: Dashboard }) {
  const { model: M, state: S, setState } = dash
  const cRows = contentRows(M, S)
  const aRows = aquisicaoRows(M, S)
  const acompLine = acompLineCfg(M, S)
  const aq = aqLineCfg(M, S, (w) => setState({ aqWeek: w }))
  const toggleCt = (key: string): void => setState((s) => ({ ctExpanded: { ...(s.ctExpanded || {}), [key]: !(s.ctExpanded && s.ctExpanded[key]) } }))
  const toggleAq = (key: string): void => setState((s) => ({ aqExpanded: { ...(s.aqExpanded || {}), [key]: !(s.aqExpanded && s.aqExpanded[key]) } }))
  const tdLabel: CSSProperties = { textAlign: 'left', padding: '10px 5px 10px 4px', fontSize: 13, color: 'var(--text-strong)', whiteSpace: 'nowrap' }
  const tdNum: CSSProperties = { textAlign: 'right', padding: '10px 5px', fontSize: 12, color: 'var(--text-strong)' }

  return (
    <div>
      {/* CONTEÚDO */}
      <div style={{ margin: '0 0 16px' }}>
        <div style={sectionTitle}>Conteúdo</div>
      </div>
      <div className="b-card" style={{ padding: '20px 22px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={eyebrow}>Por dia de publicação</div>
          <select className="b-select" value={S.acompMetric} onChange={(e) => setState({ acompMetric: e.target.value })} style={selectStyle}>
            {ACOMP_METRIC_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div style={{ height: 190, position: 'relative' }}>{acompLine && <ChartCanvas id="acomp-line" config={acompLine} />}</div>
      </div>
      <div className="b-card" style={{ padding: '20px 22px', marginBottom: 30 }}>
        <div style={{ overflowX: 'auto', margin: '0 -4px' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 640 }}>
            <thead>
              <tr style={{ textAlign: 'right' }}>
                <th style={{ ...th, textAlign: 'left', padding: '0 10px 10px 4px' }}>Período</th>
                <th style={{ ...th, padding: '0 10px 10px' }}>Reels · alcance méd.</th>
                <th style={{ ...th, padding: '0 10px 10px' }}>Reels · plays méd.</th>
                <th style={{ ...th, padding: '0 10px 10px' }}>Carrossel · salv. méd.</th>
                <th style={{ ...th, textAlign: 'right', padding: '0 4px 10px 10px' }}>Carrossel · compart. méd.</th>
              </tr>
            </thead>
            <tbody>
              {cRows.map((r) => (
                <tr key={r.key} style={{ textAlign: 'right', borderTop: '1px solid var(--border-soft)' }}>
                  <td style={{ ...tdLabel, padding: '10px 10px 10px 4px', fontSize: 13 }}>
                    <LabelCell r={r} onToggle={toggleCt} />
                  </td>
                  <td data-keepcase="1" style={{ ...tdNum, padding: '10px 10px', fontSize: 12.5, fontWeight: 600, color: '#771520' }}>{r.reelsReach}</td>
                  <td data-keepcase="1" style={{ ...tdNum, padding: '10px 10px', fontSize: 12.5 }}>{r.reelsPlays}</td>
                  <td data-keepcase="1" style={{ ...tdNum, padding: '10px 10px', fontSize: 12.5 }}>{r.carrSave}</td>
                  <td data-keepcase="1" style={{ ...tdNum, padding: '10px 4px 10px 10px', fontSize: 12.5 }}>{r.carrShare}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AQUISIÇÃO */}
      <div style={{ margin: '0 0 16px' }}>
        <div style={sectionTitle}>Aquisição</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5 }}>Clique no mês para abrir as semanas, e na semana para abrir os dias.</div>
      </div>
      <div className="b-card" style={{ padding: '20px 22px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {S.aqWeek && (
              <button
                onClick={() => setState({ aqWeek: null })}
                style={{ height: 28, padding: '0 10px', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 6, border: '1px solid var(--border-strong)', background: 'transparent', color: '#771520' }}
              >
                ← semanas
              </button>
            )}
            <div style={eyebrow}>{S.aqWeek ? 'Semana ' + ddmm(S.aqWeek) + '–' + ddmm(addDays(S.aqWeek, 6)) + ' · por dia' : 'Por semana · clique em uma semana para ver os dias'}</div>
          </div>
          <select className="b-select" value={S.aqMetric} onChange={(e) => setState({ aqMetric: e.target.value })} style={selectStyle}>
            {AQ_METRIC_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div style={{ height: 190, position: 'relative' }}>{aq.cfg && <ChartCanvas id="aq-line" config={aq.cfg} />}</div>
      </div>
      <div className="b-card" style={{ padding: '20px 22px' }}>
        <div style={{ overflowX: 'auto', margin: '0 -4px' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed', minWidth: 900 }}>
            <thead>
              <tr style={{ textAlign: 'right' }}>
                <th style={{ ...th, textAlign: 'left', width: 172, padding: '0 6px 10px 4px' }}>Período</th>
                <th style={{ ...th, padding: '0 5px 10px' }}>Leads gerados</th>
                <th className="tt" data-tip="Qualificado = faturamento declarado ≥ R$ 15 mil/mês." style={{ ...th, padding: '0 5px 10px', cursor: 'help', overflowWrap: 'anywhere' }}>Leads qualificados</th>
                <th style={{ ...th, padding: '0 5px 10px' }}>Custo/lead qualif.</th>
                <th style={{ ...th, textAlign: 'right', padding: '0 5px 10px' }}>% MQL</th>
                {FAIXA_COLS.map((fc) => (
                  <th key={fc.key} className="tt" data-tip={fc.tip} style={{ ...th, textAlign: 'right', padding: '0 5px 10px', cursor: 'help', overflowWrap: 'anywhere', hyphens: 'auto' }}>{fc.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {aRows.map((r) => (
                <tr key={r.key} style={{ textAlign: 'right', borderTop: '1px solid var(--border-soft)' }}>
                  <td style={tdLabel}>
                    <LabelCell r={r} onToggle={toggleAq} />
                  </td>
                  <td data-keepcase="1" style={tdNum}>{r.leads}</td>
                  <td data-keepcase="1" style={{ ...tdNum, fontWeight: 600, color: '#771520' }}>{r.qual}</td>
                  <td data-keepcase="1" style={{ ...tdNum, whiteSpace: 'nowrap' }}>{r.custo}</td>
                  <td data-keepcase="1" style={{ ...tdNum, fontWeight: 600, color: '#771520' }}>{r.pct}</td>
                  {r.fx.map((x, i) => (
                    <td key={i} data-keepcase="1" style={tdNum}>{x.v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
