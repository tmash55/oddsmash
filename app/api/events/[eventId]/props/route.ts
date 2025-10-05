import { NextResponse } from "next/server";
import { getEventPlayerProps } from "@/lib/odds-api";
import {
  generateCacheKey,
  filterCachedOddsBySelectedSportsbooks,
  normalizeMarkets,
  getMarketsCachedData,
} from "@/lib/redis";
import { getMarketsForSport } from "@/lib/constants/markets";

// Define interface for cached data structure
interface CachedPlayerPropsData {
  timestamp?: number;
  lastUpdated?: string;
  bookmakers: any[];
  id?: string;
  sport_key?: string;
  sport_title?: string;
  commence_time?: string;
  home_team?: string;
  away_team?: string;
  requests_remaining?: number; // Add this to match the structure
  requests_used?: number; // Add this to match the structure
  [key: string]: any;
}

// Define interface for API usage
interface ApiUsage {
  requests_remaining: number | null;
  requests_used: number | null;
}

export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get("sport");
  const marketsParam = searchParams.get("markets") || "player_points";
  const markets = marketsParam.split(",");
  const userSelectedBookmakers = searchParams.get("bookmakers")?.split(",") || [
    "draftkings",
    "fanduel",
    "betmgm",
  ];

  if (!sport) {
    return NextResponse.json(
      { error: "Sport parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Generate cache key for this request - without specific bookmakers
    const cacheKey = generateCacheKey([
      "event-props",
      params.eventId,
      sport,
      ...normalizeMarkets(markets),
    ]);

    // Try to get from cache with smart matching
    const cachedData = await getMarketsCachedData<CachedPlayerPropsData>(
      sport,
      params.eventId,
      markets
    );

    if (cachedData) {
      console.log("Cache hit for:", cacheKey);

      // Filter the cached data to include only the user's selected bookmakers
      const filteredData = filterCachedOddsBySelectedSportsbooks(
        cachedData,
        userSelectedBookmakers
      );

      const response = NextResponse.json(filteredData);
      response.headers.set("x-cache", "HIT");
      response.headers.set("x-cache-key", cacheKey);

      // Use lastUpdated if available, otherwise use timestamp, or fallback to current time
      const lastUpdated =
        cachedData.lastUpdated ||
        (cachedData.timestamp
          ? new Date(cachedData.timestamp).toISOString()
          : new Date().toISOString());

      response.headers.set("x-last-updated", lastUpdated);

      // Add API usage headers if available in cached data
      if (cachedData.requests_remaining && cachedData.requests_used) {
        response.headers.set(
          "x-requests-remaining",
          cachedData.requests_remaining.toString()
        );
        response.headers.set(
          "x-requests-used",
          cachedData.requests_used.toString()
        );
      }

      return response;
    }

    console.log("Cache miss for:", cacheKey);

    // Use the markets constants to determine which markets to fetch
    const sportMarkets = getMarketsForSport(sport);
    const marketsToFetch = new Set<string>();

    // Add all requested markets
    markets.forEach((market) => marketsToFetch.add(market));

    // Check if we need to add alternate markets based on our constants
    markets.forEach((marketKey) => {
      // Find the market in our constants
      const marketInfo = sportMarkets.find(
        (m) =>
          m.apiKey === marketKey ||
          (m.alternateKey && m.alternateKey === marketKey)
      );

      if (marketInfo) {
        // If this is a standard market and it has alternates, add the alternate
        if (
          marketInfo.apiKey === marketKey &&
          marketInfo.hasAlternates &&
          marketInfo.alternateKey &&
          !marketsToFetch.has(marketInfo.alternateKey)
        ) {
          // If we should always fetch the alternate or it's one of our special markets
          if (marketInfo.alwaysFetchAlternate) {
            console.log(
              `Adding alternate market ${marketInfo.alternateKey} for ${marketKey}`
            );
            marketsToFetch.add(marketInfo.alternateKey);
          }
        }

        // If this is an alternate market, make sure we have the standard too
        if (
          marketInfo.alternateKey === marketKey &&
          !marketsToFetch.has(marketInfo.apiKey)
        ) {
          console.log(
            `Adding standard market ${marketInfo.apiKey} for ${marketKey}`
          );
          marketsToFetch.add(marketInfo.apiKey);
        }
      }
    });

    // Convert Set to Array for the API call
    const marketsToFetchArray = Array.from(marketsToFetch);
    console.log(`Fetching markets: ${marketsToFetchArray.join(", ")}`);

    // Fetch fresh data from the Odds API with ALL bookmakers
    const props = await getEventPlayerProps(
      sport,
      params.eventId,
      userSelectedBookmakers,
      marketsToFetchArray
    );

    // Store API usage info in the response if available
    const apiUsage: ApiUsage = {
      requests_remaining: null,
      requests_used: null,
    };

    // Return response with cache status headers
    const response = NextResponse.json(props);
    response.headers.set("x-cache", "MISS");
    response.headers.set("x-cache-key", cacheKey);
    response.headers.set("x-last-updated", new Date().toISOString());

    // Add API usage headers if available
    if (
      apiUsage.requests_remaining !== null &&
      apiUsage.requests_used !== null
    ) {
      response.headers.set(
        "x-requests-remaining",
        apiUsage.requests_remaining.toString()
      );
      response.headers.set(
        "x-requests-used",
        apiUsage.requests_used.toString()
      );
    }

    return response;
  } catch (error) {
    console.error("Error fetching player props:", error);
    return NextResponse.json(
      { error: "Failed to fetch player props" },
      { status: 500 }
    );
  }
}
