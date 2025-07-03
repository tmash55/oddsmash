import { calculateAllHitRatesForLine, shouldRecalculateForLine } from "./hit-rate-calculator"
import { PlayerHitRateProfile } from "@/types/hit-rates"

// Mock hit rate profile for testing
const mockProfile: PlayerHitRateProfile = {
  player_id: 123456,
  player_name: "Test Player",
  id: "test-id",
  market: "strikeouts",
  line: 5.5, // Standard line
  last_5_hit_rate: 60,
  last_10_hit_rate: 70,
  last_20_hit_rate: 65,
  season_hit_rate: 68,
  season_games_count: 100,
  avg_stat_per_game: 6.2,
  points_histogram: {
    last_5: {
      "4": 1,  // 1 game with 4 strikeouts
      "5": 1,  // 1 game with 5 strikeouts  
      "6": 2,  // 2 games with 6 strikeouts
      "7": 1   // 1 game with 7 strikeouts
    },
    last_10: {
      "3": 1,  // 1 game with 3 strikeouts
      "4": 2,  // 2 games with 4 strikeouts
      "5": 2,  // 2 games with 5 strikeouts
      "6": 3,  // 3 games with 6 strikeouts
      "7": 1,  // 1 game with 7 strikeouts
      "8": 1   // 1 game with 8 strikeouts
    },
    last_20: {
      "2": 1,
      "3": 2,
      "4": 4,
      "5": 5,
      "6": 5,
      "7": 2,
      "8": 1
    }
  },
  recent_games: [],
  updated_at: new Date().toISOString(),
  team_abbreviation: "TEST",
  team_name: "Test Team",
  position_abbreviation: "P",
  odds_event_id: "test-event",
  commence_time: new Date().toISOString(),
  away_team: "Away Team",
  home_team: "Home Team"
}

// Test the calculator
function testHitRateCalculator() {
  console.log("🧪 Testing Hit Rate Calculator for Alternate Lines\n")
  
  // Test 1: Standard line (should not recalculate)
  console.log("Test 1: Standard line (5.5)")
  const shouldRecalc1 = shouldRecalculateForLine(5.5, 5.5)
  console.log(`Should recalculate: ${shouldRecalc1}`) // Should be false
  
  // Test 2: Alternate line (should recalculate)
  console.log("\nTest 2: Alternate line (7+)")
  const shouldRecalc2 = shouldRecalculateForLine(5.5, 7)
  console.log(`Should recalculate: ${shouldRecalc2}`) // Should be true
  
  // Test 3: Calculate hit rates for 7+ strikeouts
  console.log("\nTest 3: Calculate hit rates for 7+ strikeouts")
  const altLineData = calculateAllHitRatesForLine(mockProfile, 7)
  console.log("Alternate line results:")
  console.log(`- L5: ${altLineData.last_5_hit_rate}% (${altLineData.last_5_hits}/${altLineData.last_5_total_games})`)
  console.log(`- L10: ${altLineData.last_10_hit_rate}% (${altLineData.last_10_hits}/${altLineData.last_10_total_games})`)
  console.log(`- L20: ${altLineData.last_20_hit_rate}% (${altLineData.last_20_hits}/${altLineData.last_20_total_games})`)
  console.log(`- Season: ${altLineData.season_hit_rate}% (unchanged)`)
  console.log(`- Avg per game: ${altLineData.avg_stat_per_game}`)
  
  // Test 4: Calculate hit rates for 6+ strikeouts  
  console.log("\nTest 4: Calculate hit rates for 6+ strikeouts")
  const altLineData2 = calculateAllHitRatesForLine(mockProfile, 6)
  console.log("Alternate line results:")
  console.log(`- L5: ${altLineData2.last_5_hit_rate}% (${altLineData2.last_5_hits}/${altLineData2.last_5_total_games})`)
  console.log(`- L10: ${altLineData2.last_10_hit_rate}% (${altLineData2.last_10_hits}/${altLineData2.last_10_total_games})`)
  console.log(`- L20: ${altLineData2.last_20_hit_rate}% (${altLineData2.last_20_hits}/${altLineData2.last_20_total_games})`)
  
  console.log("\n✅ Hit Rate Calculator Test Complete!")
}

// Run the test
if (typeof window === 'undefined') {
  // Only run in Node.js environment
  testHitRateCalculator()
}

export { testHitRateCalculator } 