'use client'

import React from 'react'
import Link from 'next/link'
import { useToast } from './ToastProvider'
import type { UgcReviewItem } from '../lib/social/ugc-moderation'

const TYPE_BASE: Record<string, string> = {
  anime: '/anime',
  manga: '/mangas',
  game: '/videojuegos',
  movie: '/cine',
}

type Props = {
  review: UgcReviewItem
}

export default function AdminUgcReviewCard({ review }: Props) {
  const { showToast } = useToast()
  const href = `${TYPE_BASE[review.content_type] || '/explorar'}/${review.content_id}`

  const act = async (action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/admin/ugc/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_id: review.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'error')
      showToast({
        title: action === 'approve' ? 'Publicada' : 'Rechazada',
        description: `${review.content_type} #${review.content_id}`,
      })
      window.location.reload()
    } catch (err: unknown) {
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo moderar',
      })
    }
  }

  return (
    <article className="card-glass p-5 flex flex-col gap-4 min-h-[200px]">
      <div>
        <div className="flex flex-wrap gap-2 mb-2">
          <span className="tag tag-accent text-[10px]">Pendiente</span>
          <span className="tag tag-gold text-[10px]">{review.content_type}</span>
          {review.is_spoiler ? <span className="tag tag-gold text-[10px]">Spoiler</span> : null}
        </div>
        <p className="text-xs text-faint">
          {review.author_name}
          {review.author_username ? (
            <>
              {' '}
              ·{' '}
              <Link href={`/u/${review.author_username}`} className="text-accent hover:underline">
                @{review.author_username}
              </Link>
            </>
          ) : null}
        </p>
        <h4 className="font-display font-semibold text-text mt-1">
          ★ {review.rating_global}/10 ·{' '}
          <Link href={href} className="text-accent hover:underline">
            Ver ficha
          </Link>
        </h4>
        <p className="text-sm text-muted mt-2 leading-relaxed line-clamp-6">{review.comment}</p>
      </div>
      <div className="flex gap-2 mt-auto">
        <button type="button" onClick={() => act('approve')} className="btn-primary text-xs py-2 px-4 flex-1">
          Aprobar
        </button>
        <button
          type="button"
          onClick={() => act('reject')}
          className="btn-ghost text-xs py-2 px-4 text-sakura border-sakura/30 hover:border-sakura/50"
        >
          Rechazar
        </button>
      </div>
    </article>
  )
}
