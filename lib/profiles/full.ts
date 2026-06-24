import { createServiceClient } from '../supabase/service'
import { getEquippedBorderForUser } from '../gamification/cosmetics'
import type { PublicBadge, PublicListItem, PublicReview } from './public'

export type ShowcaseItem = {
  slot: number
  section: 'anime' | 'manga' | 'game'
  content_id: string | null
  title: string
  image_url: string | null
  list_status: string
}

export type ProjectItem = {
  slot: number
  title: string
  description: string
  link_url: string | null
}

export type WallComment = {
  id: number
  body: string
  section: string
  created_at: string
  author_id: string
  author_name: string
  author_username: string | null
}

export type FullPublicProfile = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  avatar_border: string | null
  xp: number
  level: number
  selected_title: string | null
  status_text: string | null
  current_action: string | null
  projects_intro: string | null
  is_public: boolean
  is_premium?: boolean
  created_at: string
  badges: PublicBadge[]
  lists: PublicListItem[]
  reviews: PublicReview[]
  showcase: ShowcaseItem[]
  projects: ProjectItem[]
  follower_count: number
  following_count: number
}

export async function getFullPublicProfile(username: string): Promise<FullPublicProfile | null> {
  const supabase = createServiceClient()
  if (!supabase) return null

  const normalized = username.toLowerCase()
  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'id, username, display_name, avatar_url, xp, level, selected_title, status_text, current_action, projects_intro, is_public, list_public, is_premium, created_at',
    )
    .eq('username', normalized)
    .maybeSingle()

  if (!profile || profile.is_public === false) return null

  const userId = profile.id

  const [badgesRes, listsRes, reviewsRes, showcaseRes, projectsRes, followersRes, followingRes, border] =
    await Promise.all([
      supabase
        .from('user_badges')
        .select('unlocked_at, badges(name, description, category, slug)')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false })
        .limit(24),
      profile.list_public
        ? supabase
            .from('user_lists')
            .select('content_id, content_type, title, image_url, status, updated_at')
            .eq('user_id', userId)
            .in('status', ['watching', 'completed'])
            .order('updated_at', { ascending: false })
            .limit(12)
        : Promise.resolve({ data: [] }),
      supabase
        .from('user_reviews')
        .select('id, content_type, content_id, rating_global, comment, is_spoiler, created_at')
        .eq('user_id', userId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('profile_showcase')
        .select('slot, section, content_id, title, image_url, list_status')
        .eq('user_id', userId)
        .order('section')
        .order('slot'),
      supabase
        .from('profile_projects')
        .select('slot, title, description, link_url')
        .eq('user_id', userId)
        .order('slot'),
      supabase
        .from('user_follows')
        .select('follower_id', { count: 'exact', head: true })
        .eq('following_id', userId),
      supabase
        .from('user_follows')
        .select('following_id', { count: 'exact', head: true })
        .eq('follower_id', userId),
      getEquippedBorderForUser(userId),
    ])

  const badges: PublicBadge[] = (badgesRes.data || []).map((row) => {
    const b = row.badges as unknown as {
      name: string
      description: string
      category: string
      slug?: string
    } | null
    return {
      name: b?.name || 'Insignia',
      description: b?.description || '',
      category: b?.category || 'general',
      unlocked_at: row.unlocked_at,
    }
  })

  return {
    id: userId,
    username: profile.username,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    avatar_border: border,
    xp: profile.xp,
    level: profile.level,
    selected_title: profile.selected_title,
    status_text: profile.status_text,
    current_action: profile.current_action,
    projects_intro: profile.projects_intro ?? null,
    is_public: profile.is_public,
    is_premium: profile.is_premium,
    created_at: profile.created_at,
    badges,
    lists: (listsRes.data || []) as PublicListItem[],
    reviews: (reviewsRes.data || []) as PublicReview[],
    showcase: (showcaseRes.data || []) as ShowcaseItem[],
    projects: (projectsRes.data || []) as ProjectItem[],
    follower_count: followersRes.count ?? 0,
    following_count: followingRes.count ?? 0,
  }
}

export function showcaseBySection(
  items: ShowcaseItem[],
  section: 'anime' | 'manga' | 'game',
): (ShowcaseItem | null)[] {
  const slots: (ShowcaseItem | null)[] = [null, null, null, null, null]
  for (const item of items.filter((i) => i.section === section)) {
    if (item.slot >= 1 && item.slot <= 5) slots[item.slot - 1] = item
  }
  return slots
}

export function projectsBySlot(items: ProjectItem[]): (ProjectItem | null)[] {
  const slots: (ProjectItem | null)[] = [null, null, null, null, null]
  for (const p of items) {
    if (p.slot >= 1 && p.slot <= 5) slots[p.slot - 1] = p
  }
  return slots
}
