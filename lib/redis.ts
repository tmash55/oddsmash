import { Redis } from "@upstash/redis";
import { PlayerHitRateProfile } from "@/types/hit-rates";

// Initialize Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache TTL in seconds (20 minutes)
export const CACHE_TTL = 1200;

// Type for cached odds data
export interface CachedOddsData {
  lastUpdated: string;
  data: any; // Replace with your odds data type
}

interface CachedHitRateData {
  hitRateProfile: any;
  propsOdds?: Record<string, any>;
  fallback_odds?: Record<string, Record<string, {
    price: number;
    link?: string;
    sid?: string;
  }>>;
  lastUpdated: string;
}

/**
 * Normalize market names for consistent cache keys
 * This ensures that "batter_hits" and "batter_hits,batter_hits_alternate"
 * can share the same cached data
 */
export function normalizeMarkets(markets: string | string[]): string[] {
  // Convert to array if it's a string
  const marketArray =
    typeof markets === "string" ? markets.split(",") : markets;

  // Create a set of base markets (without _alternate suffix)
  const baseMarkets = new Set<string>();
  const alternateMarkets = new Set<string>();

  marketArray.forEach((market) => {
    if (market.endsWith("_alternate")) {
      const baseMarket = market.replace("_alternate", "");
      alternateMarkets.add(baseMarket);
    } else {
      baseMarkets.add(market);
    }
  });

  // Sort for consistent ordering in cache keys
  return Array.from(baseMarkets).sort();
}

/**
 * Generate cache key for odds data with normalized markets
 *
 * @param params Parameters to generate the cache key
 * @returns A cache key string
 */
export function generateOddsCacheKey({
  sport,
  eventId,
  market,
}: {
  sport: string;
  eventId?: string;
  market: string | string[];
  bookmakers?: string[]; // Kept for backward compatibility but not used
}): string {
  // Build the key without bookmakers
  let key = `odds:${sport}`;

  // Add eventId if provided
  if (eventId) {
    key += `:${eventId}`;
  }

  // Normalize and add markets
  const normalizedMarkets = normalizeMarkets(market);
  key += `:${normalizedMarkets.join("_")}`;

  return key;
}

/**
 * Check if we have a superset of the requested markets in cache
 *
 * @param requestedMarkets The markets being requested
 * @param cachedMarkets The markets we have in cache
 * @returns True if the cached markets contain all requested markets
 */
export function hasAllRequestedMarkets(
  requestedMarkets: string[],
  cachedMarkets: string[]
): boolean {
  // Normalize both sets of markets
  const normalizedRequested = normalizeMarkets(requestedMarkets);
  const normalizedCached = normalizeMarkets(cachedMarkets);

  // Check if all requested markets are in the cached markets
  return normalizedRequested.every((market) =>
    normalizedCached.includes(market)
  );
}

/**
 * Get cached data for markets, supporting partial matches
 *
 * @param sport The sport key
 * @param eventId Optional event ID
 * @param markets The markets being requested
 * @returns Cached data if available, null otherwise
 */
export async function getMarketsCachedData<T>(
  sport: string,
  eventId: string | undefined,
  markets: string[]
): Promise<T | null> {
  // Try exact match first
  const exactKey = generateOddsCacheKey({
    sport,
    eventId,
    market: markets,
  });

  const exactMatch = await getCachedData<T>(exactKey);
  if (exactMatch) {
    return exactMatch;
  }

  // If no exact match, check for superset cache keys
  // This is a simplified approach - in production you might want to
  // maintain a registry of active cache keys for more efficient lookup

  // For now, we'll just check a few common combinations
  const commonCombinations = [
    // Standard + alternate pairs
    [...markets, ...markets.map((m) => `${m}_alternate`)],
    // Just the base markets (for when alternates were requested but we have base)
    normalizeMarkets(markets),
  ];

  for (const combo of commonCombinations) {
    const comboKey = generateOddsCacheKey({
      sport,
      eventId,
      market: combo,
    });

    const comboMatch = await getCachedData<T>(comboKey);
    if (comboMatch) {
      return comboMatch;
    }
  }

  return null;
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

/**
 * Filters cached odds data to include only the specified sportsbooks
 *
 * @param data The complete cached data with all sportsbooks
 * @param selectedSportsbooks Array of sportsbook IDs to include
 * @returns Filtered data with only the selected sportsbooks
 */
export function filterCachedOddsBySelectedSportsbooks<
  T extends { bookmakers?: any[] }
>(data: T | T[], selectedSportsbooks: string[]): T | T[] {
  if (!data) return data;

  // Handle array of events/games
  if (Array.isArray(data)) {
    return data.map((item) =>
      filterSingleItemBookmakers(item, selectedSportsbooks)
    );
  }

  // Handle single event/game
  return filterSingleItemBookmakers(data, selectedSportsbooks);
}

/**
 * Helper function to filter bookmakers for a single item
 */
function filterSingleItemBookmakers<T extends { bookmakers?: any[] }>(
  item: T,
  selectedSportsbooks: string[]
): T {
  if (!item.bookmakers || !Array.isArray(item.bookmakers)) {
    return item;
  }

  // Create a shallow copy of the item
  const filteredItem = { ...item };

  // Filter bookmakers to only include selected ones
  filteredItem.bookmakers = item.bookmakers.filter((bookmaker) =>
    selectedSportsbooks.includes(bookmaker.key)
  );

  return filteredItem;
}

// Hit Rate specific caching functions
export async function getCachedHitRateProfiles(key: string): Promise<CachedHitRateData | null> {
  console.log(`[REDIS] Attempting to get cached data for key: ${key}`);
  try {
    const data = await getCachedData<any>(key);
    if (!data) {
      console.log(`[REDIS] Cache miss for key: ${key}`);
      return null;
    }

    console.log(`[REDIS] Cache hit for key: ${key}`);
    
    // If data is already in CachedHitRateData format
    if (data.hitRateProfile) {
      return {
        hitRateProfile: data.hitRateProfile,
        fallback_odds: data.fallback_odds || data.hitRateProfile.fallback_odds || {},
        lastUpdated: data.lastUpdated || new Date().toISOString()
      };
    }
    
    // If data is a raw profile, wrap it
    return {
      hitRateProfile: data,
      fallback_odds: data.fallback_odds || {},
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error(`[REDIS] Error getting cached data for key: ${key}`, error);
    return null;
  }
}

export async function setCachedHitRateProfiles(key: string, data: any, ttl: number = 60 * 60) {
  console.log(`[REDIS] Setting cache for key: ${key}`);
  try {
    // Ensure data is in the correct format
    const cacheData: CachedHitRateData = {
      hitRateProfile: data,
      lastUpdated: new Date().toISOString()
    };
    await setCachedData(key, cacheData, ttl);
    console.log(`[REDIS] Successfully set cache for key: ${key}`);
    return cacheData;
  } catch (error) {
    console.error(`[REDIS] Error setting cache for key: ${key}`, error);
    throw error;
  }
}

export function generateHitRatesCacheKey(playerId: number, market: string, sport: string = 'mlb') {
  const normalizedMarket = market.toLowerCase();
  return `hit_rate:${sport}:${playerId}:${normalizedMarket}`;
}

// Function to get multiple hit rate profiles by market
export async function getHitRateProfilesByMarket(market: string, sport: string = 'mlb'): Promise<PlayerHitRateProfile[]> {
  try {
    console.log('[REDIS] Searching for hit rate profiles with market:', market, 'sport:', sport);
    
    // Use SCAN instead of KEYS for better performance
    let cursor = '0';  // Start with '0' as string
    const pattern = `hit_rate:${sport}:*:${market.toLowerCase()}`;
    const profiles: PlayerHitRateProfile[] = [];
    
    console.log('[REDIS] Using pattern:', pattern);
    
    do {
      // Get a batch of keys using SCAN
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: pattern,
        count: 50 // Process in smaller batches
      });
      
      cursor = nextCursor;
      
      if (keys.length > 0) {
        console.log(`[REDIS] Found ${keys.length} keys matching pattern`);
        // Fetch profiles in batches
        const batchData = await redis.mget<any[]>(...keys);
        
        // Process each item, handling both raw profiles and wrapped data
        const validProfiles = batchData
          .filter(Boolean)
          .map(item => {
            try {
              // Parse if string
              const parsed = typeof item === 'string' ? JSON.parse(item) : item;
              
              // Extract profile from either format
              if (parsed.hitRateProfile) {
                return parsed.hitRateProfile;
              }
              
              // If it's a raw profile
              if (parsed.player_id && parsed.market) {
                return parsed;
              }
              
              console.log('[REDIS] Invalid profile format:', parsed);
              return null;
            } catch (e) {
              console.error('[REDIS] Error parsing profile:', e);
              return null;
            }
          })
          .filter(Boolean);
        
        profiles.push(...validProfiles);
      }
      
    } while (cursor !== '0');
    
    console.log(`[REDIS] Retrieved ${profiles.length} valid profiles`);
    return profiles;
    
  } catch (error) {
    console.error('[REDIS] Error getting hit rate profiles:', error);
    return [];
  }
}

// Function to update odds data for a hit rate profile
export async function updateHitRateOdds(
  playerId: number,
  market: string,
  sport: string = 'mlb',
  propsOdds?: Record<string, any>,
  fallback_odds?: Record<string, Record<string, { price: number; link?: string; sid?: string; }>>
) {
  try {
    const key = generateHitRatesCacheKey(playerId, market, sport);
    const existingData = await getCachedHitRateProfiles(key);
    
    if (existingData) {
      const updatedData = {
        ...existingData,
        propsOdds,
        fallback_odds,
        lastUpdated: new Date().toISOString()
      };
      
      await setCachedHitRateProfiles(key, updatedData);
      console.log(`[REDIS] Updated odds for ${key}`);
    }
  } catch (error) {
    console.error('[REDIS] Error updating hit rate odds:', error);
  }
}

// Function to get player ID from name
export async function getPlayerIdByName(name: string, sport: string = 'mlb'): Promise<number | null> {
  try {
    console.log(`[REDIS] Looking up player ID for: ${name} in ${sport}`)
    const key = `player:${sport}:name_to_id`
    
    // Get all player data
    const playerData = await redis.get<Record<string, { full_name: string; player_id: number }>>(key)
    
    if (!playerData) {
      console.log(`[REDIS] No player data found for key: ${key}`)
      return null
    }
    
    // Normalize the search name
    const searchName = name.toLowerCase().trim()
    
    // Find matching player
    const match = Object.values(playerData).find(player => 
      player.full_name.toLowerCase() === searchName
    )
    
    if (match) {
      console.log(`[REDIS] Found player ID ${match.player_id} for ${name}`)
      return match.player_id
    }
    
    console.log(`[REDIS] No player ID found for ${name}`)
    return null
    
  } catch (error) {
    console.error(`[REDIS] Error looking up player ID for ${name}:`, error)
    return null
  }
}
