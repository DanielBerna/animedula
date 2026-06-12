import { buildGoUrl } from '../lib/affiliates'

type Props = {
  nombre: string
  descripcion: string
  query: string
  partner: 'amazon' | 'mercadolibre'
  icon: string
  badge?: string
}

export default function CollectibleCard({ nombre, descripcion, query, partner, icon, badge }: Props) {
  const url = buildGoUrl(partner, { query })

  return (
    <article className="collect-card enter-up h-full">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <div>
          {badge && <span className="tag tag-gold text-[10px] mb-1">{badge}</span>}
          <h4 className="font-display font-semibold text-text">{nombre}</h4>
        </div>
      </div>
      <p className="text-sm text-muted leading-relaxed flex-1">{descripcion}</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="btn-primary text-xs text-center py-2.5 focus-ring"
      >
        {partner === 'mercadolibre' ? 'Buscar en ML' : 'Ver en Amazon'}
      </a>
    </article>
  )
}
