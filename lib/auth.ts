import { createClient, isSupabaseAuthConfigured } from './supabase/server'

export type UserRole = 'user' | 'contributor' | 'editor' | 'admin'

export type Profile = {
  id: string
  display_name: string | null
  avatar_url: string | null
  role: UserRole
  username?: string | null
}

export async function getAuthUser() {
  if (!isSupabaseAuthConfigured()) return null
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getProfile(): Promise<Profile | null> {
  if (!isSupabaseAuthConfigured()) return null
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, role, username')
    .eq('id', user.id)
    .maybeSingle()

  if (!data) return null
  return data as Profile
}

export function isEditorRole(role?: string | null) {
  return role === 'editor' || role === 'admin'
}

export async function requireEditor(): Promise<Profile | null> {
  const profile = await getProfile()
  if (!profile || !isEditorRole(profile.role)) return null
  return profile
}
