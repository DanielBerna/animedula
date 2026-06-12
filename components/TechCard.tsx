import { buildGoUrl } from '../lib/affiliates'
import IconOrb from './icons/IconOrb'
import { IconName } from './icons/SectionIcon'

type Props = {
  nombre: string
  descripcion: string
  query: string
  icon: IconName
  badge?: string
}

export default function TechCard({ nombre, descripcion, query, icon, badge }: Props) {
  const url = buildGoUrl('amazon', { query })

  return (
    <article className="tech-card enter-up flex flex-col h-full">
      <div className="flex items-start gap-3">
        <IconOrb name={icon} variant="tech" size="md" />
        <div className="flex-1">
          {badge && <span className="tag tag-sec text-[10px] mb-1.5">{badge}</span>}
          <h4 className="font-display font-semibold text-text">{nombre}</h4>
          <p className="text-sm text-muted mt-1 leading-relaxed">{descripcion}</p>
        </div>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="mt-4 btn-primary text-xs text-center py-2.5 focus-ring tech-card-cta"
      >
        Ver en Amazon
      </a>
    </article>
  )
}
