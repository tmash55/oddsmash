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
  Plus,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SupportedSport } from "@/types/sports"
import { PlayerHitRateProfile, TimeWindow } from "@/types/hit-rates"
import DualOddsCell from "@/components/shared/dual-odds-cell"
import { BarChart, Bar, Cell, ResponsiveContainer, ReferenceLine, YAxis, LabelList } from "recharts"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { getMarketApiKey, getMarketsForSport, type SportMarket as SportMarketInterface } from "@/lib/constants/markets"
import { type SportMarket } from "@/types/sports"
import OddsComparison from "@/components/shared/odds-comparison"
import type { BetslipSelection } from "@/types/betslip"
import { sportsbooks } from "@/data/sportsbooks"
import { getTeamAbbreviation as getTeamAbbr } from "@/lib/constants/team-mappings"
import { useBetActions } from "@/hooks/use-bet-actions"
import { BetslipDialog } from "@/components/betting/betslip-dialog"


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
  isLoading?: boolean
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

const formatTimestamp = (date: string | undefined) => {
  if (!date) return "";
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
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
    "Runs": "Runs",
    "Hits Allowed": "Hits_Allowed",
    "Walks Allowed": "Walks_Allowed",
    "Stolen Bases": "Stolen_Bases"
  }
  
  return marketMap[hitRateMarket] || hitRateMarket
}

// Helper function to extract the best odds for a specific bet type from profile
const getBestOddsForBetType = (
  profile: PlayerHitRateProfile,
  customTier: number | null,
  betType: "over" | "under"
): BestOdds | null => {
  // For custom tiers, the betting line is 0.5 less than the tier (e.g., 3+ bases = 2.5 line)
  const targetLine = customTier !== null ? customTier - 0.5 : profile.line
  
  // Check if we have fresh Redis structure with lines data
  if (profile.all_odds && profile.all_odds.lines) {
    const lineData = profile.all_odds.lines[targetLine.toString()]
    
    if (lineData) {
      let bestOdds = -Infinity
      let bestBook = ""
      let bestLink: string | null = null
      
      Object.entries(lineData).forEach(([sportsbook, bookData]: [string, any]) => {
        if (bookData && bookData[betType] && typeof bookData[betType].price === 'number') {
          const odds = bookData[betType].price
          const link = bookData[betType].link
          
          if (odds > bestOdds) {
            bestOdds = odds
            bestBook = sportsbook
            bestLink = link
          }
        }
      })
      
      if (bestOdds !== -Infinity) {
        return {
          american: bestOdds,
          decimal: bestOdds > 0 ? (bestOdds / 100) + 1 : (-100 / bestOdds) + 1,
          sportsbook: bestBook,
          link: bestLink
        }
      }
    }
  }
  
  // Check embedded all_odds with old format (over only for now)
  if (betType === "over" && profile.all_odds) {
    // The old format uses the betting line as the key (e.g., "2.5" for 3+ bases)
    const lineKey = targetLine.toString()
    const relevantOdds = lineKey ? profile.all_odds[lineKey] : null
    
    if (relevantOdds) {
      let bestOdds = -Infinity
      let bestBook = ""
      let bestLink: string | null = null
      
      Object.entries(relevantOdds).forEach(([book, bookData]) => {
        if (bookData && typeof bookData === 'object' && 'odds' in bookData) {
          const currentOdds = Number(bookData.odds)
          if (!isNaN(currentOdds) && currentOdds > bestOdds) {
            bestOdds = currentOdds
            bestBook = book
            bestLink = bookData.over_link || bookData.link || null
          }
        }
      })
      
      if (bestOdds !== -Infinity) {
        return {
          american: bestOdds,
          decimal: bestOdds > 0 ? (bestOdds / 100) + 1 : (-100 / bestOdds) + 1,
          sportsbook: bestBook,
          link: bestLink
        }
      }
    }
  }
  
  return null
}

// Create a proper BetslipSelection object
const createBetslipSelection = (
  profile: PlayerHitRateProfile,
  customTier: number | null,
  betType: "over" | "under" = "over"
) => {
  // Map the hit rate market to the market value format
  const marketValue = mapHitRateMarketToMarketValue(profile.market)
  
  // Get the correct market API key, including alternates if available
  const markets = getMarketsForSport("baseball_mlb")
          const marketConfig = markets.find((m: SportMarketInterface) => m.value === marketValue)
  
  const marketKey = marketConfig ? (
    marketConfig.hasAlternates && marketConfig.alternateKey ? 
    `${marketConfig.apiKey},${marketConfig.alternateKey}` : 
    marketConfig.apiKey
  ) : getMarketApiKey("baseball_mlb", marketValue)
  
  // Get odds for the specific bet type
  const bestOdds = getBestOddsForBetType(profile, customTier, betType)
  
  // Use line from custom tier or profile
  // For custom tiers, the betting line is 0.5 less than the tier (e.g., 3+ bases = 2.5 line)
  const line = customTier !== null ? customTier - 0.5 : profile.line
  
  // Create odds_data object with required fields
  const odds_data: { [sportsbook: string]: { odds: number; line: number; link: string; last_update: string } } = {}
  
  // Add best odds if available
  if (bestOdds) {
    odds_data[bestOdds.sportsbook] = {
      odds: bestOdds.american,
      line: line, // Use the calculated line (already adjusted for custom tiers)
      link: bestOdds.link || "#", // Provide default link if not available
      last_update: new Date().toISOString()
    }
  }
  
  return {
    event_id: profile.odds_event_id, // Use the actual odds_event_id from hit rate profile
    sport_key: "baseball_mlb",
    commence_time: profile.commence_time || new Date().toISOString(),
    home_team: profile.home_team || "",
    away_team: profile.away_team || "",
    bet_type: "player_prop" as const,
    market_type: "player_prop" as const,
    market_key: marketKey,
    market_display: profile.market,
    selection: betType === "over" ? "Over" : "Under",
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
          className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs font-semibold cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5"
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
  isLoading,
}: HitRateTableV4Props) {
  const [favorites, setFavorites] = useState<Record<number, boolean>>({})
  const [showBetslipDialog, setShowBetslipDialog] = useState(false)
  const [pendingSelection, setPendingSelection] = useState<any>(null)

  const { betslips, handleBetslipSelect, handleCreateBetslip, conflictingSelection, handleResolveConflict } =
    useBetActions()

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

  // Function to handle adding to betslip
  const handleAddToBetslip = (profile: PlayerHitRateProfile, type: "over" | "under" = "over") => {
    const selection = createBetslipSelection(profile, customTier, type)
    setPendingSelection(selection)
    setShowBetslipDialog(true)
  }

  return (
    <>
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
            
            {/* L20 Hit Rate (only show if not custom tier) */}
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
            
            {/* Season Hit Rate (only show if not custom tier) */}
            {customTier === null && (
              <TableHead className="text-center w-[5%] py-2">
                <Button 
                  variant="ghost" 
                  className="p-0 font-semibold text-sm" 
                  onClick={() => handleSort("season")}
                >
                  <span className={sortField === "season" ? "text-indigo-500 dark:text-indigo-400" : ""}>Season</span>
                  {getSortIcon("season", sortField, sortDirection)}
                </Button>
              </TableHead>
            )}
            
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
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10 border-2 border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                      <div data-image-id={profile.player_id} className="w-full h-full">
                        <AvatarImage
                            src={playerHeadshotUrl}
                          alt={profile.player_name}
                          className="object-cover w-full h-full"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                const fallback = document.createElement('div');
                                fallback.className = 'w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-semibold';
                                fallback.textContent = profile.player_name.split(' ').map(n => n[0]).join('');
                                parent.appendChild(fallback);
                            }
                          }}
                        />
                      </div>
                    </Avatar>
                      <div className="absolute -bottom-1 -right-1">
                        <div className="relative w-5 h-5 rounded-full overflow-hidden border-2 border-white dark:border-slate-900 shadow-sm bg-white dark:bg-slate-900">
                          <Image
                            src={`/images/mlb-teams/${getTeamLogoFilename(getStandardAbbreviation(teamAbbreviation))}.svg`}
                            alt={teamAbbreviation}
                            width={20}
                            height={20}
                            className="object-contain w-full h-full p-0.5"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                const fallback = document.createElement('div');
                                fallback.className = 'w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-800 text-[8px] font-bold';
                                fallback.textContent = getStandardAbbreviation(teamAbbreviation)?.substring(0, 2) || '?';
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">{profile.player_name}</span>
                        <Badge variant="outline" className="h-5 px-1.5 text-xs font-medium">
                          {positionAbbreviation}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {formatTimestamp(profile.commence_time)}
                        {profile.away_team && profile.home_team && (
                          <div className="flex items-center gap-1">
                            {teamAbbreviation === getTeamAbbr(profile.home_team) ? (
                              <>
                                <span>vs</span>
                                <div className="w-4 h-4 relative flex-shrink-0">
                                  <Image
                                    src={`/images/mlb-teams/${getTeamLogoFilename(getTeamAbbr(profile.away_team))}.svg`}
                                    alt={getTeamAbbr(profile.away_team)}
                                    width={16}
                                    height={16}
                                    className="object-contain w-full h-full p-0.5"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const parent = target.parentElement;
                                      if (parent) {
                                        const fallback = document.createElement('div');
                                        fallback.className = 'w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-800 text-[8px] font-bold';
                                        fallback.textContent = getTeamAbbr(profile.away_team)?.substring(0, 2) || '?';
                                        parent.appendChild(fallback);
                                      }
                                    }}
                                  />
                                </div>
                              </>
                            ) : (
                              <>
                                <span>@</span>
                                <div className="w-4 h-4 relative flex-shrink-0">
                                  <Image
                                    src={`/images/mlb-teams/${getTeamLogoFilename(getTeamAbbr(profile.home_team))}.svg`}
                                    alt={getTeamAbbr(profile.home_team)}
                                    width={16}
                                    height={16}
                                    className="object-contain w-full h-full p-0.5"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const parent = target.parentElement;
                                      if (parent) {
                                        const fallback = document.createElement('div');
                                        fallback.className = 'w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-800 text-[8px] font-bold';
                                        fallback.textContent = getTeamAbbr(profile.home_team)?.substring(0, 2) || '?';
                                        parent.appendChild(fallback);
                                      }
                                    }}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        )}
                        {isFavorite && (
                          <Heart className="w-3 h-3 fill-current text-red-500" />
                        )}
                      </div>
                    </div>
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
                                  className="fill-slate-500 dark:fill-slate-400 text-[10px] font-medium"
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
                  <div
                    className={`flex items-center justify-center rounded-lg shadow-sm ${getPercentageColor(hitRateL10)}`}
                  >
                    <div className="py-2 px-3 font-medium text-sm sm:text-base">
                      {hitRateL10}%
                    </div>
                  </div>
                </TableCell>

                {/* L20 Hit Rate */}
                <TableCell className="p-0.5 sm:p-1">
                  <div
                    className={`flex items-center justify-center rounded-lg shadow-sm ${getPercentageColor(hitRateL20)}`}
                  >
                    <div className="py-2 px-3 font-medium text-sm sm:text-base">
                      {hitRateL20}%
                    </div>
                  </div>
                </TableCell>

                {/* Season Hit Rate (only show if not custom tier) */}
                {customTier === null && (
                  <TableCell className="p-0.5 sm:p-1">
                    <div
                      className={`flex items-center justify-center rounded-lg shadow-sm ${getPercentageColor(seasonHitRate)}`}
                    >
                      <div className="py-2 px-3 font-medium text-sm sm:text-base">
                        {Math.round(seasonHitRate)}%
                      </div>
                    </div>
                  </TableCell>
                )}

                {/* Best Odds */}
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
                  <div className="flex gap-1 justify-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "min-w-[32px] px-1.5",
                              "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-400",
                              "dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30 dark:hover:text-emerald-300",
                              "border-emerald-500/20",
                              !getBestOddsForBetType(profile, customTier, "over") && "opacity-50 cursor-not-allowed",
                            )}
                            onClick={() => handleAddToBetslip(profile, "over")}
                            disabled={!getBestOddsForBetType(profile, customTier, "over")}
                          >
                            <Plus className="w-2.5 h-2.5 mr-0.5" />
                            O
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {getBestOddsForBetType(profile, customTier, "over")
                            ? "Add Over to betslip"
                            : "No odds available for Over"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "min-w-[32px] px-1.5",
                              "bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400",
                              "dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30 dark:hover:text-red-300",
                              "border-red-500/20",
                              !getBestOddsForBetType(profile, customTier, "under") && "opacity-50 cursor-not-allowed",
                            )}
                            onClick={() => handleAddToBetslip(profile, "under")}
                            disabled={!getBestOddsForBetType(profile, customTier, "under")}
                          >
                            <Plus className="w-2.5 h-2.5 mr-0.5" />
                            U
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {getBestOddsForBetType(profile, customTier, "under")
                            ? "Add Under to betslip"
                            : "No odds available for Under"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
          </Table>
        </div>
      </div>

      <BetslipDialog 
        open={showBetslipDialog} 
        onOpenChange={setShowBetslipDialog} 
        selection={pendingSelection} 
      />

      {/* Conflict Resolution Dialog */}
      <Dialog 
        open={conflictingSelection !== null} 
        onOpenChange={() => handleResolveConflict(false)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Replace Existing Selection?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">You already have a selection for this player:</p>

            {conflictingSelection && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg border bg-muted/50">
                  <div className="text-xs font-medium text-foreground mb-0.5">
                    {Math.ceil(conflictingSelection.existingSelection.line || 0)}+ {" "}
                    {conflictingSelection.existingSelection.market_key
                      .split("_")
                      .map((word) =>
                        word.toLowerCase() === "mlb" ? "MLB" : word.charAt(0).toUpperCase() + word.slice(1),
                      )
                      .join(" ")}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {conflictingSelection.existingSelection.player_name}
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="p-3 rounded-lg border bg-primary/5">
                  <div className="text-xs font-medium text-foreground mb-0.5">
                    {Math.ceil(conflictingSelection.newSelection.line || 0)}+ {" "}
                    {conflictingSelection.newSelection.market_key
                      .split("_")
                      .map((word) =>
                        word.toLowerCase() === "mlb" ? "MLB" : word.charAt(0).toUpperCase() + word.slice(1),
                      )
                      .join(" ")}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {conflictingSelection.newSelection.player_name}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleResolveConflict(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleResolveConflict(true)} className="bg-primary">
              Replace Selection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}