// ============================================================
// NEA 2ª Edição — snapshot de vendas (planilha vendas-nea) + investimento
// (Facebook [NEA] [VENDAS]). Atualização manual. Gerado de
// project/nea-vendas-data.js.
// ============================================================

export interface NeaDailyRow {
  d: string
  inv: number
  ing: number
  fat: number
  ob: number
  conv: number
  compras: number
  ads: number
  org: number
  tk: number | null
  cst: number | null
}
export interface NeaVendas {
  atualizadoEm: string
  periodo: string
  investimento: number
  investimentoComImposto: number
  cpm: number
  custoCliqueLink: number
  ingressos: number
  ingressosAds: number
  ingressosOrg: number
  faturamentoBruto: number
  orderbumps: number
  taxaConvOrderbump: number
  compras: number
  ritmoMedio: number
  ticketMedio: number
  custoCompraGeral: number
  porDia: NeaDailyRow[]
}

export const NEA_VENDAS: NeaVendas = {"atualizadoEm":"2026-07-17","periodo":"09/06 – 21/06 2026","investimento":10181.16,"investimentoComImposto":11418.17,"cpm":30.15,"custoCliqueLink":3.65,"ingressos":41,"ingressosAds":22,"ingressosOrg":19,"faturamentoBruto":4014,"orderbumps":12,"taxaConvOrderbump":17.1,"compras":41,"ritmoMedio":3.4,"ticketMedio":97.9,"custoCompraGeral":248.32,"porDia":[{"d":"09/06","inv":312.33,"ing":1,"fat":97,"ob":0,"conv":0,"compras":1,"ads":1,"org":0,"tk":97,"cst":312.33},{"d":"10/06","inv":760.76,"ing":4,"fat":288,"ob":0,"conv":0,"compras":4,"ads":4,"org":0,"tk":72,"cst":190.19},{"d":"11/06","inv":714.55,"ing":0,"fat":0,"ob":0,"conv":0,"compras":0,"ads":0,"org":0,"tk":null,"cst":null},{"d":"12/06","inv":412.87,"ing":3,"fat":241,"ob":0,"conv":0,"compras":3,"ads":0,"org":3,"tk":80.33,"cst":137.62},{"d":"13/06","inv":534.58,"ing":1,"fat":97,"ob":0,"conv":0,"compras":1,"ads":0,"org":1,"tk":97,"cst":534.58},{"d":"14/06","inv":573.57,"ing":4,"fat":285,"ob":1,"conv":25,"compras":4,"ads":2,"org":2,"tk":71.25,"cst":143.39},{"d":"15/06","inv":620.97,"ing":2,"fat":144,"ob":0,"conv":0,"compras":2,"ads":1,"org":1,"tk":72,"cst":310.49},{"d":"16/06","inv":836.87,"ing":7,"fat":717,"ob":4,"conv":28.6,"compras":7,"ads":5,"org":2,"tk":102.43,"cst":119.55},{"d":"17/06","inv":711.49,"ing":3,"fat":291,"ob":0,"conv":0,"compras":3,"ads":1,"org":2,"tk":97,"cst":237.16},{"d":"18/06","inv":650.44,"ing":4,"fat":432,"ob":2,"conv":25,"compras":4,"ads":3,"org":1,"tk":108,"cst":162.61},{"d":"19/06","inv":728.79,"ing":3,"fat":449,"ob":4,"conv":66.7,"compras":3,"ads":3,"org":0,"tk":149.67,"cst":242.93},{"d":"20/06","inv":663.35,"ing":6,"fat":629,"ob":1,"conv":16.7,"compras":6,"ads":2,"org":4,"tk":104.83,"cst":110.56},{"d":"21/06","inv":141.58,"ing":6,"fat":441,"ob":0,"conv":0,"compras":6,"ads":0,"org":6,"tk":73.5,"cst":23.6}]}
