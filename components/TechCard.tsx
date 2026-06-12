import { buildGoUrl } from '../lib/affiliates'

type Props = {
  nombre: string
  descripcion: string
  query: string
  icon: string
  badge?: string
}

export default function TechCard({ nombre, descripcion, query, icon, badge }: Props) {
  const url = buildGoUrl('amazon', { query })

  return (
    <article className="tech-card enter-up flex flex-col h-full">
      <div className="flex items-start gap-3">
        <div className="tech-icon">{icon}</div>
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
        className="mt-4 btn-primary text-xs text-center py-2.5 focus-ring"
        style={{ background: 'linear-gradient(135deg, #22D3EE, #0891B2)' }}
      >
        Ver en Amazon México
      </a>
    </article>
  )
}
