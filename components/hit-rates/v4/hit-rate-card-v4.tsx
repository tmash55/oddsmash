"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, TrendingUp, TrendingDown, Minus, Info, X, Scale, Clock, ArrowUp, ArrowDown, ArrowUpDown, Plus } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Image from "next/image"
import type { PlayerHitRateProfile, TimeWindow } from "@/types/hit-rates"
import { BarChart, Bar, YAxis, ResponsiveContainer, Cell, ReferenceLine, LabelList, Tooltip as RechartsTooltip, XAxis } from "recharts"
import { useMediaQuery } from "@/hooks/use-media-query"
import { sportsbooks } from "@/data/sportsbooks"
import DualOddsCell from "@/components/shared/dual-odds-cell"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { useBetActions } from "@/hooks/use-bet-actions"
import { BetslipDialog } from "@/components/betting/betslip-dialog"
import { getMarketApiKey, getMarketsForSport, type SportMarket } from "@/lib/constants/markets"

// Helper function to get market-specific terminology
const getMarketTerminology = (market: SportMarket) => {
  const marketMap: Record<string, { singular: string; plural: string; label: "Line" }> = {
    "Hits": { singular: "Hit", plural: "Hits", label: "Line" },
    "Strikeouts": { singular: "Strikeout", plural: "Strikeouts", label: "Line" },
    "Total Bases": { singular: "Total Base", plural: "Total Bases", label: "Line" },
    "RBI": { singular: "RBI", plural: "RBIs", label: "Line" },
    "RBIs": { singular: "RBI", plural: "RBIs", label: "Line" },
    "Runs": { singular: "Run", plural: "Runs", label: "Line" },
    "Home Runs": { singular: "Home Run", plural: "Home Runs", label: "Line" },
    "Walks": { singular: "Walk", plural: "Walks", label: "Line" },
    "Stolen Bases": { singular: "Stolen Base", plural: "Stolen Bases", label: "Line" },
  }
  
  return marketMap[market] || { singular: "Unit", plural: "Units", label: "Line" }
}

// Helper function to format tier options with market context
const formatTierOption = (tier: number, market: SportMarket): string => {
  const terminology = getMarketTerminology(market)
  
  if (tier === 1) {
    return `1 ${terminology.singular}`
  } else {
    return `${tier}+ ${terminology.plural}`
  }
}

// Helper function to map hit rate market to market value
const mapHitRateMarketToMarketValue = (hitRateMarket: string): string => {
  const hitRateToApiMarketMap: Record<string, string> = {
    "Hits": "Hits",
    "Home Runs": "Home_Runs", 
    "RBIs": "RBIs",
    "RBI": "RBIs",
    "Total Bases": "Total_Bases",
    "Runs": "Runs",
    "Stolen Bases": "Stolen_Bases",
    "Strikeouts": "Strikeouts",
    "Walks": "Walks",
    "Earned Runs": "Earned_Runs",
    "Hits Allowed": "Hits_Allowed",
    "Walks Allowed": "Walks_Allowed",
    "Outs": "Outs_Recorded"
  }
  
  return hitRateToApiMarketMap[hitRateMarket] || hitRateMarket.replace(/\s+/g, "_")
}

// Helper function to create betslip selection
const createBetslipSelection = (
  profile: PlayerHitRateProfile,
  customTier: number | null,
  betType: "over" | "under" = "over"
) => {
  // Map the hit rate market to the market value format
  const marketValue = mapHitRateMarketToMarketValue(profile.market)
  
  // Get the correct market API key, including alternates if available
  const markets = getMarketsForSport("baseball_mlb")
  const marketConfig = markets.find((m) => m.value === marketValue)
  
  const marketKey = marketConfig ? (
    marketConfig.hasAlternates && marketConfig.alternateKey ? 
    `${marketConfig.apiKey},${marketConfig.alternateKey}` : 
    marketConfig.apiKey
  ) : getMarketApiKey("baseball_mlb", marketValue)
  
  // Get best odds for the specific bet type - simplified for card view
  const getBestOddsForCard = (profile: PlayerHitRateProfile, betType: "over" | "under") => {
    // For custom tiers, the betting line is 0.5 less than the tier (e.g., 3+ bases = 2.5 line)
    const targetLine = customTier !== null ? customTier - 0.5 : profile.line
    
    // Check if we have fresh Redis structure with lines data
    if (profile.all_odds && profile.all_odds.lines) {
      const lineData = profile.all_odds.lines[targetLine.toString()]
      
      if (lineData) {
        let bestOdds = -Infinity
        let bestBook = ""
        
        Object.entries(lineData).forEach(([sportsbook, bookData]: [string, any]) => {
          if (bookData && bookData[betType] && typeof bookData[betType].price === 'number') {
            const odds = bookData[betType].price
            if (odds > bestOdds) {
              bestOdds = odds
              bestBook = sportsbook
            }
          }
        })
        
        if (bestOdds !== -Infinity) {
          return { american: bestOdds, sportsbook: bestBook }
        }
      }
    }
    
    // For over bets, check old format
    if (betType === "over" && profile.all_odds) {
      // The old format uses the betting line as the key (e.g., "2.5" for 3+ bases)
      const lineKey = targetLine.toString()
      const relevantOdds = lineKey ? profile.all_odds[lineKey] : null
      
      if (relevantOdds) {
        let bestOdds = -Infinity
        let bestBook = ""
        
        Object.entries(relevantOdds).forEach(([book, bookData]) => {
          if (bookData && typeof bookData === 'object' && 'odds' in bookData) {
            const currentOdds = Number(bookData.odds)
            if (!isNaN(currentOdds) && currentOdds > bestOdds) {
              bestOdds = currentOdds
              bestBook = book
            }
          }
        })
        
        if (bestOdds !== -Infinity) {
          return { american: bestOdds, sportsbook: bestBook }
        }
      }
    }
    
    return null
  }
  
  const bestOdds = getBestOddsForCard(profile, betType)
  
  // Create odds_data object
  const odds_data: Record<string, {
    odds: number,
    line?: number,
    link?: string,
    sid?: string,
    last_update: string
  }> = {}
  
  // Use line from custom tier or profile
  // For custom tiers, the betting line is 0.5 less than the tier (e.g., 3+ bases = 2.5 line)
  const line = customTier !== null ? customTier - 0.5 : profile.line
  
  // Add best odds if available
  if (bestOdds) {
    odds_data[bestOdds.sportsbook] = {
      odds: bestOdds.american,
      line: line, // Use the calculated line (already adjusted for custom tiers)
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
    selection: betType === "over" ? "Over" : "Under",
    player_name: profile.player_name,
    player_id: profile.player_id,
    player_team: profile.team_name,
    line: line,
    odds_data: odds_data
  }
}

interface HitRateCardV4Props {
  profile: PlayerHitRateProfile
  customTier: number | null
  selectedTimeWindow: TimeWindow
  getPlayerData: (playerId: number) => {
    teamAbbreviation: string
    positionAbbreviation: string
  }
  getBestOddsForProfile: (profile: PlayerHitRateProfile) => any | null
  onSort?: (field: string, direction: "asc" | "desc") => void
  sortField?: string
  sortDirection?: "asc" | "desc"
}

interface GameData {
  value: number
  isHit: boolean
  scaledValue: number
  isZero: boolean
  opponent: string
  isHome: boolean
  date: string
}

// Mobile info modal component
function InfoModal({
  isOpen,
  onClose,
  profile,
  customTier,
}: { isOpen: boolean; onClose: () => void; profile: PlayerHitRateProfile; customTier: number | null }) {
  if (!isOpen) return null

  const terminology = getMarketTerminology(profile.market as SportMarket)
  const thresholdText = customTier !== null 
    ? formatTierOption(customTier, profile.market as SportMarket)
    : `${profile.line} ${terminology.plural}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 w-[320px] max-w-[90vw]">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold">Chart Information</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-3 text-sm">
          <p>Each bar represents a single game, with the most recent on the right.</p>
          <p>Green bars show when the player hit the over, red bars show misses.</p>
          <p>The purple line shows the {thresholdText} threshold{customTier !== null ? ' (custom line)' : ''}.</p>
          <div className="flex items-center mt-2">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>Hit (value &gt;= {customTier !== null ? customTier : profile.line})</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span>Miss (value &lt; {customTier !== null ? customTier : profile.line})</span>
          </div>
          <div className="flex items-center">
            <div className="h-[2px] w-6 bg-purple-500 mr-2"></div>
            <span>Line threshold ({thresholdText})</span>
          </div>
        </div>
        <Button className="w-full mt-4" onClick={onClose}>
          Got it
        </Button>
      </div>
    </div>
  )
}

// Function to calculate hit rate with a custom tier value
const calculateHitRateWithCustomTier = (profile: PlayerHitRateProfile, customTier: number, timeWindow: "last_5" | "last_10" | "last_20"): number => {
  const histogram = profile.points_histogram[timeWindow];
  const totalGames = Object.values(histogram).reduce((sum, count) => sum + count, 0);
  
  if (totalGames === 0) return 0;
  
  let gamesHittingTier = 0;
  Object.entries(histogram).forEach(([value, count]) => {
    if (Number(value) >= customTier) {
      gamesHittingTier += count;
    }
  });
  
  return Math.round((gamesHittingTier / totalGames) * 100);
}

const COLORS = {
  hit: "rgb(34, 197, 94)", // text-green-500
  miss: "rgb(239, 68, 68)", // text-red-500
  line: "rgb(168, 85, 247)", // text-purple-500
  zero: "rgb(239, 68, 68)", // text-red-500 (changed from gray to red)
};

// Helper function to get team logo filename
function getTeamLogoFilename(abbr: string | undefined): string {
  if (!abbr) return 'DEFAULT';
  
  const teamMap: Record<string, string> = {
    'ARI': 'AZ',
    'ATH': 'OAK',
    'AT': 'OAK', 
    'A': 'OAK',
    'CWS': 'CHW'
  };
  
  return teamMap[abbr.toUpperCase()] || abbr.toUpperCase() || 'DEFAULT';
}

// V4 Odds Cell Component - copied from table
interface V4OddsCellProps {
  profile: PlayerHitRateProfile
  customTier: number | null
  betType: "over" | "under"
  freshOdds?: any
  compact?: boolean
}

function V4OddsCell({ profile, customTier, betType, freshOdds, compact = false }: V4OddsCellProps) {
  const line = customTier !== null ? customTier : profile.line;
  
  // Helper function to find sportsbook data by name
  const getSportsbookData = (sportsbookName: string) => {
    return sportsbooks.find(sb => 
      sb.name.toLowerCase() === sportsbookName.toLowerCase() ||
      sb.id.toLowerCase() === sportsbookName.toLowerCase()
    );
  };

  // Helper function to render odds with sportsbook logo
  const renderOddsWithLogo = (odds: number, sportsbookName: string, link?: string | null, compact: boolean = false) => {
    const sportsbookData = getSportsbookData(sportsbookName);
    
    if (compact) {
      return (
        <div className="flex items-center justify-center">
          <div 
            className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded text-xs font-medium cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
            onClick={() => link && window.open(link, "_blank")}
          >
            <span>{odds > 0 ? `+${odds}` : odds}</span>
            {sportsbookData && (
              <div className="w-3 h-2 flex items-center justify-center">
                <Image
                  src={sportsbookData.logo}
                  alt={sportsbookData.name}
                  width={12}
                  height={8}
                  className="object-contain max-w-3 max-h-2"
                />
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-center w-full">
        <div 
          className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 font-semibold cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 shadow-sm w-full justify-center text-sm"
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
    const oddsData = betType === "over" ? resolvedOdds.over : resolvedOdds.under;
    
    if (oddsData) {
      return renderOddsWithLogo(oddsData.odds, oddsData.sportsbook, oddsData.link, compact);
    }
  }
  
  // Priority 2: Check if profile.all_odds contains fresh Redis structure with lines data
  if (profile.all_odds && profile.all_odds.lines) {
    const lineData = profile.all_odds.lines[line.toString()];
    
    if (lineData) {
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
        return renderOddsWithLogo(bestOdds, bestBook, bestLink, compact);
      }
    }
  }
  
  // Priority 3: Check embedded all_odds with old format (over only for now)
  if (betType === "over" && profile.all_odds) {
    const lineKey = customTier !== null ? (customTier - 0.5).toString() : profile.line?.toString();
    const relevantOdds = lineKey ? profile.all_odds[lineKey] : null;
    
    if (relevantOdds) {
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
        const linkData = relevantOdds[bestBook];
        const link = linkData?.over_link || linkData?.link;
        
        return renderOddsWithLogo(bestOdds, bestBook, link, compact);
      }
    }
  }
  
  // No odds available
  return (
    <div className="flex items-center justify-center w-full">
      <div className={cn(
        "text-gray-500 dark:text-gray-400 text-center",
        compact 
          ? "bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs"
          : "bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 w-full text-sm"
      )}>
        —
      </div>
    </div>
  );
}

export default function HitRateCardV4({
  profile,
  customTier,
  selectedTimeWindow,
  getPlayerData,
  getBestOddsForProfile,
  onSort,
  sortField = "L10",
  sortDirection = "desc",
}: HitRateCardV4Props) {
  const [showBetslipDialog, setShowBetslipDialog] = useState(false)
  const [pendingSelection, setPendingSelection] = useState<any>(null)

  const { betslips, handleBetslipSelect, handleCreateBetslip, conflictingSelection, handleResolveConflict } =
    useBetActions()
    
  // Function to handle adding to betslip
  const handleAddToBetslip = (type: "over" | "under" = "over") => {
    const selection = createBetslipSelection(profile, customTier, type)
    setPendingSelection(selection)
    setShowBetslipDialog(true)
  }
    
  const [showInfoModal, setShowInfoModal] = useState(false)
  const previousCustomTierRef = useRef<number | null>(customTier);

  // Check if the user is on mobile
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Get player data including team and position
  const playerData = getPlayerData(profile.player_id) || { teamAbbreviation: "", positionAbbreviation: "" }
  const teamAbbreviation = playerData.teamAbbreviation || profile.team_name || "UNK"
  const positionAbbreviation = playerData.positionAbbreviation || "N/A"

  // Generate MLB headshot URL
  const playerHeadshotUrl = `https://img.mlbstatic.com/mlb-photos/image/upload/w_240,q_auto:good,f_auto/v1/people/${profile.player_id}/headshot/67/current`

  // Format game time from ISO string
  const formatGameTime = (timeString?: string): string => {
    if (!timeString) return "TBD";
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      return "TBD";
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

  // Get game info using same logic as table for consistency
  const getActualMatchupInfo = () => {
    if (!profile.away_team || !profile.home_team || !teamAbbreviation) {
      return {
        opponent: "TBD",
        isHome: true,
        matchupText: "TBD",
        time: "TBD",
      }
    }

    const awayTeamAbbr = getTeamAbbreviation(profile.away_team)
    const homeTeamAbbr = getTeamAbbreviation(profile.home_team)

    const isPlayerTeamHome = teamAbbreviation === homeTeamAbbr || 
                            (homeTeamAbbr && homeTeamAbbr.includes(teamAbbreviation)) || 
                            (teamAbbreviation && teamAbbreviation.includes(homeTeamAbbr))

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

  const gameInfo = getActualMatchupInfo();

  // Get color for hit rate
  const getHitRateColor = (rate: number): string => {
    if (rate >= 75) return "text-green-600 dark:text-green-400"
    if (rate >= 60) return "text-blue-600 dark:text-blue-400"
    if (rate >= 50) return "text-amber-600 dark:text-amber-400"
    return "text-red-600 dark:text-red-400"
  }

  // Get background color for hit rate badge
  const getHitRateBgColor = (rate: number): string => {
    if (rate >= 90) return "bg-green-200 dark:bg-green-800/50 text-green-900 dark:text-green-200"
    if (rate >= 80) return "bg-green-100 dark:bg-green-800/40 text-green-800 dark:text-green-300"
    if (rate >= 70) return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
    if (rate >= 60) return "bg-green-50 dark:bg-green-900/25 text-green-700 dark:text-green-400"
    if (rate >= 50) return "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
    if (rate >= 40) return "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
    if (rate >= 30) return "bg-red-50 dark:bg-red-900/25 text-red-700 dark:text-red-400"
    if (rate >= 20) return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
    if (rate >= 10) return "bg-red-100 dark:bg-red-800/40 text-red-800 dark:text-red-300"
    return "bg-red-200 dark:bg-red-800/50 text-red-900 dark:text-red-200"
  }

  // Get trend indicator
  const getTrend = (): "up" | "down" | "neutral" => {
    const l5 = customTier !== null 
      ? calculateHitRateWithCustomTier(profile, customTier, "last_5")
      : profile.last_5_hit_rate;
    
    const l10 = customTier !== null
      ? calculateHitRateWithCustomTier(profile, customTier, "last_10")
      : profile.last_10_hit_rate;

    if (l5 > l10 + 5) return "up"
    if (l5 < l10 - 5) return "down"
    return "neutral"
  }

  // Get trend icon and color
  const getTrendDisplay = () => {
    const trend = getTrend();
    if (trend === "up") {
      return {
        icon: <TrendingUp className="h-3 w-3" />,
        color: "text-green-500",
        bgColor: "bg-green-100 dark:bg-green-900/30",
        borderColor: "border-green-500",
      }
    } else if (trend === "down") {
      return {
        icon: <TrendingDown className="h-3 w-3" />,
        color: "text-red-500",
        bgColor: "bg-red-100 dark:bg-red-900/30",
        borderColor: "border-red-500",
      }
    } else {
      return {
        icon: <Minus className="h-3 w-3" />,
        color: "text-gray-500",
        bgColor: "bg-gray-100 dark:bg-gray-800",
        borderColor: "border-gray-400",
      }
    }
  }

  const trendDisplay = getTrendDisplay()

  // Calculate hit rate based on selected time window and custom tier
  const getHitRate = (): number => {
    if (customTier === null) {
      return selectedTimeWindow === "5_games"
        ? profile.last_5_hit_rate
        : selectedTimeWindow === "10_games"
          ? profile.last_10_hit_rate
          : profile.last_20_hit_rate
    }

    const windowKey =
      selectedTimeWindow === "5_games" ? "last_5" : selectedTimeWindow === "10_games" ? "last_10" : "last_20"

    return calculateHitRateWithCustomTier(profile, customTier, windowKey);
  }

  // Get the hit rate value
  const hitRate = getHitRate()

  // Get the number of games in the selected time window
  const getGamesCount = (): number => {
    const windowKey =
      selectedTimeWindow === "5_games" ? "last_5" : selectedTimeWindow === "10_games" ? "last_10" : "last_20"
    const histogram = profile.points_histogram[windowKey]
    return Object.values(histogram).reduce((sum, count) => sum + count, 0)
  }

  // Calculate the number of hits and games
  const gamesCount = getGamesCount()
  const hitsCount = Math.round(gamesCount * (hitRate / 100))

  // Add these functions for graph functionality
  const getChartMaxForMarket = (): number => {
    switch (profile.market) {
      case 'Home Runs':
        return 4
      case 'Hits':
        return 5
      case 'Total Bases':
        return 10
      case 'RBIs':
        return 6
      case 'Singles':
        return 4
      case 'Doubles':
        return 3
      case 'Triples':
        return 2
      case 'Strikeouts':
        return 12
      case 'Earned Runs':
        return 6
      default:
        return 5
    }
  }

  const getRecentGamesData = (): GameData[] => {
    const gamesCount = selectedTimeWindow === "5_games" ? 5 : selectedTimeWindow === "10_games" ? 10 : 20;
    
    // Safety check for recent_games
    if (!profile.recent_games || !Array.isArray(profile.recent_games) || profile.recent_games.length === 0) {
      return [];
    }
    
    // Take first N games and reverse them to match table view
    const recentGames = profile.recent_games.slice(0, gamesCount).reverse();
    const lineValue = customTier !== null ? customTier : profile.line;

    // Process the games data with safety checks
    const gamesData = recentGames.map((game) => ({
      value: game?.value || 0,
      isHit: (game?.value || 0) >= lineValue,
      scaledValue: game?.value || 0,
      isZero: (game?.value || 0) === 0,
      opponent: game?.opponent_abbr || "TBD",
      isHome: game?.is_home || false,
      date: game?.date || ""
    }));

    return gamesData;
  }

  // Update scaling functions to work with raw values
  const needsScaling = (values: number[]): boolean => {
    return Math.max(...values) > getChartMaxForMarket();
  }

  const getChartScale = (values: number[]): number => {
    return Math.max(...values) / getChartMaxForMarket();
  }

  const getMinBarHeight = (): number => {
    return isMobile ? 30 : 40
  }

  // Add handleSort function
  const handleSort = (field: string) => {
    if (onSort) {
      // Get the current effective sort field (without _custom suffix)
      const currentBaseField = field.replace("_custom", "");
      
      // Determine the new direction
      const newDirection = currentBaseField === sortField && sortDirection === "desc" ? "asc" : "desc";

      // If we're sorting by hit rates and have a custom tier
      if (customTier !== null && (field === "L5" || field === "L10" || field === "L20")) {
        onSort(`${field}_custom`, newDirection);
      } else {
        onSort(field, newDirection);
      }
    }
  };

  // Add sort icon helper
  const getSortIcon = (field: string) => {
    if (field !== sortField) return null
    return sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
  }

  // Calculate home/away splits from recent games
  const getHomeAwaySplits = () => {
    const recentGames = getRecentGamesData()
    if (recentGames.length === 0) {
      return { home: { hits: 0, total: 0, rate: 0 }, away: { hits: 0, total: 0, rate: 0 } }
    }

    const homeGames = recentGames.filter(game => game.isHome)
    const awayGames = recentGames.filter(game => !game.isHome)

    const homeHits = homeGames.filter(game => game.isHit).length
    const awayHits = awayGames.filter(game => game.isHit).length

    return {
      home: {
        hits: homeHits,
        total: homeGames.length,
        rate: homeGames.length > 0 ? Math.round((homeHits / homeGames.length) * 100) : 0
      },
      away: {
        hits: awayHits,
        total: awayGames.length,
        rate: awayGames.length > 0 ? Math.round((awayHits / awayGames.length) * 100) : 0
      }
    }
  }

  // Get max available games for home/away splits (up to 20 games)
  const getMaxAvailableGamesData = (): GameData[] => {
    // Safety check for recent_games
    if (!profile.recent_games || !Array.isArray(profile.recent_games) || profile.recent_games.length === 0) {
      return [];
    }
    
    // Take up to 20 games and reverse them to match table view
    const maxGames = Math.min(profile.recent_games.length, 20);
    const recentGames = profile.recent_games.slice(0, maxGames).reverse();
    const lineValue = customTier !== null ? customTier : profile.line;

    // Process the games data with safety checks
    const gamesData = recentGames.map((game) => ({
      value: game?.value || 0,
      isHit: (game?.value || 0) >= lineValue,
      scaledValue: game?.value || 0,
      isZero: (game?.value || 0) === 0,
      opponent: game?.opponent_abbr || "TBD",
      isHome: game?.is_home || false,
      date: game?.date || ""
    }));

    return gamesData;
  }

  // Calculate home/away splits from max available games
  const getMaxGameHomeAwaySplits = () => {
    const maxGames = getMaxAvailableGamesData()
    if (maxGames.length === 0) {
      return { 
        home: { hits: 0, total: 0, rate: 0 }, 
        away: { hits: 0, total: 0, rate: 0 },
        totalGames: 0
      }
    }

    const homeGames = maxGames.filter(game => game.isHome)
    const awayGames = maxGames.filter(game => !game.isHome)

    const homeHits = homeGames.filter(game => game.isHit).length
    const awayHits = awayGames.filter(game => game.isHit).length

    return {
      home: {
        hits: homeHits,
        total: homeGames.length,
        rate: homeGames.length > 0 ? Math.round((homeHits / homeGames.length) * 100) : 0
      },
      away: {
        hits: awayHits,
        total: awayGames.length,
        rate: awayGames.length > 0 ? Math.round((awayHits / awayGames.length) * 100) : 0
      },
      totalGames: maxGames.length
    }
  }

  const homeAwaySplits = getMaxGameHomeAwaySplits()

  return (
    <>
    <Card className={cn(
      "relative transition-all duration-200 hover:shadow-lg",
      isMobile 
        ? "mx-2 mb-4 rounded-xl shadow-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800" 
        : "hover:shadow-md"
    )}>
      <CardHeader className={cn(
        "flex flex-row items-center justify-between",
        isMobile ? "p-4 pb-3" : "p-3 pb-2"
      )}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Player Avatar & Team Logo */}
          <div className="relative">
            <Avatar className={cn(
              isMobile ? "h-12 w-12" : "h-10 w-10",
              "border-2 border-slate-200 shadow-sm overflow-hidden"
            )}>
              <div data-image-id={profile.player_id} className="w-full h-full">
                <AvatarImage
                  src={playerHeadshotUrl || "/placeholder.svg"}
                  alt={profile.player_name}
                  className="object-cover w-full h-full"
                  onError={() => {
                    const fallback = document.createElement("div")
                    fallback.className = "w-full h-full flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium"
                    fallback.textContent = profile.player_name.split(" ").map((n) => n[0]).join("").slice(0, 2)
                    
                    const imgContainer = document.querySelector(`[data-image-id="${profile.player_id}"]`)
                    if (imgContainer) {
                      imgContainer.innerHTML = ""
                      imgContainer.appendChild(fallback)
                    }
                  }}
                />
              </div>
              <AvatarFallback className="text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {profile.player_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className={cn(
              "absolute -bottom-1 -right-1 rounded-full bg-white dark:bg-gray-900 p-0.5 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center",
              isMobile ? "w-6 h-6" : "w-5 h-5"
            )}>
              <div className={cn(
                "relative flex items-center justify-center",
                isMobile ? "w-4 h-4" : "w-3 h-3"
              )}>
                <Image
                  src={`/images/mlb-teams/${(teamAbbreviation || 'default').toUpperCase()}.svg`}
                  alt={teamAbbreviation || 'Team'}
                  fill
                  className="object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg?height=20&width=20"
                  }}
                />
              </div>
            </div>
          </div>

          {/* Player Info */}
          <div className="min-w-0 flex-1">
            <h3 className={cn(
              "font-semibold truncate",
              isMobile ? "text-lg leading-tight" : "text-sm"
            )}>
              {profile.player_name}
            </h3>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className={cn(isMobile ? "text-sm" : "text-xs")}>
                {teamAbbreviation} • {positionAbbreviation}
              </span>
            </div>
          </div>
        </div>

        {/* Over/Under Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "min-w-[32px] px-1.5",
              "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-400",
              "dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30 dark:hover:text-emerald-300",
              "border-emerald-500/20",
            )}
            onClick={() => handleAddToBetslip("over")}
          >
            <Plus className="w-2.5 h-2.5 mr-0.5" />
            O
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "min-w-[32px] px-1.5",
              "bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400",
              "dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30 dark:hover:text-red-300",
              "border-red-500/20",
            )}
            onClick={() => handleAddToBetslip("under")}
          >
            <Plus className="w-2.5 h-2.5 mr-0.5" />
            U
          </Button>
        </div>
      </CardHeader>

      {/* Modal for mobile devices */}
      {isMobile && <InfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} profile={profile} customTier={customTier} />}

      <CardContent className={cn(isMobile ? "p-4 pt-0" : "p-3 pt-2")}>
        {/* Market & Line Info with Odds */}
        <div className={cn(
          "flex justify-between items-center",
          isMobile ? "mb-4" : "mb-2"
        )}>
          <div className="flex items-center">
            <div className={cn(
              "px-2 py-1 bg-purple-100 text-purple-900 dark:bg-purple-900/50 dark:text-purple-200 rounded-lg font-bold inline-block border border-purple-200 dark:border-purple-700",
              isMobile ? "text-sm" : "text-xs"
            )}>
              {customTier !== null ? (
                <>
                  {customTier}+
                  <span className={cn(
                    "ml-1 opacity-60",
                    isMobile ? "text-xs" : "text-[9px]"
                  )}>({profile.line.toFixed(1)})</span>
                </>
              ) : (
                profile.line.toFixed(1)
              )}
            </div>
            <span className={cn(
              "font-medium ml-2",
              isMobile ? "text-sm" : "text-xs"
            )}>{profile.market}</span>
          </div>

          {/* Compact Odds Display */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">O</span>
              <V4OddsCell
                profile={profile}
                customTier={customTier}
                betType="over"
                freshOdds={null}
                compact={true}
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">U</span>
              <V4OddsCell
                profile={profile}
                customTier={customTier}
                betType="under"
                freshOdds={null}
                compact={true}
              />
            </div>
          </div>
        </div>

        {/* Game Info - Better positioned */}
        <div className={cn(
          "flex items-center justify-center gap-1",
          isMobile ? "mb-3" : "mb-2"
        )}>
          <span className={cn(
            "px-2 py-1 bg-green-100 text-green-900 dark:bg-green-900/50 dark:text-green-200 rounded font-bold border border-green-200 dark:border-green-700",
            isMobile ? "text-sm" : "text-xs"
          )}>
            {gameInfo.matchupText}
          </span>
          <span className={cn(
            "px-2 py-1 bg-blue-100 text-blue-900 dark:bg-blue-900/50 dark:text-blue-200 rounded font-bold border border-blue-200 dark:border-blue-700",
            isMobile ? "text-sm" : "text-xs"
          )}>
            {gameInfo.time}
          </span>
        </div>

        {/* Hit Rate Stats - Enhanced for mobile */}
        <div className={cn(
          `grid gap-3 ${customTier !== null ? 'grid-cols-3' : 'grid-cols-4'}`,
          isMobile ? "mb-4" : "mb-3"
        )}>
          <Button 
            variant="ghost" 
            className={cn(
              "flex flex-col items-center p-0 h-auto hover:bg-transparent active:scale-95 transition-transform",
              isMobile ? "py-2" : ""
            )}
            onClick={() => handleSort("L5")}
          >
            <span className={cn(
              "text-gray-500 dark:text-gray-400 mb-1 flex items-center font-medium",
              isMobile ? "text-sm" : "text-xs"
            )}>
              L5 {getSortIcon("L5")}
            </span>
            <span className={cn(
              `w-full text-center py-2 rounded-lg font-bold shadow-sm ${getHitRateBgColor(
                customTier !== null 
                  ? calculateHitRateWithCustomTier(profile, customTier, "last_5") 
                  : Math.round(profile.last_5_hit_rate)
              )}`,
              isMobile ? "text-base min-h-[44px] flex items-center justify-center" : "text-sm py-1"
            )}>
              {customTier !== null 
                ? calculateHitRateWithCustomTier(profile, customTier, "last_5") 
                : Math.round(profile.last_5_hit_rate)}%
            </span>
          </Button>
          <Button 
            variant="ghost" 
            className={cn(
              "flex flex-col items-center p-0 h-auto hover:bg-transparent active:scale-95 transition-transform",
              isMobile ? "py-2" : ""
            )}
            onClick={() => handleSort("L10")}
          >
            <span className={cn(
              "text-gray-500 dark:text-gray-400 mb-1 flex items-center font-medium",
              isMobile ? "text-sm" : "text-xs"
            )}>
              L10 {getSortIcon("L10")}
            </span>
            <span className={cn(
              `w-full text-center py-2 rounded-lg font-bold shadow-sm ${getHitRateBgColor(
                customTier !== null 
                  ? calculateHitRateWithCustomTier(profile, customTier, "last_10") 
                  : Math.round(profile.last_10_hit_rate)
              )}`,
              isMobile ? "text-base min-h-[44px] flex items-center justify-center" : "text-sm py-1"
            )}>
              {customTier !== null 
                ? calculateHitRateWithCustomTier(profile, customTier, "last_10") 
                : Math.round(profile.last_10_hit_rate)}%
            </span>
          </Button>
          <Button 
            variant="ghost" 
            className={cn(
              "flex flex-col items-center p-0 h-auto hover:bg-transparent active:scale-95 transition-transform",
              isMobile ? "py-2" : ""
            )}
            onClick={() => handleSort("L20")}
          >
            <span className={cn(
              "text-gray-500 dark:text-gray-400 mb-1 flex items-center font-medium",
              isMobile ? "text-sm" : "text-xs"
            )}>
              L20 {getSortIcon("L20")}
            </span>
            <span className={cn(
              `w-full text-center py-2 rounded-lg font-bold shadow-sm ${getHitRateBgColor(
                customTier !== null 
                  ? calculateHitRateWithCustomTier(profile, customTier, "last_20") 
                  : Math.round(profile.last_20_hit_rate)
              )}`,
              isMobile ? "text-base min-h-[44px] flex items-center justify-center" : "text-sm py-1"
            )}>
              {customTier !== null 
                ? calculateHitRateWithCustomTier(profile, customTier, "last_20") 
                : Math.round(profile.last_20_hit_rate)}%
            </span>
          </Button>
          {customTier === null && (
            <Button 
              variant="ghost" 
              className={cn(
                "flex flex-col items-center p-0 h-auto hover:bg-transparent active:scale-95 transition-transform",
                isMobile ? "py-2" : ""
              )}
              onClick={() => handleSort("seasonHitRate")}
            >
              <span className={cn(
                "text-gray-500 dark:text-gray-400 mb-1 flex items-center font-medium",
                isMobile ? "text-sm" : "text-xs"
              )}>
                2025 {getSortIcon("seasonHitRate")}
              </span>
              <span className={cn(
                `w-full text-center py-2 rounded-lg font-bold shadow-sm ${getHitRateBgColor(profile.season_hit_rate || 0)}`,
                isMobile ? "text-base min-h-[44px] flex items-center justify-center" : "text-sm py-1"
              )}>
                {Math.round(profile.season_hit_rate || 0)}%
              </span>
            </Button>
          )}
        </div>

        {/* Recent Games Chart - Enhanced for mobile */}
        <div className={cn(isMobile ? "mb-2" : "mb-1")}>
          <div className={cn(
            "flex justify-between items-center",
            isMobile ? "mb-3" : "mb-1"
          )}>
            <div className="flex items-center gap-2">
              <span className={cn(
                "font-semibold",
                isMobile ? "text-base" : "text-sm"
              )}>Recent Games</span>
              {isMobile ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-transform"
                  onClick={() => setShowInfoModal(true)}
                >
                  <Info className="h-4 w-4 text-gray-400" />
                </Button>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="w-56 p-2">
                      <p className="text-xs">Each bar represents a game, with most recent on the right.</p>
                      <p className="text-xs mt-1">Green bars = player hit the over, red = missed.</p>
                      <p className="text-xs mt-1">Purple line shows the {customTier !== null ? `${customTier}+ (custom)` : profile.line} threshold.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="flex items-center gap-4">
              {/* Average */}
              <div className="flex items-center gap-1">
                <span className={cn(
                  "text-gray-500 dark:text-gray-400",
                  isMobile ? "text-xs" : "text-[10px]"
                )}>Avg:</span>
                <span className={cn(
                  "font-bold",
                  profile.avg_stat_per_game >= profile.line
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400",
                  isMobile ? "text-sm" : "text-xs"
                )}>
                  {profile.avg_stat_per_game.toFixed(1)}
                </span>
              </div>
              
              {/* Trend */}
              <div className="flex items-center gap-1">
                <span className={cn(
                  "text-gray-500 dark:text-gray-400",
                  isMobile ? "text-xs" : "text-[10px]"
                )}>Trend:</span>
                <span className={trendDisplay.color}>{trendDisplay.icon}</span>
              </div>
              
              {/* Hit Rate */}
              <span className={cn(
                `font-semibold ${getHitRateColor(hitRate)}`,
                isMobile ? "text-sm" : "text-xs"
              )}>
                {hitsCount}/{gamesCount}
              </span>
            </div>
          </div>
        </div>

        {/* Chart section - Enhanced for mobile */}
        <div className={cn(
          "relative",
          isMobile ? "h-40 mt-2" : "h-36 mt-4"
        )}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={getRecentGamesData()} 
              margin={{ 
                top: isMobile ? 24 : 20, 
                right: isMobile ? 8 : 6, // Reduced from 16/14
                left: isMobile ? 8 : 6, // Reduced from 24/20
                bottom: isMobile ? 16 : 14
              }}
            >
              {/* Y-Axis with labels */}
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: isMobile ? 10 : 8,
                  fill: '#6B7280',
                  fontWeight: '500'
                }}
                domain={[0, getChartMaxForMarket()]}
                ticks={[0, customTier || profile.line, getChartMaxForMarket()]}
                width={isMobile ? 16 : 12} // Reduced from 20/16
              />
              
              {/* Enhanced Tooltip with game context */}
              <RechartsTooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as GameData;
                    const date = new Date(data.date);
                    const formattedDate = date.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    });
                    
                    return (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {formattedDate} {data.isHome ? 'vs' : '@'} {data.opponent}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {profile.market}: <span className="font-medium">{data.value}</span>
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {data.isHit ? '✅ Hit the over' : '❌ Missed the over'}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ fill: 'rgba(0,0,0,0.1)' }}
              />
              
              <ReferenceLine
                y={customTier || profile.line}
                stroke="#7C3AED" // More vibrant purple for better contrast
                strokeDasharray="3 3"
                strokeWidth={isMobile ? 3 : 2}
                label={{
                  value: `${customTier || profile.line}`,
                  position: "insideTopRight",
                  style: {
                    textAnchor: 'end',
                    fontSize: isMobile ? '12px' : '10px',
                    fontWeight: 'bold',
                    fill: '#7C3AED'
                  }
                }}
              />
              <Bar
                dataKey="scaledValue"
                minPointSize={isMobile ? 10 : 8}
                maxBarSize={isMobile ? 70 : 50} // Reduced from 80/60 to allow more room
                radius={isMobile ? [4, 4, 0, 0] : [2, 2, 0, 0]} // Rounded corners on mobile
              >
                {getRecentGamesData().map((game: GameData, index: number) => (
                  <Cell
                    key={index}
                    fill={game.isZero ? COLORS.zero : (game.isHit ? COLORS.hit : COLORS.miss)}
                    className="dark:opacity-90"
                  />
                ))}
                <LabelList
                  dataKey="value"
                  position="top"
                  content={({ x, y, width, value }) => (
                    <text
                      x={Number(x) + Number(width) / 2}
                      y={Number(y) - (isMobile ? 8 : 6)}
                      textAnchor="middle"
                      fill="currentColor"
                      className={cn(
                        "font-medium fill-gray-700 dark:fill-gray-300",
                        isMobile ? "text-sm" : "text-xs"
                      )}
                    >
                      {value}
                    </text>
                  )}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Game Info Row - Logo + Date for Every Game */}
        <div className={cn(
          "flex justify-between items-start px-2", // Reduced padding to match chart
          isMobile ? "mt-2 mb-4" : "mt-1 mb-3"
        )}>
          {getRecentGamesData().map((game: GameData, index: number) => {
            const logoSize = isMobile ? 12 : 10; // Small logos
            const teamLogo = getTeamLogoFilename(game.opponent);
            
            return (
              <div key={index} className="flex flex-col items-center flex-1 min-w-0">
                {/* Small Team Logo */}
                <div className={cn(
                  "bg-white/80 dark:bg-gray-800/80 rounded-full border border-gray-200/50 dark:border-gray-700/50 flex items-center justify-center mb-1",
                  isMobile ? "w-4 h-4" : "w-3 h-3"
                )}>
                  <Image
                    src={`/images/mlb-teams/${teamLogo}.svg`}
                    alt={game.opponent || 'Team'}
                    width={logoSize * 0.7}
                    height={logoSize * 0.7}
                    className="object-contain opacity-60" // More subtle
                    onError={(e) => {
                      // Fallback to team abbreviation text
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parentDiv = target.parentElement;
                      if (parentDiv) {
                        const abbreviation = getTeamAbbreviation(game.opponent).slice(0, 2);
                        parentDiv.innerHTML = `<span style="font-size: ${isMobile ? '6px' : '5px'}; color: #9CA3AF; font-weight: 600;">${abbreviation}</span>`;
                      }
                    }}
                  />
                </div>
                
                {/* Compact Date */}
                <div className={cn(
                  "text-gray-500 dark:text-gray-400 font-medium text-center leading-tight",
                  isMobile ? "text-[10px]" : "text-[8px]"
                )}>
                  {new Date(game.date).toLocaleDateString('en-US', { 
                    month: 'numeric', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer - Home/Away Splits */}
        <CardFooter className={cn(
          "border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900",
          isMobile ? "p-4 mt-4 rounded-b-xl" : "p-3"
        )}>
          <div className="w-full">
            <div className={cn(
              "flex items-center justify-between",
              isMobile ? "mb-3" : "mb-2"
            )}>
              <span className={cn(
                "font-semibold text-gray-700 dark:text-gray-300",
                isMobile ? "text-sm" : "text-xs"
              )}>
                Home/Away Splits
              </span>
              <span className={cn(
                "text-gray-500 dark:text-gray-400",
                isMobile ? "text-xs" : "text-[10px]"
              )}>
                L{homeAwaySplits.totalGames} games
              </span>
            </div>
            
            {homeAwaySplits.home.total > 0 || homeAwaySplits.away.total > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {/* Home Stats */}
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "text-gray-600 dark:text-gray-400 mb-1",
                    isMobile ? "text-xs" : "text-[10px]"
                  )}>
                    🏠 Home
                  </div>
                  <div className={cn(
                    "font-bold",
                    homeAwaySplits.home.rate >= 60 ? "text-green-600 dark:text-green-400" :
                    homeAwaySplits.home.rate >= 40 ? "text-yellow-600 dark:text-yellow-400" :
                    "text-red-600 dark:text-red-400",
                    isMobile ? "text-lg" : "text-sm"
                  )}>
                    {homeAwaySplits.home.total > 0 ? `${homeAwaySplits.home.rate}%` : '—'}
                  </div>
                  <div className={cn(
                    "text-gray-500 dark:text-gray-400",
                    isMobile ? "text-xs" : "text-[10px]"
                  )}>
                    {homeAwaySplits.home.hits}/{homeAwaySplits.home.total}
                  </div>
                </div>

                {/* Away Stats */}
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "text-gray-600 dark:text-gray-400 mb-1",
                    isMobile ? "text-xs" : "text-[10px]"
                  )}>
                    ✈️ Away
                  </div>
                  <div className={cn(
                    "font-bold",
                    homeAwaySplits.away.rate >= 60 ? "text-green-600 dark:text-green-400" :
                    homeAwaySplits.away.rate >= 40 ? "text-yellow-600 dark:text-yellow-400" :
                    "text-red-600 dark:text-red-400",
                    isMobile ? "text-lg" : "text-sm"
                  )}>
                    {homeAwaySplits.away.total > 0 ? `${homeAwaySplits.away.rate}%` : '—'}
                  </div>
                  <div className={cn(
                    "text-gray-500 dark:text-gray-400",
                    isMobile ? "text-xs" : "text-[10px]"
                  )}>
                    {homeAwaySplits.away.hits}/{homeAwaySplits.away.total}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 text-xs">
                No recent game data available
              </div>
            )}
          </div>
        </CardFooter>
      </CardContent>
    </Card>

    <BetslipDialog
      open={showBetslipDialog}
      onOpenChange={setShowBetslipDialog}
      selection={pendingSelection}
    />
  </>
  )
}