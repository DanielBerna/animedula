"use client"
import React from 'react'
import { useToast } from './ToastProvider'

type Props = {
  title: string
  review_id?: string
  kind?: 'anime' | 'manga'
  mal_id?: number
  resumen?: string
  badge?: string
  status?: string
}

export default function AdminDraftCard({ title, review_id, kind, mal_id, resumen, badge, status }: Props) {
  const { showToast } = useToast()

  const handleApprove = async () => {
    try {
      const res = await fetch('/api/admin/approve', {
        method: 'POST',
        body: JSON.stringify({ review_id, kind, mal_id, title }),
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'error')
      showToast({ title: 'Publicado', description: title })
    } catch (err: unknown) {
      showToast({ title: 'Error', description: err instanceof Error ? err.message : 'No se pudo aprobar' })
    }
  }

  const handleReject = async () => {
    if (!review_id) {
      showToast({ title: 'Info', description: 'Genera un borrador en Supabase primero' })
      return
    }
    try {
      const res = await fetch('/api/admin/reject', {
        method: 'POST',
        body: JSON.stringify({ review_id }),
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'error')
      showToast({ title: 'Rechazado', description: title })
    } catch (err: unknown) {
      showToast({ title: 'Error', description: err instanceof Error ? err.message : 'No se pudo rechazar' })
    }
  }

  return (
    <article className="card-glass p-5 flex flex-col justify-between min-h-[180px]">
      <div>
        <div className="flex gap-2 mb-2 flex-wrap">
          <span className="tag tag-accent text-[10px]">{status || 'Borrador'}</span>
          {kind && <span className="tag tag-gold text-[10px]">{kind}</span>}
          {badge && <span className="tag tag-gold text-[10px]">{badge}</span>}
        </div>
        <h4 className="font-display font-semibold text-text">{title}</h4>
        {mal_id && <p className="text-xs text-faint mt-1">MAL #{mal_id}</p>}
        <p className="text-sm text-muted mt-2 leading-relaxed">{resumen}</p>
      </div>
      <div className="mt-5 flex gap-2">
        <button onClick={handleApprove} className="btn-primary text-xs py-2 px-4 flex-1">Publicar</button>
        <button onClick={handleReject} className="btn-ghost text-xs py-2 px-4 text-sakura border-sakura/30 hover:border-sakura/50">Rechazar</button>
      </div>
    </article>
  )
}
