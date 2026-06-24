'use client'

import React from 'react'
import Link from 'next/link'
import { useToast } from './ToastProvider'
import type { SubmissionItem } from '../lib/editorial/submissions'

const FIELD_LABELS: Record<string, string> = {
  gancho: 'Gancho',
  por_que: 'Por qué verlo',
  para_quien: 'Para quién',
  no_para: 'No para',
  contexto_practico: 'Contexto',
  veredicto: 'Veredicto',
}

type Props = {
  item: SubmissionItem
}

export default function AdminSubmissionCard({ item }: Props) {
  const { showToast } = useToast()
  const href = item.kind === 'manga' ? `/mangas/${item.mal_id}` : `/anime/${item.mal_id}`

  const act = async (action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/admin/submissions/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'error')
      showToast({ title: action === 'approve' ? 'Aceptado' : 'Rechazado', description: FIELD_LABELS[item.field] || item.field })
      window.location.reload()
    } catch (err: unknown) {
      showToast({ title: 'Error', description: err instanceof Error ? err.message : 'No se pudo moderar' })
    }
  }

  return (
    <article className="card-glass p-5 flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <span className="tag tag-accent text-[10px]">Aporte</span>
        <span className="tag tag-gold text-[10px]">{item.kind}</span>
        <span className="tag text-[10px]">{FIELD_LABELS[item.field] || item.field}</span>
      </div>
      <p className="text-xs text-faint">
        {item.author_name}
        {item.author_username ? (
          <>
            {' '}
            · <Link href={`/u/${item.author_username}`} className="text-accent">@{item.author_username}</Link>
          </>
        ) : null}
      </p>
      <p className="text-sm text-muted leading-relaxed">{item.body}</p>
      <Link href={href} className="text-xs text-accent hover:underline">
        Ver ficha MAL #{item.mal_id} →
      </Link>
      <div className="flex gap-2 mt-auto">
        <button type="button" onClick={() => act('approve')} className="btn-primary text-xs py-2 px-4 flex-1">
          Aceptar
        </button>
        <button type="button" onClick={() => act('reject')} className="btn-ghost text-xs py-2 px-4 text-sakura border-sakura/30">
          Rechazar
        </button>
      </div>
    </article>
  )
}
