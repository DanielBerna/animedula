export type TechProduct = {
  nombre: string
  descripcion: string
  query: string
  icon: string
  badge?: string
  categoria: 'audio' | 'pantalla' | 'setup' | 'mobile'
}

export const TECH_PRODUCTS: TechProduct[] = [
  {
    nombre: 'Audífonos ANC',
    descripcion: 'Inmersión total para maratones nocturnas sin molestar a nadie.',
    query: 'audifonos cancelacion ruido anime',
    icon: '🎧',
    badge: 'Maratón',
    categoria: 'audio',
  },
  {
    nombre: 'Monitor 144Hz+',
    descripcion: 'Fluido para acción, deportes y sakuga bien animado.',
    query: 'monitor 144hz gaming',
    icon: '🖥️',
    badge: 'Setup',
    categoria: 'pantalla',
  },
  {
    nombre: 'Tablet lectura',
    descripcion: 'Ideal para manga digital y novelas ligeras en cama.',
    query: 'tablet lectura manga',
    icon: '📱',
    badge: 'Manga',
    categoria: 'mobile',
  },
  {
    nombre: 'Barra de luz RGB',
    descripcion: 'Ambiente otaku para tu escritorio o vitrina de figuras.',
    query: 'luz led rgb escritorio',
    icon: '💡',
    badge: 'Ambiente',
    categoria: 'setup',
  },
  {
    nombre: 'Silla ergonómica',
    descripcion: 'Para seasons de 24 eps seguidos sin destruir tu espalda.',
    query: 'silla ergonomica gaming',
    icon: '🪑',
    badge: 'Comfort',
    categoria: 'setup',
  },
  {
    nombre: 'Proyector portátil',
    descripcion: 'Anime en la pared — cine en casa estilo sala de fans.',
    query: 'proyector portatil hd',
    icon: '📽️',
    badge: 'Cine',
    categoria: 'pantalla',
  },
]
