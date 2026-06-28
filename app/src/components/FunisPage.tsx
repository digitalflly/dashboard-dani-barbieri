import type { CSSProperties } from 'react'
import type { Dashboard } from '../lib/useDashboard'
import type { FunisVM } from '../lib/funisvm'
import ChartCanvas from './ChartCanvas'

const eyebrow: CSSProperties = {
  fontSize: 11,
  letterSpacing: 'var(--ls-label)',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
}
const th = (extra: CSSProperties): CSSProperties => ({
  position: 'sticky',
  top: 0,
  background: 'var(--surface, #fff)',
  zIndex: 1,
  fontSize: 10,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  fontWeight: 600,
  ...extra,
})
const thPlain: CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  fontWeight: 600,
  whiteSpace: 'nowrap',
}
const tdNum: CSSProperties = { textAlign: 'right', padding: '10px 8px', fontSize: 12.5, color: 'var(--text-strong)', whiteSpace: 'nowrap' }

export default function FunisPage({ dash, funis }: { dash: Dashboard; funis: FunisVM }) {
  const { setState, setFunnel } = dash
  const v = funis
  const inv = v.invest

  return (
    <div>
      {/* funnel tabs + status filter */}
      <div style={{ display: 'flex', gap: 12, margin: '-4px 0 16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {v.funnelTabs.map((f) => (
            <button
              key={f.key}
              onClick={() => setFunnel(f.key)}
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 12.5,
                fontWeight: f.active ? 600 : 500,
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: 6,
                border: `1px solid ${f.active ? '#771520' : 'var(--border-strong)'}`,
                background: f.active ? '#771520' : 'transparent',
                color: f.active ? 'var(--cream)' : 'var(--text-muted)',
                transition: 'var(--transition-base)',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ ...eyebrow, fontSize: 10, marginRight: 4 }}>Status</span>
          {v.candStatusBtns.map((b) => (
            <button
              key={b.key}
              onClick={() => setState((st) => ({ candStatusFilter: st.candStatusFilter === b.key ? 'all' : b.key }))}
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                fontWeight: b.active ? 600 : 500,
                cursor: 'pointer',
                padding: '7px 14px',
                borderRadius: 6,
                border: `1px solid ${b.active ? '#771520' : 'var(--border-strong)'}`,
                background: b.active ? '#771520' : 'transparent',
                color: b.active ? 'var(--cream)' : 'var(--text-muted)',
                transition: 'var(--transition-base)',
              }}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {v.candReady && (
        <div>
          <div style={{ margin: '18px 0 16px', display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '-0.01em', fontSize: 22, color: 'var(--text-strong)' }}>
              Informações gerais
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 18 }}>
            {v.candKpis.map((k, i) => (
              <div
                key={i}
                className="b-card"
                style={{ padding: '14px 16px', minHeight: 96, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '3px solid #771520' }}
              >
                <div style={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', lineHeight: 1.3 }}>{k.label}</div>
                <div data-keepcase="1" style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-strong)', lineHeight: 1.05, letterSpacing: '-0.02em' }}>
                  {k.value}
                </div>
              </div>
            ))}
          </div>

          <div className="b-card" style={{ padding: '20px 22px', marginBottom: 16 }}>
            <div style={eyebrow}>Por dia</div>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '-0.01em', fontSize: 20, color: 'var(--text-strong)', lineHeight: 1.1, marginBottom: 12 }}>
              Volume de leads
            </div>
            <div style={{ height: 230, position: 'relative' }}>
              <ChartCanvas id="cand-volume" config={v.cfgs['cand-volume']} />
            </div>
          </div>

          <div style={{ display: 'grid', gridAutoFlow: 'column', gridAutoColumns: 'minmax(240px, 1fr)', gap: 16, marginBottom: 16, overflowX: 'auto', paddingBottom: 6 }}>
            {v.candCharts.map((c) => (
              <div key={c.id} className="b-card" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column' }}>
                <div style={eyebrow}>{c.eyebrow}</div>
                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '-0.01em', fontSize: 18, color: 'var(--text-strong)', lineHeight: 1.15, marginBottom: 12, minHeight: 42 }}>
                  {c.title}
                </div>
                {c.bar && (
                  <div style={{ height: 260, position: 'relative' }}>
                    <ChartCanvas id={c.id} config={v.cfgs[c.id]} />
                  </div>
                )}
                {c.donut && (
                  <>
                    <div style={{ height: 200, position: 'relative' }}>
                      <ChartCanvas id={c.id} config={v.cfgs[c.id]} />
                    </div>
                    <div id={c.legendId} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 14px', marginTop: 14 }}></div>
                  </>
                )}
              </div>
            ))}
          </div>

          {inv.investShow && (
            <>
              <div style={{ borderTop: '1px solid var(--border-soft)', margin: '26px 0 18px', paddingTop: 24, display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '-0.01em', fontSize: 22, color: 'var(--text-strong)' }}>
                  Investimento do funil
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
                {inv.investStats.map((st, i) => (
                  <div
                    key={i}
                    className="b-card"
                    style={{ padding: '14px 16px', minHeight: 88, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '3px solid #771520' }}
                  >
                    <div style={{ fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', lineHeight: 1.3 }}>{st.label}</div>
                    <div data-keepcase="1" style={{ fontSize: 19, fontWeight: 600, color: 'var(--text-strong)', letterSpacing: '-0.02em' }}>{st.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                {/* conversion funnel */}
                <div className="b-card" style={{ padding: '22px 24px' }}>
                  <div style={eyebrow}>{inv.investEyebrow}</div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '-0.01em', fontSize: 18, color: 'var(--text-strong)', lineHeight: 1.15, marginBottom: 16 }}>
                    Dados de conversão
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {inv.investStages.map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            ...s.barStyle,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 12,
                            padding: '11px 16px',
                            borderRadius: 5,
                            color: 'var(--cream)',
                            minWidth: 120,
                            flex: 'none',
                          }}
                        >
                          <span style={{ fontSize: 12, fontWeight: 500 }}>{s.label}</span>
                          <span data-keepcase="1" style={{ fontSize: 13, fontWeight: 600 }}>{s.value}</span>
                        </div>
                        <span data-keepcase="1" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-strong)', whiteSpace: 'nowrap' }}>{s.left}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* adsets table */}
                <div className="b-card" style={{ padding: '22px 24px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <div style={eyebrow}>{inv.investEyebrow}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                    <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '-0.01em', fontSize: 18, color: 'var(--text-strong)', lineHeight: 1.15 }}>
                      Conjuntos de anúncio
                    </div>
                    <span data-keepcase="1" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{inv.adsStatus}</span>
                  </div>
                  <div style={{ overflow: 'auto', margin: '0 -4px', flex: '1 1 0', minHeight: 0 }}>
                    <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
                      <thead>
                        <tr style={{ textAlign: 'right' }}>
                          <th style={th({ textAlign: 'left', padding: '0 8px 10px 4px', width: '32%' })}>Conjunto</th>
                          <th style={th({ padding: '0 8px 10px' })}>Impr.</th>
                          <th style={th({ padding: '0 8px 10px' })}>Cliques</th>
                          <th style={th({ padding: '0 8px 10px' })}>Visu. pág.</th>
                          <th style={th({ padding: '0 8px 10px' })}>Connect</th>
                          <th style={th({ textAlign: 'right', padding: '0 4px 10px 8px' })}>Leads</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inv.investAdsets.map((a) => (
                          <tr key={a.idx} style={{ borderTop: '1px solid var(--border-soft)' }}>
                            <td style={{ padding: '10px 8px 10px 4px' }}>
                              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-strong)', lineHeight: 1.3, wordBreak: 'break-word' }}>{a.name}</span>
                            </td>
                            <td data-keepcase="1" style={tdNum}>{a.impr}</td>
                            <td data-keepcase="1" style={tdNum}>{a.clk}</td>
                            <td data-keepcase="1" style={tdNum}>{a.lpv}</td>
                            <td data-keepcase="1" style={tdNum}>{a.cr}</td>
                            <td data-keepcase="1" style={{ ...tdNum, padding: '10px 4px 10px 8px', fontWeight: 600, color: '#771520' }}>{a.leads}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ads table */}
              <div className="b-card" style={{ padding: '22px 24px', minWidth: 0, marginBottom: 16 }}>
                <div style={eyebrow}>{inv.investEyebrow}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                  <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '-0.01em', fontSize: 18, color: 'var(--text-strong)', lineHeight: 1.15 }}>Anúncios</div>
                  <span data-keepcase="1" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{inv.adsStatus}</span>
                </div>
                <div style={{ overflowX: 'auto', margin: '0 -4px' }}>
                  <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 660 }}>
                    <thead>
                      <tr style={{ textAlign: 'right' }}>
                        <th style={{ ...thPlain, textAlign: 'left', padding: '0 12px 10px 4px' }}>Anúncio</th>
                        <th style={{ ...thPlain, padding: '0 12px 10px' }}>Impressões</th>
                        <th style={{ ...thPlain, padding: '0 12px 10px' }}>Cliques no link</th>
                        <th style={{ ...thPlain, padding: '0 12px 10px' }}>Visualização da página</th>
                        <th style={{ ...thPlain, padding: '0 12px 10px' }}>Connect rate</th>
                        <th style={{ ...thPlain, textAlign: 'right', padding: '0 4px 10px 12px' }}>Leads do gerenciador</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inv.investAds.map((a) => (
                        <tr key={a.idx} style={{ borderTop: '1px solid var(--border-soft)' }}>
                          <td style={{ padding: '10px 12px 10px 4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                              <div style={a.thumbStyle}></div>
                              <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-strong)', whiteSpace: 'nowrap' }}>{a.name}</span>
                            </div>
                          </td>
                          <td data-keepcase="1" style={{ ...tdNum, padding: '10px 12px', fontSize: 13 }}>{a.impr}</td>
                          <td data-keepcase="1" style={{ ...tdNum, padding: '10px 12px', fontSize: 13 }}>{a.clk}</td>
                          <td data-keepcase="1" style={{ ...tdNum, padding: '10px 12px', fontSize: 13 }}>{a.lpv}</td>
                          <td data-keepcase="1" style={{ ...tdNum, padding: '10px 12px', fontSize: 13 }}>{a.cr}</td>
                          <td data-keepcase="1" style={{ ...tdNum, padding: '10px 4px 10px 12px', fontSize: 13, fontWeight: 600, color: '#771520' }}>{a.leads}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {v.candLoadingView && (
        <div className="b-card b-card--bare" style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          {v.candStatusLabel}
        </div>
      )}
    </div>
  )
}
