import type { CSSProperties } from 'react'
import type { Dashboard } from '../lib/useDashboard'
import { audienceVM } from '../lib/audience'
import ChartCanvas from './ChartCanvas'

const eyebrow: CSSProperties = { fontSize: 11, letterSpacing: 'var(--ls-label)', textTransform: 'uppercase', color: 'var(--text-muted)' }
const sectionTitle: CSSProperties = { fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '-0.01em', fontSize: 22, color: 'var(--text-strong)' }
const cardTitle: CSSProperties = { fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '-0.01em', fontSize: 18, color: 'var(--text-strong)', lineHeight: 1.15 }
const noteStyle: CSSProperties = { fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.55, marginTop: 10 }

function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ margin: '0 0 14px' }}>
      <div style={sectionTitle}>{title}</div>
      {sub && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 5, lineHeight: 1.5 }}>{sub}</div>}
    </div>
  )
}

export default function AudienciaPage({ dash }: { dash: Dashboard }) {
  const { model: M, state: S } = dash
  const v = audienceVM(M, S)

  if (!v.ready) {
    return (
      <div className="b-card" style={{ padding: '28px 24px', textAlign: 'center' }}>
        <div style={{ ...cardTitle, marginBottom: 6 }}>
          {v.error ? 'Não foi possível carregar a audiência' : 'Carregando a audiência…'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {v.error
            ? v.error + ' — os dados de demografia vêm ao vivo do Instagram (Windsor). Tente Atualizar no topo.'
            : 'Lendo a demografia e o comportamento dos seus seguidores direto do Instagram.'}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.5 }}>
        Retrato de quem te segue hoje — <strong style={{ color: 'var(--text-strong)' }}>{v.base}</strong> seguidores mapeados.
        Demografia é foto atual (lifetime); comportamento é dos últimos dias. Atualizado em {v.fetchedAt}.
      </div>

      {/* ---------- BLOCO 1 — FIT COM O ICP ---------- */}
      <SectionHead title="Fit com o cliente ideal" sub="O quanto da sua base tem o perfil de quem compra: mulher, 25-54 anos, no Brasil." />

      <div className="b-card" style={{ padding: '22px 24px', marginBottom: 16, borderTop: '3px solid var(--wine-800)' }}>
        <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 'none' }}>
            <div style={eyebrow}>Índice de fit (núcleo ICP)</div>
            <div style={{ fontSize: 46, fontWeight: 700, color: 'var(--wine-800)', lineHeight: 1, letterSpacing: '-0.02em', marginTop: 4 }}>{v.fitScore}</div>
            <div style={{ fontSize: 13, color: 'var(--text-strong)', fontWeight: 600, marginTop: 6, maxWidth: 240, lineHeight: 1.35 }}>{v.fitHeadline}</div>
          </div>
          <div style={{ flex: '1 1 320px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
            {v.fitChips.map((c, i) => (
              <div key={i} style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-md)', padding: '11px 13px' }}>
                <div style={{ fontSize: 10.5, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{c.label}</div>
                <div data-keepcase="1" style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-strong)', lineHeight: 1.1, marginTop: 3 }}>{c.value}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-300)', marginTop: 2 }}>{c.hint}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={noteStyle}>
          O índice estima a fatia da base que é <strong>mulher de 25-54 anos no Brasil</strong> — o coração do seu público comprador.
          É uma combinação dos recortes de gênero, idade e país (que o Instagram reporta separadamente), então leia como aproximação, não soma exata.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 30 }}>
        <div className="b-card" style={{ padding: '20px 22px' }}>
          <div style={eyebrow}>Composição</div>
          <div style={{ ...cardTitle, marginBottom: 12 }}>Gênero</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <div style={{ width: 160, height: 160, position: 'relative', flex: 'none' }}>
              <ChartCanvas id="aud-gender" config={v.genderDonut} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: '1 1 120px' }}>
              {v.genderLegend.map((g, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 11, height: 11, borderRadius: 3, flex: 'none', background: g.color }}></span>
                  <span style={{ fontSize: 13, color: 'var(--text-strong)' }}>{g.label}</span>
                  <span data-keepcase="1" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginLeft: 'auto' }}>{g.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="b-card" style={{ padding: '20px 22px' }}>
          <div style={eyebrow}>Composição</div>
          <div style={{ ...cardTitle, marginBottom: 12 }}>Faixa etária</div>
          <div style={{ height: 180, position: 'relative' }}>
            <ChartCanvas id="aud-age" config={v.ageBars} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginTop: 12 }}>
            {v.ageTable.map((a, i) => (
              <span key={i} style={{ fontSize: 11.5, color: a.isCore ? 'var(--wine-800)' : 'var(--text-muted)', fontWeight: a.isCore ? 600 : 400 }}>
                <span data-keepcase="1">{a.age}</span>: <span data-keepcase="1">{a.pct}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- BLOCO 2 — QUALIDADE / ATIVAÇÃO ---------- */}
      <SectionHead title="Qualidade e ativação" sub="A base é grande — mas o quanto ela realmente acompanha e interage com o conteúdo?" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 16 }}>
        {v.qualityKpis.map((k, i) => (
          <div key={i} className="b-card" style={{ padding: '14px 16px', borderTop: `3px solid ${k.accent}` }}>
            <div style={{ fontSize: 10.5, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', lineHeight: 1.3 }}>{k.label}</div>
            <div data-keepcase="1" style={{ fontSize: 26, fontWeight: 600, color: 'var(--text-strong)', lineHeight: 1.05, marginTop: 6, letterSpacing: '-0.02em' }}>{k.value}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-300)', marginTop: 3 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="b-card" style={{ padding: '20px 22px', marginBottom: 30 }}>
        <div style={eyebrow}>Tendência</div>
        <div style={{ ...cardTitle, marginBottom: 12 }}>% do alcance que vem de seguidores</div>
        <div style={{ height: 190, position: 'relative' }}>{v.followerReachLine && <ChartCanvas id="aud-follower-reach" config={v.followerReachLine} />}</div>
        <div style={noteStyle}>{v.qualityNote}</div>
      </div>

      {/* ---------- BLOCO 3 — GEOGRAFIA ---------- */}
      <SectionHead title="Geografia — nacional x local" sub="Onde sua audiência está: concentração regional vs. alcance nacional." />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
        <div className="b-card" style={{ padding: '20px 22px' }}>
          <div style={eyebrow}>Top cidades</div>
          <div style={{ ...cardTitle, marginBottom: 12 }}>Seguidores por cidade</div>
          <div style={{ height: 280, position: 'relative' }}>
            <ChartCanvas id="aud-cities" config={v.cityBars} />
          </div>
        </div>
        <div className="b-card" style={{ padding: '20px 22px' }}>
          <div style={eyebrow}>Top estados</div>
          <div style={{ ...cardTitle, marginBottom: 12 }}>Seguidores por estado</div>
          <div style={{ height: 280, position: 'relative' }}>
            <ChartCanvas id="aud-states" config={v.stateBars} />
          </div>
        </div>
      </div>

      <div className="b-card" style={{ padding: '20px 22px', marginBottom: 30 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 'none' }}>
            <div style={eyebrow}>Brasil</div>
            <div data-keepcase="1" style={{ fontSize: 34, fontWeight: 700, color: 'var(--wine-800)', lineHeight: 1, letterSpacing: '-0.02em', marginTop: 4 }}>{v.brShare}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-300)', marginTop: 3 }}>{v.nonBrShare} fora do Brasil</div>
          </div>
          <div style={{ flex: '1 1 260px' }}>
            <div style={eyebrow}>Países (top 6)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 8 }}>
              {v.topCountries.map((c, i) => (
                <span key={i} style={{ fontSize: 12.5, color: 'var(--text-strong)' }}>
                  {c.name} <span data-keepcase="1" style={{ color: 'var(--text-muted)' }}>{c.pct}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
        <div style={noteStyle}>{v.localNote}</div>
      </div>

      {/* ---------- BLOCO 4 — PONTE COM VENDAS ---------- */}
      <SectionHead title="Ponte com vendas" sub="De audiência a cliente: quanto desse público avança no funil." />

      <div className="b-card" style={{ padding: '22px 24px', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
          {v.funnel.map((f, i) => (
            <div key={i} style={{ position: 'relative', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
              <div style={{ fontSize: 10.5, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', lineHeight: 1.3, minHeight: 26 }}>{f.label}</div>
              <div data-keepcase="1" style={{ fontSize: 28, fontWeight: 700, color: 'var(--wine-800)', lineHeight: 1.05, marginTop: 4, letterSpacing: '-0.02em' }}>{f.value}</div>
              {f.rate && <div data-keepcase="1" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-strong)', marginTop: 3 }}>{f.rate}</div>}
              <div style={{ fontSize: 11, color: 'var(--ink-300)', marginTop: 4, lineHeight: 1.4 }}>{f.note}</div>
            </div>
          ))}
        </div>
        <div style={noteStyle}>{v.funnelNote}</div>
      </div>
    </div>
  )
}
