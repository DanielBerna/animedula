'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient, isSupabaseBrowserConfigured } from '../lib/supabase/client'

type Comment = {
  id: string
  body: string
  created_at: string
  parent_id?: string | null
  profiles?: { display_name: string | null; avatar_url: string | null; username?: string | null } | null
  _pending?: boolean
}

type Props = {
  kind: 'anime' | 'manga'
  malId: number
  loggedIn: boolean
  returnTo: string
}

function formatRelative(iso: string) {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

export default function CommentSection({ kind, malId, loggedIn, returnTo }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?kind=${kind}&mal_id=${malId}`, { cache: 'no-store' })
      const data = await res.json()
      setComments(data.comments || [])
    } catch {
      setComments([])
    } finally {
      setLoading(false)
    }
  }, [kind, malId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) return

    const supabase = createClient()
    const channel = supabase
      .channel(`comments-${kind}-${malId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments' },
        () => load(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [kind, malId, load])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = body.trim()
    if (!text) return

    const tempId = `pending-${Date.now()}`
    const optimistic: Comment = {
      id: tempId,
      body: text,
      created_at: new Date().toISOString(),
      profiles: { display_name: 'Tú', avatar_url: null, username: null },
      _pending: true,
    }

    setSending(true)
    setError(null)
    setBody('')
    setComments((prev) => [...prev, optimistic])

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, mal_id: malId, body: text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')

      setComments((prev) =>
        prev.map((c) => (c.id === tempId ? { ...data.comment, profiles: optimistic.profiles } : c)),
      )
      await load()
      fetch('/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mission_key: 'comment' }),
      }).catch(() => {})
    } catch (err: unknown) {
      setComments((prev) => prev.filter((c) => c.id !== tempId))
      setBody(text)
      setError(err instanceof Error ? err.message : 'No se pudo publicar')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="card-glass p-5 md:p-6 community-comments">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="font-display text-lg font-semibold text-text">Comentarios</h3>
        {!loading && comments.length > 0 ? (
          <span className="tag tag-accent text-[10px]">{comments.length}</span>
        ) : null}
      </div>

      {loggedIn ? (
        <form onSubmit={submit} className="mb-6 space-y-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="¿Qué te pareció? Sin spoilers gordos…"
            className="w-full p-3 bg-surface-3 border border-white/8 rounded-lg text-sm text-text min-h-[88px] focus:outline-none focus:border-accent/50 transition"
            maxLength={2000}
          />
          <p className="text-[10px] text-faint">{body.length}/2000</p>
          {error && <p className="text-xs text-sakura">{error}</p>}
          <button type="submit" disabled={sending || !body.trim()} className="btn-primary text-sm">
            {sending ? 'Publicando…' : 'Comentar'}
          </button>
        </form>
      ) : (
        <p className="text-sm text-muted mb-6">
          <Link href={`/login?next=${encodeURIComponent(returnTo)}`} className="text-accent hover:underline">
            Inicia sesión
          </Link>{' '}
          para comentar.
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-surface-3/50 animate-pulse" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted">Aún no hay comentarios. Sé el primero en opinar.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c, i) => (
            <li
              key={c.id}
              className={`community-comment-card rounded-lg border border-white/6 bg-surface-3/50 p-4 enter-up${c._pending ? ' opacity-70' : ''}`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="user-avatar w-7 h-7 text-[10px] shrink-0">
                  {(c.profiles?.display_name || '?')[0]?.toUpperCase()}
                </span>
                <div className="min-w-0">
                  {c.profiles?.username ? (
                    <Link href={`/u/${c.profiles.username}`} className="text-xs font-semibold text-accent hover:underline">
                      {c.profiles.display_name || c.profiles.username}
                    </Link>
                  ) : (
                    <span className="text-xs font-semibold text-text">{c.profiles?.display_name || 'Fan'}</span>
                  )}
                  <time className="text-[10px] text-faint ml-2">{formatRelative(c.created_at)}</time>
                </div>
              </div>
              <p className="text-sm text-text leading-relaxed whitespace-pre-line">{c.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
