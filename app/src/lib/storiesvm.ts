// ============================================================
// View-model do Funil Stories. Lê as sequências embutidas
// (storiesData) e cruza com as aplicações do Respondi para
// contar as aplicações vindas de cada sequência.
// ============================================================

import type { ChartConfiguration } from 'chart.js'
import { fmtNum } from './format'
import { MONTH_NAMES } from './dates'
import { STORY_SEQS, STORY_RESULTS, type StorySeq, type StoryItem } from './storiesData'
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
}
export interface StoriesStage {
  label: string
  value: string
  left: string
  width: number
  pending?: boolean
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
  clk: string
  ctr: string
  apps: string
  conversas: string | null
  agendamentos: string | null
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
  seqBtns: { id: string; label: string; active: boolean }[]
  selEyebrow: string
  stages: StoriesStage[]
  storiesNote: string
  storyRows: StoriesStoryRow[]
  compare: StoriesCompareRow[]
  retCfg: ChartConfiguration | null
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
  return {
    seq,
    hasLink,
    anchor,
    first,
    ret: first.views ? (anchor.views / first.views) * 100 : 0,
    gapMin,
    apps,
    viewsT: st.reduce((a, x) => a + x.views, 0),
    respT: st.reduce((a, x) => a + x.resp, 0),
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
    return { empty: true, kpis: [], seqBtns: [], selEyebrow: '', stages: [], storiesNote: '', storyRows: [], compare: [], retCfg: null }
  }

  const res = (id: string) => STORY_RESULTS[id] || { conversas: null, agendamentos: null }
  const sumRes = (k: 'conversas' | 'agendamentos'): number | null => {
    const vals = calcs.map((c) => res(c.seq.id)[k]).filter((v): v is number => v != null)
    return vals.length ? vals.reduce((a, v) => a + v, 0) : null
  }

  // ---- KPIs (sempre numa linha) ----
  const multi = calcs.filter((c) => c.seq.stories.length > 1)
  const withLink = calcs.filter((c) => c.hasLink)
  const clkT = withLink.reduce((a, c) => a + c.anchor.clk, 0)
  const reachLinkT = withLink.reduce((a, c) => a + c.anchor.reach, 0)
  const appsKnown = calcs.every((c) => c.apps != null)
  const appsT = calcs.reduce((a, c) => a + (c.apps || 0), 0)
  const convT = sumRes('conversas')
  const agT = sumRes('agendamentos')
  const kpis: StoriesKpi[] = [
    { label: 'Sequências', value: String(calcs.length), sub: calcs.length > 1 ? `de ${dm(calcs[0].seq.id)} a ${dm(calcs[calcs.length - 1].seq.id)}` : dm(calcs[0].seq.id) },
    { label: 'Stories', value: fmtNum(calcs.reduce((a, c) => a + c.seq.stories.length, 0)), sub: 'nas sequências' },
    { label: 'Visualizações', value: fmtNum(calcs.reduce((a, c) => a + c.viewsT, 0)), sub: 'soma dos stories' },
    { label: 'Retenção média', value: multi.length ? pct(multi.reduce((a, c) => a + c.ret, 0) / multi.length) : '—', sub: 'do 1º ao último story' },
    { label: 'Cliques no link', value: fmtNum(clkT), sub: reachLinkT ? pct((clkT / reachLinkT) * 100) + ' do alcance' : 'sem link no período' },
    { label: 'Aplicações', value: appsKnown ? fmtNum(appsT) : '…', sub: `respondi · até ${APP_WINDOW_H}h` },
    { label: 'Conversas', value: convT == null ? '—' : fmtNum(convT), sub: '', pending: convT == null },
    { label: 'Agendamentos', value: agT == null ? '—' : fmtNum(agT), sub: '', pending: agT == null },
  ]

  // ---- sequência selecionada (padrão: a mais recente do período) ----
  const sel = calcs.find((c) => c.seq.id === S.storySeq) || calcs[calcs.length - 1]
  const seqBtns = calcs.map((c) => ({ id: c.seq.id, label: `${dm(c.seq.id)} · ${c.seq.name}`, active: c === sel }))
  const r = res(sel.seq.id)
  const appsStr = sel.apps == null ? '…' : fmtNum(sel.apps)
  const W = [82, 76, 70, 63, 56, 50, 45]
  const tail: Omit<StoriesStage, 'width'>[] = [
    { label: 'Aplicações', value: appsStr, left: 'respondi sem utm' },
    { label: 'Conversas', value: r.conversas == null ? '—' : fmtNum(r.conversas), left: '', pending: r.conversas == null },
    { label: 'Agendamentos', value: r.agendamentos == null ? '—' : fmtNum(r.agendamentos), left: '', pending: r.agendamentos == null },
  ]
  const head: Omit<StoriesStage, 'width'>[] = sel.hasLink
    ? [
        { label: 'Views do 1º story', value: fmtNum(sel.first.views), left: '' },
        { label: 'Chegaram no link', value: fmtNum(sel.anchor.views), left: pct(sel.ret) + ' retenção' },
        { label: 'Alcance do link', value: fmtNum(sel.anchor.reach), left: '' },
        { label: 'Cliques no link', value: fmtNum(sel.anchor.clk), left: sel.anchor.reach ? pct((sel.anchor.clk / sel.anchor.reach) * 100) + ' do alcance' : '' },
      ]
    : [
        { label: 'Visualizações', value: fmtNum(sel.viewsT), left: sel.seq.stories.length === 1 ? 'story único' : '' },
        { label: 'Alcance', value: fmtNum(sel.anchor.reach), left: '' },
        { label: 'Respostas', value: fmtNum(sel.respT), left: sel.anchor.reach ? pct((sel.respT / sel.anchor.reach) * 100) + ' do alcance' : '' },
        { label: 'Visitas ao perfil', value: fmtNum(sel.visT), left: sel.anchor.reach ? pct((sel.visT / sel.anchor.reach) * 100) + ' do alcance' : '' },
      ]
  const stages: StoriesStage[] = [...head, ...tail].map((s, i) => ({ ...s, width: W[i] }))

  const nSel = sel.seq.stories.length
  const storiesNote = sel.hasLink
    ? `${dm(sel.seq.id)} · ${nSel} stories · story ${sel.seq.stories.indexOf(sel.anchor) + 1} é o do link`
    : `${dm(sel.seq.id)} · ${nSel === 1 ? 'story único' : nSel + ' stories'} · sem figurinha de link`
  const storyRows: StoriesStoryRow[] = sel.seq.stories.map((x, i) => {
    const isLink = sel.hasLink && x === sel.anchor
    return {
      pos: String(i + 1) + (isLink ? ' · link' : ''),
      isLink,
      pub: dm(x.iso) + ' ' + hm(x.iso),
      tipo: x.dur ? 'vídeo ' + x.dur + 's' : 'foto',
      views: fmtNum(x.views),
      ret: sel.first.views ? pct((x.views / sel.first.views) * 100) : '—',
      reach: fmtNum(x.reach),
      resp: fmtNum(x.resp),
      vis: fmtNum(x.vis),
      clk: x.clk ? fmtNum(x.clk) : '—',
      shr: fmtNum(x.shr),
      link: x.link,
    }
  })

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
        clk: c.hasLink ? fmtNum(c.anchor.clk) : 'sem link',
        ctr: c.hasLink && c.anchor.reach ? pct((c.anchor.clk / c.anchor.reach) * 100) : '—',
        apps: c.apps == null ? '…' : fmtNum(c.apps),
        conversas: rr.conversas == null ? null : fmtNum(rr.conversas),
        agendamentos: rr.agendamentos == null ? null : fmtNum(rr.agendamentos),
      }
    })

  // ---- retenção: views de cada story ÷ views do 1º (só sequências com mais de 1 story) ----
  let retCfg: ChartConfiguration | null = null
  if (multi.length) {
    const maxLen = Math.max(...multi.map((c) => c.seq.stories.length))
    const ordered = multi.slice().reverse() // mais recente primeiro (cor vinho)
    retCfg = {
      type: 'line',
      data: {
        labels: Array.from({ length: maxLen }, (_, i) => String(i + 1)),
        datasets: ordered.map((c, k) => {
          const curve = c.seq.stories.map((x) => Math.round((x.views / c.first.views) * 1000) / 10)
          const li = c.hasLink ? c.seq.stories.indexOf(c.anchor) : -1
          const col = SEQ_COLORS[k % SEQ_COLORS.length]
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
    seqBtns,
    selEyebrow: `${sel.seq.name} · ${dm(sel.seq.id)} às ${hm(sel.first.iso)}`,
    stages,
    storiesNote,
    storyRows,
    compare,
    retCfg,
  }
}
