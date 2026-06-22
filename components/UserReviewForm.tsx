'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ContentType, getReviewMetrics } from '../lib/community/review-metrics'

type Props = {
  contentType: ContentType
  contentId: string
  loggedIn: boolean
  returnTo: string
  onSubmitted?: () => void
}

export default function UserReviewForm({
  contentType,
  contentId,
  loggedIn,
  returnTo,
  onSubmitted,
}: Props) {
  const metrics = getReviewMetrics(contentType)
  const [rating, setRating] = useState(8)
  const [metricValues, setMetricValues] = useState<Record<string, number>>({})
  const [comment, setComment] = useState('')
  const [isSpoiler, setIsSpoiler] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!loggedIn) {
    return (
      <p className="text-sm text-muted">
        <Link href={`/login?next=${encodeURIComponent(returnTo)}`} className="text-accent hover:underline">
          Inicia sesión
        </Link>{' '}
        para publicar tu reseña.
      </p>
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (comment.trim().length < 20) {
      setError('La reseña debe tener al menos 20 caracteres.')
      return
    }
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/user-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: contentType,
          content_id: contentId,
          rating_global: rating,
          metrics_json: metricValues,
          comment: comment.trim(),
          is_spoiler: isSpoiler,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo publicar')
      setSuccess(true)
      setComment('')
      setIsSpoiler(false)
      onSubmitted?.()
      fetch('/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mission_key: 'review' }),
      }).catch(() => {})
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al publicar')
    } finally {
      setSending(false)
    }
  }

  if (success) {
    return (
      <p className="text-sm text-muted">
        Reseña enviada a moderación. Te avisaremos cuando esté publicada (suele ser en pocas horas).
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="user-review-form space-y-4">
      <div>
        <label className="text-xs text-faint uppercase tracking-wide">Nota global</label>
        <div className="flex items-center gap-3 mt-1">
          <input
            type="range"
            min={1}
            max={10}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="flex-1 accent-[var(--accent)]"
          />
          <span className="score-badge text-sm">{rating}/10</span>
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-xs text-faint uppercase tracking-wide mb-1">Métricas (opcional)</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {metrics.map((m) => (
            <label key={m.key} className="flex items-center justify-between gap-2 text-sm text-muted">
              <span>{m.label}</span>
              <select
                value={metricValues[m.key] ?? ''}
                onChange={(e) => {
                  const v = e.target.value
                  setMetricValues((prev) => {
                    const next = { ...prev }
                    if (v === '') delete next[m.key]
                    else next[m.key] = Number(v)
                    return next
                  })
                }}
                className="bg-surface-3 border border-white/8 rounded px-2 py-1 text-xs text-text"
              >
                <option value="">—</option>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tu opinión honesta. Mínimo 20 caracteres."
          className="w-full p-3 bg-surface-3 border border-white/8 rounded-lg text-sm text-text min-h-[120px] focus:outline-none focus:border-accent/50"
          maxLength={4000}
        />
        <p className="text-xs text-faint mt-1">{comment.length}/4000</p>
      </div>

      <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
        <input
          type="checkbox"
          checked={isSpoiler}
          onChange={(e) => setIsSpoiler(e.target.checked)}
          className="rounded border-white/20"
        />
        Esta reseña contiene spoilers
      </label>

      {error && <p className="text-xs text-sakura">{error}</p>}

      <button type="submit" disabled={sending} className="btn-primary text-sm">
        {sending ? 'Enviando…' : 'Enviar reseña'}
      </button>
    </form>
  )
}
