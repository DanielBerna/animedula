import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import PublicProfileView from '../../../components/PublicProfileView'
import { getAuthUser } from '../../../lib/auth'
import { getFullPublicProfile } from '../../../lib/profiles/full'
import { getFollowStats } from '../../../lib/social/follows'
import { getFriendStatus } from '../../../lib/social/friends'

type Props = {
  params: Promise<{ username: string }>
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://animedula.com'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const profile = await getFullPublicProfile(username)
  if (!profile) return { title: 'Perfil no encontrado' }

  const name = profile.display_name || profile.username
  const ogUrl = `${siteUrl}/api/og/profile?username=${encodeURIComponent(profile.username)}`

  return {
    title: `${name} (@${profile.username}) — Animédula`,
    description: `${profile.selected_title || 'Novato'} · Nivel ${profile.level} · ${profile.xp} XP`,
    openGraph: {
      title: `${name} en Animédula`,
      description: profile.status_text || `Nivel ${profile.level} · ${profile.selected_title}`,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} en Animédula`,
      images: [ogUrl],
    },
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params
  const [profile, viewer] = await Promise.all([getFullPublicProfile(username), getAuthUser()])
  if (!profile) notFound()

  const followStats = await getFollowStats(profile.id, viewer?.id)
  const friendStatus = viewer ? await getFriendStatus(viewer.id, profile.id) : 'none'

  return (
    <PublicProfileView
      profile={profile}
      viewerId={viewer?.id ?? null}
      isFollowing={followStats.is_following}
      friendStatus={friendStatus}
    />
  )
}
