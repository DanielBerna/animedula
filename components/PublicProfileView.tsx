import Link from 'next/link'
import FollowButton from './FollowButton'
import FriendRequestButton from './FriendRequestButton'
import SpoilerText from './SpoilerText'
import ProfileBadgeGrid from './profile/ProfileBadgeGrid'
import ProfileHero from './profile/ProfileHero'
import ProfileProjectsSection from './profile/ProfileProjectsSection'
import ProfileShowcaseSection from './profile/ProfileShowcaseSection'
import ProfileWallComments from './profile/ProfileWallComments'
import { listHref, reviewHref } from '../lib/profiles/public'
import type { FullPublicProfile } from '../lib/profiles/full'

type Props = {
  profile: FullPublicProfile
  viewerId: string | null
  isFollowing: boolean
  friendStatus: 'none' | 'pending_sent' | 'pending_received' | 'friends'
}

export default function PublicProfileView({
  profile,
  viewerId,
  isFollowing,
  friendStatus,
}: Props) {
  const name = profile.display_name || profile.username
  const canInteract = Boolean(viewerId && viewerId !== profile.id)

  const actions = (
    <>
      <FollowButton
        targetUserId={profile.id}
        initialFollowing={isFollowing}
        initialFollowerCount={profile.follower_count}
        canFollow={canInteract}
      />
      <FriendRequestButton
        targetUserId={profile.id}
        initialStatus={friendStatus}
        canInteract={canInteract}
      />
    </>
  )

  return (
    <div className="public-profile-page space-y-8 enter-up">
      <ProfileHero
        displayName={name}
        username={profile.username}
        avatarUrl={profile.avatar_url}
        avatarBorder={profile.avatar_border}
        level={profile.level}
        xp={profile.xp}
        selectedTitle={profile.selected_title}
        statusText={profile.status_text}
        currentAction={profile.current_action}
        isPremium={profile.is_premium}
        followerCount={profile.follower_count}
        followingCount={profile.following_count}
        memberSince={profile.created_at}
        actions={actions}
      />

      <ProfileBadgeGrid badges={profile.badges} />

      <div className="profile-showcase-stack">
        <ProfileShowcaseSection
          section="anime"
          items={profile.showcase}
          wallSlot={
            <ProfileWallComments
              profileUserId={profile.id}
              section="anime"
              title="Comentarios de amigos · Anime"
              compact
            />
          }
        />
        <ProfileShowcaseSection
          section="manga"
          items={profile.showcase}
          wallSlot={
            <ProfileWallComments
              profileUserId={profile.id}
              section="manga"
              title="Comentarios de amigos · Manga"
              compact
            />
          }
        />
        <ProfileShowcaseSection
          section="game"
          items={profile.showcase}
          wallSlot={
            <ProfileWallComments
              profileUserId={profile.id}
              section="game"
              title="Comentarios de amigos · Juegos"
              compact
            />
          }
        />
      </div>

      <ProfileProjectsSection
        intro={profile.projects_intro}
        projects={profile.projects}
        wallSlot={
          <ProfileWallComments
            profileUserId={profile.id}
            section="projects"
            title="Comentarios de amigos · Proyectos"
            compact
          />
        }
      />

      <section className="card-glass p-6">
        <ProfileWallComments profileUserId={profile.id} section="general" title="Muro general (solo amigos)" />
      </section>

      {profile.lists.length > 0 && (
        <section className="card-glass p-6">
          <h2 className="font-display font-semibold text-text mb-4">Lista reciente</h2>
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
    </div>
  )
}
