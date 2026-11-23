import { useState, type CSSProperties } from 'react'
import type { Dashboard } from '../lib/useDashboard'
import { audienceVM, type AudBar } from '../lib/audience'
import { PREVIA_CARDS, PREVIA_BARS, QUAL_MONTHS, WOMAN_ICON } from '../lib/audienceQual'
import { doughnutCfg } from '../lib/charts'
import ChartCanvas from './ChartCanvas'

const sectionTitle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontWeight: 600,
  letterSpacing: '-0.01em',
  fontSize: 22,
  color: 'var(--text-strong)',
}
const eyebrow: CSSProperties = { fontSize: 11, letterSpacing: 'var(--ls-label)', textTransform: 'uppercase', color: 'var(--text-muted)' }
const kpiLabel: CSSProperties = { fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', lineHeight: 1.25 }
const barTrack: CSSProperties = { height: 8, background: 'var(--border-soft)', borderRadius: 4, overflow: 'hidden' }
const subNote: CSSProperties = { fontSize: 12, color: 'var(--text-muted)', marginTop: 5, lineHeight: 1.55 }

function BarList({ title, rows }: { title: string; rows: AudBar[] }) {
  return (
    <div className="b-card" style={{ padding: '20px 22px' }}>
      <div style={{ ...eyebrow, marginBottom: 16 }}>{title}</div>
      {rows.map((r, i) => (
        <div key={i} style={{ marginBottom: i === rows.length - 1 ? 0 : 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 12.5, marginBottom: 5 }}>
            <span data-keepcase="1" style={{ color: 'var(--text-strong)' }}>{r.label}</span>
            <span style={{ color: 'var(--text-muted)' }}>
              <b data-keepcase="1" style={{ color: 'var(--text-strong)' }}>{r.value}</b>
              {r.pct ? <> · {r.pct}</> : null}
            </span>
          </div>
          <div style={barTrack}>
            <div style={{ height: '100%', width: r.width, background: '#771520', borderRadius: 4 }}></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AudienciaPage({ dash }: { dash: Dashboard }) {
  const { model: M, state: S } = dash
  const v = audienceVM(M, S)
  const [mqlMonth, setMqlMonth] = useState<'out' | 'nov'>('out')

  if (!v.ready) {
    const text = v.error
      ? 'Não foi possível carregar a audiência ao vivo: ' + v.error
      : 'Carregando dados de audiência ao vivo…'
    return (
      <div className="b-card" style={{ padding: '16px 18px', color: 'var(--text-muted)', fontSize: 13 }} data-keepcase="1">
        {text}
      </div>
    )
  }

  const month = QUAL_MONTHS.find((m) => m.key === mqlMonth) || QUAL_MONTHS[0]
  const donutId = 'mql-donut-' + month.key

  return (
    <div>
      {/* ---------- KPIs ---------- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 24 }}>
        {v.kpis.map((k, i) => (
          <div
            key={i}
            className="b-card"
            style={{ padding: '14px 14px', minHeight: 104, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: `3px solid ${k.accent}` }}
          >
            <div style={kpiLabel}>{k.label}</div>
            <div>
              <div data-keepcase="1" style={{ fontSize: 26, fontWeight: 600, color: 'var(--text-strong)', lineHeight: 1.05, letterSpacing: '-0.02em' }}>{k.value}</div>
              <div data-keepcase="1" style={{ fontSize: 11, color: 'var(--ink-300)', marginTop: 4 }}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ---------- Demografia dos seguidores ---------- */}
      <div style={{ margin: '0 0 14px' }}>
        <div style={sectionTitle}>Demografia dos seguidores</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, alignItems: 'start', marginBottom: 4 }}>
        {/* persona */}
        <div className="b-card" style={{ padding: '18px 16px', borderTop: '3px solid #771520' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={WOMAN_ICON} width={64} height={124} alt="Ícone de mulher — perfil predominante da audiência" style={{ flex: 'none', display: 'block' }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>Perfil predominante</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {([['Gênero', v.persona.gender], ['Faixa etária', v.persona.age], ['Estado', v.persona.state]] as [string, string][]).map(([lab, val], i) => (
                  <div key={i}>
                    <div style={{ fontSize: 8.5, letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{lab}</div>
                    <div data-keepcase="1" style={{ fontSize: 11.5, fontWeight: 600, color: '#771520', marginTop: 1 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <BarList title="Gênero" rows={v.gender} />
        <BarList title="Faixa etária" rows={v.age} />
        <BarList title="Top cidades" rows={v.cities} />
        <BarList title="Top estados" rows={v.states} />
      </div>

      {/* ---------- Perfis com identificação prévia de qualificadas ---------- */}
      <div style={{ margin: '34px 0 14px' }}>
        <div style={sectionTitle}>Perfis com identificação prévia de qualificadas</div>
        <div data-keepcase="1" style={subNote}>
          Toda a base classificada apenas pelo nome de usuário (@), cruzando com a lista de profissões qualificadas do funil: Médica/Dra,
          Biomédica Esteta, Dentista/HOF, Micropigmentadora e Designer de Sobrancelhas, Fisioterapeuta Dermatofuncional e Dermatologista.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 14 }}>
        {PREVIA_CARDS.map((c, i) => (
          <div
            key={i}
            className="b-card"
            style={{ padding: '14px 14px', minHeight: 104, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '3px solid #771520' }}
          >
            <div style={kpiLabel}>{c.label}</div>
            <div>
              <div data-keepcase="1" style={{ fontSize: 26, fontWeight: 600, color: 'var(--text-strong)', lineHeight: 1.05, letterSpacing: '-0.02em' }}>{c.value}</div>
              <div data-keepcase="1" style={{ fontSize: 11, color: 'var(--ink-300)', marginTop: 4 }}>{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="b-card" style={{ padding: '20px 22px', marginBottom: 14 }}>
        <div style={{ ...eyebrow, marginBottom: 16 }}>Quebra por profissão qualificada identificada no @</div>
        {PREVIA_BARS.map((b, i) => (
          <div key={i} style={{ marginBottom: i === PREVIA_BARS.length - 1 ? 0 : 11 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 12.5, marginBottom: 5 }}>
              <span data-keepcase="1" style={{ color: 'var(--text-strong)' }}>{b.label}</span>
              <span style={{ color: 'var(--text-muted)' }}>
                <b data-keepcase="1" style={{ color: 'var(--text-strong)' }}>{b.value}</b> · {b.pctLabel}
              </span>
            </div>
            <div style={barTrack}>
              <div style={{ height: '100%', width: b.width, background: '#771520', borderRadius: 4 }}></div>
            </div>
          </div>
        ))}
      </div>

      {/* ---------- Detalhamento por mês · @ + biografia ---------- */}
      <div style={{ margin: '30px 0 12px' }}>
        <div style={{ ...sectionTitle, fontSize: 16 }}>Detalhamento por mês · @ + biografia</div>
        <div data-keepcase="1" style={subNote}>
          Nos meses em que coletamos a biografia dos seguidores, cruzamos @ + bio para identificar se a profissão está dentro das qualificadas.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {QUAL_MONTHS.map((m) => {
          const active = m.key === mqlMonth
          return (
            <button
              key={m.key}
              onClick={() => setMqlMonth(m.key)}
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 12.5,
                fontWeight: active ? 600 : 500,
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: 6,
                border: active ? '1px solid #771520' : '1px solid var(--border-strong)',
                background: active ? '#771520' : 'transparent',
                color: active ? 'var(--cream)' : 'var(--text-muted)',
              }}
            >
              {m.label}
            </button>
          )
        })}
      </div>

      <div data-keepcase="1" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-strong)', letterSpacing: '-0.01em', margin: '2px 0 14px' }}>{month.title}</div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'stretch', flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ flex: '1 1 300px', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, alignContent: 'start' }}>
          {month.cards.map((c, i) => (
            <div
              key={i}
              className="b-card"
              style={{ padding: '12px 13px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 6, minHeight: 120, borderTop: '3px solid #771520' }}
            >
              <div style={kpiLabel}>{c.label}</div>
              <div>
                <div data-keepcase="1" style={{ fontSize: 26, fontWeight: 600, color: c.hot ? '#b0202f' : 'var(--text-strong)', lineHeight: 1.05, letterSpacing: '-0.02em' }}>{c.value}</div>
                <div data-keepcase="1" style={{ fontSize: 11, color: 'var(--ink-300)', marginTop: 4 }}>{c.sub}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
          <div className="b-card" style={{ padding: '20px 22px', display: 'flex', alignItems: 'stretch', gap: 20, height: '100%', minHeight: 190 }}>
            <div style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={eyebrow}>Quebra por profissão qualificada (@ + bio)</div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <div id={donutId + '-lg'} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}></div>
              </div>
            </div>
            <div style={{ flex: '0 0 190px', maxWidth: 190, position: 'relative', minHeight: 150 }}>
              <ChartCanvas id={donutId} config={doughnutCfg(month.donut)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
