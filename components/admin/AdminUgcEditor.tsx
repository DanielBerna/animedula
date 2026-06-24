'use client'

import { useState } from 'react'
import { useToast } from '../ToastProvider'
import type { UgcReviewItem } from '../../lib/social/ugc-moderation'

type Props = {
  review: UgcReviewItem
  onDone: () => void
}

export default function AdminUgcEditor({ review, onDone }: Props) {
  const { showToast } = useToast()
  const [comment, setComment] = useState(review.comment)
  const [rating, setRating] = useState(review.rating_global)
  const [spoiler, setSpoiler] = useState(review.is_spoiler)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/ugc/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review_id: review.id,
          comment,
          rating_global: rating,
          is_spoiler: spoiler,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast({ title: 'Guardada', description: 'Reseña de usuario actualizada' })
      onDone()
    } catch (err: unknown) {
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo guardar',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card-glass p-6 space-y-4 max-w-2xl">
      <h2 className="font-display font-semibold text-text">Editar reseña de usuario</h2>
      <p className="text-xs text-muted">
        {review.author_name} · {review.content_type} #{review.content_id}
      </p>
      <div>
        <label className="eyebrow block mb-1">Puntuación (1-10)</label>
        <input
          type="number"
          min={1}
          max={10}
          className="input w-24 text-sm"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
        />
      </div>
      <div>
        <label className="eyebrow block mb-1">Comentario</label>
        <textarea
          className="input w-full text-sm"
          rows={8}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={spoiler} onChange={(e) => setSpoiler(e.target.checked)} />
        Contiene spoilers
      </label>
      <button type="button" disabled={saving} className="btn-primary text-xs" onClick={save}>
        {saving ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </div>
  )
}
