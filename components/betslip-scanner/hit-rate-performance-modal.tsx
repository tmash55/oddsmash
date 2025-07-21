"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, Cell, ResponsiveContainer, ReferenceLine, YAxis, XAxis, Tooltip, LabelList } from "recharts"
import { cn } from "@/lib/utils"
import { Calendar, Target, Home, Plane, Activity, BarChart3, Info, User, Trophy } from "lucide-react"
import type { RecentGame } from "@/types/hit-rates"
import Image from "next/image"
import { getStandardAbbreviation, getTeamLogoFilename } from "@/lib/team-utils"

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

type GameFilter = "all" | "L5" | "L10" | "L20"

export function HitRatePerformanceModal({ isOpen, onClose, hitRateData, playerName }: HitRatePerformanceModalProps) {
  // Set initial filter based on available data
  const getInitialFilter = (): GameFilter => {
    const totalGames = hitRateData?.recent_games?.length || 0
    if (totalGames >= 10) return "L10"
    if (totalGames >= 5) return "L5"
    if (totalGames >= 1) return "all"
    return "L10" // Default fallback
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
  const processRecentGamesData = (filter: GameFilter = "L10"): GameDataPoint[] => {
    if (
      !hitRateData?.recent_games ||
      !Array.isArray(hitRateData.recent_games) ||
      hitRateData.recent_games.length === 0
    ) {
      return []
    }

    let gamesToShow = 10 // Default L10
    switch (filter) {
      case "L5":
        gamesToShow = 5
        break
      case "L10":
        gamesToShow = 10
        break
      case "L20":
        gamesToShow = 20
        break
      case "all":
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
        const isHit =
          hitRateData.bet_type === "under"
            ? game.value < line // For under bets, success is when value is below line
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
          overUnder:
            hitRateData.bet_type === "under"
              ? isHit
                ? `Under ${line}`
                : `Over ${line}`
              : isHit
                ? `Over ${line}`
                : `Under ${line}`,
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
      const [year, month, day] = dateString.split("-").map(Number)
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
    const recentForm = gameData
      .slice(-recentFormGames)
      .map((g: GameDataPoint) => (g.isHit ? "W" : "L"))
      .join("")

    return { trend, recentForm, last5HitRate: lastHitRate, trendDiff }
  }

  // Get filter label
  const getFilterLabel = (filter: GameFilter): string => {
    switch (filter) {
      case "L5":
        return "L5"
      case "L10":
        return "L10"
      case "L20":
        return "L20"
      case "all":
        return "All"
      default:
        return "L10"
    }
  }

  // Enhanced Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-4 min-w-[200px]">
          <div className="flex items-center gap-3 mb-3">
            <TeamLogo opponent={data.opponent} size="md" />
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {data.venue === "Home" ? "vs" : "@"} {data.opponent}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{data.date}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600 dark:text-slate-400">Result:</span>
              <span className={`font-bold text-lg ${data.isHit ? "text-emerald-600" : "text-red-600"}`}>
                {data.value}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600 dark:text-slate-400">vs Line:</span>
              <span className={`text-sm font-semibold ${data.isHit ? "text-emerald-600" : "text-red-600"}`}>
                {data.isHit ? "+" : "-"}
                {data.margin}
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
      md: "w-6 h-6",
      lg: "w-8 h-8",
    }

    const [imageError, setImageError] = React.useState(false)

    // Get the processed team abbreviation for logo lookup
    const standardizedAbbr = getStandardAbbreviation(opponent)
    const logoFilename = getTeamLogoFilename(standardizedAbbr)
    const logoPath = `/images/mlb-teams/${logoFilename}.svg`

    if (imageError && showFallback) {
      return (
        <div
          className={`${sizeClasses[size]} flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300`}
        >
          {standardizedAbbr || opponent.substring(0, 2)}
        </div>
      )
    }

    return (
      <div className={`${sizeClasses[size]} relative flex-shrink-0`}>
        <Image
          src={logoPath || "/placeholder.svg"}
          alt={`${opponent} logo`}
          width={size === "sm" ? 16 : size === "md" ? 24 : 32}
          height={size === "sm" ? 16 : size === "md" ? 24 : 32}
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
        <foreignObject x={-15} y={0} width={30} height={50}>
          <div className="flex flex-col items-center">
            <span className="text-xs text-slate-500 dark:text-slate-400 mb-1">{game.isHome ? "vs" : "@"}</span>
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
        y={y - 8}
        fill="currentColor"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        className="fill-slate-700 dark:fill-slate-200"
      >
        {value}
      </text>
    )
  }

  const gameData = processRecentGamesData(gameFilter)

  // Improved data validation - check multiple conditions like hit-rate-table-v3.tsx
  const hasRealData =
    hitRateData?.recent_games &&
    Array.isArray(hitRateData.recent_games) &&
    hitRateData.recent_games.length > 0 &&
    gameData.length > 0 // Also check that we can actually process the data

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
    // If this is an alternate line, recalculate the stats based on the actual line
    if (hitRateData.is_alternate_line && gameData.length > 0) {
      const hitsInCurrentFilter = gameData.filter((g) => g.isHit).length
      const totalGamesInCurrentFilter = gameData.length
      return totalGamesInCurrentFilter > 0 ? Math.round((hitsInCurrentFilter / totalGamesInCurrentFilter) * 100) : 0
    }

    // For non-alternate lines, use the original database values
    switch (gameFilter) {
      case "L5":
        return hitRateData.last_5_hit_rate || 0
      case "L10":
        return hitRateData.last_10_hit_rate || 0
      case "L20":
        return hitRateData.last_20_hit_rate || 0
      default:
        return hitRateData.last_10_hit_rate || 0
    }
  }

  const currentHitRate = getCurrentFilterStats()
  const hitsInPeriod = gameData.filter((g) => g.isHit).length
  const totalGamesInPeriod = gameData.length

  // Get hit rate breakdown with proper recalculation for alternate lines
  const getHitRateBreakdown = () => {
    if (!hitRateData.is_alternate_line || !hasRealData) {
      // For non-alternate lines, use original database values
      return [
        { label: "L5", value: hitRateData.last_5_hit_rate || 0 },
        { label: "L10", value: hitRateData.last_10_hit_rate || 0 },
        { label: "L20", value: hitRateData.last_20_hit_rate || 0 },
      ]
    }

    // For alternate lines, recalculate each period
    const line = hitRateData.line || 0.5
    const recentGames = hitRateData.recent_games || []

    const calculateHitRateForPeriod = (numGames: number) => {
      const gamesToAnalyze = recentGames.slice(0, Math.min(numGames, recentGames.length))
      if (gamesToAnalyze.length === 0) return 0

      const hits = gamesToAnalyze.filter((game: any) => {
        return hitRateData.bet_type === "under" 
          ? game.value < line 
          : game.value >= line
      }).length

      return Math.round((hits / gamesToAnalyze.length) * 100)
    }

    return [
      { label: "L5", value: calculateHitRateForPeriod(5) },
      { label: "L10", value: calculateHitRateForPeriod(10) },
      { label: "L20", value: calculateHitRateForPeriod(20) },
    ]
  }

  const hitRateBreakdown = getHitRateBreakdown()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200 dark:border-slate-700">
        {/* Modern Header */}
        <DialogHeader className="pb-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  {playerName}
                </DialogTitle>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">{hitRateData.market}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                  >
                    {hitRateData.bet_type === "under" ? `U ${hitRateData.line}` : `${hitRateData.line}+`} Line
                  </Badge>
                  {hitRateData.team_abbreviation && (
                    <div className="flex items-center gap-2">
                      <TeamLogo opponent={hitRateData.team_abbreviation} size="sm" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {hitRateData.team_abbreviation}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {hitRateData.is_alternate_line && (
                <Badge
                  variant="outline"
                  className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                >
                  Alt Line
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-8 pt-4">
          {/* Modern Filter Tabs & Stats */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              {(["L5", "L10", "L20"] as GameFilter[])
                .filter((filter) => {
                  const totalGames = hitRateData.recent_games?.length || 0
                  switch (filter) {
                    case "L5":
                      return totalGames >= 1
                    case "L10":
                      return totalGames >= 1
                    case "L20":
                      return totalGames >= 10
                    default:
                      return true
                  }
                })
                .map((filter) => {
                  const totalGames = hitRateData.recent_games?.length || 0
                  const filterGames =
                    filter === "L5"
                      ? Math.min(5, totalGames)
                      : filter === "L10"
                        ? Math.min(10, totalGames)
                        : Math.min(20, totalGames)

                  return (
                    <Button
                      key={filter}
                      variant={gameFilter === filter ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setGameFilter(filter)}
                      className={cn(
                        "text-sm px-6 py-3 transition-all font-semibold rounded-xl",
                        gameFilter === filter
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700",
                      )}
                    >
                      {filter} ({filterGames})
                    </Button>
                  )
                })}
            </div>

            {/* Key Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
                <div className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide font-semibold mb-1">
                  Hit Rate
                </div>
                <div className={`text-2xl font-black ${getHitRateColor(currentHitRate)}`}>{currentHitRate}%</div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  {hitsInPeriod}/{totalGamesInPeriod} games
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-2xl p-4">
                <div className="text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wide font-semibold mb-1">
                  Average
                </div>
                <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                  {hitRateData.avg_stat_per_game || "N/A"}
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">per game</div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 col-span-2 lg:col-span-1">
                <div className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide font-semibold mb-1">
                  Season
                </div>
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {(() => {
                    if (hitRateData.is_alternate_line && hasRealData) {
                      // For alternate lines, recalculate season rate
                      const line = hitRateData.line || 0.5
                      const recentGames = hitRateData.recent_games || []
                      const hits = recentGames.filter((game: any) => {
                        return hitRateData.bet_type === "under" 
                          ? game.value < line 
                          : game.value >= line
                      }).length
                      const seasonRate = recentGames.length > 0 ? Math.round((hits / recentGames.length) * 100) : 0
                      return `${seasonRate}%`
                    } else {
                      // For non-alternate lines, use original database value
                      return hitRateData.season_hit_rate !== null && hitRateData.season_hit_rate !== undefined
                        ? `${hitRateData.season_hit_rate}%`
                        : "N/A"
                    }
                  })()}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {hitRateData.season_games_count || 0} games
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Chart Section */}
          {hasRealData ? (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    Recent Performance vs{" "}
                    {hitRateData.bet_type === "under" ? `U ${hitRateData.line}` : `${hitRateData.line}+`} line
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Showing {getFilterLabel(gameFilter)} performance with {totalGamesInPeriod} games
                  </p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-500 rounded-lg shadow-sm"></div>
                    <span className="text-slate-600 dark:text-slate-400 font-medium">{hitsInPeriod} Hits</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded-lg shadow-sm"></div>
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      {totalGamesInPeriod - hitsInPeriod} Misses
                    </span>
                  </div>
                </div>
              </div>

              {/* Enhanced Chart */}
              <div className="h-64 w-full bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-inner">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gameData} margin={{ top: 20, right: 30, bottom: 50, left: 20 }} barCategoryGap={8}>
                    <YAxis
                      domain={[0, getChartMaxForMarket(hitRateData.market)]}
                      tick={{ fontSize: 12, fill: "#64748B" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <XAxis
                      dataKey="opponent"
                      axisLine={false}
                      tickLine={false}
                      tick={<CustomXAxisTick />}
                      height={50}
                      interval={0}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine
                      y={hitRateData.line}
                      stroke="#6366F1"
                      strokeWidth={3}
                      strokeDasharray="8 4"
                      strokeOpacity={0.8}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      <LabelList content={<CustomLabel />} />
                      {gameData.map((entry: GameDataPoint, i: number) => (
                        <Cell key={`cell-${i}`} fill={entry.isHit ? "#10B981" : "#EF4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-12 text-center shadow-lg">
              <BarChart3 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">No Game Data Available</h3>
              <p className="text-slate-500 dark:text-slate-400">
                Unable to display recent game performance data for this player.
              </p>
            </div>
          )}

          {/* Enhanced Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* Hit Rate Breakdown */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-emerald-500" />
                <h5 className="font-bold text-slate-900 dark:text-white">Hit Rate Breakdown</h5>
              </div>
              <div className="space-y-3">
                {hitRateBreakdown.map((stat, index) => (
                  <div key={index} className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{stat.label}</span>
                    <span className={`font-bold text-lg ${getHitRateColor(stat.value)}`}>{stat.value}%</span>
                  </div>
                ))}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Season</span>
                    <span className="font-bold text-lg text-slate-900 dark:text-white">
                      {(() => {
                        if (hitRateData.is_alternate_line && hasRealData) {
                          // For alternate lines, recalculate season rate
                          const line = hitRateData.line || 0.5
                          const recentGames = hitRateData.recent_games || []
                          const hits = recentGames.filter((game: any) => {
                            return hitRateData.bet_type === "under" 
                              ? game.value < line 
                              : game.value >= line
                          }).length
                          const seasonRate = recentGames.length > 0 ? Math.round((hits / recentGames.length) * 100) : 0
                          return `${seasonRate}%`
                        } else {
                          // For non-alternate lines, use original database value
                          return hitRateData.season_hit_rate !== null && hitRateData.season_hit_rate !== undefined
                            ? `${hitRateData.season_hit_rate}%`
                            : "N/A"
                        }
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Home vs Away */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Home className="h-5 w-5 text-blue-500" />
                <h5 className="font-bold text-slate-900 dark:text-white">Home vs Away</h5>
              </div>
              <div className="space-y-4">
                {(() => {
                  const homeGames = gameData.filter((g: GameDataPoint) => g.isHome)
                  const awayGames = gameData.filter((g: GameDataPoint) => !g.isHome)
                  const homeHitRate =
                    homeGames.length > 0
                      ? (homeGames.filter((g: GameDataPoint) => g.isHit).length / homeGames.length) * 100
                      : 0
                  const awayHitRate =
                    awayGames.length > 0
                      ? (awayGames.filter((g: GameDataPoint) => g.isHit).length / awayGames.length) * 100
                      : 0

                  return (
                    <>
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                            <Home className="h-4 w-4 text-blue-500" />
                          </div>
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Home</span>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold text-lg ${getHitRateColor(homeHitRate)}`}>
                            {homeHitRate.toFixed(0)}%
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {homeGames.filter((g: GameDataPoint) => g.isHit).length}/{homeGames.length}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                            <Plane className="h-4 w-4 text-orange-500" />
                          </div>
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Away</span>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold text-lg ${getHitRateColor(awayHitRate)}`}>
                            {awayHitRate.toFixed(0)}%
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
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
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-purple-500" />
                <h5 className="font-bold text-slate-900 dark:text-white">Performance</h5>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Target Line</span>
                  <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                    {hitRateData.bet_type === "under" ? `U ${hitRateData.line}` : `${hitRateData.line}+`}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg/Game</span>
                  <span className="font-bold text-lg text-purple-600 dark:text-purple-400">
                    {hitRateData.avg_stat_per_game || "N/A"}
                  </span>
                </div>
                {hasRealData && (
                  <>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Best Game</span>
                      <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                        {Math.max(...gameData.map((g) => g.value))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Worst Game</span>
                      <span className="font-bold text-lg text-red-600 dark:text-red-400">
                        {Math.min(...gameData.map((g) => g.value))}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Recent Games */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-indigo-500" />
                <h5 className="font-bold text-slate-900 dark:text-white">
                  Recent Games ({getFilterLabel(gameFilter)})
                </h5>
              </div>
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {hasRealData ? (
                  gameData
                    .slice()
                    .reverse()
                    .map((game: GameDataPoint, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-slate-800 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <TeamLogo opponent={game.opponent} size="sm" />
                          <div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              {game.isHome ? "vs" : "@"} {game.opponent}
                            </span>
                            <div className="text-xs text-slate-400 dark:text-slate-500">{game.date}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{game.value}</span>
                          <div className={`w-3 h-3 rounded-full ${game.isHit ? "bg-emerald-500" : "bg-red-500"}`}></div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-slate-500 dark:text-slate-400">No recent games available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info Footer */}
          {hitRateData.is_alternate_line && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                  <Info className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-900 dark:text-amber-200 mb-2">Alternate Line Analysis</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Hit rates recalculated for{" "}
                    {hitRateData.bet_type === "under" ? `U ${hitRateData.line}` : `${hitRateData.line}+`} line based on
                    historical performance data. This analysis shows how the player would have performed against this
                    specific line.
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
