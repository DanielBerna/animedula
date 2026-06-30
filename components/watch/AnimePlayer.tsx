'use client'

import { useEffect, useMemo, useState } from 'react'
import { buildEmbedUrl, getWatchProviders, type EmbedType } from '../../lib/watch/embed'
import HlsPlayer, { type HlsSource } from './HlsPlayer'

type Props = {
  malId: number
  title: string
  episodeCount?: number | null
}

type ConsumetEpisode = { id: string; number: number; title?: string }

type Server =
  | { id: string; name: string; kind: 'hls'; dub: boolean }
  | { id: string; name: string; kind: 'embed'; template: string; dub?: boolean }

export default function AnimePlayer({ malId, title, episodeCount }: Props) {
  const embedProviders = useMemo(() => getWatchProviders(), [])

  const [episode, setEpisode] = useState(1)
  const [type, setType] = useState<EmbedType>('sub')

  // ── Consumet (HLS) ──
  const [hlsAvailable, setHlsAvailable] = useState(false)
  const [epsByDub, setEpsByDub] = useState<{ sub: ConsumetEpisode[]; dub: ConsumetEpisode[] }>({ sub: [], dub: [] })
  const [sources, setSources] = useState<HlsSource[]>([])
  const [referer, setReferer] = useState<string | undefined>(undefined)
  const [loadingSrc, setLoadingSrc] = useState(false)

  // Detectar si hay backend Consumet disponible (episodios sub).
  useEffect(() => {
    let active = true
    fetch(`/api/watch/episodes?malId=${malId}&dub=false`)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return
        if (d.enabled && Array.isArray(d.episodes) && d.episodes.length) {
          setHlsAvailable(true)
          setEpsByDub((prev) => ({ ...prev, sub: d.episodes }))
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [malId])

  const servers: Server[] = useMemo(() => {
    const list: Server[] = []
    if (hlsAvailable) {
      list.push({ id: 'hd-sub', name: 'HD · Sub', kind: 'hls', dub: false })
      list.push({ id: 'hd-dub', name: 'HD · Doblaje', kind: 'hls', dub: true })
    }
    for (const p of embedProviders) {
      list.push({ id: p.id, name: p.name, kind: 'embed', template: p.template, dub: p.dub })
    }
    return list
  }, [hlsAvailable, embedProviders])

  const [serverId, setServerId] = useState<string>('')
  // Cuando aparecen servidores, selecciona el primero (prioriza HLS).
  useEffect(() => {
    if (!serverId && servers.length) setServerId(servers[0].id)
  }, [servers, serverId])

  const server = servers.find((s) => s.id === serverId) || servers[0]
  const isHls = server?.kind === 'hls'
  const dubSupported = isHls ? true : server?.dub !== false
  const effectiveType: EmbedType = dubSupported ? type : 'sub'

  // Episodios disponibles para el grid.
  const hlsDub = isHls && (server as { dub: boolean }).dub
  const consumetEps = hlsDub ? epsByDub.dub : epsByDub.sub
  const total = episodeCount && episodeCount > 0 ? episodeCount : 0
  const episodeButtons = isHls && consumetEps.length ? consumetEps.length : total > 0 ? total : 12

  // Cargar episodios dub bajo demanda.
  useEffect(() => {
    if (!isHls || !hlsDub || epsByDub.dub.length) return
    let active = true
    fetch(`/api/watch/episodes?malId=${malId}&dub=true`)
      .then((r) => r.json())
      .then((d) => {
        if (active && d.enabled && Array.isArray(d.episodes)) {
          setEpsByDub((prev) => ({ ...prev, dub: d.episodes }))
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [isHls, hlsDub, malId, epsByDub.dub.length])

  // Cargar fuentes HLS al cambiar episodio/servidor.
  useEffect(() => {
    if (!isHls) {
      setSources([])
      return
    }
    const ep = consumetEps.find((e) => e.number === episode)
    if (!ep) {
      setSources([])
      return
    }
    let active = true
    setLoadingSrc(true)
    fetch(`/api/watch/sources?episodeId=${encodeURIComponent(ep.id)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return
        setSources(Array.isArray(d.sources) ? d.sources : [])
        setReferer(d.headers?.Referer || d.headers?.referer || undefined)
      })
      .catch(() => active && setSources([]))
      .finally(() => active && setLoadingSrc(false))
    return () => {
      active = false
    }
  }, [isHls, serverId, episode, consumetEps])

  const embedSrc = useMemo(() => {
    if (!server || server.kind !== 'embed') return ''
    return buildEmbedUrl(server.template, malId, episode, effectiveType)
  }, [server, malId, episode, effectiveType])

  return (
    <div className="watch-player">
      <div className="watch-frame-wrap">
        {isHls ? (
          loadingSrc ? (
            <div className="watch-frame-msg">Cargando fuente…</div>
          ) : sources.length ? (
            <HlsPlayer sources={sources} referer={referer} />
          ) : (
            <div className="watch-frame-msg">
              Sin fuente para este episodio en este servidor. Prueba otro servidor.
            </div>
          )
        ) : (
          <iframe
            key={embedSrc}
            src={embedSrc}
            title={`${title} · Episodio ${episode}`}
            allowFullScreen
            referrerPolicy="no-referrer"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            className="watch-frame"
          />
        )}
      </div>

      <div className="watch-controls">
        <div className="watch-server-tabs" role="group" aria-label="Servidor">
          {servers.map((s) => (
            <button
              type="button"
              key={s.id}
              className={`watch-server-btn${s.id === serverId ? ' is-active' : ''}`}
              onClick={() => setServerId(s.id)}
            >
              {s.name}
            </button>
          ))}
        </div>

        {!isHls ? (
          <div className="watch-type-toggle" role="group" aria-label="Idioma">
            <button
              type="button"
              className={`watch-type-btn${effectiveType === 'sub' ? ' is-active' : ''}`}
              onClick={() => setType('sub')}
            >
              Subtítulos
            </button>
            <button
              type="button"
              className={`watch-type-btn${effectiveType === 'dub' ? ' is-active' : ''}`}
              onClick={() => setType('dub')}
              disabled={!dubSupported}
              title={dubSupported ? 'Doblaje' : 'Este servidor no ofrece doblaje'}
            >
              Doblaje
            </button>
          </div>
        ) : null}

        <label className="watch-jump">
          Ir al episodio
          <input
            type="number"
            min={1}
            value={episode}
            onChange={(e) => setEpisode(Math.max(1, Number(e.target.value) || 1))}
            className="input watch-jump-input"
          />
        </label>
      </div>

      <div className="watch-episodes">
        {Array.from({ length: episodeButtons }, (_, i) => i + 1).map((n) => (
          <button
            type="button"
            key={n}
            className={`watch-ep${n === episode ? ' is-active' : ''}`}
            onClick={() => setEpisode(n)}
          >
            {n}
          </button>
        ))}
      </div>

      <p className="text-xs text-faint mt-3">
        Reproducción mediante servidores externos de terceros. Animédula <strong>no aloja, no almacena
        ni distribuye</strong> ningún video: solo se reproduce un flujo incrustado. Si un episodio no
        carga o no está en español, prueba otro servidor o cambia entre Subtítulos/Doblaje.
      </p>
    </div>
  )
}
