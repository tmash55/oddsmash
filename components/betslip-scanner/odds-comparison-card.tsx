"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, ExternalLink, BarChart3, List, ChevronDown, Zap, Info } from "lucide-react"

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
      <Card className="mt-6 border-0 shadow-lg bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            Odds Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <h3 className="text-base font-medium mb-2">No complete parlay odds available</h3>
            <p className="text-sm">Some selections may not be found at sportsbooks</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Find the best odds for scaling the bars
  const bestOddsValue = sortedResults[0][1].parlayOdds!

  // Determine how many sportsbooks to show initially
  const INITIAL_SHOW_COUNT = 6
  const shouldShowCollapseFeature = sortedResults.length > INITIAL_SHOW_COUNT

  let adjustedShowCount = INITIAL_SHOW_COUNT
  if (shouldShowCollapseFeature && !showAllSportsbooks) {
    adjustedShowCount = 7
  }

  const displayedResults =
    shouldShowCollapseFeature && !showAllSportsbooks ? sortedResults.slice(0, adjustedShowCount) : sortedResults

  return (
    <Card className="mt-4 sm:mt-6 border-0 shadow-lg bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
      <CardHeader className="pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
        <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-600" />
          Odds Comparison
        </CardTitle>
        <p className="text-gray-600 dark:text-gray-400 text-sm hidden sm:block">
          Compare parlay odds across sportsbooks to find the best value
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Best Sportsbook - Pinned and Prominent */}
          {sortedResults.length > 0 && (
            (() => {
              const [bestSportsbookId, bestResult] = sortedResults[0]
              const sportsbookInfo = getSportsbookInfo(bestSportsbookId)
              const currentOdds = bestResult.parlayOdds!

              // Calculate percentage improvement over original
              const currentPayout = currentOdds > 0 ? (currentOdds / 100) * 100 : (100 / Math.abs(currentOdds)) * 100
              const originalPayout =
                originalAmericanOdds > 0
                  ? (originalAmericanOdds / 100) * 100
                  : (100 / Math.abs(originalAmericanOdds)) * 100
              const percentageImprovement = ((currentPayout - originalPayout) / originalPayout) * 100

              return (
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-500/10 to-green-600/15 rounded-2xl blur-sm"></div>

                  <div className="relative bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/30 border-2 border-green-200 dark:border-green-800 rounded-2xl overflow-hidden shadow-lg">
                    {/* Enhanced progress bar for best */}
                    <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500/15 to-green-600/20 dark:from-green-500/15 dark:to-green-600/20 w-full"></div>

                    {/* Content */}
                    <div className="relative z-10 p-3 sm:p-5">
                      <div className="flex items-center justify-between gap-3 sm:gap-4">
                        {/* Left Side - Cleaner layout */}
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-gray-800 rounded-xl shadow-md shrink-0 ring-2 ring-green-200 dark:ring-green-700">
                            <img
                              src={sportsbookInfo.logo || "/placeholder.svg"}
                              alt={sportsbookInfo.name}
                              className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            {/* Sportsbook name - always visible but responsive sizing */}
                            <h3 className="font-bold text-sm sm:text-lg text-gray-900 dark:text-white truncate mb-1">
                              {sportsbookInfo.name}
                            </h3>
                            
                            {/* Single informational badge - mobile friendly */}
                            <div className="flex items-center gap-2">
                              {percentageImprovement > 0 ? (
                                <Badge
                                  variant="outline"
                                  className="text-xs font-semibold bg-green-50 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400"
                                >
                                  +{percentageImprovement.toFixed(1)}%
                                </Badge>
                              ) : hasDeepLinking(bestSportsbookId) ? (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400">
                                  <Zap className="h-2.5 w-2.5 mr-1" />
                                  Quick Bet
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        {/* Right Side - Enhanced odds display */}
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-lg sm:text-2xl font-black text-green-700 dark:text-green-400">
                              {formatOddsClean(currentOdds)}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                              ${betAmount} wins ${formatMoney(Math.round(betAmount * (currentOdds > 0 ? currentOdds / 100 : 100 / Math.abs(currentOdds))))}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 sm:gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-2 sm:px-3 py-2 shadow-md h-8 sm:h-9 whitespace-nowrap text-xs"
                              onClick={() => handlePlaceBet(bestSportsbookId)}
                            >
                              {hasDeepLinking(bestSportsbookId) ? (
                                <>
                                  <Zap className="h-3 w-3 sm:mr-1.5" />
                                  <span className="hidden sm:inline">Quick Bet</span>
                                </>
                              ) : (
                                <>
                                  <ExternalLink className="h-3 w-3 sm:mr-1.5" />
                                  <span className="hidden sm:inline">Bet Now</span>
                                </>
                              )}
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleOddsComparisonDropdown(bestSportsbookId)}
                              className="h-8 w-8 p-0 hover:bg-green-100 dark:hover:bg-green-800"
                            >
                              <ChevronDown
                                className={`h-4 w-4 text-green-600 transition-transform duration-200 ${
                                  expandedOddsComparison.has(bestSportsbookId) ? "rotate-180" : ""
                                }`}
                              />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Leg-by-Leg Breakdown Dropdown for best sportsbook */}
                    {expandedOddsComparison.has(bestSportsbookId) &&
                      (() => {
                        const legOdds = getLegOddsForSportsbook(bestSportsbookId)

                        return (
                          <div className="bg-white dark:bg-gray-900 relative z-20 shadow-lg rounded-b-2xl overflow-hidden">
                            <div className="border-t border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-lg relative z-20">
                              <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 relative">
                                {/* Header - Mobile Optimized */}
                                <div className="flex items-center justify-between mb-3 sm:mb-4">
                                  <div className="flex items-center gap-2">
                                    <List className="h-4 w-4 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      <span className="hidden sm:inline">Individual Legs • {sportsbookInfo.name}</span>
                                      <span className="sm:hidden">{legOdds.length}-Legs</span>
                                    </span>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-gray-100 text-gray-700 border-gray-300 hidden sm:inline-flex"
                                  >
                                    {legOdds.length}
                                  </Badge>
                                </div>

                                {/* Mobile-First Leg Cards */}
                                <div className="space-y-3">
                                  {legOdds.map((leg, legIndex) => (
                                    <div
                                      key={leg.id}
                                      className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden"
                                    >
                                      {/* Mobile Layout - Stacked */}
                                      <div className="block sm:hidden">
                                        <div className="p-3">
                                          {/* Top Row - Player name and status */}
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                              <span className="font-bold text-sm text-gray-900 dark:text-white truncate">
                                                {leg.playerName}
                                              </span>
                                            </div>
                                            <div className="text-right">
                                              <div className="text-lg font-bold text-gray-900 dark:text-white">
                                                {formatOddsClean(leg.odds)}
                                              </div>
                                            </div>
                                          </div>

                                          {/* Market Info */}
                                          <div className="mb-2">
                                            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                              {leg.line ? `${Math.ceil(leg.line)}+ ` : ""}
                                              {leg.market}
                                            </div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                              {leg.awayTeam} @ {leg.homeTeam}
                                            </div>
                                          </div>

                                          {/* Hit Rate - Mobile Compact */}
                                          {(() => {
                                            const matchingSelection = currentSelections.find(
                                              (sel) =>
                                                (sel.player_name || sel.description?.split(" ")?.[0] || "") ===
                                                leg.playerName,
                                            )
                                            if (!matchingSelection) return null

                                            const hitRateData = getHitRateForSelection(matchingSelection)
                                            if (!hitRateData) return null

                                            return (
                                              <div className="flex items-center gap-2 mb-3">
                                                <Badge
                                                  variant="outline"
                                                  className={`text-xs font-semibold px-2 py-1 ${
                                                    hitRateData.last_10_hit_rate >= 70
                                                      ? "bg-primary/10 text-primary border-primary/30 dark:bg-primary/20 dark:text-primary/90"
                                                      : hitRateData.last_10_hit_rate >= 50
                                                        ? "bg-amber-50 text-amber-700 border-amber-400 dark:bg-amber-900/20 dark:text-amber-400"
                                                        : "bg-red-50 text-red-700 border-red-400 dark:bg-red-900/20 dark:text-red-400"
                                                  }`}
                                                >
                                                  L10: {hitRateData.last_10_hit_rate}%
                                                </Badge>
                                                <Badge
                                                  variant="outline"
                                                  className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-700 border-blue-400 dark:bg-blue-900/20 dark:text-blue-400"
                                                >
                                                  Season: {hitRateData.season_hit_rate}%
                                                </Badge>
                                              </div>
                                            )
                                          })()}

                                          {/* Action Button */}
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePlaceBet(bestSportsbookId, leg.id)}
                                            className={`w-full text-xs font-medium transition-colors ${
                                              leg.hasDeepLink
                                                ? "bg-blue-500 hover:bg-blue-600 text-white border-blue-400"
                                                : "border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                                            }`}
                                          >
                                            {leg.hasDeepLink ? (
                                              <>
                                                <Zap className="h-3 w-3 mr-2" />
                                                Quick Bet
                                              </>
                                            ) : (
                                              <>
                                                <ExternalLink className="h-3 w-3 mr-2" />
                                                Place Bet
                                              </>
                                            )}
                                          </Button>
                                        </div>
                                      </div>

                                      {/* Desktop Layout - Horizontal */}
                                      <div className="hidden sm:block">
                                        <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                                          <div className="flex-1 min-w-0">
                                            {/* Player name and match status */}
                                            <div className="flex items-center gap-3 mb-2">
                                              <span className="font-bold text-lg text-gray-900 dark:text-white truncate">
                                                {leg.playerName}
                                              </span>
                                            </div>

                                            {/* Hit Rate Information - Enhanced */}
                                            {(() => {
                                              const matchingSelection = currentSelections.find(
                                                (sel) =>
                                                  (sel.player_name || sel.description?.split(" ")?.[0] || "") ===
                                                  leg.playerName,
                                              )
                                              if (!matchingSelection) return null

                                              const hitRateData = getHitRateForSelection(matchingSelection)
                                              if (!hitRateData) return null

                                              return (
                                                <div className="flex items-center gap-2 mb-3">
                                                  <div className="flex items-center gap-1">
                                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                      Hit Rate:
                                                    </span>
                                                    <Badge
                                                      variant="outline"
                                                      className={`text-xs font-semibold px-2 py-1 ${
                                                        hitRateData.last_10_hit_rate >= 70
                                                          ? "bg-primary/10 text-primary border-primary/30 dark:bg-primary/20 dark:text-primary/90"
                                                          : hitRateData.last_10_hit_rate >= 50
                                                            ? "bg-amber-50 text-amber-700 border-amber-400 dark:bg-amber-900/20 dark:text-amber-400"
                                                            : "bg-red-50 text-red-700 border-red-400 dark:bg-red-900/20 dark:text-red-400"
                                                      }`}
                                                    >
                                                      L10: {hitRateData.last_10_hit_rate}%
                                                    </Badge>
                                                    <Badge
                                                      variant="outline"
                                                      className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-700 border-blue-400 dark:bg-blue-900/20 dark:text-blue-400"
                                                    >
                                                      Season: {hitRateData.season_hit_rate}%
                                                    </Badge>
                                                  </div>
                                                </div>
                                              )
                                            })()}

                                            {/* Market and game info */}
                                            <div className="space-y-1">
                                              <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                  {leg.line ? `${Math.ceil(leg.line)}+ ` : ""}
                                                  {leg.market}
                                                </span>
                                              </div>
                                              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                                {leg.awayTeam} @ {leg.homeTeam}
                                              </div>
                                            </div>
                                          </div>

                                          {/* Right side - Odds and action */}
                                          <div className="flex items-center gap-3 ml-4">
                                            <div className="text-right">
                                              <div className="text-xl font-bold text-gray-900 dark:text-white">
                                                {formatOddsClean(leg.odds)}
                                              </div>
                                              <div className="text-xs text-gray-500 dark:text-gray-400">American</div>
                                            </div>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handlePlaceBet(bestSportsbookId, leg.id)}
                                              className={`px-3 py-2 text-xs font-medium transition-colors ${
                                                leg.hasDeepLink
                                                  ? "bg-blue-500 hover:bg-blue-600 text-white border-blue-400"
                                                  : "border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
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
                                    </div>
                                  ))}
                                </div>

                                {legOdds.length === 0 && (
                                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                                    <Info className="h-6 w-6 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No individual leg odds available</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                  </div>
                </div>
              )
            })()
          )}

          {/* Other Sportsbooks - Grid Layout */}
          {displayedResults.length > 1 && (
            <>
              <div className="flex items-center gap-2 pt-2">
                <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium px-3">Other Options</span>
                <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {displayedResults.slice(1).map(([sportsbookId, result], index) => {
                  const sportsbookInfo = getSportsbookInfo(sportsbookId)
                  const isBest = false
                  const actualIndex = index + 1
                  const currentOdds = result.parlayOdds!

                  // Calculate percentage improvement over original
                  const currentPayout =
                    currentOdds > 0 ? (currentOdds / 100) * 100 : (100 / Math.abs(currentOdds)) * 100
                  const originalPayout =
                    originalAmericanOdds > 0
                      ? (originalAmericanOdds / 100) * 100
                      : (100 / Math.abs(originalAmericanOdds)) * 100
                  const percentageImprovement = ((currentPayout - originalPayout) / originalPayout) * 100

                  // Calculate bar width (relative to best odds)
                  const barWidth = Math.max((Math.abs(currentOdds) / Math.abs(bestOddsValue)) * 100, 15)

                  return (
                    <div
                      key={sportsbookId}
                      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-md ${
                        hasDeepLinking(sportsbookId)
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-950/20 dark:to-indigo-950/20 dark:border-blue-800"
                          : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                      }`}
                    >
                      {/* Progress Bar */}
                      <div
                        className={`absolute left-0 top-0 h-full transition-all duration-1000 ease-out ${
                          hasDeepLinking(sportsbookId)
                            ? "bg-gradient-to-r from-blue-200/30 to-indigo-200/30 dark:from-blue-900/20 dark:to-indigo-900/20"
                            : "bg-gradient-to-r from-gray-200/30 to-gray-300/30 dark:from-gray-700/20 dark:to-gray-600/20"
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />

                      {/* Content - Mobile Optimized */}
                      <div className="relative z-10 p-3 sm:p-4">
                        <div className="flex items-center justify-between gap-3">
                          {/* Left Side - Sportsbook Info */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm flex-shrink-0">
                              <img
                                src={sportsbookInfo.logo || "/placeholder.svg"}
                                alt={sportsbookInfo.name}
                                className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              {/* Always show sportsbook name, responsive sizing */}
                              <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate mb-1">
                                {sportsbookInfo.name}
                              </h3>
                              
                              {/* Single most relevant badge */}
                              <div className="flex items-center gap-1">
                                {percentageImprovement > 0 ? (
                                  <Badge
                                    variant="outline"
                                    className={`text-xs font-medium ${
                                      percentageImprovement > 20
                                        ? "bg-green-50 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400"
                                        : percentageImprovement > 10
                                          ? "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/20 dark:text-blue-400"
                                          : "bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-400"
                                    }`}
                                  >
                                    +{percentageImprovement.toFixed(1)}%
                                  </Badge>
                                ) : hasDeepLinking(sportsbookId) ? (
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400">
                                    <Zap className="h-2.5 w-2.5 mr-1" />
                                    Quick Bet
                                  </Badge>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          {/* Right Side - Odds & Actions - Mobile Optimized */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                              <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                                {formatOddsClean(currentOdds)}
                              </div>
                              {/* Show payout on desktop only */}
                              <div className="hidden sm:block text-xs text-gray-600 dark:text-gray-400">
                                ${betAmount} wins ${formatMoney(Math.round(betAmount * (currentOdds > 0 ? currentOdds / 100 : 100 / Math.abs(currentOdds))))}
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className={`px-2 sm:px-3 py-2 text-xs font-semibold ${
                                  hasDeepLinking(sportsbookId)
                                    ? "bg-blue-500 hover:bg-blue-600 text-white border-blue-400"
                                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
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
                                className="px-1 sm:px-2 py-2 hover:bg-white/50 dark:hover:bg-gray-700/50"
                              >
                                <ChevronDown
                                  className={`h-4 w-4 text-gray-500 transition-transform ${
                                    expandedOddsComparison.has(sportsbookId) ? "rotate-180" : ""
                                  }`}
                                />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Leg-by-Leg Breakdown Dropdown - IMPROVED BACKGROUNDS */}
                      {expandedOddsComparison.has(sportsbookId) &&
                        (() => {
                          const legOdds = getLegOddsForSportsbook(sportsbookId)

                          return (
                            <div className="bg-white dark:bg-gray-900 relative z-20 shadow-lg rounded-b-2xl overflow-hidden">
                              <div className="border-t border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-lg relative z-20">
                                <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 relative">
                                  {/* Header - Mobile Optimized */}
                                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                                    <div className="flex items-center gap-2">
                                      <List className="h-4 w-4 text-gray-600" />
                                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        <span className="hidden sm:inline">Individual Legs • {sportsbookInfo.name}</span>
                                        <span className="sm:hidden">{legOdds.length}-Legs</span>
                                      </span>
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-gray-100 text-gray-700 border-gray-300 hidden sm:inline-flex"
                                    >
                                      {legOdds.length}
                                    </Badge>
                                  </div>

                                  {/* Mobile-First Leg Cards */}
                                  <div className="space-y-3">
                                    {legOdds.map((leg, legIndex) => (
                                      <div
                                        key={leg.id}
                                        className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden"
                                      >
                                        {/* Mobile Layout - Stacked */}
                                        <div className="block sm:hidden">
                                          <div className="p-3">
                                            {/* Top Row - Player name and status */}
                                            <div className="flex items-center justify-between mb-2">
                                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <span className="font-bold text-sm text-gray-900 dark:text-white truncate">
                                                  {leg.playerName}
                                                </span>
                                              </div>
                                              <div className="text-right">
                                                <div className="text-lg font-bold text-gray-900 dark:text-white">
                                                  {formatOddsClean(leg.odds)}
                                                </div>
                                              </div>
                                            </div>

                                            {/* Market Info */}
                                            <div className="mb-2">
                                              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                                {leg.line ? `${Math.ceil(leg.line)}+ ` : ""}
                                                {leg.market}
                                              </div>
                                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                                {leg.awayTeam} @ {leg.homeTeam}
                                              </div>
                                            </div>

                                            {/* Hit Rate - Mobile Compact */}
                                            {(() => {
                                              const matchingSelection = currentSelections.find(
                                                (sel) =>
                                                  (sel.player_name || sel.description?.split(" ")?.[0] || "") ===
                                                  leg.playerName,
                                              )
                                              if (!matchingSelection) return null

                                              const hitRateData = getHitRateForSelection(matchingSelection)
                                              if (!hitRateData) return null

                                              return (
                                                <div className="flex items-center gap-2 mb-3">
                                                  <Badge
                                                    variant="outline"
                                                    className={`text-xs font-semibold px-2 py-1 ${
                                                      hitRateData.last_10_hit_rate >= 70
                                                        ? "bg-primary/10 text-primary border-primary/30 dark:bg-primary/20 dark:text-primary/90"
                                                        : hitRateData.last_10_hit_rate >= 50
                                                          ? "bg-amber-50 text-amber-700 border-amber-400 dark:bg-amber-900/20 dark:text-amber-400"
                                                          : "bg-red-50 text-red-700 border-red-400 dark:bg-red-900/20 dark:text-red-400"
                                                    }`}
                                                  >
                                                    L10: {hitRateData.last_10_hit_rate}%
                                                  </Badge>
                                                  <Badge
                                                    variant="outline"
                                                    className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-700 border-blue-400 dark:bg-blue-900/20 dark:text-blue-400"
                                                  >
                                                    Season: {hitRateData.season_hit_rate}%
                                                  </Badge>
                                                </div>
                                              )
                                            })()}

                                            {/* Action Button */}
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handlePlaceBet(sportsbookId, leg.id)}
                                              className={`w-full text-xs font-medium transition-colors ${
                                                leg.hasDeepLink
                                                  ? "bg-blue-500 hover:bg-blue-600 text-white border-blue-400"
                                                  : "border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                                              }`}
                                            >
                                              {leg.hasDeepLink ? (
                                                <>
                                                  <Zap className="h-3 w-3 mr-2" />
                                                  Quick Bet
                                                </>
                                              ) : (
                                                <>
                                                  <ExternalLink className="h-3 w-3 mr-2" />
                                                  Place Bet
                                                </>
                                              )}
                                            </Button>
                                          </div>
                                        </div>

                                        {/* Desktop Layout - Horizontal */}
                                        <div className="hidden sm:block">
                                          <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                                            <div className="flex-1 min-w-0">
                                              {/* Player name and match status */}
                                              <div className="flex items-center gap-3 mb-2">
                                                <span className="font-bold text-lg text-gray-900 dark:text-white truncate">
                                                  {leg.playerName}
                                                </span>
                                              </div>

                                              {/* Hit Rate Information - Enhanced */}
                                              {(() => {
                                                const matchingSelection = currentSelections.find(
                                                  (sel) =>
                                                    (sel.player_name || sel.description?.split(" ")?.[0] || "") ===
                                                    leg.playerName,
                                                )
                                                if (!matchingSelection) return null

                                                const hitRateData = getHitRateForSelection(matchingSelection)
                                                if (!hitRateData) return null

                                                return (
                                                  <div className="flex items-center gap-2 mb-3">
                                                    <div className="flex items-center gap-1">
                                                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                        Hit Rate:
                                                      </span>
                                                      <Badge
                                                        variant="outline"
                                                        className={`text-xs font-semibold px-2 py-1 ${
                                                          hitRateData.last_10_hit_rate >= 70
                                                            ? "bg-primary/10 text-primary border-primary/30 dark:bg-primary/20 dark:text-primary/90"
                                                            : hitRateData.last_10_hit_rate >= 50
                                                              ? "bg-amber-50 text-amber-700 border-amber-400 dark:bg-amber-900/20 dark:text-amber-400"
                                                              : "bg-red-50 text-red-700 border-red-400 dark:bg-red-900/20 dark:text-red-400"
                                                        }`}
                                                      >
                                                        L10: {hitRateData.last_10_hit_rate}%
                                                      </Badge>
                                                      <Badge
                                                        variant="outline"
                                                        className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-700 border-blue-400 dark:bg-blue-900/20 dark:text-blue-400"
                                                      >
                                                        Season: {hitRateData.season_hit_rate}%
                                                      </Badge>
                                                    </div>
                                                  </div>
                                                )
                                              })()}

                                              {/* Market and game info */}
                                              <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {leg.line ? `${Math.ceil(leg.line)}+ ` : ""}
                                                    {leg.market}
                                                  </span>
                                                </div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                                  {leg.awayTeam} @ {leg.homeTeam}
                                                </div>
                                              </div>
                                            </div>

                                            {/* Right side - Odds and action */}
                                            <div className="flex items-center gap-3 ml-4">
                                              <div className="text-right">
                                                <div className="text-xl font-bold text-gray-900 dark:text-white">
                                                  {formatOddsClean(leg.odds)}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">American</div>
                                              </div>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePlaceBet(sportsbookId, leg.id)}
                                                className={`px-3 py-2 text-xs font-medium transition-colors ${
                                                  leg.hasDeepLink
                                                    ? "bg-blue-500 hover:bg-blue-600 text-white border-blue-400"
                                                    : "border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
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
                                      </div>
                                    ))}
                                  </div>

                                  {legOdds.length === 0 && (
                                    <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                                      <Info className="h-6 w-6 mx-auto mb-2 opacity-50" />
                                      <p className="text-sm">No individual leg odds available</p>
                                    </div>
                                  )}
                                </div>
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
                className="text-sm text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {showAllSportsbooks ? (
                  <>
                    Show Less
                    <ChevronDown className="h-4 w-4 ml-2 rotate-180" />
                  </>
                ) : (
                  <>
                    Show {sortedResults.length - adjustedShowCount} More Books
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
