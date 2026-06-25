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
let inflight: Promise<RuntimeSticker[]> | null = null

export async function loadStickers(): Promise<RuntimeSticker[]> {
  if (cache) return cache
  if (!inflight) {
    inflight = fetch('/api/stickers')
      .then((r) => r.json())
      .then((d) => {
        cache = (d.stickers || []) as RuntimeSticker[]
        return cache
      })
      .catch(() => {
        cache = []
        return cache
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
