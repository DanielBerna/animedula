import { looksSpanish, translateFields } from './translate'

const ANIME_GAME_KEYWORDS = [
  'anime',
  'naruto',
  'dragon ball',
  'genshin',
  'honkai',
  'pokemon',
  'one piece',
  'bleach',
  'final fantasy',
  'tower of fantasy',
  'nikke',
  'gundam',
  'digimon',
  'shinobi',
  'jrpg',
  'phantasy',
  'tales of',
  'persona',
  'fire emblem',
]

export type FreeGame = {
  id: number
  title: string
  thumbnail: string
  short_description: string
  genre: string
  platform: string
  release_date: string
  game_url: string
  status?: string
  description?: string
  developer?: string
  publisher?: string
}

const GENRE_ES: Record<string, string> = {
  'Action RPG': 'RPG de acción',
  'Action Game': 'Acción',
  'ARPG': 'RPG de acción',
  'Battle Royale': 'Battle royale',
  'Card Game': 'Juego de cartas',
  'Fighting': 'Peleas',
  'MMO': 'MMO',
  'MMORPG': 'MMORPG',
  'MMOARPG': 'MMOARPG',
  'MOBA': 'MOBA',
  'Racing': 'Carreras',
  'RPG': 'RPG',
  'Shooter': 'Disparos',
  'Social': 'Social',
  'Sports': 'Deportes',
  'Strategy': 'Estrategia',
}

const PLATFORM_ES: Record<string, string> = {
  'PC (Windows)': 'PC (Windows)',
  'Web Browser': 'Navegador web',
  'Browser': 'Navegador',
}

const STATUS_ES: Record<string, string> = {
  Live: 'Disponible',
  'Alpha Closed': 'Alfa cerrada',
  'Beta Closed': 'Beta cerrada',
  'Beta Open': 'Beta abierta',
}

const FALLBACK_GAMES: FreeGame[] = [
  {
    id: 475,
    title: 'Genshin Impact',
    thumbnail: 'https://www.freetogame.com/g/475/thumbnail.jpg',
    short_description: 'RPG de mundo abierto con estética anime.',
    genre: 'Action RPG',
    platform: 'PC (Windows)',
    release_date: '2020-09-28',
    game_url: 'https://www.freetogame.com/open/genshin-impact',
  },
  {
    id: 521,
    title: 'Honkai: Star Rail',
    thumbnail: 'https://www.freetogame.com/g/521/thumbnail.jpg',
    short_description: 'RPG por turnos del universo Honkai, estilo anime.',
    genre: 'RPG',
    platform: 'PC (Windows)',
    release_date: '2023-04-26',
    game_url: 'https://www.freetogame.com/open/honkai-star-rail',
  },
  {
    id: 515,
    title: 'Tower of Fantasy',
    thumbnail: 'https://www.freetogame.com/g/515/thumbnail.jpg',
    short_description: 'MMORPG de ciencia ficción con diseño inspirado en anime.',
    genre: 'MMORPG',
    platform: 'PC (Windows)',
    release_date: '2022-08-11',
    game_url: 'https://www.freetogame.com/open/tower-of-fantasy',
  },
  {
    id: 449,
    title: 'Lost Ark',
    thumbnail: 'https://www.freetogame.com/g/449/thumbnail.jpg',
    short_description: 'ARPG isométrico con combate trepidante.',
    genre: 'ARPG',
    platform: 'PC (Windows)',
    release_date: '2022-02-11',
    game_url: 'https://www.freetogame.com/open/lost-ark',
  },
]

export function labelGenre(genre: string) {
  return GENRE_ES[genre] || genre
}

export function labelPlatform(platform: string) {
  return PLATFORM_ES[platform] || platform
}

export function labelStatus(status?: string) {
  if (!status) return undefined
  return STATUS_ES[status] || status
}

function isAnimeAdjacent(game: FreeGame): boolean {
  const text = `${game.title} ${game.short_description} ${game.genre}`.toLowerCase()
  return ANIME_GAME_KEYWORDS.some((k) => text.includes(k))
}

export async function localizeGame(game: FreeGame): Promise<FreeGame> {
  const toTranslate: { short_description?: string; description?: string } = {}
  if (game.short_description && !looksSpanish(game.short_description)) {
    toTranslate.short_description = game.short_description
  }
  if (game.description && !looksSpanish(game.description)) {
    toTranslate.description = game.description
  }

  const translated = Object.keys(toTranslate).length > 0 ? await translateFields(toTranslate) : {}

  return {
    ...game,
    short_description: translated.short_description || game.short_description,
    description: translated.description || game.description,
    genre: labelGenre(game.genre),
    platform: labelPlatform(game.platform),
    status: labelStatus(game.status),
  }
}

export async function localizeGames(games: FreeGame[]): Promise<FreeGame[]> {
  const out: FreeGame[] = []
  for (const game of games) {
    out.push(await localizeGame(game))
  }
  return out
}

export async function fetchFreeGames(): Promise<FreeGame[]> {
  try {
    const res = await fetch('https://www.freetogame.com/api/games', {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 },
    })
    if (!res.ok) {
      console.warn(`[games] ${res.status}`)
      return FALLBACK_GAMES
    }
    const data = (await res.json()) as FreeGame[]
    if (!Array.isArray(data) || data.length === 0) return FALLBACK_GAMES
    return data
  } catch (err) {
    console.warn('[games] error', err)
    return FALLBACK_GAMES
  }
}

export async function fetchGameById(id: number): Promise<FreeGame | null> {
  try {
    const res = await fetch(`https://www.freetogame.com/api/game?id=${id}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 },
    })
    if (!res.ok) return FALLBACK_GAMES.find((g) => g.id === id) || null
    const data = (await res.json()) as FreeGame
    if (!data?.id) return null
    return data
  } catch {
    return FALLBACK_GAMES.find((g) => g.id === id) || null
  }
}

export async function fetchAnimeGames(limit = 12): Promise<FreeGame[]> {
  const all = await fetchFreeGames()
  const filtered = all.filter(isAnimeAdjacent)
  const list = filtered.length >= 6 ? filtered.slice(0, limit) : [...filtered, ...FALLBACK_GAMES].slice(0, limit)
  return localizeGames(list)
}

export async function fetchFeaturedGames(limit = 8): Promise<FreeGame[]> {
  const all = await fetchFreeGames()
  return localizeGames(all.slice(0, limit))
}

export async function fetchLocalizedGame(id: number): Promise<FreeGame | null> {
  const game = await fetchGameById(id)
  if (!game) return null
  return localizeGame(game)
}

export type GameSearchResult = {
  id: string
  title: string
  image_url: string | null
}

type RawgGame = {
  id: number
  slug?: string
  name: string
  background_image?: string | null
  released?: string | null
}

// Búsqueda en RAWG (catálogo amplio: ~870k juegos, no solo free-to-play).
// Requiere RAWG_API_KEY (gratis en https://rawg.io/apidocs).
async function searchRawg(query: string, limit: number): Promise<GameSearchResult[]> {
  const key = process.env.RAWG_API_KEY
  if (!key) return []
  try {
    const url = `https://api.rawg.io/api/games?key=${key}&search=${encodeURIComponent(
      query,
    )}&page_size=${limit}&search_precise=true`
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 },
    })
    if (!res.ok) {
      console.warn(`[games] rawg ${res.status}`)
      return []
    }
    const data = (await res.json()) as { results?: RawgGame[] }
    if (!Array.isArray(data?.results)) return []
    return data.results
      .filter((g) => g?.id && g?.name)
      .map((g) => ({
        id: `rawg:${g.id}`,
        title: g.released ? `${g.name} (${g.released.slice(0, 4)})` : g.name,
        image_url: g.background_image || null,
      }))
  } catch (err) {
    console.warn('[games] rawg error', err)
    return []
  }
}

// Coincidencias dentro del catálogo free-to-play (fallback / complemento).
async function searchFreeToGame(query: string, limit: number): Promise<GameSearchResult[]> {
  const q = query.toLowerCase()
  const all = await fetchFreeGames()
  return all
    .filter((g) => g.title.toLowerCase().includes(q))
    .slice(0, limit)
    .map((g) => ({
      id: String(g.id),
      title: g.title,
      image_url: g.thumbnail || null,
    }))
}

export async function searchGames(query: string, limit = 12): Promise<GameSearchResult[]> {
  const q = query.trim()
  if (q.length < 2) return []

  const [rawg, free] = await Promise.all([
    searchRawg(q, limit),
    searchFreeToGame(q, limit),
  ])

  // RAWG primero (catálogo completo); luego agregamos free-to-play que no estén ya.
  const seen = new Set(rawg.map((r) => r.title.toLowerCase()))
  const merged = [...rawg]
  for (const g of free) {
    if (!seen.has(g.title.toLowerCase())) {
      merged.push(g)
      seen.add(g.title.toLowerCase())
    }
  }
  return merged.slice(0, limit)
}
