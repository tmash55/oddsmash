import { createClient } from "@/libs/supabase/server"
import { NextResponse } from "next/server"
import { getCachedBounceBackCandidates, setCachedBounceBackCandidates } from "@/lib/redis/hit-sheets"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const hitRate = searchParams.get("hit_rate") || "0.6"
    const sampleSpan = searchParams.get("sample_span") || "last_20"

    // Try to get cached data first
    const cachedData = await getCachedBounceBackCandidates(hitRate, sampleSpan)
    if (cachedData) {
      console.log('[Redis] Cache HIT - Found bounce back candidates data')
      return NextResponse.json(cachedData)
    }

    console.log('[Redis] Cache MISS - Fetching bounce back candidates from database')

    // Create the Supabase client
    const supabase = createClient()

    // Call the RPC function with correct parameter names
    const { data, error } = await supabase.rpc("get_bounce_back_candidates", {
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
    await setCachedBounceBackCandidates(data, hitRate, sampleSpan)
    console.log(`[Redis] Cached bounce back candidates data for hitRate=${hitRate}, sampleSpan=${sampleSpan}`)

    // Return the data if successful
    return NextResponse.json(data)
  } catch (error) {
    // Log the full error for debugging
    console.error("Error in bounce back candidates API route:", error)
    
    // Return a generic error message to the client
    return NextResponse.json(
      { error: "Failed to fetch bounce back candidates data" },
      { status: 500 }
    )
  }
} 