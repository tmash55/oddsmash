import { PlayerHitRateProfile } from "@/types/hit-rates"

export interface OddSmashScoreInput {
  // Selection data
  selection: {
    player_name: string
    market: string
    line: number
    bet_type: "over" | "under"
    original_odds?: number
  }
  
  // Hit rate data
  hitRateData?: PlayerHitRateProfile | null
  
  // Odds data
  currentOdds: Record<string, { price: number }> // sportsbook -> odds
  
  // Market context
  bestOdds: number
  originalOdds?: number
}

export interface OddSmashScoreResult {
  // Core score
  totalScore: number // 0-100
  tier: OddSmashTier
  
  // Component scores
  hitRateScore: number // 0-45
  valueScore: number // 0-35  
  dataQualityScore: number // 0-20
  
  // Detailed breakdown
  breakdown: {
    // Hit Rate Intelligence (45 points)
    recentPerformance: number // 0-25
    consistency: number // 0-15
    trendAnalysis: number // 0-5
    
    // Value & Edge Discovery (35 points)
    oddsValueEdge: number // 0-20
    lineShoppingScore: number // 0-10
    marketEfficiency: number // 0-5
    
    // Data Quality & Confidence (20 points)
    dataCompleteness: number // 0-10
    sampleSize: number // 0-5
    alternateLinePrecision: number // 0-5
  }
  
  // Analytics
  analytics: {
    avgHitRate: number
    highConfidencePicks: number
    alternateLinesCount: number
    booksBeaten: number
    totalBooks: number
    valueEdgePercent: number
    hasOriginalOdds: boolean
  }
  
  // Shareable content
  shareableData: {
    title: string
    subtitle: string
    emoji: string
    highlights: string[]
    socialText: string
  }
}

export interface OddSmashTier {
  name: string
  emoji: string
  range: [number, number]
  description: string
  color: {
    bg: string
    text: string
    border: string
  }
}

// Enhanced tier system with personality
export const ODDSMASH_TIERS: OddSmashTier[] = [
  {
    name: "LEGENDARY",
    emoji: "🔥",
    range: [95, 100],
    description: "Elite picks with monster value",
    color: {
      bg: "from-orange-500 to-red-600",
      text: "text-orange-100",
      border: "border-orange-400"
    }
  },
  {
    name: "ELITE", 
    emoji: "⚡",
    range: [85, 94],
    description: "Premium plays with strong backing",
    color: {
      bg: "from-purple-500 to-purple-600",
      text: "text-purple-100", 
      border: "border-purple-400"
    }
  },
  {
    name: "SOLID",
    emoji: "🎯", 
    range: [70, 84],
    description: "Quality picks worth sharing",
    color: {
      bg: "from-blue-500 to-blue-600",
      text: "text-blue-100",
      border: "border-blue-400"
    }
  },
  {
    name: "DECENT",
    emoji: "📈",
    range: [55, 69], 
    description: "Good value with some risk",
    color: {
      bg: "from-green-500 to-green-600",
      text: "text-green-100",
      border: "border-green-400"
    }
  },
  {
    name: "RISKY", 
    emoji: "⚠️",
    range: [40, 54],
    description: "Proceed with caution",
    color: {
      bg: "from-yellow-500 to-yellow-600", 
      text: "text-yellow-100",
      border: "border-yellow-400"
    }
  },
  {
    name: "YOLO",
    emoji: "🚨",
    range: [0, 39],
    description: "High risk, high reward", 
    color: {
      bg: "from-red-500 to-red-600",
      text: "text-red-100",
      border: "border-red-400"
    }
  }
]

/**
 * Calculate variance across hit rate windows for consistency scoring
 */
function calculateHitRateVariance(rates: number[]): number {
  const validRates = rates.filter(rate => rate !== null && rate !== undefined && rate > 0)
  if (validRates.length < 2) return 0
  
  const mean = validRates.reduce((sum, rate) => sum + rate, 0) / validRates.length
  const variance = validRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / validRates.length
  
  return Math.sqrt(variance) // Return standard deviation
}

/**
 * Calculate performance trend (improving vs declining)
 */
function calculateTrendScore(l5Rate: number, l10Rate: number, l20Rate: number): number {
  // If we don't have enough data, return neutral score
  if (!l5Rate || !l10Rate) return 2.5
  
  // Recent trend (L5 vs L10)
  const recentTrend = l5Rate - l10Rate
  
  // Overall trend (L10 vs L20) 
  const overallTrend = l20Rate ? l10Rate - l20Rate : 0
  
  // Weight recent trend more heavily
  const trendScore = (recentTrend * 0.7) + (overallTrend * 0.3)
  
  // Convert to 0-5 point scale
  // Positive trend = more points, negative trend = fewer points
  return Math.max(0, Math.min(5, 2.5 + (trendScore / 20)))
}

/**
 * Calculate proper total payout (stake + profit) for American odds
 */
function calculateProperPayout(americanOdds: number, stake: number): number {
  if (americanOdds > 0) {
    // Positive odds: profit = (odds / 100) * stake, total payout = stake + profit
    return stake + (stake * americanOdds) / 100
  } else {
    // Negative odds: profit = (stake * 100) / |odds|, total payout = stake + profit  
    return stake + (stake * 100) / Math.abs(americanOdds)
  }
}

/**
 * Calculate odds spread for line shopping score using proper payouts
 */
function calculateOddsSpread(odds: Record<string, { price: number }>): number {
  const prices = Object.values(odds).map(odd => odd.price).filter(price => price !== 0)
  if (prices.length < 2) return 0
  
  const maxPrice = Math.max(...prices)
  const minPrice = Math.min(...prices)
  
  // Convert to proper total payout for meaningful comparison
  const maxPayout = calculateProperPayout(maxPrice, 100)
  const minPayout = calculateProperPayout(minPrice, 100)
  
  return ((maxPayout - minPayout) / minPayout) * 100
}

/**
 * Get tier information for a given score
 */
export function getScoreTier(score: number): OddSmashTier {
  return ODDSMASH_TIERS.find(tier => 
    score >= tier.range[0] && score <= tier.range[1]
  ) || ODDSMASH_TIERS[ODDSMASH_TIERS.length - 1] // Default to YOLO
}

/**
 * Enhanced OddSmash Score Calculator
 * Focuses heavily on hit rate data (45 pts) and value discovery (35 pts)
 */
export function calculateEnhancedOddSmashScore(
  selections: OddSmashScoreInput[]
): OddSmashScoreResult {
  console.log("🎯 ENHANCED ODDSMASH SCORE - Starting calculation for", selections.length, "selections")
  
  // Aggregate all selection data
  let totalHitRateScore = 0
  let totalValueScore = 0 
  let totalDataQualityScore = 0
  
  let totalRecentPerformance = 0
  let totalConsistency = 0
  let totalTrendAnalysis = 0
  let totalOddsValueEdge = 0
  let totalLineShoppingScore = 0
  let totalMarketEfficiency = 0
  let totalDataCompleteness = 0
  let totalSampleSize = 0
  let totalAlternateLinePrecision = 0
  
  // Analytics aggregation
  let totalHitRates = 0
  let validHitRateCount = 0
  let highConfidencePicks = 0
  let alternateLinesCount = 0
  let totalBooksBeaten = 0
  let totalBooks = 0
  let totalValueEdge = 0
  let validValueEdgeCount = 0
  let validValueSelections = 0
  let hasAnyOriginalOdds = false
  
  selections.forEach((input, index) => {
    console.log(`🎯 Processing selection ${index + 1}: ${input.selection.player_name}`)
    
    const { selection, hitRateData, currentOdds, bestOdds, originalOdds } = input
    
    // ===================
    // HIT RATE INTELLIGENCE (45 points)
    // ===================
    
    let recentPerformance = 0 // 0-25
    let consistency = 0 // 0-15
    let trendAnalysis = 2.5 // 0-5 (default neutral)
    
    if (hitRateData) {
             // Get hit rates for different windows
       const l5Rate = hitRateData.last_5_hit_rate || 0
       const l10Rate = hitRateData.last_10_hit_rate || 0
       const l20Rate = hitRateData.last_20_hit_rate || 0
      
      console.log(`  Hit rates - L5: ${l5Rate}%, L10: ${l10Rate}%, L20: ${l20Rate}%`)
      
      // Recent Performance (25 points) - Weight L10 heavily as primary indicator
      if (l10Rate > 0) {
        recentPerformance = Math.min((l10Rate / 100) * 25, 25)
        totalHitRates += l10Rate
        validHitRateCount++
        
        // High confidence threshold: 70%+ hit rate
        if (l10Rate >= 70) {
          highConfidencePicks++
        }
      }
      
      // Consistency Score (15 points) - Reward consistent performance across windows
      const rates = [l5Rate, l10Rate, l20Rate].filter(rate => rate > 0)
      if (rates.length >= 2) {
        const variance = calculateHitRateVariance(rates)
        // Lower variance = higher consistency score
        consistency = Math.max(0, Math.min(15, 15 - (variance * 0.3)))
      }
      
      // Trend Analysis (5 points) - Improving vs declining performance
      trendAnalysis = calculateTrendScore(l5Rate, l10Rate, l20Rate)
      
             // Check for alternate line
       if ((hitRateData as any).is_alternate_line) {
         alternateLinesCount++
       }
      
      console.log(`  Scores - Recent: ${recentPerformance.toFixed(1)}, Consistency: ${consistency.toFixed(1)}, Trend: ${trendAnalysis.toFixed(1)}`)
    }
    
    // ===================  
    // VALUE & EDGE DISCOVERY (35 points)
    // ===================
    
    let oddsValueEdge = 0 // 0-20
    let lineShoppingScore = 0 // 0-10
    let marketEfficiency = 0 // 0-5
    
    const oddsEntries = Object.entries(currentOdds).filter(([_, odds]) => odds.price !== 0)
    totalBooks = Math.max(totalBooks, oddsEntries.length)
    
    if (oddsEntries.length > 0) {
      // Odds Value Edge (20 points)
      if (originalOdds && bestOdds) {
        // Calculate proper total payout (including stake) for $100 bet
        const originalPayout = calculateProperPayout(originalOdds, 100)
        const bestPayout = calculateProperPayout(bestOdds, 100)
        
        if (originalPayout > 0 && bestPayout > 0) {
          const edgePercent = ((bestPayout - originalPayout) / originalPayout) * 100
          // Use more conservative multiplier - raw edge percentage is already meaningful
          oddsValueEdge = Math.min(Math.max(edgePercent * 0.8, 0), 20)
          totalValueEdge += edgePercent
          validValueEdgeCount++
          hasAnyOriginalOdds = true
          
          console.log(`  Value edge: ${edgePercent.toFixed(1)}% (payout: $${originalPayout.toFixed(0)} -> $${bestPayout.toFixed(0)})`)
        }
      } else if (bestOdds) {
        // Alternative scoring when no original odds available - much more conservative
        const impliedValue = Math.abs(bestOdds) > 200 ? 2 : Math.abs(bestOdds) > 150 ? 4 : 6
        oddsValueEdge = Math.min(impliedValue, 8) // Max 8 points when no original odds
      }
      
      // Line Shopping Score (10 points) - Reward finding good spreads
      const oddsSpread = calculateOddsSpread(currentOdds)
      lineShoppingScore = Math.min(oddsSpread * 0.5, 10)
      
      // Market Efficiency (5 points) - How many books beaten
      const booksBeaten = oddsEntries.filter(([_, odds]) => odds.price < bestOdds).length
      marketEfficiency = (booksBeaten / oddsEntries.length) * 5
      totalBooksBeaten += booksBeaten
      validValueSelections++ // Track how many selections had odds for proper averaging
      
      console.log(`  Value scores - Edge: ${oddsValueEdge.toFixed(1)}, Shopping: ${lineShoppingScore.toFixed(1)}, Efficiency: ${marketEfficiency.toFixed(1)}`)
      console.log(`  Books: ${booksBeaten}/${oddsEntries.length} beaten for this selection`)
    }
    
    // ===================
    // DATA QUALITY & CONFIDENCE (20 points) 
    // ===================
    
    let dataCompleteness = 0 // 0-10
    let sampleSize = 0 // 0-5
    let alternateLinePrecision = 0 // 0-5
    
    // Data Completeness (10 points) - Having hit rate data
    if (hitRateData) {
      dataCompleteness = 10
      
             // Sample Size (5 points) - Based on games analyzed
       const gamesAnalyzed = (hitRateData as any).last_10_total_games || hitRateData.season_games_count || 0
       sampleSize = Math.min((gamesAnalyzed / 20) * 5, 5)
       
       // Alternate Line Precision (5 points) - Custom calculations
       if ((hitRateData as any).is_alternate_line) {
         alternateLinePrecision = 5
       }
    } else {
      // When no hit rate data, give partial credit for having market data
      dataCompleteness = 5 // 50% credit for having odds/market data
      sampleSize = 2.5 // Neutral sample size score
      alternateLinePrecision = 0 // Can't assess without hit rate data
    }
    
    console.log(`  Data scores - Completeness: ${dataCompleteness}, Sample: ${sampleSize.toFixed(1)}, Precision: ${alternateLinePrecision}`)
    
    // Aggregate scores
    totalRecentPerformance += recentPerformance
    totalConsistency += consistency 
    totalTrendAnalysis += trendAnalysis
    totalOddsValueEdge += oddsValueEdge
    totalLineShoppingScore += lineShoppingScore
    totalMarketEfficiency += marketEfficiency
    totalDataCompleteness += dataCompleteness
    totalSampleSize += sampleSize
    totalAlternateLinePrecision += alternateLinePrecision
  })
  
  // Calculate average scores across all selections
  const selectionCount = selections.length
  
  const avgRecentPerformance = totalRecentPerformance / selectionCount
  const avgConsistency = totalConsistency / selectionCount
  const avgTrendAnalysis = totalTrendAnalysis / selectionCount
  const avgOddsValueEdge = totalOddsValueEdge / selectionCount
  const avgLineShoppingScore = totalLineShoppingScore / selectionCount
  const avgMarketEfficiency = totalMarketEfficiency / selectionCount
  const avgDataCompleteness = totalDataCompleteness / selectionCount
  const avgSampleSize = totalSampleSize / selectionCount
  const avgAlternateLinePrecision = totalAlternateLinePrecision / selectionCount
  
  // Calculate component scores with proportional scaling for missing data
  let hitRateScore = avgRecentPerformance + avgConsistency + avgTrendAnalysis
  let valueScore = avgOddsValueEdge + avgLineShoppingScore + avgMarketEfficiency  
  let dataQualityScore = avgDataCompleteness + avgSampleSize + avgAlternateLinePrecision
  
  // Proportional scoring: If some selections lack hit rate data, redistribute those points
  const selectionsWithHitRates = validHitRateCount
  const selectionsWithoutHitRates = selectionCount - selectionsWithHitRates
  
  if (selectionsWithoutHitRates > 0 && selectionsWithHitRates > 0) {
    // Calculate what the hit rate score would be if we only had data for those selections
    const hitRateScorePerSelection = hitRateScore / selectionsWithHitRates * selectionCount
    hitRateScore = Math.min(hitRateScorePerSelection, 45) // Cap at max hit rate points
    
    console.log(`  📊 Proportional scaling: ${selectionsWithHitRates}/${selectionCount} selections have hit rate data`)
    console.log(`  📊 Hit rate score boosted from ${(avgRecentPerformance + avgConsistency + avgTrendAnalysis).toFixed(1)} to ${hitRateScore.toFixed(1)}`)
  } else if (selectionsWithoutHitRates === selectionCount) {
    // No hit rate data available - give neutral/baseline score
    hitRateScore = 15 // Neutral baseline score (33% of max hit rate points)
    console.log(`  📊 No hit rate data available - using neutral baseline score of ${hitRateScore}`)
  }
  
  // Calculate total score
  const totalScore = Math.round(Math.min(Math.max(hitRateScore + valueScore + dataQualityScore, 0), 100))
  
  // Get tier information
  const tier = getScoreTier(totalScore)
  
  // Calculate analytics
  const avgHitRate = validHitRateCount > 0 ? totalHitRates / validHitRateCount : 0
  const avgValueEdgePercent = validValueEdgeCount > 0 ? totalValueEdge / validValueEdgeCount : 0
  
  // Generate shareable content
  const highlights: string[] = []
  if (highConfidencePicks > 0) highlights.push(`${highConfidencePicks} High-Confidence Pick${highConfidencePicks > 1 ? 's' : ''}`)
  if (avgHitRate >= 65) highlights.push(`${avgHitRate.toFixed(0)}% Avg Hit Rate`)
  if (avgValueEdgePercent > 5) highlights.push(`+${avgValueEdgePercent.toFixed(1)}% Value Edge`)
  if (alternateLinesCount > 0) highlights.push(`${alternateLinesCount} Custom Line${alternateLinesCount > 1 ? 's' : ''}`)
  
  const socialText = `🎯 OddSmash Score: ${totalScore}/100 ${tier.emoji} ${tier.name}\n\n${highlights.slice(0, 3).join('\n')}\n\nMade with OddSmash 📊`
  
  const result: OddSmashScoreResult = {
    totalScore,
    tier,
    hitRateScore: Math.round(hitRateScore),
    valueScore: Math.round(valueScore),
    dataQualityScore: Math.round(dataQualityScore),
    breakdown: {
      recentPerformance: Math.round(avgRecentPerformance * 10) / 10,
      consistency: Math.round(avgConsistency * 10) / 10,
      trendAnalysis: Math.round(avgTrendAnalysis * 10) / 10,
      oddsValueEdge: Math.round(avgOddsValueEdge * 10) / 10,
      lineShoppingScore: Math.round(avgLineShoppingScore * 10) / 10,
      marketEfficiency: Math.round(avgMarketEfficiency * 10) / 10,
      dataCompleteness: Math.round(avgDataCompleteness),
      sampleSize: Math.round(avgSampleSize * 10) / 10,
      alternateLinePrecision: Math.round(avgAlternateLinePrecision)
    },
    analytics: {
      avgHitRate: Math.round(avgHitRate),
      highConfidencePicks,
      alternateLinesCount,
      booksBeaten: validValueSelections > 0 ? Math.round(totalBooksBeaten / validValueSelections) : 0,
      totalBooks: Math.round(totalBooks / Math.max(selections.length, 1)),
      valueEdgePercent: Math.round(avgValueEdgePercent * 10) / 10,
      hasOriginalOdds: hasAnyOriginalOdds
    },
    shareableData: {
      title: `${tier.emoji} ${tier.name}`,
      subtitle: `${totalScore}/100 OddSmash Score`,
      emoji: tier.emoji,
      highlights,
      socialText
    }
  }
  
  console.log("🎯 ENHANCED ODDSMASH SCORE RESULT:")
  console.log(`  Total Score: ${totalScore}/100 (${tier.name})`)
  console.log(`  Hit Rate: ${Math.round(hitRateScore)}/45, Value: ${Math.round(valueScore)}/35, Data: ${Math.round(dataQualityScore)}/20`)
  console.log(`  Analytics: ${avgHitRate.toFixed(0)}% avg hit rate, ${highConfidencePicks} high confidence, +${avgValueEdgePercent.toFixed(1)}% edge`)
  console.log(`  Books Analysis: ${result.analytics.booksBeaten}/${result.analytics.totalBooks} average books beaten (from ${totalBooksBeaten} total across ${validValueSelections} selections)`)
  console.log(`  Data Coverage: ${validHitRateCount}/${selectionCount} selections have hit rate data (${((validHitRateCount/selectionCount)*100).toFixed(0)}% coverage)`)
  
  return result
}

/**
 * Helper function to convert selection data from betslip to OddSmash score input format
 */
export function prepareSelectionsForScoring(
  selections: any[],
  getHitRateForSelection: (selection: any) => any,
  parlayResults: Record<string, any>,
  bestOdds: number
): OddSmashScoreInput[] {
  return selections.map(selection => {
    const hitRateData = getHitRateForSelection(selection)
    const currentOdds: Record<string, { price: number }> = {}
    
    // Extract current odds from selection
    if (selection.current_odds?.bookmakers) {
      Object.entries(selection.current_odds.bookmakers).forEach(([bookId, odds]: [string, any]) => {
        if (odds.price && typeof odds.price === 'number') {
          currentOdds[bookId] = { price: odds.price }
        }
      })
    }
    
    return {
      selection: {
        player_name: selection.player_name,
        market: selection.market,
        line: selection.line,
        bet_type: selection.bet_type || "over",
        original_odds: selection.original_odds
      },
      hitRateData,
      currentOdds,
      bestOdds,
      originalOdds: selection.original_odds
    }
  })
} 