// ============================================================
// Audiência — análise de qualificação dos seguidores (curada).
// Dados extraídos manualmente (classificação da base por @ + bio
// contra a lista de profissões do ICP). Porta fiel dos blocos
// estáticos "Perfis com identificação prévia de qualificadas" e
// "Detalhamento por mês · @ + biografia" do Dashboard.dc.html.
// ============================================================

import type { TallyItem } from './types'

export interface PreviaCard {
  label: string
  value: string
  sub: string
}
export interface PreviaBar {
  label: string
  value: string
  pctLabel: string
  width: string
}
export interface QualCard {
  label: string
  value: string
  sub: string
  hot?: boolean
}
export interface QualMonth {
  key: 'out' | 'nov'
  label: string
  title: string
  cards: QualCard[]
  donut: TallyItem[]
}

// --- Perfis com identificação prévia de qualificadas (base toda, só pelo @) ---
export const PREVIA_CARDS: PreviaCard[] = [
  { label: 'Identificadas como qualificadas pelo @', value: '1.691 · 4,2%', sub: 'o @ traz o termo da profissão' },
  { label: 'Estética / beauty genérico', value: '2.172 · 5,4%', sub: 'sinaliza o nicho, não garante qualificada' },
  { label: 'Sem sinal de profissão no @', value: '36.295 · 90,4%', sub: '@ é nome próprio — indefinido' },
]

export const PREVIA_BARS: PreviaBar[] = [
  { label: 'Micropigmentação / Designer de sobrancelhas', value: '1.020', pctLabel: '2,5% da base', width: '100%' },
  { label: 'Médica / Dra / Dermatologista', value: '541', pctLabel: '1,3% da base', width: '53%' },
  { label: 'Fisioterapeuta Dermatofuncional', value: '71', pctLabel: '0,2% da base', width: '7%' },
  { label: 'Biomédica Esteta', value: '57', pctLabel: '0,1% da base', width: '5.6%' },
  { label: 'Dentista / Odonto / HOF', value: '44', pctLabel: '0,1% da base', width: '4.3%' },
]

// --- Detalhamento por mês · @ + biografia ---
export const QUAL_MONTHS: QualMonth[] = [
  {
    key: 'out',
    label: 'Outubro',
    title: 'Outubro/2026 · 980 perfis',
    cards: [
      { label: 'Identificadas como qualificadas (@ + bio)', value: '387 · 39,5%', sub: 'o @ ou a bio indica a profissão' },
      { label: 'Estética / beauty genérico', value: '309 · 31,5%', sub: 'nicho, mas não é profissão qualificada' },
      { label: 'Não qualificada', value: '33 · 3,4%', sub: 'tem profissão, fora do nicho' },
      { label: 'Sem identificação', value: '251 · 25,6%', sub: 'nem @ nem bio indicam profissão' },
    ],
    donut: [
      { label: 'Micropigmentação / Designer de sobrancelhas', count: 247 },
      { label: 'Médica / Dra / Dermatologista', count: 46 },
      { label: 'Biomédica Esteta', count: 42 },
      { label: 'Dentista / Odonto / HOF', count: 30 },
      { label: 'Harmonização facial / Estética clínica', count: 10 },
      { label: 'Fisioterapeuta Dermatofuncional', count: 12 },
    ],
  },
  {
    key: 'nov',
    label: 'Novembro',
    title: 'Novembro/2026 · 727 perfis',
    cards: [
      { label: 'Identificadas como qualificadas (@ + bio)', value: '254 · 34,9%', sub: 'o @ ou a bio indica a profissão', hot: true },
      { label: 'Estética / beauty genérico', value: '160 · 22,0%', sub: 'nicho, mas não é profissão qualificada' },
      { label: 'Não qualificada', value: '24 · 3,3%', sub: 'tem profissão, fora do nicho' },
      { label: 'Sem identificação', value: '289 · 39,8%', sub: 'nem @ nem bio indicam profissão', hot: true },
    ],
    donut: [
      { label: 'Micropigmentação / Designer de sobrancelhas', count: 146 },
      { label: 'Biomédica Esteta', count: 43 },
      { label: 'Médica / Dra / Dermatologista', count: 34 },
      { label: 'Dentista / Odonto / HOF', count: 14 },
      { label: 'Harmonização facial / Estética clínica', count: 5 },
      { label: 'Fisioterapeuta Dermatofuncional', count: 12 },
    ],
  },
]

// ícone de mulher — perfil predominante da audiência (embutido, portável ao deploy)
export const WOMAN_ICON = 'data:image/png;base64,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'
