import type { SupabaseClient } from '@supabase/supabase-js'
import { DAILY_MISSIONS, type MissionKey } from './missions'

/**
 * Acredita MéduCoins por una actividad real (comentar, reseñar, foro, lista).
 *
 * Registra la misión diaria correspondiente y suma las monedas UNA sola vez por
 * día (la restricción `unique (user_id, mission_key, mission_date)` evita el
 * doble cobro). Pensado para llamarse tras una actividad exitosa; nunca lanza,
 * así que no rompe la respuesta principal si algo falla.
 *
 * El cliente debe estar autenticado como el propio usuario (auth.uid() = userId),
 * requisito del RPC `award_coins`.
 */
export async function awardActivityCoins(
  supabase: SupabaseClient,
  userId: string,
  missionKey: MissionKey,
): Promise<{ awarded: number } | null> {
  try {
    const mission = DAILY_MISSIONS.find((m) => m.key === missionKey)
    if (!mission) return null

    const today = new Date().toISOString().slice(0, 10)
    const { error } = await supabase.from('daily_missions').insert({
      user_id: userId,
      mission_key: missionKey,
      mission_date: today,
      coins_awarded: mission.coins,
    })

    // Si ya estaba registrada hoy (violación de unique) no se vuelve a pagar.
    if (error) return null

    const { error: coinErr } = await supabase.rpc('award_coins', {
      p_user_id: userId,
      p_amount: mission.coins,
    })
    if (coinErr) return null

    return { awarded: mission.coins }
  } catch {
    return null
  }
}
