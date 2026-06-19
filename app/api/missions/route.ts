import { NextRequest } from 'next/server'
import { getAuthUser } from '../../../lib/auth'
import { createClient, isSupabaseAuthConfigured } from '../../../lib/supabase/server'
import { DAILY_MISSIONS, MissionKey } from '../../../lib/gamification/missions'

const VALID_KEYS = DAILY_MISSIONS.map((m) => m.key)

export async function GET() {
  if (!isSupabaseAuthConfigured()) {
    return Response.json({ missions: [], coins: 0 })
  }

  const user = await getAuthUser()
  if (!user) return Response.json({ missions: [], coins: 0 })

  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  const [{ data: completed }, { data: profile }] = await Promise.all([
    supabase.from('daily_missions').select('mission_key').eq('user_id', user.id).eq('mission_date', today),
    supabase.from('profiles').select('coins').eq('id', user.id).maybeSingle(),
  ])

  const done = new Set((completed || []).map((c) => c.mission_key))
  const missions = DAILY_MISSIONS.map((m) => ({
    ...m,
    completed: done.has(m.key),
  }))

  return Response.json({ missions, coins: profile?.coins ?? 0 })
}

export async function POST(req: NextRequest) {
  if (!isSupabaseAuthConfigured()) {
    return Response.json({ error: 'Misiones no disponibles' }, { status: 503 })
  }

  const user = await getAuthUser()
  if (!user) return Response.json({ error: 'Inicia sesión' }, { status: 401 })

  const { mission_key } = await req.json()
  if (!VALID_KEYS.includes(mission_key as MissionKey)) {
    return Response.json({ error: 'Misión no válida' }, { status: 400 })
  }

  const mission = DAILY_MISSIONS.find((m) => m.key === mission_key)!
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  const { error } = await supabase.from('daily_missions').insert({
    user_id: user.id,
    mission_key,
    mission_date: today,
    coins_awarded: mission.coins,
  })

  if (error) {
    if (error.code === '23505') {
      return Response.json({ already: true })
    }
    return Response.json({ error: error.message }, { status: 500 })
  }

  await supabase.rpc('award_coins', { p_user_id: user.id, p_amount: mission.coins })

  return Response.json({ completed: true, coins: mission.coins })
}
