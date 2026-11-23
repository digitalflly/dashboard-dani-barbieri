// ============================================================
// Análises detalhadas exibidas na aba Audiência (seção
// "Detalhamento de análises"). Cada análise tem um resumo
// legível (+ detalhes) e o PDF original para download.
// ============================================================

export interface AnaliseSecao {
  h: string
  p?: string
  itens?: string[]
}
export interface Analise {
  id: string
  titulo: string
  subtitulo: string
  meta: string
  pdf: string // link do PDF na pasta do Google Drive (aberto "qualquer pessoa com o link")
  resumo: AnaliseSecao[]
}

export const ANALISES: Analise[] = [
  {
    id: 'tese-trafego-pago',
    titulo: 'A tese do tráfego pago',
    subtitulo: 'O pago traz leads desqualificados?',
    meta: 'Análise de dados · 21/11/2026 · seguidores 01/10–18/11 · aplicações 24/09–19/11',
    pdf: 'https://drive.google.com/file/d/1b9M0srqJWBPdKcYo9e3LXbVG3buMANqf/view',
    resumo: [
      {
        h: 'A tese',
        p: 'A hipótese da equipe era que o tráfego pago estaria trazendo pessoas menos alinhadas à base e ao funil. A análise testa isso com dados (não com percepção), em duas frentes: inferência no nível do dia (seguidores) e ground-truth por pessoa (formulários de aplicação, que trazem profissão, faturamento e origem).',
      },
      {
        h: 'Etapa 1 — Seguidores (inferência no nível do dia)',
        p: 'Regressão ecológica em 49 dias de out/nov estimando a taxa de MQL por origem: Não pago 41,7% (IC 32,6–50,8%) e Pago 34,9% (IC 27,7–42,8%). Os intervalos se sobrepõem — resultado indicativo, não conclusivo. Na regressão controlada por tendência e dia da semana, o efeito do pago caiu para 0,035 negativo (p=0,70), ou seja, perdeu relevância. No nível dos seguidores a hipótese não se sustenta: a intensidade de pago não prevê queda de qualidade.',
      },
      {
        h: 'Qualidade por profissão da base',
        p: 'Reclassificando a base por @ + biografia em 4 categorias (validação com 85% de concordância, 92% de precisão, 87% de cobertura): gente comprovadamente de fora do nicho é só ~3% (3,4% em out, 3,3% em nov). "É do ramo" soma 71,0% (out) e 56,9% (nov). O tráfego não traz a profissão errada — o que cresce em novembro são perfis sem profissão declarada na bio (indeterminados), não gente errada.',
      },
      {
        h: 'Etapa 2 — Aplicação (ground-truth por pessoa)',
        p: 'Dos 384 aplicantes, 381 vieram de tráfego pago e 3 de orgânico (sem grupo de comparação orgânico). Por pessoa: Profissão do ICP 74,5%, Faturamento ≥ R$ 15 mil 11,0%, MQL real (os dois) 7,1%. A profissão está certa na maioria; o faturamento não — 65,9% dos pagos declaram até R$ 8 mil. O gargalo aparece no faturamento, não no perfil.',
      },
      {
        h: 'Veredito',
        p: 'A hipótese está parcialmente correta, mas o eixo é outro. O problema não está na origem (o funil é todo pago, não há orgânico "melhor" para comparar) nem na profissão (apenas ~3% fora do nicho). As duas etapas convergem: os seguidores não pioram com o pago, e a aplicação mostra que o gargalo real é o tier de faturamento.',
      },
      {
        h: 'Recomendações',
        itens: [
          'Não cortar o pago — a profissão está certa e não há orgânico para substituir; cortar verba reduz volume sem corrigir a causa.',
          'Qualificar por faturamento, não por origem: criativo e segmentação que falem com quem já fatura mais, e faturamento mais cedo no funil como filtro.',
          'Revisar a campanha [Qualificados] 10/26 (pior resultado) e migrar verba para as campanhas de Semelhantes (melhor mistura de faturamento).',
          'Trocar o KPI de leads: acompanhar MQL real por campanha (profissão + faturamento), não só volume ou custo por lead.',
          'Fechar a atribuição por pessoa: padronizar UTM nos formulários para leitura direta de origem.',
          'Ampliar a janela de dados: rodar a mesma análise para agosto e setembro aumenta a base e dá mais segurança estatística.',
        ],
      },
      {
        h: 'Ressalvas',
        itens: [
          'Faturamento é autodeclarado; profissionais em início de carreira tendem a subdeclarar, então os tiers valem como ordem de grandeza.',
          'O número de casos por campanha é modesto, então diferenças entre campanhas são direcionais.',
          'A profissão foi classificada por texto livre com palavras-chave, validada em 85% — boa, mas não perfeita.',
          'Etapa 1 é inferência no nível do dia; Etapa 2 é ground-truth por pessoa, porém de uma população autosselecionada (quem aplicou).',
        ],
      },
    ],
  },
]
