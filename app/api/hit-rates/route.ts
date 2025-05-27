import { NextResponse } from "next/server";
import { fetchHitRateProfiles } from "@/services/hit-rates";
import { HitRateFilters, Market, TimeWindow } from "@/types/hit-rates";

// Helper to validate market string
function isValidMarket(market: string | null): market is Market {
  const validMarkets: Market[] = [
    'Hits', 'Total Bases', 'Home Runs', 'Strikeouts', 'RBIs', 
    'Singles', 'Hits + Runs + RBIs', 'Doubles', 'Triples', 
    'Earned Runs', 'Record Win', 'Batting Strikeouts', 
    'Batting Walks', 'Outs', 'Walks'
  ];
  return market !== null && validMarkets.includes(market as Market);
}

// Helper to validate time window
function isValidTimeWindow(window: string | null): window is TimeWindow {
  const validWindows: TimeWindow[] = ['5_games', '10_games', '20_games'];
  return window !== null && validWindows.includes(window as TimeWindow);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get market parameter and validate
    const marketParam = searchParams.get("market");
    const market = isValidMarket(marketParam) ? marketParam : undefined;

    // Get time window parameter and validate
    const timeWindowParam = searchParams.get("timeWindow");
    const timeWindow = isValidTimeWindow(timeWindowParam) ? timeWindowParam : undefined;
    
    // Parse filters from query parameters with type safety
    const filters: HitRateFilters = {
      team: searchParams.get("team") || undefined,
      market: market,
      minHitRate: searchParams.get("minHitRate") ? parseFloat(searchParams.get("minHitRate")!) : undefined,
      timeWindow: timeWindow,
    };

    // Fetch profiles with caching handled by the service
    const profiles = await fetchHitRateProfiles(filters);

    return NextResponse.json(profiles);
  } catch (error) {
    console.error("[API] Error fetching hit rate profiles:", error);
    return NextResponse.json(
      { error: "Failed to fetch hit rate profiles" },
      { status: 500 }
    );
  }
} 