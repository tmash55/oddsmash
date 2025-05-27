import { createClient } from "@/libs/supabase/client"
import { HitStreakPlayer } from "@/components/hit-sheets/types"
import { getCachedHitStreaks, setCachedHitStreaks } from "@/lib/redis/hit-sheets"

/**
 * Fetch players with active hit streaks
 */
export async function fetchHitStreaks(): Promise<HitStreakPlayer[]> {
  try {
    // Try to get cached data first
    const cachedData = await getCachedHitStreaks()
    if (cachedData) {
      console.log('[Redis] Cache HIT - Found hit streaks data')
      return cachedData
    }

    console.log('[Redis] Cache MISS - Fetching hit streaks from database')

    const supabase = createClient()
    if (!supabase) {
      throw new Error("Failed to create Supabase client")
    }

    // Get players with active hit streaks
    const { data: hitStreaks, error } = await supabase
      .rpc('get_hit_streaks')

    if (error) {
      console.error("Error fetching hit streaks:", error)
      throw error
    }

    const data = hitStreaks || []

    // Cache the results before returning
    await setCachedHitStreaks(data)
    console.log(`[Redis] Cached ${data.length} hit streaks`)

    return data
  } catch (err) {
    console.error("Error in fetchHitStreaks:", err)
    throw err
  }
} 