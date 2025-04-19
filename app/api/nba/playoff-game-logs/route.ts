// /app/api/playoff-game-logs/route.ts
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";

// Use serverless runtime for longer timeouts (60 seconds vs 10 seconds for edge)
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

// Initialize Redis client
const redis = Redis.fromEnv();

// Redis cache key
const CACHE_KEY = "nba_playoff_game_logs";
const CACHE_TTL = 60 * 5; // 5 minutes in seconds

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  
  try {
    console.log("NBA Playoff Game Logs API called", new Date().toISOString());
    
    // Log Redis connection status
    console.log("Redis client initialized:", !!redis);
    try {
      await redis.ping();
      console.log("Redis connection test: SUCCESS");
    } catch (redisError) {
      console.error("Redis connection test: FAILED", redisError);
    }
    
    // Try to get data from Redis cache first
    let cachedData = null;
    try {
      console.log("Attempting to fetch from Redis cache");
      cachedData = await redis.get(CACHE_KEY);
      console.log("Cache result:", cachedData ? "HIT" : "MISS");
    } catch (cacheError) {
      console.error("Redis cache fetch error:", cacheError);
    }
    
    if (cachedData) {
      console.log("Using cached NBA playoff game logs data");
      return NextResponse.json(cachedData, {
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
          'X-Cache': 'HIT'
        }
      });
    }
    
    console.log("Cache miss - fetching fresh NBA playoff game logs data");
    // If not in cache, fetch from NBA API
    const url = "https://stats.nba.com/stats/leaguegamelog?Counter=0&DateFrom=&DateTo=&Direction=DESC&LeagueID=00&PlayerOrTeam=P&Season=2023-24&SeasonType=Playoffs&Sorter=DATE";

    const response = await fetchWithTimeout(
      url,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          "Referer": "https://www.nba.com/",
          "Accept": "application/json",
          "Origin": "https://www.nba.com",
          "x-nba-stats-origin": "stats",
          "x-nba-stats-token": "true",
        },
      },
      20000 // 20 second timeout - give it a bit more time
    );

    // Check if response is OK
    if (!response.ok) {
      // Try to read the response content for better error messages
      let errorText = "";
      try {
        errorText = await response.text();
        // Limit the error text to prevent huge responses
        errorText = errorText.substring(0, 500) + (errorText.length > 500 ? "..." : "");
      } catch (e) {
        errorText = "Could not read error response";
      }

      console.error(`NBA API returned ${response.status}: ${errorText}`);
      return NextResponse.json(
        { 
          error: `NBA API error (${response.status})`, 
          details: errorText
        }, 
        { 
          status: response.status,
          headers: {
            'Cache-Control': 'no-store'
          }
        }
      );
    }

    // Try to parse the response as JSON
    let data;
    try {
      data = await response.json();
    } catch (e) {
      // The response wasn't valid JSON
      const text = await response.text();
      console.error("Invalid JSON response:", text.substring(0, 500)); // Log a preview
      return NextResponse.json(
        { 
          error: "Invalid JSON response from NBA API", 
          details: text.substring(0, 500) // First 500 chars for debugging
        }, 
        { 
          status: 500,
          headers: {
            'Cache-Control': 'no-store'
          }
        }
      );
    }

    // Check if NBA API returned data in the expected format
    if (!data.resultSets || !data.resultSets[0]) {
      console.error("Unexpected NBA API response format:", JSON.stringify(data).substring(0, 500));
      return NextResponse.json(
        { 
          error: "NBA API returned unexpected data format", 
          data: data 
        }, 
        { 
          status: 500,
          headers: {
            'Cache-Control': 'no-store'
          }
        }
      );
    }

    // Store the data in Redis cache
    await redis.set(CACHE_KEY, data, { ex: CACHE_TTL });
    console.log("Stored NBA playoff game logs data in cache");

    // Return the successful response
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      }
    });
  } catch (error) {
    console.error("Error fetching game logs:", error);
    
    // Try to get stale data from cache if there's an error
    try {
      const cacheKey = `game-logs-${startDate}-${endDate}`;
      const staleData = await redis.get(cacheKey);
      
      if (staleData) {
        console.log("Using stale game logs data after error");
        return NextResponse.json(
          staleData,
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
        games: [],
        lastUpdated: new Date().toISOString(),
        error: "Failed to fetch game logs - empty result returned" 
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
