'use client'

import { useCallback, useEffect, useState } from 'react'
import SpoilerText from './SpoilerText'
import { ContentType, getReviewMetrics } from '../lib/community/review-metrics'

export type UserReview = {
  id: number
  rating_global: number
  metrics_json: Record<string, number> | null
  comment: string
  is_spoiler: boolean
  created_at: string
  user_id: string
  profiles?: { display_name: string | null } | null
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

export default function UserReviewList({ contentType, contentId, loggedIn, refreshKey = 0 }: Props) {
  const [reviews, setReviews] = useState<UserReview[]>([])
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState<number | null>(null)
  const metricLabels = Object.fromEntries(getReviewMetrics(contentType).map((m) => [m.key, m.label]))

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/user-reviews?content_type=${encodeURIComponent(contentType)}&content_id=${encodeURIComponent(contentId)}`,
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

  if (loading) return <p className="text-sm text-muted">Cargando reseñas…</p>
  if (reviews.length === 0) {
    return <p className="text-sm text-muted">Aún no hay reseñas de usuarios. Sé el primero.</p>
  }

  return (
    <ul className="space-y-4">
      {reviews.map((r) => {
        const score = r.up_count - r.down_count
        const metrics = r.metrics_json || {}
        const metricEntries = Object.entries(metrics).filter(([, v]) => typeof v === 'number')

        return (
          <li key={r.id} className="user-review-card rounded-lg border border-white/6 bg-surface-3/50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
              <div>
                <p className="text-xs text-faint">
                  {r.profiles?.display_name || 'Fan'} ·{' '}
                  {new Date(r.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <p className="text-sm font-semibold text-text mt-0.5">
                  ★ {r.rating_global}/10
                  {r.is_spoiler ? <span className="tag tag-gold ml-2 text-[10px]">Spoiler</span> : null}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={!loggedIn || voting === r.id}
                  onClick={() => vote(r.id, 'up')}
                  className={`review-vote-btn${r.user_vote === 'up' ? ' is-active' : ''}`}
                  title="Útil"
                >
                  ↑ {r.up_count}
                </button>
                <button
                  type="button"
                  disabled={!loggedIn || voting === r.id}
                  onClick={() => vote(r.id, 'down')}
                  className={`review-vote-btn${r.user_vote === 'down' ? ' is-active' : ''}`}
                  title="No útil"
                >
                  ↓ {r.down_count}
                </button>
                {score !== 0 && (
                  <span className="text-xs text-faint ml-1">({score > 0 ? '+' : ''}{score})</span>
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
  )
}
