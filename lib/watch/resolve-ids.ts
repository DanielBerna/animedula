import { fetchJikan } from '../jikan'

type ExternalItem = { name?: string; url?: string }

function parseExternalId(items: ExternalItem[] | undefined, patterns: RegExp[]): number | null {
  if (!items?.length) return null
  for (const item of items) {
    if (!item.url) continue
    for (const re of patterns) {
      const match = item.url.match(re)
      if (match) return Number(match[1])
    }
  }
  return null
}

async function fetchExternal(malId: number | string): Promise<ExternalItem[]> {
  const data = await fetchJikan(`/anime/${malId}/external`, 86400)
  return (data?.data as ExternalItem[]) || []
}

/** Extrae el ID numérico de AniList desde la respuesta external de Jikan. */
export async function resolveAnilistId(malId: number | string): Promise<number | null> {
  const items = await fetchExternal(malId)
  return parseExternalId(items, [/anilist\.co\/anime\/(\d+)/i])
}

/** Kitsu — útil si un agregador solo mapea por Kitsu. */
export async function resolveKitsuId(malId: number | string): Promise<number | null> {
  const items = await fetchExternal(malId)
  return parseExternalId(items, [/kitsu\.app\/anime\/(\d+)/i, /kitsu\.io\/anime\/(\d+)/i])
}

export type ResolvedAnimeIds = {
  malId: number
  anilistId: number | null
  kitsuId: number | null
}

export async function resolveAnimeIds(malId: number | string): Promise<ResolvedAnimeIds> {
  const mal = Number(malId)
  const items = await fetchExternal(malId)
  return {
    malId: mal,
    anilistId: parseExternalId(items, [/anilist\.co\/anime\/(\d+)/i]),
    kitsuId: parseExternalId(items, [/kitsu\.app\/anime\/(\d+)/i, /kitsu\.io\/anime\/(\d+)/i]),
  }
}
