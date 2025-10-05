import { createClient } from "@/libs/supabase/server"
import { NextResponse } from "next/server"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport")?.toLowerCase()
    
    // Only allow MLB data
    if (sport && sport !== "mlb") {
      return NextResponse.json(
        { error: "Hit sheets are only available for MLB" },
        { status: 400 }
      )
    }

    const market = searchParams.get("market") || "Hits"
    const minHitRate = searchParams.get("minHitRate") ? parseFloat(searchParams.get("minHitRate")!) : 0.5

    // Create the Supabase client
    const supabase = createClient()

    // Build the query for MLB data only (league_id = 1)
    let query = supabase
      .from("player_hit_rate_profiles")
      .select("*")
      .eq("league_id", 1) // MLB only
      .eq("market", market)

    // Add hit rate filter
    query = query.gte("last_10_hit_rate", minHitRate * 100) // Convert decimal to percentage

    // Execute the query
    const { data, error } = await query

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: "Database error: " + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Server error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 