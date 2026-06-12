export const REGION = 'mx' as const

export type AffiliatePartner = 'amazon' | 'mercadolibre' | 'crunchyroll' | 'prime'

const AMAZON_DOMAIN = 'amazon.com.mx'
const ML_DOMAIN = 'mercadolibre.com.mx'

function amazonTag(): string {
  return process.env.AMAZON_ASSOCIATE_TAG || process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG || ''
}

function mlAffiliateId(): string {
  return process.env.MERCADOLIBRE_AFFILIATE_ID || ''
}

export function buildAmazonSearchUrl(query: string): string {
  const params = new URLSearchParams({ k: query })
  const tag = amazonTag()
  if (tag) params.set('tag', tag)
  return `https://www.${AMAZON_DOMAIN}/s?${params.toString()}`
}

export function buildAmazonProductUrl(asinOrUrl: string): string {
  if (asinOrUrl.startsWith('http')) {
    const url = new URL(asinOrUrl)
    const tag = amazonTag()
    if (tag) url.searchParams.set('tag', tag)
    return url.toString()
  }
  const tag = amazonTag()
  const qs = tag ? `?tag=${encodeURIComponent(tag)}` : ''
  return `https://www.${AMAZON_DOMAIN}/dp/${asinOrUrl}${qs}`
}

export function buildMercadoLibreSearchUrl(query: string): string {
  const params = new URLSearchParams({ q: query })
  const aff = mlAffiliateId()
  if (aff) params.set('aff_id', aff)
  const slug = query.replace(/\s+/g, '-')
  return `https://listado.${ML_DOMAIN}/${slug}?${params.toString()}`
}

export function buildCrunchyrollUrl(animeTitle?: string): string {
  const base = process.env.CRUNCHYROLL_AFFILIATE_URL || 'https://www.crunchyroll.com'
  if (!animeTitle) return base
  return `${base}/search?q=${encodeURIComponent(animeTitle)}`
}

export function buildPrimeVideoUrl(animeTitle?: string): string {
  const tag = amazonTag()
  const q = animeTitle ? `search?phrase=${encodeURIComponent(animeTitle)}` : ''
  const base = `https://www.${AMAZON_DOMAIN}/gp/video/${q}`
  if (!tag) return base
  return `${base}${base.includes('?') ? '&' : '?'}tag=${encodeURIComponent(tag)}`
}

export type MerchItem = {
  id: string
  label: string
  description: string
  partner: AffiliatePartner
  cta: string
  query: string
  badge?: string
  imagen?: string
}

export function getSuggestedMerch(animeTitle: string): MerchItem[] {
  return [
    {
      id: 'figura',
      label: 'Figura destacada',
      description: `Piezas de colección para fans de ${animeTitle}.`,
      partner: 'amazon',
      cta: 'Ver en Amazon',
      query: `figura ${animeTitle} anime`,
      badge: 'Colección',
      imagen: 'https://images.unsplash.com/photo-1601811833011-2039bfee4c4e?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'manga',
      label: 'Manga / Blu-ray',
      description: 'Ediciones para maratón o biblioteca.',
      partner: 'amazon',
      cta: 'Ver en Amazon',
      query: `${animeTitle} manga`,
      badge: 'Lectura',
      imagen: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'ml',
      label: 'Mercado Libre',
      description: 'Busca ofertas y envíos locales.',
      partner: 'mercadolibre',
      cta: 'Buscar en Mercado Libre',
      query: `${animeTitle} figura anime`,
      badge: 'Oferta',
      imagen: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80',
    },
  ]
}

/** @deprecated Usar getSuggestedMerch */
export const getCuratedMerch = getSuggestedMerch

export function resolveAffiliateUrl(
  partner: AffiliatePartner,
  opts: { query?: string; dest?: string; anime?: string }
): string {
  switch (partner) {
    case 'amazon':
      if (opts.dest) return buildAmazonProductUrl(opts.dest)
      return buildAmazonSearchUrl(opts.query || opts.anime || 'anime figura')
    case 'mercadolibre':
      return buildMercadoLibreSearchUrl(opts.query || opts.anime || 'figura anime')
    case 'crunchyroll':
      return buildCrunchyrollUrl(opts.anime || opts.query)
    case 'prime':
      return buildPrimeVideoUrl(opts.anime || opts.query)
    default:
      return opts.dest || '/'
  }
}

export function buildGoUrl(
  partner: AffiliatePartner,
  opts: { query?: string; dest?: string; anime?: string; malId?: string | number }
): string {
  const params = new URLSearchParams()
  if (opts.query) params.set('q', opts.query)
  if (opts.dest) params.set('dest', opts.dest)
  if (opts.anime) params.set('anime', opts.anime)
  if (opts.malId) params.set('mal', String(opts.malId))
  const qs = params.toString()
  return `/go/${partner}${qs ? `?${qs}` : ''}`
}
