import type { AffiliatePartner } from '../affiliates'

export type ProductoAfiliado = {
  id: string
  nombre: string
  descripcion: string
  imagen: string
  partner: AffiliatePartner
  query: string
  asin?: string
  precioDesde?: string
  badge?: string
  /** Portada desde Jikan o tracking en /go */
  malId?: number
  /** Título de anime/manga para tracking en /go */
  anime?: string
}
