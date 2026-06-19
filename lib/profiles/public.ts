import { createServiceClient } from '../supabase/service'

export type PublicProfile = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  xp: number
  level: number
  selected_title: string | null
  status_text: string | null
  current_action: string | null
  is_public: boolean
  list_public: boolean
  created_at: string
}

export type PublicListItem = {
  content_id: string
  content_type: string
  title: string
  image_url: string | null
  status: string
  updated_at: string
}

export type PublicBadge = {
  name: string
  description: string
  category: string
  unlocked_at: string
}

export type PublicReview = {
  id: number
  content_type: string
  content_id: string
  rating_global: number
  comment: string
  is_spoiler: boolean
  created_at: string
}

const ACTION_LABELS: Record<string, string> = {
  idle: 'En línea',
  watching: 'Viendo',
  reading: 'Leyendo',
  playing: 'Jugando',
}

export function formatAction(action?: string | null): string | null {
  if (!action || action === 'idle') return null
  return ACTION_LABELS[action] || action
}

export async function getPublicProfileByUsername(
  username: string,
): Promise<(PublicProfile & { badges: PublicBadge[]; lists: PublicListItem[]; reviews: PublicReview[] }) | null> {
  const supabase = createServiceClient()
  if (!supabase) return null

  const normalized = username.toLowerCase()
  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'id, username, display_name, avatar_url, xp, level, selected_title, status_text, current_action, is_public, list_public, created_at',
    )
    .eq('username', normalized)
    .maybeSingle()

  if (!profile || profile.is_public === false) return null

  const [badgesRes, listsRes, reviewsRes] = await Promise.all([
    supabase
      .from('user_badges')
      .select('unlocked_at, badges(name, description, category)')
      .eq('user_id', profile.id)
      .order('unlocked_at', { ascending: false })
      .limit(12),
    profile.list_public
      ? supabase
          .from('user_lists')
          .select('content_id, content_type, title, image_url, status, updated_at')
          .eq('user_id', profile.id)
          .in('status', ['watching', 'completed'])
          .order('updated_at', { ascending: false })
          .limit(12)
      : Promise.resolve({ data: [] }),
    supabase
      .from('user_reviews')
      .select('id, content_type, content_id, rating_global, comment, is_spoiler, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const badges: PublicBadge[] = (badgesRes.data || []).map((row) => {
    const b = row.badges as unknown as { name: string; description: string; category: string } | null
    return {
      name: b?.name || 'Insignia',
      description: b?.description || '',
      category: b?.category || 'general',
      unlocked_at: row.unlocked_at,
    }
  })

  return {
    ...(profile as PublicProfile),
    badges,
    lists: (listsRes.data || []) as PublicListItem[],
    reviews: (reviewsRes.data || []) as PublicReview[],
  }
}

export function listHref(item: PublicListItem): string {
  const bases: Record<string, string> = {
    anime: '/anime',
    manga: '/mangas',
    game: '/videojuegos',
    movie: '/cine',
  }
  return `${bases[item.content_type] || '/explorar'}/${item.content_id}`
}

export function reviewHref(item: PublicReview): string {
  const bases: Record<string, string> = {
    anime: '/anime',
    manga: '/mangas',
    game: '/videojuegos',
    movie: '/cine',
  }
  return `${bases[item.content_type] || '/explorar'}/${item.content_id}`
}

export function isValidUsername(value: string): boolean {
  return /^[a-z0-9_]{3,24}$/.test(value)
}

export function slugifyUsername(base: string): string {
  const slug = base
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 20)
  return slug.length >= 3 ? slug : `fan${Math.random().toString(36).slice(2, 6)}`
}
