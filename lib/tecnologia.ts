import type { IconName } from '../components/icons/SectionIcon'

export type TechProduct = {
  nombre: string
  descripcion: string
  query: string
  icon: IconName
  badge?: string
  categoria: 'audio' | 'pantalla' | 'setup' | 'mobile'
}

export const TECH_PRODUCTS: TechProduct[] = [
  {
    nombre: 'Audífonos ANC',
    descripcion: 'Inmersión total para maratones nocturnas sin molestar a nadie.',
    query: 'audifonos cancelacion ruido anime',
    icon: 'headphones',
    badge: 'Maratón',
    categoria: 'audio',
  },
  {
    nombre: 'Monitor 144Hz+',
    descripcion: 'Fluido para acción, deportes y sakuga bien animado.',
    query: 'monitor 144hz gaming',
    icon: 'monitor',
    badge: 'Equipo',
    categoria: 'pantalla',
  },
  {
    nombre: 'Tablet lectura',
    descripcion: 'Ideal para manga digital y novelas ligeras en cama.',
    query: 'tablet lectura manga',
    icon: 'tablet',
    badge: 'Manga',
    categoria: 'mobile',
  },
  {
    nombre: 'Barra de luz RGB',
    descripcion: 'Ambiente otaku para tu escritorio o vitrina de figuras.',
    query: 'luz led rgb escritorio',
    icon: 'light',
    badge: 'Ambiente',
    categoria: 'setup',
  },
  {
    nombre: 'Silla ergonómica',
    descripcion: 'Para seasons de 24 eps seguidos sin destruir tu espalda.',
    query: 'silla ergonomica gaming',
    icon: 'chair',
    badge: 'Confort',
    categoria: 'setup',
  },
  {
    nombre: 'Proyector portátil',
    descripcion: 'Anime en la pared — cine en casa estilo sala de fans.',
    query: 'proyector portatil hd',
    icon: 'projector',
    badge: 'Cine',
    categoria: 'pantalla',
  },
]
