"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, ExternalLink, BarChart3, List, ChevronDown, Zap, Info, Target } from "lucide-react"

interface OddsComparisonCardProps {
  parlayResults: Record<string, any>
  bestSportsbook: string
  bestOdds: number | null
  currentSelections: any[]
  originalAmericanOdds: number
  betAmount: number
  expandedOddsComparison: Set<string>
  getSportsbookInfo: (sportsbookId: string) => any
  hasDeepLinking: (sportsbookId: string) => boolean
  getLegOddsForSportsbook: (sportsbookId: string) => any[]
  getHitRateForSelection: (selection: any) => any
  getMarketLabel: (market: string) => string
  formatOddsClean: (odds: number | string) => string
  toggleOddsComparisonDropdown: (sportsbookId: string) => void
  handlePlaceBet: (sportsbookId: string, selectionId?: string) => void
}

export function OddsComparisonCard({
  parlayResults,
  bestSportsbook,
  bestOdds,
  currentSelections,
  originalAmericanOdds,
  betAmount,
  expandedOddsComparison,
  getSportsbookInfo,
  hasDeepLinking,
  getLegOddsForSportsbook,
  getHitRateForSelection,
  getMarketLabel,
  formatOddsClean,
  toggleOddsComparisonDropdown,
  handlePlaceBet,
}: OddsComparisonCardProps) {
  const [showAllSportsbooks, setShowAllSportsbooks] = useState(false)

  const formatMoney = (amount: number): string => {
    return amount.toLocaleString("en-US")
  }

  const sortedResults = Object.entries(parlayResults)
    .filter(([_, result]) => result.hasAllSelections && result.parlayOdds !== null)
    .sort(([, a], [, b]) => (b.parlayOdds || 0) - (a.parlayOdds || 0))

  if (sortedResults.length === 0) {
    return (
      <Card className="mt-4 sm:mt-6 border-0 shadow-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-3xl">
        <CardHeader className="pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            Odds Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6">
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit mx-auto mb-4">
              <BarChart3 className="h-12 w-12 opacity-50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No complete parlay odds available</h3>
            <p className="text-sm">Some selections may not be found at sportsbooks</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Find the best odds for scaling the bars
  const bestOddsValue = sortedResults[0][1].parlayOdds!

  // Determine how many sportsbooks to show initially
  const INITIAL_SHOW_COUNT = 5
  const shouldShowCollapseFeature = sortedResults.length > INITIAL_SHOW_COUNT

  const displayedResults =
    shouldShowCollapseFeature && !showAllSportsbooks ? sortedResults.slice(0, INITIAL_SHOW_COUNT) : sortedResults

  return (
    <Card className="mt-4 sm:mt-6 border-0 shadow-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-3xl">
      <CardHeader className="pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
        <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          Odds Comparison
        </CardTitle>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-2 hidden sm:block">
          Compare parlay odds across sportsbooks to find the best value
        </p>
      </CardHeader>

      <CardContent className="px-4 sm:px-6 pb-6">
        <div className="space-y-4">
          {/* Best Sportsbook - Prominent Display */}
          {sortedResults.length > 0 &&
            (() => {
              const [bestSportsbookId, bestResult] = sortedResults[0]
              const sportsbookInfo = getSportsbookInfo(bestSportsbookId)
              const currentOdds = bestResult.parlayOdds!

              // Calculate percentage improvement over original (profit on $100 bet)
              const currentPayout = currentOdds > 0 
                ? currentOdds  // For +odds, you win the odds amount on $100
                : (100 * 100) / Math.abs(currentOdds)  // For -odds, you win (100 * stake) / |odds|
              
              const originalPayout = originalAmericanOdds > 0
                ? originalAmericanOdds  // For +odds, you win the odds amount on $100
                : (100 * 100) / Math.abs(originalAmericanOdds)  // For -odds, you win (100 * stake) / |odds|
              const percentageImprovement = ((currentPayout - originalPayout) / originalPayout) * 100

              return (
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-green-600/25 rounded-3xl blur-sm"></div>
                  <div className="relative bg-gradient-to-r from-emerald-50 to-green-100/50 dark:from-emerald-950/30 dark:to-green-900/40 border-2 border-emerald-200 dark:border-emerald-800 rounded-3xl overflow-hidden shadow-lg">
                    {/* Enhanced progress bar */}
                    <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500/15 to-green-600/20 w-full"></div>

                    {/* Content */}
                    <div className="relative z-10 p-4 sm:p-6">
                      <div className="flex items-center justify-between gap-4">
                        {/* Left Side */}
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-white dark:bg-slate-800 rounded-2xl shadow-lg shrink-0 ring-2 ring-emerald-200 dark:ring-emerald-700">
                            <img
                              src={sportsbookInfo.logo || "/placeholder.svg"}
                              alt={sportsbookInfo.name}
                              className="w-7 h-7 sm:w-9 sm:h-9 object-contain"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Trophy className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                                Best Odds
                              </span>
                            </div>
                            <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white truncate mb-1">
                              {sportsbookInfo.name}
                            </h3>
                            <div className="flex items-center gap-2">
                              {percentageImprovement > 0 && (
                                <Badge className="text-xs font-semibold bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400">
                                  +{percentageImprovement.toFixed(1)}% better
                                </Badge>
                              )}
                              {hasDeepLinking(bestSportsbookId) && (
                                <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400">
                                  <Zap className="h-3 w-3 mr-1" />
                                  Quick Bet
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Side */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400">
                              {formatOddsClean(currentOdds)}
                            </div>
                            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 hidden sm:block">
                              ${betAmount} wins $
                              {formatMoney(
                                Math.round(
                                  betAmount * (currentOdds > 0 ? currentOdds / 100 : 100 / Math.abs(currentOdds)),
                                ),
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 shadow-lg h-10 sm:h-11 whitespace-nowrap text-sm relative z-20"
                              onClick={() => handlePlaceBet(bestSportsbookId)}
                            >
                              {hasDeepLinking(bestSportsbookId) ? (
                                <>
                                  <Zap className="h-4 w-4 sm:mr-2" />
                                  <span className="hidden sm:inline">Quick Bet</span>
                                </>
                              ) : (
                                <>
                                  <ExternalLink className="h-4 w-4 sm:mr-2" />
                                  <span className="hidden sm:inline">Bet Now</span>
                                </>
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleOddsComparisonDropdown(bestSportsbookId)}
                              className="h-8 w-8 p-0 hover:bg-emerald-100 dark:hover:bg-emerald-800/50 mx-auto relative z-20"
                            >
                              <ChevronDown
                                className={`h-4 w-4 text-emerald-600 transition-transform duration-200 ${
                                  expandedOddsComparison.has(bestSportsbookId) ? "rotate-180" : ""
                                }`}
                              />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Leg-by-Leg Breakdown Dropdown */}
                    {expandedOddsComparison.has(bestSportsbookId) &&
                      (() => {
                        const legOdds = getLegOddsForSportsbook(bestSportsbookId)
                        return (
                          <div className="bg-white dark:bg-slate-900 border-t border-emerald-200 dark:border-emerald-800 relative">
                            <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/50 relative z-10">
                              {/* Header */}
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <List className="h-4 w-4 text-slate-600" />
                                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Individual Legs
                                  </span>
                                </div>
                                <Badge className="text-xs bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-300">
                                  {legOdds.length} legs
                                </Badge>
                              </div>

                              {/* Legs */}
                              <div className="space-y-3">
                                {legOdds.map((leg, legIndex) => {
                                  const matchingSelection = currentSelections.find(
                                    (sel) =>
                                      (sel.player_name || sel.description?.split(" ")?.[0] || "") === leg.playerName,
                                  )
                                  const hitRateData = matchingSelection
                                    ? getHitRateForSelection(matchingSelection)
                                    : null

                                  return (
                                    <div
                                      key={leg.id}
                                      className="bg-white dark:bg-slate-700 rounded-2xl border border-slate-200 dark:border-slate-600 shadow-sm overflow-hidden"
                                    >
                                      {/* Mobile Layout */}
                                      <div className="block lg:hidden">
                                        <div className="p-4">
                                          <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shrink-0">
                                                <Target className="h-4 w-4 text-white" />
                                              </div>
                                              <div className="min-w-0 flex-1">
                                                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                                  {leg.playerName}
                                                </h4>
                                                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                                  {leg.awayTeam} @ {leg.homeTeam}
                                                </div>
                                              </div>
                                            </div>
                                            <div className="text-right">
                                              <div className="text-lg font-bold text-slate-900 dark:text-white">
                                                {formatOddsClean(leg.odds)}
                                              </div>
                                            </div>
                                          </div>

                                          <div className="mb-3">
                                            <div className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                                              {leg.line ? `${Math.ceil(leg.line)}+ ` : ""}
                                              {leg.market}
                                            </div>
                                            {hitRateData && (
                                              <div className="flex items-center gap-2">
                                                <Badge
                                                  className={`text-xs font-semibold ${
                                                    hitRateData.last_10_hit_rate >= 70
                                                      ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                      : hitRateData.last_10_hit_rate >= 50
                                                        ? "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400"
                                                        : "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400"
                                                  }`}
                                                >
                                                  L10: {hitRateData.last_10_hit_rate}%
                                                </Badge>
                                                <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400">
                                                  Season: {hitRateData.season_hit_rate}%
                                                </Badge>
                                              </div>
                                            )}
                                          </div>

                                          <Button
                                            size="sm"
                                            onClick={() => handlePlaceBet(bestSportsbookId, leg.id)}
                                            className={`w-full h-10 text-sm font-semibold ${
                                              leg.hasDeepLink
                                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                                : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-white"
                                            }`}
                                          >
                                            {leg.hasDeepLink ? (
                                              <>
                                                <Zap className="h-4 w-4 mr-2" />
                                                Quick Bet
                                              </>
                                            ) : (
                                              <>
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Place Bet
                                              </>
                                            )}
                                          </Button>
                                        </div>
                                      </div>

                                      {/* Desktop Layout */}
                                      <div className="hidden lg:block">
                                        <div className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-600/50 transition-colors">
                                          <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shrink-0">
                                              <Target className="h-5 w-5 text-white" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <h4 className="font-bold text-lg text-slate-900 dark:text-white truncate mb-1">
                                                {leg.playerName}
                                              </h4>
                                              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                                {leg.line ? `${Math.ceil(leg.line)}+ ` : ""}
                                                {leg.market}
                                              </div>
                                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                                {leg.awayTeam} @ {leg.homeTeam}
                                              </div>
                                              {hitRateData && (
                                                <div className="flex items-center gap-2 mt-2">
                                                  <Badge
                                                    className={`text-xs font-semibold ${
                                                      hitRateData.last_10_hit_rate >= 70
                                                        ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                        : hitRateData.last_10_hit_rate >= 50
                                                          ? "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400"
                                                          : "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400"
                                                    }`}
                                                  >
                                                    L10: {hitRateData.last_10_hit_rate}%
                                                  </Badge>
                                                  <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400">
                                                    Season: {hitRateData.season_hit_rate}%
                                                  </Badge>
                                                </div>
                                              )}
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-4 ml-4">
                                            <div className="text-right">
                                              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                                {formatOddsClean(leg.odds)}
                                              </div>
                                              <div className="text-xs text-slate-500 dark:text-slate-400">American</div>
                                            </div>
                                            <Button
                                              size="sm"
                                              onClick={() => handlePlaceBet(bestSportsbookId, leg.id)}
                                              className={`px-4 py-2 text-sm font-semibold ${
                                                leg.hasDeepLink
                                                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                                                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-white"
                                              }`}
                                            >
                                              {leg.hasDeepLink ? (
                                                <>
                                                  <Zap className="h-4 w-4 mr-2" />
                                                  Quick
                                                </>
                                              ) : (
                                                <>
                                                  <ExternalLink className="h-4 w-4 mr-2" />
                                                  Bet
                                                </>
                                              )}
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>

                              {legOdds.length === 0 && (
                                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                  <Info className="h-8 w-8 mx-auto mb-3 opacity-50" />
                                  <p className="text-sm">No individual leg odds available</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })()}
                  </div>
                </div>
              )
            })()}

          {/* Other Sportsbooks */}
          {displayedResults.length > 1 && (
            <>
              <div className="flex items-center gap-3 pt-2">
                <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium px-3">Other Options</span>
                <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
              </div>

              <div className="space-y-3">
                {displayedResults.slice(1).map(([sportsbookId, result]) => {
                  const sportsbookInfo = getSportsbookInfo(sportsbookId)
                  const currentOdds = result.parlayOdds!

                  // Calculate percentage improvement over original (profit on $100 bet)
                  const currentPayout = currentOdds > 0 
                    ? currentOdds  // For +odds, you win the odds amount on $100
                    : (100 * 100) / Math.abs(currentOdds)  // For -odds, you win (100 * stake) / |odds|
                  
                  const originalPayout = originalAmericanOdds > 0
                    ? originalAmericanOdds  // For +odds, you win the odds amount on $100
                    : (100 * 100) / Math.abs(originalAmericanOdds)  // For -odds, you win (100 * stake) / |odds|
                  const percentageImprovement = ((currentPayout - originalPayout) / originalPayout) * 100

                  // Calculate bar width (relative to best odds)
                  const barWidth = Math.max((Math.abs(currentOdds) / Math.abs(bestOddsValue)) * 100, 20)

                  return (
                    <div
                      key={sportsbookId}
                      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-lg ${
                        hasDeepLinking(sportsbookId)
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-950/30 dark:to-indigo-950/30 dark:border-blue-800"
                          : "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                      }`}
                    >
                      {/* Progress Bar */}
                      <div
                        className={`absolute left-0 top-0 h-full transition-all duration-1000 ease-out ${
                          hasDeepLinking(sportsbookId)
                            ? "bg-gradient-to-r from-blue-200/40 to-indigo-200/40 dark:from-blue-900/30 dark:to-indigo-900/30"
                            : "bg-gradient-to-r from-slate-200/40 to-slate-300/40 dark:from-slate-700/30 dark:to-slate-600/30"
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />

                      {/* Content */}
                      <div className="relative z-10 p-4">
                        <div className="flex items-center justify-between gap-4">
                          {/* Left Side */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-slate-800 rounded-xl shadow-sm shrink-0">
                              <img
                                src={sportsbookInfo.logo || "/placeholder.svg"}
                                alt={sportsbookInfo.name}
                                className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate mb-1">
                                {sportsbookInfo.name}
                              </h3>
                              <div className="flex items-center gap-2">
                                {percentageImprovement > 0 && (
                                  <Badge
                                    className={`text-xs font-medium ${
                                      percentageImprovement > 20
                                        ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400"
                                        : percentageImprovement > 10
                                          ? "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/30 dark:text-blue-400"
                                          : "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-400"
                                    }`}
                                  >
                                    +{percentageImprovement.toFixed(1)}%
                                  </Badge>
                                )}
                                {hasDeepLinking(sportsbookId) && (
                                  <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400">
                                    <Zap className="h-3 w-3 mr-1" />
                                    Quick Bet
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Side */}
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                                {formatOddsClean(currentOdds)}
                              </div>
                              <div className="hidden sm:block text-xs text-slate-600 dark:text-slate-400">
                                ${betAmount} wins $
                                {formatMoney(
                                  Math.round(
                                    betAmount * (currentOdds > 0 ? currentOdds / 100 : 100 / Math.abs(currentOdds)),
                                  ),
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                className={`px-3 py-2 text-xs font-semibold h-9 ${
                                  hasDeepLinking(sportsbookId)
                                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-white"
                                }`}
                                onClick={() => handlePlaceBet(sportsbookId)}
                              >
                                {hasDeepLinking(sportsbookId) ? (
                                  <>
                                    <Zap className="h-3 w-3 sm:mr-1" />
                                    <span className="hidden sm:inline">Quick</span>
                                  </>
                                ) : (
                                  <>
                                    <ExternalLink className="h-3 w-3 sm:mr-1" />
                                    <span className="hidden sm:inline">Bet</span>
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleOddsComparisonDropdown(sportsbookId)}
                                className="px-2 py-2 hover:bg-white/50 dark:hover:bg-slate-700/50 h-9"
                              >
                                <ChevronDown
                                  className={`h-4 w-4 text-slate-500 transition-transform ${
                                    expandedOddsComparison.has(sportsbookId) ? "rotate-180" : ""
                                  }`}
                                />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Leg-by-Leg Breakdown Dropdown */}
                      {expandedOddsComparison.has(sportsbookId) &&
                        (() => {
                          const legOdds = getLegOddsForSportsbook(sportsbookId)
                          return (
                            <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 relative z-10">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-2">
                                    <List className="h-4 w-4 text-slate-600" />
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                      Individual Legs
                                    </span>
                                  </div>
                                  <Badge className="text-xs bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-300">
                                    {legOdds.length} legs
                                  </Badge>
                                </div>

                                {/* Legs */}
                                <div className="space-y-3 relative">
                                  {legOdds.map((leg) => {
                                    const matchingSelection = currentSelections.find(
                                      (sel) =>
                                        (sel.player_name || sel.description?.split(" ")?.[0] || "") === leg.playerName,
                                    )
                                    const hitRateData = matchingSelection
                                      ? getHitRateForSelection(matchingSelection)
                                      : null

                                    return (
                                      <div
                                        key={leg.id}
                                        className="bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm p-4 relative"
                                      >
                                        <div className="flex items-center justify-between gap-4">
                                          <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shrink-0">
                                              <Target className="h-4 w-4 text-white" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                                {leg.playerName}
                                              </h4>
                                              <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                                                {leg.line ? `${Math.ceil(leg.line)}+ ` : ""}
                                                {leg.market}
                                              </div>
                                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                                {leg.awayTeam} @ {leg.homeTeam}
                                              </div>
                                              {hitRateData && (
                                                <div className="flex items-center gap-1 mt-2">
                                                  <Badge
                                                    className={`text-xs ${
                                                      hitRateData.last_10_hit_rate >= 70
                                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                        : hitRateData.last_10_hit_rate >= 50
                                                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                    }`}
                                                  >
                                                    L10: {hitRateData.last_10_hit_rate}%
                                                  </Badge>
                                                </div>
                                              )}
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-3 relative z-20">
                                            <div className="text-right">
                                              <div className="text-lg font-bold text-slate-900 dark:text-white">
                                                {formatOddsClean(leg.odds)}
                                              </div>
                                            </div>
                                            <Button
                                              size="sm"
                                              onClick={() => handlePlaceBet(sportsbookId, leg.id)}
                                              className={`px-3 py-2 text-xs font-semibold relative z-20 ${
                                                leg.hasDeepLink
                                                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                                                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-white"
                                              }`}
                                            >
                                              {leg.hasDeepLink ? (
                                                <>
                                                  <Zap className="h-3 w-3 mr-1" />
                                                  Quick
                                                </>
                                              ) : (
                                                <>
                                                  <ExternalLink className="h-3 w-3 mr-1" />
                                                  Bet
                                                </>
                                              )}
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>

                                {legOdds.length === 0 && (
                                  <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                                    <Info className="h-6 w-6 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No individual leg odds available</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })()}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Show More/Less Toggle */}
          {shouldShowCollapseFeature && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllSportsbooks(!showAllSportsbooks)}
                className="text-sm text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 h-10 px-4"
              >
                {showAllSportsbooks ? (
                  <>
                    Show Less
                    <ChevronDown className="h-4 w-4 ml-2 rotate-180" />
                  </>
                ) : (
                  <>
                    Show {sortedResults.length - INITIAL_SHOW_COUNT} More Books
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
