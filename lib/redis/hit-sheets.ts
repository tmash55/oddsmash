import { Redis } from '@upstash/redis'
import { HitStreakPlayer, StrikeoutOverCandidate, BounceBackCandidate, HitConsistencyCandidate } from '@/components/hit-sheets/types'

// Initialize Redis client
const redis = Redis.fromEnv()

// TTL for cached data (2 hours)
const CACHE_TTL = 7200

// Cache keys
const CACHE_KEYS = {
  HIT_STREAKS: 'hit_sheets:hit_streaks',
  STRIKEOUT_OVERS: (hitRate: string) => `hit_sheets:strikeout_overs:${hitRate}`,
  BOUNCE_BACK: (hitRate: string, sampleSpan: string) => `hit_sheets:bounce_back:${hitRate}:${sampleSpan}`,
  HIT_CONSISTENCY: (hitRate: string, sampleSpan: string) => `hit_sheets:hit_consistency:${hitRate}:${sampleSpan}`,
  HIGH_HIT_RATE: (hitRate: string, sampleSpan: string) => `hit_sheets:high_hit_rate:${hitRate}:${sampleSpan}`,
}

// Hit Streaks
export async function getCachedHitStreaks(): Promise<HitStreakPlayer[] | null> {
  try {
    const cached = await redis.get<HitStreakPlayer[]>(CACHE_KEYS.HIT_STREAKS)
    return cached
  } catch (error) {
    console.error('[Redis] Error getting cached hit streaks:', error)
    return null
  }
}

export async function setCachedHitStreaks(data: HitStreakPlayer[]): Promise<void> {
  try {
    await redis.set(CACHE_KEYS.HIT_STREAKS, data, { ex: CACHE_TTL })
  } catch (error) {
    console.error('[Redis] Error setting hit streaks cache:', error)
  }
}

// Strikeout Overs
export async function getCachedStrikeoutOvers(hitRate: string): Promise<StrikeoutOverCandidate[] | null> {
  try {
    const cached = await redis.get<StrikeoutOverCandidate[]>(CACHE_KEYS.STRIKEOUT_OVERS(hitRate))
    return cached
  } catch (error) {
    console.error('[Redis] Error getting cached strikeout overs:', error)
    return null
  }
}

export async function setCachedStrikeoutOvers(data: StrikeoutOverCandidate[], hitRate: string): Promise<void> {
  try {
    await redis.set(CACHE_KEYS.STRIKEOUT_OVERS(hitRate), data, { ex: CACHE_TTL })
  } catch (error) {
    console.error('[Redis] Error setting strikeout overs cache:', error)
  }
}

// Bounce Back Candidates
export async function getCachedBounceBackCandidates(hitRate: string, sampleSpan: string): Promise<BounceBackCandidate[] | null> {
  try {
    const cached = await redis.get<BounceBackCandidate[]>(CACHE_KEYS.BOUNCE_BACK(hitRate, sampleSpan))
    return cached
  } catch (error) {
    console.error('[Redis] Error getting cached bounce back candidates:', error)
    return null
  }
}

export async function setCachedBounceBackCandidates(data: BounceBackCandidate[], hitRate: string, sampleSpan: string): Promise<void> {
  try {
    await redis.set(CACHE_KEYS.BOUNCE_BACK(hitRate, sampleSpan), data, { ex: CACHE_TTL })
  } catch (error) {
    console.error('[Redis] Error setting bounce back candidates cache:', error)
  }
}

// Hit Consistency
export async function getCachedHitConsistency(hitRate: string, sampleSpan: string): Promise<HitConsistencyCandidate[] | null> {
  try {
    const cached = await redis.get<HitConsistencyCandidate[]>(CACHE_KEYS.HIT_CONSISTENCY(hitRate, sampleSpan))
    return cached
  } catch (error) {
    console.error('[Redis] Error getting cached hit consistency:', error)
    return null
  }
}

export async function setCachedHitConsistency(data: HitConsistencyCandidate[], hitRate: string, sampleSpan: string): Promise<void> {
  try {
    await redis.set(CACHE_KEYS.HIT_CONSISTENCY(hitRate, sampleSpan), data, { ex: CACHE_TTL })
  } catch (error) {
    console.error('[Redis] Error setting hit consistency cache:', error)
  }
}

// High Hit Rate
export async function getCachedHighHitRate(hitRate: string, sampleSpan: string): Promise<any[] | null> {
  try {
    const cached = await redis.get<any[]>(CACHE_KEYS.HIGH_HIT_RATE(hitRate, sampleSpan))
    return cached
  } catch (error) {
    console.error('[Redis] Error getting cached high hit rate:', error)
    return null
  }
}

export async function setCachedHighHitRate(data: any[], hitRate: string, sampleSpan: string): Promise<void> {
  try {
    await redis.set(CACHE_KEYS.HIGH_HIT_RATE(hitRate, sampleSpan), data, { ex: CACHE_TTL })
  } catch (error) {
    console.error('[Redis] Error setting high hit rate cache:', error)
  }
} 