/** Progreso de episodios vistos en /ver (localStorage, por MAL id). */

const STORAGE_KEY = 'animedula-watch-v1'

type Entry = { watched: number[]; lastEp?: number }
type Store = Record<string, Entry>

function read(): Store {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Store
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function write(store: Store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    /* ignore quota */
  }
}

function key(malId: number | string) {
  return String(malId)
}

export function getWatchEntry(malId: number | string): { watched: Set<number>; lastEp?: number } {
  const entry = read()[key(malId)]
  const watched = new Set((entry?.watched || []).filter((n) => Number.isFinite(n) && n > 0))
  return { watched, lastEp: entry?.lastEp }
}

export function isEpisodeWatched(malId: number | string, episode: number): boolean {
  return getWatchEntry(malId).watched.has(episode)
}

export function markEpisodeWatched(malId: number | string, episode: number) {
  const store = read()
  const k = key(malId)
  const entry = store[k] || { watched: [] }
  const set = new Set(entry.watched)
  set.add(episode)
  store[k] = { watched: [...set].sort((a, b) => a - b), lastEp: episode }
  write(store)
}

export function unmarkEpisodeWatched(malId: number | string, episode: number) {
  const store = read()
  const k = key(malId)
  const entry = store[k]
  if (!entry) return
  const watched = entry.watched.filter((n) => n !== episode)
  if (!watched.length) {
    delete store[k]
  } else {
    store[k] = { ...entry, watched }
  }
  write(store)
}

export function toggleEpisodeWatched(malId: number | string, episode: number): boolean {
  if (isEpisodeWatched(malId, episode)) {
    unmarkEpisodeWatched(malId, episode)
    return false
  }
  markEpisodeWatched(malId, episode)
  return true
}
