'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient, isSupabaseBrowserConfigured } from '../lib/supabase/client'
import ForumAuthor from './ForumAuthor'
import ForumPostBody from './ForumPostBody'
import { REACTION_EMOJI, type ForumPost } from '../lib/community/forum'

type Props = {
  parentId: number
  expectedCount?: number
  loggedIn: boolean
  refreshKey?: number
  contentType?: string
  contentId?: string
  onReact: (postId: number, emoji: string) => void
}

export default function ForumReplyList({
  parentId,
  expectedCount = 0,
  loggedIn,
  refreshKey = 0,
  contentType,
  contentId,
  onReact,
}: Props) {
  const [replies, setReplies] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams({ parent_id: String(parentId) })
    if (contentType && contentId) {
      params.set('content_type', contentType)
      params.set('content_id', contentId)
    }
    return `/api/forum-posts?${params.toString()}`
  }, [parentId, contentType, contentId])

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch(buildUrl(), { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al cargar')
      setReplies((data.posts || []) as ForumPost[])
    } catch (err: unknown) {
      setReplies([])
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las respuestas')
    } finally {
      setLoading(false)
    }
  }, [buildUrl])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load, refreshKey])

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) return

    const supabase = createClient()
    const channel = supabase
      .channel(`forum-replies-${parentId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'forum_posts' },
        (payload) => {
          const row = payload.new as { parent_id?: number | null }
          if (row.parent_id === parentId) load()
        },
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_reactions' }, () => load())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [parentId, load])

  if (loading) {
    return (
      <div className="forum-replies-loading mt-3 ml-2 pl-3 border-l-2 border-accent/30">
        <p className="text-xs text-muted animate-pulse">Cargando respuestas…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="forum-replies-error mt-3 ml-2 pl-3 border-l-2 border-sakura/40">
        <p className="text-xs text-sakura">{error}</p>
        <button type="button" className="text-xs text-accent mt-1 hover:underline" onClick={load}>
          Reintentar
        </button>
      </div>
    )
  }

  if (replies.length === 0) {
    return (
      <p className="text-xs text-muted mt-3 ml-2 pl-3 border-l-2 border-white/8">
        {expectedCount > 0
          ? 'Las respuestas existen pero no se cargaron. Prueba recargar la página.'
          : 'Aún no hay respuestas en este hilo.'}
      </p>
    )
  }

  return (
    <ul className="forum-replies mt-3 ml-2 pl-3 border-l-2 border-accent/25 space-y-3">
      {replies.map((r, i) => (
        <li
          key={r.id}
          className="forum-reply-item rounded-lg bg-surface-3/40 p-3 enter-up"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
            <ForumAuthor profile={r.profiles} authorBorder={r.author_border} compact />
            <time className="text-[10px] text-faint" dateTime={r.created_at}>
              {formatRelative(r.created_at)}
            </time>
          </div>
          <ForumPostBody body={r.body} />
          <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-white/5">
            {REACTION_EMOJI.map((rx) => {
              const count = r.reactions?.[rx.id] || 0
              const active = r.user_reactions?.includes(rx.id)
              return (
                <button
                  key={rx.id}
                  type="button"
                  disabled={!loggedIn}
                  onClick={() => onReact(r.id, rx.id)}
                  className={`review-vote-btn text-[11px]${active ? ' is-active' : ''}`}
                >
                  {rx.icon} {count > 0 ? count : ''}
                </button>
              )
            })}
          </div>
        </li>
      ))}
    </ul>
  )
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
