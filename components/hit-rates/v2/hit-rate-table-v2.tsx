"use client"

import { useState } from "react"
import { Share2, TrendingDown, TrendingUp, Minus, Star, Scale, ArrowUpDown, ArrowUp, ArrowDown, Clock, BarChart2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { BarChart, Bar, Cell, ResponsiveContainer, ReferenceLine, YAxis } from "recharts"
import { Badge } from "@/components/ui/badge"
import type { PlayerHitRateProfile, TimeWindow, RecentGame, Market } from "@/types/hit-rates"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { sportsbooks } from "@/data/sportsbooks"
import Image from "next/image"
import OddsCell from "@/components/shared/odds-cell"

// Map team abbreviations to handle special cases and variations
const teamAbbreviationMap: Record<string, string> = {
  // Arizona Diamondbacks variations
  ARI: "AZ", // Standard abbreviation maps to file name
  ARIZONA: "AZ",
  DIAMONDBACKS: "AZ",

  // Oakland Athletics variations
  AT: "OAK",

  // Keep other mappings as needed
  // 'SFG': 'SF'  // Example: If a file is named SF.svg but the abbreviation in data is SFG
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
    // Add more mappings as needed
  }
  return map[abbr] || abbr
}

interface HitRateTableV2Props {
  profiles: PlayerHitRateProfile[]
  calculateHitRate: (profile: PlayerHitRateProfile, timeWindow: string) => number
  getPlayerData: (playerId: number) => {
    teamAbbreviation: string
    positionAbbreviation: string
  }
  activeTimeWindow?: TimeWindow
  customTier: number | null
  onSort?: (field: string, direction: "asc" | "desc") => void
  sortField?: string
  sortDirection?: "asc" | "desc"
  getBestOddsForProfile?: (profile: PlayerHitRateProfile) => {
    american: number
    decimal: number
    sportsbook: string
    link?: string | null
  } | null
}

const getPercentageColor = (value: number): string => {
  // Good percentages (Green variations - from deep to light)
  if (value >= 90) return "bg-green-200 dark:bg-green-800/50 text-green-900 dark:text-green-200" // Deep green
  if (value >= 80) return "bg-green-100 dark:bg-green-800/40 text-green-800 dark:text-green-300"
  if (value >= 70) return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
  if (value >= 60) return "bg-green-50 dark:bg-green-900/25 text-green-700 dark:text-green-400"
  if (value >= 50) return "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" // Lightest green

  // Bad percentages (Red variations - from light to deep)
  if (value >= 40) return "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" // Lightest red
  if (value >= 30) return "bg-red-50 dark:bg-red-900/25 text-red-700 dark:text-red-400"
  if (value >= 20) return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
  if (value >= 10) return "bg-red-100 dark:bg-red-800/40 text-red-800 dark:text-red-300"
  return "bg-red-200 dark:bg-red-800/50 text-red-900 dark:text-red-200" // Deep red
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

// Add a function to get detailed stats for the tooltip
const getDetailedStats = (profile: PlayerHitRateProfile, timeWindow: TimeWindow, customTier: number | null) => {
  // Map the TimeWindow to the correct key in points_histogram
  const histogramKey = timeWindow === "5_games" ? "last_5" : timeWindow === "10_games" ? "last_10" : "last_20"

  const histogram = profile.points_histogram[histogramKey as keyof typeof profile.points_histogram] as Record<
    string,
    number
  >

  const totalGames = Object.values(histogram).reduce((sum, count) => sum + count, 0)

  // Calculate total stats based on histogram
  const totalStats = Object.entries(histogram).reduce((total, [value, count]) => {
    return total + Number(value) * count
  }, 0)

  // Calculate average per game
  const avgPerGame = totalGames > 0 ? totalStats / totalGames : 0

  // Use the same line comparison logic as elsewhere
  const lineToCompare = customTier !== null ? customTier : profile.line

  // Calculate hits vs line
  const hitsAboveLine = Object.entries(histogram).reduce((total, [value, count]) => {
    return Number(value) >= lineToCompare ? total + count : total
  }, 0)

  return {
    totalGames,
    totalStats,
    avgPerGame,
    hitsAboveLine,
    hitRate: totalGames > 0 ? (hitsAboveLine / totalGames) * 100 : 0,
  }
}

// Get an appropriate max value for the chart based on market
const getChartMaxForMarket = (market: Market): number => {
  // Base values for each market type
  let baseMax = 4 // Default

  switch (market) {
    case "Strikeouts":
      baseMax = 12 // Pitchers can have higher strikeout numbers
      break
    case "Total Bases":
      baseMax = 8 // Multiple bases per hit can add up
      break
    case "RBIs":
      baseMax = 6 // RBIs can be higher in good games
      break
    case "Hits":
      baseMax = 4 // Most players get 0-3 hits per game
      break
    case "Home Runs":
      baseMax = 2 // Rare to get multiple HRs in a game
      break
    default:
      baseMax = 4 // Default fallback
  }

  return baseMax
}

// Simple TeamLogoFallback component to use when an image fails to load
const TeamLogoFallback = ({ className, teamAbbr }: { className?: string; teamAbbr?: string }) => {
  const abbreviation = teamAbbr?.substring(0, 2) || "?"

  return (
    <div
      className={cn(
        "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded flex items-center justify-center text-[8px] font-bold",
        className,
      )}
    >
      {abbreviation}
    </div>
  )
}

// Function to calculate hit rate with a custom tier value
const calculateHitRateWithCustomTier = (
  profile: PlayerHitRateProfile,
  customTier: number,
  timeWindow: "last_5" | "last_10" | "last_20",
): number => {
  // Get the histogram data for the specified time window
  const histogram = profile.points_histogram[timeWindow]

  // Calculate total games and games where the player hit the custom tier
  const totalGames = Object.values(histogram).reduce((sum, count) => sum + count, 0)

  if (totalGames === 0) return 0

  // Calculate games where player had >= custom tier
  let gamesHittingTier = 0
  Object.entries(histogram).forEach(([value, count]) => {
    if (Number(value) >= customTier) {
      gamesHittingTier += count
    }
  })

  // Calculate and return the hit rate percentage
  return Math.round((gamesHittingTier / totalGames) * 100)
}

// Add function to calculate custom tier season hit rate
const calculateSeasonHitRateWithCustomTier = (profile: PlayerHitRateProfile, customTier: number): number => {
  // For this example, we'll assume the season_hit_rate in the profile is based on the default line
  // We'd need a histogram of season data to properly calculate a custom tier rate
  // This is a simplified implementation - in a real app, you'd want histogram data for the season

  if (!profile.season_hit_rate) return 0

  // For now, let's estimate the custom tier season hit rate by adjusting the original rate
  // This is just an approximation until you add the actual season histogram data
  if (customTier !== null && customTier !== profile.line) {
    // Simple adjustment: if increasing the tier, lower the hit rate; if decreasing, increase it
    const difference = customTier - profile.line
    // Simple approximation - adjust by 10% per 0.5 difference in line
    const adjustmentFactor = 1 - difference * 0.2

    // Ensure the hit rate stays between 0-100%
    return Math.max(0, Math.min(100, Math.round(profile.season_hit_rate * adjustmentFactor)))
  }

  return profile.season_hit_rate
}

// Add a helper function to safely extract odds value
const getOddsValueFromBookData = (bookData: any): number => {
  // If bookData has an odds property, use that
  if (bookData && bookData.odds !== undefined) {
    const odds = Number(bookData.odds)
    if (!isNaN(odds)) {
      return odds
    }
  }

  // If bookData is directly a number, use that
  const directOdds = Number(bookData)
  if (!isNaN(directOdds)) {
    return directOdds
  }

  // Default case
  return 0
}

// Add a helper to safely get link from bookData
const getLinkFromBookData = (bookData: any): string | undefined => {
  if (bookData && bookData.over_link) {
    return bookData.over_link
  }

  if (bookData && bookData.link) {
    return bookData.link
  }

  return undefined
}

// Helper to sort odds from best to worst (highest positive, then least negative)
function sortOddsEntries(entries: [string, any][]) {
  return entries.sort((a, b) => {
    const getOdds = (oddsObj: any) => {
      if (oddsObj && oddsObj.odds !== undefined) return Number(oddsObj.odds)
      if (!isNaN(Number(oddsObj))) return Number(oddsObj)
      return Number.NEGATIVE_INFINITY
    }
    return getOdds(b[1]) - getOdds(a[1])
  })
}

// Add a helper function to get the sort icon
const getSortIcon = (field: string, currentSortField: string, currentSortDirection: "asc" | "desc") => {
  // For unsorted columns, show muted double arrow
  if (field !== currentSortField) {
    return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/50" />
  }
  // Use the same purple as the market line reference
  return currentSortDirection === "asc" ? (
    <ArrowUp className="ml-1 h-3 w-3 text-indigo-500 dark:text-indigo-400" />
  ) : (
    <ArrowDown className="ml-1 h-3 w-3 text-indigo-500 dark:text-indigo-400" />
  )
}

// Add a helper function for formatting the timestamp
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

export default function HitRateTableV2({
  profiles,
  calculateHitRate,
  getPlayerData,
  activeTimeWindow = "10_games",
  customTier,
  onSort,
  sortField = "L10",
  sortDirection = "desc",
  getBestOddsForProfile,
}: HitRateTableV2Props) {
  const [favorites, setFavorites] = useState<Record<number, boolean>>({})

  // Toggle favorite status for a player
  const toggleFavorite = (playerId: number) => {
    setFavorites((prev) => ({
      ...prev,
      [playerId]: !prev[playerId],
    }))
  }

  // Generate random odds for demonstration
  const getRandomOdds = () => {
    const baseOdds = Math.random() > 0.5 ? -110 : 110
    const variation = Math.floor(Math.random() * 20) * 5
    return baseOdds > 0 ? baseOdds + variation : baseOdds - variation
  }

  // Get odds value from all_odds if available
  const getOddsValue = (
    profile: PlayerHitRateProfile,
    sbName: string,
    bestOddsData: { american: number } | null,
  ): number => {
    // Store available odds for this line/tier
    let availableOddsForLine: Record<string, any> = {};
    let bestOddsValue = -Infinity;
    let bestBook = sbName;
    
    // If we have a custom tier, try to get odds for that tier first
    if (customTier !== null && profile.all_odds) {
      const actualLineValue = (customTier - 0.5).toString();
      
      if (profile.all_odds[actualLineValue]) {
        availableOddsForLine = profile.all_odds[actualLineValue];
      }
    } else if (profile.all_odds && profile.line) {
      // Use default line
      const lineStr = profile.line.toString();
      if (profile.all_odds[lineStr]) {
        availableOddsForLine = profile.all_odds[lineStr];
      }
    }
    
    // If we have odds for this line, find the best odds
    if (Object.keys(availableOddsForLine).length > 0) {
      // Sort odds from best to worst
      const sortedEntries = sortOddsEntries(Object.entries(availableOddsForLine));
      if (sortedEntries.length > 0) {
        const [bestBookName, bestBookData] = sortedEntries[0];
        bestOddsValue = getOddsValueFromBookData(bestBookData);
        bestBook = bestBookName;
        return bestOddsValue;
      }
    }
    
    // Fallback to bestOdds prop if available
    if (bestOddsData && typeof bestOddsData === 'object' && typeof bestOddsData.american === 'number' && !isNaN(bestOddsData.american)) {
      return Math.round(bestOddsData.american);
    }
    
    // Last resort: random odds
    const randomOdds = Math.round(getRandomOdds());
    return randomOdds;
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

  // Generate histogram data for the mini chart - updated to show individual games
  const getHistogramData = (profile: PlayerHitRateProfile, tierValue: number | null) => {
    // Get the game data from the recent_games field or fallback to generated data
    const gameData = getGameByGameData(profile)

    // Format data for the chart - reverse to show oldest to newest (left to right)
    return [...gameData].reverse().map((game, index) => {
      const lineToCompare = tierValue !== null ? tierValue : profile.line

      return {
        name: `G${index + 1}`,
        value: game.value,
        // Ensure we're using the correct comparison for determining hits
        isHit: game.value >= lineToCompare,
      }
    })
  }

  // Generate game-by-game performance data for the tooltip
  const getGameByGameData = (profile: PlayerHitRateProfile) => {
    // Use actual recent_games data from the profile if available, otherwise fall back to generated data
    if (profile.recent_games && profile.recent_games.length > 0) {
      // Always get up to 10 games or all available if less than 10
      const availableGames = profile.recent_games.length
      const gameCount = Math.min(availableGames, 10)

      // Return the most recent games - up to 10
      return profile.recent_games.slice(0, gameCount).map((game: RecentGame) => ({
        opponent: game.opponent_abbr,
        isHome: game.is_home,
        value: game.value,
        date: game.date,
      }))
    } else {
      // Fall back to mock data generation if recent_games is empty
      // This is for backward compatibility during transition
      const windowKey = "last_10" // Default to last 10 games
      const histogram = profile.points_histogram[windowKey] as Record<string, number>

      // Create sample game data based on histogram distribution
      const gameCount = Object.values(histogram).reduce((sum, count) => sum + count, 0)
      const actualGameCount = Math.min(gameCount, 10) // Use at most 10 games
      const games: Array<{ opponent: string; isHome: boolean; value: number; date: string }> = []

      // Generate sample games based on histogram distribution
      Object.entries(histogram).forEach(([value, count]) => {
        const numValue = Number(value)
        for (let i = 0; i < count && games.length < actualGameCount; i++) {
          const teams = ["NYY", "BOS", "LAD", "CHC", "MIL", "ATL", "HOU", "PHI"]
          const randomTeam = teams[Math.floor(Math.random() * teams.length)]
          const isHome = Math.random() > 0.5
          // Generate a date within the last month
          const date = new Date()
          date.setDate(date.getDate() - Math.floor(Math.random() * 30))

          games.push({
            opponent: randomTeam,
            isHome,
            value: numValue,
            date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          })
        }
      })

      // If we don't have enough games from the histogram, add some random ones to meet the target count
      while (games.length < actualGameCount && games.length < 10) {
        const teams = ["NYY", "BOS", "LAD", "CHC", "MIL", "ATL", "HOU", "PHI"]
        const randomTeam = teams[Math.floor(Math.random() * teams.length)]
        const isHome = Math.random() > 0.5
        const date = new Date()
        date.setDate(date.getDate() - Math.floor(Math.random() * 30))

        // Generate a random value that's close to the line
        const randomValue = Math.max(0, Math.round((profile.line + (Math.random() * 2 - 0.5)) * 10) / 10)

        games.push({
          opponent: randomTeam,
          isHome,
          value: randomValue,
          date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        })
      }

      // Sort by date (most recent first)
      return games.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }
  }

  // Generate random game info (in a real app, this would come from the API)
  const getGameInfo = () => {
    const teams = ["NYY", "BOS", "LAD", "CHC", "MIL", "ATL", "HOU", "PHI"]
    const randomTeam = teams[Math.floor(Math.random() * teams.length)]
    const isHome = Math.random() > 0.5

    return {
      opponent: randomTeam,
      isHome,
      matchupText: isHome ? `vs ${randomTeam}` : `@ ${randomTeam}`,
      time: "7:05 PM ET",
    }
  }

  // Get random sportsbook for demonstration
  const getRandomSportsbook = () => {
    const books = ["DK", "FD", "MGM", "CZR"]
    return books[Math.floor(Math.random() * books.length)]
  }

  // Format American odds for display
  const formatOdds = (odds: number): string => {
    // Handle NaN, undefined or null values
    if (odds === undefined || odds === null || isNaN(odds)) {
      return "-"
    }
    return odds > 0 ? `+${odds}` : odds.toString()
  }

  // Modified handle sort to call the parent's onSort function if provided
  const handleSort = (field: string) => {
    // If parent provided onSort function, use it
    if (onSort) {
      const newDirection = sortField === field && sortDirection === "desc" ? "asc" : "desc"

      // If we're sorting by hit rates and have a custom tier, we need to use a custom sort
      if (customTier !== null && (field === "L5" || field === "L10" || field === "L20")) {
        // We'll pass the same field but add a custom sort function to the data in the dashboard component
        onSort(`${field}_custom`, newDirection)
      } else {
        onSort(field, newDirection)
      }
    }
  }

  // Format a matchup text based on actual game data
  const getActualMatchupInfo = (profile: PlayerHitRateProfile, playerTeam: string) => {
    if (!profile.away_team || !profile.home_team) {
      // Fallback to random generation if game data is missing
      return getGameInfo()
    }

    // Get abbreviations for both teams
    const awayTeamAbbr = getTeamAbbreviation(profile.away_team)
    const homeTeamAbbr = getTeamAbbreviation(profile.home_team)

    // Determine if the player's team is home or away by comparing abbreviations
    const isPlayerTeamHome =
      playerTeam === homeTeamAbbr || homeTeamAbbr.includes(playerTeam) || playerTeam.includes(homeTeamAbbr)

    const isPlayerTeamAway =
      playerTeam === awayTeamAbbr || awayTeamAbbr.includes(playerTeam) || playerTeam.includes(awayTeamAbbr)

    // If player is on home team, the opponent is the away team
    if (isPlayerTeamHome) {
      return {
        opponent: awayTeamAbbr,
        isHome: true,
        matchupText: `vs ${awayTeamAbbr}`,
        time: formatGameTime(profile.commence_time),
      }
    }

    // If player is on away team, the opponent is the home team
    if (isPlayerTeamAway) {
      return {
        opponent: homeTeamAbbr,
        isHome: false,
        matchupText: `@ ${homeTeamAbbr}`,
        time: formatGameTime(profile.commence_time),
      }
    }

    // If we can't determine which team the player is on, use the first team as opponent
    return {
      opponent: awayTeamAbbr,
      isHome: true,
      matchupText: `vs ${awayTeamAbbr}`,
      time: formatGameTime(profile.commence_time),
    }
  }

  // Helper to convert a full team name to an abbreviation
  const getTeamAbbreviation = (teamName: string): string => {
    // Common team name mappings
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

    // Check if we have a direct mapping
    if (teamAbbreviations[teamName]) {
      return teamAbbreviations[teamName]
    }

    // If no direct mapping, generate an abbreviation from the team name
    // by taking the first letter of each word
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

      // Format time as "7:05 PM"
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
          {/* Add a main header row and sub-header row for grouped columns */}
          <TableRow className="border-b-0">
            <TableHead colSpan={1} className="text-center border-b border-slate-200 dark:border-slate-700">
              <span className="text-base font-semibold">Player</span>
            </TableHead>
            {/* Matchup - make it part of a column group for consistent alignment */}
            <TableHead colSpan={1} className="text-center border-b border-slate-200 dark:border-slate-700">
              <span className="text-base font-semibold">Matchup</span>
            </TableHead>
            {/* Group Line and Avg columns */}
            <TableHead colSpan={2} className="text-center border-b border-slate-200 dark:border-slate-700">
              <span className="text-base font-semibold">Props</span>
            </TableHead>
            {/* Group Hit Rate columns - now including Recent Games */}
            <TableHead
              colSpan={customTier !== null ? 3 : 4}
              className="text-center border-b border-slate-200 dark:border-slate-700"
            >
              <span className="text-base font-semibold">Hit Rates</span>
            </TableHead>
            {/* Recent Games - separate column */}
            <TableHead colSpan={1} className="text-center border-b border-slate-200 dark:border-slate-700">
              <span className="text-base font-semibold">Recent Games</span>
            </TableHead>
            {/* Group Odds and Actions */}
            <TableHead colSpan={1} className="text-center border-b border-slate-200 dark:border-slate-700">
              <span className="text-base font-semibold">Betting</span>
            </TableHead>
            {/* Share - simplified */}
            <TableHead colSpan={1} className="text-center border-b border-slate-200 dark:border-slate-700">
              <span className="text-base font-semibold">Actions</span>
            </TableHead>
          </TableRow>
          {/* Original second row */}
          <TableRow className="border-b border-slate-200 dark:border-slate-700">
            {/* Player column in second row */}
            <TableHead className="w-[15%] py-2">
              <Button 
                variant="ghost" 
                className="p-0 font-semibold text-sm" 
                onClick={() => handleSort("name")}
              >
                <span className={sortField === "name" ? "text-indigo-500 dark:text-indigo-400" : ""}>Name</span>
                {getSortIcon("name", sortField, sortDirection)}
              </Button>
            </TableHead>
            {/* Matchup - now in the second row for alignment */}
            <TableHead className="text-center w-[7%] py-2">
              <span className="font-semibold text-sm">Game</span>
            </TableHead>
            {/* Line - fixed width */}
            <TableHead className="text-center w-[5%] py-2">
              <Button 
                variant="ghost" 
                className="p-0 font-semibold text-sm" 
                onClick={() => handleSort("line")}
              >
                <span className={sortField === "line" ? "text-indigo-500 dark:text-indigo-400" : ""}>Line</span>
                {getSortIcon("line", sortField, sortDirection)}
              </Button>
            </TableHead>
            {/* Avg - fixed width */}
            <TableHead className="text-center w-[5%] py-2 border-r-0">
              <Button 
                variant="ghost" 
                className="p-0 font-semibold text-sm" 
                onClick={() => handleSort("average")}
              >
                <span className={sortField === "average" ? "text-indigo-500 dark:text-indigo-400" : ""}>Avg</span>
                {getSortIcon("average", sortField, sortDirection)}
              </Button>
            </TableHead>
            {/* L5 - fixed width */}
            <TableHead className="text-center w-[6%] py-2">
              <Button 
                variant="ghost" 
                className="p-0 font-semibold text-sm" 
                onClick={() => handleSort("L5")}
              >
                <span className={sortField === "L5" ? "text-indigo-500 dark:text-indigo-400" : ""}>L5</span>
                {getSortIcon("L5", sortField, sortDirection)}
              </Button>
            </TableHead>
            {/* L10 - fixed width */}
            <TableHead className="text-center w-[6%] py-2">
              <Button 
                variant="ghost" 
                className="p-0 font-semibold text-sm" 
                onClick={() => handleSort("L10")}
              >
                <span className={sortField === "L10" ? "text-indigo-500 dark:text-indigo-400" : ""}>L10</span>
                {getSortIcon("L10", sortField, sortDirection)}
              </Button>
            </TableHead>
            {/* L20 - fixed width */}
            <TableHead className="text-center w-[6%] py-2">
              <Button 
                variant="ghost" 
                className="p-0 font-semibold text-sm" 
                onClick={() => handleSort("L20")}
              >
                <span className={sortField === "L20" ? "text-indigo-500 dark:text-indigo-400" : ""}>L20</span>
                {getSortIcon("L20", sortField, sortDirection)}
              </Button>
            </TableHead>
            {/* Season Hit Rate - fixed width - only shown when customTier is null */}
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
                        <span className={sortField === "seasonHitRate" ? "text-indigo-500 dark:text-indigo-400" : ""}>2025</span>
                        {getSortIcon("seasonHitRate", sortField, sortDirection)}
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
            {/* Recent Games - flexible to fill remaining space */}
            <TableHead className="text-center w-[20%] py-2 border-r-0">
              <span className="font-semibold text-sm">Performance</span>
            </TableHead>
            {/* Odds - Combined column for odds, sportsbook, and compare - fixed width */}
            <TableHead className="text-center w-[10%] py-2">
              <span className="font-semibold text-sm">Best Odds</span>
            </TableHead>
            {/* Share in second row - empty for cleaner look */}
            <TableHead className="text-center w-[3%] py-2">{/* No label needed here */}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((profile, index) => {
            const playerData = getPlayerData(profile.player_id)
            const teamAbbreviation = playerData?.teamAbbreviation || profile.team_name
            const positionAbbreviation = playerData?.positionAbbreviation || "N/A"

            const hitRate = calculateHitRate(profile, activeTimeWindow)
            const trend = getTrend(profile)
            const trendIndicator = getTrendIndicator(trend)
            const gameInfo = getActualMatchupInfo(profile, teamAbbreviation)

            // Use real odds data if available
            const bestOdds = getBestOddsForProfile ? getBestOddsForProfile(profile) : null;
            
            // Get the best odds and sportsbook for the current line/tier
            let availableOddsForLine: Record<string, any> = {};
            let bestBook = bestOdds ? bestOdds.sportsbook : getRandomSportsbook();
            let bestOddsValue = bestOdds ? bestOdds.american : 0;
            let directLink = bestOdds?.link;
            
            if (customTier !== null && profile.all_odds) {
              const actualLineValue = (customTier - 0.5).toString();
              if (profile.all_odds[actualLineValue]) {
                availableOddsForLine = profile.all_odds[actualLineValue];
              }
            } else if (profile.all_odds && profile.line) {
              const lineStr = profile.line.toString();
              if (profile.all_odds[lineStr]) {
                availableOddsForLine = profile.all_odds[lineStr];
              }
            }

            const odds = getOddsValue(profile, bestBook, bestOdds);

            const isFavorite = !!favorites[profile.player_id]

            // Calculate the number of games in the selected time window
            const windowKey =
              activeTimeWindow === "5_games" ? "last_5" : activeTimeWindow === "10_games" ? "last_10" : "last_20"
            const histogram = profile.points_histogram[windowKey]
            const gamesCount = Object.values(histogram).reduce((sum, count) => sum + count, 0)
            const hitsCount = Math.round(gamesCount * (hitRate / 100))

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
                {/* Player column with avatar, name, team logo, and position - slightly reduced width */}
                <TableCell className="font-medium py-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={() => toggleFavorite(profile.player_id)}
                    >
                      <Star className={`h-3 w-3 ${isFavorite ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`} />
                    </Button>
                    <Avatar className="h-10 w-10 border-2 border-slate-200 shadow-sm">
                      <div data-image-id={profile.player_id}>
                        <AvatarImage
                          src={playerHeadshotUrl || "/placeholder.svg"}
                          alt={profile.player_name}
                          onError={() => {
                            const fallback = document.createElement("div")
                            fallback.className = "w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded text-[8px] font-bold"
                            fallback.textContent = profile.player_name.substring(0, 2)
                            
                            const imgContainer = document.querySelector(`[data-image-id="${profile.player_id}"]`)
                            if (imgContainer) {
                              imgContainer.innerHTML = ""
                              imgContainer.appendChild(fallback)
                            }
                          }}
                        />
                      </div>
                      <AvatarFallback className="bg-slate-200 text-slate-800">
                        {profile.player_name.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <div className="font-bold text-sm">{profile.player_name}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <div className="w-4 h-4 relative flex-shrink-0" data-team-logo={teamAbbreviation}>
                          <Image
                            src={`/images/mlb-teams/${getTeamLogoFilename(getStandardAbbreviation(teamAbbreviation))}.svg`}
                            alt={teamAbbreviation || "Team"}
                            width={16}
                            height={16}
                            className="object-contain w-full h-full p-0.5"
                            onError={() => {
                              const fallback = document.createElement("div")
                              fallback.className = "w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded text-[8px] font-bold"
                              fallback.textContent = getStandardAbbreviation(teamAbbreviation)?.substring(0, 2) || "?"
                              
                              const imgContainer = document.querySelector(`[data-team-logo="${teamAbbreviation}"]`)
                              if (imgContainer) {
                                imgContainer.innerHTML = ""
                                imgContainer.appendChild(fallback)
                              }
                            }}
                          />
                        </div>
                        <Badge variant="outline" className="px-1 py-0 text-xs">
                          {positionAbbreviation || "N/A"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* Matchup - Updated to show team abbreviation first, then logo */}
                <TableCell className="font-medium p-1 text-center">
                  <div className="px-1 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 inline-block text-xs">
                    <div className="flex items-center justify-center gap-1">
                      {/* Enhanced matchup display with opponent logo moved to the right */}
                      {gameInfo.isHome ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-medium">vs</span>
                          <span className="text-xs font-medium">{gameInfo.opponent}</span>
                          <div className="w-5 h-5 relative flex-shrink-0" data-team-logo={gameInfo.opponent}>
                            <Image
                              src={`/images/mlb-teams/${getTeamLogoFilename(getStandardAbbreviation(gameInfo.opponent))}.svg`}
                              alt={gameInfo.opponent}
                              width={20}
                              height={20}
                              className="object-contain w-full h-full p-0.5"
                              onError={() => {
                                const fallback = document.createElement("div")
                                fallback.className = "w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded text-[8px] font-bold"
                                fallback.textContent = getStandardAbbreviation(gameInfo.opponent)?.substring(0, 2) || "?"
                                
                                const imgContainer = document.querySelector(`[data-team-logo="${gameInfo.opponent}"]`)
                                if (imgContainer) {
                                  imgContainer.innerHTML = ""
                                  imgContainer.appendChild(fallback)
                                }
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-medium">@</span>
                          <span className="text-xs font-medium">{gameInfo.opponent}</span>
                          <div className="w-5 h-5 relative flex-shrink-0" data-team-logo={gameInfo.opponent}>
                            <Image
                              src={`/images/mlb-teams/${getTeamLogoFilename(getStandardAbbreviation(gameInfo.opponent))}.svg`}
                              alt={gameInfo.opponent}
                              width={20}
                              height={20}
                              className="object-contain w-full h-full p-0.5"
                              onError={() => {
                                const fallback = document.createElement("div")
                                fallback.className = "w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded text-[8px] font-bold"
                                fallback.textContent = getStandardAbbreviation(gameInfo.opponent)?.substring(0, 2) || "?"
                                
                                const imgContainer = document.querySelector(`[data-team-logo="${gameInfo.opponent}"]`)
                                if (imgContainer) {
                                  imgContainer.innerHTML = ""
                                  imgContainer.appendChild(fallback)
                                }
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{gameInfo.time}</div>
                  </div>
                </TableCell>

                {/* Market Line - Significantly reduced size */}
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

                {/* Average - Significantly reduced size */}
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
                          <div className="flex justify-between gap-2 text-sm">
                            <span>Line:</span>
                            <span>
                              {customTier !== null ? (
                                <>
                                  {customTier}+ <span className="opacity-60">({profile.line.toFixed(1)})</span>
                                </>
                              ) : (
                                profile.line.toFixed(1)
                              )}
                            </span>
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

                {/* Recent Games - Increased width and prominence */}
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
                              {/* Set a fixed domain for the y-axis to keep all charts consistent */}
                              <YAxis domain={[0, getChartMaxForMarket(profile.market)]} hide />

                              {/* Add a reference line for the player's line - make it more visible */}
                              <ReferenceLine
                                y={customTier !== null ? customTier : profile.line}
                                stroke="#6366f1"
                                strokeWidth={2}
                                strokeDasharray="3 3"
                                isFront={true}
                              />

                              {/* Display bars without value labels */}
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
                        {/* Header with gradient background - enhanced with smoother gradient */}
                        <div className="bg-gradient-to-r from-indigo-700 to-purple-800 dark:from-indigo-900 dark:to-purple-950 p-4 text-white">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-xl">{profile.market} Distribution</h3>
                            <Badge variant="secondary" className="font-medium text-xs">
                              {getGameByGameData(profile).length} games
                            </Badge>
                          </div>

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

                        {/* Stats summary section - improved with subtle background and better spacing */}
                        <div className="px-4 py-3 bg-background">
                          {(() => {
                            const stats = getDetailedStats(profile, activeTimeWindow, customTier)
                            return (
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Games:</span>
                                  <span className="font-bold text-foreground">{stats.totalGames}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Total {profile.market}:</span>
                                  <span className="font-bold text-foreground">{stats.totalStats}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Avg per game:</span>
                                  <span className="font-bold text-foreground">{stats.avgPerGame.toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Hit Rate:</span>
                                  <span className={cn("font-bold", getPercentageColor(stats.hitRate))}>
                                    {Math.round(stats.hitRate)}% ({stats.hitsAboveLine}/{stats.totalGames})
                                  </span>
                                </div>
                              </div>
                            )
                          })()}

                          {/* Added chart scale info with subtle styling */}
                          <div className="text-xs text-muted-foreground mt-2 bg-muted/30 px-2 py-1 rounded-sm inline-block">
                            Chart scale: 0-{getChartMaxForMarket(profile.market)} {profile.market}
                          </div>
                        </div>

                        {/* Game by Game section - improved with cleaner cards and better contrast */}
                        <div className="border-t border-border">
                          <div className="px-4 py-2 bg-muted/30 font-medium flex items-center justify-between">
                            <span>Game by Game</span>
                            <span className="text-xs text-muted-foreground">Most recent first</span>
                          </div>

                          <div className="max-h-[240px] overflow-y-auto p-3 space-y-2">
                            {getGameByGameData(profile).map(
                              (
                                game: { opponent: string; isHome: boolean; value: number; date: string },
                                idx: number,
                              ) => {
                                // Use the same logic for determining hits as in the chart
                                const isHit = game.value >= (customTier !== null ? customTier : profile.line)

                                return (
                                  <div
                                    key={idx}
                                    className={cn(
                                      "flex items-center justify-between p-2 rounded-md",
                                      isHit
                                        ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/30"
                                        : "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30",
                                    )}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={cn(
                                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm",
                                          isHit ? "bg-green-500 text-white" : "bg-red-500 text-white",
                                        )}
                                      >
                                        {isHit ? "✓" : "✗"}
                                      </div>
                                      <div>
                                        <div className="font-medium text-sm">{game.date}</div>
                                        <div className="text-xs text-muted-foreground flex items-center">
                                          {game.isHome ? "vs" : "@"}
                                          <span className="mx-1">{game.opponent}</span>
                                          <div className="w-4 h-4 relative flex-shrink-0" data-team-logo={game.opponent}>
                                            <Image
                                              src={`/images/mlb-teams/${getTeamLogoFilename(getStandardAbbreviation(game.opponent))}.svg`}
                                              alt={game.opponent || "Team"}
                                              width={16}
                                              height={16}
                                              className="object-contain w-full h-full p-0.5"
                                              onError={() => {
                                                const fallback = document.createElement("div")
                                                fallback.className = "w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded text-[8px] font-bold"
                                                fallback.textContent = getStandardAbbreviation(game.opponent)?.substring(0, 2) || "?"
                                                
                                                const imgContainer = document.querySelector(`[data-team-logo="${game.opponent}"]`)
                                                if (imgContainer) {
                                                  imgContainer.innerHTML = ""
                                                  imgContainer.appendChild(fallback)
                                                }
                                              }}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center">
                                      <div
                                        className={cn(
                                          "text-xl font-bold w-10 h-10 flex items-center justify-center rounded-full",
                                          isHit
                                            ? "bg-green-100 text-green-700 dark:bg-green-800/20 dark:text-green-500"
                                            : "bg-red-100 text-red-700 dark:bg-red-800/20 dark:text-red-500",
                                        )}
                                      >
                                        {game.value}
                                      </div>
                                    </div>
                                  </div>
                                )
                              },
                            )}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>

                {/* Combined Odds, Sportsbook and Compare button in a single cell */}
                <TableCell className="p-1">
                  {(() => {
                    return (
                      <OddsCell
                        odds={bestOddsValue}
                        sportsbook={bestBook}
                        market={profile.market}
                        line={profile.line}
                        customTier={customTier}
                        allOdds={availableOddsForLine}
                        directLink={directLink}
                      />
                    )
                  })()}
                </TableCell>

                {/* Share button in its own column */}
                <TableCell className="p-1 text-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 mx-auto" asChild>
                          <a href="#" onClick={(e) => e.preventDefault()}>
                            <Share2 className="h-4 w-4" />
                          </a>
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
