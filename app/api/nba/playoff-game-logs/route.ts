// /app/api/playoff-game-logs/route.ts
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = "https://stats.nba.com/stats/leaguegamelog?Counter=0&DateFrom=&DateTo=&Direction=DESC&LeagueID=00&PlayerOrTeam=P&Season=2023-24&SeasonType=Playoffs&Sorter=DATE";

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Referer": "https://www.nba.com/",
        "Accept": "application/json",
        "Origin": "https://www.nba.com",
        "x-nba-stats-origin": "stats",
        "x-nba-stats-token": "true",
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

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

    // Return the successful response
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      }
    });
  } catch (error) {
    // Handle general errors
    console.error("Failed to fetch NBA data", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch NBA data", 
        message: error instanceof Error ? error.message : String(error)
      }, 
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    );
  }
}
