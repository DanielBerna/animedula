import { generateEditorialReview } from './generate'
import { buildFallbackReview } from './fallback'
import { readCachedReview, writeCachedReview } from './cache'
import { readPublishedReviewFromDb, saveDraftReview } from './db'
import { EditorialReview, ReviewInput } from './types'
import { isSupabaseConfigured } from '../supabaseAdmin'

export async function getEditorialReview(input: ReviewInput): Promise<EditorialReview> {
  try {
    const published = await readPublishedReviewFromDb(input.kind, input.id)
    if (published) return published

    const cached = await readCachedReview(input.kind, input.id)
    if (cached) return cached

    const review = await generateEditorialReview(input)
    await writeCachedReview(input.kind, input.id, review)

    if (isSupabaseConfigured()) {
      saveDraftReview(input.kind, Number(input.id), review, 'ai').catch(() => {})
    }

    return review
  } catch (err) {
    console.warn('[editorial] fallback', input.kind, input.id, err)
    return buildFallbackReview(input)
  }
}
