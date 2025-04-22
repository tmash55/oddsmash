import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { SCOREBOARD_CACHE_KEY, SCOREBOARD_CACHE_TTL } from "@/app/api/kotp/constants";

// Initialize Redis client
const redis = Redis.fromEnv();

// Only allow authorized requests to trigger this endpoint
const CRON_SECRET = process.env.CRON_SECRET || "";

// Use Node.js runtime for better performance
export const runtime = 'nodejs';

// Fetch today's scoreboard
async function fetchScoreboard() {
  try {
    console.log("Fetching NBA scoreboard data...");
    const startTime = Date.now();
    
    const res = await fetch(
      "https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json",
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
    
    const duration = Date.now() - startTime;
    console.log(`Scoreboard fetch completed in ${duration}ms with status: ${res.status}`);
    
    if (!res.ok) {
      throw new Error(`Scoreboard fetch failed: ${res.status}`);
    }
    
    const data = await res.json();
    return { 
      scoreboard: data.scoreboard,
      executionTime: duration
    };
  } catch (error) {
    console.error("Error fetching scoreboard:", error);
    throw error;
  }
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
    console.log("Authorized request received for fetching scoreboard");
    
    // Get scoreboard data
    const { scoreboard, executionTime } = await fetchScoreboard();
    
    // Store in Redis cache with shorter TTL
    await redis.set(SCOREBOARD_CACHE_KEY, scoreboard, { ex: SCOREBOARD_CACHE_TTL });
    
    // Check if there are active games
    const hasActiveGames = scoreboard.games.some((game: any) => 
      game.gameStatus !== 3 && game.gameStatus !== 1 // Not final (3) or not scheduled (1)
    );
    
    return NextResponse.json({
      success: true,
      message: "Successfully fetched and cached scoreboard data",
      gamesCount: scoreboard.games.length,
      hasActiveGames,
      executionTime: `${executionTime}ms`
    });
  } catch (error) {
    console.error("Error fetching scoreboard:", error);
    
    // Try to get stale data from cache
    const cachedScoreboard = await redis.get(SCOREBOARD_CACHE_KEY);
    if (cachedScoreboard) {
      console.log("Returning stale scoreboard data from cache");
      return NextResponse.json({
        success: true,
        message: "Using stale scoreboard data due to fetch error",
        fromCache: true,
        stale: true,
        error: String(error)
      });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: String(error),
      message: "Error fetching scoreboard data and no cache available"
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

    console.log("Authorized POST request received for fetching scoreboard");
    
    // Get scoreboard data
    const { scoreboard, executionTime } = await fetchScoreboard();
    
    // Store in Redis cache with shorter TTL
    await redis.set(SCOREBOARD_CACHE_KEY, scoreboard, { ex: SCOREBOARD_CACHE_TTL });
    
    // Check if there are active games
    const hasActiveGames = scoreboard.games.some((game: any) => 
      game.gameStatus !== 3 && game.gameStatus !== 1 // Not final (3) or not scheduled (1)
    );
    
    return NextResponse.json({
      success: true,
      message: "Successfully fetched and cached scoreboard data",
      gamesCount: scoreboard.games.length,
      hasActiveGames,
      executionTime: `${executionTime}ms`
    });
  } catch (error) {
    console.error("Error fetching scoreboard (POST):", error);
    
    // Try to get stale data from cache
    const cachedScoreboard = await redis.get(SCOREBOARD_CACHE_KEY);
    if (cachedScoreboard) {
      console.log("Returning stale scoreboard data from cache");
      return NextResponse.json({
        success: true,
        message: "Using stale scoreboard data due to fetch error",
        fromCache: true,
        stale: true,
        error: String(error)
      });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: String(error),
      message: "Error fetching scoreboard data and no cache available"
    }, { status: 500 });
  }
} 