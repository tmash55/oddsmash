import { Redis } from "@upstash/redis";

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Generate cache key for odds data
export function generateOddsCacheKey({
  sport,
  eventId,
  market,
  bookmakers,
}: {
  sport: string;
  eventId: string;
  market: string;
  bookmakers: string[];
}): string {
  return `odds:${sport}:${eventId}:${market}:${bookmakers.sort().join("_")}`;
}

// Cache TTL in seconds (10 minutes)
export const CACHE_TTL = 600;

// Type for cached odds data
export interface CachedOddsData {
  lastUpdated: string;
  data: any; // Replace with your odds data type
}

// Get cached odds data
export async function getCachedOdds(
  key: string
): Promise<CachedOddsData | null> {
  try {
    const data = await redis.get<CachedOddsData>(key);
    return data;
  } catch (error) {
    console.error("Redis get error:", error);
    return null;
  }
}

// Set odds data in cache
export async function setCachedOdds(key: string, data: any): Promise<void> {
  try {
    const cacheData: CachedOddsData = {
      lastUpdated: new Date().toISOString(),
      data,
    };
    await redis.set(key, cacheData, { ex: CACHE_TTL });
  } catch (error) {
    console.error("Redis set error:", error);
  }
}

export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get<T>(key);
    return data;
  } catch (error) {
    console.error("Redis get error:", error);
    return null;
  }
}

export async function setCachedData<T>(
  key: string,
  data: T,
  ttl: number = CACHE_TTL
): Promise<void> {
  try {
    await redis.set(key, data, { ex: ttl });
  } catch (error) {
    console.error("Redis set error:", error);
  }
}

export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error("Redis delete error:", error);
  }
}

// Helper to generate consistent cache keys
export function generateCacheKey(parts: string[]): string {
  return parts.join(":");
}

export { redis };
