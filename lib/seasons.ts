import type { JikanAnime } from './jikan'
import { SEASON_NAMES } from './jikan'

export type SeasonKey = 'winter' | 'spring' | 'summer' | 'fall'

export const SEASON_ORDER: SeasonKey[] = ['winter', 'spring', 'summer', 'fall']

export function isSeasonKey(value?: string | null): value is SeasonKey {
  return value === 'winter' || value === 'spring' || value === 'summer' || value === 'fall'
}

export function getCurrentSeasonInfo(): { year: number; season: SeasonKey } {
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()
  if (month <= 2) return { year, season: 'winter' }
  if (month <= 5) return { year, season: 'spring' }
  if (month <= 8) return { year, season: 'summer' }
  return { year, season: 'fall' }
}

export function prevSeason(year: number, season: SeasonKey): { year: number; season: SeasonKey } {
  const idx = SEASON_ORDER.indexOf(season)
  if (idx <= 0) return { year: year - 1, season: 'fall' }
  return { year, season: SEASON_ORDER[idx - 1]! }
}

export function nextSeason(year: number, season: SeasonKey): { year: number; season: SeasonKey } {
  const idx = SEASON_ORDER.indexOf(season)
  if (idx >= SEASON_ORDER.length - 1) return { year: year + 1, season: 'winter' }
  return { year, season: SEASON_ORDER[idx + 1]! }
}

export function formatSeasonYear(season: SeasonKey, year: number): string {
  return `${SEASON_NAMES[season]} ${year}`
}

export function seasonSortKey(season: SeasonKey, year: number): number {
  const idx = SEASON_ORDER.indexOf(season)
  return year * 10 + idx
}

export function listSeasonYears(): number[] {
  const max = new Date().getFullYear() + 1
  const years: number[] = []
  for (let y = max; y >= 2014; y--) years.push(y)
  return years
}

export type SeasonGroup = {
  key: string
  season: SeasonKey
  year: number
  label: string
  items: JikanAnime[]
}

export function groupAnimeBySeasonYear(items: JikanAnime[]): SeasonGroup[] {
  const map = new Map<string, JikanAnime[]>()

  for (const item of items) {
    if (!isSeasonKey(item.season) || !item.year) continue
    const key = `${item.season}-${item.year}`
    const list = map.get(key) || []
    list.push(item)
    map.set(key, list)
  }

  return [...map.entries()]
    .map(([key, groupItems]) => {
      const [season, yearStr] = key.split('-') as [SeasonKey, string]
      const year = Number(yearStr)
      return {
        key,
        season,
        year,
        label: formatSeasonYear(season, year),
        items: groupItems,
      }
    })
    .sort((a, b) => seasonSortKey(b.season, b.year) - seasonSortKey(a.season, a.year))
}
