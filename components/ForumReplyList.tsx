'use client'

import { useCallback, useEffect, useState } from 'react'
import ForumAuthor from './ForumAuthor'
import ForumPostBody from './ForumPostBody'
import { REACTION_EMOJI, type ForumPost } from '../lib/community/forum'

type Props = {
  parentId: number
  loggedIn: boolean
  onReact: (postId: number, emoji: string) => void
}

export default function ForumReplyList({ parentId, loggedIn, onReact }: Props) {
  const [replies, setReplies] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/forum-posts?parent_id=${parentId}`)
      const data = await res.json()
      const list = (data.posts || []) as ForumPost[]
      setReplies(list.reverse())
    } catch {
      setReplies([])
    } finally {
      setLoading(false)
    }
  }, [parentId])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  if (loading) return <p className="text-xs text-faint mt-3 pl-3">Cargando respuestas…</p>
  if (replies.length === 0) return null

  return (
    <ul className="forum-replies mt-3 ml-2 pl-3 border-l-2 border-white/8 space-y-3">
      {replies.map((r) => (
        <li key={r.id} className="forum-reply-item rounded-lg bg-surface-3/30 p-3">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
            <ForumAuthor profile={r.profiles} authorBorder={r.author_border} compact />
            <time className="text-[10px] text-faint">
              {new Date(r.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
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
