# Dashboard de Análise de Conteúdo — Documentação Técnica

> Documento de referência para **replicar a estrutura deste dashboard em um novo projeto**, com um visual diferente.
> A ideia: entregar este `.md` ao Claude junto com um briefing de marca/visual, e ele recria a mesma arquitetura, páginas e cálculos — trocando apenas a aparência e a fonte de dados.

Dashboard atual: análise de performance do Instagram da **Nathalia Heringer**, com dados servidos pela **Windsor.ai** e calendário de produção do **Notion**.

---

## 1. Visão geral

É um **painel de página única (SPA)** em React, sem build/bundler — os arquivos `.js` são carregados direto por `<script>` no `index.html`, usando `React.createElement` (sem JSX/Babel). Gráficos via **Chart.js**. Roda 100% no navegador a partir de um **snapshot de dados embutido**, e tem um botão **Atualizar** que busca dados ao vivo de uma função serverless na Vercel.

Princípios de arquitetura que devem ser preservados ao replicar:

1. **Uma função central reconstrói todo o modelo** (`buildDashboardData(raw)`). O mesmo código serve o snapshot embutido e a resposta ao vivo da API — nunca há dois caminhos de cálculo.
2. **Camada de dados separada da camada visual.** Cálculos ficam em `dashboard-data.js` e nas páginas; o visual (cores/fontes) é centralizado em `theme.css` + objeto `COLORS`.
3. **Snapshot embutido = fonte de verdade offline.** Funciona sem backend; a API só atualiza.
4. **Filtros globais de período** (mês / semana ISO) no cabeçalho, aplicados por todas as páginas que dependem de tempo.

---

## 2. Stack e estrutura de arquivos

**Stack:** HTML + React 18 (UMD) + Chart.js + Web Components vanilla (`image-slot`). Sem JSX, sem bundler, sem dependências de build. Deploy estático + 1 função serverless (Node) na Vercel.

```
index.html                  Shell: carrega libs e todos os módulos na ordem certa
theme.css                   Fontes (@font-face) + paleta (variáveis CSS) — A CARA DO PRODUTO
fonts/                      Arquivos .otf das fontes da marca
lib/                        react.min.js, react-dom.min.js, chart.min.js (locais, p/ offline)
image-slot.js               Web component: placeholder de imagem arrastável (capas)

dashboard-data.js           CAMADA DE DADOS: buildDashboardData(raw) + snapshot embutido
dashboard-media.js          Snapshot: array de posts publicados (window.MEDIA_DATA)
dashboard-stories.js        Snapshot: stories (window.STORIES_DATA)
dashboard-bank.js           Snapshot: banco de posts do Notion (window.BANCO_POSTS)
dashboard-audience.js       Snapshot: dados demográficos (window.AUDIENCE_DATA)

dashboard-ui.js             Componentes compartilhados: COLORS, Header, KPICard,
                            ChartCard, ChartCanvas, fmtNum/fmtPct, accents por página
dashboard-refresh.js        Cliente do /api/refresh (botão Atualizar)
dashboard-app.js            App shell React: estado de página/filtros, roteamento

dashboard-page-conta.js     Página 1: Dados da Conta
dashboard-page-conteudos.js Página 2: Dados dos Conteúdos
dashboard-page-stories.js   Página 3: Dados de Stories
dashboard-page-insights.js  Página 4: Insights
dashboard-page-banco.js     Página 5: Banco de Posts

api/refresh.js              Função serverless (Vercel): Windsor.ai + Notion → JSON
vercel.json                 Config de deploy
media/<id>.jpg              Capas dos posts baixadas (uma por post)
```

**Ordem de carregamento (importa):** libs → `dashboard-data.js` → snapshots → `dashboard-ui.js` → `dashboard-refresh.js` → páginas → `dashboard-app.js` (que faz o `ReactDOM.createRoot(...).render(<App/>)`).

---

## 3. Fontes de dados (APIs)

### 3.1 Windsor.ai (Instagram) — métricas

Conector REST: `https://connectors.windsor.ai/instagram?api_key=…&fields=…&date_from=…&date_to=…`. Retorna JSON (array ou `{data:[…]}`). A chave fica **só no servidor** (env `WINDSOR_API_KEY`). Conta IG: `17841401155274275`.

Consultas usadas (cada uma é um conjunto de `fields`):

| Consulta | Campos (fields) | Vira |
|---|---|---|
| profile | `followers_count, follows_count, media_count, name, username` | total de seguidores, nome, @ |
| daily | `date, views, reach, total_interactions, shares, likes, comments, saves, profile_links_taps` | série diária |
| follows | `date, follows_and_unfollows` | saldo líquido de seguidores/dia |
| media | `media_id, timestamp, media_type, media_product_type, media_caption, media_like_count, media_comments_count, media_reach, media_shares, media_saved, media_engagement, media_views, media_url, media_thumbnail_url` | posts publicados |
| stories | `date, story_reach, story_replies` | snapshot de stories (sem capa/data) |
| audience | `audience_gender_name/size, audience_age_name/size, city, audience_city_size` | demografia |

**Capas:** `media_url` (capa de feed/carrossel) e `media_thumbnail_url` (capa de reels). São URLs **assinadas e temporárias** (expiram em dias). Por isso, no snapshot, as capas são **baixadas e salvas** em `media/<media_id>.jpg` (redimensionadas a ~480px). Ao vivo, usa-se a URL direto.

**Limitações conhecidas da Windsor (documentar para o novo projeto):**
- `follows_and_unfollows` e `profile_links_taps` **não finalizam os últimos 1–2 dias** (voltam 0). O dashboard marca esses dias como "em apuração" e mostra `—`.
- **Stories** só têm snapshot atual (alcance + respostas), sem capa, data de publicação ou histórico.
- **Não existe atribuição por post** de seguidores ganhos nem cliques na bio — só o total diário da conta.

### 3.2 Notion — calendário/banco de posts

API oficial `POST https://api.notion.com/v1/databases/{id}/query` (paginado), header `Notion-Version: 2022-06-28` e `Authorization: Bearer {NOTION_TOKEN}`. Requer uma **integração interna** conectada ao database. Propriedades lidas: `Titulo do post`, `Etapa do Funil` (select), `Formato` (select), `Status Copy` (status), `Status` (status), `Data da postagem` (date).

Uso: (a) **Banco de Posts** = posts ainda não publicados (`Status` ≠ Postado/Cancelado e `Status Copy` ≠ "Copy a fazer"); (b) opcionalmente casar `Etapa do Funil` aos posts publicados pela data.

> Observação: a leitura em massa do Notion via MCP exige plano Business; a API oficial (usada na serverless) **não** tem essa limitação.

---

## 4. Camada de dados — `buildDashboardData(raw)`

Recebe um objeto `raw` e devolve o modelo computado. **Formato de entrada:**

```js
raw = {
  profile: { name, handle, initial, followers },
  daily:   [ { date, views, reach, interactions, taps, shares, likes, comments, saves } ],
  follows: [ { date, net } ],          // net = saldo diário de seguidores
  media:   [ { id, ts, type, likes, comments, shares, saves, views, reach, eng, caption, cover } ],
  postCounts: { isoWeek: count }        // opcional; senão é derivado de media
}
```

**O que ela calcula e expõe:**

- **`WEEKS`** — semanas ISO geradas entre a data mínima e máxima dos dados. Cada uma: `{ iso, year, label:'SNN - dd/mm a dd/mm', start, end }`. Semana começa na segunda.
- **`MONTHS`** — meses presentes nos dados.
- **`DEFAULT_WEEK`** — a semana que contém a data mais recente (filtro inicial padrão de todas as páginas).
- **`getDaily(account, month, weekIso)`** — linhas diárias filtradas pelo período.
- **`getFollowerTimeline(...)`** — série de seguidores **reconstruída de trás pra frente**: o último dia = total atual de seguidores; recuando, subtrai o `net` de cada dia. (Não há série histórica de total na API, só o saldo diário.)
- **`aggregateDaily(...)`** — soma do período: views, reach, interactions, taps, shares, likes, comments, saves; + `engRateGeneral`, `engRateFollowers`, `postCount`.
- **`getComparison(...)`** — variações % para os indicadores de crescimento (ver §6).

---

## 5. Páginas — estrutura e cálculo de cada indicador

Cabeçalho comum (`Header`): título, "Atualizado dd/mm", botão Atualizar, navegação entre as 5 páginas, seletor de **mês** e de **semana**. Os seletores de período são **ocultos** na página Banco de Posts (ela ignora datas).

Todos os percentuais são exibidos com **2 casas decimais**.

### 5.1 Página "Dados da Conta"

**Linha de 8 KPIs** (valor do período + variação vs período anterior):

| KPI | Cálculo |
|---|---|
| Seguidores | total atual; variação = (último seguidor do período − último do período anterior) / anterior. Mostra também o **número absoluto** ganho/perdido ao lado |
| Visualizações | Σ views do período |
| Alcance | Σ reach |
| Interações | Σ total_interactions |
| Cliques na bio | Σ profile_links_taps |
| Conteúdos | Σ POST_COUNTS das semanas do período |
| % Eng. geral | Interações ÷ Alcance × 100 |
| % Eng. seguidores | Interações ÷ Seguidores × 100 |

**Gráfico 1 — Crescimento de Seguidores:** linha, eixo x = dias (dd/mm), série = `getFollowerTimeline`.

**Gráfico 2 — Métrica selecionável (por semana):** eixo x = **dias da semana (Seg→Dom)**, **uma linha por semana** do período. Seletor de métrica:
- Visualizações (contagem/dia), Alcance (contagem/dia)
- Taxa de Interação = interactions ÷ reach × 100 (por dia)
- Taxa de Salvamento = saves ÷ reach × 100
- Taxa de Compartilhamento = shares ÷ reach × 100

**Gráficos 3 e 4 — Engajamento por Semana** (lado a lado, mesmo eixo dias-da-semana, linha por semana):
- **% Eng. Seguidores/dia** = interactions ÷ seguidores × 100
- **% Eng. Geral/dia** = interactions ÷ reach × 100

### 5.2 Página "Dados dos Conteúdos"

Grade de cards (240px), em duas seções: **Conteúdos postados** e **Reels de teste** (reels com `reach < 500` — audiência restrita/teste). Cada card:
- Capa (imagem baixada `m.thumb`, ou URL ao vivo `m.cover`, ou `image-slot` para arrastar)
- Etiqueta de tipo (Reel/Carrossel/Imagem) + data
- Linha estilo Instagram: ♥ likes · 💬 comentários · ↗ compart. · 🔖 salvamentos
- Métricas (mesma ordem dos KPIs da Conta):
  - Visualizações = views · Alcance = reach · Interações = `eng`
  - % Eng. geral = eng ÷ reach × 100
  - % Eng. seguidor = eng ÷ seguidores × 100
  - Taxa de salvamento = saves ÷ reach × 100
  - Taxa de compartilhamento = shares ÷ reach × 100
  - Cliques na bio = total de taps **do dia** do post (`—` se o dia ainda estiver "em apuração")

> `eng` (interações do post) = `media_engagement` da Windsor, ou, na ausência, `likes + comments + shares + saves`.

### 5.3 Página "Dados de Stories"

Como a Windsor só dá um snapshot atual de stories: o **dia do último sync** mostra os **stories individuais** (cartões com Alcance, Respostas, Taxa de resposta = replies ÷ reach × 100); os **demais dias** da semana mostram um **"Resumo do dia"** (Alcance, Visualizações, Interações do dia). Cada fileira de dia tem navegação por setas (carrossel).

### 5.4 Página "Insights"

- **Média do período** (card): médias por post sobre os posts válidos (`reach > 0`, excluindo reels de teste): alcance, visualizações, interações, comentários, compartilhamentos, salvamentos médios; % Eng. geral = Σeng÷Σreach×100; % Eng. seguidores = (Σeng÷n)÷seguidores×100.
- **Top 3 Conteúdos** (métrica selecionável): ordena por views / reach / interações / %eng geral / %eng seguidor / taxa salvamento / taxa compart. e mostra os 3 maiores.
- **O que funcionou / O que não funcionou:** 3 a 5 aprendizados por lado, **derivados dos números** do período: maior/menor alcance vs. média, post mais compartilhado, maior/menor taxa de salvamento, mais engajante, mais comentado, e o caso "alcançou muito mas engajou pouco". Cada item traz a leitura + sugestão de ação.

### 5.5 Página "Banco de Posts"

Independente dos filtros de data. Lê `window.BANCO_POSTS` (snapshot do Notion), excluindo Cancelado e "Copy a fazer".
- KPIs: Em produção, Copy aprovada, Em ajuste/copy.
- Barras por **Status Copy** (etapa de produção).
- Distribuição por **Etapa do Funil** e por **Formato** (chips).
- Lista de todos os conteúdos em produção (título + funil + formato + status).

---

## 6. Lógica de comparação (variação dos KPIs)

`getComparison` define o "período anterior":
- **Semana selecionada** → compara com a **semana imediatamente anterior** (ex.: S17 vs S16).
- **Mês selecionado** → compara com o **mês anterior** com dados.
- **"Todos"** → sem comparação (KPIs sem seta).

Variação % = (atual − anterior) ÷ anterior × 100, por indicador. Para seguidores, usa-se o último valor da timeline em cada janela e também o **delta absoluto**.

---

## 7. Atualização de dados

**Botão Atualizar** → `dashboard-refresh.js` chama `GET /api/refresh`. A serverless (`api/refresh.js`) consulta Windsor + Notion em paralelo (cada consulta é tolerante a falha individual), normaliza tudo no formato de `raw` e devolve JSON. O cliente chama `buildDashboardData(payload)` e re-renderiza. Debug: `GET /api/refresh?diag=1` lista o status de cada consulta.

**Snapshots embutidos** (`dashboard-*.js`) são a versão "congelada" — o que aparece sem backend. Para atualizar o snapshot fora do botão, regrava-se esses arquivos a partir da Windsor/Notion.

> **Atenção ao replicar:** se você regenerar `dashboard-media.js` a partir da API, campos derivados de outras fontes (ex.: etiqueta de funil vinda do Notion) precisam ficar em **arquivo separado** (banco interno keyed por id/data) para não serem apagados no processo.

---

## 8. Visual — o que trocar para um novo projeto

A "cara" está concentrada em **dois lugares**; mudá-los muda o produto inteiro sem tocar na lógica:

1. **`theme.css`** — `@font-face` das fontes da marca + variáveis CSS de paleta (`--bg`, `--surface`, `--ink`, `--muted`, `--line`, `--accent-*`).
2. **`COLORS`** (topo de `dashboard-ui.js`) — espelho JS da paleta, usado em estilos inline e nos gráficos. Mais `PAGE_ACCENTS` (cor de destaque por página).

Tokens atuais (tema Nathalia Hering — terroso/quente):
- Fundo `#FFF2E8`, superfície `#F8E3D2`, texto `#5F4133`, texto suave `#8A6C5C`, linhas `#EBD4C0`.
- Accents por página: Conta `#B57353` (terracota), Conteúdos `#376447` (verde), Stories `#A3A983` (sálvia), Insights `#c0892f` (mostarda).
- Fontes: títulos **McKenzie Headline**, corpo **Meltmino**.

Padrões de UI reutilizáveis: cards com `borderRadius:16` e sombra suave; KPIs de 110px de altura; gráficos dentro de `ChartCard`; cantos arredondados; densidade média. Mantê-los dá coesão; a paleta/fontes definem a identidade.

---

## 9. Deploy (Vercel)

- Projeto estático + `api/refresh.js` (Node 18/20). `vercel.json` define `cleanUrls` e `maxDuration` da função.
- **Variáveis de ambiente:**
  - `WINDSOR_API_KEY` (obrigatória) — chave da Windsor.
  - `WINDSOR_IG_ACCOUNT_ID` (recomendada) — id da conta IG.
  - `WINDSOR_DAYS` / `WINDSOR_DATE_FROM` (opcionais) — janela de histórico.
  - `NOTION_TOKEN` (opcional) — integração interna do Notion; `NOTION_DB_ID` (opcional, tem default).
- A pasta `media/` (capas) **deve** ir no repositório.

---

## 10. Como replicar para um novo projeto (briefing para o Claude)

Entregue este documento + um briefing com:

1. **Marca/visual:** paleta (3–5 cores + accents por página), 1–2 fontes, tom (minimalista? denso? colorido?). → vira `theme.css` + `COLORS`.
2. **Fonte de dados:** qual API/conector e quais métricas existem (e quais **não** existem — limitações). → vira `api/refresh.js` + formato `raw`.
3. **Páginas desejadas e indicadores de cada uma**, com as fórmulas. Use as deste doc como ponto de partida e ajuste.
4. **Período/granularidade:** diário? semanal ISO? mensal? Qual a comparação de crescimento.
5. **Integrações extras** (ex.: Notion para calendário) e o que cada uma alimenta.

A estrutura a manter (independente do visual): SPA sem build, `buildDashboardData(raw)` como cérebro único, snapshot embutido + botão Atualizar via serverless, filtros globais de período, componentes `Header/KPICard/ChartCard/ChartCanvas`, e separação rígida entre cálculo e visual.

---

## 11. Glossário de fórmulas

- **% Engajamento geral** = Interações ÷ Alcance × 100
- **% Engajamento seguidores** = Interações ÷ Seguidores × 100
- **Taxa de Interação** = Interações ÷ Alcance × 100 (por dia/post)
- **Taxa de Salvamento** = Salvamentos ÷ Alcance × 100
- **Taxa de Compartilhamento** = Compartilhamentos ÷ Alcance × 100
- **Taxa de resposta (story)** = Respostas ÷ Alcance × 100
- **Interações de um post (`eng`)** = `media_engagement` ou (likes + comentários + compart. + salvamentos)
- **Seguidores ganhos no dia** = saldo `follows_and_unfollows`; timeline reconstruída recuando a partir do total atual
- **Variação de KPI** = (período atual − período anterior) ÷ período anterior × 100
- **Reel de teste** = post tipo REELS com Alcance < 500
- **Visualizações** = views (times o conteúdo foi exibido); **Alcance** = contas únicas atingidas
