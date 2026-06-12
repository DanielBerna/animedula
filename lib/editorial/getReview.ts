import { generateEditorialReview } from './generate'
import { buildFallbackReview } from './fallback'
import { readCachedReview, writeCachedReview } from './cache'
import { EditorialReview, ReviewInput } from './types'

export async function getEditorialReview(input: ReviewInput): Promise<EditorialReview> {
  try {
    const cached = await readCachedReview(input.kind, input.id)
    if (cached) return cached

    const review = await generateEditorialReview(input)
    await writeCachedReview(input.kind, input.id, review)
    return review
  } catch (err) {
    console.warn('[editorial] fallback', input.kind, input.id, err)
    return buildFallbackReview(input)
  }
}
