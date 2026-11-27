// ============================================================
// View-model do Funil Stories. Lê as sequências embutidas
// (storiesData) e cruza com as aplicações do Respondi para
// contar as aplicações vindas de cada sequência.
// ============================================================

import type { ChartConfiguration } from 'chart.js'
import { fmtNum } from './format'
import { MONTH_NAMES } from './dates'
import { STORY_SEQS, STORY_RESULTS, type StorySeq, type StoryItem, type StoryResult } from './storiesData'
import type { DashState } from './useDashboard'
import type { MonthDef } from './types'

// janela após o story do link em que uma aplicação conta para a sequência
const APP_WINDOW_H = 48
const SEQ_COLORS = ['#771520', '#C2A05B', '#BCA489', '#9C846C', '#5A0F18', '#E4D5CA']

export interface StoriesKpi {
  label: string
  value: string
  sub: string
  pending?: boolean
  tip?: string // texto do tooltip (ex.: nomes de quem agendou)
}
export interface StoriesStage {
  label: string
  value: string
  left: string
  width: number
  pending?: boolean
  tip?: string
}
export interface StoriesCompareRow {
  id: string
  d: string
  name: string
  hora: string
  n: number
  first: string
  lv: string
  ret: string
  gap: string
  reach: string
  int: string // interesses: cliques no link (com link) ou respostas (sem link)
  intKind: string
  intRate: string
  apps: string
  agendamentos: string | null
  agendTip: string
}
export interface StoriesStoryRow {
  pos: string
  isLink: boolean
  pub: string
  tipo: string
  views: string
  ret: string
  reach: string
  resp: string
  vis: string
  clk: string
  shr: string
  link: string
}
export interface StoriesVM {
  empty: boolean
  kpis: StoriesKpi[]
  allMode: boolean // "ver tudo": ignora o dia selecionado e mostra todas as sequências
  seqBtns: { id: string; label: string; active: boolean }[]
  selEyebrow: string
  stages: StoriesStage[]
  storiesTitle: string
  storiesNote: string
  storyRows: StoriesStoryRow[]
  compare: StoriesCompareRow[]
  retCfg: ChartConfiguration | null
  retNote: string // mensagem quando não há curva (ex.: story único)
}

const dm = (id: string): string => id.slice(8, 10) + '/' + id.slice(5, 7)
const hm = (iso: string): string => iso.slice(11, 16)
const pct = (v: number): string => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%'
const minutes = (iso: string): number => Date.parse(iso.replace(' ', 'T') + ':00Z') / 60000

interface SeqCalc {
  seq: StorySeq
  hasLink: boolean
  anchor: StoryItem // story do link (ou o último, quando não há link)
  first: StoryItem
  ret: number // % de views do story âncora sobre o 1º
  gapMin: number | null // minutos entre o penúltimo story e o do link
  apps: number | null // null = aplicações ainda não carregadas
  viewsT: number
  respT: number
  visT: number
  // interesses: cliques no link quando há figurinha de link; respostas quando não há
  intN: number
  intKind: string
}

function calcSeq(seq: StorySeq, S: DashState): SeqCalc {
  const st = seq.stories
  const linked = st.filter((x) => x.clk > 0)
  const hasLink = linked.length > 0
  const anchor = hasLink ? linked[linked.length - 1] : st[st.length - 1]
  const first = st[0]
  const ai = st.indexOf(anchor)
  const gapMin = ai > 0 ? Math.round(minutes(anchor.iso) - minutes(st[ai - 1].iso)) : null
  // aplicações: respostas do Respondi sem UTM (ou com utm_medium "stories") até 48h após o story âncora
  let apps: number | null = null
  if (S.aplicLeadsRows) {
    const from = anchor.iso + ':00'
    const endMs = (minutes(anchor.iso) + APP_WINDOW_H * 60) * 60000
    const end = new Date(endMs).toISOString().slice(0, 19).replace('T', ' ')
    apps = S.aplicLeadsRows.filter((r) => {
      if (r.fonte !== 'respondi' || !r.ts) return false
      const u = r.utm || '|'
      const fromStories = u === '|' || /stories/.test(u)
      return fromStories && r.ts >= from && r.ts < end
    }).length
  }
  const respT = st.reduce((a, x) => a + x.resp, 0)
  return {
    seq,
    hasLink,
    intN: hasLink ? anchor.clk : respT,
    intKind: hasLink ? (anchor.clk === 1 ? 'clique no link' : 'cliques no link') : respT === 1 ? 'resposta' : 'respostas',
    anchor,
    first,
    ret: first.views ? (anchor.views / first.views) * 100 : 0,
    gapMin,
    apps,
    viewsT: st.reduce((a, x) => a + x.views, 0),
    respT,
    visT: st.reduce((a, x) => a + x.vis, 0),
  }
}

// janela de data efetiva (mês selecionado OU intervalo)
function inWindow(id: string, S: DashState): boolean {
  if (S.candMonth !== 'all') return id.slice(0, 7) === S.candMonth
  return (!S.candFrom || id >= S.candFrom) && (!S.candTo || id <= S.candTo)
}

export function storiesMonths(): MonthDef[] {
  const yms = [...new Set(STORY_SEQS.map((s) => s.id.slice(0, 7)))].sort()
  return yms.map((ym) => ({ value: ym, label: MONTH_NAMES[+ym.slice(5, 7) - 1] + ' ' + ym.slice(0, 4) }))
}
export function storiesRange(): { min: string; max: string } {
  const ids = STORY_SEQS.map((s) => s.id).sort()
  return { min: ids[0] || '', max: ids[ids.length - 1] || '' }
}

export function storiesVM(S: DashState): StoriesVM {
  const list = STORY_SEQS.filter((s) => inWindow(s.id, S))
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
  const calcs = list.map((s) => calcSeq(s, S))
  if (!calcs.length) {
    return { empty: true, kpis: [], allMode: false, seqBtns: [], selEyebrow: '', stages: [], storiesTitle: '', storiesNote: '', storyRows: [], compare: [], retCfg: null, retNote: '' }
  }

  const res = (id: string): StoryResult => STORY_RESULTS[id] || { agendamentos: null }
  const nAg = (r: StoryResult): number | null => (r.agendamentos == null ? null : r.agendamentos.length)
  const sumRes = (get: (r: StoryResult) => number | null): number | null => {
    const vals = calcs.map((c) => get(res(c.seq.id))).filter((v): v is number => v != null)
    return vals.length ? vals.reduce((a, v) => a + v, 0) : null
  }
  // nomes de quem agendou, por sequência (mais recente primeiro) — tooltip do KPI
  const agTipAll = calcs
    .slice()
    .reverse()
    .flatMap((c) => (res(c.seq.id).agendamentos || []).map((nm) => `${dm(c.seq.id)} · ${nm}`))
    .join('\n')

  // ---- KPIs (sempre numa linha) ----
  const multi = calcs.filter((c) => c.seq.stories.length > 1)
  const intT = calcs.reduce((a, c) => a + c.intN, 0)
  const intReachT = calcs.reduce((a, c) => a + c.anchor.reach, 0)
  const appsKnown = calcs.every((c) => c.apps != null)
  const appsT = calcs.reduce((a, c) => a + (c.apps || 0), 0)
  const agT = sumRes(nAg)
  const kpis: StoriesKpi[] = [
    { label: 'Sequências', value: String(calcs.length), sub: calcs.length > 1 ? `de ${dm(calcs[0].seq.id)} a ${dm(calcs[calcs.length - 1].seq.id)}` : dm(calcs[0].seq.id) },
    { label: 'Stories', value: fmtNum(calcs.reduce((a, c) => a + c.seq.stories.length, 0)), sub: 'nas sequências' },
    { label: 'Visualizações', value: fmtNum(calcs.reduce((a, c) => a + c.viewsT, 0)), sub: 'soma dos stories' },
    { label: 'Retenção média', value: multi.length ? pct(multi.reduce((a, c) => a + c.ret, 0) / multi.length) : '—', sub: 'do 1º ao último story' },
    { label: 'Interesses', value: fmtNum(intT), sub: intReachT ? pct((intT / intReachT) * 100) + ' do alcance' : '' },
    { label: 'Aplicações', value: appsKnown ? fmtNum(appsT) : '…', sub: `respondi · até ${APP_WINDOW_H}h` },
    { label: 'Agendamentos', value: agT == null ? '—' : fmtNum(agT), sub: agT ? 'passe o mouse para ver' : '', pending: agT == null, tip: agTipAll || undefined },
  ]

  // ---- sequência selecionada (padrão: a mais recente do período) ou "ver tudo" ----
  const allMode = !!S.storyAll
  const sel = calcs.find((c) => c.seq.id === S.storySeq) || calcs[calcs.length - 1]
  const seqBtns = calcs.map((c) => ({ id: c.seq.id, label: `${dm(c.seq.id)} · ${c.seq.name}`, active: !allMode && c === sel }))
  const W = [82, 75, 68, 61, 54, 47]
  const intLeft = (n: number, reach: number, kind: string): string => kind + (reach ? ' · ' + pct((n / reach) * 100) + ' do alcance' : '')

  let stagesRaw: Omit<StoriesStage, 'width'>[]
  let selEyebrow: string
  if (allMode) {
    // soma de todas as sequências do período
    const firstT = calcs.reduce((a, c) => a + c.first.views, 0)
    const lastT = calcs.reduce((a, c) => a + c.anchor.views, 0)
    stagesRaw = [
      { label: 'Views do 1º story', value: fmtNum(firstT), left: `${calcs.length} sequências` },
      { label: 'Views no story final', value: fmtNum(lastT), left: firstT ? pct((lastT / firstT) * 100) + ' retenção' : '' },
      { label: 'Alcance', value: fmtNum(intReachT), left: '' },
      { label: 'Interesses', value: fmtNum(intT), left: intLeft(intT, intReachT, 'cliques + respostas') },
      { label: 'Aplicações', value: appsKnown ? fmtNum(appsT) : '…', left: 'respondi sem utm' },
      { label: 'Agendamentos', value: agT == null ? '—' : fmtNum(agT), left: agT ? 'passe o mouse para ver' : '', pending: agT == null, tip: agTipAll || undefined },
    ]
    selEyebrow = `Todas as sequências · ${calcs.length > 1 ? `de ${dm(calcs[0].seq.id)} a ${dm(calcs[calcs.length - 1].seq.id)}` : dm(calcs[0].seq.id)}`
  } else {
    const r = res(sel.seq.id)
    const tail: Omit<StoriesStage, 'width'>[] = [
      { label: 'Aplicações', value: sel.apps == null ? '…' : fmtNum(sel.apps), left: 'respondi sem utm' },
      {
        label: 'Agendamentos',
        value: r.agendamentos == null ? '—' : fmtNum(r.agendamentos.length),
        left: r.agendamentos && r.agendamentos.length ? 'passe o mouse para ver' : '',
        pending: r.agendamentos == null,
        tip: r.agendamentos && r.agendamentos.length ? r.agendamentos.join('\n') : undefined,
      },
    ]
    const head: Omit<StoriesStage, 'width'>[] = sel.hasLink
      ? [
          { label: 'Views do 1º story', value: fmtNum(sel.first.views), left: '' },
          { label: 'Chegaram no link', value: fmtNum(sel.anchor.views), left: pct(sel.ret) + ' retenção' },
          { label: 'Alcance do link', value: fmtNum(sel.anchor.reach), left: '' },
          { label: 'Interesses', value: fmtNum(sel.intN), left: intLeft(sel.intN, sel.anchor.reach, sel.intKind) },
        ]
      : [
          { label: 'Visualizações', value: fmtNum(sel.viewsT), left: sel.seq.stories.length === 1 ? 'story único' : '' },
          { label: 'Alcance', value: fmtNum(sel.anchor.reach), left: '' },
          { label: 'Interesses', value: fmtNum(sel.intN), left: intLeft(sel.intN, sel.anchor.reach, sel.intKind) },
          { label: 'Visitas ao perfil', value: fmtNum(sel.visT), left: sel.anchor.reach ? pct((sel.visT / sel.anchor.reach) * 100) + ' do alcance' : '' },
        ]
    stagesRaw = [...head, ...tail]
    selEyebrow = `${sel.seq.name} · ${dm(sel.seq.id)} às ${hm(sel.first.iso)}`
  }
  const stages: StoriesStage[] = stagesRaw.map((st, i) => ({ ...st, width: W[i] }))

  // ---- stories: da sequência selecionada, ou de todas (mais recente primeiro) ----
  const rowsOf = (c: SeqCalc): StoriesStoryRow[] =>
    c.seq.stories.map((x, i) => {
      const isLink = c.hasLink && x === c.anchor
      return {
        pos: String(i + 1) + (isLink ? ' · link' : ''),
        isLink,
        pub: dm(x.iso) + ' ' + hm(x.iso),
        tipo: x.dur ? 'vídeo ' + x.dur + 's' : 'foto',
        views: fmtNum(x.views),
        ret: c.first.views ? pct((x.views / c.first.views) * 100) : '—',
        reach: fmtNum(x.reach),
        resp: fmtNum(x.resp),
        vis: fmtNum(x.vis),
        clk: x.clk ? fmtNum(x.clk) : '—',
        shr: fmtNum(x.shr),
        link: x.link,
      }
    })
  const nSel = sel.seq.stories.length
  const storiesTitle = allMode ? 'Stories das sequências' : 'Stories da sequência'
  const storiesNote = allMode
    ? `${calcs.length} sequências · ${calcs.reduce((a, c) => a + c.seq.stories.length, 0)} stories · mais recentes primeiro`
    : sel.hasLink
      ? `${dm(sel.seq.id)} · ${nSel} stories · story ${sel.seq.stories.indexOf(sel.anchor) + 1} é o do link`
      : `${dm(sel.seq.id)} · ${nSel === 1 ? 'story único' : nSel + ' stories'} · sem figurinha de link`
  const storyRows: StoriesStoryRow[] = allMode ? calcs.slice().reverse().flatMap(rowsOf) : rowsOf(sel)

  // ---- comparativo (mais recente primeiro) ----
  const compare: StoriesCompareRow[] = calcs
    .slice()
    .reverse()
    .map((c) => {
      const n = c.seq.stories.length
      const rr = res(c.seq.id)
      return {
        id: c.seq.id,
        d: dm(c.seq.id),
        name: c.seq.name,
        hora: hm(c.anchor.iso),
        n,
        first: fmtNum(c.first.views),
        lv: c.hasLink ? fmtNum(c.anchor.views) : '—',
        ret: n > 1 ? pct(c.ret) : '—',
        gap: n === 1 ? 'story único' : c.gapMin != null && c.gapMin > 2 ? c.gapMin + ' min depois' : 'junto',
        reach: fmtNum(c.anchor.reach),
        int: fmtNum(c.intN),
        intKind: c.intKind.replace(' no link', ''),
        intRate: c.anchor.reach ? pct((c.intN / c.anchor.reach) * 100) : '—',
        apps: c.apps == null ? '…' : fmtNum(c.apps),
        agendamentos: rr.agendamentos == null ? null : fmtNum(rr.agendamentos.length),
        agendTip: (rr.agendamentos || []).join('\n'),
      }
    })

  // ---- retenção: views de cada story ÷ views do 1º ----
  // segue o dia selecionado; no "ver tudo" mostra todas as sequências com mais de 1 story.
  // Cada sequência mantém a mesma cor nos dois modos (a mais recente é vinho).
  const colorOf = (c: SeqCalc): string => SEQ_COLORS[(multi.length - 1 - multi.indexOf(c)) % SEQ_COLORS.length]
  const shown = (allMode ? multi : multi.filter((c) => c === sel)).slice().reverse()
  let retCfg: ChartConfiguration | null = null
  const retNote = shown.length
    ? ''
    : allMode
      ? 'Sem sequência com mais de um story no período.'
      : `${dm(sel.seq.id)} · ${sel.seq.name} é um story único, então não há curva de retenção. Use "ver tudo" para comparar as sequências.`
  if (shown.length) {
    const maxLen = Math.max(...shown.map((c) => c.seq.stories.length))
    const ordered = shown
    retCfg = {
      type: 'line',
      data: {
        labels: Array.from({ length: maxLen }, (_, i) => String(i + 1)),
        datasets: ordered.map((c) => {
          const curve = c.seq.stories.map((x) => Math.round((x.views / c.first.views) * 1000) / 10)
          const li = c.hasLink ? c.seq.stories.indexOf(c.anchor) : -1
          const col = colorOf(c)
          return {
            label: `${dm(c.seq.id)} · ${c.seq.stories.length} stories`,
            data: curve,
            borderColor: col,
            backgroundColor: col,
            borderWidth: 2.2,
            pointRadius: curve.map((_, i) => (i === li ? 6 : 2.5)),
            pointStyle: curve.map((_, i) => (i === li ? 'rectRot' : 'circle')),
            tension: 0.25,
          }
        }),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', align: 'end', labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, font: { family: 'Arimo', size: 11 }, color: '#6E595D' } },
          tooltip: {
            backgroundColor: '#271217',
            titleFont: { family: 'Arimo', weight: 'bold' },
            bodyFont: { family: 'Arimo' },
            callbacks: { title: (it: { label: string }[]) => 'story ' + (it[0]?.label || ''), label: (it: { dataset: { label?: string }; raw: unknown }) => `${it.dataset.label}: ${pct(Number(it.raw))}` },
          },
        },
        scales: {
          x: {
            title: { display: true, text: 'posição na sequência · ◆ story do link', font: { family: 'Arimo', size: 10 }, color: '#6E595D' },
            grid: { display: false },
            ticks: { font: { family: 'Arimo', size: 10 }, color: '#6E595D' },
          },
          y: { min: 50, max: 105, grid: { color: 'rgba(119,21,32,0.07)' }, ticks: { font: { family: 'Arimo', size: 10 }, color: '#6E595D', callback: (v: string | number) => v + '%' } },
        },
      },
    } as unknown as ChartConfiguration
  }

  return {
    empty: false,
    kpis,
    allMode,
    seqBtns,
    selEyebrow,
    stages,
    storiesTitle,
    storiesNote,
    storyRows,
    compare,
    retCfg,
    retNote,
  }
}
