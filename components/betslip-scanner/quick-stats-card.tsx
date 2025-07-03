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
  BarChart3,
  TrendingUp,
  Target,
  Shield,
  Eye,
  EyeOff,
  Info,
} from "lucide-react"

interface QuickStatsCardProps {
  betslip: any
  selections: any[]
  isPublicState: boolean
  parlayResults: Record<string, any>
  bestOdds: number | null
  bestSportsbook: string
  hitRatesData?: Record<string, any>
  getSportsbookInfo: (sportsbookId: string) => any
  getHitRateForSelection: (selection: any) => any
}

export function QuickStatsCard({
  betslip,
  selections,
  isPublicState,
  parlayResults,
  bestOdds,
  bestSportsbook,
  hitRatesData,
  getSportsbookInfo,
  getHitRateForSelection,
}: QuickStatsCardProps) {
  // Calculate enhanced stats
  const originalTotalOdds = selections.reduce((acc, sel) => {
    const odds = sel.original_odds
    return acc * (odds > 0 ? odds / 100 + 1 : 100 / Math.abs(odds) + 1)
  }, 1)
  const originalAmericanOdds = originalTotalOdds >= 2 ? Math.round((originalTotalOdds - 1) * 100) : Math.round(-100 / (originalTotalOdds - 1))
  const originalPayout = originalAmericanOdds > 0 ? originalAmericanOdds / 100 * 100 : 100 / Math.abs(originalAmericanOdds) * 100
  const bestPayout = bestOdds ? (bestOdds > 0 ? bestOdds / 100 * 100 : 100 / Math.abs(bestOdds) * 100) : 0
  const valueEdge = bestOdds && originalAmericanOdds ? ((bestPayout - originalPayout) / originalPayout) * 100 : 0
  const winDelta = bestPayout - originalPayout
  const booksBeaten = Object.values(parlayResults).filter(result => 
    result.hasAllSelections && result.parlayOdds && result.parlayOdds < bestOdds
  ).length
  
  // Hit rate analysis for OddSmash Score calculation
  const hitRateAnalysis = selections.map(selection => {
    const hitRateData = getHitRateForSelection(selection)
    console.log('🎯 ODDSMASH SCORE DEBUG - Selection:', {
      playerName: selection.player_name,
      market: selection.market,
      hitRateData: hitRateData,
      hasHitRateData: !!hitRateData,
      l10HitRate: hitRateData?.l10_hit_rate || hitRateData?.last_10_hit_rate || 0,
      isAlternateLine: hitRateData?.is_alternate_line || false
    })
    return {
      l10HitRate: hitRateData?.l10_hit_rate || hitRateData?.last_10_hit_rate || 0,
      isAlternateLine: hitRateData?.is_alternate_line || false
    }
  })
  
  const avgHitRate = hitRateAnalysis.length > 0 
    ? hitRateAnalysis.reduce((sum, item) => sum + item.l10HitRate, 0) / hitRateAnalysis.length 
    : 0
  
  const highConfidencePicks = hitRateAnalysis.filter(item => item.l10HitRate >= 70).length
  const alternateLinesCount = hitRateAnalysis.filter(item => item.isAlternateLine).length
  
  console.log('🎯 ODDSMASH SCORE ANALYSIS:', {
    hitRateAnalysis,
    avgHitRate,
    highConfidencePicks,
    alternateLinesCount,
    bestOdds,
    originalAmericanOdds,
    parlayResults: Object.keys(parlayResults).length
  })
  
  // Enhanced OddSmash Score calculation
  const totalBooks = Math.max(Object.keys(parlayResults).length, 1)
  let edgeScore = 0
  if (bestOdds && originalAmericanOdds && bestPayout > 0 && originalPayout > 0) {
    const edgePercent = ((bestPayout - originalPayout) / originalPayout) * 100
    edgeScore = Math.min(Math.max(edgePercent * 1.5, 0), 35) // Up to 35 points for value edge
  } else {
    // Alternative scoring when no original odds available
    edgeScore = Math.min((bestPayout / 100) * 4, 18) // Base scoring on absolute payout
  }
  
  const marketBeatScore = (booksBeaten / totalBooks) * 20 // Up to 20 points
  const hitRateScore = Math.min((avgHitRate / 100) * 25, 25) // Up to 25 points for hit rate
  const confidenceBonus = Math.min(highConfidencePicks * 2, 10) // Up to 10 points (2 per high-confidence pick)
  const alternateLineBonus = Math.min(alternateLinesCount * 1.5, 5) // Up to 5 points for alternate lines
  const dataQualityScore = hitRateAnalysis.length > 0 ? 5 : 0 // 5 points for having hit rate data
  
  const rawScore = edgeScore + marketBeatScore + hitRateScore + confidenceBonus + alternateLineBonus + dataQualityScore
  const oddsmashScore = Math.round(Math.min(Math.max(rawScore, 0), 100))
  
  console.log('🎯 ODDSMASH SCORE BREAKDOWN:', {
    edgeScore: Math.round(edgeScore * 100) / 100,
    marketBeatScore: Math.round(marketBeatScore * 100) / 100,
    hitRateScore: Math.round(hitRateScore * 100) / 100,
    confidenceBonus: Math.round(confidenceBonus * 100) / 100,
    alternateLineBonus: Math.round(alternateLineBonus * 100) / 100,
    dataQualityScore,
    rawScore: Math.round(rawScore * 100) / 100,
    finalScore: oddsmashScore,
    inputs: {
      avgHitRate,
      bestOdds,
      originalAmericanOdds,
      bestPayout,
      originalPayout,
      booksBeaten,
      totalBooks
    }
  })

  return (
    <Card className="border-0 shadow-lg bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-600" />
          Quick Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hero Stats - Mobile Optimized */}
        <div className="grid grid-cols-2 gap-3">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-white">
            <div className="relative z-10">
              <div className="text-2xl font-bold">{betslip.total_selections}</div>
              <div className="text-xs font-medium opacity-90">Picks</div>
              <div className="text-lg font-semibold mt-1">{Object.keys(parlayResults).length}</div>
              <div className="text-xs font-medium opacity-90">Books</div>
            </div>
            <div className="absolute -right-2 -top-2 h-12 w-12 rounded-full bg-white/10"></div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-4 text-white cursor-help">
                <div className="relative z-10">
                  <div className="text-2xl font-bold">{oddsmashScore}/100</div>
                  <div className="text-xs font-medium opacity-90">OddSmash Score</div>
                  <div className="text-sm font-semibold mt-1 opacity-90">
                    {oddsmashScore >= 80 ? 'Elite' :
                     oddsmashScore >= 60 ? 'Strong' :
                     oddsmashScore >= 40 ? 'Good' : 'Fair'}
                  </div>
                </div>
                <div className="absolute -right-2 -top-2 h-12 w-12 rounded-full bg-white/10"></div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <div className="space-y-2 text-xs">
                <div className="font-semibold">Score Breakdown:</div>
                <div>• Value Edge: {Math.round(edgeScore)}/35 pts</div>
                <div>• Hit Rate: {Math.round(hitRateScore)}/25 pts</div>
                <div>• Market Beat: {Math.round(marketBeatScore)}/20 pts</div>
                <div>• High Confidence: {Math.round(confidenceBonus)}/10 pts</div>
                <div>• Data Quality: {dataQualityScore}/5 pts</div>
                {alternateLineBonus > 0 && <div>• Alt Lines: {Math.round(alternateLineBonus)}/5 pts</div>}
                <div className="pt-1 border-t border-gray-200 dark:border-gray-600">
                  <div className="font-medium">Total: {Math.round(edgeScore + hitRateScore + marketBeatScore + confidenceBonus + dataQualityScore + alternateLineBonus)}/100</div>
                  <div className="mt-1 text-gray-500">Higher scores indicate better value and stronger data backing</div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Value Metrics */}
        <div className="space-y-3">
          {valueEdge > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border border-emerald-200 dark:border-emerald-800 p-4 cursor-help">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-1.5">
                        <TrendingUp className="h-3 w-3 text-emerald-600" />
                      </div>
                      <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Value Edge</span>
                      <Info className="h-3 w-3 text-emerald-600 opacity-60" />
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                        +{valueEdge.toFixed(1)}%
                      </div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400">vs market</div>
                    </div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <div className="space-y-1 text-xs">
                  <div className="font-semibold">Value Edge Explained:</div>
                  <div>• Percentage advantage over your original odds</div>
                  <div>• Higher percentages indicate better value</div>
                  <div>• Based on current market prices vs. your betslip</div>
                  <div className="pt-1 border-t border-gray-200 dark:border-gray-600">
                    <div className="text-gray-500">Positive edge suggests this bet offers above-market value</div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          )}

          {winDelta > 10 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border border-orange-200 dark:border-orange-800 p-4 cursor-help">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-orange-100 dark:bg-orange-900/30 p-1.5">
                        <TrendingUp className="h-3 w-3 text-orange-600" />
                      </div>
                      <span className="text-sm font-semibold text-orange-800 dark:text-orange-200">Win Bonus</span>
                      <Info className="h-3 w-3 text-orange-600 opacity-60" />
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-orange-700 dark:text-orange-400">
                        +${winDelta.toFixed(0)}
                      </div>
                      <div className="text-xs text-orange-600 dark:text-orange-400">
                        with {bestSportsbook ? getSportsbookInfo(bestSportsbook).name : 'best book'}
                      </div>
                    </div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <div className="space-y-1 text-xs">
                  <div className="font-semibold">Win Bonus Explained:</div>
                  <div>• Extra winnings compared to your original sportsbook</div>
                  <div>• Shows potential additional profit on $100 bet</div>
                  <div>• Calculated from best available odds vs. original</div>
                  <div className="pt-1 border-t border-gray-200 dark:border-gray-600">
                    <div className="text-gray-500">Higher bonus means better odds shopping opportunity</div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        
        {/* Secondary Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-help">
                  <Target className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Books Beaten</span>
                  <Info className="h-3 w-3 text-gray-500 opacity-60" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <div className="space-y-1 text-xs">
                  <div className="font-semibold">Books Beaten:</div>
                  <div>• Number of sportsbooks offering worse odds</div>
                  <div>• Higher ratio means better market position</div>
                  <div>• Indicates how competitive your odds are</div>
                  <div className="pt-1 border-t border-gray-200 dark:border-gray-600">
                    <div className="text-gray-500">More books beaten = better value found</div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
            <Badge variant="outline" className="bg-gray-50 dark:bg-gray-800 font-semibold">
              {booksBeaten}/{Object.keys(parlayResults).length}
            </Badge>
          </div>
          <div className="flex items-center justify-between py-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-help">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Scan Confidence</span>
                  <Info className="h-3 w-3 text-gray-500 opacity-60" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <div className="space-y-1 text-xs">
                  <div className="font-semibold">Scan Confidence:</div>
                  <div>• AI accuracy in reading your betslip image</div>
                  <div>• Higher percentage means more reliable data</div>
                  <div>• Based on text clarity and recognition quality</div>
                  <div className="pt-1 border-t border-gray-200 dark:border-gray-600">
                    <div className="text-gray-500">80%+ is considered highly accurate</div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
            <Badge 
              variant="outline" 
              className={`font-semibold ${
                betslip.scan_confidence >= 0.8 
                  ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400"
              }`}
            >
              {Math.round(betslip.scan_confidence * 100)}%
            </Badge>
          </div>
          <div className="flex items-center justify-between py-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-help">
                  {isPublicState ? <Eye className="h-4 w-4 text-gray-500" /> : <EyeOff className="h-4 w-4 text-gray-500" />}
                  <span className="text-sm text-gray-600 dark:text-gray-400">Privacy</span>
                  <Info className="h-3 w-3 text-gray-500 opacity-60" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <div className="space-y-1 text-xs">
                  <div className="font-semibold">Privacy Setting:</div>
                  <div>• Public: Anyone with link can view this betslip</div>
                  <div>• Private: Only you can access this betslip</div>
                  <div>• Change anytime using the toggle button</div>
                  <div className="pt-1 border-t border-gray-200 dark:border-gray-600">
                    <div className="text-gray-500">Public betslips can be shared easily</div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
            <Badge
              variant={isPublicState ? "default" : "secondary"}
              className={`font-semibold ${
                isPublicState
                  ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400"
                  : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {isPublicState ? "Public" : "Private"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 