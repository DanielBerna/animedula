import Link from 'next/link'
import IconOrb from './icons/IconOrb'
import SectionIcon, { IconName } from './icons/SectionIcon'

type Variant = 'calendar' | 'manga' | 'tech' | 'collect'

const COPY: Record<Variant, { icon: IconName; title: string; hint: string }> = {
  calendar: { icon: 'calendar', title: 'Temporadas', hint: 'Emisión y estrenos' },
  manga: { icon: 'manga', title: 'Mangas', hint: 'Lectura' },
  tech: { icon: 'tech', title: 'Tecnología', hint: 'Equipo' },
  collect: { icon: 'collect', title: 'Coleccionables', hint: 'Tienda' },
}

export default function HubCard({ variant, href }: { variant: Variant; href: string }) {
  const c = COPY[variant]
  return (
    <Link href={href} className={`hub-card hub-card-${variant} enter-up group`}>
      <div className="hub-card-glow" aria-hidden />
      <IconOrb name={c.icon} variant={variant} size="lg" />
      <div className="flex-1 min-w-0">
        <p className="hub-card-hint">{c.hint}</p>
        <h3 className="font-display font-bold text-text text-lg">{c.title}</h3>
      </div>
      <span className="hub-card-arrow">
        <SectionIcon name="explore" size={18} />
      </span>
    </Link>
  )
}
