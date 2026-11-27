import type { CSSProperties } from 'react'
import type { Dashboard } from '../lib/useDashboard'
import { storiesVM } from '../lib/storiesvm'
import ChartCanvas from './ChartCanvas'

const eyebrow: CSSProperties = { fontSize: 11, letterSpacing: 'var(--ls-label)', textTransform: 'uppercase', color: 'var(--text-muted)' }
const sectionTitle: CSSProperties = { fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '-0.01em', fontSize: 22, color: 'var(--text-strong)' }
const cardTitle: CSSProperties = { fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '-0.01em', fontSize: 18, color: 'var(--text-strong)', lineHeight: 1.15 }
const th = (extra: CSSProperties = {}): CSSProperties => ({
  position: 'sticky',
  top: 0,
  background: 'var(--surface-card)',
  zIndex: 1,
  fontSize: 10,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  fontWeight: 600,
  padding: '0 10px 10px',
  whiteSpace: 'nowrap',
  textAlign: 'right',
  ...extra,
})
const td: CSSProperties = { textAlign: 'right', padding: '10px', fontSize: 12.5, color: 'var(--text-strong)', whiteSpace: 'nowrap' }
const tdFirst: CSSProperties = { ...td, textAlign: 'left', padding: '10px 10px 10px 4px', fontSize: 12, fontWeight: 500 }
const tdHl: CSSProperties = { ...td, fontWeight: 600, color: '#771520' }

// botão de filtro (mesmo visual dos seletores de funil e de mês)
const pillBtn = (active: boolean): CSSProperties => ({
  fontFamily: 'var(--font-sans)',
  fontSize: 12.5,
  fontWeight: active ? 600 : 500,
  cursor: 'pointer',
  padding: '8px 16px',
  borderRadius: 6,
  border: `1px solid ${active ? '#771520' : 'var(--border-strong)'}`,
  background: active ? '#771520' : 'transparent',
  color: active ? 'var(--cream)' : 'var(--text-muted)',
  transition: 'var(--transition-base)',
})

function Pending() {
  return (
    <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', padding: '2px 8px', borderRadius: 999, background: '#F4E4C9', color: 'var(--gold-deep)' }}>
      a preencher
    </span>
  )
}

export default function StoriesFunnel({ dash }: { dash: Dashboard }) {
  const { state: S, setState } = dash
  const v = storiesVM(S)

  if (v.empty) {
    return (
      <div className="b-card b-card--bare" style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
        Nenhuma sequência de stories no período selecionado.
      </div>
    )
  }

  return (
    <div>
      {/* ---------- Informações gerais ---------- */}
      <div style={{ margin: '18px 0 16px', display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <div style={sectionTitle}>Informações gerais</div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>só dias com sequência · export manual da meta · horário de brasília</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${v.kpis.length}, minmax(0, 1fr))`, gap: 10, marginBottom: 18 }}>
        {v.kpis.map((k, i) => (
          <div
            key={i}
            className={k.tip ? 'b-card tt tt--pre' : 'b-card'}
            data-tip={k.tip}
            style={{ padding: '14px 14px', minHeight: 96, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '3px solid #771520' }}
          >
            <div style={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', lineHeight: 1.3 }}>{k.label}</div>
            <div>
              <div data-keepcase="1" style={{ fontSize: 26, fontWeight: 600, color: 'var(--text-strong)', lineHeight: 1.05, letterSpacing: '-0.02em' }}>{k.value}</div>
              {k.pending ? (
                <div style={{ marginTop: 4 }}><Pending /></div>
              ) : (
                <div data-keepcase="1" style={{ fontSize: 11, color: 'var(--ink-300)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{k.sub}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ---------- Sequências de stories ---------- */}
      <div style={{ borderTop: '1px solid var(--border-soft)', margin: '26px 0 16px', paddingTop: 24 }}>
        <div style={sectionTitle}>Sequências de stories</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        {/* "ver tudo" ignora o dia selecionado e compara todas as sequências do período */}
        <button onClick={() => setState({ storyAll: !S.storyAll })} style={pillBtn(v.allMode)}>
          Ver tudo
        </button>
        <span style={{ width: 1, alignSelf: 'stretch', background: 'var(--border-soft)', margin: '0 4px' }}></span>
        {v.seqBtns.map((b) => (
          <button key={b.id} onClick={() => setState({ storySeq: b.id, storyAll: false })} style={pillBtn(b.active)}>
            {b.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 16, marginBottom: 16 }}>
        {/* dados de conversão da sequência selecionada */}
        <div className="b-card" style={{ padding: '22px 24px' }}>
          <div style={eyebrow}>{v.selEyebrow}</div>
          <div style={{ ...cardTitle, marginBottom: 16 }}>Dados de conversão</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {v.stages.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  className={s.tip ? 'tt tt--pre' : undefined}
                  data-tip={s.tip}
                  style={{
                    width: s.width + '%',
                    background: s.pending ? '#BCA489' : '#771520',
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
                {s.pending ? (
                  <Pending />
                ) : (
                  <span data-keepcase="1" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-strong)', whiteSpace: 'nowrap' }}>{s.left}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* retenção */}
        <div className="b-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={eyebrow}>Views de cada story ÷ views do 1º</div>
          <div style={{ ...cardTitle, marginBottom: v.allMode ? 4 : 12 }}>{v.allMode ? 'Retenção das sequências' : 'Retenção da sequência'}</div>
          {v.allMode && v.retCfg && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>clique numa sequência da legenda para esconder ou mostrar e comparar</div>
          )}
          {v.retCfg ? (
            <div style={{ flex: 1, minHeight: 240, position: 'relative' }}>
              <ChartCanvas id="stories-ret" config={v.retCfg} />
            </div>
          ) : (
            <div data-keepcase="1" style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.55 }}>{v.retNote}</div>
          )}
        </div>
      </div>

      {/* comparativo */}
      <div className="b-card" style={{ padding: '22px 24px', marginBottom: 16 }}>
        <div style={{ ...eyebrow, marginBottom: 14 }}>Comparativo das sequências</div>
        <div style={{ overflowX: 'auto', margin: '0 -4px' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 1000 }}>
            <thead>
              <tr>
                <th style={th({ textAlign: 'left', padding: '0 10px 10px 4px' })}>Dia</th>
                {['Hora', 'Stories', 'Views 1º story', 'Views no link', 'Retenção', 'Intervalo até o link', 'Alcance do link', 'Interesses', 'Interesse / alcance', 'Aplicações'].map((h) => (
                  <th key={h} style={th()}>{h}</th>
                ))}
                <th style={th({ padding: '0 4px 10px 10px' })}>Agendamentos</th>
              </tr>
            </thead>
            <tbody>
              {v.compare.map((r) => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--border-soft)' }}>
                  <td style={tdFirst}>
                    {r.d}
                    <span data-keepcase="1" style={{ color: 'var(--text-muted)', fontWeight: 400 }}> · {r.name.toLowerCase()}</span>
                  </td>
                  <td data-keepcase="1" style={td}>{r.hora}</td>
                  <td data-keepcase="1" style={td}>{r.n}</td>
                  <td data-keepcase="1" style={td}>{r.first}</td>
                  <td data-keepcase="1" style={td}>{r.lv}</td>
                  <td data-keepcase="1" style={td}>{r.ret}</td>
                  <td style={td}>{r.gap}</td>
                  <td data-keepcase="1" style={td}>{r.reach}</td>
                  <td data-keepcase="1" style={tdHl}>
                    {r.int}
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> {r.intKind}</span>
                  </td>
                  <td data-keepcase="1" style={td}>{r.intRate}</td>
                  <td data-keepcase="1" style={tdHl}>{r.apps}</td>
                  <td data-keepcase="1" style={{ ...td, padding: '10px 4px 10px 10px' }}>
                    {r.agendamentos == null ? (
                      <Pending />
                    ) : r.agendTip ? (
                      <span className="tt tt--pre tt--side" data-tip={r.agendTip} style={{ fontWeight: 600, color: '#771520', borderBottom: '1px dotted #771520' }}>
                        {r.agendamentos}
                      </span>
                    ) : (
                      r.agendamentos
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* stories da sequência selecionada */}
      <div className="b-card" style={{ padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={cardTitle}>{v.storiesTitle}</div>
          <span data-keepcase="1" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v.storiesNote}</span>
        </div>
        <div style={{ overflowX: 'auto', margin: '0 -4px' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 900 }}>
            <thead>
              <tr>
                <th style={th({ textAlign: 'left', padding: '0 10px 10px 4px' })}>Posição</th>
                {['Publicado', 'Tipo', 'Visualizações', 'Retenção', 'Alcance', 'Respostas', 'Visitas ao perfil', 'Cliques no link'].map((h) => (
                  <th key={h} style={th()}>{h}</th>
                ))}
                <th style={th({ padding: '0 4px 10px 10px' })}>Compart.</th>
              </tr>
            </thead>
            <tbody>
              {v.storyRows.map((x, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border-soft)', background: x.isLink ? 'var(--wine-100)' : undefined }}>
                  <td style={tdFirst}>
                    <a href={x.link} target="_blank" rel="noopener noreferrer" title="Abrir o story no Instagram" style={{ color: 'inherit', textDecoration: 'none' }}>
                      {x.pos}
                    </a>
                  </td>
                  <td data-keepcase="1" style={td}>{x.pub}</td>
                  <td style={td}>{x.tipo}</td>
                  <td data-keepcase="1" style={td}>{x.views}</td>
                  <td data-keepcase="1" style={td}>{x.ret}</td>
                  <td data-keepcase="1" style={td}>{x.reach}</td>
                  <td data-keepcase="1" style={td}>{x.resp}</td>
                  <td data-keepcase="1" style={td}>{x.vis}</td>
                  <td data-keepcase="1" style={tdHl}>{x.clk}</td>
                  <td data-keepcase="1" style={{ ...td, padding: '10px 4px 10px 10px' }}>{x.shr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
