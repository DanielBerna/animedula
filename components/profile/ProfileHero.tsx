import type { ReactNode } from 'react'
import { formatAction } from '../../lib/profiles/public'
import AvatarFrame from '../AvatarFrame'

type Border = { cssClass?: string | null; image?: string | null } | null

type Props = {
  displayName: string
  username: string
  avatarUrl: string | null
  avatarBorder: Border
  level: number
  xp: number
  selectedTitle: string | null
  statusText: string | null
  currentAction: string | null
  isPremium?: boolean
  followerCount: number
  followingCount: number
  memberSince: string
  actions?: ReactNode
}

export default function ProfileHero({
  displayName,
  username,
  avatarUrl,
  avatarBorder,
  level,
  xp,
  selectedTitle,
  statusText,
  currentAction,
  isPremium,
  followerCount,
  followingCount,
  memberSince,
  actions,
}: Props) {
  const action = formatAction(currentAction)
  const border: Border =
    avatarBorder || (isPremium ? { cssClass: 'cosmetic-border-legendary', image: null } : null)

  return (
    <header className={`profile-hero card-glass ${isPremium ? 'profile-hero-premium' : ''}`}>
      <div className="profile-hero-glow" aria-hidden />
      <div className="profile-hero-inner">
        <AvatarFrame avatarUrl={avatarUrl} label={displayName} border={border} size={104} />
        <div className="profile-hero-body">
          <p className="eyebrow mb-1">Perfil público</p>
          <h1 className="page-title">{displayName}</h1>
          <p className="text-sm text-muted">@{username}</p>
          <div className="profile-stat-row">
            <span className="profile-stat">
              <strong>{level}</strong>
              <small>Nivel</small>
            </span>
            <span className="profile-stat">
              <strong>{xp}</strong>
              <small>XP</small>
            </span>
            <span className="profile-stat">
              <strong>{followerCount}</strong>
              <small>Seguidores</small>
            </span>
            <span className="profile-stat">
              <strong>{followingCount}</strong>
              <small>Siguiendo</small>
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {isPremium ? <span className="tag tag-gold">Animédula+</span> : null}
            {selectedTitle ? <span className="tag tag-gold">{selectedTitle}</span> : null}
            {action ? <span className="tag tag-sec">{action}</span> : null}
          </div>
          {statusText ? <p className="profile-status-quote">{statusText}</p> : null}
          {actions ? <div className="mt-4 flex flex-wrap items-center gap-3">{actions}</div> : null}
          <p className="text-xs text-faint mt-4">
            Miembro desde{' '}
            {new Date(memberSince).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
    </header>
  )
}
