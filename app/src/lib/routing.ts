// ============================================================
// Roteamento por URL — cada aba tem seu próprio caminho
// (ex.: /conta, /funis, /audiencia). Usa a History API nativa;
// o rewrite do Vercel (/(.*) -> /index.html) garante que abrir
// o link direto (ou recarregar) sirva o app na aba certa.
// ============================================================

import type { PageKey } from './useDashboard'

// aba -> slug na URL
export const PAGE_SLUG: Record<PageKey, string> = {
  conta: 'conta',
  conteudos: 'conteudos',
  candidaturas: 'funis',
  audiencia: 'audiencia',
  plano: 'acompanhamento',
  resultados: 'resultados',
  insights: 'insights',
}

// slug -> aba (inverso de PAGE_SLUG)
const SLUG_PAGE: Record<string, PageKey> = Object.fromEntries(
  Object.entries(PAGE_SLUG).map(([page, slug]) => [slug, page as PageKey])
) as Record<string, PageKey>

// título da aba (vira o <title> da página)
export const PAGE_TITLE: Record<PageKey, string> = {
  conta: 'Dados da Conta',
  conteudos: 'Dados dos Conteúdos',
  candidaturas: 'Dados dos Funis',
  audiencia: 'Dados da Audiência',
  plano: 'Acompanhamento',
  resultados: 'Resultados Mensais',
  insights: 'Insights',
}

export const DEFAULT_PAGE: PageKey = 'conta'
const TITLE_SUFFIX = 'Danielle Barbieri'

// primeiro segmento do caminho -> aba (cai na aba padrão se não reconhecer)
export function pageFromPath(pathname: string): PageKey {
  const slug = pathname.replace(/^\/+|\/+$/g, '').split('/')[0].toLowerCase()
  return SLUG_PAGE[slug] || DEFAULT_PAGE
}

export function pathFromPage(page: PageKey): string {
  return '/' + (PAGE_SLUG[page] || PAGE_SLUG[DEFAULT_PAGE])
}

export function titleForPage(page: PageKey): string {
  return (PAGE_TITLE[page] || PAGE_TITLE[DEFAULT_PAGE]) + ' · ' + TITLE_SUFFIX
}
