# Dashboard de Análise — Danielle Barbieri

Production implementation of the `Dashboard.dc.html` design (Claude Design handoff,
in `../project/`). Painel de análise de performance do Instagram **@danibarbieribeauty**
e das campanhas de tráfego (Facebook/Meta Ads), com leads dos funis lidos ao vivo.

Built as a **React + Vite + TypeScript** single-page app. The visual output matches the
prototype 1:1 (same dani barbieri design tokens — wine `#771520`, gold, cream, Cammron
Round + Arimo — and the same Chart.js charts).

## Páginas

- **Dados da Conta** — 8 KPIs do período + gráficos de seguidores e métricas por dia da semana.
- **Dados dos Conteúdos** — grade de cards das publicações (capa, tipo, data, métricas).
- **Insights dos Conteúdos** — média por post, Top 3 e "o que funcionou / não funcionou".
- **Dados dos Funis** — funil de investimento (Facebook Ads) + tabelas de anúncios/conjuntos
  das campanhas **Sessão Premium** e **Diagnóstico**, com leads dos formulários (Google Sheet).

## Rodar

```bash
npm install
npm run dev        # servidor de desenvolvimento (Vite)
npm run build      # build estático em dist/
npm run preview    # serve o build
```

## Arquitetura

```
src/
  main.tsx              entrada React
  App.tsx               shell: estado de página, título, banner dormente
  styles/               tokens.css (design system) + global.css (.b-card/.b-btn/…)
  components/           Header + ContaPage / ConteudosPage / InsightsPage / FunisPage + ChartCanvas
  lib/
    types.ts            tipos do modelo de dados
    dates.ts rng.ts     helpers de data (UTC) + RNG determinístico
    demo.ts             snapshot gerado (fonte de verdade offline)
    model.ts            buildModel() — o "cérebro": mesma função p/ snapshot e dados ao vivo
    format.ts           fmtNum / fmtPct / delta (pt-BR)
    windsor.ts          Instagram ao vivo (conta + diário + posts), com cache de 30 dias
    facebook.ts         Facebook Ads ao vivo (conta 450830237045296)
    sheets.ts           Google Sheet (CSV) — uma aba por funil
    funnel.ts invest.ts construção dos funis + seção de investimento
    learnings.ts        aprendizados derivados dos números
    charts.ts           configs do Chart.js (linha / barra / rosca)
    cache.ts            cache de posts/capas no localStorage
    viewmodel.ts        view-models das páginas Conta/Conteúdos/Insights
    funisvm.ts          view-model da página de funis
    useDashboard.ts     contêiner de estado + efeitos (mesma lógica do componente original)
```

Princípio preservado do design original: **uma função central (`buildModel`) reconstrói
todo o modelo** — o mesmo caminho de cálculo serve o snapshot embutido e a resposta ao vivo.
O snapshot funciona sem rede; o botão **Atualizar** busca os dados reais.

## Fontes de dados (ao vivo)

- **Windsor.ai** (Instagram + Facebook Ads) — a chave do conector fica embutida no cliente,
  como no protótipo (painel privado de cliente único). Para um repositório público, mova
  `WINDSOR_KEY` em `src/lib/constants.ts` para uma variável de ambiente / configuração não
  versionada antes de publicar.
- **Google Sheet** (formulários dos funis) — lido publicamente via CSV.

Cache: o histórico de publicações fica em `localStorage`; cada atualização busca só os
últimos 30 dias e mescla com o cache. Capas desde jan/2026 são embutidas como JPEG reduzido
para sobreviverem à expiração das URLs assinadas do Instagram.

## Deploy

Build 100% estático (`base: './'`), pronto para GitHub Pages ou qualquer host estático:
publique o conteúdo de `dist/`.
