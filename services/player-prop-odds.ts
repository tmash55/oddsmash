"use server";

import { createClient } from "@/libs/supabase/server";

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
 * Get the best odds for a list of players, reusing a single API call
 */
export async function fetchBestOddsForHitRateProfiles(
  profiles: any[]
): Promise<Record<string, PlayerPropOdds | null>> {
  // Limit the number of profiles to process to avoid exceeding body size limits
  // Process in batches of 50 to avoid the 1MB limit
  const MAX_PROFILES_PER_BATCH = 50;

  // Process only a subset if there are too many profiles
  const profilesToProcess = profiles.length > MAX_PROFILES_PER_BATCH 
    ? profiles.slice(0, MAX_PROFILES_PER_BATCH) 
    : profiles;
  
  console.log(`[ODDS] Processing ${profilesToProcess.length} out of ${profiles.length} profiles to avoid body size limits`);
  
  // Get mapping between profile IDs and player IDs
  const playerIdMappings = await getPlayerIdMappings();
  
  // Step 1: Extract unique player IDs from the profiles
  const playerIds = Array.from(
    new Set(profilesToProcess.map(profile => playerIdMappings[profile.id] || profile.player_id))
  );
  console.log(`[ODDS] Fetching odds for ${playerIds.length} unique players:`, playerIds.slice(0, 5), "...");
  
  // Step 2: Fetch all odds for these players in a single API call
  const allOdds = await fetchPlayerPropOddsForPlayers(playerIds);
  console.log(`[ODDS] Fetched odds for ${Object.keys(allOdds).length} player-market-line combinations`);
  
  // Log a few sample keys to verify format
  const sampleKeys = Object.keys(allOdds).slice(0, 3);
  if (sampleKeys.length > 0) {
    console.log(`[ODDS] Sample keys in allOdds:`, sampleKeys);
  }
  
  // If we didn't find any odds using player IDs, we may have a mismatch in player_id values
  // Try a more targeted fetch approach from the database
  if (Object.keys(allOdds).length === 0) {
    console.log(`[ODDS] No odds found using player IDs. Attempting targeted lookup instead.`);
    try {
      // Get direct odds data from database more efficiently
      const supabase = createClient();
      
      const markets = Array.from(new Set(profilesToProcess.map(profile => profile.market)));
      const lines = Array.from(new Set(profilesToProcess.map(profile => profile.line)));
      
      console.log(`[ODDS] Targeted search for markets:`, markets, "and lines:", lines);
      
      // Query more efficiently with market and line filters
      const { data, error } = await supabase
        .from("player_prop_odds")
        .select("id, player_id, player_name, market, line, over_odds, sportsbook, fetched_at")
        .in("market", markets)
        .in("line", lines)
        .order("fetched_at", { ascending: false })
        .limit(500); // Limit to avoid large responses
      
      if (error) {
        console.error("Error fetching direct player prop odds:", error);
      } else if (data && data.length > 0) {
        console.log(`[ODDS] Targeted fetch found ${data.length} odds records`);
        
        // Keep only the most recent odds for each player+market+line+sportsbook combination
        const uniqueOdds: Record<string, PlayerPropOdds> = {};
        
        data.forEach((odds: any) => {
          if (!odds.player_id) return;
          
          // Create a unique key for deduplication
          const dedupeKey = `${odds.player_id}:${odds.market}:${odds.line}:${odds.sportsbook}`;
          
          // Only keep the most recent odds for each key
          if (!uniqueOdds[dedupeKey] || new Date(odds.fetched_at) > new Date(uniqueOdds[dedupeKey].fetched_at)) {
            uniqueOdds[dedupeKey] = odds as PlayerPropOdds;
          }
        });
        
        // Convert back to array and group by player+market+line
        const dedupedOdds = Object.values(uniqueOdds);
        console.log(`[ODDS] After deduplication, have ${dedupedOdds.length} unique odds entries`);
        
        // Group odds by player_id + market + line for easier lookup
        dedupedOdds.forEach((odds) => {
          if (!odds.player_id) return;
          
          // Create a unique key for this player's market and line
          const key = `${odds.player_id}:${odds.market}:${odds.line}`;
          
          if (!allOdds[key]) {
            allOdds[key] = [];
          }
          
          allOdds[key].push(odds);
        });
        
        console.log(`[ODDS] After grouping, allOdds now has ${Object.keys(allOdds).length} keys`);
      }
    } catch (err) {
      console.error("Error in targeted odds fetch:", err);
    }
  }
  
  // Step 3: Find the best odds for each profile
  const result: Record<string, PlayerPropOdds | null> = {};
  
  // Use Promise.all to handle async operations in parallel
  await Promise.all(profilesToProcess.map(async (profile) => {
    // Create a key for this profile
    const profileKey = `${profile.id}:${profile.market}:${profile.line}`;
    
    // Use the mapped player ID if available, otherwise fall back to profile's player_id
    const lookupPlayerId = playerIdMappings[profile.id] || profile.player_id;
    
    // Find the best odds for this player, market, and line
    const bestOdds = await findBestOdds(
      allOdds,
      lookupPlayerId,
      profile.market,
      profile.line
    );
    
    result[profileKey] = bestOdds;
  }));
  
  console.log(`[ODDS] Generated best odds for ${Object.keys(result).length} profiles`);
  
  // Log samples of found and not found odds
  const foundOdds = Object.entries(result).filter(([_, v]) => v !== null).slice(0, 3);
  const missingOdds = Object.entries(result).filter(([_, v]) => v === null).slice(0, 3);
  
  if (foundOdds.length > 0) {
    console.log(`[ODDS] Sample found odds (${foundOdds.length} of ${Object.entries(result).filter(([_, v]) => v !== null).length}):`);
    foundOdds.forEach(([key, value]) => {
      console.log(`  ${key} => ${value?.sportsbook} (${value?.over_odds})`);
    });
  }
  
  if (missingOdds.length > 0) {
    console.log(`[ODDS] Sample missing odds (${missingOdds.length} of ${Object.entries(result).filter(([_, v]) => v === null).length}):`);
    missingOdds.forEach(([key]) => {
      console.log(`  ${key}`);
    });
  }
  
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