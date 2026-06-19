import Link from 'next/link'
import { redirect } from 'next/navigation'
import PageHeader from '../../components/PageHeader'
import ProfileStatusForm from '../../components/ProfileStatusForm'
import UsernameForm from '../../components/UsernameForm'
import ProfilePrivacyForm from '../../components/ProfilePrivacyForm'
import DailyMissions from '../../components/DailyMissions'
import GamificationPanel from '../../components/GamificationPanel'
import { getAuthUser } from '../../lib/auth'
import { createClient, isSupabaseAuthConfigured } from '../../lib/supabase/server'

export default async function PerfilPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login?next=/perfil')

  let username: string | null = null
  let isPublic = true
  let listPublic = true
  let displayName = 'Mi perfil'

  if (isSupabaseAuthConfigured()) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('profiles')
      .select('username, display_name, is_public, list_public')
      .eq('id', user.id)
      .maybeSingle()
    username = data?.username || null
    displayName = data?.display_name || displayName
    isPublic = data?.is_public ?? true
    listPublic = data?.list_public ?? true
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://animedula.com'
  const shareUrl = username
    ? `${siteUrl}/u/${username}`
    : `${siteUrl}/api/og/profile?id=${user.id}`

  return (
    <div className="space-y-8 enter-up max-w-2xl">
      <PageHeader variant="default" eyebrow="Cuenta" title={displayName} />

      <div className="card-glass p-6 space-y-6">
        <UsernameForm initialUsername={username} />
        <ProfilePrivacyForm isPublic={isPublic} listPublic={listPublic} />
      </div>

      <div className="card-glass p-6">
        <ProfileStatusForm />
      </div>

      <div className="card-glass p-6">
        <DailyMissions />
      </div>

      <div className="card-glass p-6">
        <GamificationPanel />
      </div>

      <div className="card-glass p-6">
        <h3 className="font-display font-semibold text-text mb-2">Compartir perfil</h3>
        <p className="text-sm text-muted mb-3">
          Al compartir tu enlace, Discord y WhatsApp mostrarán tu nivel e insignias.
        </p>
        <code className="text-xs text-faint break-all block p-3 bg-surface-3 rounded-lg">{shareUrl}</code>
        {username ? (
          <Link href={`/u/${username}`} className="text-sm text-accent hover:underline mt-3 inline-block">
            Ver perfil público →
          </Link>
        ) : null}
      </div>

      <p className="text-sm text-muted flex flex-wrap gap-4">
        <Link href="/comunidad" className="text-accent hover:underline">Foro →</Link>
        <Link href="/wrapped" className="text-accent hover:underline">Mi Wrapped →</Link>
      </p>
    </div>
  )
}
