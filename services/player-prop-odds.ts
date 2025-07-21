"use server";

import { createClient } from "@/libs/supabase/server";
import { getBaseUrl } from '@/lib/url-utils';

export interface PlayerPropOdds {
  id: number;
  player_id: number | null;
  player_name: string;
  team_name: string | null;
  market: string;
  line: number;
  over_odds: number | null;
  over_sid: string | null;
  over_link: string | null;
  sportsbook: string;
  fetched_at: string;
}

/**
 * Fetch player prop odds from the database for specific players
 */
export async function fetchPlayerPropOddsForPlayers(playerIds: number[]): Promise<Record<string, PlayerPropOdds[]>> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from("player_prop_odds")
      .select("*")
      .in("player_id", playerIds)
      .order("fetched_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching player prop odds:", error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.warn("No player prop odds found for the specified players");
      return {};
    }
    
    // Group odds by player_id + market + line for easier lookup
    const groupedOdds: Record<string, PlayerPropOdds[]> = {};
    
    data.forEach((odds: any) => {
      if (!odds.player_id) return;
      
      // Create a unique key for this player's market and line
      const key = `${odds.player_id}:${odds.market}:${odds.line}`;
      
      if (!groupedOdds[key]) {
        groupedOdds[key] = [];
      }
      
      groupedOdds[key].push(odds as PlayerPropOdds);
    });
    
    return groupedOdds;
  } catch (error) {
    console.error("Failed to fetch player prop odds:", error);
    return {};
  }
}

/**
 * Map between player profile IDs and odds player IDs
 * This function is needed because there appears to be a mismatch between
 * the player IDs used in hit rate profiles and the ones in player prop odds
 */
export async function getPlayerIdMappings(): Promise<Record<number, number>> {
  try {
    const supabase = createClient();
    
    // Execute a query to fetch player ID mappings
    const { data, error } = await supabase
      .from("player_hit_rate_profiles")
      .select("id, player_id")
      .order("id");
    
    if (error) {
      console.error("Error fetching player ID mappings:", error);
      return {};
    }
    
    if (!data || data.length === 0) {
      console.warn("No player ID mappings found");
      return {};
    }
    
    // Create a mapping from profile ID to player ID
    const mappings: Record<number, number> = {};
    
    data.forEach((row: any) => {
      mappings[row.id] = row.player_id;
    });
    
    console.log(`[ODDS] Created mapping for ${Object.keys(mappings).length} players`);
    return mappings;
  } catch (error) {
    console.error("Failed to fetch player ID mappings:", error);
    return {};
  }
}

/**
 * Get the best odds for a list of players using the Redis-based API
 * This ensures we get fresh odds from the Pipedream workflow
 */
export async function fetchBestOddsForHitRateProfiles(
  profiles: any[]
): Promise<Record<string, PlayerPropOdds | null>> {
  // Limit the number of profiles to process
  const MAX_PROFILES_PER_BATCH = 50;
  const profilesToProcess = profiles.length > MAX_PROFILES_PER_BATCH 
    ? profiles.slice(0, MAX_PROFILES_PER_BATCH) 
    : profiles;
  
  console.log(`[ODDS] Fetching fresh odds from Redis API for ${profilesToProcess.length} profiles`);
  
  const result: Record<string, PlayerPropOdds | null> = {};
  
  // Process profiles in smaller batches to avoid overwhelming the API
  const BATCH_SIZE = 25;
  const batches = [];
  for (let i = 0; i < profilesToProcess.length; i += BATCH_SIZE) {
    batches.push(profilesToProcess.slice(i, i + BATCH_SIZE));
  }
  
  for (const batch of batches) {
    try {
      // Extract unique player IDs and markets from this batch
      const playerIds = Array.from(new Set(batch.map(profile => profile.player_id)));
      const markets = Array.from(new Set(batch.map(profile => profile.market)));
      
      console.log(`[ODDS] Processing batch: ${playerIds.length} players, markets: ${markets.join(', ')}`);
      
      // Fetch odds for each market separately to match the API format
      for (const market of markets) {
        try {
          const params = new URLSearchParams({
            playerIds: playerIds.join(','),
            market: market,
            sport: 'mlb'
          });
          
          // Use absolute URL for server-side fetch
          const baseUrl = getBaseUrl();
          const response = await fetch(`${baseUrl}/api/player-odds?${params}`);
          
          if (response.ok) {
            const oddsData = await response.json();
            console.log(`[ODDS] Got ${Object.keys(oddsData).length} odds entries for market: ${market}`);
            
            // Process each profile in this batch for this market
            batch
              .filter(profile => profile.market === market)
              .forEach(profile => {
                const profileKey = `${profile.player_id}:${profile.market}:${profile.line}`;
                
                console.log(`[ODDS] Processing profile: player_id=${profile.player_id}, market=${profile.market}, line=${profile.line}`);
                console.log(`[ODDS] Available odds keys:`, Object.keys(oddsData));
                
                // Look for odds matching this player, market, and line
                const oddsKey = Object.keys(oddsData).find(key => {
                  const [playerId, oddsMarket, line] = key.split(':');
                  const playerIdMatch = parseInt(playerId) === profile.player_id;
                  const marketMatch = oddsMarket === profile.market;
                  const lineMatch = Math.abs(parseFloat(line) - profile.line) < 0.01; // Allow for small floating point differences
                  
                  console.log(`[ODDS] Checking key ${key}: playerIdMatch=${playerIdMatch}, marketMatch=${marketMatch}, lineMatch=${lineMatch}`);
                  
                  return playerIdMatch && marketMatch && lineMatch;
                });
                
                if (oddsKey && oddsData[oddsKey]) {
                  result[profileKey] = oddsData[oddsKey];
                  console.log(`[ODDS] ✅ Found fresh odds for ${profile.player_name} ${profile.market} ${profile.line}: ${oddsData[oddsKey].sportsbook} (${oddsData[oddsKey].over_odds})`);
                } else {
                  result[profileKey] = null;
                  console.log(`[ODDS] ❌ No odds found for ${profile.player_name} ${profile.market} ${profile.line}`);
                }
              });
          } else {
            console.warn(`[ODDS] API request failed for market ${market}: ${response.status}`);
            
            // Mark all profiles in this market as having no odds
            batch
              .filter(profile => profile.market === market)
              .forEach(profile => {
                const profileKey = `${profile.player_id}:${profile.market}:${profile.line}`;
                result[profileKey] = null;
              });
          }
        } catch (err) {
          console.error(`[ODDS] Error fetching odds for market ${market}:`, err);
          
          // Mark all profiles in this market as having no odds
          batch
            .filter(profile => profile.market === market)
            .forEach(profile => {
              const profileKey = `${profile.player_id}:${profile.market}:${profile.line}`;
              result[profileKey] = null;
            });
        }
      }
      
      // Add small delay between batches
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (err) {
      console.error(`[ODDS] Error processing batch:`, err);
      
      // Mark all profiles in this batch as having no odds
      batch.forEach(profile => {
        const profileKey = `${profile.player_id}:${profile.market}:${profile.line}`;
        result[profileKey] = null;
      });
    }
  }
  
  const foundOdds = Object.values(result).filter(v => v !== null).length;
  const totalProfiles = Object.keys(result).length;
  console.log(`[ODDS] Fresh odds fetch complete: ${foundOdds}/${totalProfiles} profiles have odds`);
  
  return result;
}

/**
 * Find the best odds (highest positive value for over) for a specific player, market, and line
 */
export async function findBestOdds(
  playerPropOdds: Record<string, PlayerPropOdds[]>,
  playerId: number,
  market: string,
  line: number
): Promise<PlayerPropOdds | null> {
  // Create the key to look up in the grouped odds
  const exactKey = `${playerId}:${market}:${line}`;
  
  console.log(`[ODDS] findBestOdds looking for player ID: ${playerId}, market: ${market}, line: ${line}`);
  
  // Log the first few keys in playerPropOdds to debug
  const sampleKeys = Object.keys(playerPropOdds).slice(0, 5);
  if (sampleKeys.length > 0) {
    console.log(`[ODDS] Sample keys in playerPropOdds:`, sampleKeys);
    
    // Extract player IDs from these keys to see what we have
    const playerIdsInOdds = sampleKeys.map(key => key.split(':')[0]);
    console.log(`[ODDS] Sample player IDs in odds data:`, playerIdsInOdds);
  }
  
  // For "Hits" market, also check for equivalent lines (0.5 and 1 are equivalent)
  const alternateKeys: string[] = [];
  if (market === "Hits" || market === "Total Bases" || market === "Home Runs" || market === "RBIs") {
    if (line === 0.5) alternateKeys.push(`${playerId}:${market}:1`);
    if (line === 1) alternateKeys.push(`${playerId}:${market}:0.5`);
    if (line === 1.5) alternateKeys.push(`${playerId}:${market}:2`);
    if (line === 2) alternateKeys.push(`${playerId}:${market}:1.5`);
    if (line === 2.5) alternateKeys.push(`${playerId}:${market}:3`);
    if (line === 3) alternateKeys.push(`${playerId}:${market}:2.5`);
  }
  
  // Add fallback search by player name instead of ID
  let exactMatches = playerPropOdds[exactKey] || [];
  
  // If no exact matches by ID, try a more flexible approach
  if (exactMatches.length === 0) {
    console.log(`[ODDS] No exact matches found for key ${exactKey}, trying alternative lookup methods`);
    
    // Look for any keys with this market and line, then check player_id
    const possibleMatches: PlayerPropOdds[] = [];
    
    Object.entries(playerPropOdds).forEach(([key, odds]) => {
      const [oddsPlayerId, oddsMarket, oddsLine] = key.split(':');
      
      // Check if market and line match (loose comparison for line)
      if (oddsMarket === market && parseFloat(oddsLine) === line) {
        console.log(`[ODDS] Found possible match with player ID ${oddsPlayerId} for market ${market}, line ${line}`);
        possibleMatches.push(...odds);
      }
    });
    
    if (possibleMatches.length > 0) {
      console.log(`[ODDS] Found ${possibleMatches.length} possible matches with same market and line`);
      exactMatches = possibleMatches;
    }
  }
  
  // Then look for alternate matches by key
  let allMatches = [...exactMatches];
  
  alternateKeys.forEach(key => {
    if (playerPropOdds[key]) {
      allMatches = [...allMatches, ...playerPropOdds[key]];
    }
  });
  
  if (allMatches.length === 0) {
    console.log(`[ODDS] No matches found for ${exactKey} or alternates`);
    return null;
  }
  
  console.log(`[ODDS] Found ${allMatches.length} total matches`);
  
  // Find the most recent odds by sportsbook (as we might have multiple timestamps)
  const latestOddsByBook: Record<string, PlayerPropOdds> = {};
  
  allMatches.forEach(odds => {
    const existing = latestOddsByBook[odds.sportsbook];
    
    if (!existing || new Date(odds.fetched_at) > new Date(existing.fetched_at)) {
      latestOddsByBook[odds.sportsbook] = odds;
    }
  });
  
  // Convert back to array and find the best odds
  const latestOdds = Object.values(latestOddsByBook);
  
  // Filter out any odds that don't have valid over_odds
  const validOdds = latestOdds.filter(odds => odds.over_odds !== null);
  
  if (validOdds.length === 0) {
    console.log(`[ODDS] No valid odds found for ${exactKey}`);
    return null;
  }
  
  // Sort by over_odds to find the best (highest positive or lowest negative)
  const bestOdds = validOdds.sort((a, b) => {
    const aOdds = a.over_odds || 0;
    const bOdds = b.over_odds || 0;
    
    // If both are positive or both are negative, higher number is better for positive, lower number is better for negative
    if ((aOdds >= 0 && bOdds >= 0) || (aOdds < 0 && bOdds < 0)) {
      return bOdds - aOdds; // Descending order
    }
    
    // If one is positive and one is negative, positive is better
    return aOdds >= 0 ? -1 : 1;
  })[0];
  
  console.log(`[ODDS] Best odds for ${exactKey}: ${bestOdds.sportsbook} (${bestOdds.over_odds})`);
  return bestOdds;
} 