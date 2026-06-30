'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

export type HlsSource = { url: string; quality?: string; isM3U8?: boolean }

type Props = {
  sources: HlsSource[]
  referer?: string
  subtitleUrl?: string
}

function proxied(url: string, ref?: string): string {
  const r = ref ? `&ref=${encodeURIComponent(ref)}` : ''
  return `/api/watch/proxy?url=${encodeURIComponent(url)}${r}`
}

export default function HlsPlayer({ sources, referer, subtitleUrl }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)

  // Orden de preferencia de calidad: auto/default primero (master adaptativo).
  const ordered = useMemo(() => {
    const score = (q?: string) => {
      const v = (q || '').toLowerCase()
      if (v.includes('auto') || v.includes('default') || v.includes('master')) return 100000
      const n = parseInt(v, 10)
      return Number.isFinite(n) ? n : 0
    }
    return [...sources].sort((a, b) => score(b.quality) - score(a.quality))
  }, [sources])

  const [idx, setIdx] = useState(0)

  useEffect(() => {
    setIdx(0)
  }, [sources])

  useEffect(() => {
    const video = videoRef.current
    const src = ordered[idx]
    if (!video || !src) return

    const url = proxied(src.url, referer)
    let hls: { destroy: () => void } | null = null
    let cancelled = false

    if (src.isM3U8 !== false) {
      import('hls.js').then(({ default: Hls }) => {
        if (cancelled) return
        if (Hls.isSupported()) {
          const instance = new Hls({ enableWorker: true })
          instance.loadSource(url)
          instance.attachMedia(video)
          hls = instance
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = url
        }
      })
    } else {
      video.src = url
    }

    return () => {
      cancelled = true
      if (hls) hls.destroy()
    }
  }, [ordered, idx, referer])

  return (
    <div>
      <video ref={videoRef} controls playsInline className="watch-video" crossOrigin="anonymous">
        {subtitleUrl ? (
          <track
            kind="subtitles"
            src={subtitleUrl}
            srcLang="es"
            label="Español"
            default
          />
        ) : null}
      </video>
      {ordered.length > 1 ? (
        <div className="watch-quality">
          <span className="text-xs text-faint">Calidad:</span>
          {ordered.map((s, i) => (
            <button
              type="button"
              key={`${s.url}-${i}`}
              className={`watch-quality-btn${i === idx ? ' is-active' : ''}`}
              onClick={() => setIdx(i)}
            >
              {s.quality || `Opción ${i + 1}`}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
