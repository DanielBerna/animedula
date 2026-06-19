import IconOrb from './icons/IconOrb'
import { IconName } from './icons/SectionIcon'
import { productShopHref } from '../lib/product-url'

type Props = {
  nombre: string
  descripcion: string
  url: string
  cta?: string
  icon: IconName
  badge?: string
}

export default function CollectibleCard({ nombre, descripcion, url, cta = 'Ver en Mercado Libre', icon, badge }: Props) {
  const href = productShopHref(url)

  return (
    <article className="collect-card enter-up h-full">
      <div className="flex items-center gap-3">
        <IconOrb name={icon} variant="collect" size="md" />
        <div>
          {badge && <span className="tag tag-gold text-[10px] mb-1">{badge}</span>}
          <h4 className="font-display font-semibold text-text">{nombre}</h4>
        </div>
      </div>
      <p className="text-sm text-muted leading-relaxed flex-1">{descripcion}</p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="btn-primary text-xs text-center py-2.5 focus-ring"
      >
        {cta}
      </a>
    </article>
  )
}
