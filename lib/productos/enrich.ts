import { fetchJikan, getBestImageUrl } from '../jikan'
import type { ProductoAfiliado } from './types'

export async function enrichProductosConMal(productos: ProductoAfiliado[]): Promise<ProductoAfiliado[]> {
  return Promise.all(
    productos.map(async (p) => {
      if (!p.malId) return p
      try {
        const data = await fetchJikan(`/manga/${p.malId}`, 21600)
        const cover = getBestImageUrl(data?.data?.images)
        return cover ? { ...p, imagen: cover } : p
      } catch {
        return p
      }
    })
  )
}
