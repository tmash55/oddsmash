import { PlayerHitRateProfile, PointsHistogram } from "@/types/hit-rates"

/**
 * Calculate hit rate for a specific line using points histogram data
 * This allows us to calculate hit rates for alternate lines on the fly
 * Now supports both over and under bet types
 */
export function calculateHitRateForLine(
  profile: PlayerHitRateProfile,
  targetLine: number,
  timeWindow: "last_5" | "last_10" | "last_20" = "last_10",
  betType: "over" | "under" = "over"
): {
  hitRate: number
  totalGames: number
  hitsAboveLine: number
  hitsAtOrBelowLine: number
  avgStatPerGame: number
  successfulBets: number
} {
  // Get the histogram data for the specified time window
  const histogram = profile.points_histogram[timeWindow]
  
  if (!histogram) {
    return {
      hitRate: 0,
      totalGames: 0,
      hitsAboveLine: 0,
      hitsAtOrBelowLine: 0,
      avgStatPerGame: 0,
      successfulBets: 0
    }
  }

  // Calculate total games
  const totalGames = Object.values(histogram).reduce((sum, count) => sum + count, 0)
  
  if (totalGames === 0) {
    return {
      hitRate: 0,
      totalGames: 0,
      hitsAboveLine: 0,
      hitsAtOrBelowLine: 0,
      avgStatPerGame: 0,
      successfulBets: 0
    }
  }

  // Calculate games where player hit different thresholds
  let hitsAboveLine = 0
  let hitsAtOrBelowLine = 0
  let totalStats = 0

  Object.entries(histogram).forEach(([value, count]) => {
    const numValue = Number(value)
    const numCount = Number(count)
    
    // Count hits at or above the target line (for over bets)
    if (numValue >= targetLine) {
      hitsAboveLine += numCount
    }
    
    // Count hits at or below the target line (for under bets)
    if (numValue < targetLine) {
      hitsAtOrBelowLine += numCount
    }
    
    // Calculate total stats for average
    totalStats += numValue * numCount
  })

  // Calculate success rate based on bet type
  const successfulBets = betType === "over" ? hitsAboveLine : hitsAtOrBelowLine
  const hitRate = Math.round((successfulBets / totalGames) * 100)
  
  // Calculate average stat per game for this time window (one decimal place)
  const avgStatPerGame = Number((totalStats / totalGames).toFixed(1))

  return {
    hitRate,
    totalGames,
    hitsAboveLine,
    hitsAtOrBelowLine,
    avgStatPerGame,
    successfulBets
  }
}

/**
 * Calculate all hit rate time windows for a specific line
 * Now supports both over and under bet types
 */
export function calculateAllHitRatesForLine(
  profile: PlayerHitRateProfile,
  targetLine: number,
  betType: "over" | "under" = "over"
) {
  const last5 = calculateHitRateForLine(profile, targetLine, "last_5", betType)
  const last10 = calculateHitRateForLine(profile, targetLine, "last_10", betType)
  const last20 = calculateHitRateForLine(profile, targetLine, "last_20", betType)

  // Check if this is an alternate line calculation
  const isAlternateLine = shouldRecalculateForLine(profile.line, targetLine)

  // For season hit rate, we need to calculate based on bet type if we have histogram data
  let seasonHitRate = profile.season_hit_rate
  if (betType === "under" && !isAlternateLine && profile.season_hit_rate !== null) {
    // Flip the season hit rate for under bets (assuming original was for over)
    seasonHitRate = 100 - profile.season_hit_rate
  }

  return {
    last_5_hit_rate: last5.hitRate,
    last_10_hit_rate: last10.hitRate,
    last_20_hit_rate: last20.hitRate,
    // For alternate lines, we don't have season histogram data, so don't show misleading season %
    season_hit_rate: isAlternateLine ? null : seasonHitRate,
    season_games_count: profile.season_games_count,
    avg_stat_per_game: last10.avgStatPerGame, // Use L10 average as default (1 decimal)
    player_name: profile.player_name,
    market: profile.market,
    line: targetLine, // The actual line being bet
    team_abbreviation: profile.team_abbreviation,
    bet_type: betType, // Include bet type in the response
    
    // Additional context
    last_5_total_games: last5.totalGames,
    last_10_total_games: last10.totalGames,
    last_20_total_games: last20.totalGames,
    last_5_hits: last5.successfulBets,
    last_10_hits: last10.successfulBets,
    last_20_hits: last20.successfulBets,
    
    // Legacy fields for backward compatibility
    last_5_hits_over: last5.hitsAboveLine,
    last_10_hits_over: last10.hitsAboveLine,
    last_20_hits_over: last20.hitsAboveLine,
    last_5_hits_under: last5.hitsAtOrBelowLine,
    last_10_hits_under: last10.hitsAtOrBelowLine,
    last_20_hits_under: last20.hitsAtOrBelowLine,
    
    // Flag to indicate this is an alternate line calculation
    is_alternate_line: isAlternateLine,
    
    // Preserve the original recent_games data for modal display
    recent_games: profile.recent_games,
  }
}

/**
 * Check if a line is significantly different from the standard line
 * to determine if we should recalculate hit rates
 */
export function shouldRecalculateForLine(
  standardLine: number,
  actualLine: number,
  threshold: number = 0.5
): boolean {
  return Math.abs(actualLine - standardLine) >= threshold
} 