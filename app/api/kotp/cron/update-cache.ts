import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { GAMELOG_CACHE_KEY, CACHE_TTL, PlayerGameLog } from "@/app/api/kotp/constants";

// Only allow authorized requests to trigger this endpoint
const CRON_SECRET = process.env.CRON_SECRET || "";

export const fetchAndCachePlayoffGameLogs = async () => {
  const url = "https://stats.nba.com/stats/leaguegamelog?Counter=0&DateFrom=&DateTo=&Direction=DESC&LeagueID=00&PlayerOrTeam=P&Season=2024-25&SeasonType=Playoffs&Sorter=DATE";

  try {
    console.log("Cron job: Fetching fresh playoff game logs data");
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 seconds
    
    try {
      const response = await fetch(
        url,
        {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            "Referer": "https://www.nba.com/",
            "Accept": "application/json",
            "Origin": "https://www.nba.com",
            "x-nba-stats-origin": "stats",
            "x-nba-stats-token": "true",
          },
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch playoff game logs: ${response.status}`);
      }

      const data = await response.json();
      
      // Check if data is empty (no games played yet)
      if (!data.resultSets || !data.resultSets[0] || !data.resultSets[0].rowSet || data.resultSets[0].rowSet.length === 0) {
        console.log("No playoff games have been played yet");
        // Cache empty array to prevent continuous fetching
        const emptyLogs: PlayerGameLog[] = [];
        await redis.set(GAMELOG_CACHE_KEY, emptyLogs, { ex: 60 * 15 }); // Cache for 15 minutes
        console.log("Cached empty game logs data");
        return { success: true, message: "Cached empty game logs data" };
      }
      
      // Parse the response data
      const headers = data.resultSets[0].headers;
      const rows = data.resultSets[0].rowSet;

      // Find indices for the columns we need
      const playerIdIndex = headers.indexOf("PLAYER_ID");
      const playerNameIndex = headers.indexOf("PLAYER_NAME");
      const teamAbbrevIndex = headers.indexOf("TEAM_ABBREVIATION");
      const teamIdIndex = headers.indexOf("TEAM_ID");
      const gameIdIndex = headers.indexOf("GAME_ID");
      const gameDateIndex = headers.indexOf("GAME_DATE");
      const matchupIndex = headers.indexOf("MATCHUP");
      const ptsIndex = headers.indexOf("PTS");
      const wlIndex = headers.indexOf("WL");

      // Format the data we need
      const gameLogs: PlayerGameLog[] = rows.map((row: any) => ({
        playerId: row[playerIdIndex]?.toString(),
        playerName: row[playerNameIndex],
        teamAbbreviation: row[teamAbbrevIndex],
        teamId: row[teamIdIndex]?.toString(),
        gameId: row[gameIdIndex]?.toString(),
        gameDate: row[gameDateIndex],
        matchup: row[matchupIndex],
        points: parseInt(row[ptsIndex] || 0),
        winLoss: row[wlIndex],
      }));

      // Store in Redis cache
      await redis.set(GAMELOG_CACHE_KEY, gameLogs, { ex: CACHE_TTL });
      console.log("Stored playoff game logs in cache, count:", gameLogs.length);
      
      return { success: true, message: `Cached ${gameLogs.length} game logs` };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error("NBA API fetch error:", fetchError);
      throw fetchError;
    }
  } catch (error) {
    // Check if this is a timeout error
    if (error instanceof Error && error.name === 'AbortError') {
      console.error("NBA API request timed out:", error);
      
      // Try to get stale data from cache
      const staleLogs = await redis.get(GAMELOG_CACHE_KEY) as PlayerGameLog[] | null;
      if (staleLogs) {
        console.log("Using stale playoff game logs after timeout");
        return staleLogs;
      }
      
      console.log("No stale data available, returning empty array since playoffs may not have started yet");
      return [];
    }
    
    console.error("Error in cron job:", error);
    return { success: false, error: String(error) };
  }
};

// API route handler
export async function GET(request: Request) {
  // Check for secret to prevent unauthorized access
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  
  if (secret !== CRON_SECRET) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await fetchAndCachePlayoffGameLogs();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error running cron job:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
} 