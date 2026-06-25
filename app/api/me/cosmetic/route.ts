import { getAuthUser } from '../../../../lib/auth'
import { isSupabaseAuthConfigured } from '../../../../lib/supabase/server'
import { getEquippedBorderForUser } from '../../../../lib/gamification/cosmetics'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!isSupabaseAuthConfigured()) return Response.json({ border: null })

  const user = await getAuthUser()
  if (!user) return Response.json({ border: null })

  const border = await getEquippedBorderForUser(user.id)
  return Response.json({ border })
}
