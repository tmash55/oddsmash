import { createClient } from "@/libs/supabase/server"
import { NextResponse } from "next/server"
import { getCachedHitStreaks, setCachedHitStreaks } from "@/lib/redis/hit-sheets"

export async function GET() {
  try {
    // Try to get cached data first
    const cachedData = await getCachedHitStreaks()
    if (cachedData) {
      console.log('[Redis] Cache HIT - Found hit streaks data')
      return NextResponse.json(cachedData)
    }

    console.log('[Redis] Cache MISS - Fetching hit streaks from database')

    const supabase = createClient()

    // Call the get_hit_streaks RPC function
    const { data, error } = await supabase.rpc('get_hit_streaks')

    if (error) {
      console.error("Error fetching hit streaks:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Cache the results before returning
    await setCachedHitStreaks(data || [])
    console.log(`[Redis] Cached ${data?.length || 0} hit streaks`)

    return NextResponse.json(data)
  } catch (err) {
    console.error("Error in get_hit_streaks route:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 