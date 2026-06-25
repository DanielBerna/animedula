/**
 * Catálogo curado de premios para Animédula.
 * Rarezas, plantillas de marcos, packs de stickers e insignias épicas/legendarias.
 * Lo consume el panel de administración para ofrecer opciones listas para usar.
 */

export type Rarity = 'comun' | 'raro' | 'epico' | 'legendario' | 'mitico'

export type RarityDef = {
  id: Rarity
  label: string
  color: string
  glow: string
  /** Precio sugerido en monedas */
  price: number
}

export const RARITIES: RarityDef[] = [
  { id: 'comun', label: 'Común', color: '#9ca3af', glow: 'rgba(156,163,175,0.35)', price: 50 },
  { id: 'raro', label: 'Raro', color: '#38bdf8', glow: 'rgba(56,189,248,0.45)', price: 150 },
  { id: 'epico', label: 'Épico', color: '#a855f7', glow: 'rgba(168,85,247,0.5)', price: 400 },
  { id: 'legendario', label: 'Legendario', color: '#f5b301', glow: 'rgba(245,179,1,0.55)', price: 1000 },
  { id: 'mitico', label: 'Mítico / Único', color: '#ff4d6d', glow: 'rgba(255,77,109,0.6)', price: 2500 },
]

export const rarityById = (id?: string): RarityDef =>
  RARITIES.find((r) => r.id === id) || RARITIES[0]

/** Marcos de avatar (clases CSS reales en globals.css) */
export type BorderPreset = {
  css_class: string
  name: string
  rarity: Rarity
  description: string
}

export const BORDER_PRESETS: BorderPreset[] = [
  {
    css_class: 'cosmetic-border-sakura',
    name: 'Pétalos de Sakura',
    rarity: 'comun',
    description: 'Degradado rosa suave inspirado en los cerezos en flor.',
  },
  {
    css_class: 'cosmetic-border-neon',
    name: 'Neón Cyber',
    rarity: 'raro',
    description: 'Gradiente cyan-violeta estilo ciudad nocturna.',
  },
  {
    css_class: 'cosmetic-border-ember',
    name: 'Llama Shōnen',
    rarity: 'epico',
    description: 'Fuego ardiente para los protagonistas más intensos.',
  },
  {
    css_class: 'cosmetic-border-abyssal',
    name: 'Marea Abisal',
    rarity: 'epico',
    description: 'Profundidades oceánicas con destellos turquesa.',
  },
  {
    css_class: 'cosmetic-border-legendary',
    name: 'Oro Legendario',
    rarity: 'legendario',
    description: 'Oro animado con brillo. Solo para leyendas.',
  },
  {
    css_class: 'cosmetic-border-holo',
    name: 'Holo Prisma',
    rarity: 'legendario',
    description: 'Arcoíris holográfico en movimiento continuo.',
  },
  {
    css_class: 'cosmetic-border-celestial',
    name: 'Aura Celestial',
    rarity: 'mitico',
    description: 'Halo divino dorado-blanco con pulso de luz.',
  },
  {
    css_class: 'cosmetic-border-cosmic',
    name: 'Vacío Cósmico',
    rarity: 'mitico',
    description: 'Nebulosa giratoria con estrellas. Pieza única del sitio.',
  },
]

/** Plantillas de packs de stickers (emojis temáticos) */
export type StickerTemplate = {
  slug: string
  name: string
  rarity: Rarity
  stickers: { id: string; emoji: string; label: string }[]
}

export const STICKER_TEMPLATES: StickerTemplate[] = [
  {
    slug: 'pack-otaku',
    name: 'Pack Otaku',
    rarity: 'comun',
    stickers: [
      { id: 'waifu', emoji: '💕', label: 'Waifu' },
      { id: 'nakama', emoji: '🤝', label: 'Nakama' },
      { id: 'senpai', emoji: '🎓', label: 'Senpai' },
      { id: 'baka', emoji: '😤', label: 'Baka' },
      { id: 'sugoi', emoji: '✨', label: 'Sugoi' },
      { id: 'nani', emoji: '⁉️', label: 'Nani' },
    ],
  },
  {
    slug: 'pack-emociones',
    name: 'Emociones Anime',
    rarity: 'raro',
    stickers: [
      { id: 'sonrojo', emoji: '😳', label: 'Sonrojo' },
      { id: 'llanto', emoji: '😭', label: 'Llanto épico' },
      { id: 'rabia', emoji: '😡', label: 'Furia' },
      { id: 'amor', emoji: '😍', label: 'Enamorado' },
      { id: 'risa', emoji: '🤣', label: 'Risa' },
    ],
  },
  {
    slug: 'pack-batalla',
    name: 'Modo Batalla',
    rarity: 'epico',
    stickers: [
      { id: 'katana', emoji: '⚔️', label: 'Katana' },
      { id: 'kamehameha', emoji: '💥', label: 'Kamehameha' },
      { id: 'fuego', emoji: '🔥', label: 'Hype' },
      { id: 'rayo', emoji: '⚡', label: 'Poder' },
      { id: 'escudo', emoji: '🛡️', label: 'Defensa' },
    ],
  },
  {
    slug: 'pack-leyenda',
    name: 'Pack Leyenda',
    rarity: 'legendario',
    stickers: [
      { id: 'corona', emoji: '👑', label: 'Rey' },
      { id: 'dragon', emoji: '🐉', label: 'Dragón' },
      { id: 'estrella', emoji: '🌟', label: 'Estrella' },
      { id: 'trofeo', emoji: '🏆', label: 'Campeón' },
    ],
  },
]

/** Plantillas de insignias épicas/legendarias únicas del sitio */
export type BadgeTemplate = {
  slug: string
  name: string
  description: string
  category: string
  rarity: Rarity
  emoji: string
}

export const BADGE_TEMPLATES: BadgeTemplate[] = [
  {
    slug: 'fundador',
    name: 'Fundador de Animédula',
    description: 'Estuvo aquí desde el comienzo. Un pilar de la comunidad.',
    category: 'comunidad',
    rarity: 'mitico',
    emoji: '🌱',
  },
  {
    slug: 'critico-legendario',
    name: 'Crítico Legendario',
    description: 'Sus reseñas marcan tendencia. Una pluma de oro.',
    category: 'reseñas',
    rarity: 'legendario',
    emoji: '🖋️',
  },
  {
    slug: 'maratonista',
    name: 'Maratonista Imparable',
    description: 'Completó temporadas enteras sin pestañear.',
    category: 'anime',
    rarity: 'epico',
    emoji: '🎬',
  },
  {
    slug: 'devorador-manga',
    name: 'Devorador de Manga',
    description: 'Mil capítulos y contando. La biblioteca le teme.',
    category: 'manga',
    rarity: 'epico',
    emoji: '📚',
  },
  {
    slug: 'sabio-foro',
    name: 'Sabio del Foro',
    description: 'Sus aportes iluminan cada debate de la comunidad.',
    category: 'foro',
    rarity: 'legendario',
    emoji: '🦉',
  },
  {
    slug: 'cazador-estrenos',
    name: 'Cazador de Estrenos',
    description: 'Siempre el primero en descubrir lo nuevo de la temporada.',
    category: 'comunidad',
    rarity: 'raro',
    emoji: '🎯',
  },
  {
    slug: 'mecenas',
    name: 'Mecenas Premium',
    description: 'Apoya al sitio y mantiene viva la llama otaku.',
    category: 'premium',
    rarity: 'legendario',
    emoji: '💎',
  },
  {
    slug: 'guardian',
    name: 'Guardián de la Comunidad',
    description: 'Mantiene el orden y la buena vibra. Respeto absoluto.',
    category: 'moderacion',
    rarity: 'mitico',
    emoji: '🛡️',
  },
]

export const BADGE_CATEGORIES = [
  'general',
  'comunidad',
  'reseñas',
  'anime',
  'manga',
  'foro',
  'premium',
  'moderacion',
]
