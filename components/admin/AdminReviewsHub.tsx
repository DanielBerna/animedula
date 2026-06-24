'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import AdminDraftCard from '../AdminDraftCard'
import AdminEditorialEditor from './AdminEditorialEditor'
import AdminUgcReviewCard from '../AdminUgcReviewCard'
import AdminUgcEditor from './AdminUgcEditor'
import type { ModerationItem } from '../../lib/editorial/db'
import type { UgcReviewItem } from '../../lib/social/ugc-moderation'

type Props = {
  editorialPending: ModerationItem[]
  editorialPublished: ModerationItem[]
  ugcPending: UgcReviewItem[]
  ugcPublished: UgcReviewItem[]
  editEditorialId: string | null
}

const TABS = [
  { id: 'editorial', label: 'Editorial pendiente' },
  { id: 'ugc', label: 'Usuarios pendiente' },
  { id: 'published', label: 'Publicadas' },
] as const

export default function AdminReviewsHub({
  editorialPending,
  editorialPublished,
  ugcPending,
  ugcPublished,
  editEditorialId,
}: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tab = (searchParams.get('tab') as typeof TABS[number]['id']) || 'editorial'
  const editUgc = searchParams.get('edit_ugc')

  const [ugcEditId, setUgcEditId] = useState<number | null>(
    editUgc ? Number(editUgc) : null,
  )

  const setTab = (id: string) => {
    router.push(`/admin/resenas?tab=${id}`)
  }

  if (editEditorialId) {
    return (
      <div className="admin-page space-y-6">
        <Link href="/admin/resenas?tab=published" className="text-xs text-accent hover:underline">
          ← Volver a reseñas
        </Link>
        <AdminEditorialEditor reviewId={editEditorialId} />
      </div>
    )
  }

  const ugcItem = ugcEditId
    ? [...ugcPending, ...ugcPublished].find((r) => r.id === ugcEditId)
    : null

  if (ugcItem) {
    return (
      <div className="admin-page space-y-6">
        <button
          type="button"
          className="text-xs text-accent hover:underline"
          onClick={() => setUgcEditId(null)}
        >
          ← Volver
        </button>
        <AdminUgcEditor review={ugcItem} onDone={() => setUgcEditId(null)} />
      </div>
    )
  }

  return (
    <div className="admin-page space-y-6">
      <header>
        <p className="eyebrow mb-1">Contenido</p>
        <h1 className="page-title">Reseñas</h1>
        <p className="text-sm text-muted mt-2">
          Aprueba, rechaza o edita reseñas editoriales y de usuarios. Sin costo de IA al editar manualmente.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`btn-ghost text-xs${tab === t.id ? ' border-accent text-accent' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'editorial' && (
        <section>
          {editorialPending.length === 0 ? (
            <p className="text-sm text-muted card-glass p-5">No hay borradores pendientes.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {editorialPending.map((item) => (
                <div key={item.id} className="space-y-2">
                  <AdminDraftCard
                    title={item.title || `MAL #${item.mal_id}`}
                    review_id={item.id}
                    kind={item.kind}
                    mal_id={item.mal_id}
                    resumen={item.gancho}
                    status={item.status}
                  />
                  <Link
                    href={`/admin/resenas?edit=${item.id}`}
                    className="text-xs text-accent hover:underline block text-center"
                  >
                    Editar antes de publicar
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'ugc' && (
        <section>
          {ugcPending.length === 0 ? (
            <p className="text-sm text-muted card-glass p-5">No hay reseñas de usuarios pendientes.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {ugcPending.map((review) => (
                <div key={review.id} className="space-y-2">
                  <AdminUgcReviewCard review={review} />
                  <button
                    type="button"
                    className="text-xs text-accent hover:underline w-full text-center"
                    onClick={() => setUgcEditId(review.id)}
                  >
                    Editar texto
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'published' && (
        <section className="space-y-6">
          <div>
            <h2 className="font-display font-semibold text-text mb-3">Editorial publicadas</h2>
            <ul className="space-y-2">
              {editorialPublished.map((item) => (
                <li key={item.id} className="card-glass p-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm text-text">
                      {item.title || `${item.kind} #${item.mal_id}`}
                    </p>
                    <p className="text-xs text-muted line-clamp-1">{item.gancho}</p>
                  </div>
                  <Link href={`/admin/resenas?edit=${item.id}`} className="btn-ghost text-xs">
                    Editar
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-display font-semibold text-text mb-3">UGC publicadas (editar)</h2>
            <ul className="space-y-2">
              {ugcPublished.slice(0, 20).map((r) => (
                <li key={r.id} className="card-glass p-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm text-text">
                      ★ {r.rating_global}/10 · {r.content_type} #{r.content_id}
                    </p>
                    <p className="text-xs text-muted line-clamp-1">{r.comment}</p>
                  </div>
                  <button type="button" className="btn-ghost text-xs" onClick={() => setUgcEditId(r.id)}>
                    Editar
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  )
}
