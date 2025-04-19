import { fetchPlayoffGameLogs } from "@/lib/kotp/fetchGameLogs";
import { NextResponse } from "next/server";




// Only allow authorized requests to trigger this endpoint
const CRON_SECRET = process.env.CRON_SECRET || "";

// Set a more aggressive timeout than the default
const NBA_API_TIMEOUT = 8000; // 8 seconds



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
