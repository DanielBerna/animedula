import ProductCard from './ProductCard'
import type { ProductoAfiliado } from '../lib/productos/types'

type Props = {
  title: string
  productos: ProductoAfiliado[]
  variant?: 'default' | 'manga'
  columns?: '3' | '4'
}

export default function ProductGrid({ title, productos, variant = 'default', columns = '3' }: Props) {
  if (productos.length === 0) return null

  const gridClass =
    columns === '4'
      ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5'
      : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5'

  return (
    <section>
      <div className="section-head">
        <h2 className="font-display text-lg font-bold text-text">{title}</h2>
        <span className="tag tag-accent">{productos.length}</span>
      </div>
      <div className={gridClass}>
        {productos.map((p) => (
          <ProductCard key={p.id} producto={p} variant={variant} />
        ))}
      </div>
    </section>
  )
}
