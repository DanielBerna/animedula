'use client'

import { useState } from 'react'
import Link from 'next/link'

type Props = {
  contentType: 'anime' | 'manga' | 'game' | 'movie'
  contentId: string
  title: string
  imageUrl?: string
  loggedIn: boolean
  returnTo: string
}

export default function TrackListButton({
  contentType,
  contentId,
  title,
  imageUrl,
  loggedIn,
  returnTo,
}: Props) {
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = async (next: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/user-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: contentType,
          content_id: contentId,
          title,
          image_url: imageUrl,
          status: next,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar')
      setStatus(next)
      fetch('/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mission_key: 'list' }),
      }).catch(() => {})
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  if (!loggedIn) {
    return (
      <p className="text-sm text-muted">
        <Link href={`/login?next=${encodeURIComponent(returnTo)}`} className="text-accent hover:underline">
          Inicia sesión
        </Link>{' '}
        para añadir a tu lista.
      </p>
    )
  }

  return (
    <div className="track-list-actions">
      <p className="text-xs text-muted mb-2">Tu lista personal</p>
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'watching', label: 'Viendo' },
          { id: 'completed', label: 'Completado' },
          { id: 'pending', label: 'Pendiente' },
          { id: 'dropped', label: 'Drop' },
        ].map((opt) => (
          <button
            key={opt.id}
            type="button"
            disabled={loading}
            className={`track-list-chip${status === opt.id ? ' is-active' : ''}`}
            onClick={() => update(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {error ? <p className="text-xs text-sakura mt-2">{error}</p> : null}
      {status ? (
        <p className="text-xs text-faint mt-2">Guardado · ganas XP al participar</p>
      ) : null}
    </div>
  )
}
