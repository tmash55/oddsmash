"use client"

import { useState, useMemo } from "react"
import {
  ChevronUp,
  ChevronDown,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
  Heart,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { SupportedSport, SportMarket } from "@/types/sports"
import { PlayerHitRateProfile, TimeWindow } from "@/types/hit-rates"
import DualOddsCell from "@/components/shared/dual-odds-cell"
import { BarChart, Bar, Cell, ResponsiveContainer, ReferenceLine, YAxis, LabelList } from "recharts"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { BetActions } from "@/components/betting/bet-actions"
import { getMarketApiKey } from "@/lib/constants/markets"
import OddsComparison from "@/components/shared/odds-comparison"
import type { BetslipSelection } from "@/types/betslip"
import { sportsbooks } from "@/data/sportsbooks"

interface PlayerTeamData {
  player_id: number
  team_abbreviation: string
  position_abbreviation: string
}

interface BestOdds {
  american: number
  decimal: number
  sportsbook: string
  link?: string | null
  _resolved?: any
  lines?: any
}

interface HitRateTableV4Props {
  profiles: PlayerHitRateProfile[]
  playerTeamData: Record<number, PlayerTeamData>
  sport: SupportedSport
  market: SportMarket
  activeTimeWindow?: string
  customTier: number | null
  onSort?: (field: string, direction: "asc" | "desc") => void
  sortField?: string
  sortDirection?: "asc" | "desc"
  calculateHitRate: (profile: PlayerHitRateProfile, timeWindow: string) => number
  getPlayerData: (playerId: number) => {
    teamAbbreviation: string
    positionAbbreviation: string
  }
  getBestOddsForProfile: (profile: PlayerHitRateProfile) => BestOdds | null
}

// Helper functions
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

// Team logo helper functions (from V2)
function getTeamLogoFilename(abbr: string): string {
  if (!abbr) return "default"
  const teamAbbreviationMap: Record<string, string> = {
    ARI: "AZ", // Arizona Diamondbacks
    AT: "OAK", // Oakland Athletics
  }
  const upperAbbr = abbr.toUpperCase()
  return teamAbbreviationMap[upperAbbr] || abbr
}

function getStandardAbbreviation(abbr: string): string {
  const map: Record<string, string> = {
    AT: "OAK",
  }
  return map[abbr] || abbr
}

const getSortIcon = (field: string, currentSortField: string, currentSortDirection: "asc" | "desc") => {
  if (field !== currentSortField) {
    return null
  }
  return currentSortDirection === "asc" ? "↑" : "↓"
}

const formatTimestamp = (timestamp: string) => {
  try {
    const date = new Date(timestamp)
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  } catch (e) {
    return "Unknown"
  }
}

// Get an appropriate max value for the chart based on market
const getChartMaxForMarket = (market: string): number => {
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

// Add detailed stats function from V2 for comprehensive tooltip
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

// Generate histogram data for the mini chart
const getHistogramData = (profile: PlayerHitRateProfile, tierValue: number | null) => {
  const gameData = getGameByGameData(profile)
  return [...gameData].reverse().map((game, index) => {
    const lineToCompare = tierValue !== null ? tierValue : profile.line || 0.5
    return {
      name: `G${index + 1}`,
      value: game.value,
      isHit: game.value >= lineToCompare,
    }
  })
}

// Map hit rate profile markets to market constants values
const mapHitRateMarketToMarketValue = (hitRateMarket: string): string => {
  const marketMap: Record<string, string> = {
    "Total Bases": "Total_Bases",
    "Home Runs": "Home_Runs", 
    "Hits": "Hits",
    "RBIs": "RBIs",
    "Strikeouts": "Strikeouts",
    "Singles": "Singles",
    "Doubles": "Doubles", 
    "Triples": "Triples",
    "Hits + Runs + RBIs": "Hits_Runs_RBIs",
    "Earned Runs": "Earned_Runs",
    "Walks": "Walks",
    "Outs": "Outs_Recorded",
    "Batting Strikeouts": "Strikeouts", // This maps to batter strikeouts
    "Batting Walks": "Walks", // This maps to batter walks
  }
  
  return marketMap[hitRateMarket] || hitRateMarket
}

// Create a proper BetslipSelection object
const createBetslipSelection = (
  profile: PlayerHitRateProfile,
  customTier: number | null,
  bestOdds: BestOdds | null,
  betType: "over" | "under" = "over"
) => {
  // Map the hit rate market to the market value format
  const marketValue = mapHitRateMarketToMarketValue(profile.market)
  
  // Get the correct market API key
  const marketKey = getMarketApiKey("baseball_mlb", marketValue)
  
  // Create odds_data object
  const odds_data: Record<string, {
    odds: number,
    line?: number,
    link?: string,
    sid?: string,
    last_update: string
  }> = {}
  
  // Add best odds if available
  if (bestOdds) {
    odds_data[bestOdds.sportsbook] = {
      odds: bestOdds.american,
      line: customTier !== null ? customTier : profile.line,
      link: bestOdds.link || undefined,
      last_update: new Date().toISOString()
    }
  }
  
  // Use line from custom tier or profile
  const line = customTier !== null ? customTier : profile.line
  
  return {
    event_id: `${profile.away_team}_${profile.home_team}_${profile.commence_time}`,
    sport_key: "baseball_mlb",
    commence_time: profile.commence_time || new Date().toISOString(),
    home_team: profile.home_team || "",
    away_team: profile.away_team || "",
    bet_type: "player_prop" as const,
    market_type: "player_prop" as const,
    market_key: marketKey,
    selection: betType === "over" ? `Over ${line}` : `Under ${line}`,
    player_name: profile.player_name,
    player_id: profile.player_id,
    player_team: profile.team_name,
    line: line,
    odds_data: odds_data
  }
}

// New component for V4 odds display
interface V4OddsCellProps {
  profile: PlayerHitRateProfile
  customTier: number | null
  betType: "over" | "under"
  freshOdds?: any // Change to any to handle the complex Redis structure
}

function V4OddsCell({ profile, customTier, betType, freshOdds }: V4OddsCellProps) {
  const line = customTier !== null ? customTier : profile.line;
  
  console.log(`[V4OddsCell] ${profile.player_name} | ${profile.market} | ${betType} ${line}`);
  
  // Helper function to find sportsbook data by name
  const getSportsbookData = (sportsbookName: string) => {
    return sportsbooks.find(sb => 
      sb.name.toLowerCase() === sportsbookName.toLowerCase() ||
      sb.id.toLowerCase() === sportsbookName.toLowerCase()
    );
  };

  // Helper function to render odds with sportsbook logo
  const renderOddsWithLogo = (odds: number, sportsbookName: string, link?: string | null) => {
    const sportsbookData = getSportsbookData(sportsbookName);
    
    return (
      <div className="flex items-center justify-center">
        <div 
          className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded text-xs font-semibold cursor-pointer hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors flex items-center gap-1.5"
          onClick={() => link && window.open(link, "_blank")}
        >
          <span>{odds > 0 ? `+${odds}` : odds}</span>
          {sportsbookData ? (
            <div className="w-5 h-3 flex items-center justify-center">
              <Image
                src={sportsbookData.logo}
                alt={sportsbookData.name}
                width={20}
                height={12}
                className="object-contain max-w-5 max-h-3"
              />
            </div>
          ) : (
            <span className="text-[9px] opacity-70 truncate max-w-[30px]">
              {sportsbookName.slice(0, 3).toUpperCase()}
            </span>
          )}
        </div>
      </div>
    );
  };
  
  // Priority 1: Check if we have resolved odds from Redis Odds Resolver
  if (freshOdds && freshOdds._resolved) {
    const resolvedOdds = freshOdds._resolved;
    console.log(`[V4OddsCell] Using resolved odds from ${resolvedOdds.source}`);
    
    const oddsData = betType === "over" ? resolvedOdds.over : resolvedOdds.under;
    
    if (oddsData) {
      console.log(`[V4OddsCell] RESOLVED ${betType.toUpperCase()}: ${oddsData.odds} from ${oddsData.sportsbook}`);
      
      return renderOddsWithLogo(oddsData.odds, oddsData.sportsbook, oddsData.link);
    } else {
      console.log(`[V4OddsCell] No ${betType} odds in resolved data`);
    }
  }
  
  // Priority 2: Check if profile.all_odds contains fresh Redis structure with lines data
  if (profile.all_odds && profile.all_odds.lines) {
    const lineData = profile.all_odds.lines[line.toString()];
    
    if (lineData) {
      console.log(`[V4OddsCell] FRESH ODDS from profile.all_odds: Found line data for ${line}`, lineData);
      
      // Extract odds for the specific bet type
      let bestOdds = -Infinity;
      let bestBook = "";
      let bestLink: string | null = null;
      
      Object.entries(lineData).forEach(([sportsbook, bookData]: [string, any]) => {
        if (bookData && bookData[betType] && typeof bookData[betType].price === 'number') {
          const odds = bookData[betType].price;
          const link = bookData[betType].link;
          
          // Find best odds (higher is always better for bettors)
          if (odds > bestOdds) {
            bestOdds = odds;
            bestBook = sportsbook;
            bestLink = link;
          }
        }
      });
      
      if (bestOdds !== -Infinity) {
        console.log(`[V4OddsCell] FRESH ${betType.toUpperCase()}: Best ${bestOdds} from ${bestBook}`);
        
        return renderOddsWithLogo(bestOdds, bestBook, bestLink);
      } else {
        console.log(`[V4OddsCell] No ${betType} odds found in fresh Redis structure`);
      }
    }
  }
  
  // Priority 3: Check embedded all_odds with old format (over only for now)
  if (betType === "over" && profile.all_odds) {
    const lineKey = customTier !== null ? (customTier - 0.5).toString() : profile.line?.toString();
    const relevantOdds = lineKey ? profile.all_odds[lineKey] : null;
    
    if (relevantOdds) {
      console.log(`[V4OddsCell] OLD FORMAT: Found odds for line ${lineKey}`);
      
      let bestOdds = -Infinity;
      let bestBook = "";
      
      Object.entries(relevantOdds).forEach(([book, bookData]) => {
        if (bookData && typeof bookData === 'object' && 'odds' in bookData) {
          const currentOdds = Number(bookData.odds);
          if (!isNaN(currentOdds)) {
            // Find best odds
            if (currentOdds > bestOdds) {
              bestOdds = currentOdds;
              bestBook = book;
            }
          }
        }
      });
      
      if (bestOdds !== -Infinity) {
        console.log(`[V4OddsCell] OLD FORMAT: Best ${bestOdds} from ${bestBook}`);
        
        const linkData = relevantOdds[bestBook];
        const link = linkData?.over_link || linkData?.link;
        
        return renderOddsWithLogo(bestOdds, bestBook, link);
      }
    }
  }
  
  // For under bets with old format, show unavailable
  if (betType === "under") {
    console.log(`[V4OddsCell] Under odds not available in old format`);
  }
  
  // No odds available
  console.log(`[V4OddsCell] No ${betType} odds available`);
  return (
    <div className="flex items-center justify-center">
      <span className="text-xs text-muted-foreground">—</span>
    </div>
  );
}

export default function HitRateTableV4({
  profiles,
  playerTeamData,
  sport,
  market,
  activeTimeWindow = "10_games",
  customTier,
  onSort,
  sortField = "L10",
  sortDirection = "desc",
  calculateHitRate,
  getPlayerData,
  getBestOddsForProfile,
}: HitRateTableV4Props) {
  const [favorites, setFavorites] = useState<Record<number, boolean>>({})

  const toggleFavorite = (playerId: number) => {
    setFavorites((prev) => ({
      ...prev,
      [playerId]: !prev[playerId],
    }))
  }

  const getTrend = (profile: PlayerHitRateProfile): "up" | "down" | "neutral" => {
    const l5 = profile.last_5_hit_rate
    const l10 = profile.last_10_hit_rate

    if (l5 > l10 + 5) return "up"
    if (l5 < l10 - 5) return "down"
    return "neutral"
  }

  const getTrendPercentage = (profile: PlayerHitRateProfile): number => {
    const l5 = profile.last_5_hit_rate
    const l10 = profile.last_10_hit_rate
    return Math.abs(l5 - l10)
  }

  const handleSort = (field: string) => {
    if (!onSort) return
    
    const newDirection = sortField === field && sortDirection === "desc" ? "asc" : "desc"
    onSort(field, newDirection)
  }

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

  const formatOdds = (odds: number): string => {
    if (odds === undefined || odds === null || isNaN(odds)) {
      return "-"
    }
    return odds > 0 ? `+${odds}` : odds.toString()
  }

  return (
    <div className="w-full overflow-auto rounded-xl border shadow-sm">
      {/* Timestamp */}
      {profiles.length > 0 && (
        <div className="flex justify-end px-4 py-2 bg-slate-50 dark:bg-slate-900 border-b">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            Last updated: {formatTimestamp(profiles[0].updated_at)}
          </span>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <Table className="min-w-[1200px]">
        <TableHeader className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10">
          {/* Main header row */}
          <TableRow className="border-b-0">
            <TableHead colSpan={1} className="text-center border-b border-slate-200 dark:border-slate-700">
              <span className="text-base font-semibold">Player</span>
            </TableHead>
            <TableHead colSpan={1} className="text-center border-b border-slate-200 dark:border-slate-700">
              <span className="text-base font-semibold">Matchup</span>
            </TableHead>
            <TableHead colSpan={1} className="text-center border-b border-slate-200 dark:border-slate-700">
              <span className="text-base font-semibold">Recent Games</span>
            </TableHead>
            <TableHead colSpan={2} className="text-center border-b border-slate-200 dark:border-slate-700">
              <span className="text-base font-semibold">Prop Context</span>
            </TableHead>
            <TableHead
              colSpan={customTier !== null ? 3 : 4}
              className="text-center border-b border-slate-200 dark:border-slate-700"
            >
              <span className="text-base font-semibold">Hit Rates</span>
            </TableHead>
            <TableHead colSpan={2} className="text-center border-b border-slate-200 dark:border-slate-700">
              <span className="text-base font-semibold">Best Odds</span>
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
                <span className={sortField === "name" ? "text-indigo-500 dark:text-indigo-400" : ""}>Name</span>
                {getSortIcon("name", sortField, sortDirection)}
              </Button>
            </TableHead>
            <TableHead className="text-center w-[7%] py-2">
              <span className="font-semibold text-sm">Game</span>
            </TableHead>
            <TableHead className="text-center w-[15%] py-2">
              <span className="font-semibold text-sm">Chart</span>
            </TableHead>
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
            
            <TableHead className="text-center w-[5%] py-2">
              <Button 
                variant="ghost" 
                className="p-0 font-semibold text-sm" 
                onClick={() => handleSort("L5")}
              >
                <span className={sortField === "L5" ? "text-indigo-500 dark:text-indigo-400" : ""}>L5</span>
                {getSortIcon("L5", sortField, sortDirection)}
              </Button>
            </TableHead>
            <TableHead className="text-center w-[5%] py-2">
              <Button 
                variant="ghost" 
                className="p-0 font-semibold text-sm" 
                onClick={() => handleSort("L10")}
              >
                <span className={sortField === "L10" ? "text-indigo-500 dark:text-indigo-400" : ""}>L10</span>
                {getSortIcon("L10", sortField, sortDirection)}
              </Button>
            </TableHead>
            
            {customTier === null && (
              <TableHead className="text-center w-[5%] py-2">
                <Button 
                  variant="ghost" 
                  className="p-0 font-semibold text-sm" 
                  onClick={() => handleSort("L20")}
                >
                  <span className={sortField === "L20" ? "text-indigo-500 dark:text-indigo-400" : ""}>L20</span>
                  {getSortIcon("L20", sortField, sortDirection)}
                </Button>
              </TableHead>
            )}
            
            <TableHead className="text-center w-[5%] py-2">
              <Button 
                variant="ghost" 
                className="p-0 font-semibold text-sm" 
                onClick={() => handleSort("seasonHitRate")}
              >
                <span className={sortField === "seasonHitRate" ? "text-indigo-500 dark:text-indigo-400" : ""}>Season</span>
                {getSortIcon("seasonHitRate", sortField, sortDirection)}
              </Button>
            </TableHead>
            
            <TableHead className="text-center w-[5%] py-2">
              <span className="font-semibold text-sm">Best Over</span>
            </TableHead>
            <TableHead className="text-center w-[5%] py-2">
              <span className="font-semibold text-sm">Best Under</span>
            </TableHead>
            <TableHead className="text-center w-[3%] py-2">
              <span className="font-semibold text-sm">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        
        <TableBody>
          {profiles.map((profile, index) => {
            const playerData = getPlayerData(profile.player_id)
            const teamAbbreviation = playerData?.teamAbbreviation || profile.team_name
            const positionAbbreviation = playerData?.positionAbbreviation || "N/A"

            const hitRateL5 = calculateHitRate(profile, "5_games")
            const hitRateL10 = calculateHitRate(profile, "10_games")
            const hitRateL20 = calculateHitRate(profile, "20_games")
            const seasonHitRate = profile.season_hit_rate || 0

            const trend = getTrend(profile)
            const trendIndicator = getTrendIndicator(trend)
            const gameInfo = getActualMatchupInfo(profile, teamAbbreviation)

            // Get best odds using V2 approach
            const bestOdds = getBestOddsForProfile(profile)

            const isFavorite = !!favorites[profile.player_id]

            // Generate MLB headshot URL
            const playerHeadshotUrl = `https://img.mlbstatic.com/mlb-photos/image/upload/w_240,q_auto:good,f_auto/v1/people/${profile.player_id}/headshot/67/current`

            return (
              <TableRow 
                key={profile.player_id} 
                className={cn(
                  "transition-colors",
                  index % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50 dark:bg-slate-900",
                  "hover:bg-slate-100 dark:hover:bg-slate-800",
                )}
              >
                {/* Player - Updated with headshot and team logo like V2 */}
                <TableCell className="font-medium py-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-10 w-10 border-2 border-slate-200 shadow-sm overflow-hidden">
                      <div data-image-id={profile.player_id} className="w-full h-full">
                        <AvatarImage
                          src={playerHeadshotUrl || "/placeholder.svg"}
                          alt={profile.player_name}
                          className="object-cover w-full h-full"
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

                {/* Matchup - Updated with team logo like V2 */}
                <TableCell className="font-medium p-1 text-center">
                  <div className="px-1 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 inline-block text-xs">
                    <div className="flex items-center justify-center gap-1">
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

                {/* Recent Games Chart */}
                <TableCell className="p-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="h-16 w-[160px] mx-auto relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={getHistogramData(profile, customTier)}
                              margin={{ top: 15, right: 5, bottom: 0, left: 5 }}
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
                                <LabelList 
                                  dataKey="value" 
                                  position="top" 
                                  className="fill-slate-400 dark:fill-slate-500 text-[10px] font-medium"
                                  offset={2}
                                  formatter={(value: number) => value === 0 ? '' : value}
                                />
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
                            const stats = getDetailedStats(profile, activeTimeWindow as TimeWindow, customTier)
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

                {/* Line */}
                <TableCell className="text-center p-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="px-1.5 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 rounded-md font-bold inline-block text-xs cursor-help">
                          {customTier !== null ? (
                            <>
                              {customTier}+<span className="text-[9px] ml-0.5 opacity-60">({profile.line.toFixed(1)})</span>
                            </>
                          ) : (
                            profile.line.toFixed(1)
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm">
                          <div className="font-semibold">{profile.market}</div>
                          <div className="text-xs text-muted-foreground">
                            {customTier !== null ? `Custom: ${customTier}+ (Original: ${profile.line.toFixed(1)})` : `Line: ${profile.line.toFixed(1)}`}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>

                {/* Average - Updated with V2 circular styling and trend indicators */}
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

                {/* L5 Hit Rate - Updated with V2 background styling */}
                <TableCell className="p-0.5 sm:p-1">
                  <div
                    className={`flex items-center justify-center rounded-lg shadow-sm ${getPercentageColor(hitRateL5)}`}
                  >
                    <div className="py-2 px-3 font-medium text-sm sm:text-base">
                      {hitRateL5}%
                    </div>
                  </div>
                </TableCell>

                {/* L10 Hit Rate - Updated with V2 background styling */}
                <TableCell className="p-0.5 sm:p-1">
                  <div className="flex items-center justify-center rounded-lg shadow-sm">
                    <div className={`py-2 px-3 font-medium text-sm sm:text-base ${getPercentageColor(hitRateL10)}`}>
                      {hitRateL10}%
                    </div>
                  </div>
                </TableCell>

                {/* L20 Hit Rate (only show if not custom tier) */}
                {customTier === null && (
                  <TableCell className="p-0.5 sm:p-1">
                    <div className="flex items-center justify-center rounded-lg shadow-sm">
                      <div className={`py-2 px-3 font-medium text-sm sm:text-base ${getPercentageColor(hitRateL20)}`}>
                        {hitRateL20}%
                      </div>
                    </div>
                  </TableCell>
                )}

                {/* Season Hit Rate */}
                <TableCell className="p-0.5 sm:p-1">
                  <div className="flex items-center justify-center rounded-lg shadow-sm">
                    <div className={`py-2 px-3 font-medium text-sm sm:text-base ${getPercentageColor(seasonHitRate)}`}>
                      {seasonHitRate}%
                    </div>
                  </div>
                </TableCell>

                {/* Best Over Odds */}
                <TableCell className="text-center p-1">
                  <V4OddsCell
                    profile={profile}
                    customTier={customTier}
                    betType="over"
                    freshOdds={null}
                  />
                </TableCell>

                {/* Best Under Odds */}
                <TableCell className="text-center p-1">
                  <V4OddsCell
                    profile={profile}
                    customTier={customTier}
                    betType="under"
                    freshOdds={null}
                  />
                </TableCell>

                {/* Actions */}
                <TableCell className="text-center p-1">
                  <BetActions
                    selection={createBetslipSelection(profile, customTier, bestOdds, "over")}
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
        </Table>
      </div>
    </div>
  )
}