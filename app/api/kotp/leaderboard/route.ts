import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { 
  GAMELOG_CACHE_KEY, 
  LEADERBOARD_CACHE_KEY,
  PlayerGameLog,
  SeriesRecord
} from "../constants";

// Use serverless runtime for longer timeouts
export const runtime = 'nodejs';

// Make this route dynamic instead of static
export const dynamic = 'force-dynamic';

// Initialize Redis client
const redis = Redis.fromEnv();

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

// Helper function to format date to NBA format (YYYY-MM-DD)
function formatDateToNBAFormat(date: Date): string {
  return date.toISOString().split('T')[0];
}

export async function GET() {
  console.log("Fetching KOTP leaderboard data");
  try {
    // Try to get cached leaderboard data first
    const cachedLeaderboard = await redis.get(LEADERBOARD_CACHE_KEY) as LeaderboardCache | null;
    const lastUpdated = new Date().toLocaleString();
    
    if (cachedLeaderboard) {
      console.log("Using cached leaderboard data");
      return NextResponse.json({
        ...cachedLeaderboard,
        lastUpdated,
        fromCache: true,
      }, {
        headers: {
          'X-Cache': 'hit',
        }
      });
    }
    
    console.log("Cache miss - building leaderboard data from game logs");
    
    // Try to build from game logs cache
    const gameLogs = await redis.get(GAMELOG_CACHE_KEY) as PlayerGameLog[] | null;
    
    if (!gameLogs || gameLogs.length === 0) {
      // No game logs available
      console.log("No cached game logs available");
      return NextResponse.json({
        players: [],
        lastUpdated,
        playoffRound: "Round 1",
        message: "No playoff data available yet"
      }, {
        headers: {
          'X-Cache': 'miss',
        }
      });
    }
    
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
    const leaderboard: LeaderboardCache = {
      players,
      playoffRound: "Round 1",
    };
    
    // Cache the leaderboard
    await redis.set(LEADERBOARD_CACHE_KEY, leaderboard, { ex: 60 * 30 }); // Cache for 30 minutes
    
    return NextResponse.json({
      ...leaderboard,
      lastUpdated,
      fromCache: false,
    }, {
      headers: {
        'X-Cache': 'miss',
      }
    });
    
  } catch (error) {
    console.error("Error building leaderboard:", error);
    
    // Try to return stale data if available
    const staleLeaderboard = await redis.get(LEADERBOARD_CACHE_KEY) as LeaderboardCache | null;
    if (staleLeaderboard) {
      console.log("Returning stale leaderboard data after error");
      return NextResponse.json({
        ...staleLeaderboard,
        lastUpdated: new Date().toLocaleString(),
        fromCache: true,
        stale: true,
      }, {
        headers: {
          'X-Cache': 'stale',
        }
      });
    }
    
    // No data available
    return NextResponse.json({
      players: [],
      error: "Error fetching leaderboard data",
      message: String(error),
      lastUpdated: new Date().toLocaleString(),
    }, { status: 500 });
  }
} 