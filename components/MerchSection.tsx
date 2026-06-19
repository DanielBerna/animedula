import ProductCard from './ProductCard'
import AffiliateDisclosure from './AffiliateDisclosure'
import { getSuggestedMerch } from '../lib/affiliates'
import { isShopEnabled } from '../lib/shop-config'
import { UI } from '../lib/copy'
import type { ProductoCatalogo } from '../lib/productos/types'

type Props = {
  animeTitle: string
  malId?: number
}

export default function MerchSection({ animeTitle }: Props) {
  if (!isShopEnabled()) return null

  const items = getSuggestedMerch(animeTitle)

  const productos: ProductoCatalogo[] = items.map((item) => ({
    id: item.id,
    nombre: item.label,
    descripcion: item.description,
    imagen: item.imagen || 'https://images.unsplash.com/photo-1601811833011-2039bfee4c4e?auto=format&fit=crop&w=800&q=80',
    url: item.url,
    cta: item.cta,
    tienda: 'Mercado Libre',
    badge: item.badge,
    precioDesde: 'Consultar precio',
  }))

  return (
    <section className="card-glass p-5 md:p-6">
      <h3 className="font-display text-lg font-semibold text-text mb-1">{UI.merchTitle}</h3>
      <p className="text-xs text-muted mb-5">{UI.shopAffiliateNote}</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {productos.map((p) => (
          <ProductCard key={p.id} producto={p} />
        ))}
      </div>

      <div className="mt-4">
        <AffiliateDisclosure compact />
      </div>
    </section>
  )
}
