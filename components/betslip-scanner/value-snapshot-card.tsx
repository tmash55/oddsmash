"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import {
  TrendingUp,
  Target,
  BarChart3,
  PieChart,
  Sparkles,
  Info,
} from "lucide-react"

interface ValueSnapshotCardProps {
  betslip: any
  selections: any[]
  parlayResults: Record<string, any>
  bestOdds: number | null
  bestSportsbook: string
  getSportsbookInfo: (sportsbookId: string) => any
  getHitRateForSelection: (selection: any) => any
  getMarketLabel: (marketKey: string, sport?: string) => string
  formatOddsClean: (odds: number | string) => string
}

export function ValueSnapshotCard({
  betslip,
  selections,
  parlayResults,
  bestOdds,
  bestSportsbook,
  getSportsbookInfo,
  getHitRateForSelection,
  getMarketLabel,
  formatOddsClean,
}: ValueSnapshotCardProps) {
  // Enhanced value calculations with better fallback handling
  const hasOriginalOdds = selections.some(sel => sel.original_odds && !isNaN(sel.original_odds))
  
  // Calculate original odds (with fallback for missing data)
  let originalTotalOdds = 1
  let originalDataAvailable = true
  
  if (betslip.original_odds && !isNaN(betslip.original_odds)) {
    originalTotalOdds = betslip.original_odds
  } else if (hasOriginalOdds) {
    originalTotalOdds = selections.reduce((acc, sel) => {
      if (sel.original_odds && !isNaN(sel.original_odds)) {
        return acc * (sel.original_odds > 0 ? sel.original_odds / 100 + 1 : 100 / Math.abs(sel.original_odds) + 1)
      }
      return acc
    }, 1)
  } else {
    // No original odds available - use market average estimation
    originalDataAvailable = false
    // Estimate based on typical parlay odds for this many selections
    const estimatedIndividualOdds = selections.length <= 3 ? -110 : -120
    originalTotalOdds = selections.reduce((acc) => {
      return acc * (100 / Math.abs(estimatedIndividualOdds) + 1)
    }, 1)
  }
  
  const originalAmericanOdds = originalTotalOdds >= 2 ? Math.round((originalTotalOdds - 1) * 100) : Math.round(-100 / (originalTotalOdds - 1))
  const originalPayoutOn100 = originalAmericanOdds > 0 ? originalAmericanOdds / 100 * 100 : 100 / Math.abs(originalAmericanOdds) * 100
  const bestPayoutOn100 = bestOdds ? (bestOdds > 0 ? bestOdds / 100 * 100 : 100 / Math.abs(bestOdds) * 100) : 0
  const potentialGain = bestPayoutOn100 - originalPayoutOn100
  
  // Enhanced value leg analysis
  const bestValueLegs: Array<{
    player: string;
    market: string;
    odds: number;
    originalOdds: number;
    sportsbook: string;
    edge: number;
    hitRate?: number;
    avgStat?: number;
    isAlternateLine?: boolean;
  }> = []
  
  selections.forEach(selection => {
    if (selection.current_odds?.bookmakers) {
      let bestLegOdds = -Infinity
      let bestLegData: any = null
      
      Object.entries(selection.current_odds.bookmakers).forEach(([sportsbookId, odds]) => {
        const price = (odds as any).price
        if (price && price > bestLegOdds) {
          bestLegOdds = price
          const hitRateData = getHitRateForSelection(selection)
          
          bestLegData = {
            player: selection.player_name,
            market: getMarketLabel(selection.market),
            odds: price,
            originalOdds: selection.original_odds || -110, // Fallback for missing original odds
            sportsbook: getSportsbookInfo(sportsbookId).name,
            edge: selection.original_odds ? ((price - selection.original_odds) / selection.original_odds) * 100 : 0,
            hitRate: hitRateData?.last_10_hit_rate,
            avgStat: hitRateData?.avg_stat_per_game,
            isAlternateLine: hitRateData?.is_alternate_line
          }
        }
      })
      
      if (bestLegData && (bestLegData.edge > 0 || !originalDataAvailable)) {
        bestValueLegs.push(bestLegData)
      }
    }
  })
  
  // Sort by edge and take top 3 (or by hit rate if no edge data)
  bestValueLegs.sort((a, b) => {
    if (originalDataAvailable) {
      return b.edge - a.edge
    } else {
      // Sort by hit rate when no original odds available
      return (b.hitRate || 0) - (a.hitRate || 0)
    }
  })
  const topValueLegs = bestValueLegs.slice(0, 3)
  
  // Hit Rate Analysis
  const hitRateAnalysis = selections.map(selection => {
    const hitRateData = getHitRateForSelection(selection)
    return {
      player: selection.player_name,
      market: getMarketLabel(selection.market),
      line: selection.line,
      l10HitRate: hitRateData?.last_10_hit_rate || 0,
      seasonHitRate: hitRateData?.season_hit_rate || 0,
      avgStat: hitRateData?.avg_stat_per_game || 0,
      isAlternateLine: hitRateData?.is_alternate_line || false,
      hasData: !!hitRateData
    }
  }).filter(item => item.hasData)
  
  const avgHitRate = hitRateAnalysis.length > 0 
    ? hitRateAnalysis.reduce((sum, item) => sum + item.l10HitRate, 0) / hitRateAnalysis.length 
    : 0
  
  const highConfidencePicks = hitRateAnalysis.filter(item => item.l10HitRate >= 70).length
  const alternateLinesCount = hitRateAnalysis.filter(item => item.isAlternateLine).length
  
  // Market volatility analysis
  const oddsSpread = bestOdds && Object.values(parlayResults).length > 1 
    ? Object.values(parlayResults)
        .filter(result => result.hasAllSelections && result.parlayOdds)
        .map(result => result.parlayOdds!)
        .reduce((acc, odds) => {
          const payout = odds > 0 ? odds / 100 * 100 : 100 / Math.abs(odds) * 100
          return { min: Math.min(acc.min, payout), max: Math.max(acc.max, payout) }
        }, { min: Infinity, max: -Infinity })
    : null
  
  const marketVolatility = oddsSpread ? ((oddsSpread.max - oddsSpread.min) / oddsSpread.min) * 100 : 0

  return (
    <Card className="border-0 shadow-lg bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-600" />
          Value Snapshot
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Value Display */}
        {originalDataAvailable && potentialGain > 0 ? (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 p-4 text-white">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-full bg-white/20 p-1">
                  <TrendingUp className="h-3 w-3" />
                </div>
                <span className="text-sm font-medium opacity-90">Potential Gain</span>
              </div>
              <div className="text-2xl font-bold mb-1">+${potentialGain.toFixed(0)}</div>
              <div className="text-xs opacity-80">
                vs original • {bestSportsbook ? getSportsbookInfo(bestSportsbook).name : 'best book'}
              </div>
            </div>
            <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-white/10"></div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-4 text-white">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-full bg-white/20 p-1">
                  <PieChart className="h-3 w-3" />
                </div>
                <span className="text-sm font-medium opacity-90">Best Available Payout</span>
              </div>
              <div className="text-2xl font-bold mb-1">${bestPayoutOn100.toFixed(0)}</div>
              <div className="text-xs opacity-80">
                on $100 • {bestSportsbook ? getSportsbookInfo(bestSportsbook).name : 'best book'}
              </div>
            </div>
            <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-white/10"></div>
          </div>
        )}
        
        {/* Hit Rate Intelligence */}
        {hitRateAnalysis.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 p-4 cursor-help">
                <div className="flex items-center gap-2 mb-3">
                  <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-1.5">
                    <Target className="h-3 w-3 text-amber-600" />
                  </div>
                  <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">Hit Rate Intelligence</span>
                  <Info className="h-3 w-3 text-amber-600 opacity-60" />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="text-center">
                    <div className={`text-lg font-bold ${
                      avgHitRate >= 70 ? 'text-emerald-600' :
                      avgHitRate >= 50 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {avgHitRate.toFixed(0)}%
                    </div>
                    <div className="text-xs text-amber-600 dark:text-amber-400">Avg L10 Hit Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-amber-700 dark:text-amber-400">
                      {highConfidencePicks}/{hitRateAnalysis.length}
                    </div>
                    <div className="text-xs text-amber-600 dark:text-amber-400">High Confidence</div>
                  </div>
                </div>
                {alternateLinesCount > 0 && (
                  <div className="flex items-center gap-1 mb-2">
                    <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300">
                      {alternateLinesCount} Alternate Line{alternateLinesCount > 1 ? 's' : ''}
                    </Badge>
                    <span className="text-xs text-amber-600 dark:text-amber-400">
                      Custom calculations applied
                    </span>
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <div className="space-y-1 text-xs">
                <div className="font-semibold">Hit Rate Intelligence:</div>
                <div>• Avg L10: Average success rate over last 10 games</div>
                <div>• High Confidence: Picks with 70%+ hit rate</div>
                <div>• Alt Lines: Custom calculations for non-standard lines</div>
                <div className="pt-1 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-gray-500">Based on historical player performance data</div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* Market Analysis */}
        {marketVolatility > 5 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="rounded-2xl bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 border border-cyan-200 dark:border-cyan-800 p-4 cursor-help">
                <div className="flex items-center gap-2 mb-2">
                  <div className="rounded-full bg-cyan-100 dark:bg-cyan-900/30 p-1.5">
                    <BarChart3 className="h-3 w-3 text-cyan-600" />
                  </div>
                  <span className="text-sm font-semibold text-cyan-800 dark:text-cyan-200">Market Volatility</span>
                  <Info className="h-3 w-3 text-cyan-600 opacity-60" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-cyan-600 dark:text-cyan-400">
                    {marketVolatility.toFixed(1)}% spread across books
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      marketVolatility > 15 
                        ? 'bg-red-50 text-red-700 border-red-300'
                        : marketVolatility > 10
                        ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                        : 'bg-green-50 text-green-700 border-green-300'
                    }`}
                  >
                    {marketVolatility > 15 ? 'High' : marketVolatility > 10 ? 'Medium' : 'Low'}
                  </Badge>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <div className="space-y-1 text-xs">
                <div className="font-semibold">Market Volatility:</div>
                <div>• Measures price differences across sportsbooks</div>
                <div>• High volatility = bigger spreads between books</div>
                <div>• Low volatility = market consensus on pricing</div>
                <div className="pt-1 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-gray-500">Higher volatility often means better shopping opportunities</div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* Best Picks Analysis */}
        {topValueLegs.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 p-4 cursor-help">
                <div className="flex items-center gap-2 mb-3">
                  <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-1.5">
                    <Sparkles className="h-3 w-3 text-blue-600" />
                  </div>
                  <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                    {originalDataAvailable ? 'Best Value Picks' : 'Top Picks by Performance'}
                  </span>
                  <Info className="h-3 w-3 text-blue-600 opacity-60" />
                </div>
                <div className="space-y-2">
                  {topValueLegs.slice(0, 5).map((leg, index) => (
                    <div key={index} className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-blue-700 dark:text-blue-400 truncate">
                          {leg.player}
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          <div className="text-xs text-blue-600 dark:text-blue-500">
                            {formatOddsClean(leg.odds)} • {leg.sportsbook}
                          </div>
                          {leg.hitRate && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                leg.hitRate >= 70 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : leg.hitRate >= 50
                                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                                  : 'bg-red-50 text-red-700 border-red-300'
                              }`}
                            >
                              {leg.hitRate}% L10
                            </Badge>
                          )}
                          {leg.isAlternateLine && (
                            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-300">
                              Alt Line
                            </Badge>
                          )}
                        </div>
                      </div>
                      {originalDataAvailable && leg.edge > 0 ? (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300 shrink-0">
                          +{leg.edge.toFixed(1)}%
                        </Badge>
                      ) : leg.avgStat ? (
                        <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-300 shrink-0">
                          {leg.avgStat} avg
                        </Badge>
                      ) : null}
                    </div>
                  ))}
                  {topValueLegs.length > 5 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-xs text-blue-600 dark:text-blue-400 cursor-help border-b border-dashed border-blue-400 inline-block">
                          +{topValueLegs.length - 5} more picks analyzed
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>More Analysis Coming Soon</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <div className="space-y-1 text-xs">
                <div className="font-semibold">Best Picks Analysis:</div>
                <div>• Ranked by value edge or performance data</div>
                <div>• Shows top 2 picks with best odds/hit rates</div>
                <div>• L10: Last 10 games hit rate percentage</div>
                <div>• Alt Line: Custom line calculations applied</div>
                <div className="pt-1 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-gray-500">Combines odds value with historical performance</div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* Data Quality Indicator */}
        {!originalDataAvailable && (
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-3">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-1">
                <Info className="h-3 w-3 text-amber-600" />
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <span className="font-medium">Note:</span> Original odds unavailable - analysis based on current market data
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 