'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type ActivityItem = {
  id: string
  type: 'review' | 'forum' | 'list'
  title: string
  excerpt: string
  href: string
  author: string
  authorUsername: string | null
  created_at: string
}

const TYPE_LABEL: Record<ActivityItem['type'], string> = {
  review: 'Reseña',
  forum: 'Foro',
  list: 'Lista',
}

export default function SocialActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/social/feed')
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Error')
        setItems(data.items || [])
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'No se pudo cargar')
        setItems([])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-muted">Cargando actividad…</p>

  if (error === 'Inicia sesión') {
    return (
      <p className="text-sm text-muted">
        <Link href="/login?next=/comunidad" className="text-accent hover:underline">
          Inicia sesión
        </Link>{' '}
        para ver la actividad de quien sigues.
      </p>
    )
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted">
        Sigue a otros fans desde su perfil público (<code className="text-xs">/u/usuario</code>) para ver aquí sus
        reseñas, hilos y listas.
      </p>
    )
  }

  return (
    <ul className="social-activity-list space-y-3">
      {items.map((item) => (
        <li key={item.id} className="social-activity-item rounded-lg border border-white/6 bg-surface-3/40 p-4">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="tag tag-accent text-[10px]">{TYPE_LABEL[item.type]}</span>
            {item.authorUsername ? (
              <Link href={`/u/${item.authorUsername}`} className="text-xs text-accent hover:underline">
                {item.author}
              </Link>
            ) : (
              <span className="text-xs text-faint">{item.author}</span>
            )}
            <time className="text-xs text-faint ml-auto">
              {new Date(item.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
            </time>
          </div>
          <Link href={item.href} className="block group">
            <p className="text-sm font-semibold text-text group-hover:text-accent transition">{item.title}</p>
            {item.excerpt ? <p className="text-xs text-muted mt-1 line-clamp-2">{item.excerpt}</p> : null}
          </Link>
        </li>
      ))}
    </ul>
  )
}
