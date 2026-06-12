import ProductGrid from './ProductGrid'
import AffiliateDisclosure from './AffiliateDisclosure'
import { mangaProductosParaTitulo } from '../lib/productos'
import type { ProductoAfiliado } from '../lib/productos/types'

type Props = {
  title: string
  coverImage?: string | null
}

export default function MangaProductSection({ title, coverImage }: Props) {
  const productos: ProductoAfiliado[] = mangaProductosParaTitulo(title).map((p, i) =>
    i === 0 && coverImage ? { ...p, imagen: coverImage } : p
  )

  return (
    <div className="space-y-4">
      <ProductGrid title="Comprar tomos" productos={productos} variant="manga" columns="3" />
      <AffiliateDisclosure compact />
    </div>
  )
}
