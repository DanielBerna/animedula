import { fetchJikan } from '../jikan'

/** Extrae el ID numérico de AniList desde la respuesta external de Jikan. */
export async function resolveAnilistId(malId: number | string): Promise<number | null> {
  const data = await fetchJikan(`/anime/${malId}/external`, 86400)
  const items = data?.data as Array<{ name?: string; url?: string }> | undefined
  if (!items?.length) return null

  for (const item of items) {
    if (!item.name?.toLowerCase().includes('anilist') || !item.url) continue
    const match = item.url.match(/anilist\.co\/anime\/(\d+)/i)
    if (match) return Number(match[1])
  }
  return null
}
