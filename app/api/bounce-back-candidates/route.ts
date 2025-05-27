import { createClient } from "@/libs/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const hitRate = searchParams.get('hit_rate') || '0.6'
    const sampleSpan = searchParams.get('sample_span') || 'last_20'
    
    const supabase = createClient()

    // Call the get_bounce_back_candidates RPC function
    const { data, error } = await supabase.rpc('get_bounce_back_candidates', {
      min_hit_rate: parseFloat(hitRate),
      sample_span: sampleSpan
    })

    if (error) {
      console.error("Error fetching bounce back candidates:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Error in bounce-back-candidates route:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 