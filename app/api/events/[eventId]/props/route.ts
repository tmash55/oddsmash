import { NextResponse } from "next/server";
import { getEventPlayerProps } from "@/lib/odds-api";
import {
  generateOddsCacheKey,
  getCachedOdds,
  setCachedOdds,
} from "@/lib/redis";

export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get("sport");
  const markets = searchParams.get("markets")?.split(",") || ["player_points"];
  const bookmakers = searchParams.get("bookmakers")?.split(",");

  if (!sport) {
    return NextResponse.json(
      { error: "Sport parameter is required" },
      { status: 400 }
    );
  }

  if (!bookmakers || bookmakers.length === 0) {
    return NextResponse.json(
      { error: "At least one bookmaker is required" },
      { status: 400 }
    );
  }

  try {
    // Generate cache key for this request
    const cacheKey = generateOddsCacheKey({
      sport,
      eventId: params.eventId,
      market: markets.join(","),
      bookmakers,
    });

    // Try to get from cache first
    const cachedData = await getCachedOdds(cacheKey);
    if (cachedData) {
      console.log("Cache hit for:", cacheKey);
      const response = NextResponse.json(cachedData.data);
      response.headers.set("x-cache", "HIT");
      response.headers.set("x-last-updated", cachedData.lastUpdated);
      return response;
    }

    console.log("Cache miss for:", cacheKey);

    // Fetch fresh data from the Odds API
    const props = await getEventPlayerProps(
      sport,
      params.eventId,
      bookmakers,
      markets
    );

    // Cache the response
    await setCachedOdds(cacheKey, props);

    // Return response with cache status headers
    const response = NextResponse.json(props);
    response.headers.set("x-cache", "MISS");
    response.headers.set("x-last-updated", new Date().toISOString());
    return response;
  } catch (error) {
    console.error("Error fetching player props:", error);
    return NextResponse.json(
      { error: "Failed to fetch player props" },
      { status: 500 }
    );
  }
}
