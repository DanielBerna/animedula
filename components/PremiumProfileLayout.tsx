import Link from 'next/link'
import type { ReactNode } from 'react'
import { PREMIUM_PERKS, premiumLabel, type PremiumProfileFields } from '../lib/premium'
import MeduCoin from './MeduCoin'

type Props = {
  displayName: string
  username: string | null
  profile: PremiumProfileFields & {
    level?: number
    xp?: number
    coins?: number
    selected_title?: string | null
  }
  shareUrl: string
  children: ReactNode
}

export default function PremiumProfileLayout({
  displayName,
  username,
  profile,
  shareUrl,
  children,
}: Props) {
  const tier = premiumLabel(profile)
  const isAdmin = profile.role === 'admin'

  return (
    <div className="premium-profile-shell space-y-8 enter-up max-w-3xl mx-auto">
      <header className="premium-hero">
        <div className="premium-hero-glow" aria-hidden />
        <div className="premium-hero-inner">
          <div className="premium-avatar-wrap cosmetic-border-legendary">
            <span className="premium-avatar">
              {displayName[0]?.toUpperCase() || '?'}
            </span>
            <span className="premium-tier-badge">{tier}</span>
          </div>
          <div className="premium-hero-text">
            <p className="premium-eyebrow">{isAdmin ? 'Panel de prueba · Admin' : 'Cuenta premium'}</p>
            <h1 className="premium-title">{displayName}</h1>
            {username ? <p className="premium-handle">@{username}</p> : null}
            <div className="premium-stats">
              <span className="premium-stat">
                <strong>{profile.level ?? 1}</strong>
                <small>Nivel</small>
              </span>
              <span className="premium-stat">
                <strong>{profile.xp ?? 0}</strong>
                <small>XP</small>
              </span>
              <span className="premium-stat">
                <strong className="inline-flex items-center gap-1">
                  <MeduCoin size={16} />
                  {profile.coins ?? 0}
                </strong>
                <small>MéduCoins</small>
              </span>
            </div>
            {profile.selected_title ? (
              <p className="premium-title-tag">{profile.selected_title}</p>
            ) : null}
          </div>
        </div>
      </header>

      {isAdmin ? (
        <section className="premium-admin-strip">
          <p className="text-sm text-muted">
            Como <strong className="text-text">admin</strong> ves el layout premium para probar insignias, tienda,
            misiones y futuros pagos antes del lanzamiento público.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Link href="/admin" className="btn-primary text-xs">
              Moderación
            </Link>
            <Link href="/admin/catalogo" className="btn-ghost text-xs">
              Catálogo premios
            </Link>
            <Link href="/comunidad" className="btn-ghost text-xs">
              Probar foro
            </Link>
          </div>
        </section>
      ) : (
        <section className="premium-perks-grid">
          {PREMIUM_PERKS.map((p) => (
            <div key={p.title} className="premium-perk-card">
              <span className="premium-perk-icon" aria-hidden>
                {p.icon}
              </span>
              <div>
                <p className="font-semibold text-sm text-text">{p.title}</p>
                <p className="text-xs text-muted mt-0.5">{p.desc}</p>
              </div>
            </div>
          ))}
        </section>
      )}

      <div className="premium-content-stack">{children}</div>

      <section className="premium-share card-glass p-5">
        <h3 className="font-display font-semibold text-text mb-2">Tu enlace público</h3>
        <code className="text-xs text-faint break-all block p-3 bg-surface-3 rounded-lg">{shareUrl}</code>
        {username ? (
          <Link href={`/u/${username}`} className="text-sm text-accent hover:underline mt-3 inline-block">
            Ver perfil público →
          </Link>
        ) : null}
      </section>
    </div>
  )
}
