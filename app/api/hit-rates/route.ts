import { createClient } from "@/libs/supabase/server"
import { NextResponse } from "next/server"
import { Market, TimeWindow } from "@/types/hit-rates"
import { getHitRateProfilesByMarket } from "@/lib/redis"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// Helper function for server-side sorting
// TODO: For large datasets, consider:
// 1. Pre-sorting and caching different sort orders in Redis
// 2. Server-side result caching with TTL
// 3. Database-only sorting to avoid in-memory operations
function sortProfiles(profiles: any[], sortField: string, sortDirection: "asc" | "desc") {
  return profiles.sort((a, b) => {
    let aValue: any
    let bValue: any
    
    switch (sortField) {
      case "name":
        aValue = a.player_name
        bValue = b.player_name
        break
      case "line":
        aValue = a.line
        bValue = b.line
        break
      case "average":
        aValue = a.avg_stat_per_game
        bValue = b.avg_stat_per_game
        break
      case "L5":
        aValue = a.last_5_hit_rate
        bValue = b.last_5_hit_rate
        break
      case "L10":
        aValue = a.last_10_hit_rate
        bValue = b.last_10_hit_rate
        break
      case "L20":
        aValue = a.last_20_hit_rate
        bValue = b.last_20_hit_rate
        break
      case "seasonHitRate":
        aValue = a.season_hit_rate || 0
        bValue = b.season_hit_rate || 0
        break
      default:
        aValue = a.last_10_hit_rate
        bValue = b.last_10_hit_rate
    }
    
    if (typeof aValue === "string") {
      return sortDirection === "asc" 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    } else {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue
    }
  })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport")?.toLowerCase() || "mlb"
    const market = searchParams.get("market") as Market || "Hits"
    const timeWindow = searchParams.get("timeWindow") as TimeWindow || "10_games"
    const minHitRate = searchParams.get("minHitRate") ? parseFloat(searchParams.get("minHitRate")!) : 0.5
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 25
    const sortField = searchParams.get("sortField") || "L10"
    const sortDirection = searchParams.get("sortDirection") as "asc" | "desc" || "desc"
    const selectedGamesParam = searchParams.get("selectedGames")
    const selectedGames = selectedGamesParam ? selectedGamesParam.split(',') : null
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit

    console.log(`[HIT RATES API] Request received - Sport: ${sport}, Market: ${market}, TimeWindow: ${timeWindow}, MinHitRate: ${minHitRate}, Page: ${page}, Limit: ${limit}`);

    // Try to get data from Redis first
    console.log(`[HIT RATES API] Attempting to fetch profiles from Redis for sport: ${sport}, market: ${market}`);
    try {
      const allProfiles = await getHitRateProfilesByMarket(market, sport);

      if (allProfiles && allProfiles.length > 0) {
        console.log(`[HIT RATES API] Successfully retrieved ${allProfiles.length} profiles from Redis`);

        // Apply hit rate filter
        const hitRateField = timeWindow === "5_games" 
          ? "last_5_hit_rate" 
          : timeWindow === "10_games" 
            ? "last_10_hit_rate" 
            : "last_20_hit_rate"

        console.log(`[HIT RATES API] Filtering profiles by ${hitRateField} >= ${minHitRate * 100}%`);
        
        const parsedProfiles = allProfiles
          .map(profile => {
            try {
              // If profile is a string, parse it
              if (typeof profile === 'string') {
                const parsed = JSON.parse(profile);
                return parsed.hitRateProfile || parsed;
              }
              // If profile is a CachedHitRateData object, extract the hitRateProfile
              if (profile && typeof profile === 'object' && 'hitRateProfile' in profile) {
                return profile.hitRateProfile;
              }
              return profile;
            } catch (err) {
              console.error(`[HIT RATES API] Error parsing profile:`, err);
              return null;
            }
          })
          .filter(Boolean) // Remove any null profiles from parsing errors
          .filter(profile => {
            const hitRate = profile[hitRateField as keyof typeof profile] as number;
            return hitRate >= minHitRate * 100;
          });

        // Apply game filtering if specified
        let filteredProfiles = parsedProfiles;
        if (selectedGames && selectedGames.length > 0) {
          filteredProfiles = parsedProfiles.filter(profile => 
            profile.odds_event_id && selectedGames.includes(profile.odds_event_id)
          );
        }

        // Apply server-side sorting
        const sortedProfiles = sortProfiles(filteredProfiles, sortField, sortDirection);

        // Calculate pagination
        const paginatedProfiles = sortedProfiles.slice(startIndex, endIndex);
        const totalPages = Math.ceil(sortedProfiles.length / limit);

        console.log(`[HIT RATES API] Returning ${paginatedProfiles.length} filtered profiles from Redis (page ${page} of ${totalPages})`);
        return NextResponse.json({
          profiles: paginatedProfiles,
          totalPages,
          totalProfiles: sortedProfiles.length,
        });
      }
    } catch (redisError) {
      console.error(`[HIT RATES API] Redis error:`, redisError);
      // Continue to database fallback
    }

    console.log(`[HIT RATES API] No profiles found in Redis, falling back to database`);

    // Fallback to database if no Redis data
    const supabase = createClient();

    // Build the query
    let query = supabase
      .from("player_hit_rate_profiles")
      .select("*", { count: 'exact' }) // Add count to get total number of records
      .eq("league_id", 1) // Use league_id = 1 for MLB
      .eq("market", market.toLowerCase()); // Convert market to lowercase to match Redis keys

    // Add hit rate filter based on time window
    const hitRateField = timeWindow === "5_games" 
      ? "last_5_hit_rate" 
      : timeWindow === "10_games" 
        ? "last_10_hit_rate" 
        : "last_20_hit_rate";

    query = query
      .gte(hitRateField, minHitRate * 100) // Convert decimal to percentage
    
    // Add game filtering if specified
    if (selectedGames && selectedGames.length > 0) {
      query = query.in('odds_event_id', selectedGames);
    }
    
    query = query
      .order(sortField === "L5" ? "last_5_hit_rate" : 
             sortField === "L10" ? "last_10_hit_rate" : 
             sortField === "L20" ? "last_20_hit_rate" :
             sortField === "name" ? "player_name" :
             sortField === "line" ? "line" :
             sortField === "average" ? "avg_stat_per_game" :
             sortField === "seasonHitRate" ? "season_hit_rate" :
             "last_10_hit_rate", { ascending: sortDirection === "asc" })
      .range(startIndex, endIndex - 1); // Add pagination to database query

    console.log(`[HIT RATES API] Executing database query for market: ${market}, field: ${hitRateField}`);

    // Execute the query
    const { data, error, count } = await query;
    
    if (error) {
      console.error("[HIT RATES API] Database error:", error);
      return NextResponse.json(
        { error: "Database error: " + error.message },
        { status: 500 }
      );
    }
    
    const totalPages = Math.ceil((count || 0) / limit);
    console.log(`[HIT RATES API] Successfully retrieved ${data?.length || 0} profiles from database (page ${page} of ${totalPages})`);
    
    return NextResponse.json({
      profiles: data || [],
      totalPages,
      totalProfiles: count || 0,
    });
  } catch (err) {
    console.error("[HIT RATES API] Server error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Function to fetch odds data from the database
async function fetchOddsData(playerIds: number[], markets: string[]): Promise<Record<string, any>> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("player_prop_odds")
    .select("*")
    .in("player_id", playerIds)
    .in("market", markets)
    .order("fetched_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching odds data:", error);
    return {};
  }
  
  // Group odds by player_id, market, and line
  const groupedOdds: Record<string, any> = {};
  
  data?.forEach((odds) => {
    if (!odds.player_id) return;
    
    // Create a unique key for this player's market and line
    const key = `${odds.player_id}:${odds.market}:${odds.line}`;
    
    if (!groupedOdds[key]) {
      groupedOdds[key] = {
        player_id: odds.player_id,
        market: odds.market,
        line: odds.line,
        odds_data: {}
      };
    }
    
    // Add odds data for this sportsbook
    groupedOdds[key].odds_data[odds.sportsbook] = {
      odds: odds.over_odds,
      over_link: odds.over_link,
      sid: odds.over_sid  // Include the SID in the odds data
    };
  });
  
  return groupedOdds;
} 