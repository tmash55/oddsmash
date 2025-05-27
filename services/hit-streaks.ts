import { createClient } from "@/libs/supabase/client"
import { HitStreakPlayer } from "@/components/hit-sheets/types"

/**
 * Fetch players with active hit streaks
 */
export async function fetchHitStreaks(): Promise<HitStreakPlayer[]> {
  try {
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

    return hitStreaks || []
  } catch (err) {
    console.error("Error in fetchHitStreaks:", err)
    throw err
  }
} 