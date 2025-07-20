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
    console.log(`[HIT RATE CALC] No recent_games data available for ${profile.player_name}`)
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

  console.log(`[HIT RATE CALC] Calculating for ${profile.player_name} ${targetLine}+ using ${recentGames.length} recent games`)

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

    console.log(`[HIT RATE CALC]   Game ${index + 1}: ${gameValue} vs ${targetLine} = ${isHit ? 'HIT' : 'MISS'} (${betType})`)
  })

  const hitRate = recentGames.length > 0 ? Math.round((successfulBets / recentGames.length) * 100) : 0
  const avgStatPerGame = recentGames.length > 0 ? Number((totalValue / recentGames.length).toFixed(1)) : 0

  console.log(`[HIT RATE CALC] Result: ${successfulBets}/${recentGames.length} = ${hitRate}% hit rate for ${betType} ${targetLine}`)

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
  
  console.log(`[HIT RATE CALC] calculateAllHitRatesForLine: ${profile.player_name} ${targetLine} (${betType}) - isAlternate: ${isAlternateLine}`)

  let last5, last10, last20
  
  // For alternate lines, use recent_games data for more accuracy
  if (isAlternateLine && profile.recent_games && profile.recent_games.length > 0) {
    console.log(`[HIT RATE CALC] Using recent_games data for alternate line calculation`)
    
    last5 = calculateHitRateFromRecentGames(profile, targetLine, "last_5", betType)
    last10 = calculateHitRateFromRecentGames(profile, targetLine, "last_10", betType)
    last20 = calculateHitRateFromRecentGames(profile, targetLine, "last_20", betType)
  } else {
    console.log(`[HIT RATE CALC] Using points_histogram data for standard line calculation`)
    
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

  const result = {
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

  console.log(`[HIT RATE CALC] Final result for ${profile.player_name} ${targetLine} (${betType}):`, {
    last_10_hit_rate: result.last_10_hit_rate,
    is_alternate_line: result.is_alternate_line,
    calculation_method: isAlternateLine ? 'recent_games' : 'points_histogram'
  })

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