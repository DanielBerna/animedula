import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import FollowButton from '../../../components/FollowButton'
import FriendRequestButton from '../../../components/FriendRequestButton'
import SpoilerText from '../../../components/SpoilerText'
import { getAuthUser } from '../../../lib/auth'
import {
  formatAction,
  getPublicProfileByUsername,
  listHref,
  reviewHref,
} from '../../../lib/profiles/public'
import { getFollowStats } from '../../../lib/social/follows'
import { getFriendStatus } from '../../../lib/social/friends'

type Props = {
  params: Promise<{ username: string }>
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://animedula.com'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const profile = await getPublicProfileByUsername(username)
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
  const [profile, viewer] = await Promise.all([getPublicProfileByUsername(username), getAuthUser()])
  if (!profile) notFound()

  const followStats = await getFollowStats(profile.id, viewer?.id)
  const friendStatus = viewer ? await getFriendStatus(viewer.id, profile.id) : 'none'
  const canFollow = Boolean(viewer && viewer.id !== profile.id)
  const canFriend = canFollow

  const name = profile.display_name || profile.username
  const action = formatAction(profile.current_action)
  const initial = name[0]?.toUpperCase() || '?'

  return (
    <div className="space-y-8 enter-up max-w-2xl mx-auto public-profile-shell">
      <header className={`card-glass p-6 md:p-8 ${profile.is_premium ? 'premium-public-header' : ''}`}>
        <div className="flex items-start gap-4">
          <span className="user-avatar text-xl w-16 h-16 flex items-center justify-center shrink-0">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              initial
            )}
          </span>
          <div className="min-w-0">
            <p className="eyebrow mb-1">Perfil público</p>
            <h1 className="page-title">{name}</h1>
            <p className="text-sm text-muted">@{profile.username}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {profile.is_premium ? (
                <span className="tag tag-gold">Animédula+</span>
              ) : null}
              <span className="tag tag-accent">Nivel {profile.level}</span>
              <span className="tag">{profile.xp} XP</span>
              {profile.selected_title ? (
                <span className="tag tag-gold">{profile.selected_title}</span>
              ) : null}
              {action ? <span className="tag tag-sec">{action}</span> : null}
            </div>
            {profile.status_text ? (
              <p className="text-sm text-muted mt-3 italic">{profile.status_text}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <FollowButton
                targetUserId={profile.id}
                initialFollowing={followStats.is_following}
                initialFollowerCount={followStats.follower_count}
                canFollow={canFollow}
              />
              <FriendRequestButton
                targetUserId={profile.id}
                initialStatus={friendStatus}
                canInteract={canFriend}
              />
            </div>
          </div>
        </div>
      </header>

      {profile.badges.length > 0 && (
        <section className="card-glass p-6">
          <h2 className="font-display font-semibold text-text mb-4">Insignias</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profile.badges.map((b, i) => (
              <li key={i} className="rounded-lg border border-white/6 bg-surface-3/50 p-3">
                <p className="font-semibold text-sm text-text">🏅 {b.name}</p>
                <p className="text-xs text-muted mt-1">{b.description}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {profile.list_public && profile.lists.length > 0 && (
        <section className="card-glass p-6">
          <h2 className="font-display font-semibold text-text mb-4">Lista</h2>
          <ul className="space-y-2">
            {profile.lists.map((item) => (
              <li key={`${item.content_type}-${item.content_id}`}>
                <Link
                  href={listHref(item)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-3/50 transition"
                >
                  <span className="tag text-[10px]">{item.status}</span>
                  <span className="tag text-[10px]">{item.content_type}</span>
                  <span className="text-sm text-text truncate">{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {profile.reviews.length > 0 && (
        <section className="card-glass p-6">
          <h2 className="font-display font-semibold text-text mb-4">Reseñas recientes</h2>
          <ul className="space-y-4">
            {profile.reviews.map((r) => (
              <li key={r.id} className="rounded-lg border border-white/6 bg-surface-3/50 p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Link href={reviewHref(r)} className="text-sm font-semibold text-accent hover:underline">
                    ★ {r.rating_global}/10 · Ver ficha
                  </Link>
                  {r.is_spoiler ? <span className="tag tag-gold text-[10px]">Spoiler</span> : null}
                </div>
                <SpoilerText isSpoiler={r.is_spoiler}>{r.comment.slice(0, 280)}</SpoilerText>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-center text-xs text-faint">
        Miembro desde{' '}
        {new Date(profile.created_at).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
      </p>
    </div>
  )
}
