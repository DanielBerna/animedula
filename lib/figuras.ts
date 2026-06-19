import { mercadoLibreSearch } from './shop-links'

export type FiguraCurada = {
  nombre: string
  descripcion: string
  url: string
  cta?: string
  badge?: string
  imagen?: string
}

export const FIGURAS_DESTACADAS: FiguraCurada[] = [
  {
    nombre: 'Figuras premium',
    descripcion: 'Nendoroid, Figma y escalas para coleccionistas exigentes.',
    url: 'https://listado.mercadolibre.com.mx/nendoroid-figura-anime',
    cta: 'Ver en Mercado Libre',
    badge: 'Premium',
  },
  {
    nombre: 'Figuras accesibles',
    descripcion: 'Opciones económicas sin sacrificar estética en tu estante.',
    url: mercadoLibreSearch('figura anime barata'),
    badge: 'Oferta',
  },
  {
    nombre: 'Attack on Titan',
    descripcion: 'Levi, Eren y Mikasa — los más buscados para regalo.',
    url: mercadoLibreSearch('attack on titan figura'),
    badge: 'Top ventas',
  },
  {
    nombre: 'Demon Slayer',
    descripcion: 'Tanjiro y Nezuko — ideal para fans nuevos del anime.',
    url: 'https://www.mercadolibre.com.mx/nendoroid-tanjiro-kamado2nd-re-run/p/MLM24247928',
    badge: 'Regalo',
  },
  {
    nombre: 'Jujutsu Kaisen',
    descripcion: 'Gojo y Sukuna — piezas con mucha presencia en estantería.',
    url: mercadoLibreSearch('jujutsu kaisen figura'),
    badge: 'Tendencia',
  },
  {
    nombre: 'One Piece',
    descripcion: 'Luffy y Zoro — clásicos que no fallan en colección.',
    url: mercadoLibreSearch('one piece figura luffy'),
    badge: 'Clásico',
  },
]
