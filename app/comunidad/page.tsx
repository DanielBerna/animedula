import Link from 'next/link'
import PageHeader from '../../components/PageHeader'
import ForumThread from '../../components/ForumThread'
import ProfileStatusForm from '../../components/ProfileStatusForm'
import SocialActivityFeed from '../../components/SocialActivityFeed'
import { getAuthUser } from '../../lib/auth'

export default async function ComunidadPage() {
  const user = await getAuthUser()

  return (
    <div className="space-y-10 enter-up">
      <PageHeader
        variant="default"
        eyebrow="Comunidad"
        title="Foro Animédula"
        description="Foro, perfiles públicos y actividad de quien sigues"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          {user ? (
            <div className="card-glass p-6">
              <h2 className="font-display font-semibold text-text mb-4">Tu presencia</h2>
              <ProfileStatusForm />
            </div>
          ) : (
            <div className="card-glass p-6">
              <p className="text-muted">
                <Link href="/login?next=/comunidad" className="text-accent hover:underline">
                  Inicia sesión
                </Link>{' '}
                para publicar hilos, reaccionar, seguir fans y configurar tu estado.
              </p>
            </div>
          )}

          <ForumThread loggedIn={Boolean(user)} returnTo="/comunidad" />
        </div>

        <aside className="card-glass p-6 lg:sticky lg:top-24">
          <h2 className="font-display font-semibold text-text mb-1">Tu feed social</h2>
          <p className="text-xs text-muted mb-4">Reseñas, hilos y listas de quien sigues</p>
          {user ? (
            <SocialActivityFeed />
          ) : (
            <p className="text-sm text-muted">
              <Link href="/login?next=/comunidad" className="text-accent hover:underline">
                Entra
              </Link>{' '}
              para armar tu red.
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}
