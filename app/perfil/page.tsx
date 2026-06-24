import { redirect } from 'next/navigation'
import ProfileAvatarUpload from '../../components/profile/ProfileAvatarUpload'
import ProfileProjectsEditor from '../../components/profile/ProfileProjectsEditor'
import ProfileShowcaseEditor from '../../components/profile/ProfileShowcaseEditor'
import ProfileStatusForm from '../../components/ProfileStatusForm'
import UsernameForm from '../../components/UsernameForm'
import ProfilePrivacyForm from '../../components/ProfilePrivacyForm'
import DailyMissions from '../../components/DailyMissions'
import GamificationPanel from '../../components/GamificationPanel'
import PremiumProfileLayout from '../../components/PremiumProfileLayout'
import PremiumUpsell from '../../components/PremiumUpsell'
import { getAuthUser, getProfile } from '../../lib/auth'
import { isPremiumActive } from '../../lib/premium'
import { createClient, isSupabaseAuthConfigured } from '../../lib/supabase/server'

export default async function PerfilPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login?next=/perfil')

  const authProfile = await getProfile()

  let username: string | null = null
  let isPublic = true
  let listPublic = true
  let displayName = 'Mi perfil'
  let avatarUrl: string | null = null
  let level = 1
  let xp = 0
  let coins = 0
  let selectedTitle: string | null = null
  let isPremium = false
  let premiumUntil: string | null = null
  let premiumPlan: string | null = null

  if (isSupabaseAuthConfigured()) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('profiles')
      .select(
        'username, display_name, avatar_url, is_public, list_public, level, xp, coins, selected_title, is_premium, premium_until, premium_plan, role',
      )
      .eq('id', user.id)
      .maybeSingle()
    username = data?.username || null
    displayName = data?.display_name || displayName
    avatarUrl = data?.avatar_url ?? null
    isPublic = data?.is_public ?? true
    listPublic = data?.list_public ?? true
    level = data?.level ?? 1
    xp = data?.xp ?? 0
    coins = data?.coins ?? 0
    selectedTitle = data?.selected_title ?? null
    isPremium = data?.is_premium ?? false
    premiumUntil = data?.premium_until ?? null
    premiumPlan = data?.premium_plan ?? null
  }

  const profileFields = {
    role: authProfile?.role,
    is_premium: isPremium,
    premium_until: premiumUntil,
    premium_plan: premiumPlan,
    level,
    xp,
    coins,
    selected_title: selectedTitle,
  }

  const showPremium = isPremiumActive(profileFields)

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://animedula.com'
  const shareUrl = username
    ? `${siteUrl}/u/${username}`
    : `${siteUrl}/api/og/profile?id=${user.id}`

  const settingsBlocks = (
    <>
      <div className="card-glass p-6">
        <ProfileAvatarUpload initialUrl={avatarUrl} displayName={displayName} />
      </div>
      <div className="card-glass p-6 space-y-6">
        <UsernameForm initialUsername={username} />
        <ProfilePrivacyForm isPublic={isPublic} listPublic={listPublic} />
      </div>
      <div className="card-glass p-6">
        <h3 className="font-display font-semibold text-text mb-4">Vitrina del perfil</h3>
        <ProfileShowcaseEditor />
      </div>
      <div className="card-glass p-6">
        <h3 className="font-display font-semibold text-text mb-4">Proyectos y trabajo</h3>
        <ProfileProjectsEditor />
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
    </>
  )

  if (showPremium) {
    return (
      <PremiumProfileLayout
        displayName={displayName}
        username={username}
        profile={profileFields}
        shareUrl={shareUrl}
      >
        {settingsBlocks}
      </PremiumProfileLayout>
    )
  }

  return (
    <div className="space-y-8 enter-up max-w-2xl">
      <header className="card-glass p-6">
        <p className="eyebrow mb-1">Cuenta</p>
        <h1 className="page-title">{displayName}</h1>
        <p className="text-sm text-muted mt-2">
          Plan gratuito. Próximamente <strong className="text-accent">Animédula+</strong> sin ads y cosméticos exclusivos.
        </p>
      </header>
      <PremiumUpsell />
      {settingsBlocks}
      <div className="card-glass p-6">
        <h3 className="font-display font-semibold text-text mb-2">Compartir perfil</h3>
        <code className="text-xs text-faint break-all block p-3 bg-surface-3 rounded-lg">{shareUrl}</code>
      </div>
    </div>
  )
}
