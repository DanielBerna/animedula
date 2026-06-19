'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

type Shot = {
  id: number
  url: string
  caption: string | null
  created_at: string
  author: string
}

type Props = {
  contentType: 'anime' | 'manga' | 'game' | 'movie'
  contentId: string
  loggedIn: boolean
  returnTo: string
}

export default function ScreenshotSection({
  contentType,
  contentId,
  loggedIn,
  returnTo,
}: Props) {
  const [shots, setShots] = useState<Shot[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<Shot | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/screenshots?content_type=${encodeURIComponent(contentType)}&content_id=${encodeURIComponent(contentId)}`,
      )
      const data = await res.json()
      setShots(data.screenshots || [])
    } catch {
      setShots([])
    } finally {
      setLoading(false)
    }
  }, [contentType, contentId])

  useEffect(() => {
    load()
  }, [load])

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.set('file', file)
      fd.set('content_type', contentType)
      fd.set('content_id', contentId)
      if (caption.trim()) fd.set('caption', caption.trim())
      const res = await fetch('/api/screenshots', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo subir')
      setCaption('')
      e.target.value = ''
      await load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al subir')
    } finally {
      setUploading(false)
    }
  }

  return (
    <section className="screenshot-section space-y-5">
      {loggedIn ? (
        <div className="screenshot-upload card-glass p-4 space-y-3">
          <p className="text-sm text-muted">Comparte una captura de pantalla (+15 XP)</p>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Pie de foto opcional…"
            className="ui-input w-full"
            maxLength={200}
          />
          <label className="btn-primary text-sm cursor-pointer inline-flex">
            {uploading ? 'Subiendo…' : 'Elegir imagen'}
            <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={upload} />
          </label>
          {error && <p className="text-xs text-sakura">{error}</p>}
        </div>
      ) : (
        <p className="text-sm text-muted">
          <Link href={`/login?next=${encodeURIComponent(returnTo)}`} className="text-accent hover:underline">
            Inicia sesión
          </Link>{' '}
          para subir capturas.
        </p>
      )}

      {loading ? (
        <div className="screenshot-grid skeleton-shimmer" aria-busy>
          {[1, 2, 3].map((i) => (
            <div key={i} className="screenshot-thumb skeleton-block" />
          ))}
        </div>
      ) : shots.length === 0 ? (
        <p className="text-sm text-muted card-glass p-5 text-center">Aún no hay capturas. Sé el primero en compartir.</p>
      ) : (
        <div className="screenshot-grid">
          {shots.map((s) => (
            <button
              key={s.id}
              type="button"
              className="screenshot-thumb group"
              onClick={() => setLightbox(s)}
            >
              {s.url ? (
                <Image src={s.url} alt={s.caption || 'Captura'} fill className="object-cover" sizes="200px" unoptimized />
              ) : null}
              <span className="screenshot-thumb-meta">
                <span className="text-xs font-medium">{s.author}</span>
                {s.caption ? <span className="text-[10px] line-clamp-1 opacity-90">{s.caption}</span> : null}
              </span>
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div className="screenshot-lightbox" role="dialog" aria-modal onClick={() => setLightbox(null)}>
          <div className="screenshot-lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="screenshot-lightbox-close" onClick={() => setLightbox(null)} aria-label="Cerrar">
              ✕
            </button>
            {lightbox.url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={lightbox.url} alt={lightbox.caption || 'Captura'} className="screenshot-lightbox-img" />
            )}
            <p className="screenshot-lightbox-caption text-sm mt-3">{lightbox.author} · {lightbox.caption}</p>
          </div>
        </div>
      )}
    </section>
  )
}
