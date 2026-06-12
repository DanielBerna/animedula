import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

export async function cacheGet(key: string) {
  try {
    return await redis.get(key)
  } catch (e) {
    return null
  }
}

export async function cacheSet(key: string, value: any, ttlSeconds = 60 * 60 * 6) {
  try {
    await redis.set(key, typeof value === 'string' ? value : JSON.stringify(value))
    await redis.expire(key, ttlSeconds)
  } catch (e) {
    // ignore cache errors
  }
}
