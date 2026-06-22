import type { SupabaseClient } from '@supabase/supabase-js'
import type { MissionKey } from '../gamification/missions'

export async function verifyMissionCompletion(
  supabase: SupabaseClient,
  userId: string,
  missionKey: MissionKey,
): Promise<boolean> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const since = todayStart.toISOString()

  switch (missionKey) {
    case 'visit':
      return true
    case 'comment': {
      const { count } = await supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', since)
      return (count ?? 0) > 0
    }
    case 'review': {
      const { count } = await supabase
        .from('user_reviews')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', since)
      return (count ?? 0) > 0
    }
    case 'list': {
      const { count } = await supabase
        .from('user_lists')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('updated_at', since)
      return (count ?? 0) > 0
    }
    default:
      return false
  }
}
