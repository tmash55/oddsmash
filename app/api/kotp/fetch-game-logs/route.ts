import { fetchPlayoffGameLogs } from "@/lib/kotp/fetchGameLogs";
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { 
  GAMELOG_CACHE_KEY
} from "@/app/api/kotp/constants";

// Initialize Redis client
const redis = Redis.fromEnv();

// Only allow authorized requests to trigger this endpoint
const CRON_SECRET = process.env.CRON_SECRET || "";

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
    console.log("Authorized request received for fetching game logs");
    const startTime = Date.now();
    const result = await fetchPlayoffGameLogs();
    const duration = Date.now() - startTime;
    
    // Return response with execution metrics
    return NextResponse.json({
      success: result.success,
      message: result.message,
      count: result.data?.length || 0,
      fromCache: result.fromCache || false,
      executionTime: `${duration}ms`
    });
  } catch (error) {
    console.error("Error fetching game logs:", error);
    return NextResponse.json({ 
      success: false, 
      error: String(error),
      message: "Error fetching game logs"
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

    console.log("Authorized POST request received for fetching game logs");
    const startTime = Date.now();
    const result = await fetchPlayoffGameLogs();
    const duration = Date.now() - startTime;
    
    // Return response with execution metrics
    return NextResponse.json({
      success: result.success,
      message: result.message,
      count: result.data?.length || 0,
      fromCache: result.fromCache || false,
      executionTime: `${duration}ms`
    });
  } catch (error) {
    console.error("Error fetching game logs (POST):", error);
    return NextResponse.json({ 
      success: false, 
      error: String(error),
      message: "Error fetching game logs"
    }, { status: 500 });
  }
} 