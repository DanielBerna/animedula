const ML_HOSTS = new Set([
  'mercadolibre.com.mx',
  'www.mercadolibre.com.mx',
  'articulo.mercadolibre.com.mx',
  'listado.mercadolibre.com.mx',
])

export function isMercadoLibreUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    const host = parsed.hostname.toLowerCase()
    if (ML_HOSTS.has(host)) return true
    return host.endsWith('.mercadolibre.com.mx')
  } catch {
    return false
  }
}

export function isSafeHttpsUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function isAllowedAvatarUrl(url: string): boolean {
  if (!url) return true
  if (!isSafeHttpsUrl(url)) return false
  try {
    const host = new URL(url).hostname.toLowerCase()
    return (
      host.endsWith('.supabase.co') ||
      host === 'cdn.myanimelist.net' ||
      host === 'images.unsplash.com' ||
      host.endsWith('.googleusercontent.com')
    )
  } catch {
    return false
  }
}
