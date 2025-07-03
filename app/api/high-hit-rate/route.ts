import { createClient } from "@/libs/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const hitRate = searchParams.get("hit_rate") || "0.9"
    const sampleSpan = searchParams.get("sample_span") || "last_10"

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

    return NextResponse.json(data)
  } catch (err) {
    console.error("Server error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 