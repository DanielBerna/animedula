import type { ProductoAfiliado } from './types'

const U = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&q=80`

/** Tomos destacados — portada vía malId enriquecido en servidor */
export const MANGA_PRODUCTOS: ProductoAfiliado[] = [
  {
    id: 'manga-op',
    nombre: 'One Piece — Tomo 1',
    descripcion: 'El inicio de la gran aventura de Luffy.',
    imagen: U('photo-1544947950-fa07a98d237f'),
    malId: 13,
    partner: 'amazon',
    query: 'one piece manga tomo 1 español',
    precioDesde: 'Desde $199',
    badge: 'Shōnen',
  },
  {
    id: 'manga-berserk',
    nombre: 'Berserk — Tomo 1',
    descripcion: 'Oscuro, épico y referencia del seinen.',
    imagen: U('photo-1544716278-e513176d4bfe'),
    malId: 2,
    partner: 'amazon',
    query: 'berserk manga tomo 1',
    precioDesde: 'Desde $249',
    badge: 'Seinen',
  },
  {
    id: 'manga-csm',
    nombre: 'Chainsaw Man — Tomo 1',
    descripcion: 'Locura, acción y hype reciente.',
    imagen: U('photo-1512820790803-83ca734da794'),
    malId: 116778,
    partner: 'mercadolibre',
    query: 'chainsaw man manga tomo 1',
    precioDesde: 'Desde $179',
    badge: 'Tendencia',
  },
  {
    id: 'manga-spy',
    nombre: 'Spy × Family — Tomo 1',
    descripcion: 'Comedia familiar perfecta para empezar.',
    imagen: U('photo-1495446815901-a7297e633e8d'),
    malId: 121849,
    partner: 'amazon',
    query: 'spy x family manga tomo 1',
    precioDesde: 'Desde $169',
    badge: 'Comedia',
  },
  {
    id: 'manga-jjk',
    nombre: 'Jujutsu Kaisen — Tomo 1',
    descripcion: 'Exorcismo moderno con ritmo trepidante.',
    imagen: U('photo-1589998055854-a24f43d6a1c5'),
    malId: 113138,
    partner: 'amazon',
    query: 'jujutsu kaisen manga tomo 1',
    precioDesde: 'Desde $179',
    badge: 'Shōnen',
  },
  {
    id: 'manga-dn',
    nombre: 'Death Note — Tomo 1',
    descripcion: 'Thriller psicológico imprescindible.',
    imagen: U('photo-1543002588-bfa74002ed7e'),
    malId: 1530,
    partner: 'mercadolibre',
    query: 'death note manga tomo 1',
    precioDesde: 'Desde $189',
    badge: 'Clásico',
  },
]

export function mangaProductosParaTitulo(title: string): ProductoAfiliado[] {
  const base = title.replace(/[^\w\sáéíóúñÁÉÍÓÚÑ]/g, '').trim()
  return [
    {
      id: `buy-tomo-${base}`,
      nombre: `${title} — Tomo 1`,
      descripcion: 'Edición en español — revisa disponibilidad y stock.',
      imagen: U('photo-1544947950-fa07a98d237f'),
      partner: 'amazon',
      query: `${title} manga tomo 1 español`,
      precioDesde: 'Ver precio',
      badge: 'Tomo',
    },
    {
      id: `buy-box-${base}`,
      nombre: `Pack / tomos de ${title}`,
      descripcion: 'Cajas y packs para seguir la lectura.',
      imagen: U('photo-1512820790803-83ca734da794'),
      partner: 'amazon',
      query: `${title} manga pack tomos`,
      precioDesde: 'Ver packs',
      badge: 'Pack',
    },
    {
      id: `buy-ml-${base}`,
      nombre: `${title} en Mercado Libre`,
      descripcion: 'Compara usados, nuevos y envío local.',
      imagen: U('photo-1495446815901-a7297e633e8d'),
      partner: 'mercadolibre',
      query: `${title} manga tomo`,
      precioDesde: 'Comparar',
      badge: 'Oferta',
    },
  ]
}
