import { redis } from "@/lib/redis";
import { GAMELOG_CACHE_KEY, CACHE_TTL, PlayerGameLog } from "@/app/api/kotp/constants";
const CRON_SECRET = process.env.CRON_SECRET || "";

// Set a more aggressive timeout than the default
const NBA_API_TIMEOUT = 25000; // Increase to 25 seconds for better reliability

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
    
    console.log("Checking for cached playoff game logs...");
    if (cachedLogs && Array.isArray(cachedLogs) && cachedLogs.length > 0) {
      console.log(`Found ${cachedLogs.length} cached playoff game logs. Using cache.`);
      return {
        success: true,
        message: `Using ${cachedLogs.length} cached game logs`,
        data: cachedLogs,
        fromCache: true
      };
    } else {
      console.log("No cached game logs found or cache is empty. Fetching fresh data.");
    }
    
    // Set up a timeout for the NBA API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), NBA_API_TIMEOUT);
    
    try {
      console.log("Fetching fresh playoff game logs data from NBA API");
      console.log("Request URL:", url);
      
      const startTime = Date.now();
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
      const requestTime = Date.now() - startTime;
      console.log(`NBA API request completed in ${requestTime}ms with status: ${response.status}`);
      
      if (!response.ok) {
        let errorText = "";
        try {
          errorText = await response.text();
          errorText = errorText.substring(0, 200); // Just a preview of the error
        } catch (e) {
          errorText = "Could not read error response";
        }
        
        throw new Error(`Failed to fetch playoff game logs: ${response.status} - ${errorText}`);
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
      
      console.log(`Found ${rows.length} game logs in the NBA API response`);

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

      console.log(`Processed ${gameLogs.length} game logs, sample player: ${gameLogs[0]?.playerName || 'none'}`);
      
      // Store in Redis cache - use a longer TTL since this data doesn't change
      await redis.set(GAMELOG_CACHE_KEY, gameLogs, { ex: CACHE_TTL * 2 }); // Doubling the cache TTL
      console.log(`Stored ${gameLogs.length} playoff game logs in cache`);
      
      return {
        success: true,
        message: `Cached ${gameLogs.length} game logs`,
        data: gameLogs
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      // Handle fetch timeout or error
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