import { NextResponse } from "next/server";
import { getOdds, OddsAPIError } from "@/lib/odds-api";
import { getCachedData, setCachedData, generateCacheKey } from "@/lib/redis";

// First, add an interface for the cached data structure at the top of the file
interface CachedOddsData {
  events: any[];
  timestamp: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get("sport") || "basketball_nba";
  const bookmakers = searchParams.get("bookmakers")?.split(",") || [
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
    `API Request - Sport: ${sport}, Bookmakers: ${bookmakers.join(", ")}`
  );

  if (!sport) {
    return NextResponse.json(
      { error: "Sport parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Generate a cache key for this specific request using your implementation
    const cacheKey = generateCacheKey([
      "parlay-builder",
      sport,
      ...bookmakers,
      ...markets,
    ]);

    // Then update the getCachedData call with the type parameter
    // Try to get from cache first
    const cachedData = await getCachedData<CachedOddsData>(cacheKey);
    if (cachedData) {
      console.log(`Cache hit for ${sport}`);
      return NextResponse.json(cachedData, {
        headers: {
          "x-last-updated": new Date(
            cachedData.timestamp || Date.now()
          ).toISOString(),
          "x-cache-hit": "true",
        },
      });
    }

    console.log(`Cache miss for ${sport}, fetching from API`);
    // If not in cache, fetch from API using our enhanced getOdds function
    const oddsData = await getOdds(sport, bookmakers, markets);

    // Prepare response data with timestamp
    const responseData = {
      events: oddsData,
      timestamp: Date.now(),
    };

    // Cache the data
    await setCachedData(cacheKey, responseData);

    console.log(`Fetched ${oddsData.length} events for ${sport}`);

    return NextResponse.json(responseData, {
      headers: {
        "x-last-updated": new Date().toISOString(),
        "x-cache-hit": "false",
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
