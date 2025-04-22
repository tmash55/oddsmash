import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { 
  GAMELOG_CACHE_KEY, 
  LEADERBOARD_CACHE_KEY,
  SCOREBOARD_CACHE_KEY,
  PlayerGameLog,
  SeriesRecord
} from "@/app/api/kotp/constants";

// Initialize Redis client
const redis = Redis.fromEnv();

// Only allow authorized requests to trigger this endpoint
const CRON_SECRET = process.env.CRON_SECRET || "";

// Use Node.js runtime for better performance
export const runtime = 'nodejs';

// Types for player data
type Player = {
  personId: string;
  name: string;
  teamTricode: string;
  points: number; // Total playoff points
  livePts: number; // Points from currently active game
  totalPts: number; // Combined total (playoff + live)
  gamesPlayed: number;
  ppg: number; // Points per game
  gameStatus?: string; // Current game status if applicable
  liveMatchup?: string; // Current game matchup if applicable
  isPlaying: boolean; // Whether the player is in an active game
  oncourt: boolean; // Whether the player is on the court right now
  playedToday: boolean; // Whether the player played in a game today
  seriesRecord: SeriesRecord; // Playoff series record
};

// Type for the cached leaderboard structure
type LeaderboardCache = {
  players: Player[];
  playoffRound: string;
  allGamesFinal: boolean;
};

// Helper function to format date to NBA format (YYYY-MM-DD)
function formatDateToNBAFormat(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Helper to identify if a game is still in progress
function isGameInProgress(game: any): boolean {
  return game.gameStatus === 2; // 2 = in progress
}

// Get a boxscore for a game
async function fetchBoxscore(gameId: string) {
  try {
    const res = await fetch(
      `https://cdn.nba.com/static/json/liveData/boxscore/boxscore_${gameId}.json`,
      {
        cache: 'no-store',
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
      return null;
    }
    
    const data = await res.json();
    return data.game;
  } catch (error) {
    console.error(`Error fetching boxscore for game ${gameId}:`, error);
    return null;
  }
}

// Function to build leaderboard from game logs and live data
async function buildLeaderboard(): Promise<LeaderboardCache> {
  // Get cached game logs
  const cachedGameLogs = await redis.get(GAMELOG_CACHE_KEY) as PlayerGameLog[] | null;
  
  // Get cached scoreboard data
  const scoreboard = await redis.get(SCOREBOARD_CACHE_KEY) as any;
  
  // Map to store player data
  const playerMap: Record<string, Player> = {};
  
  // Flag to check if all games are final
  let allGamesFinal = true;
  let todayString = formatDateToNBAFormat(new Date());
  
  // Process historical game logs first
  if (cachedGameLogs && Array.isArray(cachedGameLogs)) {
    console.log(`Processing ${cachedGameLogs.length} historical game logs`);
    
    // Process each historical game log
    cachedGameLogs.forEach(game => {
      // Skip today's games as they'll be processed from live data
      if (game.gameDate === todayString) {
        return;
      }
      
      if (!playerMap[game.playerId]) {
        playerMap[game.playerId] = {
          personId: game.playerId,
          name: game.playerName,
          teamTricode: game.teamAbbreviation,
          points: 0,
          livePts: 0,
          totalPts: 0,
          gamesPlayed: 0,
          ppg: 0,
          isPlaying: false,
          oncourt: false,
          playedToday: false,
          seriesRecord: {
            wins: 0,
            losses: 0,
            eliminated: false,
            advanced: false
          }
        };
      }
      
      // Add historical points
      playerMap[game.playerId].points += game.points;
      playerMap[game.playerId].gamesPlayed++;
      
      // Update series record
      if (game.winLoss === 'W') {
        playerMap[game.playerId].seriesRecord.wins++;
      } else if (game.winLoss === 'L') {
        playerMap[game.playerId].seriesRecord.losses++;
      }
    });
  } else {
    console.log("No cached game logs found");
  }
  
  // Process live scoreboard data if available
  if (scoreboard && scoreboard.games && scoreboard.games.length > 0) {
    console.log(`Processing ${scoreboard.games.length} games from today's scoreboard`);
    
    // Get box scores for all active games
    const activeGamePromises = scoreboard.games.map(async (game: any) => {
      // Check if game is in progress or final
      if (game.gameStatus === 1) {
        // Game hasn't started
        return { game, boxscore: null };
      }
      
      if (isGameInProgress(game)) {
        allGamesFinal = false;
        // Fetch boxscore for active game
        const boxscore = await fetchBoxscore(game.gameId);
        return { game, boxscore };
      }
      
      // Game is final
      return { game, boxscore: null };
    });
    
    const gameResults = await Promise.all(activeGamePromises);
    
    // Process each game
    for (const { game, boxscore } of gameResults) {
      if (boxscore) {
        // Process active game boxscore
        const homeTeam = boxscore.homeTeam;
        const awayTeam = boxscore.awayTeam;
        
        // Process all players
        const allPlayers = [
          ...(homeTeam.players || []),
          ...(awayTeam.players || [])
        ];
        
        // Update player data
        allPlayers.forEach(player => {
          const playerId = String(player.personId);
          const playerStats = player.statistics || {};
          const points = Number(playerStats.points || 0);
          
          // Get team abbreviation
          const teamCode = player.teamTricode || 
                            playerStats.teamTricode || 
                            (homeTeam.players?.includes(player) ? homeTeam.teamTricode : awayTeam.teamTricode);
          
          if (!playerMap[playerId]) {
            // Create new player entry
            playerMap[playerId] = {
              personId: playerId,
              name: player.nameI || player.name,
              teamTricode: teamCode,
              points: 0,
              livePts: points,
              totalPts: points,
              gamesPlayed: 0,
              ppg: 0,
              gameStatus: boxscore.gameStatusText,
              liveMatchup: `${awayTeam.teamTricode} @ ${homeTeam.teamTricode}`,
              isPlaying: true,
              oncourt: player.oncourt === "1",
              playedToday: true,
              seriesRecord: {
                wins: 0,
                losses: 0,
                eliminated: false,
                advanced: false
              }
            };
          } else {
            // Update existing player
            playerMap[playerId].livePts = points;
            playerMap[playerId].gameStatus = boxscore.gameStatusText;
            playerMap[playerId].liveMatchup = `${awayTeam.teamTricode} @ ${homeTeam.teamTricode}`;
            playerMap[playerId].isPlaying = true;
            playerMap[playerId].oncourt = player.oncourt === "1";
            playerMap[playerId].playedToday = true;
          }
        });
      } 
      else if (game.gameStatus === 3) {
        // Process completed game from today (if not already in historical data)
        // This would need to fetch the boxscore or rely on the cached game logs
        // For simplicity we'll skip this as it should be handled in the next gameLog update
      }
    }
  }
  
  // Calculate totals and PPG for all players
  Object.values(playerMap).forEach(player => {
    // Set total points
    player.totalPts = player.points + player.livePts;
    
    // Calculate PPG
    if (player.gamesPlayed > 0) {
      player.ppg = Number((player.points / player.gamesPlayed).toFixed(1));
    }
    
    // Check for series completion
    if (player.seriesRecord.wins >= 4) {
      player.seriesRecord.advanced = true;
    } else if (player.seriesRecord.losses >= 4) {
      player.seriesRecord.eliminated = true;
    }
  });
  
  // Sort by total points
  const players = Object.values(playerMap).sort((a, b) => b.totalPts - a.totalPts);
  
  return {
    players,
    playoffRound: "Round 1", // Hardcoded for now - could be dynamic
    allGamesFinal
  };
}

// API route handler for GET requests
export async function GET(request: Request) {
  // Check for secret to prevent unauthorized access
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  
  if (secret !== CRON_SECRET) {
    console.log("Unauthorized access attempt - invalid secret");
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("Authorized request received for building leaderboard");
    const startTime = Date.now();
    
    // Build the leaderboard
    const leaderboard = await buildLeaderboard();
    
    // Cache the leaderboard
    await redis.set(LEADERBOARD_CACHE_KEY, leaderboard, { ex: 60 * 30 }); // Cache for 30 minutes
    
    const duration = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      message: "Successfully built and cached leaderboard",
      playerCount: leaderboard.players.length,
      allGamesFinal: leaderboard.allGamesFinal,
      executionTime: `${duration}ms`
    });
  } catch (error) {
    console.error("Error building leaderboard:", error);
    return NextResponse.json({ 
      success: false, 
      error: String(error),
      message: "Error building leaderboard"
    }, { status: 500 });
  }
}

// Also support POST for Upstash QStash compatibility
export async function POST(request: Request) {
  try {
    // Extract secret from either query param or body
    const url = new URL(request.url);
    const querySecret = url.searchParams.get("secret");
    
    // Try to get secret from body if not in query
    let bodySecret = null;
    try {
      const body = await request.json();
      bodySecret = body.secret;
    } catch (e) {
      // Body parsing failed, continue with query param check
    }
    
    const secret = querySecret || bodySecret;
    
    // Validate secret
    if (secret !== CRON_SECRET) {
      console.log("Unauthorized POST request - invalid secret");
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    console.log("Authorized POST request received for building leaderboard");
    const startTime = Date.now();
    
    // Build the leaderboard
    const leaderboard = await buildLeaderboard();
    
    // Cache the leaderboard
    await redis.set(LEADERBOARD_CACHE_KEY, leaderboard, { ex: 60 * 30 }); // Cache for 30 minutes
    
    const duration = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      message: "Successfully built and cached leaderboard",
      playerCount: leaderboard.players.length,
      allGamesFinal: leaderboard.allGamesFinal,
      executionTime: `${duration}ms`
    });
  } catch (error) {
    console.error("Error building leaderboard (POST):", error);
    return NextResponse.json({ 
      success: false, 
      error: String(error),
      message: "Error building leaderboard"
    }, { status: 500 });
  }
} 