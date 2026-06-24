'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '../ToastProvider'
import type { EditorialReview } from '../../lib/editorial/types'

const VEREDICTOS: EditorialReview['veredicto'][] = [
  'Recomendado',
  'Con reservas',
  'Solo para fans del género',
]

type Props = {
  reviewId: string
}

export default function AdminEditorialEditor({ reviewId }: Props) {
  const { showToast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [meta, setMeta] = useState<{ kind: string; mal_id: number; status: string } | null>(null)
  const [review, setReview] = useState<EditorialReview | null>(null)

  useEffect(() => {
    fetch(`/api/admin/editorial?id=${encodeURIComponent(reviewId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.review) {
          setReview(data.review)
          setMeta({ kind: data.kind, mal_id: data.mal_id, status: data.status })
        }
      })
      .finally(() => setLoading(false))
  }, [reviewId])

  const save = async (publish: boolean) => {
    if (!review) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/editorial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_id: reviewId, review, publish }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast({ title: publish ? 'Publicada' : 'Guardada', description: 'Reseña editorial actualizada' })
      router.push('/admin/resenas?tab=published')
    } catch (err: unknown) {
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo guardar',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-muted">Cargando reseña…</p>
  if (!review) return <p className="text-sm text-sakura">Reseña no encontrada.</p>

  const field = (key: keyof EditorialReview, label: string, rows = 3) => (
    <div>
      <label className="eyebrow block mb-1">{label}</label>
      <textarea
        className="input w-full text-sm"
        rows={rows}
        value={review[key] as string}
        onChange={(e) => setReview({ ...review, [key]: e.target.value })}
      />
    </div>
  )

  return (
    <div className="card-glass p-6 space-y-4 max-w-3xl">
      <div>
        <h2 className="font-display font-semibold text-text">Editar reseña editorial</h2>
        {meta ? (
          <p className="text-xs text-faint mt-1">
            {meta.kind} · MAL #{meta.mal_id} · {meta.status}
          </p>
        ) : null}
      </div>
      {field('gancho', 'Gancho', 2)}
      {field('por_que', 'Por qué verlo', 4)}
      {field('para_quien', 'Para quién', 2)}
      {field('no_para', 'No para', 2)}
      {field('contexto_mx', 'Contexto MX', 3)}
      <div>
        <label className="eyebrow block mb-1">Veredicto</label>
        <select
          className="input w-full text-sm"
          value={review.veredicto}
          onChange={(e) =>
            setReview({ ...review, veredicto: e.target.value as EditorialReview['veredicto'] })
          }
        >
          {VEREDICTOS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-2 pt-2">
        <button type="button" disabled={saving} className="btn-primary text-xs" onClick={() => save(false)}>
          Guardar borrador
        </button>
        <button type="button" disabled={saving} className="btn-ghost text-xs" onClick={() => save(true)}>
          Guardar y publicar
        </button>
      </div>
    </div>
  )
}
