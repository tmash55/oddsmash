"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, BarChart3, TrendingUp, ExternalLink, AlertTriangle, Target } from "lucide-react"
import { OddsComparisonDropdown } from "./odds-comparison-dropdown"
import { HitRatePerformanceModal } from "./hit-rate-performance-modal"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface SelectionCardProps {
  selection: any
  index: number
  bestSportsbook: string | null
  isExpanded: boolean
  sortedOdds: any[]
  hasMultipleBooks: boolean
  hasAnyOdds: boolean
  hitRateData: any
  formatOddsClean: (odds: number | string) => string
  getMarketLabel: (marketKey: string, sport?: string) => string
  getSportsbookInfo: (sportsbookId: string) => any
  toggleSelectionDropdown: (selectionId: string) => void
  handlePlaceBet: (sportsbookId: string, selectionId?: string) => void
}

export function SelectionCard({
  selection,
  index,
  bestSportsbook,
  isExpanded,
  sortedOdds,
  hasMultipleBooks,
  hasAnyOdds,
  hitRateData,
  formatOddsClean,
  getMarketLabel,
  getSportsbookInfo,
  toggleSelectionDropdown,
  handlePlaceBet,
}: SelectionCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const bestSportsbookOdds = bestSportsbook && selection.current_odds?.bookmakers?.[bestSportsbook]

  // Improved odds display logic - avoid showing raw text like "CASH OUT"
  const getDisplayOdds = () => {
    if (bestSportsbookOdds?.price) {
      return bestSportsbookOdds.price
    }

    // If original odds is a number or properly formatted odds, use it
    if (typeof selection.original_odds === "number") {
      return selection.original_odds
    }

    // If original odds is a string that looks like odds (+/-), use it
    if (typeof selection.original_odds === "string" && /^[+-]\d+$/.test(selection.original_odds)) {
      return selection.original_odds
    }

    // Otherwise, show that odds aren't available
    return "N/A"
  }

  const displayOdds = getDisplayOdds()

  const getHitRateColor = (rate: number) => {
    if (rate >= 70) return "text-emerald-600 dark:text-emerald-400"
    if (rate >= 50) return "text-amber-600 dark:text-amber-400"
    return "text-red-600 dark:text-red-400"
  }

  const getHitRateBg = (rate: number) => {
    if (rate >= 70) return "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
    if (rate >= 50) return "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
    return "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
  }

  // Helper function to get display hit rate - no need to flip since data is already processed
  const getDisplayHitRate = (hitRate: number, betType: string) => {
    // Hit rate data is already processed for bet type in getHitRateForSelection
    // No need to flip again here
    return hitRate
  }

  // Helper function to get display season hit rate - no need to flip since data is already processed
  const getDisplaySeasonHitRate = (seasonHitRate: number | null, betType: string) => {
    // Hit rate data is already processed for bet type in getHitRateForSelection
    // No need to flip again here
    return seasonHitRate
  }

  // Recalculate hit rates for alternate lines if needed
  const recalculatedHitRates = (() => {
    if (!hitRateData || !hitRateData.is_alternate_line || !hitRateData.recent_games || !Array.isArray(hitRateData.recent_games)) {
      // For non-alternate lines or missing data, use original values
      return hitRateData || {}
    }

    // For alternate lines, recalculate based on the actual line
    const line = selection.line || hitRateData.line || 0.5
    const recentGames = hitRateData.recent_games

    const calculateHitRateForGames = (games: any[], numGames: number) => {
      const gamesToAnalyze = games.slice(0, Math.min(numGames, games.length))
      if (gamesToAnalyze.length === 0) return 0

      const hits = gamesToAnalyze.filter((game: any) => {
        return selection.bet_type === "under" 
          ? game.value < line 
          : game.value >= line
      }).length

      return Math.round((hits / gamesToAnalyze.length) * 100)
    }

    const recalculated = {
      ...hitRateData,
      last_5_hit_rate: calculateHitRateForGames(recentGames, 5),
      last_10_hit_rate: calculateHitRateForGames(recentGames, 10),
      last_20_hit_rate: calculateHitRateForGames(recentGames, 20),
      season_hit_rate: calculateHitRateForGames(recentGames, recentGames.length)
    }

    return recalculated
  })()

  // Ensure we have a valid bet type
  const effectiveBetType = selection.bet_type || "over"

  return (
    <>
      <TooltipProvider>
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          {/* Main Content - Enhanced Mobile Layout */}
          <div className="p-4 sm:p-5 lg:p-6">
            {/* Mobile Layout - Improved Hierarchy */}
            <div className="block lg:hidden">
              {/* Player Header - More Prominent */}
              <div className="mb-4">
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="h-10 w-10 border-2 border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <AvatarImage
                      src={`https://img.mlbstatic.com/mlb-photos/image/upload/w_240,q_auto:good,f_auto/v1/people/${selection.player_id}/headshot/67/current`}
                      alt={selection.player_name}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {selection.player_name?.split(" ").map((n: string) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight mb-1">
                      {selection.player_name || "Unknown Player"}
                    </h3>
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {selection.line !== null && selection.line !== undefined
                        ? selection.market === "Spread"
                          ? `${selection.line > 0 ? "+" : ""}${selection.line} `
                          : selection.bet_type === "under"
                            ? `Under ${selection.line} `
                            : `${Math.ceil(selection.line)}+ `
                        : ""}
                      {getMarketLabel(selection.market)}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {selection.away_team} @ {selection.home_team}
                    </div>
                  </div>
                </div>

                {/* Odds Section - More Prominent */}
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-600/50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                        {formatOddsClean(displayOdds)}
                      </div>
                      {bestSportsbookOdds && bestSportsbook && (
                        <div className="flex items-center gap-2">
                          <img
                            src={getSportsbookInfo(bestSportsbook).logo || "/placeholder.svg"}
                            alt={getSportsbookInfo(bestSportsbook).name}
                            className="h-5 w-5 object-contain rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = "none"
                            }}
                          />
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            {getSportsbookInfo(bestSportsbook).name}
                          </span>
                        </div>
                      )}
                    </div>

                    {hasAnyOdds && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSelectionDropdown(selection.id)}
                        className="h-10 w-10 p-0 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 shrink-0"
                      >
                        <ChevronDown
                          className={`h-5 w-5 text-slate-500 transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Hit Rate Section - Enhanced Mobile */}
              {hitRateData && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-xl border ${getHitRateBg(recalculatedHitRates.last_10_hit_rate || 0)}`}>
                      <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Last 10 Games</div>
                      <div className={`text-lg font-bold ${getHitRateColor(recalculatedHitRates.last_10_hit_rate || 0)}`}>
                        {recalculatedHitRates.last_10_hit_rate?.toFixed(0) || 0}%
                      </div>
                    </div>

                    {recalculatedHitRates.avg_stat_per_game && (
                      <div className="p-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20">
                        <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Season Average
                        </div>
                        <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                          {recalculatedHitRates.avg_stat_per_game}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsModalOpen(true)}
                    className="w-full h-11 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 dark:from-blue-950/20 dark:to-indigo-950/20 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-semibold"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Performance Details
                  </Button>
                </div>
              )}
            </div>

            {/* Desktop Layout - Enhanced */}
            <div className="hidden lg:block">
              {/* Header Row - Improved */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <Avatar className="h-12 w-12 border-2 border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <AvatarImage
                      src={`https://img.mlbstatic.com/mlb-photos/image/upload/w_240,q_auto:good,f_auto/v1/people/${selection.player_id}/headshot/67/current`}
                      alt={selection.player_name}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {selection.player_name?.split(" ").map((n: string) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                      {selection.player_name || "Unknown Player"}
                    </h3>
                    <div className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {selection.line !== null && selection.line !== undefined
                        ? selection.market === "Spread"
                          ? `${selection.line > 0 ? "+" : ""}${selection.line} `
                          : selection.bet_type === "under"
                            ? `Under ${selection.line} `
                            : `${Math.ceil(selection.line)}+ `
                        : ""}
                      {getMarketLabel(selection.market)}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                      {selection.away_team} @ {selection.home_team}
                    </div>
                  </div>
                </div>

                {/* Odds & Action - Enhanced */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                      {formatOddsClean(displayOdds)}
                    </div>

                    {/* Show warning when odds aren't available */}
                    {displayOdds === "N/A" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-end gap-1">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">No live odds</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs max-w-48">
                            Live odds not available for this line. This may be an alternate line not offered by
                            sportsbooks.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {bestSportsbookOdds && bestSportsbook && (
                      <div className="flex items-center gap-2 justify-end">
                        <img
                          src={getSportsbookInfo(bestSportsbook).logo || "/placeholder.svg"}
                          alt={getSportsbookInfo(bestSportsbook).name}
                          className="h-6 w-6 object-contain rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                          }}
                        />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          {getSportsbookInfo(bestSportsbook).name}
                        </span>
                      </div>
                    )}
                  </div>

                  {hasAnyOdds && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSelectionDropdown(selection.id)}
                      className="h-12 w-12 p-0 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <ChevronDown
                        className={`h-5 w-5 text-slate-500 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </Button>
                  )}
                </div>
              </div>

              {/* Enhanced Hit Rate Section - Desktop */}
              {hitRateData ? (
                <div className="space-y-4">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className={`p-4 rounded-xl border ${getHitRateBg(recalculatedHitRates.last_10_hit_rate || 0)}`}>
                      <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Last 10 Games</div>
                      <div className={`text-2xl font-bold ${getHitRateColor(recalculatedHitRates.last_10_hit_rate || 0)}`}>
                        {recalculatedHitRates.last_10_hit_rate?.toFixed(0) || 0}%
                      </div>
                    </div>

                    {recalculatedHitRates.avg_stat_per_game && (
                      <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20">
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Season Average
                        </div>
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {recalculatedHitRates.avg_stat_per_game}
                        </div>
                      </div>
                    )}

                    {hasMultipleBooks && (
                      <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Available Books
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{sortedOdds.length}</div>
                          <BarChart3 className="h-5 w-5 text-blue-500" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Row */}
                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsModalOpen(true)}
                      className="flex items-center gap-2 h-10 px-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 dark:from-blue-950/20 dark:to-indigo-950/20 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-semibold transition-all duration-200 hover:shadow-sm"
                    >
                      <TrendingUp className="h-4 w-4" />
                      Performance Analysis
                    </Button>

                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 group font-medium"
                    >
                      <span>View Detailed Stats</span>
                      <ExternalLink className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-sm border-t border-slate-200 dark:border-slate-700 mt-4">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No performance data available
                </div>
              )}
            </div>
          </div>

          {/* Odds Comparison Dropdown */}
          <OddsComparisonDropdown
            isExpanded={isExpanded}
            hasAnyOdds={hasAnyOdds}
            hasMultipleBooks={hasMultipleBooks}
            sortedOdds={sortedOdds}
            formatOddsClean={formatOddsClean}
            handlePlaceBet={handlePlaceBet}
            selectionId={selection.id}
          />
        </div>
      </TooltipProvider>

      {/* Hit Rate Performance Modal */}
      <HitRatePerformanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        hitRateData={{
          ...recalculatedHitRates,
          bet_type: effectiveBetType,
          line: selection.line || recalculatedHitRates?.line,
        }}
        playerName={selection.player_name || "Unknown Player"}
      />
    </>
  )
}
