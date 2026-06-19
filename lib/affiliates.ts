import {
  crunchyrollSearch,
  mercadoLibreAffiliateUrl,
  mercadoLibreSearch,
  netflixSearch,
  primeVideoSearch,
} from './shop-links'

export type StreamingPartner = 'crunchyroll' | 'netflix' | 'prime'

export type MerchItem = {
  id: string
  label: string
  description: string
  url: string
  cta: string
  badge?: string
  imagen?: string
}

export function getSuggestedMerch(animeTitle: string): MerchItem[] {
  return [
    {
      id: 'figura',
      label: 'Figuras de colección',
      description: `Piezas relacionadas con ${animeTitle}.`,
      url: mercadoLibreSearch(`figura ${animeTitle}`),
      cta: 'Ver en Mercado Libre',
      badge: 'Colección',
      imagen: 'https://images.unsplash.com/photo-1601811833011-2039bfee4c4e?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'manga',
      label: 'Manga / Blu-ray',
      description: 'Ediciones físicas para maratón o biblioteca.',
      url: mercadoLibreSearch(`${animeTitle} manga tomo panini`),
      cta: 'Ver en Mercado Libre',
      badge: 'Lectura',
      imagen: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'merch',
      label: 'Merchandising',
      description: 'Posters, peluches y más en tiendas locales.',
      url: mercadoLibreSearch(`${animeTitle} merch anime`),
      cta: 'Ver opciones',
      badge: 'Merch',
      imagen: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80',
    },
  ]
}

/** @deprecated Usar getSuggestedMerch */
export const getCuratedMerch = getSuggestedMerch

export function resolveStreamingUrl(partner: StreamingPartner, title?: string): string {
  switch (partner) {
    case 'crunchyroll':
      return crunchyrollSearch(title || '')
    case 'netflix':
      return netflixSearch(title || '')
    case 'prime':
      return primeVideoSearch(title || '')
    default:
      return '/'
  }
}

/** Redirección interna opcional (sin tags de afiliado) */
export function buildGoUrl(
  partner: StreamingPartner | 'mercadolibre',
  opts: { query?: string; dest?: string; anime?: string }
): string {
  const params = new URLSearchParams()
  if (opts.query) params.set('q', opts.query)
  if (opts.dest) params.set('dest', opts.dest)
  if (opts.anime) params.set('anime', opts.anime)
  const qs = params.toString()
  return `/go/${partner}${qs ? `?${qs}` : ''}`
}

export function resolveGoUrl(
  partner: StreamingPartner | 'mercadolibre',
  opts: { query?: string; anime?: string; dest?: string }
): string {
  if (partner === 'mercadolibre') {
    if (opts.dest) return mercadoLibreAffiliateUrl(opts.dest)
    return mercadoLibreSearch(opts.query || opts.anime || 'figura anime')
  }
  return resolveStreamingUrl(partner, opts.anime || opts.query)
}
