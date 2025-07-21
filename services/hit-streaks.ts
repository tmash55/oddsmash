import { HitStreakPlayer } from "@/components/hit-sheets/types"

// Fetch hit streaks with optional sport parameter
export async function fetchHitStreaks(): Promise<HitStreakPlayer[]>
export async function fetchHitStreaks(sport: string): Promise<HitStreakPlayer[]>
export async function fetchHitStreaks(sport?: string): Promise<HitStreakPlayer[]> {
  try {
    // For now, return mock data
    return [
      {
        id: 1,
        player_id: 123,
        full_name: "Mock Player 1",
        team_name: "Mock Team",
        team_abbreviation: "MCK",
        streak_length: 5,
        streak_end: new Date().toISOString(),
        total_home_runs: 3,
        is_playing_today: true,
        hit_odds_json: {
          draftkings: { odds: 120, over_link: "https://example.com" },
          fanduel: { odds: 115, over_link: "https://example.com" }
        },
        away_team_name: "Away Team",
        home_team_name: "Home Team",
        commence_time: new Date().toISOString(),
        market: "Hits",
        line: 1.5,
        updated_at: new Date().toISOString()
      }
    ]
  } catch (error) {
    console.error('Error fetching hit streaks:', error)
    throw error
  }
} 