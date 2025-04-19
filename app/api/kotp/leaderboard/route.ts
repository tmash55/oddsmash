import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { 
  GAMELOG_CACHE_KEY, 
  LEADERBOARD_CACHE_KEY,
  PlayerGameLog,
} from "../constants";

// Set runtime to nodejs to take advantage of longer timeout
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Define a minimal player type
type SimplePlayer = {
  personId: string;
  name: string;
  teamTricode: string;
  totalPts: number;
  ppg: number;
  gamesPlayed: number;
  seriesRecord: {
    wins: number;
    losses: number;
    eliminated: boolean;
    advanced: boolean;
  };
};

// Define a type for leaderboard cache structure
type LeaderboardCache = {
  players: SimplePlayer[];
  allGamesFinal: boolean;
  playoffRound: string;
};

// A more aggressive timeout for fetching data
const FETCH_TIMEOUT = 5000;

// Helper function to get current time formatted
function getFormattedTime() {
  return new Date().toLocaleTimeString();
}

// GET handler for the leaderboard API
export async function GET() {
  console.log("Leaderboard API called:", new Date().toISOString());
  
  try {
    // First try to get data from cache (most efficient)
    const cachedLeaderboard = await redis.get(LEADERBOARD_CACHE_KEY) as LeaderboardCache | null;
    if (cachedLeaderboard) {
      console.log("Using cached leaderboard data");
      return NextResponse.json({
        ...cachedLeaderboard,
        lastUpdated: getFormattedTime(),
        fromCache: true
      }, {
        headers: {
          'X-Cache': 'HIT'
        }
      });
    }
    
    // If no leaderboard cache, try to get raw game logs from cache 
    // (which should be populated by our background job)
    console.log("Leaderboard cache miss - checking for game logs cache");
    const cachedGameLogs = await redis.get(GAMELOG_CACHE_KEY) as PlayerGameLog[] | null;
    
    if (cachedGameLogs) {
      console.log("Using cached game logs to build leaderboard");
      
      // Process the game logs to build a simple leaderboard
      const playerMap: Record<string, SimplePlayer> = {};
      
      // Process the game logs
      cachedGameLogs.forEach(game => {
        if (!playerMap[game.playerId]) {
          playerMap[game.playerId] = {
            personId: game.playerId,
            name: game.playerName,
            teamTricode: game.teamAbbreviation,
            totalPts: 0,
            ppg: 0,
            gamesPlayed: 0,
            seriesRecord: {
              wins: 0,
              losses: 0,
              eliminated: false,
              advanced: false
            }
          };
        }
        
        // Add points
        playerMap[game.playerId].totalPts += game.points;
        playerMap[game.playerId].gamesPlayed++;
        
        // Update series record
        if (game.winLoss === 'W') {
          playerMap[game.playerId].seriesRecord.wins++;
        } else if (game.winLoss === 'L') {
          playerMap[game.playerId].seriesRecord.losses++;
        }
      });
      
      // Calculate PPG and determine advanced/eliminated
      Object.values(playerMap).forEach(player => {
        // Calculate PPG
        if (player.gamesPlayed > 0) {
          player.ppg = Number((player.totalPts / player.gamesPlayed).toFixed(1));
        }
        
        // Check for series completion
        if (player.seriesRecord.wins >= 4) {
          player.seriesRecord.advanced = true;
        } else if (player.seriesRecord.losses >= 4) {
          player.seriesRecord.eliminated = true;
        }
      });
      
      // Convert to array and sort by total points
      const players = Object.values(playerMap)
        .filter(player => player.totalPts > 0)
        .sort((a, b) => b.totalPts - a.totalPts);
      
      // Create basic leaderboard data 
      const leaderboardData = {
        players,
        allGamesFinal: true, // Since we're only showing historical data
        playoffRound: "Round 1",
        lastUpdated: getFormattedTime()
      };
      
      // Store this in cache for future requests
      await redis.set(LEADERBOARD_CACHE_KEY, {
        players,
        allGamesFinal: true,
        playoffRound: "Round 1"
      }, { ex: 300 }); // Cache for 5 minutes
      
      return NextResponse.json({
        ...leaderboardData,
        fromCache: false,
        usesCachedGameLogs: true
      }, {
        headers: {
          'X-Cache': 'MISS'
        }
      });
    }
    
    // If we have no cached data at all, return empty players array with a message
    console.log("No cached data available - returning empty leaderboard");
    return NextResponse.json({
      players: [],
      allGamesFinal: true,
      playoffRound: "Round 1",
      lastUpdated: getFormattedTime(),
      message: "No playoff data available yet. The background refresh job will populate data once games begin."
    });
  
  } catch (error) {
    console.error("Error generating leaderboard:", error);
    
    // Last resort - try to get stale cache data
    try {
      const staleLeaderboard = await redis.get(LEADERBOARD_CACHE_KEY) as LeaderboardCache | null;
      if (staleLeaderboard) {
        console.log("Returning stale leaderboard data after error");
        return NextResponse.json({
          ...staleLeaderboard,
          lastUpdated: getFormattedTime(),
          fromCache: true,
          staleData: true
        }, {
          headers: {
            'X-Cache': 'STALE'
          }
        });
      }
    } catch (cacheError) {
      console.error("Failed to get stale data:", cacheError);
    }
    
    // Nothing worked - return empty data
    return NextResponse.json({
      players: [],
      allGamesFinal: true,
      playoffRound: "Round 1",
      lastUpdated: getFormattedTime(),
      error: "Failed to generate leaderboard"
    });
  }
} 