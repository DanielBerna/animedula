import { Suspense } from 'react'
import AdminReviewsHub from '../../../components/admin/AdminReviewsHub'
import { listModerationQueue, listPublishedEditorial } from '../../../lib/editorial/db'
import { listPendingUgcReviews, listUgcReviewsByStatus } from '../../../lib/social/ugc-moderation'
import { isSupabaseAuthConfigured } from '../../../lib/supabase/server'

type Props = { searchParams: Promise<{ tab?: string; edit?: string; edit_ugc?: string }> }

export default async function AdminResenasPage({ searchParams }: Props) {
  const params = await searchParams
  const editId = params.edit || null

  const [editorialPending, editorialPublished, ugcPending, ugcPublished] =
    isSupabaseAuthConfigured()
      ? await Promise.all([
          listModerationQueue(),
          listPublishedEditorial(30),
          listPendingUgcReviews(),
          listUgcReviewsByStatus('published', 30),
        ])
      : [[], [], [], []]

  return (
    <Suspense fallback={<p className="text-sm text-muted">Cargando…</p>}>
      <AdminReviewsHub
        editorialPending={editorialPending}
        editorialPublished={editorialPublished}
        ugcPending={ugcPending}
        ugcPublished={ugcPublished}
        editEditorialId={editId}
      />
    </Suspense>
  )
}
