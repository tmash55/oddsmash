import { createClient } from "@/libs/supabase/server"
import { NextResponse } from "next/server"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient()

    // Call the get_hit_streaks RPC function
    const { data, error } = await supabase.rpc('get_hit_streaks')

    if (error) {
      console.error("Error fetching hit streaks:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Error in get_hit_streaks route:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 