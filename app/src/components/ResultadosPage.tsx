import type { CSSProperties } from 'react'
import type { Dashboard } from '../lib/useDashboard'
import { resultadosVM } from '../lib/resultados'
import ChartCanvas from './ChartCanvas'

const eyebrow: CSSProperties = {
  fontSize: 11,
  letterSpacing: 'var(--ls-label)',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
}
const thCell: CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  fontWeight: 600,
  whiteSpace: 'nowrap',
}
const thSticky: CSSProperties = { ...thCell, position: 'sticky', top: 0, background: 'var(--surface, #fff)', zIndex: 1 }

export default function ResultadosPage({ dash }: { dash: Dashboard }) {
  const rv = resultadosVM(dash.state)

  return (
    <div>
      <div style={{ margin: '-4px 0 18px' }}>
        <div style={{ ...eyebrow, marginBottom: 5 }}>Visão mensal</div>
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '-0.01em', fontSize: 22, color: 'var(--text-strong)' }}>Resultados Mensais</div>
      </div>

      {rv.resChartShow && rv.resChart && (
        <div className="b-card" style={{ padding: '22px 24px', marginBottom: 22 }}>
          <div style={{ ...eyebrow, marginBottom: 14 }}>Faturamento × Vendas HBP</div>
          <div style={{ height: 300, position: 'relative' }}>
            <ChartCanvas id="res-monthly" config={rv.resChart} />
          </div>
        </div>
      )}

      {rv.resMonths.map((mo) => (
        <div key={mo.ym} style={{ marginBottom: 34 }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 18, color: '#771520', letterSpacing: '-0.01em', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border-soft)' }}>
            {mo.label}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 16 }}>
            {mo.kpis.map((st, i) => (
              <div key={i} className="b-card" style={{ padding: '13px 15px', minHeight: 82, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '3px solid #771520' }}>
                <div style={{ fontSize: 9.5, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', lineHeight: 1.3 }}>{st.label}</div>
                <div>
                  <div data-keepcase="1" style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-strong)', letterSpacing: '-0.02em' }}>{st.value}</div>
                  {st.detail && <div data-keepcase="1" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{st.detail}</div>}
                </div>
              </div>
            ))}
          </div>

          {mo.funilShow && (
            <div className="b-card" style={{ padding: '20px 22px', marginBottom: 14 }}>
              <div style={{ ...eyebrow, marginBottom: 14 }}>Funis ativos no mês</div>
              <div style={{ overflowX: 'auto', margin: '0 -4px' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 820 }}>
                  <thead>
                    <tr style={{ textAlign: 'right' }}>
                      <th style={{ ...thCell, textAlign: 'left', padding: '0 10px 10px 4px' }}>Funil ativo</th>
                      <th style={{ ...thCell, padding: '0 10px 10px' }}>Investido</th>
                      <th style={{ ...thCell, textAlign: 'left', padding: '0 10px 10px' }}>Top 3 criativos</th>
                      <th style={{ ...thCell, padding: '0 10px 10px' }}>CTR</th>
                      <th style={{ ...thCell, padding: '0 10px 10px' }}>Resultados</th>
                      <th style={{ ...thCell, padding: '0 10px 10px' }}>Vendas HBP</th>
                      <th style={{ ...thCell, padding: '0 10px 10px' }}>Faturamento HBP</th>
                      <th style={{ ...thCell, padding: '0 4px 10px 10px' }}>ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mo.funilRows.map((f, i) => (
                      <tr key={i} style={{ textAlign: 'right', borderTop: '1px solid var(--border-soft)' }}>
                        <td style={{ textAlign: 'left', padding: '11px 10px 11px 4px', fontSize: 13, fontWeight: 600, color: 'var(--text-strong)', whiteSpace: 'nowrap' }}>{f.label}</td>
                        <td data-keepcase="1" style={{ textAlign: 'right', padding: '11px 10px', fontSize: 12.5, color: 'var(--text-strong)', whiteSpace: 'nowrap' }}>{f.invest}</td>
                        <td style={{ textAlign: 'left', padding: '11px 10px', minWidth: 220 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {f.creatives.map((c, j) =>
                              c.link ? (
                                <a key={j} href={c.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11.5, color: '#771520', textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 260, display: 'inline-block' }}>{c.n}</a>
                              ) : (
                                <span key={j} style={{ fontSize: 11.5, color: 'var(--text-body)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 260, display: 'inline-block' }}>{c.n}</span>
                              )
                            )}
                          </div>
                        </td>
                        <td data-keepcase="1" style={{ textAlign: 'right', padding: '11px 10px', fontSize: 12.5, color: 'var(--text-strong)', verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
                            {f.creatives.map((c, j) => <span key={j} style={{ lineHeight: 1.35 }}>{c.ctr}</span>)}
                          </div>
                        </td>
                        <td data-keepcase="1" style={{ textAlign: 'right', padding: '11px 10px', fontSize: 12.5, color: 'var(--text-strong)', verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
                            {f.creatives.map((c, j) => <span key={j} style={{ lineHeight: 1.35 }}>{c.res}</span>)}
                          </div>
                        </td>
                        <td data-keepcase="1" style={{ textAlign: 'right', padding: '11px 10px', fontSize: 12.5, color: 'var(--text-strong)', verticalAlign: 'top' }}>{f.vendasHbp}</td>
                        <td data-keepcase="1" style={{ textAlign: 'right', padding: '11px 10px', fontSize: 12.5, color: 'var(--text-strong)', whiteSpace: 'nowrap', verticalAlign: 'top' }}>{f.fatHbp}</td>
                        <td data-keepcase="1" style={{ textAlign: 'right', padding: '11px 4px 11px 10px', fontSize: 12.5, fontWeight: 600, color: '#771520', verticalAlign: 'top' }}>{f.roas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {mo.impShow && (
            <div className="b-card" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
                <div style={eyebrow}>Impulsionamentos</div>
                <div data-keepcase="1" style={{ fontSize: 11, color: 'var(--text-muted)' }}>total {mo.impTotal}</div>
              </div>
              <div style={{ overflow: 'auto', maxHeight: 420, margin: '0 -4px' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 640 }}>
                  <thead>
                    <tr style={{ textAlign: 'right' }}>
                      <th style={{ ...thSticky, textAlign: 'left', padding: '0 10px 10px 4px' }}>Publicação</th>
                      <th style={{ ...thSticky, padding: '0 10px 10px' }}>Investido</th>
                      <th style={{ ...thSticky, padding: '0 10px 10px' }}>Alcance</th>
                      <th style={{ ...thSticky, padding: '0 10px 10px' }}>Impressões</th>
                      <th style={{ ...thSticky, textAlign: 'right', padding: '0 4px 10px 10px' }}>Visitas ao perfil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mo.impRows.map((r, i) => (
                      <tr key={i} style={{ textAlign: 'right', borderTop: '1px solid var(--border-soft)' }}>
                        <td style={{ textAlign: 'left', padding: '10px 10px 10px 4px', fontSize: 12.5, color: 'var(--text-strong)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</td>
                        <td data-keepcase="1" style={{ textAlign: 'right', padding: '10px 10px', fontSize: 12.5, color: 'var(--text-strong)', whiteSpace: 'nowrap' }}>{r.invest}</td>
                        <td data-keepcase="1" style={{ textAlign: 'right', padding: '10px 10px', fontSize: 12.5, color: 'var(--text-strong)' }}>{r.reach}</td>
                        <td data-keepcase="1" style={{ textAlign: 'right', padding: '10px 10px', fontSize: 12.5, color: 'var(--text-strong)' }}>{r.impressions}</td>
                        <td data-keepcase="1" style={{ textAlign: 'right', padding: '10px 4px 10px 10px', fontSize: 12.5, fontWeight: 600, color: '#771520' }}>{r.visitas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
