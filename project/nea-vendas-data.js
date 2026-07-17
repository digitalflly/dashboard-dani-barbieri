/* NEA 2ª Edição — snapshot de vendas (planilha vendas-nea) + investimento (Facebook [NEA] [VENDAS]).
   Atualização MANUAL: quando pedirem "atualiza", releio a planilha do Drive + o gerenciador e regravo este arquivo.
   Definições combinadas:
   - ingressos = pessoas que compraram ao menos 1 tier de ingresso (Basic/SS/VIP/Upgrade/Gravação); exclui os 2 orderbumps.
   - compra = por pessoa/dia (agrupa o que ela comprou junto naquele dia).
   - orderbumps = unidades vendidas dos 2 produtos (10 Scripts… / Guia Express…).
   - investimento = gasto das campanhas com [NEA] [VENDAS] no nome; com imposto = ×1,1215.
   Obs.: 09/06 pode estar levemente subestimado (limite de leitura da planilha cortou 1-2 linhas mais antigas).
*/
window.__NEA_VENDAS__ = {
  atualizadoEm: '2026-07-17',
  periodo: '09/06 – 21/06 2026',
  investimento: 10181.16,        // gasto Facebook [NEA] [VENDAS] (junho)
  investimentoComImposto: 11418.17,
  cpm: 30.15,
  custoCliqueLink: 3.65,
  ingressos: 41,
  ingressosAds: 22,
  ingressosOrg: 19,
  faturamentoBruto: 4014.00,     // soma da coluna "Preço base do produto" (pagos)
  orderbumps: 12,
  taxaConvOrderbump: 17.1,       // % das compras com ≥1 orderbump (7 de 41)
  compras: 41,
  ritmoMedio: 3.4,               // compras por dia (41 / 12 dias com venda)
  ticketMedio: 97.90,            // faturamento / compras
  custoCompraGeral: 248.32,      // investimento / compras
  // Diário: inv = investimento COM imposto do dia; tk/cst = null quando não há compra
  porDia: [
    { d:'09/06', inv:312.33,  ing:1, fat:97.00,  ob:0,  conv:0,    compras:1, ads:1, org:0, tk:97.00,  cst:312.33 },
    { d:'10/06', inv:760.76,  ing:4, fat:288.00, ob:0,  conv:0,    compras:4, ads:4, org:0, tk:72.00,  cst:190.19 },
    { d:'11/06', inv:714.55,  ing:0, fat:0,      ob:0,  conv:0,    compras:0, ads:0, org:0, tk:null,   cst:null   },
    { d:'12/06', inv:412.87,  ing:3, fat:241.00, ob:0,  conv:0,    compras:3, ads:0, org:3, tk:80.33,  cst:137.62 },
    { d:'13/06', inv:534.58,  ing:1, fat:97.00,  ob:0,  conv:0,    compras:1, ads:0, org:1, tk:97.00,  cst:534.58 },
    { d:'14/06', inv:573.57,  ing:4, fat:285.00, ob:1,  conv:25.0, compras:4, ads:2, org:2, tk:71.25,  cst:143.39 },
    { d:'15/06', inv:620.97,  ing:2, fat:144.00, ob:0,  conv:0,    compras:2, ads:1, org:1, tk:72.00,  cst:310.49 },
    { d:'16/06', inv:836.87,  ing:7, fat:717.00, ob:4,  conv:28.6, compras:7, ads:5, org:2, tk:102.43, cst:119.55 },
    { d:'17/06', inv:711.49,  ing:3, fat:291.00, ob:0,  conv:0,    compras:3, ads:1, org:2, tk:97.00,  cst:237.16 },
    { d:'18/06', inv:650.44,  ing:4, fat:432.00, ob:2,  conv:25.0, compras:4, ads:3, org:1, tk:108.00, cst:162.61 },
    { d:'19/06', inv:728.79,  ing:3, fat:449.00, ob:4,  conv:66.7, compras:3, ads:3, org:0, tk:149.67, cst:242.93 },
    { d:'20/06', inv:663.35,  ing:6, fat:629.00, ob:1,  conv:16.7, compras:6, ads:2, org:4, tk:104.83, cst:110.56 },
    { d:'21/06', inv:141.58,  ing:6, fat:441.00, ob:0,  conv:0,    compras:6, ads:0, org:6, tk:73.50,  cst:23.60  }
  ]
};
