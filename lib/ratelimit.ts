import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export type RateTier = 'proxy' | 'mutation' | 'upload' | 'strict'

const hasRedis = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
)

function makeLimiter(requests: number, window: `${number} s` | `${number} m`) {
  if (!hasRedis) return null
  return new Ratelimit({
    redis: new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    }),
    limiter: Ratelimit.slidingWindow(requests, window),
  })
}

const limiters: Record<RateTier, Ratelimit | null> = {
  proxy: makeLimiter(20, '60 s'),
  mutation: makeLimiter(40, '60 s'),
  upload: makeLimiter(8, '300 s'),
  strict: makeLimiter(5, '60 s'),
}

export async function checkRateLimit(key: string, tier: RateTier = 'proxy') {
  const ratelimit = limiters[tier]
  if (!ratelimit) {
    if (process.env.NODE_ENV === 'production' && process.env.REQUIRE_RATE_LIMIT === 'true') {
      return { success: false, remaining: 0 }
    }
    return { success: true, remaining: 999 }
  }
  return ratelimit.limit(key)
}
