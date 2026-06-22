import { readCachedReview, writeCachedReview } from './cache'
import { readPublishedReviewFromDb, saveDraftReview } from './db'
import { generateEditorialReview } from './generate'
import { currentSeasonKey, suggestPublishDate } from './schedule'
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

export async function batchGenerateReviews(
  targets: BatchReviewTarget[],
  delayMs = 1200,
): Promise<BatchReviewResult[]> {
  const results: BatchReviewResult[] = []
  let scheduleSlot = 0

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i]
    const result = await generateReviewForTargetWithSchedule(target, scheduleSlot)
    if (result.status === 'generated' || result.status === 'skipped_cached') {
      scheduleSlot += 1
    }
    results.push(result)
    if (i < targets.length - 1 && delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }

  return results
}

async function generateReviewForTargetWithSchedule(
  target: BatchReviewTarget,
  slotIndex: number,
): Promise<BatchReviewResult> {
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
    const meta = {
      display_title: target.title,
      season_key: currentSeasonKey(),
      scheduled_publish_at: suggestPublishDate(slotIndex),
    }

    if (cached) {
      if (isSupabaseConfigured()) {
        await saveDraftReview(target.kind, target.mal_id, cached, 'ai', meta)
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
      await saveDraftReview(target.kind, target.mal_id, review, 'ai', meta)
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
