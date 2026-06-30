'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getDefaultWatchLang, saveWatchLang } from '../../lib/watch/embed'
import { mergePlaybackSources, WATCH_LANG_LABELS } from '../../lib/watch/sources'
import {
  getWatchEntry,
  isEpisodeWatched,
  markEpisodeWatched,
  toggleEpisodeWatched,
} from '../../lib/watch/progress'
import type { EmbedPlaybackSource, MirrorSource, PlaybackSource, WatchLang } from '../../lib/watch/types'
import HlsPlayer from './HlsPlayer'

type Props = {
  malId: number
  title: string
  episodeCount?: number | null
  initialEpisode?: number
  anilistId?: number | null
  loggedIn?: boolean
}

type MirrorsPayload = {
  mirrors: MirrorSource[]
  embeds: EmbedPlaybackSource[]
  hasLatino: boolean
  langsAvailable: WatchLang[]
  anilistId: number | null
}

const SERVER_PREF_KEY = 'animedula-watch-source'
const IFRAME_SLOW_MS = 12_000

function sourceKey(source: PlaybackSource): string {
  return source.tier === 'mirror' ? `mirror-${source.id}` : source.id
}

export default function AnimePlayer({
  malId,
  title,
  episodeCount,
  initialEpisode = 1,
  anilistId: anilistIdProp,
  loggedIn = false,
}: Props) {
  const router = useRouter()

  const [episode, setEpisode] = useState(initialEpisode)
  const [lang, setLang] = useState<WatchLang>('lat')
  const [sourceId, setSourceId] = useState('')
  const [payload, setPayload] = useState<MirrorsPayload | null>(null)
  const [loadingSources, setLoadingSources] = useState(true)
  const [iframeLoading, setIframeLoading] = useState(true)
  const [iframeSlow, setIframeSlow] = useState(false)
  const [cinema, setCinema] = useState(false)
  const [watched, setWatched] = useState<Set<number>>(() => new Set())
  const [submitUrl, setSubmitUrl] = useState('')
  const [submitOpen, setSubmitOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const refreshWatched = useCallback(() => {
    setWatched(new Set(getWatchEntry(malId).watched))
  }, [malId])

  useEffect(() => {
    setEpisode(initialEpisode)
    setIframeLoading(true)
    setIframeSlow(false)
    refreshWatched()
  }, [initialEpisode, malId, refreshWatched])

  useEffect(() => {
    setLang(getDefaultWatchLang())
  }, [])

  useEffect(() => {
    document.body.classList.toggle('watch-cinema-on', cinema)
    return () => document.body.classList.remove('watch-cinema-on')
  }, [cinema])

  useEffect(() => {
    let cancelled = false
    setLoadingSources(true)

    const params = new URLSearchParams({
      malId: String(malId),
      ep: String(episode),
      lang,
    })
    if (anilistIdProp) params.set('anilistId', String(anilistIdProp))

    fetch(`/api/watch/mirrors?${params}`)
      .then((r) => r.json())
      .then((data: MirrorsPayload) => {
        if (cancelled) return
        setPayload(data)
      })
      .catch(() => {
        if (!cancelled) setPayload({ mirrors: [], embeds: [], hasLatino: false, langsAvailable: [], anilistId: null })
      })
      .finally(() => {
        if (!cancelled) setLoadingSources(false)
      })

    return () => {
      cancelled = true
    }
  }, [malId, episode, lang, anilistIdProp])

  const playbackSources = useMemo(() => {
    if (!payload) return []
    return mergePlaybackSources(payload.mirrors, payload.embeds)
  }, [payload])

  const currentSource = useMemo(() => {
    if (!playbackSources.length) return null
    const found = playbackSources.find((s) => sourceKey(s) === sourceId)
    return found || playbackSources[0]
  }, [playbackSources, sourceId])

  useEffect(() => {
    if (!playbackSources.length) {
      setSourceId('')
      return
    }
    try {
      const saved = localStorage.getItem(SERVER_PREF_KEY)
      const valid = saved ? playbackSources.find((s) => sourceKey(s) === saved) : null
      setSourceId(valid ? sourceKey(valid) : sourceKey(playbackSources[0]))
    } catch {
      setSourceId(sourceKey(playbackSources[0]))
    }
  }, [playbackSources])

  useEffect(() => {
    if (!currentSource) return
    if (currentSource.sourceType === 'iframe') {
      setIframeLoading(true)
      setIframeSlow(false)
    } else {
      setIframeLoading(false)
      setIframeSlow(false)
    }
  }, [currentSource])

  const syncEpisodeUrl = useCallback(
    (ep: number) => {
      router.replace(`/ver/${malId}/${ep}`, { scroll: false })
    },
    [malId, router],
  )

  const bumpIframe = useCallback(() => {
    setIframeLoading(true)
    setIframeSlow(false)
  }, [])

  const setEpisodeAndUrl = useCallback(
    (ep: number) => {
      const n = Math.max(1, ep)
      setEpisode(n)
      bumpIframe()
      syncEpisodeUrl(n)
    },
    [bumpIframe, syncEpisodeUrl],
  )

  const selectSource = useCallback(
    (id: string) => {
      setSourceId(id)
      bumpIframe()
      try {
        localStorage.setItem(SERVER_PREF_KEY, id)
      } catch {
        /* ignore */
      }
    },
    [bumpIframe],
  )

  const tryNextServer = useCallback(() => {
    if (playbackSources.length < 2 || !currentSource) return
    const idx = playbackSources.findIndex((s) => sourceKey(s) === sourceKey(currentSource))
    selectSource(sourceKey(playbackSources[(idx + 1) % playbackSources.length]))
  }, [playbackSources, currentSource, selectSource])

  const setLangAndSave = useCallback(
    (next: WatchLang) => {
      setLang(next)
      saveWatchLang(next)
      bumpIframe()
    },
    [bumpIframe],
  )

  const toggleWatched = useCallback(() => {
    toggleEpisodeWatched(malId, episode)
    refreshWatched()
  }, [malId, episode, refreshWatched])

  const maxEp = episodeCount && episodeCount > 0 ? episodeCount : 24
  const episodeButtons = Math.min(maxEp, 120)
  const watchedCount = watched.size
  const currentWatched = isEpisodeWatched(malId, episode)
  const langLabel = WATCH_LANG_LABELS[lang]
  const hasLatinoMirror = payload?.hasLatino ?? false
  const showLatNotice = lang === 'lat' && !hasLatinoMirror && !loadingSources

  const submitMirror = async () => {
    if (!submitUrl.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/watch/submit-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mal_id: malId, episode, url: submitUrl.trim(), lang: 'lat' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSubmitUrl('')
      setSubmitOpen(false)
      alert('¡Gracias! Revisaremos tu enlace pronto.')
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'No se pudo enviar')
    } finally {
      setSubmitting(false)
    }
  }

  const goNextEpisode = useCallback(() => {
    markEpisodeWatched(malId, episode)
    refreshWatched()
    if (episode < maxEp) setEpisodeAndUrl(episode + 1)
  }, [malId, episode, maxEp, refreshWatched, setEpisodeAndUrl])

  const iframeSrc = currentSource?.sourceType === 'iframe' ? currentSource.url : ''

  useEffect(() => {
    if (!iframeSrc) return
    setIframeSlow(false)
    const t = window.setTimeout(() => setIframeSlow(true), IFRAME_SLOW_MS)
    return () => window.clearTimeout(t)
  }, [iframeSrc])

  const renderPlayer = () => {
    if (loadingSources) {
      return <div className="watch-frame-msg">Buscando servidores…</div>
    }
    if (!currentSource) {
      return <div className="watch-frame-msg">No hay servidores para este capítulo.</div>
    }

    if (currentSource.sourceType === 'hls') {
      return (
        <HlsPlayer
          sources={[{ url: currentSource.url, quality: currentSource.quality || 'Auto', isM3U8: true }]}
          referer={currentSource.referer || undefined}
        />
      )
    }

    if (currentSource.sourceType === 'mp4') {
      return (
        <video
          key={currentSource.url}
          src={currentSource.url}
          controls
          playsInline
          className="watch-video"
        />
      )
    }

    return (
      <iframe
        key={iframeSrc}
        src={iframeSrc}
        title={`${title} · Episodio ${episode}`}
        allowFullScreen
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        className="watch-frame"
        onLoad={() => {
          setIframeLoading(false)
          setIframeSlow(false)
        }}
      />
    )
  }

  return (
    <div className={`watch-player${cinema ? ' is-cinema-focus' : ''}`}>
      {showLatNotice ? (
        <div className="watch-lang-notice" role="note">
          <strong>Sin doblaje latino en este capítulo.</strong> Aún no hay espejo propio en Animédula.
          Prueba otro servidor o cambia a <strong>Japonés + subtítulos</strong>. Los servidores externos
          no ofrecen español latino.
          {loggedIn ? (
            <div className="mt-2">
              {!submitOpen ? (
                <button type="button" className="btn-ghost text-xs" onClick={() => setSubmitOpen(true)}>
                  ¿Tienes un enlace latino? Aportar →
                </button>
              ) : (
                <div className="flex flex-wrap gap-2 items-center mt-1">
                  <input
                    className="input text-xs flex-1 min-w-[200px]"
                    placeholder="https://…"
                    value={submitUrl}
                    onChange={(e) => setSubmitUrl(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-primary text-xs"
                    disabled={submitting}
                    onClick={submitMirror}
                  >
                    {submitting ? 'Enviando…' : 'Enviar'}
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : hasLatinoMirror && lang === 'lat' ? (
        <div className="watch-lang-notice watch-lang-notice-ok" role="status">
          <strong>Doblaje latino</strong> disponible en servidores Animédula para este capítulo.
        </div>
      ) : null}

      <div className="watch-toolbar">
        <span className="watch-now-playing">
          Episodio <strong>{episode}</strong>
          {episodeCount ? ` de ${episodeCount}` : ''} · {langLabel}
        </span>
        {episodeCount ? (
          <span className="watch-progress-pill">
            {watchedCount} visto{watchedCount === 1 ? '' : 's'}
          </span>
        ) : null}
      </div>

      <div className="watch-frame-wrap">
        {iframeLoading && currentSource?.sourceType === 'iframe' ? (
          <div className="watch-frame-overlay" aria-live="polite">
            <span className="watch-frame-spinner" aria-hidden />
            Cargando reproductor…
          </div>
        ) : null}
        {iframeSlow && iframeLoading && currentSource?.sourceType === 'iframe' ? (
          <div className="watch-frame-slow">
            <p>Tarda más de lo habitual.</p>
            <button type="button" className="btn-ghost text-xs" onClick={tryNextServer}>
              Probar siguiente servidor →
            </button>
          </div>
        ) : null}
        {renderPlayer()}
      </div>

      <div className="watch-actions">
        <button
          type="button"
          className={`watch-action-btn${currentWatched ? ' is-active' : ''}`}
          onClick={toggleWatched}
          title={currentWatched ? 'Quitar de vistos' : 'Marcar episodio como visto'}
        >
          {currentWatched ? '✓ Visto' : '○ Marcar visto'}
        </button>
        <button
          type="button"
          className="watch-action-btn"
          disabled={episode <= 1}
          onClick={() => setEpisodeAndUrl(episode - 1)}
        >
          ← Anterior
        </button>
        <button
          type="button"
          className="watch-action-btn watch-action-btn-accent"
          disabled={episode >= maxEp}
          onClick={goNextEpisode}
        >
          Siguiente →
        </button>
        <button
          type="button"
          className={`watch-action-btn${cinema ? ' is-active' : ''}`}
          onClick={() => setCinema((c) => !c)}
          title="Oscurecer el resto de la página"
        >
          {cinema ? '☀ Luces' : '◐ Cine'}
        </button>
      </div>

      <div className="watch-controls">
        <div className="watch-server-tabs" role="group" aria-label="Servidor">
          {playbackSources.map((s) => {
            const key = sourceKey(s)
            const isMirror = s.tier === 'mirror'
            return (
              <button
                type="button"
                key={key}
                className={`watch-server-btn${key === sourceId ? ' is-active' : ''}`}
                onClick={() => selectSource(key)}
                title={isMirror ? 'Espejo Animédula' : 'Servidor externo'}
              >
                {s.serverLabel}
                {isMirror ? <span className="watch-server-badge">★</span> : null}
                {s.tier === 'embed' && s.idKind === 'anilist' ? (
                  <span className="watch-server-badge watch-server-badge-alt">AL</span>
                ) : null}
              </button>
            )
          })}
        </div>

        <div className="watch-type-toggle" role="group" aria-label="Idioma del audio">
          <button
            type="button"
            className={`watch-type-btn${lang === 'lat' ? ' is-active' : ''}`}
            onClick={() => setLangAndSave('lat')}
            title="Doblaje en español latino (espejos propios)"
          >
            {WATCH_LANG_LABELS.lat}
          </button>
          <button
            type="button"
            className={`watch-type-btn${lang === 'sub' ? ' is-active' : ''}`}
            onClick={() => setLangAndSave('sub')}
            title="Audio original en japonés con subtítulos"
          >
            {WATCH_LANG_LABELS.sub}
          </button>
          <button
            type="button"
            className={`watch-type-btn${lang === 'dub' ? ' is-active' : ''}`}
            onClick={() => setLangAndSave('dub')}
            title="Doblaje en inglés (servidores externos)"
          >
            {WATCH_LANG_LABELS.dub}
          </button>
        </div>

        {playbackSources.length > 1 ? (
          <button type="button" className="watch-next-server focus-ring" onClick={tryNextServer}>
            Otro servidor
          </button>
        ) : null}

        <label className="watch-jump">
          Ir al cap.
          <input
            type="number"
            min={1}
            max={maxEp > 0 ? maxEp : undefined}
            value={episode}
            onChange={(e) => setEpisodeAndUrl(Math.max(1, Number(e.target.value) || 1))}
            className="input watch-jump-input"
          />
        </label>
      </div>

      <div className="watch-episodes" role="group" aria-label="Episodios">
        {Array.from({ length: episodeButtons }, (_, i) => i + 1).map((n) => {
          const seen = watched.has(n)
          return (
            <button
              type="button"
              key={n}
              className={`watch-ep${n === episode ? ' is-active' : ''}${seen ? ' is-watched' : ''}`}
              onClick={() => setEpisodeAndUrl(n)}
              title={seen ? `Episodio ${n} · visto` : `Episodio ${n}`}
            >
              {seen ? '✓ ' : ''}
              {n}
            </button>
          )
        })}
      </div>

      <p className="text-xs text-faint mt-3">
        Servidores con ★ son espejos propios (latino). El resto son externos por MAL/AniList. Si no carga,
        prueba <strong>Otro servidor</strong>.
      </p>
    </div>
  )
}
