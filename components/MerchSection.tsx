import AffiliateDisclosure from './AffiliateDisclosure'
import ProductCard from './ProductCard'
import { getSuggestedMerch } from '../lib/affiliates'
import { UI } from '../lib/copy'
import type { ProductoAfiliado } from '../lib/productos/types'

type Props = {
  animeTitle: string
  malId?: number
}

export default function MerchSection({ animeTitle, malId }: Props) {
  const items = getSuggestedMerch(animeTitle)

  const productos: ProductoAfiliado[] = items.map((item) => ({
    id: item.id,
    nombre: item.label,
    descripcion: item.description,
    imagen: item.imagen || 'https://images.unsplash.com/photo-1601811833011-2039bfee4c4e?auto=format&fit=crop&w=800&q=80',
    partner: item.partner,
    query: item.query,
    badge: item.badge,
    precioDesde: 'Ver ofertas',
    anime: animeTitle,
    malId,
  }))

  return (
    <section className="card-glass p-5 md:p-6">
      <h3 className="font-display text-lg font-semibold text-text mb-5">{UI.merchTitle}</h3>

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
