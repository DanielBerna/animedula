export const FORUM_TAGS = [
  { id: 'manga', label: '#manga' },
  { id: 'gaming', label: '#gaming' },
  { id: 'spoilers', label: '#spoilers' },
  { id: 'tecnologia', label: '#tecnologia' },
  { id: 'anime', label: '#anime' },
] as const

export const REACTION_EMOJI = [
  { id: 'hype', label: 'Hype', icon: '🔥' },
  { id: 'sad_otaku', label: 'Sad otaku', icon: '😢' },
  { id: 'gg', label: 'GG', icon: '🏆' },
] as const

export type ForumPost = {
  id: number
  title: string
  body: string
  tags: string[]
  content_id: string | null
  content_type: string | null
  reply_count: number
  created_at: string
  user_id: string
  parent_id: number | null
  profiles?: {
    display_name: string | null
    status_text?: string | null
    current_action?: string | null
    username?: string | null
    selected_title?: string | null
    avatar_url?: string | null
  } | null
  author_border?: string | null
  reactions?: Record<string, number>
  user_reactions?: string[]
}
