/**
 * Runtime de stickers en el cliente: carga (con caché) las definiciones desde
 * /api/stickers (fuente única del CMS) y renderiza tokens :id: como emoji o imagen.
 */

export type RuntimeSticker = {
  id: string
  emoji: string | null
  image: string | null
  label: string
  pack: string
  free: boolean
}

let cache: RuntimeSticker[] | null = null
let cachedAt = 0
let inflight: Promise<RuntimeSticker[]> | null = null

const TTL_MS = 30_000

/**
 * Carga las definiciones de stickers. Usa caché con TTL corto para que los
 * stickers recién creados/adquiridos aparezcan sin recargar a fondo.
 * Pasa `force = true` para ignorar la caché (p. ej. al abrir el picker).
 */
export async function loadStickers(force = false): Promise<RuntimeSticker[]> {
  const fresh = cache && Date.now() - cachedAt < TTL_MS
  if (!force && fresh) return cache as RuntimeSticker[]
  if (force) inflight = null
  if (!inflight) {
    inflight = fetch('/api/stickers', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        cache = (d.stickers || []) as RuntimeSticker[]
        cachedAt = Date.now()
        inflight = null
        return cache
      })
      .catch(() => {
        inflight = null
        cache = cache || []
        return cache as RuntimeSticker[]
      })
  }
  return inflight
}

const TOKEN_RE = /:([a-z0-9_-]+):/g

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Escapa el cuerpo y reemplaza tokens por emoji/imagen de sticker. */
export function renderBodyWithStickers(body: string, list: RuntimeSticker[]): string {
  const map = new Map(list.map((s) => [s.id, s]))
  const safe = esc(body)
  return safe.replace(TOKEN_RE, (_, id: string) => {
    const s = map.get(id)
    if (!s) return `:${id}:`
    if (s.image) {
      return `<img class="forum-sticker-img" src="${esc(s.image)}" alt="${esc(s.label)}" title="${esc(s.label)}" />`
    }
    return `<span class="forum-sticker" title="${esc(s.label)}">${s.emoji || ''}</span>`
  })
}
