export type Coleccionable = {
  nombre: string
  descripcion: string
  query: string
  partner: 'amazon' | 'mercadolibre'
  icon: string
  tipo: 'figura' | 'tcg' | 'peluche' | 'poster' | 'blu-ray'
  badge?: string
}

export const COLECCIONABLES: Coleccionable[] = [
  {
    nombre: 'Figuras premium',
    descripcion: 'Nendoroid, Figma y escalas para coleccionistas.',
    query: 'nendoroid figura anime',
    partner: 'amazon',
    icon: '🎎',
    tipo: 'figura',
    badge: 'Premium',
  },
  {
    nombre: 'Cartas & TCG',
    descripcion: 'Pokémon, Weiss Schwarz y trading cards de anime.',
    query: 'cartas anime tcg',
    partner: 'mercadolibre',
    icon: '🃏',
    tipo: 'tcg',
    badge: 'TCG',
  },
  {
    nombre: 'Peluches & plush',
    descripcion: 'Regalos kawaii que no fallan.',
    query: 'peluche anime kawaii',
    partner: 'amazon',
    icon: '🧸',
    tipo: 'peluche',
    badge: 'Regalo',
  },
  {
    nombre: 'Posters & wall scroll',
    descripcion: 'Decora tu cuarto con arte oficial.',
    query: 'poster anime wall scroll',
    partner: 'mercadolibre',
    icon: '🖼️',
    tipo: 'poster',
    badge: 'Decor',
  },
  {
    nombre: 'Blu-ray & ediciones',
    descripcion: 'Colección física para los que aman rewatch.',
    query: 'anime blu ray coleccion',
    partner: 'amazon',
    icon: '💿',
    tipo: 'blu-ray',
    badge: 'Físico',
  },
  {
    nombre: 'Figuras accesibles',
    descripcion: 'Opciones económicas sin sacrificar estética.',
    query: 'figura anime barata',
    partner: 'mercadolibre',
    icon: '⭐',
    tipo: 'figura',
    badge: 'LATAM',
  },
]
