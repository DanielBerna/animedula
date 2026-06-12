export type FiguraCurada = {
  nombre: string
  descripcion: string
  query: string
  partner: 'amazon' | 'mercadolibre'
  badge?: string
  imagen?: string
}

/** Picks editoriales iniciales — reemplazar con selección admin más adelante */
export const FIGURAS_DESTACADAS: FiguraCurada[] = [
  {
    nombre: 'Figuras premium',
    descripcion: 'Nendoroid, Figma y escalas para coleccionistas exigentes.',
    query: 'nendoroid anime figura',
    partner: 'amazon',
    badge: 'Premium',
  },
  {
    nombre: 'Figuras accesibles',
    descripcion: 'Opciones económicas sin sacrificar estética en tu estante.',
    query: 'figura anime barata coleccion',
    partner: 'mercadolibre',
    badge: 'Oferta',
  },
  {
    nombre: 'Attack on Titan',
    descripcion: 'Levi, Eren y Mikasa — los más buscados para regalo.',
    query: 'attack on titan figura',
    partner: 'amazon',
    badge: 'Top ventas',
  },
  {
    nombre: 'Demon Slayer',
    descripcion: 'Tanjiro y Nezuko — ideal para fans nuevos del anime.',
    query: 'demon slayer kimetsu figura',
    partner: 'amazon',
    badge: 'Regalo',
  },
  {
    nombre: 'Jujutsu Kaisen',
    descripcion: 'Gojo y Sukuna — piezas con mucha presencia en estantería.',
    query: 'jujutsu kaisen figura',
    partner: 'mercadolibre',
    badge: 'Tendencia',
  },
  {
    nombre: 'One Piece',
    descripcion: 'Luffy y Zoro — clásicos que no fallan en colección.',
    query: 'one piece figura luffy',
    partner: 'amazon',
    badge: 'Clásico',
  },
]
