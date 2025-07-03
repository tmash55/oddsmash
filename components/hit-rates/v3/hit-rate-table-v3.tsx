"use client"

import { useState } from "react"
import { Share2, TrendingDown, TrendingUp, Minus, Star, ArrowUpDown, ArrowUp, ArrowDown, Clock, BarChart2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { BarChart, Bar, Cell, ResponsiveContainer, ReferenceLine, YAxis } from "recharts"
import { Badge } from "@/components/ui/badge"
import type { PlayerHitRateProfile, TimeWindow } from "@/types/hit-rates"
import { PlayerPropOdds } from "@/services/player-prop-odds"
import { SupportedSport, SportMarket } from "@/types/sports"
import Image from "next/image"
import OddsCell from "@/components/shared/odds-cell"
import DualOddsCell from "@/components/shared/dual-odds-cell"

// Map team abbreviations to handle special cases and variations
const teamAbbreviationMap: Record<string, string> = {
  ARI: "AZ",
  AT: "OAK",
}

// Function to get the correct file name for a team abbreviation
function getTeamLogoFilename(abbr: string): string {
  if (!abbr) return "default"
  const upperAbbr = abbr.toUpperCase()
  return teamAbbreviationMap[upperAbbr] || abbr
}

// Function to standardize team abbreviations for logo lookup
function getStandardAbbreviation(abbr: string): string {
  const map: Record<string, string> = {
    AT: "OAK",
  }
  return map[abbr] || abbr
}

interface PlayerTeamData {
  player_id: number
  team_abbreviation: string
  position_abbreviation: string
}

interface HitRateTableV3Props {
  profiles: PlayerHitRateProfile[]
  playerTeamData: Record<number, PlayerTeamData>
  playerOddsData: Record<string, PlayerPropOdds | null>
  sport: SupportedSport
  market: SportMarket
  activeTimeWindow?: TimeWindow
  customTier: number | null
  onSort?: (field: string, direction: "asc" | "desc") => void
  sortField?: string
  sortDirection?: "asc" | "desc"
}

const getPercentageColor = (value: number): string => {
  if (value >= 90) return "bg-green-200 dark:bg-green-800/50 text-green-900 dark:text-green-200"
  if (value >= 80) return "bg-green-100 dark:bg-green-800/40 text-green-800 dark:text-green-300"
  if (value >= 70) return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
  if (value >= 60) return "bg-green-50 dark:bg-green-900/25 text-green-700 dark:text-green-400"
  if (value >= 50) return "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
  if (value >= 40) return "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
  if (value >= 30) return "bg-red-50 dark:bg-red-900/25 text-red-700 dark:text-red-400"
  if (value >= 20) return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
  if (value >= 10) return "bg-red-100 dark:bg-red-800/40 text-red-800 dark:text-red-300"
  return "bg-red-200 dark:bg-red-800/50 text-red-900 dark:text-red-200"
}

// Helper function to get trend icon and color
const getTrendIndicator = (trend: "up" | "down" | "neutral") => {
  if (trend === "up") {
    return {
      icon: <TrendingUp className="h-4 w-4" />,
      color: "text-green-500",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      borderColor: "border-green-500",
      label: "Trending up",
    }
  } else if (trend === "down") {
    return {
      icon: <TrendingDown className="h-4 w-4" />,
      color: "text-red-500",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      borderColor: "border-red-500",
      label: "Trending down",
    }
  } else {
    return {
      icon: <Minus className="h-4 w-4" />,
      color: "text-gray-500",
      bgColor: "bg-gray-100 dark:bg-gray-800",
      borderColor: "border-gray-400",
      label: "Stable",
    }
  }
}

// Get an appropriate max value for the chart based on market
const getChartMaxForMarket = (market: SportMarket): number => {
  switch (market) {
    case "Strikeouts":
      return 12
    case "Total Bases":
      return 8
    case "RBIs":
      return 6
    case "Hits":
      return 4
    case "Home Runs":
      return 2
    default:
      return 4
  }
}

// Function to calculate hit rate with a custom tier value
const calculateHitRateWithCustomTier = (
  profile: PlayerHitRateProfile,
  customTier: number,
  timeWindow: "last_5" | "last_10" | "last_20",
): number => {
  const histogram = profile.points_histogram[timeWindow]
  if (!histogram) return 0

  const totalGames = Object.values(histogram).reduce((sum, count) => sum + count, 0)
  if (totalGames === 0) return 0

  let gamesHittingTier = 0
  Object.entries(histogram).forEach(([value, count]) => {
    if (Number(value) >= customTier) {
      gamesHittingTier += count
    }
  })

  return Math.round((gamesHittingTier / totalGames) * 100)
}

// Helper function to get the sort icon
const getSortIcon = (field: string, currentSortField: string, currentSortDirection: "asc" | "desc") => {
  if (field !== currentSortField) {
    return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/50" />
  }
  return currentSortDirection === "asc" ? (
    <ArrowUp className="ml-1 h-3 w-3 text-indigo-500 dark:text-indigo-400" />
  ) : (
    <ArrowDown className="ml-1 h-3 w-3 text-indigo-500 dark:text-indigo-400" />
  )
}

// Helper function for formatting the timestamp
const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { 
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) + ' • ' + date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
};

export default function HitRateTableV3({
  profiles,
  playerTeamData,
  playerOddsData,
  sport,
  market,
  activeTimeWindow = "10_games",
  customTier,
  onSort,
  sortField = "L10",
  sortDirection = "desc",
}: HitRateTableV3Props) {
  const [favorites, setFavorites] = useState<Record<number, boolean>>({})

  // Toggle favorite status for a player
  const toggleFavorite = (playerId: number) => {
    setFavorites((prev) => ({
      ...prev,
      [playerId]: !prev[playerId],
    }))
  }

  // Calculate hit rate for a profile
  const calculateHitRate = (profile: PlayerHitRateProfile, timeWindow: TimeWindow): number => {
    switch (timeWindow) {
      case "5_games":
        return profile.last_5_hit_rate
      case "20_games":
        return profile.last_20_hit_rate
      default:
        return profile.last_10_hit_rate
    }
  }

  // Get player team data
  const getPlayerData = (playerId: number) => {
    return playerTeamData[playerId] || {
      team_abbreviation: "—",
      position_abbreviation: "—"
    }
  }

  // Get trend indicator
  const getTrend = (profile: PlayerHitRateProfile): "up" | "down" | "neutral" => {
    const l5 = profile.last_5_hit_rate
    const l10 = profile.last_10_hit_rate

    if (l5 > l10 + 5) return "up"
    if (l5 < l10 - 5) return "down"
    return "neutral"
  }

  // Calculate the trend percentage change
  const getTrendPercentage = (profile: PlayerHitRateProfile): number => {
    const l5 = profile.last_5_hit_rate
    const l10 = profile.last_10_hit_rate

    if (l10 === 0) return 0
    return Math.round(((l5 - l10) / l10) * 100)
  }

  // Generate histogram data for the mini chart
  const getHistogramData = (profile: PlayerHitRateProfile, tierValue: number | null) => {
    const gameData = getGameByGameData(profile)
    return [...gameData].reverse().map((game, index) => {
      const lineToCompare = tierValue !== null ? tierValue : (profile as any).line || 0.5
      return {
        name: `G${index + 1}`,
        value: game.value,
        isHit: game.value >= lineToCompare,
      }
    })
  }

  // Generate game-by-game performance data
  const getGameByGameData = (profile: PlayerHitRateProfile) => {
    if (profile.recent_games && Array.isArray(profile.recent_games)) {
      const availableGames = profile.recent_games.length
      const gameCount = Math.min(availableGames, 10)
      return profile.recent_games.slice(0, gameCount).map((game) => ({
        opponent: game.opponent_abbr || "TBD",
        isHome: game.is_home || false,
        value: game.value || 0,
        date: game.date || "",
      }))
    }
    return []
  }

  // Handle sort
  const handleSort = (field: string) => {
    if (onSort) {
      const getDisplaySortField = (field: string): string => {
        if (field.endsWith("_custom")) {
          return field.replace("_custom", "");
        }
        return field;
      };

      const currentBaseField = getDisplaySortField(sortField);
      const newDirection = currentBaseField === field && sortDirection === "desc" ? "asc" : "desc";

      if (customTier !== null && (field === "L5" || field === "L10" || field === "L20")) {
        onSort(`${field}_custom`, newDirection);
      } else {
        onSort(field, newDirection);
      }
    }
  }

  // Helper function to get the display sort field (for arrow indicator)
  const getDisplaySortField = (field: string): string => {
    if (field.endsWith("_custom")) {
      return field.replace("_custom", "");
    }
    return field;
  };

  // Get best odds for a profile from the playerOddsData
  const getBestOddsForProfile = (profile: PlayerHitRateProfile) => {
    const profileKey = `${profile.player_id}:${profile.market}:${customTier !== null ? customTier : profile.line}`
    const oddsData = playerOddsData[profileKey]
    
    // First try to get odds from Redis playerOddsData
    if (oddsData) {
      return {
        american: oddsData.over_odds || 0,
        decimal: oddsData.over_odds ? (oddsData.over_odds > 0 ? (oddsData.over_odds / 100) + 1 : (-100 / oddsData.over_odds) + 1) : 1,
        sportsbook: oddsData.sportsbook || "—",
        link: oddsData.over_link || null
      }
    }
    
    // Fallback to all_odds from the profile (like v2 does)
    if (profile.all_odds) {
      let bestOddsValue = -Infinity;
      let bestBook = "";
      let directLink: string | undefined = undefined;
      
      // Determine which line to look for
      const lineToSearch = customTier !== null ? (customTier - 0.5).toString() : profile.line.toString();
      
      if (profile.all_odds[lineToSearch]) {
        const availableOddsForLine = profile.all_odds[lineToSearch];
        
        // Find best odds for this line
        Object.entries(availableOddsForLine).forEach(([book, bookData]) => {
          let currentOdds: number | undefined;
          
          if (bookData && bookData.odds !== undefined) {
            currentOdds = Math.round(Number(bookData.odds));
          } else if (!isNaN(Number(bookData))) {
            currentOdds = Math.round(Number(bookData));
          }
          
          if (currentOdds !== undefined && !isNaN(currentOdds)) {
            if ((currentOdds > 0 && currentOdds > bestOddsValue) || 
                (currentOdds < 0 && currentOdds > bestOddsValue)) {
              bestOddsValue = currentOdds;
              bestBook = book;
              
              // Get direct link if available
              if (bookData && bookData.over_link) {
                directLink = bookData.over_link;
              } else if (bookData && bookData.link) {
                directLink = bookData.link;
              }
            }
          }
        });
        
        if (bestOddsValue !== -Infinity) {
          return {
            american: bestOddsValue,
            decimal: bestOddsValue > 0 ? (bestOddsValue / 100) + 1 : (-100 / bestOddsValue) + 1,
            sportsbook: bestBook,
            link: directLink || null
          }
        }
      }
    }
    
    return null
  }

  // Format American odds for display
  const formatOdds = (odds: number): string => {
    if (odds === undefined || odds === null || isNaN(odds)) {
      return "-"
    }
    return odds > 0 ? `+${odds}` : odds.toString()
  }

  // Get actual matchup info
  const getActualMatchupInfo = (profile: PlayerHitRateProfile, playerTeam: string) => {
    if (!profile.away_team || !profile.home_team || !playerTeam) {
      return {
        opponent: "TBD",
        isHome: true,
        matchupText: "TBD",
        time: "TBD",
      }
    }

    const awayTeamAbbr = getTeamAbbreviation(profile.away_team)
    const homeTeamAbbr = getTeamAbbreviation(profile.home_team)

    // Check if player's team matches either home or away team
    const isPlayerTeamHome = playerTeam === homeTeamAbbr || 
                            (homeTeamAbbr && homeTeamAbbr.includes(playerTeam)) || 
                            (playerTeam && playerTeam.includes(homeTeamAbbr))

    if (isPlayerTeamHome) {
      return {
        opponent: awayTeamAbbr,
        isHome: true,
        matchupText: `vs ${awayTeamAbbr}`,
        time: formatGameTime(profile.commence_time),
      }
    }

    return {
      opponent: homeTeamAbbr,
      isHome: false,
      matchupText: `@ ${homeTeamAbbr}`,
      time: formatGameTime(profile.commence_time),
    }
  }

  // Helper to convert a full team name to an abbreviation
  const getTeamAbbreviation = (teamName: string): string => {
    const teamAbbreviations: Record<string, string> = {
      "New York Yankees": "NYY",
      "New York Mets": "NYM",
      "Boston Red Sox": "BOS",
      "Los Angeles Dodgers": "LAD",
      "Los Angeles Angels": "LAA",
      "Chicago Cubs": "CHC",
      "Chicago White Sox": "CHW",
      "Milwaukee Brewers": "MIL",
      "Atlanta Braves": "ATL",
      "Houston Astros": "HOU",
      "Philadelphia Phillies": "PHI",
      "San Francisco Giants": "SF",
      "San Diego Padres": "SD",
      "Toronto Blue Jays": "TOR",
      "Texas Rangers": "TEX",
      "Cleveland Guardians": "CLE",
      "Detroit Tigers": "DET",
      "Minnesota Twins": "MIN",
      "Kansas City Royals": "KC",
      "Colorado Rockies": "COL",
      "Arizona Diamondbacks": "ARI",
      "Seattle Mariners": "SEA",
      "Tampa Bay Rays": "TB",
      "Miami Marlins": "MIA",
      "Baltimore Orioles": "BAL",
      "Washington Nationals": "WSH",
      "Pittsburgh Pirates": "PIT",
      "Cincinnati Reds": "CIN",
      "Oakland Athletics": "OAK",
      "St. Louis Cardinals": "STL",
    }

    if (teamAbbreviations[teamName]) {
      return teamAbbreviations[teamName]
    }

    return teamName
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
  }

  // Format the game time from ISO string to a readable format
  const formatGameTime = (timeString?: string): string => {
    if (!timeString) return "TBD"

    try {
      const date = new Date(timeString)
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    } catch (e) {
      return "TBD"
    }
  }

  return (
    <div className="w-full overflow-auto rounded-xl border shadow-sm">
      {/* Add timestamp before the table */}
      {profiles.length > 0 && (
        <div className="flex justify-end px-4 py-2 bg-slate-50 dark:bg-slate-900 border-b">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            Last updated: {formatTimestamp(profiles[0].updated_at)}
          </span>
        </div>
      )}
      
      <Table className="min-w-[1000px]">
        <TableHeader className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10">
          {/* Main header row */}
          <TableRow className="border-b-0">
            <TableHead colSpan={1} className="text-center border-b border-slate-200 dark:border-slate-700">
              <span className="text-base font-semibold">Player</span>
            </TableHead>
            <TableHead colSpan={1} className="text-center border-b border-slate-200 dark:border-slate-700">
              <span className="text-base font-semibold">Matchup</span>
            </TableHead>
            <TableHead colSpan={2} className="text-center border-b border-slate-200 dark:border-slate-700">
              <span className="text-base font-semibold">Props & Odds</span>
            </TableHead>
            <TableHead colSpan={1} className="text-center border-b border-slate-200 dark:border-slate-700">
              <span className="text-base font-semibold">Average</span>
            </TableHead>
            <TableHead
              colSpan={customTier !== null ? 3 : 4}
              className="text-center border-b border-slate-200 dark:border-slate-700"
            >
              <span className="text-base font-semibold">Hit Rates</span>
            </TableHead>
            <TableHead colSpan={1} className="text-center border-b border-slate-200 dark:border-slate-700">
              <span className="text-base font-semibold">Recent Games</span>
            </TableHead>
            <TableHead colSpan={1} className="text-center border-b border-slate-200 dark:border-slate-700">
              <span className="text-base font-semibold">Actions</span>
            </TableHead>
          </TableRow>
          
          {/* Sub-header row */}
          <TableRow className="border-b border-slate-200 dark:border-slate-700">
            <TableHead className="w-[15%] py-2">
              <Button 
                variant="ghost" 
                className="p-0 font-semibold text-sm" 
                onClick={() => handleSort("name")}
              >
                <span className={getDisplaySortField(sortField) === "name" ? "text-indigo-500 dark:text-indigo-400" : ""}>Name</span>
                {getSortIcon("name", getDisplaySortField(sortField), sortDirection)}
              </Button>
            </TableHead>
            <TableHead className="text-center w-[7%] py-2">
              <span className="font-semibold text-sm">Game</span>
            </TableHead>
            <TableHead className="text-center w-[5%] py-2">
              <Button 
                variant="ghost" 
                className="p-0 font-semibold text-sm" 
                onClick={() => handleSort("line")}
              >
                <span className={getDisplaySortField(sortField) === "line" ? "text-indigo-500 dark:text-indigo-400" : ""}>Line</span>
                {getSortIcon("line", getDisplaySortField(sortField), sortDirection)}
              </Button>
            </TableHead>
            <TableHead className="text-center w-[10%] py-2">
              <span className="font-semibold text-sm">Over / Under</span>
            </TableHead>
            <TableHead className="text-center w-[5%] py-2 border-r-0">
              <Button 
                variant="ghost" 
                className="p-0 font-semibold text-sm" 
                onClick={() => handleSort("average")}
              >
                <span className={getDisplaySortField(sortField) === "average" ? "text-indigo-500 dark:text-indigo-400" : ""}>Avg</span>
                {getSortIcon("average", getDisplaySortField(sortField), sortDirection)}
              </Button>
            </TableHead>
            <TableHead className="text-center w-[6%] py-2">
              <Button 
                variant="ghost" 
                className="p-0 font-semibold text-sm" 
                onClick={() => handleSort("L5")}
              >
                <span className={getDisplaySortField(sortField) === "L5" ? "text-indigo-500 dark:text-indigo-400" : ""}>L5</span>
                {getSortIcon("L5", getDisplaySortField(sortField), sortDirection)}
              </Button>
            </TableHead>
            <TableHead className="text-center w-[6%] py-2">
              <Button 
                variant="ghost" 
                className="p-0 font-semibold text-sm" 
                onClick={() => handleSort("L10")}
              >
                <span className={getDisplaySortField(sortField) === "L10" ? "text-indigo-500 dark:text-indigo-400" : ""}>L10</span>
                {getSortIcon("L10", getDisplaySortField(sortField), sortDirection)}
              </Button>
            </TableHead>
            <TableHead className="text-center w-[6%] py-2">
              <Button 
                variant="ghost" 
                className="p-0 font-semibold text-sm" 
                onClick={() => handleSort("L20")}
              >
                <span className={getDisplaySortField(sortField) === "L20" ? "text-indigo-500 dark:text-indigo-400" : ""}>L20</span>
                {getSortIcon("L20", getDisplaySortField(sortField), sortDirection)}
              </Button>
            </TableHead>
            {customTier === null && (
              <TableHead className="text-center w-[8%] py-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        className="p-0 font-semibold text-sm"
                        onClick={() => handleSort("seasonHitRate")}
                      >
                        <span className={getDisplaySortField(sortField) === "seasonHitRate" ? "text-indigo-500 dark:text-indigo-400" : ""}>2025</span>
                        {getSortIcon("seasonHitRate", getDisplaySortField(sortField), sortDirection)}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Season hit rate projection for 2025</p>
                      <p className="text-xs text-muted-foreground mt-1">Based on historical performance and trends</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
            )}
            <TableHead className="text-center w-[20%] py-2 border-r-0">
              <span className="font-semibold text-sm">Performance</span>
            </TableHead>
            <TableHead className="text-center w-[3%] py-2"></TableHead>
          </TableRow>
        </TableHeader>
        
        <TableBody>
          {profiles.map((profile, index) => {
            const teamAbbreviation = profile.team_abbreviation
            const hitRate = calculateHitRate(profile, activeTimeWindow)
            const trend = getTrend(profile)
            const trendIndicator = getTrendIndicator(trend)
            const gameInfo = getActualMatchupInfo(profile, teamAbbreviation)
            const bestOdds = getBestOddsForProfile(profile)
            const isFavorite = !!favorites[profile.player_id]

            // Generate MLB headshot URL
            const playerHeadshotUrl = `https://img.mlbstatic.com/mlb-photos/image/upload/w_240,q_auto:good,f_auto/v1/people/${profile.player_id}/headshot/67/current`

            return (
              <TableRow
                key={profile.id}
                className={cn(
                  "transition-colors",
                  index % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50 dark:bg-slate-900",
                  "hover:bg-slate-100 dark:hover:bg-slate-800",
                )}
              >
                {/* Player column */}
                <TableCell className="font-medium py-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-10 w-10 border-2 border-slate-200 shadow-sm overflow-hidden">
                      <AvatarImage
                        src={playerHeadshotUrl}
                        alt={profile.player_name}
                        className="object-cover w-full h-full"
                      />
                      <AvatarFallback className="bg-slate-200 text-slate-800">
                        {profile.player_name.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <div className="font-bold text-sm">{profile.player_name}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <div className="w-4 h-4 relative flex-shrink-0">
                          <Image
                            src={`/images/mlb-teams/${getTeamLogoFilename(profile.team_abbreviation)}.svg`}
                            alt={profile.team_abbreviation}
                            width={16}
                            height={16}
                            className="object-contain w-full h-full p-0.5"
                          />
                        </div>
                        <Badge variant="outline" className="px-1 py-0 text-xs">
                          {profile.position_abbreviation}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* Matchup column */}
                <TableCell className="font-medium p-1 text-center">
                  <div className="px-1 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 inline-block text-xs">
                    <div className="flex items-center justify-center gap-1">
                      {gameInfo.isHome ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-medium">vs</span>
                          <span className="text-xs font-medium">{gameInfo.opponent}</span>
                          <div className="w-5 h-5 relative flex-shrink-0">
                            <Image
                              src={`/images/mlb-teams/${getTeamLogoFilename(getStandardAbbreviation(gameInfo.opponent))}.svg`}
                              alt={gameInfo.opponent}
                              width={20}
                              height={20}
                              className="object-contain w-full h-full p-0.5"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-medium">@</span>
                          <span className="text-xs font-medium">{gameInfo.opponent}</span>
                          <div className="w-5 h-5 relative flex-shrink-0">
                            <Image
                              src={`/images/mlb-teams/${getTeamLogoFilename(getStandardAbbreviation(gameInfo.opponent))}.svg`}
                              alt={gameInfo.opponent}
                              width={20}
                              height={20}
                              className="object-contain w-full h-full p-0.5"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{gameInfo.time}</div>
                  </div>
                </TableCell>

                {/* Line column */}
                <TableCell className="text-center p-1">
                  <div className="px-1.5 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 rounded-md font-bold inline-block text-xs">
                    {customTier !== null ? (
                      <>
                        {customTier}+<span className="text-[9px] ml-0.5 opacity-60">({profile.line.toFixed(1)})</span>
                      </>
                    ) : (
                      profile.line.toFixed(1)
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{profile.market}</div>
                </TableCell>

                {/* Odds column */}
                <TableCell className="p-1">
                  <DualOddsCell
                    market={profile.market}
                    line={profile.line}
                    customTier={customTier}
                    fallback_odds={null}
                    compact={true}
                    playerName={profile.player_name}
                    playerId={profile.player_id}
                    teamName={teamAbbreviation}
                    gameId={profile.odds_event_id}
                    eventTime={profile.commence_time}
                    awayTeam={profile.away_team}
                    homeTeam={profile.home_team}
                  />
                </TableCell>

                {/* Average column */}
                <TableCell className="text-center p-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative w-8 h-8 mx-auto">
                          <div className="absolute inset-0 rounded-full bg-slate-100 dark:bg-slate-800"></div>
                          <div
                            className={cn(
                              "absolute inset-0.5 rounded-full bg-white dark:bg-slate-950 flex items-center justify-center",
                              "border",
                              trendIndicator.borderColor,
                            )}
                          >
                            <span
                              className={cn(
                                "font-bold text-xs",
                                profile.avg_stat_per_game >= profile.line
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400",
                              )}
                            >
                              {profile.avg_stat_per_game.toFixed(1)}
                            </span>
                          </div>
                          <div className="absolute -top-1 -right-1 rounded-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 w-3 h-3 flex items-center justify-center">
                            <span className={trendIndicator.color}>
                              {trendIndicator.icon && <div className="scale-50">{trendIndicator.icon}</div>}
                            </span>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <p className="font-medium">{trendIndicator.label}</p>
                          <div className="flex justify-between gap-2 text-sm">
                            <span>Recent change:</span>
                            <span className={trendIndicator.color}>
                              {getTrendPercentage(profile) > 0 ? "+" : ""}
                              {getTrendPercentage(profile)}%
                            </span>
                          </div>
                          <div className="flex justify-between gap-2 text-sm">
                            <span>Average per game:</span>
                            <span className="font-bold text-foreground">{profile.avg_stat_per_game.toFixed(1)}</span>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>

                {/* L5 Column */}
                <TableCell className="p-0.5 sm:p-1">
                  <div
                    className={`flex items-center justify-center rounded-lg shadow-sm ${getPercentageColor(
                      customTier !== null
                        ? calculateHitRateWithCustomTier(profile, customTier, "last_5")
                        : Math.round(profile.last_5_hit_rate),
                    )}`}
                  >
                    <div className="py-2 px-3 font-medium text-sm sm:text-base">
                      {customTier !== null
                        ? calculateHitRateWithCustomTier(profile, customTier, "last_5")
                        : Math.round(profile.last_5_hit_rate)}
                      %
                    </div>
                  </div>
                </TableCell>

                {/* L10 Column */}
                <TableCell className="p-0.5 sm:p-1">
                  <div
                    className={`flex items-center justify-center rounded-lg shadow-sm ${getPercentageColor(
                      customTier !== null
                        ? calculateHitRateWithCustomTier(profile, customTier, "last_10")
                        : Math.round(profile.last_10_hit_rate),
                    )}`}
                  >
                    <div className="py-2 px-3 font-medium text-sm sm:text-base">
                      {customTier !== null
                        ? calculateHitRateWithCustomTier(profile, customTier, "last_10")
                        : Math.round(profile.last_10_hit_rate)}
                      %
                    </div>
                  </div>
                </TableCell>

                {/* L20 Column */}
                <TableCell className="p-0.5 sm:p-1">
                  <div
                    className={`flex items-center justify-center rounded-lg shadow-sm ${getPercentageColor(
                      customTier !== null
                        ? calculateHitRateWithCustomTier(profile, customTier, "last_20")
                        : Math.round(profile.last_20_hit_rate),
                    )}`}
                  >
                    <div className="py-2 px-3 font-medium text-sm sm:text-base">
                      {customTier !== null
                        ? calculateHitRateWithCustomTier(profile, customTier, "last_20")
                        : Math.round(profile.last_20_hit_rate)}
                      %
                    </div>
                  </div>
                </TableCell>

                {/* Season Column */}
                {customTier === null && (
                  <TableCell className="p-0.5 sm:p-1">
                    <div
                      className={`flex items-center justify-center rounded-lg shadow-sm ${getPercentageColor(Math.round(profile.season_hit_rate || 0))}`}
                    >
                      <div className="py-2 px-3 font-medium text-sm sm:text-base">
                        {Math.round(profile.season_hit_rate || 0)}%
                      </div>
                    </div>
                  </TableCell>
                )}

                {/* Recent Games column with chart */}
                <TableCell className="p-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="h-16 w-[160px] mx-auto relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={getHistogramData(profile, customTier)}
                              margin={{ top: 5, right: 5, bottom: 0, left: 5 }}
                              barCategoryGap={2}
                            >
                              <YAxis domain={[0, getChartMaxForMarket(profile.market)]} hide />
                              <ReferenceLine
                                y={customTier !== null ? customTier : profile.line}
                                stroke="#6366f1"
                                strokeWidth={2}
                                strokeDasharray="3 3"
                                isFront={true}
                              />
                              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {getHistogramData(profile, customTier).map((entry, i) => (
                                  <Cell key={`cell-${i}`} fill={entry.isHit ? "#10b981" : "#ef4444"} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="w-[320px] p-0 overflow-hidden rounded-lg shadow-lg">
                        <div className="bg-gradient-to-r from-indigo-700 to-purple-800 dark:from-indigo-900 dark:to-purple-950 p-4 text-white">
                          <h3 className="font-bold text-xl">{profile.market} Distribution</h3>
                          <div className="flex items-center mt-3">
                            <div className="bg-white/15 rounded-lg px-3 py-1.5">
                              <span className="text-xs uppercase tracking-wider opacity-70">Line</span>
                              <div className="text-lg font-bold">{profile.line}</div>
                            </div>
                            {customTier !== null && (
                              <div className="bg-white/15 rounded-lg px-3 py-1.5 ml-2">
                                <span className="text-xs uppercase tracking-wider opacity-70">Custom</span>
                                <div className="text-lg font-bold">{customTier}+</div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="px-4 py-3 bg-background">
                          <div className="text-sm text-muted-foreground">
                            Chart shows recent game performance vs the line
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>

                {/* Share button */}
                <TableCell className="p-1 text-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 mx-auto">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        Share this player prop
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
} 