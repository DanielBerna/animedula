'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

type Comment = {
  id: string
  body: string
  created_at: string
  parent_id?: string | null
  profiles?: { display_name: string | null; avatar_url: string | null } | null
}

type Props = {
  kind: 'anime' | 'manga'
  malId: number
  loggedIn: boolean
  returnTo: string
}

export default function CommentSection({ kind, malId, loggedIn, returnTo }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?kind=${kind}&mal_id=${malId}`)
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, mal_id: malId, body }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setBody('')
      await load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo publicar')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="card-glass p-5 md:p-6">
      <h3 className="font-display text-lg font-semibold text-text mb-4">Comunidad</h3>

      {loggedIn ? (
        <form onSubmit={submit} className="mb-6 space-y-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="¿Qué te pareció? Sin spoilers gordos…"
            className="w-full p-3 bg-surface-3 border border-white/8 rounded-lg text-sm text-text min-h-[88px] focus:outline-none focus:border-accent/50"
            maxLength={2000}
          />
          {error && <p className="text-xs text-sakura">{error}</p>}
          <button type="submit" disabled={sending} className="btn-primary text-sm">
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
        <p className="text-sm text-muted">Cargando comentarios…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted">Aún no hay comentarios. Sé el primero.</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg border border-white/6 bg-surface-3/50 p-4">
              <p className="text-xs text-faint mb-1">
                {c.profiles?.display_name || 'Fan'} · {new Date(c.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
              </p>
              <p className="text-sm text-text leading-relaxed">{c.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
