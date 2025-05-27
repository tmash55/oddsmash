import { createClient } from "@/libs/supabase/client";
import { PlayerHitRateProfile, HitRateFilters, TimeWindow } from "@/types/hit-rates";
import { getCachedHitRateProfiles, setCachedHitRateProfiles, generateHitRatesCacheKey } from "@/lib/redis";

/**
 * Fetch hit rate profiles with optional filtering
 */
export async function fetchHitRateProfiles(filters?: HitRateFilters): Promise<PlayerHitRateProfile[]> {
  try {
    const cacheKey = generateHitRatesCacheKey(filters);
    console.log(`[REDIS] Checking cache for key: ${cacheKey}`);
    
    // Try to get cached data first
    const cachedProfiles = await getCachedHitRateProfiles(filters);
    if (cachedProfiles) {
      console.log(`[REDIS] Cache HIT - Found ${cachedProfiles.length} profiles`);
      return cachedProfiles;
    }

    console.log(`[REDIS] Cache MISS - Fetching from database`);
    
    // Create Supabase client
    const supabase = createClient();
    if (!supabase) {
      throw new Error("Failed to create Supabase client");
    }
    
    // Build query
    let query = supabase
      .from("player_hit_rate_profiles")
      .select("*");
    
    // Apply filters if provided
    if (filters) {
      if (filters.team) {
        query = query.eq("team_name", filters.team);
      }
      
      if (filters.market) {
        query = query.eq("market", filters.market);
      }
      
      if (filters.minHitRate && filters.timeWindow) {
        const hitRateField = getHitRateFieldName(filters.timeWindow);
        query = query.gte(hitRateField, filters.minHitRate);
      }
    }
    
    // Execute query
    const { data, error } = await query;
    
    if (error) {
      console.error("[DB] Supabase query error:", error);
      throw new Error(`Database query failed: ${error.message}`);
    }
    
    const profiles = data || [];
    
    // Cache the results before returning
    await setCachedHitRateProfiles(profiles, filters);
    console.log(`[REDIS] Cached ${profiles.length} profiles with key: ${cacheKey}`);
    
    return profiles;
  } catch (err) {
    console.error("[ERROR] Error in fetchHitRateProfiles:", err);
    throw err;
  }
}

/**
 * Fetch hit rate profile for a specific player
 */
export async function fetchPlayerHitRateProfile(playerId: number): Promise<PlayerHitRateProfile[]> {
  try {
    const supabase = createClient();
    if (!supabase) {
      throw new Error("Failed to create Supabase client");
    }
    
    const { data, error } = await supabase
      .from("player_hit_rate_profiles")
      .select("*")
      .eq("player_id", playerId);
    
    if (error) {
      console.error(`Error fetching hit rate profile for player ${playerId}:`, error);
      throw new Error(`Failed to fetch player data: ${error.message}`);
    }
    
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