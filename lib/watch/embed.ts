/**
 * Proveedores de embed para ver anime desde servidores externos.
 *
 * No se almacena, descarga ni proxea ningún video: solo se incrusta un <iframe>
 * apuntando al servidor del tercero. Por eso se ofrecen VARIOS servidores (si uno
 * cae o no tiene el episodio, el usuario cambia a otro) y la opción Sub/Doblaje.
 *
 * Todo es configurable por variable de entorno para cambiar de proveedor sin tocar
 * código (sus dominios cambian con frecuencia):
 *   NEXT_PUBLIC_ANIME_EMBED_PROVIDERS = JSON con [{ id, name, template, dub }]
 *   NEXT_PUBLIC_ANIME_EMBED_TEMPLATE  = (compat) plantilla única → "Servidor 1"
 *
 * Placeholders de la plantilla:
 *   {malId} → ID de MyAnimeList   {ep} → episodio   {type} → sub|dub
 */

export type EmbedType = 'sub' | 'dub'

export type WatchProvider = {
  id: string
  name: string
  template: string
  /** Si el proveedor soporta doblaje (habilita el toggle Doblaje). */
  dub?: boolean
}

const DEFAULT_PROVIDERS: WatchProvider[] = [
  // Todos usan el MAL id directo y aceptan sub/dub.
  { id: 'srv1', name: 'Servidor 1', template: 'https://vidlink.pro/anime/{malId}/{ep}/{type}?fallback=true', dub: true },
  { id: 'srv2', name: 'Servidor 2', template: 'https://megaplay.buzz/stream/mal/{malId}/{ep}/{type}', dub: true },
  { id: 'srv3', name: 'Servidor 3', template: 'https://movie-src.xyz/v1/embed/anime/{malId}/{ep}/{type}', dub: true },
]

export function getWatchProviders(): WatchProvider[] {
  const raw = process.env.NEXT_PUBLIC_ANIME_EMBED_PROVIDERS
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length) return parsed as WatchProvider[]
    } catch {
      // JSON inválido → se ignora y se usa el default.
    }
  }
  const single = process.env.NEXT_PUBLIC_ANIME_EMBED_TEMPLATE
  if (single) {
    return [{ id: 'srv1', name: 'Servidor 1', template: single, dub: true }, ...DEFAULT_PROVIDERS.slice(1)]
  }
  return DEFAULT_PROVIDERS
}

export function buildEmbedUrl(
  template: string,
  malId: number | string,
  episode: number,
  type: EmbedType = 'sub',
): string {
  return template
    .replaceAll('{malId}', String(malId))
    .replaceAll('{ep}', String(episode))
    .replaceAll('{type}', type)
}
