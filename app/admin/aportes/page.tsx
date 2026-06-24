import AdminSubmissionCard from '../../../components/AdminSubmissionCard'
import { listPendingSubmissions } from '../../../lib/editorial/submissions'
import { isSupabaseAuthConfigured } from '../../../lib/supabase/server'

export default async function AdminAportesPage() {
  const pending = isSupabaseAuthConfigured() ? await listPendingSubmissions() : []

  return (
    <div className="admin-page space-y-8">
      <header>
        <p className="eyebrow mb-1">Contenido</p>
        <h1 className="page-title">Aportes editoriales</h1>
        <p className="text-sm text-muted mt-2">Mejoras de texto enviadas por la comunidad</p>
      </header>

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
