import { fetchJikan, getBestImageUrl } from '../jikan'
import type { ProductoAfiliado } from './types'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function enrichProductosConMal(productos: ProductoAfiliado[]): Promise<ProductoAfiliado[]> {
  const result: ProductoAfiliado[] = []

  for (let i = 0; i < productos.length; i++) {
    const p = productos[i]!
    if (!p.malId) {
      result.push(p)
      continue
    }

    try {
      const data = await fetchJikan(`/manga/${p.malId}`, 86400, 0)
      const cover = getBestImageUrl(data?.data?.images)
      result.push(cover ? { ...p, imagen: cover } : p)
    } catch {
      result.push(p)
    }

    if (i < productos.length - 1) await sleep(350)
  }

  return result
}
