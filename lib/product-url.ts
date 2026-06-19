import { buildGoUrl } from './affiliates'
import { isShopEnabled } from './shop-config'

/** Enlace de producto con tracking /go cuando la tienda está activa. */
export function productShopHref(url: string, query?: string): string {
  if (!isShopEnabled()) return url
  if (query) {
    return buildGoUrl('mercadolibre', { query, dest: url })
  }
  return buildGoUrl('mercadolibre', { dest: url })
}
