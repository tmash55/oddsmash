import { createClient } from "@/libs/supabase/server"
import { NextResponse } from "next/server"
import { getCachedHighHitRate, setCachedHighHitRate } from "@/lib/redis/hit-sheets"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const hitRate = searchParams.get("hit_rate") || "0.9"
    const sampleSpan = searchParams.get("sample_span") || "last_10"

    // Try to get cached data first
    const cachedData = await getCachedHighHitRate(hitRate, sampleSpan)
    if (cachedData) {
      console.log('[Redis] Cache HIT - Found high hit rate data')
      return NextResponse.json(cachedData)
    }

    console.log('[Redis] Cache MISS - Fetching high hit rate data from database')

    // Create the Supabase client
    const supabase = createClient()

    // Call the RPC function with correct parameter names
    const { data, error } = await supabase.rpc("get_high_hit_rate_profiles", {
      min_hit_rate: parseFloat(hitRate),
      sample_span: sampleSpan
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
    await setCachedHighHitRate(data, hitRate, sampleSpan)
    console.log(`[Redis] Cached high hit rate data for hitRate=${hitRate}, sampleSpan=${sampleSpan}`)

    // Return the data if successful
    return NextResponse.json(data)
  } catch (error) {
    // Log the full error for debugging
    console.error("Error in high hit rate API route:", error)
    
    // Return a generic error message to the client
    return NextResponse.json(
      { error: "Failed to fetch high hit rate data" },
      { status: 500 }
    )
  }
} 