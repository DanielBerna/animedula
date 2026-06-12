import Link from 'next/link'
import PageHeader from '../../components/PageHeader'
import { getAuthUser, getProfile, isEditorRole } from '../../lib/auth'
import { NAV } from '../../lib/copy'

const FEATURES = [
  {
    title: 'Comentarios en fichas',
    body: 'Opina en cada anime o manga sin spoilers gordos. Visible para todos.',
    href: '/explorar',
    cta: 'Ver fichas',
  },
  {
    title: 'Aportes de redacción',
    body: 'Propón mejoras a gancho, por qué vale la pena o tips prácticos.',
    href: '/explorar',
    cta: 'Abrir una ficha',
  },
  {
    title: 'Reseñas validadas',
    body: 'El equipo publica opiniones editoriales tras revisar borradores.',
    href: '/admin',
    cta: 'Panel admin',
    staff: true,
  },
  {
    title: 'Temporadas',
    body: 'Estrenos, series en emisión y archivo por año y estación.',
    href: '/calendario',
    cta: 'Ver temporadas',
  },
]

export default async function ComunidadPage() {
  const user = await getAuthUser()
  const profile = user ? await getProfile() : null
  const features = FEATURES.filter((f) => !f.staff || isEditorRole(profile?.role))

  return (
    <div className="space-y-10 enter-up">
      <PageHeader variant="default" eyebrow="Comunidad" title="Participa" />

      <div className="card-glass p-6 md:p-8">
        {user ? (
          <p className="text-muted">
            Sesión activa. Entra a cualquier ficha de {NAV.explore.toLowerCase()} o {NAV.manga.toLowerCase()} para comentar o enviar aportes.
          </p>
        ) : (
          <p className="text-muted">
            <Link href="/login?next=/comunidad" className="text-accent hover:underline">Inicia sesión</Link>{' '}
            para comentar y proponer textos a las reseñas.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {features.map((f) => (
          <article key={f.title} className="card-glass p-5 flex flex-col">
            <h2 className="font-display font-semibold text-text">{f.title}</h2>
            <p className="text-sm text-muted mt-2 flex-1 leading-relaxed">{f.body}</p>
            <Link href={f.href} className="mt-4 text-sm text-accent hover:underline">
              {f.cta} →
            </Link>
          </article>
        ))}
      </div>
    </div>
  )
}
