import Link from 'next/link'

type Variant = 'calendar' | 'manga' | 'tech' | 'collect'

const COPY: Record<Variant, { icon: string; title: string }> = {
  calendar: { icon: '📅', title: 'Calendario' },
  manga: { icon: '📖', title: 'Mangas' },
  tech: { icon: '⚡', title: 'Tecnología' },
  collect: { icon: '🎎', title: 'Coleccionables' },
}

export default function HubCard({ variant, href }: { variant: Variant; href: string }) {
  const c = COPY[variant]
  return (
    <Link href={href} className={`hub-card hub-card-${variant} enter-up`}>
      <span className="hub-card-icon">{c.icon}</span>
      <h3 className="font-display font-bold text-text flex-1">{c.title}</h3>
      <span className="text-xs font-medium" style={{ color: `var(--hub-color)` }}>→</span>
    </Link>
  )
}
