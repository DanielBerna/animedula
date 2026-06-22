import { NextRequest } from 'next/server'
import { getAuthUser } from '../../../lib/auth'
import { createClient, isSupabaseAuthConfigured } from '../../../lib/supabase/server'
import { DAILY_MISSIONS, MissionKey } from '../../../lib/gamification/missions'
import { verifyMissionCompletion } from '../../../lib/gamification/verify-mission'
import { requireRateLimit } from '../../../lib/security/api'

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
  const limited = await requireRateLimit(req, 'mutation', 'missions')
  if (limited) return limited

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

  const verified = await verifyMissionCompletion(supabase, user.id, mission_key as MissionKey)
  if (!verified) {
    return Response.json(
      { error: 'Completa la acción de la misión antes de reclamarla' },
      { status: 403 },
    )
  }

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

  const { error: coinErr } = await supabase.rpc('award_coins', {
    p_user_id: user.id,
    p_amount: mission.coins,
  })
  if (coinErr) {
    return Response.json({ error: 'No se pudieron acreditar monedas' }, { status: 500 })
  }

  return Response.json({ completed: true, coins: mission.coins })
}
