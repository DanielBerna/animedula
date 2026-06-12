import { promises as fs } from 'fs'
import path from 'path'
import { EditorialReview, MediaKind } from './types'

const DIR = path.join(process.cwd(), 'data', 'reviews')
const memory = new Map<string, EditorialReview>()

function key(kind: MediaKind, id: string | number) {
  return `${kind}-${id}`
}

function cachePath(kind: MediaKind, id: string | number) {
  return path.join(DIR, `${key(kind, id)}.json`)
}

function isValidReview(r: unknown): r is EditorialReview {
  if (!r || typeof r !== 'object') return false
  const o = r as EditorialReview
  return Boolean(o.gancho && o.por_que && o.veredicto && o.firma)
}

export async function readCachedReview(kind: MediaKind, id: string | number): Promise<EditorialReview | null> {
  const k = key(kind, id)
  const mem = memory.get(k)
  if (mem) return mem

  try {
    const raw = await fs.readFile(cachePath(kind, id), 'utf-8')
    const parsed = JSON.parse(raw)
    if (!isValidReview(parsed)) return null
    memory.set(k, parsed)
    return parsed
  } catch {
    return null
  }
}

export async function writeCachedReview(kind: MediaKind, id: string | number, review: EditorialReview) {
  const k = key(kind, id)
  memory.set(k, review)
  try {
    await fs.mkdir(DIR, { recursive: true })
    await fs.writeFile(cachePath(kind, id), JSON.stringify(review, null, 2), 'utf-8')
  } catch {
    // cache en disco opcional
  }
}
