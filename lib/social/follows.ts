import { createClient, isSupabaseAuthConfigured } from '../supabase/server'
import { createServiceClient } from '../supabase/service'

export type FollowStats = {
  follower_count: number
  following_count: number
  is_following: boolean
}

export async function getFollowStats(
  targetUserId: string,
  viewerId?: string | null,
): Promise<FollowStats> {
  const supabase = createServiceClient()
  if (!supabase) {
    return { follower_count: 0, following_count: 0, is_following: false }
  }

  const [followersRes, followingRes, mineRes] = await Promise.all([
    supabase
      .from('user_follows')
      .select('follower_id', { count: 'exact', head: true })
      .eq('following_id', targetUserId),
    supabase
      .from('user_follows')
      .select('following_id', { count: 'exact', head: true })
      .eq('follower_id', targetUserId),
    viewerId && viewerId !== targetUserId
      ? supabase
          .from('user_follows')
          .select('follower_id')
          .eq('follower_id', viewerId)
          .eq('following_id', targetUserId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  return {
    follower_count: followersRes.count ?? 0,
    following_count: followingRes.count ?? 0,
    is_following: Boolean(mineRes.data),
  }
}

export async function followUser(followerId: string, followingId: string) {
  if (!isSupabaseAuthConfigured()) throw new Error('Supabase no configurado')
  if (followerId === followingId) throw new Error('No puedes seguirte a ti mismo')

  const supabase = await createClient()
  const { error } = await supabase.from('user_follows').insert({
    follower_id: followerId,
    following_id: followingId,
  })

  if (error) {
    if (error.code === '42P01') throw new Error('Ejecuta schema-v13-social.sql')
    if (error.code === '23505') return
    throw error
  }
}

export async function unfollowUser(followerId: string, followingId: string) {
  if (!isSupabaseAuthConfigured()) throw new Error('Supabase no configurado')

  const supabase = await createClient()
  const { error } = await supabase
    .from('user_follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)

  if (error) throw error
}

export async function listFollowingIds(userId: string): Promise<string[]> {
  const supabase = createServiceClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', userId)

  if (error) {
    if (error.code === '42P01') return []
    return []
  }

  return (data || []).map((r) => r.following_id)
}
