/** Textos de interfaz — español latino, sin “curado” ni marketing vacío */

export const SITE = {
  name: 'Animédula',
  tagline: 'Anime y manga con reseñas propias',
  description: 'Reseñas, listados y guías de anime y manga en español',
} as const

export const NAV = {
  home: 'Inicio',
  explore: 'Explorar',
  seasons: 'Temporadas',
  manga: 'Mangas',
  gaming: 'Videojuegos',
  collect: 'Coleccionables',
  tech: 'Tecnología',
  community: 'Comunidad',
  news: 'Noticias',
} as const

export const NAV_GROUP = {
  animeManga: 'Anime y manga',
  otaku: 'Cultura otaku',
  community: 'Comunidad',
} as const

export const NEWS_COPY = {
  eyebrow: 'Noticias',
  readAt: 'Leer nota',
  empty: 'No pudimos cargar noticias. Intenta de nuevo en unos minutos.',
  featuredTitle: 'Destacadas',
  latestTitle: 'Lo más reciente',
  searchPlaceholder: 'Buscar noticias…',
  searchEmpty: 'Nada coincide con tu búsqueda. Prueba otra palabra o quita el filtro.',
  filterAll: 'Todas',
  filterLabel: 'Filtrar por categoría',
  searchResults: (n: number) => `${n} resultado${n === 1 ? '' : 's'}`,
  goToSection: (name: string) => `Ir a ${name} →`,
  gamingTitle: 'Noticias de videojuegos',
  gamingEmpty: 'Las fuentes de noticias no respondieron. Vuelve a intentar más tarde.',
  techTitle: 'Noticias de tecnología',
  techEmpty: 'No cargamos noticias de tecnología en este momento.',
  collectTitle: 'Noticias de anime y coleccionables',
  collectEmpty: 'No cargamos noticias de coleccionables en este momento.',
  sourcesTitle: 'Fuentes de noticias',
  sourcesNote:
    'Los titulares pertenecen a sus autores. Animédula enlaza al artículo original sin reclamar esos contenidos.',
} as const

export const SECTION_COPY = {
  gamingEyebrow: 'Juegos',
  gamingDesc: 'JRPG, gacha y títulos gratis con estilo anime.',
  gamingAnime: 'Estilo anime',
  gamingFeatured: 'Juegos gratis destacados',
  gamingPopular: 'Los más populares',
  techDesc: 'Gadgets para maratones, lectura digital y tu equipo otaku.',
  collectDesc: 'Figuras, TCG, merch y novedades del mundo anime.',
} as const

export const DETAIL_COPY = {
  readMore: 'Leer noticia',
  readOriginal: 'Leer artículo completo',
  backToGames: 'Volver a videojuegos',
  backToNews: 'Volver a noticias',
  aboutGame: 'Acerca del juego',
  playFree: 'Jugar gratis',
  moreGames: 'Ver más juegos',
  moreNews: 'Ver más noticias',
  developer: 'Desarrollador',
  publisher: 'Editor',
  translationNote:
    'Resumen adaptado al español. El artículo completo y los derechos pertenecen a la fuente indicada.',
  sourceCredit: 'Crédito a la fuente original',
} as const

export const UI = {
  seeReview: 'Ver ficha',
  seeAll: 'Ver todo',
  loading: 'Cargando…',
  errorTitle: 'Algo falló',
  errorBody: 'Prueba recargar la página. Si sigue igual, vuelve en unos minutos.',
  retry: 'Reintentar',
  goHome: 'Ir al inicio',
  affiliateShort: 'Publicidad (AdSense) y enlaces a plataformas externas.',
  affiliateLong:
    'Mostramos anuncios de Google AdSense. Algunos enlaces llevan a streaming o tiendas fuera de Animédula; no controlamos sus precios ni disponibilidad.',
  shopAffiliateNote:
    'Enlaces de afiliado a Mercado Libre. Si compras, podemos recibir una comisión sin costo extra para ti.',
  externalLinkNote: 'Enlaces a Mercado Libre. Revisa vendedor, precio y envío antes de comprar.',
  adLabel: 'Publicidad',
  adPending: 'Espacio publicitario',
  merchTitle: 'Tienda relacionada',
  reportThanks: 'Gracias — revisaremos el reporte.',
} as const

export const REVIEW = {
  title: 'Reseña',
  why: 'Por qué vale la pena',
  forWho: 'Para quién es',
  notFor: 'Pásalo si…',
  practical: 'Cómo disfrutarlo',
  footer: 'Opinión de Animédula. La sinopsis oficial de MAL está más abajo.',
} as const
