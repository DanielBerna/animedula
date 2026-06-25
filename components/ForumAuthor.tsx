'use client'

import Link from 'next/link'
import AvatarFrame from './AvatarFrame'

const ACTION_LABELS: Record<string, string> = {
  idle: 'En línea',
  watching: 'Viendo',
  reading: 'Leyendo',
  playing: 'Jugando',
}

type Profile = {
  display_name?: string | null
  username?: string | null
  status_text?: string | null
  current_action?: string | null
  selected_title?: string | null
  avatar_url?: string | null
}

type Border = { cssClass?: string | null; image?: string | null } | null

type Props = {
  profile?: Profile | null
  authorBorder?: Border
  compact?: boolean
}

export default function ForumAuthor({ profile, authorBorder, compact }: Props) {
  const name = profile?.display_name || profile?.username || 'Fan'
  const action =
    profile?.current_action && profile.current_action !== 'idle'
      ? ACTION_LABELS[profile.current_action] || profile.current_action
      : null

  const avatar = (
    <AvatarFrame
      avatarUrl={profile?.avatar_url}
      label={name}
      border={authorBorder}
      size={36}
      className="shrink-0"
    />
  )

  const nameEl = profile?.username ? (
    <Link href={`/u/${profile.username}`} className="font-semibold text-text hover:text-accent transition">
      {name}
    </Link>
  ) : (
    <span className="font-semibold text-text">{name}</span>
  )

  return (
    <div className={`forum-author flex gap-2.5 min-w-0 ${compact ? 'items-center' : 'items-start'}`}>
      {avatar}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {nameEl}
          {profile?.username ? (
            <span className="text-[11px] text-faint">@{profile.username}</span>
          ) : null}
          {profile?.selected_title && !compact ? (
            <span className="tag text-[9px]">{profile.selected_title}</span>
          ) : null}
        </div>
        {action ? <p className="text-[11px] text-accent mt-0.5">{action}</p> : null}
        {profile?.status_text && !compact ? (
          <p className="text-[11px] text-muted mt-0.5 italic line-clamp-2">{profile.status_text}</p>
        ) : null}
      </div>
    </div>
  )
}
