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

export function learnings(
  valid: MediaPost[],
  _followers: number
): { worked: Learning[]; notWorked: Learning[] } {
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
