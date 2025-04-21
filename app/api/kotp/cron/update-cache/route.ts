import { fetchPlayoffGameLogs } from "@/lib/kotp/fetchGameLogs";
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { 
  GAMELOG_CACHE_KEY, 
  LEADERBOARD_CACHE_KEY,
  PlayerGameLog,
  SeriesRecord
} from "@/app/api/kotp/constants";

// Initialize Redis client
const redis = Redis.fromEnv();

// Only allow authorized requests to trigger this endpoint
const CRON_SECRET = process.env.CRON_SECRET || "";

// Set a more aggressive timeout than the default
const NBA_API_TIMEOUT = 8000; // 8 seconds

// Helper function to format date to NBA format (YYYY-MM-DD)
function formatDateToNBAFormat(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Types for leaderboard generation
type Player = {
  personId: string;
  name: string;
  teamTricode: string;
  points: number; // Total playoff points
  gamesPlayed: number;
  ppg: number; // Points per game
  playedToday: boolean; // Whether the player played in a game today
  seriesRecord: SeriesRecord; // Playoff series record
};

// Add a type for the cached leaderboard structure
type LeaderboardCache = {
  players: Player[];
  playoffRound: string;
};

// Function to generate leaderboard from game logs
async function generateLeaderboard(gameLogs: PlayerGameLog[]): Promise<LeaderboardCache> {
  // Process the game logs to get player points
  const playersByID: { [key: string]: Player } = {};
  
  // First process the historical data
  gameLogs.forEach((game: PlayerGameLog) => {
    if (!playersByID[game.playerId]) {
      playersByID[game.playerId] = {
        personId: game.playerId,
        name: game.playerName,
        teamTricode: game.teamAbbreviation,
        points: 0,
        gamesPlayed: 0,
        ppg: 0,
        playedToday: false,
        seriesRecord: {
          wins: 0,
          losses: 0,
          eliminated: false,
          advanced: false,
        }
      };
    }
    
    // Add to the player's points
    playersByID[game.playerId].points += game.points;
    playersByID[game.playerId].gamesPlayed++;
    
    // Update series record
    if (game.winLoss === "W") {
      playersByID[game.playerId].seriesRecord.wins++;
    } else if (game.winLoss === "L") {
      playersByID[game.playerId].seriesRecord.losses++;
    }
    
    // Check if played today
    const today = formatDateToNBAFormat(new Date());
    if (game.gameDate === today) {
      playersByID[game.playerId].playedToday = true;
    }
  });
  
  // Calculate PPG
  Object.values(playersByID).forEach((player) => {
    if (player.gamesPlayed > 0) {
      player.ppg = Number((player.points / player.gamesPlayed).toFixed(1));
    }
  });
  
  // Process series outcomes
  Object.values(playersByID).forEach((player) => {
    // Skip players with no games played
    if (player.gamesPlayed === 0) return;
    
    const wins = player.seriesRecord.wins;
    const losses = player.seriesRecord.losses;
    
    // A team has advanced if they have 4 wins (series win)
    if (wins >= 4) {
      player.seriesRecord.advanced = true;
    }
    
    // A team has been eliminated if they have 4 losses (series loss)
    if (losses >= 4) {
      player.seriesRecord.eliminated = true;
    }
  });
  
  // Convert to array and sort by points (highest first)
  const players = Object.values(playersByID).sort((a, b) => b.points - a.points);
  
  // Create the leaderboard object
  return {
    players,
    playoffRound: "Round 1", // Hardcoded for now - could be dynamic
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
    console.log("Authorized GET request received");
    const result = await fetchPlayoffGameLogs();
    
    if (result.success && result.data.length > 0) {
      console.log("Successfully fetched game logs, generating leaderboard");
      
      // Generate leaderboard from the game logs
      const leaderboard = await generateLeaderboard(result.data);
      
      // Cache the leaderboard
      await redis.set(LEADERBOARD_CACHE_KEY, leaderboard, { ex: 60 * 30 }); // Cache for 30 minutes
      console.log(`Cached leaderboard with ${leaderboard.players.length} players`);
      
      // Return minimal response to reduce function execution time
      return NextResponse.json({
        success: true,
        message: `Updated game logs (${result.data.length}) and leaderboard (${leaderboard.players.length} players)`,
        gamelogs: result.data.length,
        players: leaderboard.players.length
      });
    }
    
    // Return minimal response to reduce function execution time
    return NextResponse.json({
      success: result.success,
      message: result.message,
      count: result.data?.length || 0
    });
  } catch (error) {
    console.error("Error running cron job (GET):", error);
    return NextResponse.json({ 
      success: false, 
      error: String(error),
      message: "Error in cron job execution"
    }, { status: 500 });
  }
}

// API route handler for POST requests - needed for QStash
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

    console.log("Authorized POST request received");
    const result = await fetchPlayoffGameLogs();
    
    if (result.success && result.data.length > 0) {
      console.log("Successfully fetched game logs, generating leaderboard");
      
      // Generate leaderboard from the game logs
      const leaderboard = await generateLeaderboard(result.data);
      
      // Cache the leaderboard
      await redis.set(LEADERBOARD_CACHE_KEY, leaderboard, { ex: 60 * 30 }); // Cache for 30 minutes
      console.log(`Cached leaderboard with ${leaderboard.players.length} players`);
      
      // Return minimal response to reduce function execution time
      return NextResponse.json({
        success: true,
        message: `Updated game logs (${result.data.length}) and leaderboard (${leaderboard.players.length} players)`,
        gamelogs: result.data.length,
        players: leaderboard.players.length
      });
    }
    
    // Return minimal response to reduce function execution time
    return NextResponse.json({
      success: result.success,
      message: result.message,
      count: result.data?.length || 0
    });
  } catch (error) {
    console.error("Error processing QStash request:", error);
    return NextResponse.json({ 
      success: false, 
      error: String(error),
      message: "Error in cron job execution"
    }, { status: 500 });
  }
}
