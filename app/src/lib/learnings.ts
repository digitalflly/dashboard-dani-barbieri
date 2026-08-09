// ============================================================
// learnings() — derives "o que funcionou / não funcionou"
// readouts from the period's posts. Ported verbatim.
// ============================================================

import { fmtNum, fmtPct } from './format'
import type { MediaPost } from './types'

export interface Learning {
  title: string
  detail: string
}

export interface ThemeRow {
  theme: string
  n: string
  avgReach: string
  rate: string
  saveRate: string
  shareRate: string
  follows: string
  above: boolean
}

interface ThemeStat {
  theme: string
  n: number
  reach: number
  eng: number
  saves: number
  shares: number
  comments: number
  follows: number
  avgReach: number
  rate: number
  saveRate: number
  shareRate: number
  followsPer: number
}

// classifica cada publicação em um TEMA editorial (regras derivadas das legendas reais do perfil)
export function themeOf(p: MediaPost): string {
  const t = String(p.caption || '').toLowerCase()
  const has = (...ws: string[]): boolean => ws.some((w) => t.includes(w))
  // 1) vida pessoal / viagem — marcadores inequívocos, antes de qualquer regra de negócio
  if (has('casamos', 'casamento', 'noiva', 'nossa viagem', 'viagem', 'alberobello', 'itália', 'peru', 'lima', 'trilha', 'chá revelação', 'my baby', 'baby dom', 'mami do dom', 'papai do dom', 'meses de nós', 'meu amado', 'ensaio profissional', 'ancestrais', '#peru', 'energy', 'favorita do mundo', 'me fazendo rir', 'bate bola', 'marido', 'família', 'quantas fotos')) return 'Bastidores / pessoal'
  // 2) eventos e experiências próprias (recaps e bastidores de evento)
  if (has('high beauty day', 'vision business', 'masterclass', 'nosso evento', 'do evento', 'tour ceo', 'experiência que vivemos', 'primeiro lote', 'segundo bloco', 'palestra')) return 'Eventos e experiências'
  // 3) parcerias e marcas
  if (has('parceira', 'parceiro', 'nasceu com o propósito', 'regenera', 'misc ', 'a misc', 'laita', 'regenerativo')) return 'Parcerias e marcas'
  // 4) convite/oferta — CTA
  if (has('comente ', 'escreva "', 'escreva “', 'nos comentários', 'link da bio', 'link na bio', 'faça sua aplicação', 'aplicação no link', 'garanta o seu lugar', 'garantiu o seu lugar', 'está confirmada', 'inscri', 'vagas', 'imersão', 'falta apenas', 'falta 1 dia', 'estarei ao vivo', 'às 10h', 'vou te ensinar', 'esteja comigo', 'me chama', 'chama no direct')) return 'Oferta / convite'
  // 5) prova social — apenas marcadores concretos de resultado (nunca só uma @menção)
  if (has('saiu de r$', 'faturava', 'mentorada', 'mentoradas', 'entrou na high', 'meses de mentoria', 'posso provar', 'placa de 1 milhão', 'plaquinha', 'a história da', 'chegou pra mim com', 'seria “mais do')) return 'Prova social / resultados'
  // 6) avaliação e vendas
  if (has('avaliação', 'avaliações', 'orçamento', 'plano de tratamento', 'protocolo', 'fecha venda', 'fechar venda', 'vender mais caro', 'vender', 'venda', 'cliente fecha', 'some depois', 'objeção', 'promoção')) return 'Avaliação e vendas'
  // 7) equipe
  if (has('contratar', 'contratação', 'equipe', 'secretária', 'colaborador', 'time ', 'o problema é o time', 'funcionári', 'liderar', 'liderança')) return 'Equipe e contratação'
  // 8) metas, planejamento e método
  if (has('meta', 'metas', 'planejamento', 'planejar', 'método', 'improviso', 'improvisa', 'processo', 'estrutura', 'organiz', 'indicadores', 'gestão', 'receita', 'fórmulas prontas')) return 'Metas e planejamento'
  // 9) finanças
  if (has('faturamento', 'financeiro', 'precific', 'cobrar', 'cobra ', 'preço', 'lucro', 'caixa', 'custos', 'cardápio', 'pró-labore', 'r$', 'mil por mês', '100 mil', '6 dígitos', 'não sobra')) return 'Gestão e finanças'
  // 10) sobrecarga e rotina
  if (has('agenda cheia', 'agenda', 'sobrecarreg', 'conciliar', 'liberdade', 'se desdobra', 'exausta', 'cansaç', 'vida pessoal', 'sozinha', 'trabalhar mais', 'maratona', 'ocupad', 'correr atrás de clientes')) return 'Sobrecarga e rotina'
  // 11) posicionamento, visão e mercado
  if (has('posicionament', 'autoridade', 'imagem', 'postura', 'mercado', 'concorrência', 'clínica nova', 'se destacam', 'diferença', 'procura por estética', 'profissionais que', 'cadeira de ceo', 'ceo', 'visão', 'clareza', 'onde quer chegar', 'decidem')) return 'Posicionamento'
  // 12) mentalidade
  if (has('mentalidade', 'decisão', 'decisões', 'não desistir', 'acredit', 'amém', 'deus', 'recuar', 'conselho', 'mereço', 'merece', 'merecimento', 'carta', 'mulher, mãe', 'extraordinário', 'jornada', 'escolha seu difícil', 'sucesso', 'execução')) return 'Mentalidade'
  // 13) educativo
  if (has('dica', 'dicas', 'checklist', 'como ', 'passo', 'ensin', 'aprend', 'erro', 'sinais', 'o que ninguém')) return 'Educativo / dicas'
  return 'Outros'
}

// agrega desempenho por tema
function themeStats(valid: MediaPost[]): ThemeStat[] {
  const g: Record<string, ThemeStat> = {}
  valid.forEach((p) => {
    const k = themeOf(p)
    const o =
      g[k] ||
      (g[k] = { theme: k, n: 0, reach: 0, eng: 0, saves: 0, shares: 0, comments: 0, follows: 0, avgReach: 0, rate: 0, saveRate: 0, shareRate: 0, followsPer: 0 })
    o.n++
    o.reach += p.reach || 0
    o.eng += p.eng || 0
    o.saves += p.saves || 0
    o.shares += p.shares || 0
    o.comments += p.comments || 0
    o.follows += p.follows || 0
  })
  return Object.values(g)
    .map((o) => ({
      ...o,
      avgReach: o.n ? o.reach / o.n : 0,
      rate: o.reach ? (o.eng / o.reach) * 100 : 0,
      saveRate: o.reach ? (o.saves / o.reach) * 100 : 0,
      shareRate: o.reach ? (o.shares / o.reach) * 100 : 0,
      followsPer: o.n ? o.follows / o.n : 0,
    }))
    .sort((a, b) => b.rate - a.rate)
}

export function learnings(
  valid: MediaPost[],
  _followers: number
): { worked: Learning[]; notWorked: Learning[]; themeRows?: ThemeRow[] } {
  if (valid.length < 2)
    return {
      worked: [
        {
          title: 'Dados insuficientes',
          detail: 'Selecione um período com mais conteúdos publicados para gerar aprendizados.',
        },
      ],
      notWorked: [
        { title: 'Dados insuficientes', detail: 'Sem posts suficientes para comparar.' },
      ],
    }
  const avgReach = valid.reduce((a, p) => a + p.reach, 0) / valid.length
  const rate = (p: MediaPost): number => (p.reach ? (p.eng / p.reach) * 100 : 0)
  const sRate = (p: MediaPost): number => (p.reach ? (p.saves / p.reach) * 100 : 0)
  const avgRate = valid.reduce((a, p) => a + rate(p), 0) / valid.length
  const by = (f: (p: MediaPost) => number): MediaPost[] => valid.slice().sort((a, b) => f(b) - f(a))
  const maxReach = by((p) => p.reach)[0]
  const minReach = by((p) => p.reach)[valid.length - 1]
  const maxShare = by((p) => p.shares)[0]
  const maxSave = by(sRate)[0]
  const minSave = by(sRate)[valid.length - 1]
  const maxEng = by(rate)[0]
  const maxComment = by((p) => p.comments)[0]
  const highReachLowEng = by((p) => p.reach).find((p) => rate(p) < avgRate)
  const q = (s: string): string => '“' + s + '”'
  // ── análise por TEMA (não por post) ──
  const ALL = themeStats(valid)
  // rankings só com temas nomeados e com massa mínima — 'Outros' e temas de 1-2 posts
  // continuam na tabela como contexto, mas nunca viram recomendação
  const named = ALL.filter((t) => t.theme !== 'Outros')
  const TH = named.filter((t) => t.n >= 3).length >= 2 ? named.filter((t) => t.n >= 3) : named.filter((t) => t.n >= 2)
  const nT = (v: number): string => fmtNum(Math.round(v))
  if (TH.length >= 2) {
    const byRate = TH.slice().sort((a, b) => b.rate - a.rate)
    const byReach = TH.slice().sort((a, b) => b.avgReach - a.avgReach)
    const bySave = TH.slice().sort((a, b) => b.saveRate - a.saveRate)
    const byShare = TH.slice().sort((a, b) => b.shareRate - a.shareRate)
    const byFoll = TH.slice().sort((a, b) => b.followsPer - a.followsPer)
    const vol = TH.slice().sort((a, b) => b.n - a.n)[0]
    const bR = byRate[0]
    const wR = byRate[byRate.length - 1]
    const bA = byReach[0]
    const wA = byReach[byReach.length - 1]
    const bS = bySave[0]
    const bSh = byShare[0]
    const bF = byFoll[0]
    const share = (t: ThemeStat): string => fmtPct((t.n / valid.length) * 100)
    const worked: Learning[] = [
      { title: 'Tema que mais engaja: ' + bR.theme, detail: bR.n + ' publicações converteram ' + fmtPct(bR.rate) + ' do alcance em interações — contra ' + fmtPct(avgRate) + ' da média geral. É o assunto que a audiência responde; vale aumentar a frequência.' },
      { title: 'Tema de maior alcance: ' + bA.theme, detail: 'Média de ' + nT(bA.avgReach) + ' contas por publicação em ' + bA.n + ' posts, ' + fmtPct((bA.avgReach / avgReach - 1) * 100) + ' acima da média do período. Serve como porta de entrada para gente nova.' },
      { title: 'Mais salvo: ' + bS.theme, detail: fmtPct(bS.saveRate) + ' do alcance salvou esse tipo de conteúdo. Sinal de material de referência — transforme em carrossel e reaproveite.' },
      { title: 'Mais compartilhado: ' + bSh.theme, detail: fmtPct(bSh.shareRate) + ' do alcance compartilhou. É o tema que a audiência usa para conversar com outras pessoas, o que amplia alcance sem anúncio.' },
    ]
    if (bF.followsPer > 0) worked.push({ title: 'Tema que mais traz seguidor: ' + bF.theme, detail: 'Média de ' + bF.followsPer.toFixed(1).replace('.', ',') + ' seguidores por publicação (' + bF.follows + ' no total). É o conteúdo que converte visitante em seguidor.' })
    const notWorked: Learning[] = [
      { title: 'Tema com menor engajamento: ' + wR.theme, detail: wR.n + ' publicações ficaram em ' + fmtPct(wR.rate) + ' de interação, abaixo da média de ' + fmtPct(avgRate) + '. Ou o assunto não interessa a essa audiência, ou a abordagem precisa mudar.' },
      { title: 'Tema de menor alcance: ' + wA.theme, detail: 'Média de só ' + nT(wA.avgReach) + ' contas por publicação, ' + fmtPct((1 - wA.avgReach / avgReach) * 100) + ' abaixo da média. A entrega está limitada — revise gancho e formato antes de insistir.' },
    ]
    if (vol.theme !== bR.theme && vol.rate < avgRate) {
      notWorked.push({ title: 'Esforço mal distribuído: ' + vol.theme, detail: 'É o tema mais publicado (' + vol.n + ' posts, ' + share(vol) + ' do período), mas engaja ' + fmtPct(vol.rate) + ' — abaixo da média. Está consumindo produção sem retorno proporcional; realoque parte desse volume para ' + bR.theme + '.' })
    }
    const lowFoll = TH.filter((t) => t.follows === 0)
    if (lowFoll.length) notWorked.push({ title: 'Não converte seguidor', detail: lowFoll.map((t) => t.theme).join(', ') + ' — nenhum seguidor novo no período, mesmo com alcance. Falta um motivo explícito para seguir no fim do conteúdo.' })
    return {
      worked,
      notWorked,
      themeRows: ALL.map((t) => ({ theme: t.theme, n: String(t.n), avgReach: nT(t.avgReach), rate: fmtPct(t.rate), saveRate: fmtPct(t.saveRate), shareRate: fmtPct(t.shareRate), follows: fmtNum(t.follows), above: t.rate >= avgRate })),
    }
  }
  const worked: Learning[] = [
    {
      title: 'Maior alcance do período',
      detail:
        q(maxReach.caption) +
        ' alcançou ' +
        fmtNum(maxReach.reach) +
        ' contas — ' +
        fmtPct((maxReach.reach / avgReach - 1) * 100) +
        ' acima da média. Repita o formato e o tema.',
    },
    {
      title: 'Mais compartilhado',
      detail:
        q(maxShare.caption) +
        ' teve ' +
        fmtNum(maxShare.shares) +
        ' compartilhamentos. Conteúdo que as pessoas enviam para amigos amplia alcance — vale uma sequência.',
    },
    {
      title: 'Melhor taxa de salvamento',
      detail:
        q(maxSave.caption) +
        ' salvou ' +
        fmtPct(sRate(maxSave)) +
        ' do alcance. Sinal de conteúdo de referência; transforme em carrossel salvável.',
    },
    {
      title: 'Mais engajante',
      detail:
        q(maxEng.caption) +
        ' converteu ' +
        fmtPct(rate(maxEng)) +
        ' do alcance em interações. Use a mesma abertura nos próximos posts.',
    },
    {
      title: 'Gerou conversa',
      detail:
        q(maxComment.caption) +
        ' recebeu ' +
        fmtNum(maxComment.comments) +
        ' comentários. Perguntas na legenda funcionam — mantenha o convite à resposta.',
    },
  ]
  const notWorked: Learning[] = [
    {
      title: 'Menor alcance do período',
      detail:
        q(minReach.caption) +
        ' atingiu apenas ' +
        fmtNum(minReach.reach) +
        ' contas, ' +
        fmtPct((1 - minReach.reach / avgReach) * 100) +
        ' abaixo da média. Revise horário e gancho inicial.',
    },
    {
      title: 'Pior taxa de salvamento',
      detail:
        q(minSave.caption) +
        ' salvou só ' +
        fmtPct(sRate(minSave)) +
        ' do alcance. Faltou valor prático para guardar; adicione um "porquê salvar".',
    },
  ]
  if (highReachLowEng) {
    notWorked.push({
      title: 'Alcançou muito, engajou pouco',
      detail:
        q(highReachLowEng.caption) +
        ' chegou a ' +
        fmtNum(highReachLowEng.reach) +
        ' contas mas só ' +
        fmtPct(rate(highReachLowEng)) +
        ' interagiram. O tema atrai, mas a chamada para ação precisa ser mais clara.',
    })
  }
  notWorked.push({
    title: 'Abaixo da média de interação',
    detail:
      'Posts com taxa inferior a ' +
      fmtPct(avgRate) +
      ' puxam a média para baixo. Concentre esforço nos formatos que já performam.',
  })
  return { worked, notWorked }
}
