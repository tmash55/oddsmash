import { redis } from "@/lib/redis";
import { GAMELOG_CACHE_KEY, CACHE_TTL, PlayerGameLog } from "@/app/api/kotp/constants";
const CRON_SECRET = process.env.CRON_SECRET || "";

// Set a more aggressive timeout than the default
const NBA_API_TIMEOUT = 8000; // 8 seconds


// Define a type for the function result
type FetchResult = {
  success: boolean;
  message: string;
  data: PlayerGameLog[];
  error?: string;
  fromCache?: boolean;
};

export async function fetchPlayoffGameLogs(): Promise<FetchResult> {
  const url = "https://stats.nba.com/stats/leaguegamelog?Counter=0&DateFrom=&DateTo=&Direction=DESC&LeagueID=00&PlayerOrTeam=P&Season=2024-25&SeasonType=Playoffs&Sorter=DATE";

  try {
    // Return cached data immediately if available (don't wait for fresh data)
    const cachedLogs = await redis.get(GAMELOG_CACHE_KEY) as PlayerGameLog[] | null;
    
    // Set up a timeout for the NBA API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), NBA_API_TIMEOUT);
    
    try {
      console.log("Fetching fresh playoff game logs data");
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
        return {
          success: true,
          message: "Cached empty game logs data",
          data: emptyLogs
        };
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
      
      return {
        success: true,
        message: `Cached ${gameLogs.length} game logs`,
        data: gameLogs
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error("NBA API fetch error:", fetchError);
      
      // If we had cached data, return that instead
      if (cachedLogs) {
        console.log("Returning cached data due to fetch error");
        return {
          success: true,
          message: "Using cached data due to fetch error",
          data: cachedLogs,
          fromCache: true
        };
      }
      
      // Otherwise return empty data
      return {
        success: false,
        message: "Error fetching data and no cache available",
        data: [],
        error: String(fetchError)
      };
    }
  } catch (error) {
    console.error("Error in fetchPlayoffGameLogs:", error);
    return {
      success: false,
      error: String(error),
      data: [],
      message: "Unexpected error in fetchPlayoffGameLogs function"
    };
  }
}