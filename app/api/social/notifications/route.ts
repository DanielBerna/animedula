import { getAuthUser } from '../../../../lib/auth'
import { listNotifications } from '../../../../lib/social/friends'
import { isSupabaseAuthConfigured } from '../../../../lib/supabase/server'

export async function GET() {
  if (!isSupabaseAuthConfigured()) {
    return Response.json({ notifications: [] })
  }

  const user = await getAuthUser()
  if (!user) return Response.json({ error: 'Inicia sesión' }, { status: 401 })

  const notifications = await listNotifications(user.id)
  return Response.json({ notifications })
}
