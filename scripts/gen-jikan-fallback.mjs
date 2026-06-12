import fs from 'fs'

async function fetchJikan(path) {
  const res = await fetch(`https://api.jikan.moe/v4${path}`, {
    headers: { 'User-Agent': 'Animedula/1.0' },
  })
  return res.json()
}

const [animeRes, mangaRes] = await Promise.all([
  fetchJikan('/top/anime?limit=12'),
  fetchJikan('/top/manga?limit=12'),
])

const pickAnime = (i) => ({
  mal_id: i.mal_id,
  title: i.title,
  score: i.score,
  images: i.images,
})

const pickManga = (i) => ({
  mal_id: i.mal_id,
  title: i.title,
  score: i.score,
  chapters: i.chapters,
  volumes: i.volumes,
  images: i.images,
})

const content = `import type { JikanAnime, JikanManga } from './jikan'

/** Respaldo local si Jikan devuelve 429 o falla en build/deploy */
export const FALLBACK_TOP_ANIME: JikanAnime[] = ${JSON.stringify(animeRes.data.map(pickAnime), null, 2)}

export const FALLBACK_TOP_MANGA: JikanManga[] = ${JSON.stringify(mangaRes.data.map(pickManga), null, 2)}
`

fs.writeFileSync('lib/jikanFallback.ts', content)
console.log('lib/jikanFallback.ts updated')
