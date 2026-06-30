/**
 * Construcción de URLs de embed para ver anime desde proveedores externos.
 *
 * No se almacena ni se proxea video: solo se incrusta un <iframe> apuntando al
 * proveedor. El formato es 100% configurable por variable de entorno para poder
 * cambiar de proveedor sin tocar código (los dominios de estos servicios cambian
 * con frecuencia).
 *
 * Placeholders soportados en la plantilla:
 *   {malId} → ID de MyAnimeList
 *   {ep}    → número de episodio
 *   {type}  → 'sub' | 'dub'
 *
 * Ejemplos de plantillas válidas:
 *   https://vidsrc.cc/v2/embed/anime/ani{malId}/{ep}/{type}
 *   https://2anime.xyz/embed/{malId}-episode-{ep}
 */

const DEFAULT_TEMPLATE = 'https://vidsrc.cc/v2/embed/anime/ani{malId}/{ep}/{type}'

export function getEmbedTemplate(): string {
  return process.env.NEXT_PUBLIC_ANIME_EMBED_TEMPLATE || DEFAULT_TEMPLATE
}

export type EmbedType = 'sub' | 'dub'

export function buildEmbedUrl(malId: number | string, episode: number, type: EmbedType = 'sub'): string {
  return getEmbedTemplate()
    .replaceAll('{malId}', String(malId))
    .replaceAll('{ep}', String(episode))
    .replaceAll('{type}', type)
}
