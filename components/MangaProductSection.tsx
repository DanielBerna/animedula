import ProductGrid from './ProductGrid'
import AffiliateDisclosure from './AffiliateDisclosure'
import { isShopEnabled } from '../lib/shop-config'
import { mangaProductosParaTitulo } from '../lib/productos'
import type { ProductoCatalogo } from '../lib/productos/types'

type Props = {
  title: string
  coverImage?: string | null
}

export default function MangaProductSection({ title, coverImage }: Props) {
  if (!isShopEnabled()) return null

  const productos: ProductoCatalogo[] = mangaProductosParaTitulo(title).map((p, i) =>
    i === 0 && coverImage ? { ...p, imagen: coverImage } : p
  )

  return (
    <div className="space-y-4">
      <ProductGrid title="Comprar tomos" productos={productos} variant="manga" columns="3" />
      <AffiliateDisclosure compact />
    </div>
  )
}
