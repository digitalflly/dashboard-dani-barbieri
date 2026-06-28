// ============================================================
// Static configuration — API keys, account ids, funnel specs,
// brand palettes. Ported from Dashboard.dc.html.
//
// NOTE: the Windsor.ai key is a per-client connector key that the
// prototype embeds directly in the front-end (the dashboard is a
// private, single-client report). Kept here for parity.
// ============================================================

import type { FunnelSpec } from './types'

export const ADS_ACCOUNT_ID = '450830237045296'

export const ADS_CAMPAIGN_MATCH: Record<string, RegExp> = {
  premium: /sess[aã]o\s*premium/i,
  diagnostico: /diagn[oó]stico/i,
}

export const SHEET_ID = '1SEHe4kbnkOj_D5l4vCvnvEM2pPObgCrX25elBh_FH1o'

// degradê do vermelho da marca (intenso → claro)
export const RED_RAMP = ['#771520', '#6B131D', '#5F111A', '#530F17', '#470C13', '#3B0A10', '#2F070C']

// funis = abas da planilha
export const FUNNELS: FunnelSpec[] = [
  {
    key: 'premium',
    name: 'Funil Sessão Premium',
    gid: '1964935362',
    dateCol: 0,
    statusCol: 13,
    statusMap: { completed: 'Completas', incomplete: 'Incompletas', '': 'Sem status' },
    charts: [
      { title: 'Estrutura de atuação', eyebrow: 'Perfil', col: 7, kind: 'estrutura', horizontal: true, dropNI: true },
      { title: 'Cenário de vendas', eyebrow: 'Volume de vendas', col: 8, kind: 'cenario', donut: true },
      { title: 'Faixa de faturamento', eyebrow: 'Últimos 3 meses', col: 9, kind: 'revenue' },
      { title: 'Área de maior dificuldade', eyebrow: 'Principal dor', col: 6, donut: true },
    ],
  },
  {
    key: 'diagnostico',
    name: 'Funil Diagnóstico',
    gid: '171327521',
    dateCol: 0,
    statusCol: 25,
    scoreCol: 22,
    statusMap: { Completo: 'Completas', Incompleto: 'Incompletas', '': 'Sem status' },
    charts: [
      { title: 'Possui clínica própria', eyebrow: 'Estrutura', col: 5, kind: 'clinica', donut: true },
      { title: 'Faixa de faturamento', eyebrow: 'Por mês', col: 8, kind: 'fatdiag', dropNI: true, horizontal: true },
      { title: 'Tamanho da equipe', eyebrow: 'Time', col: 7, kind: 'equipe', donut: true },
    ],
  },
]

export const PAGE_ACCENTS: Record<string, string> = {
  conta: '#771520',
  conteudos: '#9A7637',
  insights: '#C2A05B',
}

export const WEEK_COLORS = ['#771520', '#C2A05B', '#A5293A', '#9A7637', '#BCA489', '#5A0F18', '#9C846C', '#8E1A28']

export const COVER_BG = ['#771520', '#771520', '#771520', '#771520', '#771520', '#771520', '#771520', '#771520']

// Windsor.ai — conexão ao vivo (chave do cliente; visível no fonte do arquivo)
export const WINDSOR_KEY = 'cc5920b6dff9cc53e32402809e467b617f83'
export const HANDLE = 'danibarbieribeauty'
export const BRAND_NAME = 'Danielle Barbieri'

export const ACCENT = '#771520'
