import { mercadoLibreSearch } from '../shop-links'
import type { ProductoCatalogo } from './types'

const U = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&q=80`

export const MANGA_PRODUCTOS: ProductoCatalogo[] = [
  {
    id: 'manga-op',
    nombre: 'One Piece — Tomo 1 (Panini)',
    descripcion: 'El inicio de la gran aventura de Luffy — edición en español.',
    imagen: U('photo-1544947950-fa07a98d237f'),
    malId: 13,
    url: 'https://articulo.mercadolibre.com.mx/MLM-1527517412-one-piece-manga-en-espanol-tomo-a-elegir-_JM',
    cta: 'Ver en Mercado Libre',
    tienda: 'Mercado Libre',
    precioDesde: 'Desde ~$129',
    badge: 'Shōnen',
  },
  {
    id: 'manga-berserk',
    nombre: 'Berserk — Tomo 1',
    descripcion: 'Oscuro, épico y referencia del seinen.',
    imagen: U('photo-1544716278-e513176d4bfe'),
    malId: 2,
    url: mercadoLibreSearch('berserk manga tomo 1 panini'),
    cta: 'Ver opciones',
    tienda: 'Mercado Libre',
    precioDesde: 'Consultar precio',
    badge: 'Seinen',
  },
  {
    id: 'manga-csm',
    nombre: 'Chainsaw Man — Tomo 1',
    descripcion: 'Locura, acción y hype reciente.',
    imagen: U('photo-1512820790803-83ca734da794'),
    malId: 116778,
    url: mercadoLibreSearch('chainsaw man manga tomo 1'),
    cta: 'Ver opciones',
    tienda: 'Mercado Libre',
    precioDesde: 'Consultar precio',
    badge: 'Tendencia',
  },
  {
    id: 'manga-spy',
    nombre: 'Spy × Family — Tomo 1',
    descripcion: 'Comedia familiar perfecta para empezar.',
    imagen: U('photo-1495446815901-a7297e633e8d'),
    malId: 121849,
    url: mercadoLibreSearch('spy x family manga tomo 1'),
    cta: 'Ver opciones',
    tienda: 'Mercado Libre',
    precioDesde: 'Consultar precio',
    badge: 'Comedia',
  },
  {
    id: 'manga-jjk',
    nombre: 'Jujutsu Kaisen — Tomo 1',
    descripcion: 'Exorcismo moderno con ritmo trepidante.',
    imagen: U('photo-1589998055854-a24f43d6a1c5'),
    malId: 113138,
    url: mercadoLibreSearch('jujutsu kaisen manga tomo 1 panini'),
    cta: 'Ver opciones',
    tienda: 'Mercado Libre',
    precioDesde: 'Consultar precio',
    badge: 'Shōnen',
  },
  {
    id: 'manga-dn',
    nombre: 'Death Note — Tomo 1',
    descripcion: 'Thriller psicológico imprescindible.',
    imagen: U('photo-1543002588-bfa74002ed7e'),
    malId: 1530,
    url: mercadoLibreSearch('death note manga tomo 1'),
    cta: 'Ver opciones',
    tienda: 'Mercado Libre',
    precioDesde: 'Consultar precio',
    badge: 'Clásico',
  },
]

export function mangaProductosParaTitulo(title: string): ProductoCatalogo[] {
  const q = `${title} manga tomo 1 panini`
  return [
    {
      id: `buy-tomo-${title.slice(0, 24)}`,
      nombre: `${title} — Tomo 1`,
      descripcion: 'Edición en español — revisa vendedor, stock y envío.',
      imagen: U('photo-1544947950-fa07a98d237f'),
      url: mercadoLibreSearch(q),
      cta: 'Ver en Mercado Libre',
      tienda: 'Mercado Libre',
      precioDesde: 'Consultar precio',
      badge: 'Tomo',
    },
    {
      id: `buy-pack-${title.slice(0, 24)}`,
      nombre: `Pack de tomos — ${title}`,
      descripcion: 'Paquetes con varios volúmenes para seguir la lectura.',
      imagen: U('photo-1512820790803-83ca734da794'),
      url: mercadoLibreSearch(`${title} manga pack panini`),
      cta: 'Ver packs',
      tienda: 'Mercado Libre',
      precioDesde: 'Consultar precio',
      badge: 'Pack',
    },
  ]
}
