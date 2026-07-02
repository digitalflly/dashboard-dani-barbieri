// ============================================================
// "Plano de Conteúdo" — página de análise/relatório estático.
// Portada da seção isPlano de Dashboard.dc.html (conteúdo fixo,
// derivado de project/uploads/Analise_Instagram_DaniBarbieri_2026.md).
// ============================================================

import type { CSSProperties, ReactNode } from 'react'

const ACCENT = '#771520'
const GREEN = '#1F8A5B'

const eyebrow: CSSProperties = {
  fontSize: 11,
  letterSpacing: 'var(--ls-label)',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  marginBottom: 5,
}
const sectionTitle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontWeight: 600,
  letterSpacing: '-0.01em',
  fontSize: 22,
  color: 'var(--text-strong)',
}
const cardLabel: CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  fontWeight: 600,
  marginBottom: 12,
}

type Align = 'left' | 'right' | 'center'
type Em = 'accent' | 'bold' | 'strong' | 'muted' | 'body'
interface Cell {
  t: string
  align?: Align
  em?: Em
}
interface Col {
  label: string
  align?: Align
}

function emStyle(em: Em = 'body'): CSSProperties {
  switch (em) {
    case 'accent':
      return { color: ACCENT, fontWeight: 600 }
    case 'bold':
      return { color: 'var(--text-strong)', fontWeight: 600 }
    case 'strong':
      return { color: 'var(--text-strong)' }
    case 'muted':
      return { color: 'var(--text-muted)' }
    default:
      return { color: 'var(--text-body)' }
  }
}

function Section({ n, title, sub }: { n: string; title: string; sub?: ReactNode }) {
  return (
    <div style={{ margin: '0 0 16px' }}>
      <div style={eyebrow}>{n}</div>
      <div style={sectionTitle}>{title}</div>
      {sub && (
        <div style={{ fontSize: 14, color: 'var(--text-body)', lineHeight: 1.55, marginTop: 8, maxWidth: 820 }}>{sub}</div>
      )}
    </div>
  )
}

function DataTable({ cols, rows }: { cols: Col[]; rows: Cell[][] }) {
  const thStyle = (align: Align, i: number, len: number): CSSProperties => ({
    textAlign: align,
    padding: i === 0 ? '0 8px 10px 0' : i === len - 1 && align === 'left' ? '0 0 10px 12px' : '0 8px 10px',
    fontSize: 10,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    fontWeight: 600,
  })
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          {cols.map((c, i) => (
            <th key={i} style={thStyle(c.align || 'right', i, cols.length)}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri}>
            {row.map((cell, ci) => {
              const align = cell.align || cols[ci].align || 'right'
              return (
                <td
                  key={ci}
                  style={{
                    textAlign: align,
                    padding: ci === 0 ? '11px 8px 11px 0' : ci === row.length - 1 && align === 'left' ? '11px 0 11px 12px' : '11px 8px',
                    borderTop: '1px solid var(--border-soft)',
                    fontSize: 13,
                    ...emStyle(cell.em),
                  }}
                >
                  {cell.t}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Note({ children, top }: { children: ReactNode; top?: boolean }) {
  return (
    <div
      style={{
        fontSize: 13,
        color: 'var(--text-body)',
        lineHeight: 1.55,
        marginTop: 14,
        ...(top ? { paddingTop: 14, borderTop: '1px solid var(--border-soft)' } : {}),
      }}
    >
      {children}
    </div>
  )
}

export default function PlanoPage() {
  return (
    <div>
      {/* 01 · Panorama */}
      <Section n="01 · Panorama" title="Análise geral do perfil" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Base atual', value: '38.221', sub: 'seguidores' },
          { label: 'Crescimento · 30 dias', value: '+534', sub: '~18/dia · ~1,4% no mês' },
          { label: 'Volume · semestre', value: '133', sub: '45 Reels · 81 carrosséis · 7 imagens' },
          { label: 'Alcance médio', value: 'em queda', sub: 'jan ~2.360 → jun ~1.470' },
        ].map((k, i) => (
          <div key={i} className="b-card" style={{ padding: '16px 18px', borderTop: `3px solid ${ACCENT}` }}>
            <div style={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 600, color: 'var(--text-strong)', letterSpacing: '-0.02em', marginTop: 8 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="b-card" style={{ padding: '22px 24px', marginBottom: 30 }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 16, color: 'var(--text-strong)', marginBottom: 4 }}>Desempenho por formato</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
          Taxa de engajamento = interações ÷ alcance × 100 — mede a qualidade do conteúdo, não o tamanho da base.
        </div>
        <DataTable
          cols={[
            { label: 'Formato', align: 'left' },
            { label: 'Posts' },
            { label: 'Alcance médio' },
            { label: 'Saves/post' },
            { label: 'Engajamento' },
          ]}
          rows={[
            [{ t: 'Reels', align: 'left', em: 'accent' }, { t: '45', em: 'strong' }, { t: '2.719', em: 'bold' }, { t: '10,4', em: 'strong' }, { t: '6,4%', em: 'accent' }],
            [{ t: 'Carrossel', align: 'left', em: 'bold' }, { t: '81', em: 'strong' }, { t: '1.666', em: 'strong' }, { t: '7,5', em: 'strong' }, { t: '4,7%', em: 'strong' }],
            [{ t: 'Imagem única', align: 'left', em: 'bold' }, { t: '7', em: 'strong' }, { t: '1.996', em: 'strong' }, { t: '15,1', em: 'accent' }, { t: '4,1%', em: 'strong' }],
          ]}
        />
        <Note top>
          <strong style={{ color: 'var(--text-strong)' }}>Leitura:</strong> Reels lideram alcance e engajamento com folga, mas são minoria da produção. Imagem única tem o maior save por post e está subutilizada.
        </Note>
      </div>

      {/* 02 · Carrosséis */}
      <Section n="02 · Carrosséis" title="O problema não é o carrossel — é o excesso de venda dura" />
      <div className="b-card" style={{ padding: '22px 24px', marginBottom: 16 }}>
        <DataTable
          cols={[
            { label: 'Tipo de carrossel', align: 'left' },
            { label: 'n' },
            { label: 'Alcance' },
            { label: 'Saves' },
            { label: 'Shares' },
            { label: 'Leitura', align: 'left' },
          ]}
          rows={[
            [{ t: 'Pessoal', align: 'left', em: 'bold' }, { t: '14', em: 'strong' }, { t: '3.848', em: 'accent' }, { t: '5,9', em: 'strong' }, { t: '6,2', em: 'strong' }, { t: 'Melhor alcance da conta; autêntico', align: 'left' }],
            [{ t: 'Prova (case)', align: 'left', em: 'accent' }, { t: '6', em: 'strong' }, { t: '1.460', em: 'strong' }, { t: '7,0', em: 'strong' }, { t: '13,2', em: 'accent' }, { t: 'Melhor share — capta público novo', align: 'left' }],
            [{ t: 'Educativo', align: 'left', em: 'accent' }, { t: '6', em: 'strong' }, { t: '1.261', em: 'strong' }, { t: '18,3', em: 'accent' }, { t: '3,3', em: 'strong' }, { t: 'Melhor save — constrói autoridade', align: 'left' }],
            [{ t: 'Confirmação VBE', align: 'left' }, { t: '10' }, { t: '1.488' }, { t: '2,1' }, { t: '3,9' }, { t: 'Repetitivo, sem valor de conteúdo', align: 'left', em: 'muted' }],
            [{ t: 'Bastidor de evento', align: 'left' }, { t: '5' }, { t: '1.382' }, { t: '2,0' }, { t: '2,8' }, { t: 'Recap; alcance ok', align: 'left', em: 'muted' }],
            [{ t: 'Institucional', align: 'left' }, { t: '3' }, { t: '1.366' }, { t: '4,3' }, { t: '2,0' }, { t: 'Neutro', align: 'left', em: 'muted' }],
            [{ t: 'Venda dura', align: 'left', em: 'bold' }, { t: '34', em: 'strong' }, { t: '1.109', em: 'accent' }, { t: '9,4', em: 'strong' }, { t: '4,2', em: 'strong' }, { t: '42% dos carrosséis; puxou a média', align: 'left' }],
          ]}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 16, marginBottom: 30 }}>
        <div className="b-card" style={{ padding: '20px 22px', background: 'var(--warning-bg)', borderColor: 'transparent' }}>
          <div style={{ ...cardLabel, color: ACCENT, marginBottom: 8 }}>Ponto crítico</div>
          <div style={{ fontSize: 13.5, color: 'var(--wine-900)', lineHeight: 1.6 }}>
            A venda dura desabou em junho para <strong>705 de alcance</strong> (contra 1.255 em jan–mai), com a blitz NEA + HBP rodando junto. Os piores posts do ano (210, 229, 336) são todos desse bloco — foi isso que distorceu a média e criou a impressão de que "carrossel não funciona".
          </div>
        </div>
        <div className="b-card" style={{ padding: '20px 22px' }}>
          <div style={{ ...cardLabel, color: 'var(--text-muted)', marginBottom: 10 }}>Validados para escalar em teste</div>
          <div style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.55, marginBottom: 10 }}>
            <strong style={{ color: ACCENT }}>Prova (case):</strong> maior share da conta (13,2/post) — captação direta para o funil. Só 6 no semestre.
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.55 }}>
            <strong style={{ color: ACCENT }}>Educativo salvável:</strong> maior save da conta (18,3/post) — o algoritmo recompensa com distribuição futura. Sumiu depois de fevereiro.
          </div>
        </div>
      </div>

      {/* 03 · Reels */}
      <Section n="03 · Reels" title="A retenção é uma escada — com degrau brutal aos 15 segundos" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="b-card" style={{ padding: '22px 24px' }}>
          <div style={{ ...cardLabel, marginBottom: 14, color: 'var(--text-muted)' }}>Retenção × alcance</div>
          <DataTable
            cols={[
              { label: 'Retenção', align: 'left' },
              { label: 'Reels' },
              { label: 'Alcance' },
              { label: 'Coment./post' },
            ]}
            rows={[
              [{ t: '< 6s', align: 'left' }, { t: '7' }, { t: '1.233' }, { t: '0,1' }],
              [{ t: '6–9s', align: 'left', em: 'strong' }, { t: '18', em: 'strong' }, { t: '2.220', em: 'strong' }, { t: '4,1', em: 'strong' }],
              [{ t: '9–15s', align: 'left', em: 'strong' }, { t: '9', em: 'strong' }, { t: '2.225', em: 'strong' }, { t: '4,0', em: 'strong' }],
              [{ t: '15–20s', align: 'left', em: 'accent' }, { t: '7', em: 'strong' }, { t: '4.520', em: 'accent' }, { t: '48,3', em: 'accent' }],
              [{ t: '20s+', align: 'left', em: 'accent' }, { t: '4', em: 'strong' }, { t: '5.523', em: 'accent' }, { t: '31,8', em: 'strong' }],
            ]}
          />
          <Note top>
            Abaixo de 15s o alcance empaca em ~2.200. Passou de 15s, ele <strong style={{ color: ACCENT }}>dobra</strong>. Reter menos de 7s = alcance 1.600; reter 15s+ = alcance 4.885 (3× mais, mesmo esforço).
          </Note>
        </div>
        <div className="b-card" style={{ padding: '22px 24px' }}>
          <div style={{ ...cardLabel, marginBottom: 14, color: 'var(--text-muted)' }}>Assinatura dos vencedores</div>
          <DataTable
            cols={[
              { label: 'Faixa', align: 'left' },
              { label: 'Retenção' },
              { label: 'Shares' },
              { label: 'Coment.' },
            ]}
            rows={[
              [{ t: 'Top (≥ 4k)', align: 'left', em: 'accent' }, { t: '18,5s', em: 'accent' }, { t: '36,7', em: 'strong' }, { t: '69,3', em: 'accent' }],
              [{ t: 'Médio (2–4k)', align: 'left', em: 'strong' }, { t: '10,3s', em: 'strong' }, { t: '6,2', em: 'strong' }, { t: '5,3', em: 'strong' }],
              [{ t: 'Baixo (< 2k)', align: 'left' }, { t: '9,1s' }, { t: '4,5' }, { t: '0,8' }],
            ]}
          />
          <Note top>
            Os campeões <strong style={{ color: ACCENT }}>retêm 15s+ E provocam conversa</strong> (69 comentários contra 5 no grupo médio). O Reel que funciona é o de opinião/posição que segura o tempo e dá motivo para responder. Reel que só informa fica no teto.
          </Note>
        </div>
      </div>
      <div className="b-card" style={{ padding: '18px 22px', marginBottom: 30, borderLeft: `3px solid ${ACCENT}` }}>
        <div style={{ fontSize: 13.5, color: 'var(--text-body)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text-strong)' }}>Confirmação da queda recente:</strong> maio e junho caíram para 9,1s e 7,4s de retenção, e o alcance dos Reels travou em ~2.500. Quando a retenção cai, o alcance cai junto — não foi o algoritmo, foi o conteúdo segurando menos.
        </div>
      </div>

      {/* 04 · Balanço */}
      <Section n="04 · Balanço" title="Erros e acertos" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 30 }}>
        <div className="b-card" style={{ padding: '22px 24px' }}>
          <div style={{ ...cardLabel, marginBottom: 14, color: GREEN }}>O que foi bom</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['Reels de opinião com retenção alta + gatilho de comentário', ' — os virais de mar/abr (15.167, 8.402, 7.996). É o motor de captação.'],
              ['Carrossel pessoal', ' — verdade e vida; o maior alcance de qualquer conteúdo (3.848).'],
              ['Carrossel de prova', ' — melhor share da conta e conexão direta com o funil, mas subaproveitado.'],
              ['Educativo salvável de fevereiro', ' — 18 a 30 saves por post, construindo autoridade.'],
            ].map(([b, rest], i) => (
              <div key={i} style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-strong)' }}>{b}</strong>
                {rest}
              </div>
            ))}
          </div>
        </div>
        <div className="b-card" style={{ padding: '22px 24px' }}>
          <div style={{ ...cardLabel, marginBottom: 14, color: ACCENT }}>O que foi ruim</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['Excesso de venda dura em carrossel', ' — 34 posts (42%). Em junho saturou e derrubou a distribuição da conta inteira.'],
              ['10 carrosséis de confirmação quase idênticos', ' — save de 2,1; volume sem valor que dilui o sinal de qualidade.'],
              ['Abandono do educativo salvável depois de fevereiro', ' — o formato de maior save sumiu na fase de lançamento.'],
              ['Retenção de Reels despencou em mai/jun e volume sem seleção', ' — abril teve 45 posts e o alcance caiu.'],
            ].map(([b, rest], i) => (
              <div key={i} style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-strong)' }}>{b}</strong>
                {rest}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 05 · Plano */}
      <Section
        n="05 · Plano do próximo mês"
        title="Inverter o mix, não aumentar o volume"
        sub={
          <>
            Meta: sair de ~1,4%/mês para <strong style={{ color: ACCENT }}>3–4%/mês</strong> (~1.100 a 1.500 seguidores/mês).
          </>
        }
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="b-card" style={{ padding: '22px 24px' }}>
          <div style={{ ...cardLabel, marginBottom: 14, color: 'var(--text-muted)' }}>Mix semanal · 5 a 6 posts</div>
          <DataTable
            cols={[
              { label: 'Formato', align: 'left' },
              { label: '/semana', align: 'center' },
              { label: 'Função', align: 'left' },
              { label: 'Sinal', align: 'left' },
            ]}
            rows={[
              [{ t: 'Reels de opinião', align: 'left', em: 'accent' }, { t: '3', align: 'center', em: 'bold' }, { t: 'Atração', align: 'left' }, { t: 'Alcance + comentário', align: 'left' }],
              [{ t: 'Carrossel de prova', align: 'left', em: 'bold' }, { t: '1 → 2', align: 'center', em: 'accent' }, { t: 'Captação', align: 'left' }, { t: 'Shares', align: 'left' }],
              [{ t: 'Educativo salvável', align: 'left', em: 'bold' }, { t: '1', align: 'center', em: 'bold' }, { t: 'Autoridade', align: 'left' }, { t: 'Saves', align: 'left' }],
              [{ t: 'Pessoal', align: 'left', em: 'bold' }, { t: '1', align: 'center', em: 'strong' }, { t: 'Conexão', align: 'left' }, { t: 'Alcance + afinidade', align: 'left' }],
            ]}
          />
        </div>
        <div className="b-card" style={{ padding: '22px 24px' }}>
          <div style={{ ...cardLabel, marginBottom: 12, color: 'var(--text-muted)' }}>Teste de 4 semanas</div>
          <div style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.55, marginBottom: 16 }}>
            Subir a prova para 2×/semana, reintroduzir 1 educativo salvável fixo por semana e <strong style={{ color: ACCENT }}>cortar a venda dura de carrossel pela metade</strong>.
          </div>
          <div style={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 10 }}>Métricas de sucesso</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['Share do carrossel de prova', '≥ 12'],
              ['Save do educativo', '≥ 15'],
              ['Retenção média dos Reels', '≥ 15s'],
            ].map(([k, val], i, arr) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 8,
                  paddingBottom: i < arr.length - 1 ? 8 : 0,
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border-soft)' : 'none',
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--text-body)' }}>{k}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: ACCENT }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3 alavancas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
        {[
          ['1', 'Gancho + retenção nos Reels', '3 primeiros segundos com tese forte, uma virada no meio, fechamento que pede comentário. Subir de 9s para 18s de retenção sozinho triplica o alcance dos Reels.'],
          ['2', 'Cortar o volume morto', 'Confirmações repetidas e venda dura em excesso. Limpa o sinal de qualidade e recupera a distribuição geral da conta.'],
          ['3', 'Consistência de Reels', 'Nunca abaixo de 3 por semana. Todo mês que a conta afrouxou em Reels, o alcance caiu.'],
        ].map(([n, title, body], i) => (
          <div key={i} className="b-card" style={{ padding: '22px 24px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, color: ACCENT, lineHeight: 1, marginBottom: 12 }}>{n}</div>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15, color: 'var(--text-strong)', marginBottom: 8 }}>{title}</div>
            <div style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.55 }}>{body}</div>
          </div>
        ))}
      </div>

      {/* regra de ouro + checklist */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 40 }}>
        <div className="b-card" style={{ padding: '22px 24px', background: ACCENT, borderColor: 'transparent' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(250,248,247,0.65)', fontWeight: 600, marginBottom: 12 }}>Regra de ouro</div>
          <div style={{ fontSize: 14, color: '#FAF8F7', lineHeight: 1.6 }}>
            Durante lançamento, a venda vai para o Reels e para os stories — <strong>não empilha carrossel de venda no feed</strong>. O feed segue entregando prova e conteúdo salvável, que é o que sustenta a distribuição de tudo, inclusive dos próprios posts de venda.
          </div>
        </div>
        <div className="b-card" style={{ padding: '22px 24px' }}>
          <div style={{ ...cardLabel, marginBottom: 14, color: 'var(--text-muted)' }}>Checklist por Reel · antes de publicar</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['Gancho nos 3 primeiros segundos', ' — tese/afirmação forte, não introdução.'],
              ['Estrutura que segura até 15s+', ' — uma virada no meio, não entregar tudo no começo.'],
              ['Fechamento que pede resposta', ' — pergunta ou afirmação que puxa comentário.'],
            ].map(([b, rest], i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ flex: 'none', width: 24, height: 24, borderRadius: 999, background: 'var(--warning-bg)', color: ACCENT, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                <span style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--text-strong)' }}>{b}</strong>
                  {rest}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
