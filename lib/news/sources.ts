import type { NewsCategory } from '../rss'

/** Sitios oficiales para atribución (crédito a la fuente real). */
export const NEWS_SOURCE_SITES: Record<string, { url: string; label: string }> = {
  'Eurogamer ES': { url: 'https://www.eurogamer.es', label: 'Eurogamer España' },
  LevelUp: { url: 'https://www.levelup.com', label: 'LevelUp' },
  Nintenderos: { url: 'https://www.nintenderos.com', label: 'Nintenderos' },
  Polygon: { url: 'https://www.polygon.com', label: 'Polygon' },
  Xataka: { url: 'https://www.xataka.com', label: 'Xataka' },
  Genbeta: { url: 'https://www.genbeta.com', label: 'Genbeta' },
  'The Verge': { url: 'https://www.theverge.com', label: 'The Verge' },
  'Ramen Para Dos': { url: 'https://ramenparados.com', label: 'Ramen Para Dos' },
  Kudasai: { url: 'https://somoskudasai.com', label: 'Kudasai' },
  'Anime News Network': { url: 'https://www.animenewsnetwork.com', label: 'Anime News Network' },
}

export const NEWS_CATEGORY_SOURCES: Record<NewsCategory, string> = {
  gaming: 'Videojuegos',
  tech: 'Tecnología',
  collect: 'Anime y cultura otaku',
}

export function getSourceSite(sourceName: string): { url: string; label: string } | null {
  return NEWS_SOURCE_SITES[sourceName] || null
}

export function attributionLine(sourceName: string): string {
  const site = getSourceSite(sourceName)
  if (site) return `Fuente: ${site.label}`
  return `Fuente: ${sourceName}`
}
