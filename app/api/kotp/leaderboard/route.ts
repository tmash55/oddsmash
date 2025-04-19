import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

// Use serverless runtime for longer timeouts (60 seconds vs 10 seconds for edge)
export const runtime = 'nodejs';

// Make this route dynamic instead of static
export const dynamic = 'force-dynamic';

// Initialize Redis client
const redis = Redis.fromEnv();

// Redis cache keys and TTL
const GAMELOG_CACHE_KEY = "kotp_playoff_game_logs";
const LEADERBOARD_CACHE_KEY = "kotp_leaderboard";
const SCOREBOARD_CACHE_KEY = "kotp_scoreboard";
const CACHE_TTL = 60 * 5; // 5 minutes in seconds
const SCOREBOARD_CACHE_TTL = 60; // 1 minute for more frequent updates

type PlayerGameLog = {
  playerId: string;
  playerName: string;
  teamAbbreviation: string;
  teamId: string;
  gameId: string;
  gameDate: string;
  matchup: string;
  points: number;
  winLoss: string;
};

type SeriesRecord = {
  wins: number;
  losses: number;
  eliminated: boolean;
  advanced: boolean;
};

// New type for tracking series between two teams
type TeamSeriesMap = {
  [teamId: string]: SeriesRecord;
};

type Player = {
  personId: string;
  name: string;
  teamTricode: string;
  points: number; // Total playoff points
  livePts: number; // Points from currently active game
  totalPts: number; // Combined total (playoff + live)
  gamesPlayed: number;
  ppg: number; // Points per game
  gameStatus: string; // Current game status if applicable
  liveMatchup: string; // Current game matchup if applicable
  isPlaying: boolean; // Whether the player is in an active game
  oncourt: boolean; // Whether the player is on the court right now
  playedToday: boolean; // Whether the player played in a game today
  seriesRecord: SeriesRecord; // Playoff series record
};

// Helper function to fetch with timeout
async function fetchWithTimeout(url: string, options = {}, timeout = 15000) {
  const controller = new AbortController();
  const { signal } = controller;
  
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { 
      ...options, 
      signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function fetchPlayoffGameLogs() {
  const url = "https://stats.nba.com/stats/leaguegamelog?Counter=0&DateFrom=&DateTo=&Direction=DESC&LeagueID=00&PlayerOrTeam=P&Season=2024-25&SeasonType=Playoffs&Sorter=DATE";

  try {
    // Try to get data from Redis cache first
    const cachedLogs = await redis.get(GAMELOG_CACHE_KEY) as PlayerGameLog[] | null;
    
    if (cachedLogs) {
      console.log("Using cached playoff game logs data");
      return cachedLogs;
    }
    
    console.log("Cache miss - fetching fresh playoff game logs data");
    
    // Set a more aggressive timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Reduced to 15 seconds
    
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
          next: { revalidate: 300 }, // Cache for 5 minutes
        }
      );
      
      clearTimeout(timeoutId);
      
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
        // Return empty array but cache it too so we don't hammer the API
        const emptyLogs: PlayerGameLog[] = [];
        await redis.set(GAMELOG_CACHE_KEY, emptyLogs, { ex: 60 * 15 }); // Cache for 15 minutes
        return emptyLogs;
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
      console.log("Stored playoff game logs in cache");
      
      return gameLogs;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      // Handle fetch timeout or error
      console.error("NBA API fetch error:", fetchError);
      // Re-throw to be handled by outer catch
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
    
    console.error("Error fetching playoff game logs:", error);
    return [];
  }
}

async function fetchScoreboard() {
  try {
    // Try to get data from Redis cache first
    const cachedScoreboard = await redis.get(SCOREBOARD_CACHE_KEY) as any;
    
    if (cachedScoreboard) {
      console.log("Using cached scoreboard data");
      return cachedScoreboard;
    }
    
    console.log("Cache miss - fetching fresh scoreboard data");
    
    const res = await fetchWithTimeout(
      "https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json",
      {
        next: { revalidate: 60 },
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          "Referer": "https://www.nba.com/",
          "Accept": "application/json",
          "Origin": "https://www.nba.com",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
        },
      },
      10000 // 10 second timeout
    );
    
    if (!res.ok) {
      let errorText = "";
      try {
        errorText = await res.text();
        errorText = errorText.substring(0, 200); // Just a preview of the error
      } catch (e) {
        errorText = "Could not read error response";
      }
      
      throw new Error(`Failed to fetch scoreboard: ${res.status} - ${errorText}`);
    }
    
    const data = await res.json();
    
    // Store in Redis cache with shorter TTL since it updates more frequently
    await redis.set(SCOREBOARD_CACHE_KEY, data.scoreboard, { ex: SCOREBOARD_CACHE_TTL });
    console.log("Stored scoreboard data in cache");
    
    return data.scoreboard;
  } catch (error) {
    // Check if this is a timeout error
    if (error instanceof Error && error.name === 'AbortError') {
      console.error("NBA Scoreboard API request timed out:", error);
      
      // Try to get stale data from cache
      const staleScoreboard = await redis.get(SCOREBOARD_CACHE_KEY) as any;
      if (staleScoreboard) {
        console.log("Using stale scoreboard data after timeout");
        return staleScoreboard;
      }
      
      return { games: [] };
    }
    
    console.error("Error fetching scoreboard:", error);
    return { games: [] };
  }
}

async function fetchBoxscore(gameId: string) {
  try {
    const res = await fetch(
      `https://cdn.nba.com/static/json/liveData/boxscore/boxscore_${gameId}.json`,
      {
        next: { revalidate: 60 },
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          "Referer": "https://www.nba.com/",
          "Accept": "application/json",
          "Origin": "https://www.nba.com",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
        },
      }
    );
    
    if (!res.ok) {
      let errorText = "";
      try {
        errorText = await res.text();
        errorText = errorText.substring(0, 200); // Just a preview of the error
      } catch (e) {
        errorText = "Could not read error response";
      }
      
      throw new Error(`Failed to fetch boxscore for game ${gameId}: ${res.status} - ${errorText}`);
    }
    
    const data = await res.json();
    return data.game;
  } catch (error) {
    console.error(`Error fetching boxscore for game ${gameId}:`, error);
    return null;
  }
}

function formatDateToNBAFormat(date: Date): string {
  // NBA API format is like "2024-04-19"
  return date.toISOString().split('T')[0];
}

function getPlayerTeam(player: any): string {
  // Try different possible paths to the team code based on NBA API structure
  if (player.teamTricode) return player.teamTricode;
  if (player.statistics?.teamTricode) return player.statistics.teamTricode;
  if (player.statistics?.teamCode) return player.statistics.teamCode;
  if (player.statistics?.teamId && player.statistics?.teamCity) {
    return player.statistics.teamCity.substring(0, 3).toUpperCase();
  }
  if (player.teamId && player.team?.abbreviation) return player.team.abbreviation;
  
  // If we can't find a team code, return an empty string
  return "";
}

export async function GET() {
  try {
    console.log("KOTP Leaderboard API called", new Date().toISOString());
    
    // Log Redis connection status
    console.log("Redis client initialized:", !!redis);
    try {
      await redis.ping();
      console.log("Redis connection test: SUCCESS");
    } catch (redisError) {
      console.error("Redis connection test: FAILED", redisError);
    }
    
    // Try to get the complete leaderboard from Redis cache first
    let cachedLeaderboard = null;
    try {
      console.log("Attempting to fetch from Redis cache");
      cachedLeaderboard = await redis.get(LEADERBOARD_CACHE_KEY) as any;
      console.log("Cache result:", cachedLeaderboard ? "HIT" : "MISS");
    } catch (cacheError) {
      console.error("Redis cache fetch error:", cacheError);
    }
    
    if (cachedLeaderboard) {
      console.log("Using cached KOTP leaderboard data");
      return NextResponse.json(
        cachedLeaderboard,
        {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            'X-Cache': 'HIT'
          }
        }
      );
    }
    
    console.log("Cache miss - generating fresh KOTP leaderboard");
    
    // Get today's date in the format used by NBA APIs
    const today = formatDateToNBAFormat(new Date());
    
    // 1. Get all playoff game logs for completed games
    const playoffGameLogs = await fetchPlayoffGameLogs();
    
    // 2. Aggregate points per player
    const playerMap = new Map<string, Player>();
    
    // Track series records by team ID
    const teamSeriesRecords = new Map<string, TeamSeriesMap>();
    const opponentsByTeam = new Map<string, string>(); // Track opponent team IDs
    
    // Process completed games from playoff game logs
    if (Array.isArray(playoffGameLogs)) {
      playoffGameLogs.forEach((game: PlayerGameLog) => {
        // Parse matchup to determine teams
        // Example matchup: "LAL vs. DEN" or "LAL @ DEN"
        const matchupParts = game.matchup.split(/\s+@\s+|\s+vs\.\s+/);
        const isHomeTeam = game.matchup.includes("vs.");
        const playerTeam = game.teamAbbreviation;
        const opponentTeam = isHomeTeam ? matchupParts[1] : matchupParts[0];
        
        // Create a unique series key for each matchup
        const seriesKey = [playerTeam, opponentTeam].sort().join('-vs-');
        
        // Track team's opponent for series tracking
        if (!opponentsByTeam.has(playerTeam)) {
          opponentsByTeam.set(playerTeam, opponentTeam);
        }
        
        // Initialize team series record if needed
        if (!teamSeriesRecords.has(seriesKey)) {
          // Initialize the series record for both teams
          teamSeriesRecords.set(seriesKey, {
            [playerTeam]: {
              wins: 0,
              losses: 0,
              eliminated: false,
              advanced: false
            },
            [opponentTeam]: {
              wins: 0,
              losses: 0,
              eliminated: false,
              advanced: false
            }
          });
        }
        
        // Update series record based on win/loss
        const seriesRecord = teamSeriesRecords.get(seriesKey)!;
        if (game.winLoss === "W") {
          // Player's team won, so increment their wins and opponent's losses
          seriesRecord[playerTeam].wins += 1;
          seriesRecord[opponentTeam].losses += 1;
        } else if (game.winLoss === "L") {
          // Player's team lost, so increment their losses and opponent's wins
          seriesRecord[playerTeam].losses += 1;
          seriesRecord[opponentTeam].wins += 1;
        }
        
        // Check if team is eliminated (lost 4 games) or advanced (won 4 games)
        if (seriesRecord[playerTeam].wins === 4) {
          seriesRecord[playerTeam].advanced = true;
          seriesRecord[opponentTeam].eliminated = true;
        } else if (seriesRecord[playerTeam].losses === 4) {
          seriesRecord[playerTeam].eliminated = true;
          seriesRecord[opponentTeam].advanced = true;
        }
        
        if (!playerMap.has(game.playerId)) {
          playerMap.set(game.playerId, {
            personId: game.playerId,
            name: game.playerName,
            teamTricode: game.teamAbbreviation,
            points: 0,
            livePts: 0,
            totalPts: 0,
            gamesPlayed: 0,
            ppg: 0,
            gameStatus: "Completed",
            liveMatchup: "",
            isPlaying: false,
            oncourt: false,
            playedToday: false,
            seriesRecord: { 
              wins: seriesRecord[playerTeam].wins, 
              losses: seriesRecord[playerTeam].losses, 
              eliminated: seriesRecord[playerTeam].eliminated,
              advanced: seriesRecord[playerTeam].advanced
            },
          });
        }
        
        const player = playerMap.get(game.playerId)!;
        player.points += game.points;
        player.gamesPlayed += 1;
        
        // Update player's series record
        player.seriesRecord = { 
          wins: seriesRecord[playerTeam].wins, 
          losses: seriesRecord[playerTeam].losses, 
          eliminated: seriesRecord[playerTeam].eliminated,
          advanced: seriesRecord[playerTeam].advanced
        };
        
        // Check if this game is from today
        const isToday = game.gameDate === today;
        
        // If game is from today, also track as today's points
        if (isToday) {
          player.livePts = game.points;
          player.playedToday = true;
          player.liveMatchup = game.matchup;
          player.gameStatus = "Completed";
        }
        
        player.ppg = parseFloat((player.points / player.gamesPlayed).toFixed(1));
      });
    }
    
    // 3. Get live game data and add points from active games
    const scoreboard = await fetchScoreboard();
    let allGamesFinal = true;
    
    // Collect all game IDs from the playoff game logs
    const completedGameIds = new Set(
      Array.isArray(playoffGameLogs) 
        ? playoffGameLogs.map((log: PlayerGameLog) => log.gameId) 
        : []
    );
    
    // Process live games
    for (const game of scoreboard.games) {
      if (game.gameStatus !== 3) {
        allGamesFinal = false;
      }
      
      // Only proceed if the game is active or recently completed
      if (game.gameStatus >= 1) {
        const boxscore = await fetchBoxscore(game.gameId);
        if (!boxscore) continue;
        
        // Create a map of player IDs to team tricodes for this game
        const playerTeamMap = new Map<string, string>();
        
        // Extract home team info
        const homeTeamTricode = boxscore.homeTeam.teamTricode || 
                                boxscore.homeTeam.teamCode || 
                                (boxscore.homeTeam.teamCity ? boxscore.homeTeam.teamCity.substring(0, 3).toUpperCase() : "");
        
        // Extract away team info
        const awayTeamTricode = boxscore.awayTeam.teamTricode || 
                                boxscore.awayTeam.teamCode || 
                                (boxscore.awayTeam.teamCity ? boxscore.awayTeam.teamCity.substring(0, 3).toUpperCase() : "");
        
        // Map all home team players to home team tricode
        boxscore.homeTeam.players.forEach((player: any) => {
          playerTeamMap.set(player.personId, homeTeamTricode);
        });
        
        // Map all away team players to away team tricode
        boxscore.awayTeam.players.forEach((player: any) => {
          playerTeamMap.set(player.personId, awayTeamTricode);
        });
        
        const players = [
          ...boxscore.homeTeam.players,
          ...boxscore.awayTeam.players,
        ];
        
        const matchup = `${game.awayTeam.score} ${game.awayTeam.teamTricode} @ ${game.homeTeam.teamTricode} ${game.homeTeam.score}`;
        
        const gameStatus = 
          game.gameStatus === 2
            ? `${game.period}Q ${game.gameClock}`
            : game.gameStatusText;
        
        // Process players in this game
        players.forEach(player => {
          const playerId = player.personId;
          
          // Skip if this game is already in the game logs (to avoid double counting)
          if (completedGameIds.has(game.gameId)) return;
          
          // Try to get team info in different ways
          let teamTricode = getPlayerTeam(player);
          
          // If we couldn't get team from player object directly, try our playerTeamMap
          if (!teamTricode && playerTeamMap.has(playerId)) {
            teamTricode = playerTeamMap.get(playerId)!;
          }
          
          // Find opponent team and series key
          const opponentTeam = opponentsByTeam.get(teamTricode);
          const seriesKey = opponentTeam ? [teamTricode, opponentTeam].sort().join('-vs-') : null;
          
          // Get or create player record
          if (!playerMap.has(playerId)) {
            // Create new player record with team info from the boxscore
            playerMap.set(playerId, {
              personId: playerId,
              name: player.name,
              teamTricode: teamTricode,
              points: 0,
              livePts: 0,
              totalPts: 0,
              gamesPlayed: 0,
              ppg: 0,
              gameStatus: "",
              liveMatchup: "",
              isPlaying: false,
              oncourt: false,
              playedToday: false,
              seriesRecord: (seriesKey && teamSeriesRecords.get(seriesKey)) 
                ? { 
                    wins: teamSeriesRecords.get(seriesKey)![teamTricode].wins, 
                    losses: teamSeriesRecords.get(seriesKey)![teamTricode].losses, 
                    eliminated: teamSeriesRecords.get(seriesKey)![teamTricode].eliminated,
                    advanced: teamSeriesRecords.get(seriesKey)![teamTricode].advanced
                  }
                : {
                    wins: 0,
                    losses: 0,
                    eliminated: false,
                    advanced: false
                  },
            });
          } else if (!playerMap.get(playerId)!.teamTricode && teamTricode) {
            // If we already have the player but no team info, update it
            playerMap.get(playerId)!.teamTricode = teamTricode;
          }
          
          const playerData = playerMap.get(playerId)!;
          
          // Update with live game data
          playerData.livePts = player.statistics.points;
          playerData.isPlaying = true;
          playerData.playedToday = true;
          playerData.liveMatchup = matchup;
          playerData.gameStatus = gameStatus.trim();
          playerData.oncourt = player.oncourt === "1";
          
          // If the game is final, increment games played
          if (game.gameStatus === 3 && !completedGameIds.has(game.gameId)) {
            playerData.gamesPlayed += 1;
          }
        });
      }
    }
    
    // 4. Calculate total points (playoff points + live points)
    const playerEntries = Array.from(playerMap.entries());
    for (const [, player] of playerEntries) {
      player.totalPts = player.points + player.livePts;
      
      // Recalculate PPG
      if (player.gamesPlayed > 0) {
        player.ppg = parseFloat((player.totalPts / player.gamesPlayed).toFixed(1));
      }
    }
    
    // 5. Convert to array and sort by total points
    const leaderboardPlayers = Array.from(playerMap.values())
      .sort((a, b) => b.totalPts - a.totalPts);
    
    // Create the complete response object
    const leaderboardResponse = {
      players: leaderboardPlayers,
      allGamesFinal,
      playoffRound: "Round 1",
      lastUpdated: new Date().toISOString(),
    };
    
    // Store the complete response in Redis cache
    await redis.set(LEADERBOARD_CACHE_KEY, leaderboardResponse, { ex: CACHE_TTL });
    console.log("Stored KOTP leaderboard in cache");
    
    // Return the response with proper caching headers
    return NextResponse.json(
      leaderboardResponse,
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'X-Cache': 'MISS'
        }
      }
    );
  } catch (error) {
    console.error("Error generating leaderboard:", error);
    
    // Try to get stale data from cache if there's an error
    try {
      const staleLeaderboard = await redis.get(LEADERBOARD_CACHE_KEY);
      if (staleLeaderboard) {
        console.log("Using stale leaderboard data after error");
        return NextResponse.json(
          staleLeaderboard,
          {
            headers: {
              'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
              'X-Cache': 'STALE'
            }
          }
        );
      }
    } catch (redisError) {
      console.error("Failed to fetch stale data from cache:", redisError);
    }
    
    // Safety fallback: return empty but valid response if all else fails
    return NextResponse.json(
      { 
        players: [],
        allGamesFinal: true,
        playoffRound: "Round 1",
        lastUpdated: new Date().toISOString(),
        error: "Failed to generate leaderboard - empty result returned"
      },
      { 
        status: 200, // Return 200 instead of 500 to avoid client errors
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    );
  }
} 