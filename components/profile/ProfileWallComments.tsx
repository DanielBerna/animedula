'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

type Comment = {
  id: number
  body: string
  section: string
  created_at: string
  author_id: string
  author_name: string
  author_username: string | null
}

type Props = {
  profileUserId: string
  section: string
  title?: string
  compact?: boolean
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `hace ${days}d`
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

export default function ProfileWallComments({
  profileUserId,
  section,
  title = 'Muro de amigos',
  compact = false,
}: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [canComment, setCanComment] = useState(false)
  const [friendsOnly, setFriendsOnly] = useState(false)
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        profile_user_id: profileUserId,
        section,
      })
      const res = await fetch(`/api/profile/wall?${params}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al cargar')
      setComments(data.comments || [])
      setCanComment(Boolean(data.can_comment))
      setFriendsOnly(data.reason === 'friends_only')
    } catch (err: unknown) {
      setComments([])
      setError(err instanceof Error ? err.message : 'No se pudo cargar el muro')
    } finally {
      setLoading(false)
    }
  }, [profileUserId, section])

  useEffect(() => {
    load()
  }, [load])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = body.trim()
    if (!text || sending) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/profile/wall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_user_id: profileUserId, section, body: text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo publicar')
      setBody('')
      await load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al publicar')
    } finally {
      setSending(false)
    }
  }

  if (friendsOnly && !loading) {
    return compact ? null : (
      <div className="profile-wall-friends-only">
        <p className="text-xs text-muted">Solo los amigos pueden ver y comentar en esta sección.</p>
      </div>
    )
  }

  return (
    <div className={`profile-wall ${compact ? 'profile-wall-compact' : ''}`}>
      {!compact ? (
        <h3 className="profile-wall-title">{title}</h3>
      ) : null}
      {loading ? (
        <p className="text-xs text-faint">Cargando comentarios…</p>
      ) : (
        <ul className="profile-wall-list">
          {comments.length === 0 ? (
            <li className="text-xs text-faint">Aún no hay comentarios de amigos aquí.</li>
          ) : (
            comments.map((c) => (
              <li key={c.id} className="profile-wall-comment">
                <div className="flex items-baseline justify-between gap-2">
                  {c.author_username ? (
                    <Link href={`/u/${c.author_username}`} className="text-sm font-semibold text-accent hover:underline">
                      {c.author_name}
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold text-text">{c.author_name}</span>
                  )}
                  <time className="text-[10px] text-faint">{formatRelative(c.created_at)}</time>
                </div>
                <p className="text-sm text-muted mt-1">{c.body}</p>
              </li>
            ))
          )}
        </ul>
      )}
      {canComment ? (
        <form onSubmit={submit} className="profile-wall-form">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Escribe algo amable (solo amigos)…"
            maxLength={500}
            rows={2}
            className="input w-full text-sm"
          />
          {error ? <p className="text-xs text-red-400 mt-1">{error}</p> : null}
          <button type="submit" disabled={sending || !body.trim()} className="btn-primary text-xs mt-2">
            {sending ? 'Publicando…' : 'Comentar'}
          </button>
        </form>
      ) : null}
    </div>
  )
}
