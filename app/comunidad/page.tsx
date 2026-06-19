import Link from 'next/link'
import { redirect } from 'next/navigation'
import PageHeader from '../../components/PageHeader'
import ForumThread from '../../components/ForumThread'
import ProfileStatusForm from '../../components/ProfileStatusForm'
import { getAuthUser } from '../../lib/auth'

export default async function ComunidadPage() {
  const user = await getAuthUser()

  return (
    <div className="space-y-10 enter-up">
      <PageHeader variant="default" eyebrow="Comunidad" title="Foro Animédula" />

      {user ? (
        <div className="card-glass p-6">
          <h2 className="font-display font-semibold text-text mb-4">Tu presencia</h2>
          <ProfileStatusForm />
        </div>
      ) : (
        <div className="card-glass p-6">
          <p className="text-muted">
            <Link href="/login?next=/comunidad" className="text-accent hover:underline">Inicia sesión</Link>{' '}
            para publicar hilos, reaccionar y configurar tu estado.
          </p>
        </div>
      )}

      <ForumThread loggedIn={Boolean(user)} returnTo="/comunidad" />
    </div>
  )
}
