import { HitStreakPlayer } from "@/components/hit-sheets/types"

// Fetch hit streaks with optional sport parameter
export async function fetchHitStreaks(): Promise<HitStreakPlayer[]>
export async function fetchHitStreaks(sport: string): Promise<HitStreakPlayer[]>
export async function fetchHitStreaks(sport?: string): Promise<HitStreakPlayer[]> {
  try {
    // For now, return mock data
    return [
      {
        player_id: 123,
        player_name: "Mock Player 1",
        team_name: "Mock Team",
        current_streak: 5,
        streak_details: {
          hits: [1, 2, 1, 1, 2],
          dates: ["2024-03-01", "2024-03-02", "2024-03-03", "2024-03-04", "2024-03-05"]
        }
      }
    ]
  } catch (error) {
    console.error('Error fetching hit streaks:', error)
    throw error
  }
} 