const JIKAN_PREFIXES = [
  '/top/anime',
  '/top/manga',
  '/anime',
  '/manga',
  '/anime/',
  '/manga/',
  '/seasons/',
  '/schedules',
]

/** Rutas permitidas hacia TMDB API v3 */
const TMDB_PATH = /^\/(trending|movie|tv|search|discover)(\/.*)?$/

export function isAllowedJikanPath(path: string): boolean {
  const base = path.split('?')[0]
  if (!base.startsWith('/') || base.includes('..')) return false
  return JIKAN_PREFIXES.some((prefix) => base === prefix || base.startsWith(prefix))
}

export function isAllowedTmdbPath(path: string): boolean {
  const base = path.split('?')[0]
  return TMDB_PATH.test(base)
}

export function isAllowedAnilistBody(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false
  const query = (body as { query?: unknown }).query
  if (typeof query !== 'string') return false
  if (query.length > 4000) return false
  const normalized = query.replace(/\s+/g, ' ').trim().toLowerCase()
  if (normalized.includes('mutation') || normalized.includes('subscription')) return false
  return (
    normalized.startsWith('query media') ||
    normalized.startsWith('query page') ||
    normalized.startsWith('query search')
  )
}
