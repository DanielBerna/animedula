import { getCurrentSeasonInfo } from './seasons'

/** Semilla que cambia cada día dentro de la temporada actual. */
export function dailySeasonSeed(scope = 'default'): string {
  const { year, season } = getCurrentSeasonInfo()
  const day = new Date().toISOString().slice(0, 10)
  return `${year}-${season}-${scope}-${day}`
}

function hashString(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Mezcla determinista: mismo día = mismo orden; al día siguiente rota. */
export function shuffleRotated<T>(items: T[], scope = 'default'): T[] {
  const arr = [...items]
  let seed = hashString(dailySeasonSeed(scope))
  for (let i = arr.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) >>> 0
    const j = seed % (i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function pickRotated<T>(items: T[], count: number, scope = 'default'): T[] {
  if (items.length <= count) return shuffleRotated(items, scope)
  return shuffleRotated(items, scope).slice(0, count)
}

export function dedupeByKey<T>(items: T[], keyFn: (item: T) => string | number): T[] {
  const seen = new Set<string | number>()
  const out: T[] = []
  for (const item of items) {
    const k = keyFn(item)
    if (seen.has(k)) continue
    seen.add(k)
    out.push(item)
  }
  return out
}
