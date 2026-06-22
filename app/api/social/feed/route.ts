import { getAuthUser } from '../../../../lib/auth'
import { getFollowingActivityFeed } from '../../../../lib/social/activity-feed'
import { isSupabaseAuthConfigured } from '../../../../lib/supabase/server'

export async function GET() {
  if (!isSupabaseAuthConfigured()) {
    return Response.json({ items: [] })
  }

  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Inicia sesión' }, { status: 401 })
  }

  const items = await getFollowingActivityFeed(user.id, 25)
  return Response.json({ items })
}
