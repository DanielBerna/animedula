import { readCachedReview, writeCachedReview } from './cache'
import { readPublishedReviewFromDb, saveDraftReview } from './db'
import { generateEditorialReview } from './generate'
import { MediaKind, ReviewInput } from './types'
import { isSupabaseConfigured } from '../supabaseAdmin'

export type BatchReviewTarget = {
  kind: MediaKind
  mal_id: number
  title: string
  synopsis?: string
  score?: number
  genres?: string[]
  status?: string
  chapters?: number
}

export type BatchReviewResult = {
  kind: MediaKind
  mal_id: number
  title: string
  status: 'skipped_published' | 'skipped_cached' | 'generated' | 'error'
  error?: string
}

async function hasPublishedReview(kind: MediaKind, malId: number): Promise<boolean> {
  const published = await readPublishedReviewFromDb(kind, malId)
  return Boolean(published)
}

export async function generateReviewForTarget(target: BatchReviewTarget): Promise<BatchReviewResult> {
  const base = {
    kind: target.kind,
    mal_id: target.mal_id,
    title: target.title,
  }

  try {
    if (await hasPublishedReview(target.kind, target.mal_id)) {
      return { ...base, status: 'skipped_published' }
    }

    const cached = await readCachedReview(target.kind, target.mal_id)
    if (cached) {
      if (isSupabaseConfigured()) {
        await saveDraftReview(target.kind, target.mal_id, cached, 'ai')
      }
      return { ...base, status: 'skipped_cached' }
    }

    const input: ReviewInput = {
      kind: target.kind,
      id: String(target.mal_id),
      title: target.title,
      synopsis: target.synopsis,
      score: target.score,
      genres: target.genres,
      status: target.status,
      chapters: target.chapters,
    }

    const review = await generateEditorialReview(input)
    await writeCachedReview(target.kind, target.mal_id, review)

    if (isSupabaseConfigured()) {
      await saveDraftReview(target.kind, target.mal_id, review, 'ai')
    }

    return { ...base, status: 'generated' }
  } catch (err) {
    return {
      ...base,
      status: 'error',
      error: err instanceof Error ? err.message : 'unknown',
    }
  }
}

export async function batchGenerateReviews(
  targets: BatchReviewTarget[],
  delayMs = 1200,
): Promise<BatchReviewResult[]> {
  const results: BatchReviewResult[] = []

  for (let i = 0; i < targets.length; i++) {
    results.push(await generateReviewForTarget(targets[i]))
    if (i < targets.length - 1 && delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }

  return results
}
