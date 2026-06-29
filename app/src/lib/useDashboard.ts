// ============================================================
// useDashboard — the App's state container + side effects.
// Mirrors the constructor state, componentDidMount fetches and
// the handlers of the original Component class.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import { buildModel, nowStamp } from './model'
import { fetchAccount, fetchMedia, type LiveAccount } from './windsor'
import { fetchAds } from './facebook'
import { fetchFunnel as fetchFunnelCsv, funnelSpec } from './sheets'
import { persistCovers } from './cache'
import { defaultFunnelRange } from './dates'
import { FUNNELS } from './constants'
import type { Model, FunnelData, AdDailyRow } from './types'

export type PageKey = 'conta' | 'conteudos' | 'insights' | 'candidaturas'

export interface DashState {
  page: PageKey
  month: string
  week: string
  metric2: string
  topMetric: string
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
  adsRaw: AdDailyRow[] | null
  adsMinD: string | null
  adsMaxD: string | null
  adsLoading: boolean
  adsError: string
  postMetrics: boolean
}

export interface Dashboard {
  model: Model
  state: DashState
  setState: (patch: Partial<DashState> | ((s: DashState) => Partial<DashState>)) => void
  onRefresh: () => void
  setPage: (p: PageKey) => void
  setFunnel: (key: string) => void
}

export function useDashboard(): Dashboard {
  const [model, setModel] = useState<Model>(() => buildModel())
  const initialModel = model

  const [state, setStateRaw] = useState<DashState>(() => ({
    page: 'conta',
    month: 'all',
    week: initialModel.DEFAULT_WEEK.iso,
    metric2: 'views',
    topMetric: 'views',
    refreshing: false,
    lastSync: initialModel.lastSync,
    live: false,
    dataError: '',
    mediaLoading: false,
    dormant: false,
    funnel: 'premium',
    funnelData: {},
    funnelLoading: {},
    funnelError: {},
    candMonth: 'all',
    candFrom: '',
    candTo: '',
    candStatusFilter: 'all',
    adsRaw: null,
    adsMinD: null,
    adsMaxD: null,
    adsLoading: false,
    adsError: '',
    postMetrics: true,
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
  const adsMinDRef = useRef<string | null>(null)
  const adsMaxDRef = useRef<string | null>(null)
  const funnelLoadingRef = useRef<Record<string, boolean>>({})
  const funnelDataRef = useRef<Record<string, FunnelData>>({})
  const liveRef = useRef<LiveAccount | null>(null)

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
      setState({
        live: true,
        dataError: '',
        lastSync: nowStamp(),
        month: 'all',
        week: m1.DEFAULT_WEEK.iso,
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
      adsMinDRef.current = minD
      adsMaxDRef.current = maxD
      // se já estiver num funil só de anúncios e sem filtro, aplica o intervalo padrão
      setState((s) => {
        const patch: Partial<DashState> = { adsLoading: false, adsRaw: raw, adsMinD: minD, adsMaxD: maxD }
        if (funnelSpec(s.funnel)?.adsOnly && !s.candFrom && !s.candTo && s.candMonth === 'all') {
          const r = defaultFunnelRange(minD, maxD)
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
          // intervalo padrão na 1ª carga, se o usuário ainda não filtrou
          if (s.funnel === key && !s.candFrom && !s.candTo && s.candMonth === 'all') {
            const r = defaultFunnelRange(data.minD, data.maxD)
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
    void fetchFunnel(FUNNELS[0].key)
  }, [fetchLive, loadAds, fetchFunnel])

  const onRefresh = useCallback(() => {
    void fetchLive()
  }, [fetchLive])

  const setPage = useCallback((p: PageKey) => setState({ page: p }), [setState])

  const setFunnel = useCallback(
    (key: string) => {
      setState({ funnel: key, candMonth: 'all', candFrom: '', candTo: '', candStatusFilter: 'all' })
      const spec = funnelSpec(key)
      // funil só de anúncios (ex.: Seguidores) — sem planilha, só o intervalo padrão
      if (spec?.adsOnly) {
        const r = defaultFunnelRange(adsMinDRef.current, adsMaxDRef.current)
        setState({ candFrom: r.from, candTo: r.to })
        return
      }
      const d = funnelDataRef.current[key]
      if (!d && !funnelLoadingRef.current[key]) void fetchFunnel(key)
      else if (d) {
        const r = defaultFunnelRange(d.minD, d.maxD)
        setState({ candFrom: r.from, candTo: r.to })
      }
    },
    [setState, fetchFunnel]
  )

  return { model, state, setState, onRefresh, setPage, setFunnel }
}
