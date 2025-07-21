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

    console.log('Searching with pattern:', keyPattern);

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

    console.log('Found keys:', allKeys);

    // Get all odds data for the matching keys
    const oddsData = allKeys.length > 0 
      ? await redis.mget<PlayerOdds[]>(...allKeys) 
      : [];

    console.log('Found data count:', oddsData.filter(Boolean).length);

    // Filter by gameId if provided
    const filteredData = validatedParams.gameId
      ? oddsData.filter((data): data is PlayerOdds => 
          data !== null && data.event_id === validatedParams.gameId
        )
      : oddsData.filter((data): data is PlayerOdds => data !== null);

    return NextResponse.json({
      success: true,
      data: filteredData,
      metadata: {
        total: filteredData.length,
        sport: validatedParams.sport,
        market: validatedParams.market || 'all',
        gameId: validatedParams.gameId || 'all',
        keyPattern, // Include the pattern for debugging
        keysFound: allKeys.length // Include number of keys found
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