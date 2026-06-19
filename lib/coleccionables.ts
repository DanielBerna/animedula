import type { IconName } from '../components/icons/SectionIcon'
import { mercadoLibreSearch } from './shop-links'

export type Coleccionable = {
  nombre: string
  descripcion: string
  url: string
  cta?: string
  icon: IconName
  tipo: 'figura' | 'tcg' | 'peluche' | 'poster' | 'blu-ray'
  badge?: string
}

export const COLECCIONABLES: Coleccionable[] = [
  {
    nombre: 'Figuras premium',
    descripcion: 'Nendoroid, Figma y escalas para coleccionistas.',
    url: 'https://listado.mercadolibre.com.mx/nendoroid-figura-anime',
    cta: 'Ver en Mercado Libre',
    icon: 'figure',
    tipo: 'figura',
    badge: 'Premium',
  },
  {
    nombre: 'Cartas & TCG',
    descripcion: 'Pokémon, Weiss Schwarz y trading cards de anime.',
    url: mercadoLibreSearch('cartas anime tcg booster'),
    cta: 'Ver opciones',
    icon: 'tcg',
    tipo: 'tcg',
    badge: 'TCG',
  },
  {
    nombre: 'Peluches & plush',
    descripcion: 'Regalos kawaii que no fallan.',
    url: mercadoLibreSearch('peluche anime kawaii'),
    cta: 'Ver opciones',
    icon: 'plush',
    tipo: 'peluche',
    badge: 'Regalo',
  },
  {
    nombre: 'Posters & wall scroll',
    descripcion: 'Decora tu cuarto con arte oficial.',
    url: mercadoLibreSearch('poster anime wall scroll'),
    cta: 'Ver opciones',
    icon: 'poster',
    tipo: 'poster',
    badge: 'Decoración',
  },
  {
    nombre: 'Blu-ray & ediciones',
    descripcion: 'Colección física para los que aman rewatch.',
    url: mercadoLibreSearch('anime blu ray edicion'),
    cta: 'Ver opciones',
    icon: 'bluray',
    tipo: 'blu-ray',
    badge: 'Físico',
  },
  {
    nombre: 'Figuras accesibles',
    descripcion: 'Opciones económicas sin sacrificar estética.',
    url: mercadoLibreSearch('figura anime economica'),
    cta: 'Ver opciones',
    icon: 'sparkle',
    tipo: 'figura',
    badge: 'Económico',
  },
]
