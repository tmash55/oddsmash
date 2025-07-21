import { NextResponse } from "next/server";
import { getOdds, OddsAPIError } from "@/lib/odds-api";
import {
  getCachedData,
  generateCacheKey,
  filterCachedOddsBySelectedSportsbooks,
} from "@/lib/redis";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// Interface for the cached data structure
interface CachedOddsData {
  events: any[];
  timestamp: number;
  hasEvents?: boolean;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get("sport") || "basketball_nba";
  const userSelectedBookmakers = searchParams.get("bookmakers")?.split(",") || [
    "draftkings",
    "fanduel",
    "betmgm",
  ];
  const markets = searchParams.get("markets")?.split(",") || [
    "h2h",
    "spreads",
    "totals",
  ];

  console.log(
    `API Request - Sport: ${sport}, User Selected Bookmakers: ${userSelectedBookmakers.join(
      ", "
    )}`
  );

  if (!sport) {
    return NextResponse.json(
      { error: "Sport parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Generate a cache key without bookmakers
    const cacheKey = generateCacheKey(["parlay-builder", sport, ...markets]);

    // Try to get from cache first
    const cachedData = await getCachedData<CachedOddsData>(cacheKey);
    if (cachedData) {
      console.log(`Cache hit for ${sport}`);

      // Filter the cached events to include only the user's selected bookmakers
      const filteredEvents = filterCachedOddsBySelectedSportsbooks(
        cachedData.events,
        userSelectedBookmakers
      );

      // Create the response with filtered events
      const responseData = {
        events: filteredEvents,
        timestamp: cachedData.timestamp,
        hasEvents: Array.isArray(filteredEvents) && filteredEvents.length > 0,
      };

      return NextResponse.json(responseData, {
        headers: {
          "x-last-updated": new Date(
            cachedData.timestamp || Date.now()
          ).toISOString(),
          "x-cache-hit": "true",
          "x-cache-key": cacheKey,
        },
      });
    }

    console.log(`Cache miss for ${sport}, fetching from API`);

    // If not in cache, fetch from API using our enhanced getOdds function
    // Note: getOdds now fetches ALL bookmakers and filters the response
    const oddsData = await getOdds(sport, userSelectedBookmakers, markets);

    // Prepare response data with timestamp
    const responseData = {
      events: oddsData,
      timestamp: Date.now(),
      hasEvents: Array.isArray(oddsData) && oddsData.length > 0,
    };

    // Cache the complete data (with all bookmakers)
    // Note: We're caching the unfiltered data in getOdds, so we don't need to cache here

    console.log(`Fetched ${oddsData.length} events for ${sport}`);

    return NextResponse.json(responseData, {
      headers: {
        "x-last-updated": new Date().toISOString(),
        "x-cache-hit": "false",
        "x-cache-key": cacheKey,
      },
    });
  } catch (error) {
    console.error(`Error in parlay-builder API for sport ${sport}:`, error);

    if (error instanceof OddsAPIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch odds data" },
      { status: 500 }
    );
  }
}
