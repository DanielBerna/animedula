import AdminNav from '../../../components/AdminNav'
import AdminUgcReviewCard from '../../../components/AdminUgcReviewCard'
import PageHeader from '../../../components/PageHeader'
import { listPendingUgcReviews } from '../../../lib/social/ugc-moderation'
import { isSupabaseAuthConfigured } from '../../../lib/supabase/server'

export default async function AdminUgcPage() {
  const pending = isSupabaseAuthConfigured() ? await listPendingUgcReviews() : []

  return (
    <div className="section-anime space-y-8">
      <PageHeader
        variant="default"
        eyebrow="Admin"
        title="Reseñas de usuarios"
        description="Aprueba o rechaza reseñas UGC antes de que se vean en las fichas"
      />

      <AdminNav active="/admin/ugc" />

      <section>
        <div className="section-head">
          <h2 className="font-display text-lg font-semibold text-text">Cola pendiente</h2>
          <span className="tag tag-accent">{pending.length}</span>
        </div>

        {pending.length === 0 ? (
          <p className="text-sm text-muted">
            No hay reseñas pendientes. Cuando un usuario publique una reseña, aparecerá aquí.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pending.map((review) => (
              <AdminUgcReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
