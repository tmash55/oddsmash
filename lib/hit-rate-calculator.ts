import { PlayerHitRateProfile, PointsHistogram } from "@/types/hit-rates"

/**
 * Enhanced function to calculate hit rates directly from recent_games data
 * This is more accurate for alternate lines than using points_histogram
 */
export function calculateHitRateFromRecentGames(
  profile: PlayerHitRateProfile,
  targetLine: number,
  timeWindow: "last_5" | "last_10" | "last_20" = "last_10",
  betType: "over" | "under" = "over"
): {
  hitRate: number
  totalGames: number
  successfulBets: number
  avgStatPerGame: number
  hitsAboveLine: number
  hitsAtOrBelowLine: number
} {
  // Check if we have recent_games data
  if (!profile.recent_games || !Array.isArray(profile.recent_games) || profile.recent_games.length === 0) {
    return {
      hitRate: 0,
      totalGames: 0,
      successfulBets: 0,
      avgStatPerGame: 0,
      hitsAboveLine: 0,
      hitsAtOrBelowLine: 0
    }
  }

  // Determine how many games to analyze
  const gameCount = timeWindow === "last_5" ? 5 : timeWindow === "last_10" ? 10 : 20
  const availableGames = Math.min(gameCount, profile.recent_games.length)
  const recentGames = profile.recent_games.slice(0, availableGames)

  let successfulBets = 0
  let hitsAboveLine = 0
  let hitsAtOrBelowLine = 0
  let totalValue = 0

  recentGames.forEach((game: any, index: number) => {
    const gameValue = game.value || 0
    totalValue += gameValue

    // Count hits at or above the target line (for over bets)
    if (gameValue >= targetLine) {
      hitsAboveLine++
    }
    
    // Count hits below the target line (for under bets)  
    if (gameValue < targetLine) {
      hitsAtOrBelowLine++
    }

    // Determine if this was a successful bet based on bet type
    const isHit = betType === "over" ? gameValue >= targetLine : gameValue < targetLine
    if (isHit) {
      successfulBets++
    }
  })

  const hitRate = recentGames.length > 0 ? Math.round((successfulBets / recentGames.length) * 100) : 0
  const avgStatPerGame = recentGames.length > 0 ? Number((totalValue / recentGames.length).toFixed(1)) : 0

  return {
    hitRate,
    totalGames: recentGames.length,
    successfulBets,
    avgStatPerGame,
    hitsAboveLine,
    hitsAtOrBelowLine
  }
}

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
 * Now uses recent_games data for alternate lines for better accuracy
 */
export function calculateAllHitRatesForLine(
  profile: PlayerHitRateProfile,
  targetLine: number,
  betType: "over" | "under" = "over"
) {
  // Check if this is an alternate line calculation
  const isAlternateLine = shouldRecalculateForLine(profile.line, targetLine)
  
  let last5, last10, last20
  
  // For alternate lines, use recent_games data for more accuracy
  if (isAlternateLine && profile.recent_games && profile.recent_games.length > 0) {
    last5 = calculateHitRateFromRecentGames(profile, targetLine, "last_5", betType)
    last10 = calculateHitRateFromRecentGames(profile, targetLine, "last_10", betType)
    last20 = calculateHitRateFromRecentGames(profile, targetLine, "last_20", betType)
  } else {
    // For standard lines, use the original histogram-based calculation
    last5 = calculateHitRateForLine(profile, targetLine, "last_5", betType)
    last10 = calculateHitRateForLine(profile, targetLine, "last_10", betType)
    last20 = calculateHitRateForLine(profile, targetLine, "last_20", betType)
  }

  // For season hit rate, we need to calculate based on bet type if we have histogram data
  let seasonHitRate = profile.season_hit_rate
  if (betType === "under" && !isAlternateLine && profile.season_hit_rate !== null) {
    // Flip the season hit rate for under bets (assuming original was for over)
    seasonHitRate = 100 - profile.season_hit_rate
  }

  // For alternate lines, calculate season hit rate from recent games if available
  if (isAlternateLine && profile.recent_games && profile.recent_games.length > 0) {
    const seasonCalc = calculateHitRateFromRecentGames(profile, targetLine, "last_20", betType)
    seasonHitRate = seasonCalc.hitRate
  }

  const result = {
    ...profile,
    line: targetLine,
    bet_type: betType,
    is_alternate_line: isAlternateLine,
    last_5_hit_rate: last5.hitRate,
    last_10_hit_rate: last10.hitRate,
    last_20_hit_rate: last20.hitRate,
    season_hit_rate: seasonHitRate,
    avg_stat_per_game: last10.avgStatPerGame,
  }

  return result
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