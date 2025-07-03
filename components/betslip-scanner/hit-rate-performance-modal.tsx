"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, Cell, ResponsiveContainer, ReferenceLine, YAxis, XAxis, Tooltip, LabelList } from "recharts"
import { cn } from "@/lib/utils"
import { Calendar, TrendingUp, TrendingDown, Target, Home, Plane, Activity, BarChart3, Info } from "lucide-react"
import type { RecentGame } from "@/types/hit-rates"
import Image from "next/image"
import { getStandardAbbreviation, getTeamLogoFilename, debugTeamMapping } from "@/lib/team-utils"

interface GameDataPoint {
  gameNumber: number
  opponent: string
  isHome: boolean
  value: number
  date: string
  isHit: boolean
  overUnder: string
  margin: string
  venue: string
}

interface HitRatePerformanceModalProps {
  isOpen: boolean
  onClose: () => void
  hitRateData: any
  playerName: string
}

type GameFilter = 'all' | 'L5' | 'L10' | 'L20'

export function HitRatePerformanceModal({ isOpen, onClose, hitRateData, playerName }: HitRatePerformanceModalProps) {
  // Set initial filter based on available data
  const getInitialFilter = (): GameFilter => {
    const totalGames = hitRateData?.recent_games?.length || 0
    if (totalGames >= 10) return 'L10'
    if (totalGames >= 5) return 'L5'
    if (totalGames >= 1) return 'all'
    return 'L10' // Default fallback
  }
  
  const [gameFilter, setGameFilter] = useState<GameFilter>(getInitialFilter())

  if (!hitRateData) return null

  const getHitRateColor = (rate: number) => {
    if (rate >= 70) return "text-emerald-600 dark:text-emerald-400"
    if (rate >= 50) return "text-amber-600 dark:text-amber-400"
    return "text-red-600 dark:text-red-400"
  }

  const getHitRateBgColor = (rate: number) => {
    if (rate >= 70) return "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
    if (rate >= 50) return "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
    return "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
  }

  // Get an appropriate max value for the chart based on market
  const getChartMaxForMarket = (market: string): number => {
    switch (market?.toLowerCase()) {
      case "strikeouts":
        return 12
      case "total bases":
        return 8
      case "rbis":
        return 6
      case "hits":
        return 4
      case "home runs":
        return 2
      default:
        return 4
    }
  }

  // Process recent games data with filtering
  const processRecentGamesData = (filter: GameFilter = 'L10'): GameDataPoint[] => {
    if (!hitRateData?.recent_games || !Array.isArray(hitRateData.recent_games) || hitRateData.recent_games.length === 0) {
      return []
    }

    let gamesToShow = 10 // Default L10
    switch (filter) {
      case 'L5':
        gamesToShow = 5
        break
      case 'L10':
        gamesToShow = 10
        break
      case 'L20':
        gamesToShow = 20
        break
      case 'all':
        gamesToShow = hitRateData.recent_games.length
        break
    }

    // Use whatever games are available, up to the requested amount
    const availableGames = Math.min(gamesToShow, hitRateData.recent_games.length)
    const recentGames = hitRateData.recent_games.slice(0, availableGames)
    const line = hitRateData.line || 0.5

    const processedData = recentGames
      .map((game: RecentGame, index: number) => {
        // Determine if this was a successful bet based on bet type
        const isHit = hitRateData.bet_type === 'under' 
          ? game.value < line  // For under bets, success is when value is below line
          : game.value >= line // For over bets, success is when value is at or above line
          
        const formattedDate = formatGameDate(game.date)

        return {
          gameNumber: recentGames.length - index, // Most recent = highest number
          opponent: game.opponent_abbr,
          isHome: game.is_home,
          value: game.value,
          date: formattedDate,
          isHit,
          // Additional calculated fields - adjust based on bet type
          overUnder: hitRateData.bet_type === 'under' 
            ? (isHit ? `Under ${line}` : `Over ${line}`)
            : (isHit ? `Over ${line}` : `Under ${line}`),
          margin: Math.abs(game.value - line).toFixed(1),
          venue: game.is_home ? "Home" : "Away",
        }
      })
      .reverse() // Show chronological order (oldest to newest)

    return processedData
  }

  // Format date for display
  const formatGameDate = (dateString: string) => {
    try {
      // Parse date as local date to avoid timezone issues
      // Split the date string and create date with local timezone
      const [year, month, day] = dateString.split('-').map(Number)
      const date = new Date(year, month - 1, day) // month is 0-indexed
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    } catch {
      return dateString
    }
  }

  // Calculate performance trends
  const calculateTrends = (gameData: GameDataPoint[]) => {
    if (gameData.length < 3) return { trend: "neutral", recentForm: "N/A", last5HitRate: 0, trendDiff: 0 }

    // Adjust comparison based on available data
    const gamesForComparison = Math.min(5, Math.floor(gameData.length / 2))
    const lastGames = gameData.slice(-gamesForComparison)
    const firstGames = gameData.slice(0, gamesForComparison)

    const lastHitRate = (lastGames.filter((g: GameDataPoint) => g.isHit).length / lastGames.length) * 100
    const firstHitRate = (firstGames.filter((g: GameDataPoint) => g.isHit).length / firstGames.length) * 100

    const trendDiff = lastHitRate - firstHitRate

    let trend = "neutral"
    if (trendDiff > 20) trend = "improving"
    else if (trendDiff < -20) trend = "declining"

    // Show recent form for available games (up to 5)
    const recentFormGames = Math.min(5, gameData.length)
    const recentForm = gameData.slice(-recentFormGames).map((g: GameDataPoint) => (g.isHit ? "W" : "L")).join("")

    return { trend, recentForm, last5HitRate: lastHitRate, trendDiff }
  }

  // Get filter label
  const getFilterLabel = (filter: GameFilter): string => {
    switch (filter) {
      case 'L5': return 'L5'
      case 'L10': return 'L10'
      case 'L20': return 'L20'
      case 'all': return 'All'
      default: return 'L10'
    }
  }

  // Enhanced Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 min-w-[180px]">
          <div className="flex items-center gap-2 mb-2">
            <TeamLogo opponent={data.opponent} size="sm" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                {data.venue === "Home" ? "vs" : "@"} {data.opponent}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{data.date}</p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">Result:</span>
              <span className={`font-bold ${data.isHit ? "text-emerald-600" : "text-red-600"}`}>
                {data.value}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">vs Line:</span>
              <span className={`text-xs font-medium ${data.isHit ? "text-emerald-600" : "text-red-600"}`}>
                {data.isHit ? "+" : "-"}{data.margin}
              </span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  // Team Logo Component
  const TeamLogo = ({
    opponent,
    size = "md",
    showFallback = true,
  }: {
    opponent: string
    size?: "sm" | "md" | "lg"
    showFallback?: boolean
  }) => {
    const sizeClasses = {
      sm: "w-4 h-4",
      md: "w-5 h-5",
      lg: "w-6 h-6",
    }

    const [imageError, setImageError] = React.useState(false)

    // Get the processed team abbreviation for logo lookup
    const standardizedAbbr = getStandardAbbreviation(opponent)
    const logoFilename = getTeamLogoFilename(standardizedAbbr)
    const logoPath = `/images/mlb-teams/${logoFilename}.svg`

    if (imageError && showFallback) {
      return (
        <div
          className={`${sizeClasses[size]} flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded text-xs font-bold text-gray-600 dark:text-gray-300`}
        >
          {standardizedAbbr || opponent.substring(0, 2)}
        </div>
      )
    }

    return (
      <div className={`${sizeClasses[size]} relative flex-shrink-0`}>
        <Image
          src={logoPath}
          alt={`${opponent} logo`}
          width={size === "sm" ? 16 : size === "md" ? 20 : 24}
          height={size === "sm" ? 16 : size === "md" ? 20 : 24}
          className="object-contain w-full h-full"
          onError={() => setImageError(true)}
        />
      </div>
    )
  }

  // Custom X-Axis Tick Component
  const CustomXAxisTick = (props: any) => {
    const { x, y, payload } = props
    const gameData = processRecentGamesData(gameFilter)
    const game = gameData.find((g) => g.opponent === payload.value)

    if (!game) return null

    return (
      <g transform={`translate(${x},${y})`}>
        <foreignObject x={-12} y={0} width={24} height={40}>
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {game.isHome ? "vs" : "@"}
            </span>
            <TeamLogo opponent={game.opponent} size="sm" showFallback={true} />
          </div>
        </foreignObject>
      </g>
    )
  }

  // Custom Label Component
  const CustomLabel = (props: any) => {
    const { x, y, width, value } = props
    return (
      <text
        x={x + width / 2}
        y={y - 5}
        fill="currentColor"
        textAnchor="middle"
        fontSize="10"
        fontWeight="600"
        className="fill-gray-700 dark:fill-gray-200"
      >
        {value}
      </text>
    )
  }

  const gameData = processRecentGamesData(gameFilter)
  
  // Improved data validation - check multiple conditions like hit-rate-table-v3.tsx
  const hasRealData = hitRateData?.recent_games && 
                     Array.isArray(hitRateData.recent_games) && 
                     hitRateData.recent_games.length > 0 &&
                     gameData.length > 0  // Also check that we can actually process the data
  
  const trends = calculateTrends(gameData)

  // Calculate additional stats
  const homeGames = gameData.filter((g: GameDataPoint) => g.isHome)
  const awayGames = gameData.filter((g: GameDataPoint) => !g.isHome)
  const homeHitRate =
    homeGames.length > 0 ? (homeGames.filter((g: GameDataPoint) => g.isHit).length / homeGames.length) * 100 : 0
  const awayHitRate =
    awayGames.length > 0 ? (awayGames.filter((g: GameDataPoint) => g.isHit).length / awayGames.length) * 100 : 0

  // Calculate stats for current filter
  const getCurrentFilterStats = () => {
    switch (gameFilter) {
      case 'L5': return hitRateData.last_5_hit_rate || 0
      case 'L10': return hitRateData.last_10_hit_rate || 0
      case 'L20': return hitRateData.last_20_hit_rate || 0
      default: return hitRateData.last_10_hit_rate || 0
    }
  }

  const currentHitRate = getCurrentFilterStats()
  const hitsInPeriod = gameData.filter((g) => g.isHit).length
  const totalGamesInPeriod = gameData.length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Streamlined Header */}
        <DialogHeader className="pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                {playerName}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">{hitRateData.market}</span>
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {hitRateData.bet_type === 'under' 
                    ? `U ${hitRateData.line}` 
                    : `${hitRateData.line}+`} Line
                </span>
                {hitRateData.team_abbreviation && (
                  <div className="flex items-center gap-1">
                    <TeamLogo opponent={hitRateData.team_abbreviation} size="sm" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{hitRateData.team_abbreviation}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {hitRateData.is_alternate_line && (
                <Badge variant="outline" className="bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                  Alt Line
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Modern Tab-Style Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              {(['L5', 'L10', 'L20'] as GameFilter[])
                .filter((filter) => {
                  const totalGames = hitRateData.recent_games?.length || 0
                  switch (filter) {
                    case 'L5': return totalGames >= 1
                    case 'L10': return totalGames >= 1  
                    case 'L20': return totalGames >= 10
                    default: return true
                  }
                })
                .map((filter) => {
                  const totalGames = hitRateData.recent_games?.length || 0
                  const filterGames = filter === 'L5' ? Math.min(5, totalGames) : 
                                    filter === 'L10' ? Math.min(10, totalGames) : 
                                    Math.min(20, totalGames)
                  
                  return (
                    <Button
                      key={filter}
                      variant={gameFilter === filter ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setGameFilter(filter)}
                      className={cn(
                        "text-sm px-4 py-2 transition-all font-medium",
                        gameFilter === filter
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                      )}
                    >
                      {filter} ({filterGames})
                    </Button>
                  )
                })}
            </div>

            {/* Current Period Stats */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Hit Rate</div>
                <div className={`text-2xl font-bold ${getHitRateColor(currentHitRate)}`}>
                  {currentHitRate}%
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Average</div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {hitRateData.avg_stat_per_game || "N/A"}
                </div>
              </div>
            </div>
          </div>

          {/* Condensed Chart Section */}
          {hasRealData ? (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Recent Performance vs {hitRateData.bet_type === 'under' 
                    ? `U ${hitRateData.line}` 
                    : `${hitRateData.line}+`} line
                </h4>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-emerald-500 rounded"></div>
                    <span className="text-gray-600 dark:text-gray-400">{hitsInPeriod} Hits</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-gray-600 dark:text-gray-400">{totalGamesInPeriod - hitsInPeriod} Misses</span>
                  </div>
                </div>
              </div>

              {/* Condensed Chart */}
              <div className="h-48 w-full bg-white dark:bg-gray-800 rounded-lg p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={gameData}
                    margin={{ top: 15, right: 20, bottom: 40, left: 20 }}
                    barCategoryGap={6}
                  >
                    <YAxis
                      domain={[0, getChartMaxForMarket(hitRateData.market)]}
                      tick={{ fontSize: 11, fill: "#6B7280" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <XAxis
                      dataKey="opponent"
                      axisLine={false}
                      tickLine={false}
                      tick={<CustomXAxisTick />}
                      height={40}
                      interval={0}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine
                      y={hitRateData.line}
                      stroke="#6366F1"
                      strokeWidth={2}
                      strokeDasharray="6 3"
                      strokeOpacity={0.7}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      <LabelList content={<CustomLabel />} />
                      {gameData.map((entry: GameDataPoint, i: number) => (
                        <Cell 
                          key={`cell-${i}`} 
                          fill={entry.isHit ? "#10B981" : "#EF4444"} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No Game Data Available</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Unable to display recent game performance data.
              </p>
            </div>
          )}

          {/* Clean Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Hit Rate Breakdown */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <h5 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Hit Rate Breakdown</h5>
              <div className="space-y-2">
                {[
                  { label: "L5", value: hitRateData.last_5_hit_rate || 0 },
                  { label: "L10", value: hitRateData.last_10_hit_rate || 0 },
                  { label: "L20", value: hitRateData.last_20_hit_rate || 0 },
                ].map((stat, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</span>
                    <span className={`font-semibold ${getHitRateColor(stat.value)}`}>
                      {stat.value}%
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Season</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {hitRateData.season_hit_rate !== null && hitRateData.season_hit_rate !== undefined
                        ? `${hitRateData.season_hit_rate}%`
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Home vs Away */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <h5 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Home vs Away</h5>
              <div className="space-y-3">
                {(() => {
                  const homeGames = gameData.filter((g: GameDataPoint) => g.isHome)
                  const awayGames = gameData.filter((g: GameDataPoint) => !g.isHome)
                  const homeHitRate = homeGames.length > 0 ? (homeGames.filter((g: GameDataPoint) => g.isHit).length / homeGames.length) * 100 : 0
                  const awayHitRate = awayGames.length > 0 ? (awayGames.filter((g: GameDataPoint) => g.isHit).length / awayGames.length) * 100 : 0

                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Home</span>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${getHitRateColor(homeHitRate)}`}>
                            {homeHitRate.toFixed(0)}%
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {homeGames.filter((g: GameDataPoint) => g.isHit).length}/{homeGames.length}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Plane className="h-4 w-4 text-orange-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Away</span>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${getHitRateColor(awayHitRate)}`}>
                            {awayHitRate.toFixed(0)}%
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {awayGames.filter((g: GameDataPoint) => g.isHit).length}/{awayGames.length}
                          </div>
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <h5 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Performance</h5>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Target Line</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {hitRateData.bet_type === 'under' 
                      ? `U ${hitRateData.line}` 
                      : `${hitRateData.line}+`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Avg/Game</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    {hitRateData.avg_stat_per_game || "N/A"}
                  </span>
                </div>
                {hasRealData && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Best Game</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {Math.max(...gameData.map(g => g.value))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Worst Game</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        {Math.min(...gameData.map(g => g.value))}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Recent Form - FIXED to show all games in filter */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <h5 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Recent Games ({getFilterLabel(gameFilter)})</h5>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {hasRealData ? (
                  gameData
                    .slice()
                    .reverse()
                    .map((game: GameDataPoint, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <TeamLogo opponent={game.opponent} size="sm" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {game.isHome ? "vs" : "@"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">{game.value}</span>
                          <div className={`w-2 h-2 rounded-full ${game.isHit ? "bg-emerald-500" : "bg-red-500"}`}></div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">No recent games</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info Footer */}
          {hitRateData.is_alternate_line && (
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-orange-900 dark:text-orange-200">Alternate Line Analysis</p>
                  <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                    Hit rates recalculated for {hitRateData.bet_type === 'under' 
                      ? `U ${hitRateData.line}` 
                      : `${hitRateData.line}+`} line based on historical performance data.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}



