import { createClient } from "@/libs/supabase/server"
import { NextResponse } from "next/server"
import { getCachedStrikeoutOvers, setCachedStrikeoutOvers } from "@/lib/redis/hit-sheets"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const hitRate = searchParams.get("hit_rate") || "0.8"

    // Try to get cached data first
    const cachedData = await getCachedStrikeoutOvers(hitRate)
    if (cachedData) {
      console.log('[Redis] Cache HIT - Found strikeout overs data')
      return NextResponse.json(cachedData)
    }

    console.log('[Redis] Cache MISS - Fetching strikeout overs from database')

    // Create the Supabase client
    const supabase = createClient()

    // Call the RPC function with correct parameter names
    const { data, error } = await supabase.rpc("get_strikeout_over_candidates", {
      min_hit_rate: parseFloat(hitRate)
    })

    // Handle Supabase errors
    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: "Database error: " + error.message },
        { status: 500 }
      )
    }

    // Cache the results before returning
    await setCachedStrikeoutOvers(data, hitRate)
    console.log(`[Redis] Cached strikeout overs data for hitRate=${hitRate}`)

    // Return the data if successful
    return NextResponse.json(data)
  } catch (error) {
    // Log the full error for debugging
    console.error("Error in strikeout overs API route:", error)
    
    // Return a generic error message to the client
    return NextResponse.json(
      { error: "Failed to fetch strikeout overs data" },
      { status: 500 }
    )
  }
} 