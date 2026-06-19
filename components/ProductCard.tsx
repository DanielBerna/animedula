import Image from 'next/image'
import { productShopHref } from '../lib/product-url'
import type { ProductoCatalogo } from '../lib/productos/types'

type Props = {
  producto: ProductoCatalogo
  variant?: 'default' | 'manga'
}

function isMalCdn(url: string) {
  return /myanimelist\.net/i.test(url)
}

export default function ProductCard({ producto, variant = 'default' }: Props) {
  const href = productShopHref(producto.url)
  const cta = producto.cta || 'Ver producto'
  const ratio = variant === 'manga' ? 'aspect-[3/4]' : 'aspect-[4/3]'

  return (
    <article className="product-card enter-up">
      <a href={href} target="_blank" rel="noopener noreferrer sponsored" className="product-card-link group">
        <div className={`product-card-img-wrap ${ratio}`}>
          <Image
            src={producto.imagen}
            alt={producto.nombre}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized={isMalCdn(producto.imagen)}
          />
          {producto.badge && <span className="product-card-badge tag tag-gold">{producto.badge}</span>}
          {producto.precioDesde && (
            <span className="product-card-price">{producto.precioDesde}</span>
          )}
        </div>
        <div className="product-card-body">
          <h3 className="font-display font-semibold text-sm text-text line-clamp-2 leading-snug group-hover:text-accent transition">
            {producto.nombre}
          </h3>
          <p className="text-xs text-muted mt-1.5 line-clamp-2 leading-relaxed flex-1">{producto.descripcion}</p>
          {producto.tienda ? (
            <p className="text-[10px] text-faint mt-1">{producto.tienda}</p>
          ) : null}
          <span className="product-card-cta mt-3">{cta} →</span>
        </div>
      </a>
    </article>
  )
}
