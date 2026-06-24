'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import SpoilerText from './SpoilerText'
import { ContentType, getReviewMetrics } from '../lib/community/review-metrics'

export type UserReview = {
  id: number
  rating_global: number
  metrics_json: Record<string, number> | null
  comment: string
  is_spoiler: boolean
  status?: string
  created_at: string
  user_id: string
  profiles?: { display_name: string | null; username?: string | null } | null
  up_count: number
  down_count: number
  user_vote: 'up' | 'down' | null
}

type Props = {
  contentType: ContentType
  contentId: string
  loggedIn: boolean
  refreshKey?: number
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

export default function UserReviewList({ contentType, contentId, loggedIn, refreshKey = 0 }: Props) {
  const [reviews, setReviews] = useState<UserReview[]>([])
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState<number | null>(null)
  const metricLabels = Object.fromEntries(getReviewMetrics(contentType).map((m) => [m.key, m.label]))

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/user-reviews?content_type=${encodeURIComponent(contentType)}&content_id=${encodeURIComponent(contentId)}`,
        { cache: 'no-store' },
      )
      const data = await res.json()
      setReviews(data.reviews || [])
    } catch {
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [contentType, contentId])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load, refreshKey])

  const vote = async (reviewId: number, voteType: 'up' | 'down') => {
    if (!loggedIn) return

    setReviews((prev) =>
      prev.map((r) => {
        if (r.id !== reviewId) return r
        const was = r.user_vote
        let up = r.up_count
        let down = r.down_count
        if (was === 'up') up--
        if (was === 'down') down--
        if (was === voteType) {
          return { ...r, up_count: up, down_count: down, user_vote: null }
        }
        if (voteType === 'up') up++
        else down++
        return { ...r, up_count: up, down_count: down, user_vote: voteType }
      }),
    )

    setVoting(reviewId)
    try {
      const res = await fetch('/api/review-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_id: reviewId, vote_type: voteType }),
      })
      if (res.ok) await load()
    } finally {
      setVoting(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 rounded-lg bg-surface-3/50 animate-pulse" />
        ))}
      </div>
    )
  }

  if (reviews.length === 0) {
    return <p className="text-sm text-muted">Aún no hay reseñas publicadas. Sé el primero.</p>
  }

  const published = reviews.filter((r) => r.status !== 'pending')
  const pending = reviews.filter((r) => r.status === 'pending')

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <p className="text-xs text-muted">
          Tienes {pending.length} reseña{pending.length !== 1 ? 's' : ''} en revisión por el equipo.
        </p>
      )}

      <ul className="space-y-4">
        {reviews.map((r, i) => {
          const score = r.up_count - r.down_count
          const metrics = r.metrics_json || {}
          const metricEntries = Object.entries(metrics).filter(([, v]) => typeof v === 'number')
          const name = r.profiles?.display_name || 'Fan'

          return (
            <li
              key={r.id}
              className="user-review-card rounded-lg border border-white/6 bg-surface-3/50 p-4 enter-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div className="flex items-start gap-2">
                  <span className="user-avatar w-8 h-8 text-xs shrink-0">{name[0]?.toUpperCase()}</span>
                  <div>
                    {r.profiles?.username ? (
                      <Link href={`/u/${r.profiles.username}`} className="text-xs font-semibold text-accent hover:underline">
                        {name}
                      </Link>
                    ) : (
                      <p className="text-xs font-semibold text-text">{name}</p>
                    )}
                    <p className="text-[10px] text-faint">{formatRelative(r.created_at)}</p>
                    <p className="text-sm font-semibold text-text mt-1">
                      ★ {r.rating_global}/10
                      {r.status === 'pending' ? (
                        <span className="tag tag-gold ml-2 text-[10px]">En revisión</span>
                      ) : null}
                      {r.is_spoiler ? <span className="tag tag-gold ml-2 text-[10px]">Spoiler</span> : null}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={!loggedIn || voting === r.id || r.status === 'pending'}
                    onClick={() => vote(r.id, 'up')}
                    className={`review-vote-btn${r.user_vote === 'up' ? ' is-active' : ''}`}
                    title="Útil"
                  >
                    ↑ {r.up_count}
                  </button>
                  <button
                    type="button"
                    disabled={!loggedIn || voting === r.id || r.status === 'pending'}
                    onClick={() => vote(r.id, 'down')}
                    className={`review-vote-btn${r.user_vote === 'down' ? ' is-active' : ''}`}
                    title="No útil"
                  >
                    ↓ {r.down_count}
                  </button>
                  {score !== 0 && (
                    <span className="text-xs text-faint ml-1">
                      ({score > 0 ? '+' : ''}
                      {score})
                    </span>
                  )}
                </div>
              </div>

              {metricEntries.length > 0 && (
                <dl className="flex flex-wrap gap-2 mb-3">
                  {metricEntries.map(([key, val]) => (
                    <span key={key} className="tag text-[10px]">
                      {metricLabels[key] || key}: {val}
                    </span>
                  ))}
                </dl>
              )}

              <SpoilerText isSpoiler={r.is_spoiler}>{r.comment}</SpoilerText>
            </li>
          )
        })}
      </ul>

      {published.length > 0 ? (
        <p className="text-[10px] text-faint text-center">{published.length} reseña{published.length !== 1 ? 's' : ''} publicada{published.length !== 1 ? 's' : ''}</p>
      ) : null}
    </div>
  )
}
