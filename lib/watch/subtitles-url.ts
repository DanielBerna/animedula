/** Utilidades de URL de subtítulos — seguras para importar en cliente. */

export function buildPublicSubtitleUrl(origin: string, malId: number, episode: number): string {
  const base = origin.replace(/\/$/, '')
  const params = new URLSearchParams({
    malId: String(malId),
    ep: String(episode),
  })
  return `${base}/api/watch/subtitles?${params}`
}

export function appendSubtitleParams(embedUrl: string, subtitleUrl: string): string {
  try {
    const u = new URL(embedUrl)
    u.searchParams.set('sub_file', subtitleUrl)
    u.searchParams.set('sub_label', 'Español')
    return u.toString()
  } catch {
    const sep = embedUrl.includes('?') ? '&' : '?'
    return `${embedUrl}${sep}sub_file=${encodeURIComponent(subtitleUrl)}&sub_label=${encodeURIComponent('Español')}`
  }
}
