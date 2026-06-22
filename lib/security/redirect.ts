/** Solo rutas internas relativas; bloquea open redirects. */
export function safeRedirectPath(next: string | null | undefined, fallback = '/'): string {
  if (!next || typeof next !== 'string') return fallback
  const trimmed = next.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback
  if (trimmed.includes('://') || trimmed.includes('\\')) return fallback
  if (/[\x00-\x1f\x7f]/.test(trimmed)) return fallback
  return trimmed
}
