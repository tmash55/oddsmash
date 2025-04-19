import { fetchAndCachePlayoffGameLogs } from "@/lib/kotp/fetchGameLogs";
import { NextResponse } from "next/server";

// Only allow authorized requests to trigger this endpoint
const CRON_SECRET = process.env.CRON_SECRET || "";

// API route handler for GET requests
export async function GET(request: Request) {
  // Check for secret to prevent unauthorized access
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== CRON_SECRET) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const result = await fetchAndCachePlayoffGameLogs();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error running cron job:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
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
      console.error("Unauthorized QStash request - invalid secret");
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("Authorized QStash POST request received");
    const result = await fetchAndCachePlayoffGameLogs();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error processing QStash request:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
