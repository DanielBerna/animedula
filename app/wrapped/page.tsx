import Link from 'next/link'
import { redirect } from 'next/navigation'
import PageHeader from '../../components/PageHeader'
import { getAuthUser } from '../../lib/auth'
import { getWrappedStats } from '../../lib/community/feed'

export default async function WrappedPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login?next=/wrapped')

  const stats = await getWrappedStats(user.id)

  if (!stats) {
    return (
      <div className="enter-up">
        <PageHeader variant="default" eyebrow="Wrapped" title="Tu temporada" />
        <p className="text-muted">Configura Supabase para ver tus estadísticas.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 enter-up max-w-lg mx-auto">
      <PageHeader variant="default" eyebrow="Wrapped" title={`Temporada ${stats.seasonLabel}`} />

      <div className="wrapped-card card-glass p-8 text-center space-y-6">
        <p className="eyebrow">Tu resumen Animédula</p>

        <div className="grid grid-cols-2 gap-4">
          <div className="wrapped-stat">
            <p className="wrapped-stat-value">{stats.completed}</p>
            <p className="wrapped-stat-label">Completados</p>
          </div>
          <div className="wrapped-stat">
            <p className="wrapped-stat-value">{stats.reviews}</p>
            <p className="wrapped-stat-label">Reseñas</p>
          </div>
          <div className="wrapped-stat">
            <p className="wrapped-stat-value">{stats.comments}</p>
            <p className="wrapped-stat-label">Comentarios</p>
          </div>
          <div className="wrapped-stat">
            <p className="wrapped-stat-value">Nv. {stats.level}</p>
            <p className="wrapped-stat-label">{stats.xp} XP</p>
          </div>
        </div>

        {stats.topTitles.length > 0 && (
          <div className="text-left">
            <p className="text-xs text-faint uppercase tracking-wide mb-2">Lo que terminaste</p>
            <ul className="space-y-2">
              {stats.topTitles.map((t, i) => (
                <li key={i} className="text-sm text-text flex items-center gap-2">
                  <span className="tag text-[10px]">{t.content_type}</span>
                  {t.title}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-xs text-faint">
          Captura esta pantalla y compártela en tus historias. #AnimédulaWrapped
        </p>
      </div>

      <p className="text-center text-sm text-muted">
        <Link href="/perfil" className="text-accent hover:underline">← Volver a mi perfil</Link>
      </p>
    </div>
  )
}
