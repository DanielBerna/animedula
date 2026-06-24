'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { createClient, isSupabaseBrowserConfigured } from '../lib/supabase/client'
import { FORUM_TAGS, REACTION_EMOJI, type ForumPost } from '../lib/community/forum'
import ForumAuthor from './ForumAuthor'
import ForumPostBody from './ForumPostBody'
import ForumReplyList from './ForumReplyList'
import StickerPicker from './StickerPicker'

type Props = {
  loggedIn: boolean
  returnTo: string
  contentType?: string
  contentId?: string
  compact?: boolean
}

export default function ForumThread({
  loggedIn,
  returnTo,
  contentType,
  contentId,
  compact = false,
}: Props) {
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(true)
  const [tag, setTag] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [replyTo, setReplyTo] = useState<number | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set())

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams()
    if (contentType && contentId) {
      params.set('content_type', contentType)
      params.set('content_id', contentId)
    }
    if (tag) params.set('tag', tag)
    return `/api/forum-posts?${params.toString()}`
  }, [contentType, contentId, tag])

  const load = useCallback(async () => {
    try {
      const res = await fetch(buildUrl())
      const data = await res.json()
      setPosts(data.posts || [])
    } catch {
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [buildUrl])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) return

    const supabase = createClient()
    const channel = supabase
      .channel(`forum-${contentType || 'global'}-${contentId || 'all'}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'forum_posts' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_reactions' }, () => load())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [contentType, contentId, load])

  const claimForumMission = () => {
    fetch('/api/missions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mission_key: 'forum' }),
    }).catch(() => {})
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/forum-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: compact ? (title.trim() || 'Discusión') : title.trim(),
          body: body.trim(),
          tags: selectedTags,
          content_type: contentType || null,
          content_id: contentId || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setTitle('')
      setBody('')
      setSelectedTags([])
      await load()
      claimForumMission()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo publicar')
    } finally {
      setSending(false)
    }
  }

  const submitReply = async (postId: number, postTitle: string) => {
    if (replyBody.trim().length < 10) return
    setSending(true)
    try {
      const res = await fetch('/api/forum-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: postTitle,
          body: replyBody.trim(),
          parent_id: postId,
          content_type: contentType || null,
          content_id: contentId || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      setReplyTo(null)
      setReplyBody('')
      setExpandedReplies((prev) => new Set(prev).add(postId))
      await load()
      claimForumMission()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSending(false)
    }
  }

  const react = async (postId: number, emoji: string) => {
    if (!loggedIn) return
    await fetch('/api/forum-reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, emoji }),
    })
    await load()
  }

  const toggleReplies = (postId: number) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev)
      if (next.has(postId)) next.delete(postId)
      else next.add(postId)
      return next
    })
  }

  const toggleTag = (id: string) => {
    setSelectedTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }

  return (
    <section className="forum-thread space-y-4">
      {!compact && !contentType && (
        <div className="flex flex-wrap gap-2">
          <button type="button" className={`track-list-chip${!tag ? ' is-active' : ''}`} onClick={() => setTag(null)}>
            Todos
          </button>
          {FORUM_TAGS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`track-list-chip${tag === t.id ? ' is-active' : ''}`}
              onClick={() => setTag(tag === t.id ? null : t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {loggedIn ? (
        <form onSubmit={submit} className="card-glass p-4 space-y-3">
          {!compact && (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título del hilo"
              className="w-full p-2.5 bg-surface-3 border border-white/8 rounded-lg text-sm text-text"
              maxLength={200}
            />
          )}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={compact ? 'Escribe en el foro de esta ficha…' : '¿De qué quieres hablar?'}
            className="w-full p-3 bg-surface-3 border border-white/8 rounded-lg text-sm text-text min-h-[88px]"
            maxLength={8000}
          />
          <StickerPicker value={body} onChange={setBody} disabled={sending} />
          {!compact && (
            <div className="flex flex-wrap gap-2">
              {FORUM_TAGS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`track-list-chip text-xs${selectedTags.includes(t.id) ? ' is-active' : ''}`}
                  onClick={() => toggleTag(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
          {error && <p className="text-xs text-sakura">{error}</p>}
          <button type="submit" disabled={sending} className="btn-primary text-sm">
            {sending ? 'Publicando…' : 'Publicar hilo'}
          </button>
        </form>
      ) : (
        <p className="text-sm text-muted">
          <Link href={`/login?next=${encodeURIComponent(returnTo)}`} className="text-accent hover:underline">
            Inicia sesión
          </Link>{' '}
          para participar en el foro.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted">Cargando hilos…</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-muted">Aún no hay hilos. Abre la conversación.</p>
      ) : (
        <ul className="space-y-4">
          {posts.map((p) => {
            const showReplies = expandedReplies.has(p.id)
            return (
              <li key={p.id} className="forum-post-card rounded-lg border border-white/6 bg-surface-3/50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                  <ForumAuthor profile={p.profiles} authorBorder={p.author_border} />
                  <time className="text-xs text-faint">
                    {new Date(p.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                  </time>
                </div>

                {!compact && <h4 className="font-display font-semibold text-text mb-2">{p.title}</h4>}

                {p.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {p.tags.map((t) => (
                      <span key={t} className="tag text-[10px]">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                <ForumPostBody body={p.body} />

                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/6">
                  {REACTION_EMOJI.map((rx) => {
                    const count = p.reactions?.[rx.id] || 0
                    const active = p.user_reactions?.includes(rx.id)
                    return (
                      <button
                        key={rx.id}
                        type="button"
                        disabled={!loggedIn}
                        onClick={() => react(p.id, rx.id)}
                        className={`review-vote-btn${active ? ' is-active' : ''}`}
                        title={rx.label}
                      >
                        {rx.icon} {count > 0 ? count : ''}
                      </button>
                    )
                  })}
                  {p.reply_count > 0 && (
                    <button
                      type="button"
                      className="text-xs text-accent hover:underline ml-auto"
                      onClick={() => toggleReplies(p.id)}
                    >
                      {showReplies ? 'Ocultar' : 'Ver'} {p.reply_count} respuesta{p.reply_count !== 1 ? 's' : ''}
                    </button>
                  )}
                  {loggedIn && (
                    <button
                      type="button"
                      className="text-xs text-muted hover:text-accent ml-1"
                      onClick={() => setReplyTo(replyTo === p.id ? null : p.id)}
                    >
                      Responder
                    </button>
                  )}
                </div>

                {showReplies && (
                  <ForumReplyList parentId={p.id} loggedIn={loggedIn} onReact={react} />
                )}

                {replyTo === p.id && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder="Tu respuesta…"
                      className="w-full p-2 bg-surface-3 border border-white/8 rounded-lg text-sm text-text min-h-[64px]"
                    />
                    <StickerPicker value={replyBody} onChange={setReplyBody} disabled={sending} />
                    <button
                      type="button"
                      disabled={sending}
                      className="btn-ghost text-xs"
                      onClick={() => submitReply(p.id, p.title)}
                    >
                      Enviar respuesta
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
