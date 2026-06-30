import { redirect } from 'next/navigation'
import UserLibrary from '../../components/UserLibrary'
import CoinShop from '../../components/CoinShop'
import { getAuthUser } from '../../lib/auth'
import { createClient, isSupabaseAuthConfigured } from '../../lib/supabase/server'

export const metadata = {
  title: 'Mi biblioteca · Animédula',
  description: 'Administra tus marcos, stickers, insignias y títulos.',
}

export default async function BibliotecaPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login?next=/biblioteca')

  let avatarUrl: string | null = null
  let displayName = 'Mi perfil'

  if (isSupabaseAuthConfigured()) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle()
    displayName = data?.display_name || displayName
    avatarUrl = data?.avatar_url ?? null
  }

  return (
    <div className="enter-up max-w-4xl mx-auto space-y-6">
      <UserLibrary avatarUrl={avatarUrl} displayName={displayName} />
      <CoinShop />
    </div>
  )
}
