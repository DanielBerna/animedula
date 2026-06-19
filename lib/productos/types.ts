export type ProductoCatalogo = {
  id: string
  nombre: string
  descripcion: string
  imagen: string
  /** Enlace directo al producto o listado en tienda */
  url: string
  cta?: string
  tienda?: string
  precioDesde?: string
  badge?: string
  malId?: number
}

/** @deprecated Usar ProductoCatalogo */
export type ProductoAfiliado = ProductoCatalogo
