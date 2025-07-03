"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, BarChart3, TrendingUp, ExternalLink, AlertTriangle } from "lucide-react"
import { OddsComparisonDropdown } from "./odds-comparison-dropdown"
import { HitRatePerformanceModal } from "./hit-rate-performance-modal"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
    if (typeof selection.original_odds === 'number') {
      return selection.original_odds
    }
    
    // If original odds is a string that looks like odds (+/-), use it
    if (typeof selection.original_odds === 'string' && /^[+-]\d+$/.test(selection.original_odds)) {
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

  // Ensure we have a valid bet type
  const effectiveBetType = selection.bet_type || 'over'
  
  console.log('SelectionCard render:', {
    playerName: selection.player_name,
    betType: selection.bet_type,
    effectiveBetType,
    line: selection.line,
    hitRateData: hitRateData ? { last_10_hit_rate: hitRateData.last_10_hit_rate } : null
  })

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
        {/* Main Content - Mobile Optimized */}
        <div className="p-3 sm:p-4">
          {/* Mobile Layout - Condensed */}
          <div className="block sm:hidden">
            {/* Header Row - Compact */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate mb-1">
                  {selection.player_name || "Unknown Player"}
                </h3>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {selection.line !== null && selection.line !== undefined ? (
                    selection.market === 'Spread' ? (
                      `${selection.line > 0 ? '+' : ''}${selection.line} `
                    ) : selection.bet_type === 'under' ? (
                      `Under ${selection.line} ` 
                    ) : (
                      `${Math.ceil(selection.line)}+ `
                    )
                  ) : ""}
                  {getMarketLabel(selection.market)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {selection.away_team} @ {selection.home_team}
                </div>
              </div>

              {/* Odds & Sportsbook - Mobile */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatOddsClean(displayOdds)}
                  </div>
                  {bestSportsbookOdds && bestSportsbook && (
                    <div className="flex items-center gap-1 justify-end">
                      <img
                        src={getSportsbookInfo(bestSportsbook).logo || "/placeholder.svg"}
                        alt={getSportsbookInfo(bestSportsbook).name}
                        className="h-4 w-4 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                        }}
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
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
                    className="h-6 w-6 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <ChevronDown
                      className={`h-3 w-3 text-gray-400 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </Button>
                )}
              </div>
            </div>

            {/* Hit Rate Row - Mobile */}
            {hitRateData && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="text-xs">
                    <span className="text-gray-500 dark:text-gray-400">L10: </span>
                    <span className={`font-semibold ${getHitRateColor(hitRateData.last_10_hit_rate || 0)}`}>
                      {hitRateData.last_10_hit_rate?.toFixed(0) || 0}%
                    </span>
                  </div>
                  {hitRateData.avg_stat_per_game && (
                    <div className="text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Avg: </span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {hitRateData.avg_stat_per_game}
                      </span>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                  className="h-6 px-2 text-xs"
                >
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Stats
                </Button>
              </div>
            )}
          </div>

          {/* Desktop Layout - Original */}
          <div className="hidden sm:block">
            {/* Header Row */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
                    {selection.player_name || "Unknown Player"}
                  </h3>
                </div>

                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {selection.line !== null && selection.line !== undefined ? (
                    selection.market === 'Spread' ? (
                      // For spreads, show the actual spread value with +/- sign
                      `${selection.line > 0 ? '+' : ''}${selection.line} `
                    ) : selection.bet_type === 'under' ? (
                      `Under ${selection.line} ` 
                    ) : (
                      `${Math.ceil(selection.line)}+ `
                    )
                  ) : ""}
                  {getMarketLabel(selection.market)}
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {selection.away_team} @ {selection.home_team}
                </div>
              </div>

              {/* Odds & Action */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatOddsClean(displayOdds)}</div>
                  
                  {/* Show warning when odds aren't available */}
                  {displayOdds === "N/A" && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          Live odds not available for this line.
                          <br />
                          This may be an alternate line not offered by sportsbooks.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  
                  {bestSportsbookOdds && bestSportsbook && (
                    <img
                      src={getSportsbookInfo(bestSportsbook).logo || "/placeholder.svg"}
                      alt={getSportsbookInfo(bestSportsbook).name}
                      className="h-6 w-6 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement
                        if (fallback) fallback.style.display = "inline"
                      }}
                    />
                  )}
                  <span 
                    className="text-xs text-gray-500 dark:text-gray-400 font-medium" 
                    style={{ display: "none" }}
                  >
                    {bestSportsbookOdds && bestSportsbook && getSportsbookInfo(bestSportsbook).name}
                  </span>
                </div>

                {hasAnyOdds && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSelectionDropdown(selection.id)}
                    className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <ChevronDown
                      className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </Button>
                )}
              </div>
            </div>

            {/* Enhanced Hit Rate Section */}
            {hitRateData ? (
              <div className="space-y-3">
                {/* Compact Stats Row */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">L10:</span>
                      <span className={`text-sm font-bold ${getHitRateColor(getDisplayHitRate(hitRateData.last_10_hit_rate, effectiveBetType))}`}>
                        {getDisplayHitRate(hitRateData.last_10_hit_rate, effectiveBetType)}%
                      </span>
                    </div>
                    <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Avg:</span>
                      <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                        {hitRateData.avg_stat_per_game}
                      </span>
                    </div>
                  </div>

                  {/* Books Badge */}
                  {hasMultipleBooks && (
                    <div className="flex items-center gap-1 ml-auto">
                      <BarChart3 className="h-3 w-3 text-blue-500" />
                      <Badge
                        variant="outline"
                        className="text-xs bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 h-5"
                      >
                        {sortedOdds.length}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Enhanced Action Row */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
                  {/* More Prominent Performance Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 h-8 px-3 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 dark:from-blue-950/20 dark:to-indigo-950/20 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-medium transition-all duration-200 hover:shadow-sm"
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span className="text-xs">Performance</span>
                  </Button>

                  {/* Hit Rate Details Link */}
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 group"
                  >
                    <span>View Hit Rate Details</span>
                    <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 transition-transform duration-200" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-3 text-gray-400 dark:text-gray-500 text-xs border-t border-gray-100 dark:border-gray-800 mt-3">
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

      {/* Hit Rate Performance Modal */}
      <HitRatePerformanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        hitRateData={{
          ...hitRateData,
          bet_type: effectiveBetType,
          line: selection.line || hitRateData?.line,
        }}
        playerName={selection.player_name || "Unknown Player"}
      />
    </>
  )
}
