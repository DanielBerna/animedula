'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Review = {
  id: number
  content_type: string
  content_id: string
  rating_global: number
  comment: string
  status: string
  created_at: string
}

type Thread = {
  id: number
  title: string
  reply_count: number
  content_type: string | null
  content_id: string | null
  tags: string[] | null
  created_at: string
}

const CONTENT_BASES: Record<string, string> = {
  anime: '/anime',
  manga: '/mangas',
  game: '/videojuegos',
  movie: '/cine',
}

function contentHref(type?: string | null, id?: string | null): string {
  if (!type || !id) return '/comunidad'
  return `${CONTENT_BASES[type] || '/explorar'}/${id}`
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  published: { label: 'Publicada', cls: 'tag-accent' },
  pending: { label: 'En revisión', cls: 'tag-gold' },
  rejected: { label: 'Rechazada', cls: '' },
}

export default function ProfileActivity() {
  const [tab, setTab] = useState<'reviews' | 'threads'>('reviews')
  const [reviews, setReviews] = useState<Review[]>([])
  const [threads, setThreads] = useState<Thread[]>([])
  const [commentCount, setCommentCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/me/activity', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        setReviews(d.reviews || [])
        setThreads(d.threads || [])
        setCommentCount(d.comment_count || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-display font-semibold text-text">Mi actividad</h3>
        <span className="text-xs text-faint">{commentCount} comentarios · {reviews.length} reseñas · {threads.length} hilos</span>
      </div>

      <div className="lib-tabs">
        <button type="button" className={`lib-tab${tab === 'reviews' ? ' is-active' : ''}`} onClick={() => setTab('reviews')}>
          Mis reseñas <span className="lib-tab-count">{reviews.length}</span>
        </button>
        <button type="button" className={`lib-tab${tab === 'threads' ? ' is-active' : ''}`} onClick={() => setTab('threads')}>
          Mis hilos <span className="lib-tab-count">{threads.length}</span>
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Cargando tu actividad…</p>
      ) : tab === 'reviews' ? (
        reviews.length === 0 ? (
          <p className="text-sm text-muted">Aún no has publicado reseñas. Reseña un anime o manga para ganar MéduCoins.</p>
        ) : (
          <ul className="space-y-2">
            {reviews.map((r) => {
              const st = STATUS_LABEL[r.status] || { label: r.status, cls: '' }
              return (
                <li key={r.id}>
                  <Link
                    href={contentHref(r.content_type, r.content_id)}
                    className="activity-item"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="activity-item-title">★ {r.rating_global}/10 · {r.comment.slice(0, 80)}</p>
                      <p className="activity-item-meta">{new Date(r.created_at).toLocaleDateString('es-MX')}</p>
                    </div>
                    <span className={`tag ${st.cls} text-[10px] shrink-0`}>{st.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )
      ) : threads.length === 0 ? (
        <p className="text-sm text-muted">Aún no has abierto hilos en el foro.</p>
      ) : (
        <ul className="space-y-2">
          {threads.map((t) => (
            <li key={t.id}>
              <Link href={contentHref(t.content_type, t.content_id)} className="activity-item">
                <div className="min-w-0 flex-1">
                  <p className="activity-item-title">{t.title}</p>
                  <p className="activity-item-meta">{new Date(t.created_at).toLocaleDateString('es-MX')}</p>
                </div>
                <span className="tag text-[10px] shrink-0">
                  💬 {t.reply_count} {t.reply_count === 1 ? 'respuesta' : 'respuestas'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
