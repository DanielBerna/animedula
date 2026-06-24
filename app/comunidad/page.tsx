import Link from 'next/link'
import PageHeader from '../../components/PageHeader'
import ForumThread from '../../components/ForumThread'
import ProfileStatusForm from '../../components/ProfileStatusForm'
import SocialActivityFeed from '../../components/SocialActivityFeed'
import CommunityHub from '../../components/CommunityHub'
import { getAuthUser } from '../../lib/auth'

export default async function ComunidadPage() {
  const user = await getAuthUser()

  return (
    <div className="space-y-10 enter-up">
      <PageHeader
        variant="default"
        eyebrow="Comunidad"
        title="Foro Animédula"
        description="Hilos, perfiles, amistades, mensajes y recompensas diarias"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          {user ? (
            <div className="card-glass p-6">
              <h2 className="font-display font-semibold text-text mb-1">Tu presencia</h2>
              <p className="text-xs text-muted mb-4">Estado visible en hilos y perfiles públicos</p>
              <ProfileStatusForm />
            </div>
          ) : (
            <div className="card-glass p-6">
              <p className="text-muted">
                <Link href="/login?next=/comunidad" className="text-accent hover:underline">
                  Inicia sesión
                </Link>{' '}
                para publicar, seguir fans, enviar solicitudes de amistad y chatear.
              </p>
            </div>
          )}

          <ForumThread loggedIn={Boolean(user)} returnTo="/comunidad" />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24">
          <div className="card-glass p-6">
            <h2 className="font-display font-semibold text-text mb-1">Tu feed social</h2>
            <p className="text-xs text-muted mb-4">Actividad de quien sigues</p>
            {user ? <SocialActivityFeed /> : (
              <p className="text-sm text-muted">
                <Link href="/login?next=/comunidad" className="text-accent hover:underline">Entra</Link> para ver el feed.
              </p>
            )}
          </div>

          {user ? (
            <div className="card-glass p-6">
              <CommunityHub userId={user.id} />
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
