// ============================================================
// useDashboard — the App's state container + side effects.
// Mirrors the constructor state, componentDidMount fetches and
// the handlers of the original Component class.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import { buildModel, nowStamp } from './model'
import { fetchAccount, fetchMedia, type LiveAccount } from './windsor'
import { fetchAudience, type AudienceData } from './audience'
import { AUDIENCE_DEMO } from './audienceDemo'
import { fetchAds } from './facebook'
import { fetchFunnel as fetchFunnelCsv, funnelSpec } from './sheets'
import { persistCovers } from './cache'
import { currentMonthRange } from './dates'
import { fetchAplicLeads, fetchIscaLeads } from './leads'
import { fetchVendasHBP } from './hbp'
import {
  loadGtThumbs,
  saveGtThumbs,
  loadGtLinks,
  saveGtLinks,
  fetchGoldenAssets,
  needsGtAssets,
  type GtThumbs,
  type GtLinks,
} from './goldenThumbs'
import { FUNNELS } from './constants'
import type { Model, FunnelData, AdDailyRow } from './types'
import type { ResVendaMes } from './resultadosVendasData'

export type PageKey = 'conta' | 'audiencia' | 'conteudos' | 'insights' | 'candidaturas' | 'resultados' | 'plano'

import { pageFromPath, pathFromPage, titleForPage } from './routing'

// aba inicial a partir da URL (ex.: /conta, /funis); cai na padrão se não bater
const initialPage = (): PageKey => pageFromPath(typeof location !== 'undefined' ? location.pathname : '/')

export interface DashState {
  page: PageKey
  month: string
  week: string
  dayFrom: string
  dayTo: string
  metric2: string
  topMetric: string
  postSort: string
  postSortDir: string
  refreshing: boolean
  lastSync: string
  live: boolean
  dataError: string
  mediaLoading: boolean
  dormant: boolean
  funnel: string
  funnelData: Record<string, FunnelData>
  funnelLoading: Record<string, boolean>
  funnelError: Record<string, string>
  candMonth: string
  candFrom: string
  candTo: string
  candStatusFilter: string
  // seções expansíveis
  resOpen: Record<string, boolean>
  ctExpanded: Record<string, boolean>
  aqExpanded: Record<string, boolean>
  segExpanded: Record<string, boolean>
  // Acompanhamento — métricas dos gráficos + drill
  acompMetric: string
  aqMetric: string
  aqSrc: string
  aqWeek: string | null
  // vendas HBP ao vivo (mês atual + anterior)
  rvLive: Record<string, ResVendaMes> | null
  imersao: string
  gtThumbs: GtThumbs
  gtLinks: GtLinks
  adsRaw: AdDailyRow[] | null
  adsMinD: string | null
  adsMaxD: string | null
  adsLoading: boolean
  adsError: string
  postMetrics: boolean
  // leads nativos por dia (planilhas) — funis Aplicação Direta / Isca
  aplicLeadsBy?: Record<string, number>
  aplicLeadsRows?: { date: string; faixa: string; perfilOk?: boolean; status?: string; fonte?: string; ts?: string; utm?: string; adId?: string; adName?: string; adsetId?: string }[]
  iscaLeadsBy?: Record<string, number>
  // Audiência — demografia + split seguidor/não-seguidor (ao vivo, Windsor)
  audData: AudienceData | null
  audLoading: boolean
  audError: string
  // Funil Stories — sequência selecionada (id 'YYYY-MM-DD'; null = a mais recente do período)
  storySeq: string | null
  // Funil Stories — "ver tudo": ignora a sequência selecionada e compara todas
  storyAll: boolean
}

export interface Dashboard {
  model: Model
  state: DashState
  setState: (patch: Partial<DashState> | ((s: DashState) => Partial<DashState>)) => void
  onRefresh: () => void
  setPage: (p: PageKey, opts?: { push?: boolean }) => void
  setFunnel: (key: string) => void
}

export function useDashboard(): Dashboard {
  const [model, setModel] = useState<Model>(() => buildModel())
  const initialModel = model

  const [state, setStateRaw] = useState<DashState>(() => ({
    page: initialPage(),
    month: 'all',
    week: 'all',
    dayFrom: '',
    dayTo: '',
    metric2: 'views',
    topMetric: 'views',
    postSort: 'date',
    postSortDir: 'desc',
    refreshing: false,
    lastSync: initialModel.lastSync,
    live: false,
    dataError: '',
    mediaLoading: false,
    dormant: false,
    funnel: 'aplicacao',
    funnelData: {},
    funnelLoading: {},
    funnelError: {},
    candMonth: 'all',
    // funis abrem no mês atual (o padrão 'aplicacao' não é o Golden Ticket)
    candFrom: currentMonthRange().from,
    candTo: currentMonthRange().to,
    candStatusFilter: 'all',
    resOpen: {},
    ctExpanded: {},
    aqExpanded: {},
    segExpanded: {},
    acompMetric: 'reelsReach',
    aqMetric: 'qual',
    aqSrc: 'all',
    aqWeek: null,
    rvLive: null,
    imersao: 'nea',
    gtThumbs: loadGtThumbs(),
    gtLinks: loadGtLinks(),
    adsRaw: null,
    adsMinD: null,
    adsMaxD: null,
    adsLoading: false,
    adsError: '',
    postMetrics: true,
    audData: null,
    audLoading: false,
    audError: '',
    storySeq: null,
    storyAll: false,
  }))

  const setState = useCallback(
    (patch: Partial<DashState> | ((s: DashState) => Partial<DashState>)) => {
      setStateRaw((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) }))
    },
    []
  )

  // refs for guard flags (avoid stale closures in async handlers)
  const refreshingRef = useRef(false)
  const adsLoadingRef = useRef(false)
  const funnelLoadingRef = useRef<Record<string, boolean>>({})
  const funnelDataRef = useRef<Record<string, FunnelData>>({})
  const liveRef = useRef<LiveAccount | null>(null)
  const aplicLoadingRef = useRef(false)
  const aplicDoneRef = useRef(false)
  const iscaLeadsRef = useRef(false)
  const hbpRef = useRef(false) // in-flight guard (re-fetchable)
  const audRef = useRef(false) // in-flight guard (re-fetchable)
  const funnelRef = useRef(state.funnel)
  funnelRef.current = state.funnel

  const loadAudience = useCallback(
    async (force?: boolean) => {
      if (audRef.current) return
      audRef.current = true
      setState((s) => (force || !s.audData ? { audLoading: true, audError: '' } : {}))
      try {
        const data = await fetchAudience()
        setState({ audData: data, audLoading: false, audError: '' })
      } catch (e) {
        // modo-preview: fora de produção (qualquer host que não seja *.vercel.app),
        // usa o snapshot real embutido quando a rede de preview bloqueia o Windsor,
        // para visualizar a aba. Em produção (vercel.app) nunca cai aqui.
        const host = typeof location !== 'undefined' ? location.hostname : ''
        const isProd = /\.vercel\.app$/i.test(host)
        if (!isProd) {
          setState({ audData: AUDIENCE_DEMO, audLoading: false, audError: '' })
        } else {
          const msg = (e instanceof Error && e.message) || 'Falha ao ler a demografia da audiência.'
          setState({ audLoading: false, audError: msg })
        }
      } finally {
        audRef.current = false
      }
    },
    [setState]
  )

  const loadVendasHBP = useCallback(async () => {
    if (hbpRef.current) return
    hbpRef.current = true
    try {
      const rv = await fetchVendasHBP()
      setState({ rvLive: rv })
    } catch {
      /* silencioso — cai no snapshot congelado */
    } finally {
      hbpRef.current = false
    }
  }, [setState])

  const loadAplicLeads = useCallback(
    async (force?: boolean) => {
      if (aplicLoadingRef.current || (aplicDoneRef.current && !force)) return
      aplicLoadingRef.current = true
      try {
        const { by, rows } = await fetchAplicLeads()
        setState({ aplicLeadsBy: by, aplicLeadsRows: rows })
        aplicDoneRef.current = true
      } catch {
        /* silencioso — a seção some sem os dados */
      } finally {
        aplicLoadingRef.current = false
      }
    },
    [setState]
  )

  const loadIscaLeads = useCallback(async () => {
    if (iscaLeadsRef.current) return
    iscaLeadsRef.current = true
    try {
      const { by } = await fetchIscaLeads()
      setState({ iscaLeadsBy: by })
    } catch {
      /* silencioso */
    }
  }, [setState])

  const fetchLive = useCallback(async () => {
    if (refreshingRef.current) return
    refreshingRef.current = true
    setState({ refreshing: true, dataError: '', mediaLoading: false })
    try {
      // ── Phase 1: account + daily (fast) ──
      const live = await fetchAccount()
      liveRef.current = live
      const m1 = buildModel({ profile: live.profile, daily: live.daily, follows: live.follows, media: [] })
      setModel(m1)
      // intervalo padrão da Conta: 1º dia do mês anterior até maxDate
      const mx = m1.maxDate
      const [py, pm] = mx.split('-').map(Number)
      const pad = (n: number): string => String(n).padStart(2, '0')
      const dy = pm === 1 ? py - 1 : py
      const dm = pm === 1 ? 12 : pm - 1
      let df = dy + '-' + pad(dm) + '-01'
      if (df < m1.minDate) df = m1.minDate
      setState({
        live: true,
        dataError: '',
        lastSync: nowStamp(),
        month: 'all',
        week: 'all',
        dayFrom: df,
        dayTo: mx,
        mediaLoading: true,
        dormant: false,
        postMetrics: true,
      })

      // ── Phase 2: per-post insights (last 30 days live, rest cached) ──
      try {
        const { media, ckey, savedAt } = await fetchMedia()
        const m2 = buildModel({
          profile: live.profile,
          daily: live.daily,
          follows: live.follows,
          media,
        })
        setModel(m2)
        const dormant = (live.actSum || 0) < 50 && media.length === 0
        setState({ refreshing: false, mediaLoading: false, dormant })
        refreshingRef.current = false
        // baixa e embute as capas (desde jan/2026) em background
        void persistCovers(media, ckey, savedAt, () => {
          if (liveRef.current) {
            setModel(
              buildModel({
                profile: liveRef.current.profile,
                daily: liveRef.current.daily,
                follows: liveRef.current.follows,
                media,
              })
            )
          }
        })
      } catch (e2) {
        const msg = (e2 instanceof Error && e2.message) || 'falha ao carregar'
        setState({ refreshing: false, mediaLoading: false, dataError: 'Publicações: ' + msg })
        refreshingRef.current = false
      }
    } catch (e) {
      const msg = (e instanceof Error && e.message) || 'Falha ao buscar dados ao vivo.'
      setState({ refreshing: false, mediaLoading: false, dataError: msg })
      refreshingRef.current = false
    }
  }, [setState])

  const loadAds = useCallback(async () => {
    if (adsLoadingRef.current) return
    adsLoadingRef.current = true
    setState({ adsLoading: true, adsError: '' })
    try {
      const { raw, minD, maxD } = await fetchAds()
      // se já estiver num funil só de anúncios e sem filtro, aplica o intervalo padrão
      setState((s) => {
        const patch: Partial<DashState> = { adsLoading: false, adsRaw: raw, adsMinD: minD, adsMaxD: maxD }
        const sp = funnelSpec(s.funnel)
        // funis só de anúncios (exceto o Golden Ticket, snapshot congelado) abrem no mês atual
        if (sp?.adsOnly && !sp.golden && !s.candFrom && !s.candTo && s.candMonth === 'all') {
          const r = currentMonthRange()
          patch.candFrom = r.from
          patch.candTo = r.to
        }
        return patch
      })
    } catch (e) {
      const msg = (e instanceof Error && e.message) || 'Falha ao ler Facebook Ads.'
      setState({ adsLoading: false, adsError: msg })
    }
    adsLoadingRef.current = false
  }, [setState])

  const fetchFunnel = useCallback(
    async (key: string, force?: boolean) => {
      const spec = funnelSpec(key)
      if (!spec || spec.adsOnly) return
      if (funnelLoadingRef.current[key]) return
      if (funnelDataRef.current[key] && !force) return
      funnelLoadingRef.current[key] = true
      setState((s) => ({
        funnelLoading: { ...s.funnelLoading, [key]: true },
        funnelError: { ...s.funnelError, [key]: '' },
      }))
      try {
        const data = await fetchFunnelCsv(key)
        funnelDataRef.current[key] = data
        setState((s) => {
          const patch: Partial<DashState> = {
            funnelLoading: { ...s.funnelLoading, [key]: false },
            funnelData: { ...s.funnelData, [key]: data },
          }
          // intervalo padrão na 1ª carga (mês atual), se o usuário ainda não filtrou
          if (s.funnel === key && !s.candFrom && !s.candTo && s.candMonth === 'all') {
            const r = currentMonthRange()
            patch.candFrom = r.from
            patch.candTo = r.to
          }
          return patch
        })
      } catch (e) {
        const msg = (e instanceof Error && e.message) || 'Falha ao ler a aba.'
        setState((s) => ({
          funnelLoading: { ...s.funnelLoading, [key]: false },
          funnelError: { ...s.funnelError, [key]: msg },
        }))
      }
      funnelLoadingRef.current[key] = false
    },
    [setState]
  )

  // componentDidMount — kick off all live fetches once
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    void fetchLive()
    void loadAds()
    // funil padrão é 'aplicacao' (só anúncios + planilha de leads nativa)
    void loadAplicLeads()
    void loadVendasHBP()
    void loadAudience()
  }, [fetchLive, loadAds, loadAplicLeads, loadVendasHBP, loadAudience])

  // relê a planilha de vendas HBP a cada 60s e quando a aba volta a ficar ativa
  useEffect(() => {
    const tick = (): void => {
      if (!document.hidden) void loadVendasHBP()
    }
    const timer = setInterval(tick, 60000)
    window.addEventListener('focus', tick)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', tick)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [loadVendasHBP])

  // Golden Ticket — busca/embute capas + links dos anúncios da imersão ativa (cache localStorage)
  const gtBusyRef = useRef<string | null>(null)
  useEffect(() => {
    const spec = funnelSpec(state.funnel)
    if (state.page !== 'candidaturas' || !spec?.golden) return
    const im = spec.imersaoFixed || state.imersao
    const haveThumbs = state.gtThumbs[im] || {}
    const haveLinks = state.gtLinks[im] || {}
    if (!needsGtAssets(im, haveThumbs, haveLinks) || gtBusyRef.current === im) return
    gtBusyRef.current = im
    void fetchGoldenAssets(im, haveThumbs, haveLinks).then((res) => {
      gtBusyRef.current = null
      if (!res) return
      setState((s) => {
        const nextThumbs = { ...s.gtThumbs, [im]: res.thumbs }
        const nextLinks = { ...s.gtLinks, [im]: res.links }
        saveGtThumbs(nextThumbs)
        saveGtLinks(nextLinks)
        return { gtThumbs: nextThumbs, gtLinks: nextLinks }
      })
    })
  }, [state.page, state.funnel, state.imersao, state.gtThumbs, state.gtLinks, setState])

  const onRefresh = useCallback(() => {
    void fetchLive()
    void loadVendasHBP()
    void loadAplicLeads(true)
    void loadAudience(true)
  }, [fetchLive, loadVendasHBP, loadAplicLeads, loadAudience])

  const setFunnel = useCallback(
    (key: string) => {
      setState({ funnel: key, candMonth: 'all', candFrom: '', candTo: '', candStatusFilter: 'all' })
      const spec = funnelSpec(key)
      if (key === 'aplicacao') void loadAplicLeads()
      if (key === 'isca') void loadIscaLeads()
      // Golden Ticket é um snapshot congelado (vai até ago/2026): abre no período todo
      if (spec?.golden) return
      // todos os outros funis abrem no mês atual (dia 1 até hoje)
      const r = currentMonthRange()
      setState({ candFrom: r.from, candTo: r.to })
      // funis de planilha: busca os dados na 1ª vez
      if (!spec?.adsOnly && !funnelDataRef.current[key] && !funnelLoadingRef.current[key]) void fetchFunnel(key)
    },
    [setState, fetchFunnel, loadAplicLeads, loadIscaLeads]
  )

  const setPage = useCallback(
    (p: PageKey, opts?: { push?: boolean }) => {
      setState({ page: p })
      // reflete a aba na URL (exceto quando a mudança veio do próprio histórico)
      if (opts?.push !== false && typeof history !== 'undefined') {
        const path = pathFromPage(p)
        if (location.pathname !== path) history.pushState({ page: p }, '', path)
      }
      if (p === 'resultados') void loadVendasHBP()
      // ao entrar em Dados dos Funis, garante um funil visível selecionado (o primeiro)
      if (p === 'candidaturas') {
        const first = FUNNELS.find((f) => !f.hidden)?.key
        if (first && funnelRef.current !== first) setFunnel(first)
      }
    },
    [setState, setFunnel, loadVendasHBP]
  )

  // URL canônica no 1º load (ex.: "/" -> "/conta") e <title> da aba inicial
  useEffect(() => {
    const p = initialPage()
    const canonical = pathFromPage(p)
    if (typeof history !== 'undefined' && location.pathname !== canonical) {
      history.replaceState({ page: p }, '', canonical)
    }
  }, [])

  // botão voltar/avançar do navegador — sincroniza a aba sem empilhar histórico
  useEffect(() => {
    const onPop = (): void => setPage(pageFromPath(location.pathname), { push: false })
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [setPage])

  // mantém o título da aba do navegador em sincronia com a página atual
  useEffect(() => {
    if (typeof document !== 'undefined') document.title = titleForPage(state.page)
  }, [state.page])

  return { model, state, setState, onRefresh, setPage, setFunnel }
}
