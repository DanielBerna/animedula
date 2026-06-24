import AdminNav from '../../../components/AdminNav'
import AdminSubmissionCard from '../../../components/AdminSubmissionCard'
import PageHeader from '../../../components/PageHeader'
import { listPendingSubmissions } from '../../../lib/editorial/submissions'
import { isSupabaseAuthConfigured } from '../../../lib/supabase/server'

export default async function AdminAportesPage() {
  const pending = isSupabaseAuthConfigured() ? await listPendingSubmissions() : []

  return (
    <div className="section-anime space-y-8">
      <PageHeader
        variant="default"
        eyebrow="Admin"
        title="Aportes editoriales"
        description="Mejoras de texto enviadas por la comunidad para reseñas"
      />

      <AdminNav active="/admin/aportes" />

      <section>
        <div className="section-head">
          <h2 className="font-display text-lg font-semibold text-text">Cola pendiente</h2>
          <span className="tag tag-accent">{pending.length}</span>
        </div>

        {pending.length === 0 ? (
          <p className="text-sm text-muted">No hay aportes pendientes.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pending.map((item) => (
              <AdminSubmissionCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
