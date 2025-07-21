import { createClient } from "@/libs/supabase/server"
import { NextResponse } from "next/server"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const hitRate = searchParams.get("hit_rate") || "0.9"
    const sampleSpan = searchParams.get("sample_span") || "last_10"

    // Create the Supabase client
    const supabase = createClient()

    // Call the RPC function with correct parameter names
    const { data, error } = await supabase.rpc("get_hit_consistency_candidates", {
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

    // Return the data if successful
    return NextResponse.json(data)
  } catch (error) {
    // Log the full error for debugging
    console.error("Error in hit consistency API route:", error)
    
    // Return a generic error message to the client
    return NextResponse.json(
      { error: "Failed to fetch hit consistency data" },
      { status: 500 }
    )
  }
} 