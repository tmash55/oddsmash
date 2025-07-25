"use client"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Target, TrendingUp, BarChart3, Info } from "lucide-react"

interface HitRateDisplayProps {
  hitRateData: any
}

export function HitRateDisplay({ hitRateData }: HitRateDisplayProps) {
  if (!hitRateData) return null

  // Recalculate hit rates for alternate lines if needed
  const recalculatedRates = (() => {
    if (!hitRateData.is_alternate_line || !hitRateData.recent_games || !Array.isArray(hitRateData.recent_games)) {
      // For non-alternate lines or missing data, use original values
      return {
        last_5_hit_rate: hitRateData.last_5_hit_rate || 0,
        last_10_hit_rate: hitRateData.last_10_hit_rate || 0,
        last_20_hit_rate: hitRateData.last_20_hit_rate || 0,
        season_hit_rate: hitRateData.season_hit_rate || 0
      }
    }

    // For alternate lines, recalculate based on the actual line
    const line = hitRateData.line || 0.5
    const recentGames = hitRateData.recent_games

    const calculateHitRateForGames = (games: any[], numGames: number) => {
      const gamesToAnalyze = games.slice(0, Math.min(numGames, games.length))
      if (gamesToAnalyze.length === 0) return 0

      const hits = gamesToAnalyze.filter((game: any) => {
        return hitRateData.bet_type === "under" 
          ? game.value < line 
          : game.value >= line
      }).length

      return Math.round((hits / gamesToAnalyze.length) * 100)
    }

    const recalculated = {
      last_5_hit_rate: calculateHitRateForGames(recentGames, 5),
      last_10_hit_rate: calculateHitRateForGames(recentGames, 10),
      last_20_hit_rate: calculateHitRateForGames(recentGames, 20),
      season_hit_rate: calculateHitRateForGames(recentGames, recentGames.length)
    }

    return recalculated
  })()

  const getHitRateColor = (rate: number) => {
    if (rate >= 70) return "emerald"
    if (rate >= 50) return "amber"
    return "red"
  }

  const getHitRateIcon = (rate: number) => {
    if (rate >= 70) return <Target className="h-3 w-3" />
    if (rate >= 50) return <TrendingUp className="h-3 w-3" />
    return <BarChart3 className="h-3 w-3" />
  }

  return (
    <div className="space-y-3">
      {/* Mobile Layout - Stacked Cards */}
      <div className="block sm:hidden">
        <div className="grid grid-cols-2 gap-2">
          {/* Last 10 Hit Rate - Mobile */}
          <div
            className={`bg-gradient-to-br from-${getHitRateColor(recalculatedRates.last_10_hit_rate)}-50 to-${getHitRateColor(recalculatedRates.last_10_hit_rate)}-100/50 dark:from-${getHitRateColor(recalculatedRates.last_10_hit_rate)}-950/20 dark:to-${getHitRateColor(recalculatedRates.last_10_hit_rate)}-900/30 border border-${getHitRateColor(recalculatedRates.last_10_hit_rate)}-200 dark:border-${getHitRateColor(recalculatedRates.last_10_hit_rate)}-800 rounded-xl p-3 shadow-sm`}
          >
            <div className="flex items-center gap-2 mb-1">
              {getHitRateIcon(recalculatedRates.last_10_hit_rate)}
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">L10</span>
            </div>
            <div
              className={`text-lg font-bold text-${getHitRateColor(recalculatedRates.last_10_hit_rate)}-700 dark:text-${getHitRateColor(recalculatedRates.last_10_hit_rate)}-400`}
            >
              {recalculatedRates.last_10_hit_rate}%
            </div>
          </div>

          {/* Season Hit Rate - Mobile */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100/50 dark:from-blue-950/20 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-3 w-3" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Season</span>
            </div>
            <div className="text-lg font-bold text-blue-700 dark:text-blue-400">{recalculatedRates.season_hit_rate}%</div>
          </div>
        </div>

        {/* Average Stat - Full Width Mobile */}
        <div className="bg-gradient-to-br from-purple-50 to-violet-100/50 dark:from-purple-950/20 dark:to-violet-900/30 border border-purple-200 dark:border-purple-800 rounded-xl p-3 shadow-sm mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Average per Game</span>
            </div>
            <div className="text-xl font-bold text-purple-700 dark:text-purple-400">
              {hitRateData.avg_stat_per_game}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Horizontal Cards */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-3 gap-4">
          {/* Last 10 Hit Rate - Desktop */}
          <div
            className={`bg-gradient-to-br from-${getHitRateColor(recalculatedRates.last_10_hit_rate)}-50 to-${getHitRateColor(recalculatedRates.last_10_hit_rate)}-100/50 dark:from-${getHitRateColor(recalculatedRates.last_10_hit_rate)}-950/20 dark:to-${getHitRateColor(recalculatedRates.last_10_hit_rate)}-900/30 border border-${getHitRateColor(recalculatedRates.last_10_hit_rate)}-200 dark:border-${getHitRateColor(recalculatedRates.last_10_hit_rate)}-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`p-2 bg-${getHitRateColor(recalculatedRates.last_10_hit_rate)}-100 dark:bg-${getHitRateColor(recalculatedRates.last_10_hit_rate)}-900/30 rounded-lg`}
              >
                {getHitRateIcon(recalculatedRates.last_10_hit_rate)}
              </div>
              <div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Last 10 Games</div>
                <div
                  className={`text-2xl font-bold text-${getHitRateColor(recalculatedRates.last_10_hit_rate)}-700 dark:text-${getHitRateColor(recalculatedRates.last_10_hit_rate)}-400`}
                >
                  {recalculatedRates.last_10_hit_rate}%
                </div>
              </div>
            </div>
          </div>

          {/* Season Hit Rate - Desktop */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100/50 dark:from-blue-950/20 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Season</div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {recalculatedRates.season_hit_rate}%
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{hitRateData.season_games_count} games</div>
          </div>

          {/* Average Stat - Desktop */}
          <div className="bg-gradient-to-br from-purple-50 to-violet-100/50 dark:from-purple-950/20 dark:to-violet-900/30 border border-purple-200 dark:border-purple-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Average</div>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                  {hitRateData.avg_stat_per_game}
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">per game</div>
          </div>
        </div>
      </div>

      {/* Enhanced Tooltip - Always Visible */}
      <TooltipProvider>
        <div className="flex items-center justify-center pt-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200 group">
                <Info className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300">
                  View Details
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="max-w-sm p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl"
            >
              <div className="space-y-3">
                {/* Player Header */}
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                  <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-slate-900 dark:text-white">{hitRateData.player_name}</span>
                </div>

                {/* Hit Rate Breakdown */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Hit Rate History
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Last 5:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {recalculatedRates.last_5_hit_rate}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Last 10:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {recalculatedRates.last_10_hit_rate}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Last 20:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {recalculatedRates.last_20_hit_rate}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Season:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {recalculatedRates.season_hit_rate}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bet Details */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Bet Details
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Line:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {hitRateData.line}+ {hitRateData.market}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Team:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {hitRateData.team_abbreviation}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Games:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {hitRateData.season_games_count} this season
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  )
}
