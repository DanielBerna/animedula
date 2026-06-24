import Link from 'next/link'
import { listEditorialCalendar } from '../../../lib/editorial/db'
import {
  calendarStatus,
  formatScheduleDate,
  seasonDateRange,
  STATUS_LABELS,
} from '../../../lib/editorial/schedule'
import { isSupabaseAuthConfigured } from '../../../lib/supabase/server'

function fichaHref(kind: string, malId: number) {
  return kind === 'manga' ? `/mangas/${malId}` : `/anime/${malId}`
}

export default async function AdminCalendarioPage() {
  const items = isSupabaseAuthConfigured() ? await listEditorialCalendar() : []
  const season = seasonDateRange()

  const scheduled = items.filter((i) => i.scheduled_publish_at)
  const published = items.filter((i) => i.status === 'published')
  const pending = items.filter((i) => i.status === 'pending' || i.status === 'draft')

  return (
    <div className="admin-page space-y-8">
      <header>
        <p className="eyebrow mb-1">Contenido</p>
        <h1 className="page-title">Calendario editorial</h1>
        <p className="text-sm text-muted mt-2">
          Temporada actual: {season.label}. Las reseñas rotan cada 2 días.
        </p>
      </header>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <p className="admin-stat-value">{scheduled.length}</p>
          <p className="admin-stat-label">Programadas</p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-value">{pending.length}</p>
          <p className="admin-stat-label">Por revisar</p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-value">{published.length}</p>
          <p className="admin-stat-label">Publicadas</p>
        </div>
      </div>

      <section className="card-glass p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-text">Cron automático</h2>
        <ul className="text-sm text-muted space-y-2 list-disc pl-5">
          <li>
            <strong className="text-text">Generar borradores:</strong> lunes 6:00 →{' '}
            <code className="text-xs">/api/cron/generate-reviews</code>
          </li>
          <li>
            <strong className="text-text">Publicar programadas:</strong> diario 8:00 →{' '}
            <code className="text-xs">/api/cron/publish-scheduled</code>
          </li>
          <li>
            Variable <code className="text-xs">CRON_SECRET</code> en Vercel (ver{' '}
            <code className="text-xs">docs/CRON-Y-CALENDARIO.md</code>)
          </li>
        </ul>
      </section>

      <section className="card-glass p-6">
        <h2 className="font-display text-lg font-bold text-text mb-4">Línea de tiempo</h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted">
            No hay reseñas en Supabase. Ejecuta el cron de generación o aprueba borradores en{' '}
            <Link href="/admin" className="text-accent hover:underline">
              Moderación
            </Link>
            .
          </p>
        ) : (
          <ul className="admin-calendar-list">
            {items.map((item) => {
              const st = calendarStatus(item.status, item.scheduled_publish_at)
              const title =
                item.display_title ||
                item.title ||
                `${item.kind === 'manga' ? 'Manga' : 'Anime'} #${item.mal_id}`
              return (
                <li key={item.id} className={`admin-calendar-row status-${st}`}>
                  <div className="admin-calendar-date">
                    <time dateTime={item.scheduled_publish_at || item.published_at || item.updated_at}>
                      {item.status === 'published' && item.published_at
                        ? formatScheduleDate(item.published_at)
                        : formatScheduleDate(item.scheduled_publish_at)}
                    </time>
                    {item.season_key ? (
                      <span className="text-[10px] text-faint font-mono">{item.season_key}</span>
                    ) : null}
                  </div>
                  <div className="admin-calendar-body min-w-0">
                    <p className="font-semibold text-sm text-text truncate">{title}</p>
                    <p className="text-xs text-muted line-clamp-1">{item.gancho}</p>
                    <span className={`admin-calendar-badge badge-${st}`}>{STATUS_LABELS[st]}</span>
                  </div>
                  <Link href={fichaHref(item.kind, item.mal_id)} className="btn-ghost text-xs shrink-0">
                    Ficha →
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
