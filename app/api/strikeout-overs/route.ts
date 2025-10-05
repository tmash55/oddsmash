import { createClient } from "@/libs/supabase/server"
import { NextResponse } from "next/server"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const hitRate = searchParams.get('hit_rate') || '0.8'
    
    const supabase = createClient()

    // Call the get_strikeout_over_candidates RPC function with correct parameter name
    const { data, error } = await supabase.rpc('get_strikeout_over_candidates', {
      min_hit_rate: parseFloat(hitRate)
    })

    if (error) {
      console.error("Error fetching strikeout over candidates:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Error in strikeout-overs route:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 