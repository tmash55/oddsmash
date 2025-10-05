import { createClient } from "@/libs/supabase/client";
import { PlayerHitRateProfile, HitRateFilters, TimeWindow } from "@/types/hit-rates";
import { getCachedHitRateProfiles } from "@/lib/redis";

/**
 * Fetch hit rate profiles with optional filtering
 */
export async function fetchHitRateProfiles(filters?: HitRateFilters): Promise<PlayerHitRateProfile[]>
export async function fetchHitRateProfiles(sport?: string, market?: string): Promise<PlayerHitRateProfile[]>
export async function fetchHitRateProfiles(
  filtersOrSport?: HitRateFilters | string,
  market?: string
): Promise<PlayerHitRateProfile[]> {
  try {
    // Handle both function signatures
    let url = '/api/hit-rates'
    const params = new URLSearchParams()

    if (typeof filtersOrSport === 'string') {
      // Sport + market signature
      params.set('sport', filtersOrSport)
      if (market) params.set('market', market)
    } else if (filtersOrSport) {
      // Filters signature
      Object.entries(filtersOrSport).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.set(key, value.toString())
        }
      })
    }

    const queryString = params.toString()
    const fullUrl = queryString ? `${url}?${queryString}` : url

    const response = await fetch(fullUrl)
    if (!response.ok) {
      throw new Error('Failed to fetch hit rate profiles')
    }

    const data = await response.json()

    // Return the data directly since odds are now fetched separately via the hit-rates-odds API
    return data
  } catch (error) {
    console.error('Error fetching hit rate profiles:', error)
    throw error
  }
}

/**
 * Fetch hit rate profile for a specific player
 */
export async function fetchPlayerHitRateProfile(
  playerId: number, 
  market: string = 'hits'
): Promise<PlayerHitRateProfile[]> {
  try {
    const supabase = createClient();
    if (!supabase) {
      throw new Error("Failed to create Supabase client");
    }
    
    // First try to get from Redis cache
    const cacheKey = `hit_rate:mlb:${playerId}:${market.toLowerCase()}`
    const cachedProfile = await getCachedHitRateProfiles(cacheKey)
    
    if (cachedProfile) {
      // Return the cached profile directly since it already includes fallback_odds
      return [cachedProfile.hitRateProfile || cachedProfile]
    }
    
    // Fallback to database if not in cache
    const { data, error } = await supabase
      .from("player_hit_rate_profiles")
      .select("*")
      .eq("player_id", playerId)
      .eq("market", market.toLowerCase());
    
    if (error) {
      console.error(`Error fetching hit rate profile for player ${playerId}:`, error);
      throw new Error(`Failed to fetch player data: ${error.message}`);
    }
    
    // Return data directly since odds are handled separately
    return data || [];
  } catch (err) {
    console.error(`Error in fetchPlayerHitRateProfile for player ${playerId}:`, err);
    throw err;
  }
}

/**
 * Get hit rate field name for a specific time window
 */
export function getHitRateFieldName(timeWindow: TimeWindow): string {
  switch (timeWindow) {
    case "5_games":
      return "last_5_hit_rate";
    case "10_games":
      return "last_10_hit_rate";
    case "20_games":
      return "last_20_hit_rate";
    default:
      return "last_10_hit_rate";
  }
}

/**
 * Get hit rate value for a specific time window
 */
export function getHitRateForTimeWindow(profile: PlayerHitRateProfile, timeWindow: TimeWindow): number {
  if (!profile) return 0;
  
  switch (timeWindow) {
    case "5_games":
      return profile.last_5_hit_rate;
    case "10_games":
      return profile.last_10_hit_rate;
    case "20_games":
      return profile.last_20_hit_rate;
    default:
      return 0;
  }
} 