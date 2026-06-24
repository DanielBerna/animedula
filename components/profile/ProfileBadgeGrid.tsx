import type { PublicBadge } from '../../lib/profiles/public'

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  forum: 'Foro',
  review: 'Reseñas',
  social: 'Social',
  streak: 'Rachas',
  cosmetic: 'Cosméticos',
}

type Props = {
  badges: PublicBadge[]
}

export default function ProfileBadgeGrid({ badges }: Props) {
  if (badges.length === 0) return null

  const grouped = badges.reduce<Record<string, PublicBadge[]>>((acc, b) => {
    const cat = b.category || 'general'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(b)
    return acc
  }, {})

  const categories = Object.keys(grouped).sort()

  return (
    <section className="card-glass p-6 profile-badges-section">
      <div className="flex items-end justify-between gap-3 mb-5">
        <div>
          <h2 className="font-display font-semibold text-text text-lg">Insignias</h2>
          <p className="text-xs text-muted mt-1">{badges.length} desbloqueadas</p>
        </div>
      </div>
      <div className="space-y-6">
        {categories.map((cat) => (
          <div key={cat}>
            <p className="profile-section-label">{CATEGORY_LABELS[cat] || cat}</p>
            <ul className="profile-badge-grid">
              {grouped[cat].map((b, i) => (
                <li key={`${cat}-${i}`} className="profile-badge-card">
                  <span className="profile-badge-icon" aria-hidden>
                    🏅
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-text truncate">{b.name}</p>
                    <p className="text-xs text-muted mt-0.5 line-clamp-2">{b.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
