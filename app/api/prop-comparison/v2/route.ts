import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { z } from "zod";
import type { PlayerOdds } from "@/types/prop-comparison";

// Sport mapping for Redis keys
const SPORT_KEY_MAP: Record<string, string> = {
  'baseball_mlb': 'mlb',
  'basketball_nba': 'nba',
  'basketball_ncaab': 'ncaab'
};

// Validation schema for request parameters
const RequestSchema = z.object({
  sport: z.string(),
  market: z.string().nullable().optional(),
  gameId: z.string().nullable().optional(),
}).transform(data => ({
  sport: data.sport,
  market: data.market || undefined,
  gameId: data.gameId || undefined,
}));

export async function GET(request: Request) {
  try {
    // Parse URL parameters
    const { searchParams } = new URL(request.url);
    const params = {
      sport: searchParams.get("sport"),
      market: searchParams.get("market"),
      gameId: searchParams.get("gameId"),
    };

    // Validate parameters
    const validatedParams = RequestSchema.parse(params);

    // Convert sport name to Redis key format
    const sportKey = SPORT_KEY_MAP[validatedParams.sport] || validatedParams.sport;

    // Construct Redis key pattern based on parameters
    let keyPattern = `odds:${sportKey}:*`;
    if (validatedParams.market) {
      // Match any player ID with the specific market
      keyPattern = `odds:${sportKey}:*:${validatedParams.market.toLowerCase()}`;
    }

    console.log(`[/api/prop-comparison/v2] Searching with pattern: ${keyPattern}`);

    // Use SCAN to get all matching keys
    let cursor = '0';
    const allKeys: string[] = [];
    
    do {
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: keyPattern,
        count: 50
      });
      cursor = nextCursor;
      allKeys.push(...keys);
    } while (cursor !== '0');

    console.log(`[/api/prop-comparison/v2] Found ${allKeys.length} Redis keys`);

    // Get all odds data for the matching keys and preserve metrics
    const oddsData = allKeys.length > 0 
      ? await redis.mget(...allKeys) 
      : [];

    console.log(`[/api/prop-comparison/v2] Retrieved ${oddsData.length} Redis entries`);

    // Calculate global most recent timestamp BEFORE filtering
    const allValidData = oddsData.filter((data): data is any => data !== null);
    const globalLastUpdated = allValidData.reduce((latest, item) => {
      if (!item.last_updated) return latest;
      const itemDate = new Date(item.last_updated);
      return !latest || itemDate > new Date(latest) ? item.last_updated : latest;
    }, null as string | null);

    // Process and filter the data while preserving metrics
    const filteredData = allValidData
      .map((data) => {
        // Debug: Check if metrics exist
        if (data.metrics) {
          console.log(`[/api/prop-comparison/v2] ✅ Found metrics for ${data.description}:`, Object.keys(data.metrics));
        } else {
          console.log(`[/api/prop-comparison/v2] ❌ No metrics for ${data.description}`);
        }
        
        // Ensure we preserve all fields including metrics
        return {
          description: data.description,
          player_id: data.player_id,
          team: data.team,
          market: data.market,
          lines: data.lines,
          event_id: data.event_id,
          commence_time: data.commence_time,
          home_team: data.home_team,
          away_team: data.away_team,
          primary_line: data.primary_line,
          has_alternates: data.has_alternates,
          last_updated: data.last_updated,
          metrics: data.metrics, // ✅ Explicitly preserve metrics
        } as PlayerOdds;
      })
      .filter((item) => validatedParams.gameId ? item.event_id === validatedParams.gameId : true);

    console.log(`[/api/prop-comparison/v2] Returning ${filteredData.length} filtered items`);
    
    // Debug: Log which items have metrics
    const itemsWithMetrics = filteredData.filter(item => item.metrics);
    console.log(`[/api/prop-comparison/v2] Items with metrics: ${itemsWithMetrics.length}/${filteredData.length}`);

    return NextResponse.json({
      success: true,
      data: filteredData,
      metadata: {
        total: filteredData.length,
        sport: validatedParams.sport,
        market: validatedParams.market || 'all',
        gameId: validatedParams.gameId || 'all',
        keyPattern, // Include the pattern for debugging
        keysFound: allKeys.length, // Include number of keys found
        itemsWithMetrics: itemsWithMetrics.length, // Include metrics count for debugging
        globalLastUpdated, // Include global most recent timestamp
      }
    });

  } catch (error) {
    console.error('Error fetching odds:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch odds data'
      },
      { status: 400 }
    );
  }
}

// Helper function to find best odds for a specific bet type
function findBestOdds(lines: Record<string, any>, betType: "over" | "under") {
  let bestOdds = null;
  let bestSportsbook = null;

  // For each line (e.g., "1.5", "2.5", etc.)
  for (const [line, bookmakers] of Object.entries(lines)) {
    // For each sportsbook
    for (const [sportsbook, odds] of Object.entries(bookmakers as Record<string, any>)) {
      // Type guard to ensure odds has the expected structure
      if (typeof odds !== 'object' || odds === null) continue;
      
      const currentOdds = (odds as Record<string, any>)[betType];
      if (!currentOdds || typeof currentOdds !== 'object' || !currentOdds.price) continue;

      if (!bestOdds || currentOdds.price > bestOdds) {
        bestOdds = currentOdds.price;
        bestSportsbook = sportsbook;
      }
    }
  }

  return bestOdds ? { odds: bestOdds, sportsbook: bestSportsbook } : null;
} 