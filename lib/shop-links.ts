import { getMlAffiliateId } from './shop-config'
import { isMercadoLibreUrl } from './security/urls'

const ML_HOST = 'mercadolibre.com.mx'

function withMlAffiliate(url: string): string {
  const aff = getMlAffiliateId()
  if (!aff) return url
  try {
    const parsed = new URL(url)
    if (!parsed.hostname.includes(ML_HOST)) return url
    if (!parsed.searchParams.has('aff_id')) {
      parsed.searchParams.set('aff_id', aff)
    }
    return parsed.toString()
  } catch {
    return url
  }
}

export function mercadoLibreSearch(query: string): string {
  const slug = query
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .toLowerCase()
  const base = `https://listado.${ML_HOST}/${slug}`
  const aff = getMlAffiliateId()
  if (!aff) return base
  return `${base}?aff_id=${encodeURIComponent(aff)}`
}

/** Aplica aff_id a cualquier URL de Mercado Libre (artículo o listado). */
export function mercadoLibreAffiliateUrl(url: string): string {
  if (!isMercadoLibreUrl(url)) {
    return mercadoLibreSearch('figura anime')
  }
  return withMlAffiliate(url)
}

export function crunchyrollSearch(title: string): string {
  return `https://www.crunchyroll.com/search?q=${encodeURIComponent(title)}`
}

export function netflixSearch(title: string): string {
  return `https://www.netflix.com/search?q=${encodeURIComponent(title)}`
}

export function primeVideoSearch(title: string): string {
  return `https://www.primevideo.com/search/ref=atv_sr?q=${encodeURIComponent(title)}`
}
