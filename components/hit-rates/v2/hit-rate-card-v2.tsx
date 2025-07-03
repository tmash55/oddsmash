"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, ExternalLink, TrendingUp, TrendingDown, Minus, Info, X, Scale, Clock, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Image from "next/image"
import type { PlayerHitRateProfile, TimeWindow } from "@/types/hit-rates"
import { BarChart, Bar, YAxis, ResponsiveContainer, Cell, ReferenceLine, LabelList } from "recharts"
import { useMediaQuery } from "@/hooks/use-media-query"
import { sportsbooks } from "@/data/sportsbooks"
import OddsCell from "@/components/shared/odds-cell"
import DualOddsCell from "@/components/shared/dual-odds-cell"

// Map team abbreviations to handle special cases and variations
const teamAbbreviationMap: Record<string, string> = {
  // Arizona Diamondbacks variations
  'ARI': 'AZ',  // Standard abbreviation maps to file name
  'ARIZONA': 'AZ',
  'DIAMONDBACKS': 'AZ',
  
  // Oakland Athletics variations
  'AT': 'OAK',
  
  // Keep other mappings as needed
  // 'SFG': 'SF'  // Example: If a file is named SF.svg but the abbreviation in data is SFG
};

// Function to get the correct file name for a team abbreviation
function getTeamLogoFilename(abbr: string): string {
  if (!abbr) return 'default';
  
  const upperAbbr = abbr.toUpperCase();
  return teamAbbreviationMap[upperAbbr] || abbr;
}

// Function to standardize team abbreviations for logo lookup
function getStandardAbbreviation(abbr: string): string {
  const map: Record<string, string> = {
    'AT': 'OAK',
    // Add more mappings as needed
  };
  return map[abbr] || abbr;
}

// Function to calculate hit rate with a custom tier value
const calculateHitRateWithCustomTier = (profile: PlayerHitRateProfile, customTier: number, timeWindow: "last_5" | "last_10" | "last_20"): number => {
  // Get the histogram data for the specified time window
  const histogram = profile.points_histogram[timeWindow];
  
  // Calculate total games and games where the player hit the custom tier
  const totalGames = Object.values(histogram).reduce((sum, count) => sum + count, 0);
  
  if (totalGames === 0) return 0;
  
  // Calculate games where player had >= custom tier
  let gamesHittingTier = 0;
  Object.entries(histogram).forEach(([value, count]) => {
    if (Number(value) >= customTier) {
      gamesHittingTier += count;
    }
  });
  
  // Calculate and return the hit rate percentage
  return Math.round((gamesHittingTier / totalGames) * 100);
}

// Add function to calculate custom tier season hit rate
const calculateSeasonHitRateWithCustomTier = (profile: PlayerHitRateProfile, customTier: number): number => {
  // For this example, we'll assume the season_hit_rate in the profile is based on the default line
  // We'd need a histogram of season data to properly calculate a custom tier rate
  // This is a simplified implementation - in a real app, you'd want histogram data for the season
  
  // For now, let's estimate the custom tier season hit rate by adjusting the original rate
  // This is just an approximation until you add the actual season histogram data
  if (customTier !== null && customTier !== profile.line) {
    // Simple adjustment: if increasing the tier, lower the hit rate; if decreasing, increase it
    const difference = customTier - profile.line;
    // Simple approximation - adjust by 10% per 0.5 difference in line
    const adjustmentFactor = 1 - (difference * 0.2);
    
    // Ensure the hit rate stays between 0-100%
    return Math.max(0, Math.min(100, Math.round(profile.season_hit_rate * adjustmentFactor)));
  }
  
  return profile.season_hit_rate;
}

interface HitRateCardV3Props {
  profile: PlayerHitRateProfile
  customTier: number | null
  selectedTimeWindow: TimeWindow
  getPlayerData: (playerId: number) => {
    teamAbbreviation: string
    positionAbbreviation: string
  }
  bestOdds?: {
    american: number
    decimal: number
    sportsbook: string
    link?: string | null
  } | null
  onSort?: (field: string, direction: "asc" | "desc") => void
  sortField?: string
  sortDirection?: "asc" | "desc"
}

// Mobile info modal component
function InfoModal({
  isOpen,
  onClose,
  profile,
  customTier,
}: { isOpen: boolean; onClose: () => void; profile: PlayerHitRateProfile; customTier: number | null }) {
  if (!isOpen) return null

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
          <p>The purple line shows the {customTier !== null ? `${customTier}+ (custom)` : profile.line} threshold.</p>
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
            <span>Line threshold ({customTier !== null ? `${customTier}+ (custom)` : profile.line})</span>
          </div>
        </div>
        <Button className="w-full mt-4" onClick={onClose}>
          Got it
        </Button>
      </div>
    </div>
  )
}

// Add helper to sort odds from best to worst (highest positive, then least negative)
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

// Add helper to safely extract odds value
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

// Add helper to safely get link from bookData
const getLinkFromBookData = (bookData: any): string | undefined => {
  if (bookData && bookData.over_link) {
    return bookData.over_link
  }
  
  if (bookData && bookData.link) {
    return bookData.link
  }

  return undefined
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

export default function HitRateCardV3({
  profile,
  customTier,
  selectedTimeWindow,
  getPlayerData,
  bestOdds,
  onSort,
  sortField = "L10",
  sortDirection = "desc",
}: HitRateCardV3Props) {
  // Format American odds
  const formatOdds = (odds: number): string => {
    // Handle NaN, undefined or null values
    if (odds === undefined || odds === null || isNaN(odds)) {
      return "-";
    }
    return odds > 0 ? `+${odds}` : odds.toString();
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
      "Arizona Diamondbacks": "AZ",
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
    return teamName
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
  }

  // Format the game time from ISO string to a readable format
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

  // Get player data including team and position
  const playerData = getPlayerData(profile.player_id)
  const teamAbbreviation = playerData?.teamAbbreviation || profile.team_name
  const positionAbbreviation = playerData?.positionAbbreviation || "N/A"

  // Generate MLB headshot URL
  const playerHeadshotUrl = `https://img.mlbstatic.com/mlb-photos/image/upload/w_240,q_auto:good,f_auto/v1/people/${profile.player_id}/headshot/67/current`

  // Format a matchup text based on actual game data
  const getActualMatchupInfo = () => {
    if (!profile.away_team || !profile.home_team) {
      // Fallback to random generation if game data is missing
      return getGameInfo()
    }

    // Get abbreviations for both teams
    const awayTeamAbbr = getTeamAbbreviation(profile.away_team)
    const homeTeamAbbr = getTeamAbbreviation(profile.home_team)

    // Determine if the player's team is home or away by comparing abbreviations
    const isPlayerTeamHome = teamAbbreviation === homeTeamAbbr || 
                            homeTeamAbbr.includes(teamAbbreviation) || 
                            teamAbbreviation.includes(homeTeamAbbr)
    
    const isPlayerTeamAway = teamAbbreviation === awayTeamAbbr || 
                            awayTeamAbbr.includes(teamAbbreviation) || 
                            teamAbbreviation.includes(awayTeamAbbr)

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

  const [isFavorite, setIsFavorite] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [sportsbookToDisplay, setSportsbookToDisplay] = useState<string | null>(null)
  const previousCustomTierRef = useRef<number | null>(customTier);

  // Check if the user is on mobile
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Get random sportsbook for demonstration
  const getRandomSportsbook = () => {
    const books = ["DK", "FD", "MGM", "CZR"]
    return books[Math.floor(Math.random() * books.length)]
  }

  // Use real odds if available, otherwise use mock odds
  const sportsbook = bestOdds ? bestOdds.sportsbook : getRandomSportsbook()

  // Get odds value from all_odds if available
  const getOddsValue = (): number => {
    // Log available odds for debugging
    if (process.env.NODE_ENV === 'development' && profile.all_odds) {
      console.log(`[ODDS DEBUG] ${profile.player_name} available odds:`, JSON.stringify(profile.all_odds));
    }
    
    // Store available odds for this line/tier
    let availableOddsForLine: Record<string, any> = {};
    let bestOddsValue = -Infinity;
    let bestBook = sportsbook;
    
    // If we have a custom tier, try to get odds for that tier first
    if (customTier !== null && profile.all_odds) {
      const actualLineValue = (customTier - 0.5).toString();
      
      if (profile.all_odds[actualLineValue]) {
        availableOddsForLine = profile.all_odds[actualLineValue];
        console.log(`[ODDS DEBUG] Using custom tier ${customTier} (line ${actualLineValue})`);
      }
    } else if (profile.all_odds && profile.line) {
      // Use default line
      const lineStr = profile.line.toString();
      if (profile.all_odds[lineStr]) {
        availableOddsForLine = profile.all_odds[lineStr];
        console.log(`[ODDS DEBUG] Using default line ${lineStr}`);
      }
    }
    
    // If we have odds for this line, find the best odds
    if (Object.keys(availableOddsForLine).length > 0) {
      console.log(`[ODDS DEBUG] Available books for this line:`, Object.keys(availableOddsForLine));
      
      // Loop through all available sportsbooks to find the best odds
      Object.entries(availableOddsForLine).forEach(([book, bookData]) => {
        let currentOdds: number | undefined;
        
        // First check if bookData has an odds property
        if (bookData && bookData.odds !== undefined) {
          currentOdds = Math.round(Number(bookData.odds));
        } 
        // Then check if the value itself is a valid number
        else if (!isNaN(Number(bookData))) {
          currentOdds = Math.round(Number(bookData));
        }
        
        // Update best odds if this book has better odds
        if (currentOdds !== undefined && !isNaN(currentOdds)) {
          // For positive odds, higher is better
          // For negative odds, closer to zero is better
          if (
            (currentOdds > 0 && currentOdds > bestOddsValue) || 
            (currentOdds < 0 && currentOdds > bestOddsValue)
          ) {
            bestOddsValue = currentOdds;
            bestBook = book;
          }
        }
      });
      
      console.log(`[ODDS DEBUG] Best odds found: ${bestOddsValue} from ${bestBook}`);
      
      // Update displayed sportsbook if different
      if (bestBook !== sportsbookToDisplay) {
        setSportsbookToDisplay(bestBook);
      }
      
      return bestOddsValue;
    }
    
    // Fallback to bestOdds prop if available
    if (bestOdds && typeof bestOdds === 'object' && typeof bestOdds.american === 'number' && !isNaN(bestOdds.american)) {
      console.log(`[ODDS DEBUG] Using bestOdds fallback: ${bestOdds.american}`);
      if (bestOdds.sportsbook !== sportsbookToDisplay) {
        setSportsbookToDisplay(bestOdds.sportsbook);
      }
      return Math.round(bestOdds.american);
    }
    
    // Last resort: random odds
    const randomOdds = Math.round(getRandomOdds());
    console.log(`[ODDS DEBUG] Generated random odds: ${randomOdds}`);
    return randomOdds;
  }

  // Get direct bet link from all_odds if available
  const getDirectBetLink = (): string | undefined => {
    // Store available odds for this line/tier
    let availableOddsForLine: Record<string, any> = {};
    
    // If we have a custom tier, try to get the bet link for that tier first
    if (customTier !== null && profile.all_odds) {
      // For display purposes, we need to map the UI tier to the actual line value in the data
      // Example: If user selects 1+ hits, we need odds for line 0.5
      // If user selects 2+ hits, we need odds for line 1.5, etc.
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
    
    // If we have odds for this line
    if (Object.keys(availableOddsForLine).length > 0) {
      // First priority: Use the selected sportsbook if available
      if (availableOddsForLine[sportsbook] && availableOddsForLine[sportsbook].over_link) {
        return availableOddsForLine[sportsbook].over_link;
      }
      
      // Check if any sportsbook has a direct link property
      for (const [book, bookData] of Object.entries(availableOddsForLine)) {
        if (bookData && bookData.over_link) {
          return bookData.over_link;
        }
        
        // Some APIs might include the link as direct properties
        if (bookData && bookData.link) {
          return bookData.link;
        }
      }
    }
    
    // Fallback to bestOdds
    return bestOdds?.link;
  }

  // Add helper function to get the display sort field (for arrow indicator)
  const getDisplaySortField = (field: string): string => {
    // If we have a custom sort field, show the arrow on the base field
    if (field.endsWith("_custom")) {
      return field.replace("_custom", "");
    }
    return field;
  };

  // Effect to maintain sort when custom tier changes
  useEffect(() => {
    // Only trigger resort if customTier actually changed
    if (customTier !== previousCustomTierRef.current && onSort && sortField) {
      previousCustomTierRef.current = customTier;
      
      // If we're currently sorting by hit rates
      if (sortField === "L5" || sortField === "L10" || sortField === "L20" || sortField.endsWith("_custom")) {
        // Get the base field without _custom suffix
        const baseField = sortField.replace("_custom", "");
        
        // If switching to custom tier, add _custom suffix
        if (customTier !== null) {
          onSort(`${baseField}_custom`, sortDirection || "desc");
        } else {
          // If switching back to default tier, remove _custom suffix
          onSort(baseField, sortDirection || "desc");
        }
      }
      // For non-hit-rate sorts, maintain current sort but refresh to account for new tier
      else if (onSort) {
        onSort(sortField, sortDirection || "desc");
      }
    }
  }, [customTier, sortDirection, sortField, onSort]);

  // Add handleSort function
  const handleSort = (field: string) => {
    if (onSort) {
      // Get the current effective sort field (without _custom suffix)
      const currentBaseField = getDisplaySortField(sortField);
      
      // Determine the new direction
      const newDirection = currentBaseField === field && sortDirection === "desc" ? "asc" : "desc";

      // If we're sorting by hit rates and have a custom tier
      if (customTier !== null && (field === "L5" || field === "L10" || field === "L20")) {
        onSort(`${field}_custom`, newDirection);
      } else if (customTier === null && field === currentBaseField && sortField.endsWith("_custom")) {
        // If we're already using a custom sort but switching back to default
        onSort(field, newDirection);
      } else {
        // For regular sorts
        onSort(field, newDirection);
      }
    }
  };

  // Add sort icon helper
  const getSortIcon = (field: string, currentSortField: string, currentSortDirection: "asc" | "desc") => {
    if (field !== currentSortField) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/50" />
    }
    return currentSortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 text-indigo-500 dark:text-indigo-400" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 text-indigo-500 dark:text-indigo-400" />
    )
  };

  // Get the game info and other values after all functions are defined
  const gameInfo = getActualMatchupInfo()
  const odds = getOddsValue()
  const directBetLink = getDirectBetLink()
  const hasDirectLink = !!directBetLink
  const displaySportsbook = sportsbookToDisplay || sportsbook

  // Function to handle click on sportsbook logo
  const handleSportsbookClick = () => {
    if (hasDirectLink) {
      window.open(directBetLink, "_blank");
      console.log(`[CARD] Opening bet link: ${directBetLink}`);
    } else {
      console.log(`[CARD] No bet link available for ${displaySportsbook}`);
    }
  }

  // Get trend indicator
  const getTrend = (): "up" | "down" | "neutral" => {
    // Use custom tier hit rates if available
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

  // Get the trend direction
  const trend = getTrend()

  // Get trend icon and color
  const getTrendDisplay = () => {
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

    const histogram = profile.points_histogram[windowKey]
    const totalGames = Object.values(histogram).reduce((sum, count) => sum + count, 0)

    if (totalGames === 0) return 0

    // Sum all games where player had >= tier
    let gamesHittingTier = 0
    Object.entries(histogram).forEach(([value, count]) => {
      if (Number(value) >= customTier) {
        gamesHittingTier += count
      }
    })

    return Math.round((gamesHittingTier / totalGames) * 100)
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

  // Get color for hit rate
  const getHitRateColor = (rate: number): string => {
    if (rate >= 75) return "text-green-600 dark:text-green-400"
    if (rate >= 60) return "text-blue-600 dark:text-blue-400"
    if (rate >= 50) return "text-amber-600 dark:text-amber-400"
    return "text-red-600 dark:text-red-400"
  }

  // Get background color for hit rate badge
  const getHitRateBgColor = (rate: number): string => {
    // Good percentages (Green variations - from deep to light)
    if (rate >= 90) return "bg-green-200 dark:bg-green-800/50 text-green-900 dark:text-green-200" // Deep green
    if (rate >= 80) return "bg-green-100 dark:bg-green-800/40 text-green-800 dark:text-green-300"
    if (rate >= 70) return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
    if (rate >= 60) return "bg-green-50 dark:bg-green-900/25 text-green-700 dark:text-green-400"
    if (rate >= 50) return "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" // Lightest green

    // Bad percentages (Red variations - from light to deep)
    if (rate >= 40) return "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" // Lightest red
    if (rate >= 30) return "bg-red-50 dark:bg-red-900/25 text-red-700 dark:text-red-400"
    if (rate >= 20) return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
    if (rate >= 10) return "bg-red-100 dark:bg-red-800/40 text-red-800 dark:text-red-300"
    return "bg-red-200 dark:bg-red-800/50 text-red-900 dark:text-red-200" // Deep red
  }

  // Generate random odds for demonstration
  const getRandomOdds = () => {
    const baseOdds = Math.random() > 0.5 ? -110 : 110
    const variation = Math.floor(Math.random() * 20) * 5
    return baseOdds > 0 ? baseOdds + variation : baseOdds - variation
  }

  // Add useEffect to update sportsbookToDisplay only when needed
  useEffect(() => {
    // Calculate the sportsbook to display once
    let newDisplaySportsbook = sportsbook;
    
    // If we have a custom tier, check odds for that tier first
    if (customTier !== null && profile.all_odds) {
      const actualLineValue = (customTier - 0.5).toString();
      
      if (profile.all_odds[actualLineValue]) {
        // Check if we have the preferred sportsbook first
        // First check if there's an "odds" property
        if (profile.all_odds[actualLineValue][sportsbook]?.odds !== undefined) {
          // Use the preferred sportsbook
          newDisplaySportsbook = sportsbook;
        } 
        // Then check if the value itself is a valid number (direct odds)
        else if (!isNaN(Number(profile.all_odds[actualLineValue][sportsbook]))) {
          // Use the preferred sportsbook
          newDisplaySportsbook = sportsbook;
        } 
        // If neither condition is met, choose the first available book
        else {
          const availableBooks = Object.keys(profile.all_odds[actualLineValue]);
          if (availableBooks.length > 0) {
            newDisplaySportsbook = availableBooks[0];
          }
        }
      }
    } else if (profile.all_odds && profile.line) {
      // Use default line
      const lineStr = profile.line.toString();
      if (profile.all_odds[lineStr]) {
        // Check if we have the preferred sportsbook first
        // First check if there's an "odds" property
        if (profile.all_odds[lineStr][sportsbook]?.odds !== undefined) {
          // Use the preferred sportsbook
          newDisplaySportsbook = sportsbook;
        } 
        // Then check if the value itself is a valid number (direct odds)
        else if (!isNaN(Number(profile.all_odds[lineStr][sportsbook]))) {
          // Use the preferred sportsbook
          newDisplaySportsbook = sportsbook;
        }
        // If neither condition is met, choose the first available book
        else {
          const availableBooks = Object.keys(profile.all_odds[lineStr]);
          if (availableBooks.length > 0) {
            newDisplaySportsbook = availableBooks[0];
          }
        }
      }
    }
    
    // Fall back to bestOdds if needed
    if (bestOdds && !profile.all_odds) {
      newDisplaySportsbook = bestOdds.sportsbook;
    }
    
    // Only update state if it's different to avoid re-renders
    if (newDisplaySportsbook !== sportsbookToDisplay) {
      setSportsbookToDisplay(newDisplaySportsbook);
    }
  }, [profile, customTier, sportsbook, bestOdds, sportsbookToDisplay]);

  // Generate game-by-game performance data
  const getGameByGameData = () => {
    // Use actual recent_games data from the profile if available
    if (profile.recent_games && profile.recent_games.length > 0) {
      // Always get up to 10 games or all available if less than 10
      const availableGames = profile.recent_games.length
      const gameCount = Math.min(availableGames, 10)

      // Return the most recent games - up to 10
      return profile.recent_games.slice(0, gameCount).map((game: any) => ({
        opponent: game.opponent_abbr,
        isHome: game.is_home,
        value: game.value,
        date: game.date,
      }))
    } else {
      // Fall back to mock data generation if recent_games is empty
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

      // Sort by date (most recent first)
      return games.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }
  }

  // Generate data for the recent games chart
  const getRecentGamesData = () => {
    const gameData = getGameByGameData()

    // Format data for the chart - reverse to show oldest to newest (left to right)
    return [...gameData].reverse().map((game, index) => {
      const lineToCompare = customTier !== null ? customTier : profile.line

      // For all markets (Hits, Total Bases, Home Runs, RBIs, Strikeouts)
      // a value >= line is a hit for the "over"
      const isHit = game.value >= lineToCompare

      return {
        name: `G${index + 1}`,
        value: game.value,
        isHit,
        // Include the full game data for the tooltip
        fullGameData: game,
      }
    })
  }

  // Get an appropriate max value for the chart based on market
  const getChartMaxForMarket = (): number => {
    // Base values for each market type
    let baseMax = 4 // Default

    switch (profile.market) {
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

  // Get minimum bar height based on market to ensure visibility
  const getMinBarHeight = (): number => {
    switch (profile.market) {
      case "Total Bases":
      case "Home Runs":
      case "RBIs":
        return isMobile ? 16 : 10 // Larger minimum size for small-value markets
      case "Hits":
        return isMobile ? 14 : 8
      default:
        return isMobile ? 12 : 6 // Default for markets with larger values like Strikeouts
    }
  }

  // Determine if we need to scale the chart to make small values more visible
  const needsScaling = (): boolean => {
    return ["Total Bases", "Home Runs", "Hits", "RBIs"].includes(profile.market)
  }

  // Get appropriate vertical scale for the chart
  const getChartScale = (): number => {
    // This sets the minimum visible unit on the chart
    // Smaller numbers make small values appear taller
    switch (profile.market) {
      case "Total Bases":
      case "Home Runs":
      case "RBIs":
        return 0.5 // Make each 0.5 unit significant visually
      default:
        return 1 // Default unit scale
    }
  }

  return (
    <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all duration-200">
      <CardHeader className="p-3 pb-2 flex flex-row justify-between items-start">
        <div className="flex items-start space-x-3">
          {/* Player Headshot */}
          <div className="relative w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <Image
              src={playerHeadshotUrl || "/placeholder.svg"}
              alt={profile.player_name}
              width={40}
              height={40}
              className="object-cover w-full h-full"
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                (e.target as HTMLImageElement).src = "/placeholder.svg?height=40&width=40"
              }}
            />
          </div>

          {/* Player Info */}
          <div>
            <h3 className="font-bold text-base leading-tight">{profile.player_name}</h3>
            <div className="flex items-center mt-0.5 text-xs text-gray-600 dark:text-gray-400">
              <div className="w-4 h-4 relative flex-shrink-0 mr-1">
                <Image
                  src={`/images/mlb-teams/${getTeamLogoFilename(getStandardAbbreviation(teamAbbreviation))}.svg`}
                  alt={teamAbbreviation || "Team"}
                  width={16}
                  height={16}
                  className="object-contain w-full h-full p-0.5"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `/images/mlb-teams/${getTeamLogoFilename(getStandardAbbreviation(teamAbbreviation))}.png`;
                    (e.target as HTMLImageElement).onerror = () => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg?height=16&width=16";
                    };
                  }}
                />
              </div>
              <Badge variant="outline" className="px-1 py-0 text-xs">
                {positionAbbreviation}
              </Badge>
            </div>
            {/* Matchup integrated into player header */}
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
              <div className="flex items-center gap-1">
                {gameInfo.isHome ? (
                  <>
                    <span>vs</span>
                    <div className="w-3 h-3 relative flex-shrink-0">
                      <Image
                        src={`/images/mlb-teams/${getTeamLogoFilename(getStandardAbbreviation(gameInfo.opponent))}.svg`}
                        alt={gameInfo.opponent}
                        width={12}
                        height={12}
                        className="object-contain w-full h-full p-0.5"
                        onError={(e) => {
                          // Try PNG if SVG fails
                          (e.target as HTMLImageElement).src = `/images/mlb-teams/${getTeamLogoFilename(getStandardAbbreviation(gameInfo.opponent))}.png`;
                          // Fallback to placeholder if PNG also fails
                          (e.target as HTMLImageElement).onerror = () => {
                            (e.target as HTMLImageElement).src = "/placeholder.svg?height=12&width=12";
                          };
                        }}
                      />
                    </div>
                    <span>{gameInfo.opponent}</span>
                  </>
                ) : (
                  <>
                    <span>@</span>
                    <div className="w-3 h-3 relative flex-shrink-0">
                      <Image
                        src={`/images/mlb-teams/${getTeamLogoFilename(getStandardAbbreviation(gameInfo.opponent))}.svg`}
                        alt={gameInfo.opponent}
                        width={12}
                        height={12}
                        className="object-contain w-full h-full p-0.5"
                        onError={(e) => {
                          // Try PNG if SVG fails
                          (e.target as HTMLImageElement).src = `/images/mlb-teams/${getTeamLogoFilename(getStandardAbbreviation(gameInfo.opponent))}.png`;
                          // Fallback to placeholder if PNG also fails
                          (e.target as HTMLImageElement).onerror = () => {
                            (e.target as HTMLImageElement).src = "/placeholder.svg?height=12&width=12";
                          };
                        }}
                      />
                    </div>
                    <span>{gameInfo.opponent}</span>
                  </>
                )}
                <span> · {gameInfo.time}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Favorite Button */}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsFavorite(!isFavorite)}>
          <Star className={`h-3.5 w-3.5 ${isFavorite ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`} />
        </Button>
      </CardHeader>

      {/* Modal for mobile devices */}
      {isMobile && <InfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} profile={profile} customTier={customTier} />}

      <CardContent className="p-3 pt-2">
        {/* Market & Line + Odds in a single row */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <div className="px-1.5 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 rounded-md font-bold inline-block text-xs">
              {customTier !== null ? (
                <>
                  {customTier}+
                  <span className="text-[9px] ml-0.5 opacity-60">({profile.line.toFixed(1)})</span>
                </>
              ) : (
                profile.line.toFixed(1)
              )}
            </div>
            <span className="font-medium text-xs ml-1">{profile.market}</span>
          </div>

          <div className="flex items-center">
            {/* Odds with sportsbook logo to the right */}
            <DualOddsCell
              market={profile.market}
              line={profile.line}
              customTier={customTier}
              fallback_odds={profile.all_odds || {}}
              compact={true}
              playerName={profile.player_name}
              playerId={profile.player_id}
              teamName={teamAbbreviation}
              gameId={profile.odds_event_id}
              eventTime={profile.commence_time}
              awayTeam={profile.away_team}
              homeTeam={profile.home_team}
            />
          </div>
        </div>

        {/* Hit Rate Stats - Emphasized */}
        <div className={`grid ${customTier !== null ? 'grid-cols-3' : 'grid-cols-4'} gap-2 mb-3`}>
          <Button 
            variant="ghost" 
            className="flex flex-col items-center p-0 h-auto hover:bg-transparent"
            onClick={() => handleSort("L5")}
          >
            <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center">
              L5 {getDisplaySortField(sortField) === "L5" && getSortIcon("L5", getDisplaySortField(sortField), sortDirection)}
            </span>
            <span className={`w-full text-center py-1 rounded-md font-bold text-sm ${getHitRateBgColor(
              customTier !== null 
                ? calculateHitRateWithCustomTier(profile, customTier, "last_5") 
                : Math.round(profile.last_5_hit_rate)
            )}`}>
              {customTier !== null 
                ? calculateHitRateWithCustomTier(profile, customTier, "last_5") 
                : Math.round(profile.last_5_hit_rate)}%
            </span>
          </Button>
          <Button 
            variant="ghost" 
            className="flex flex-col items-center p-0 h-auto hover:bg-transparent"
            onClick={() => handleSort("L10")}
          >
            <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center">
              L10 {getDisplaySortField(sortField) === "L10" && getSortIcon("L10", getDisplaySortField(sortField), sortDirection)}
            </span>
            <span className={`w-full text-center py-1 rounded-md font-bold text-sm ${getHitRateBgColor(
              customTier !== null 
                ? calculateHitRateWithCustomTier(profile, customTier, "last_10") 
                : Math.round(profile.last_10_hit_rate)
            )}`}>
              {customTier !== null 
                ? calculateHitRateWithCustomTier(profile, customTier, "last_10") 
                : Math.round(profile.last_10_hit_rate)}%
            </span>
          </Button>
          <Button 
            variant="ghost" 
            className="flex flex-col items-center p-0 h-auto hover:bg-transparent"
            onClick={() => handleSort("L20")}
          >
            <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center">
              L20 {getDisplaySortField(sortField) === "L20" && getSortIcon("L20", getDisplaySortField(sortField), sortDirection)}
            </span>
            <span className={`w-full text-center py-1 rounded-md font-bold text-sm ${getHitRateBgColor(
              customTier !== null 
                ? calculateHitRateWithCustomTier(profile, customTier, "last_20") 
                : Math.round(profile.last_20_hit_rate)
            )}`}>
              {customTier !== null 
                ? calculateHitRateWithCustomTier(profile, customTier, "last_20") 
                : Math.round(profile.last_20_hit_rate)}%
            </span>
          </Button>
          {customTier === null && (
            <Button 
              variant="ghost" 
              className="flex flex-col items-center p-0 h-auto hover:bg-transparent"
              onClick={() => handleSort("seasonHitRate")}
            >
              <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center">
                2025 {getDisplaySortField(sortField) === "seasonHitRate" && getSortIcon("seasonHitRate", getDisplaySortField(sortField), sortDirection)}
              </span>
              <span className={`w-full text-center py-1 rounded-md font-bold text-sm ${getHitRateBgColor(profile.season_hit_rate || 0)}`}>
                {Math.round(profile.season_hit_rate || 0)}%
              </span>
            </Button>
          )}
        </div>

        {/* Average & Trend - Compact */}
        <div className="flex items-center justify-between mb-3 bg-gray-50 dark:bg-gray-900 rounded-md p-2 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-gray-500 dark:text-gray-400">Average:</span>
            <span
              className={
                profile.avg_stat_per_game >= profile.line
                  ? "text-green-600 dark:text-green-400 font-bold"
                  : "text-red-600 dark:text-red-400 font-bold"
              }
            >
              {profile.avg_stat_per_game.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-500 dark:text-gray-400">Trend:</span>
            <div className="flex items-center">
              <span className={trendDisplay.color}>{trendDisplay.icon}</span>
            </div>
          </div>
        </div>

        {/* Recent Games Chart - Full width with enhanced visibility */}
        <div className="mb-1">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">Recent Games</span>
              {isMobile ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 rounded-full"
                  onClick={() => setShowInfoModal(true)}
                >
                  <Info className="h-3 w-3 text-gray-400" />
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
            <div className="flex items-center">
              <span className={`text-xs font-medium ${getHitRateColor(hitRate)}`}>
                {hitsCount}/{gamesCount} hits
              </span>
            </div>
          </div>
        </div>

        {/* Game-by-Game Bar Chart - Larger and more prominent */}
        <div className="h-36 w-full mb-0 touch-manipulation bg-gray-50 dark:bg-gray-900 p-2 rounded-md">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={getRecentGamesData()} margin={{ top: 15, right: 5, bottom: 5, left: 5 }} barCategoryGap={6}>
              <YAxis
                domain={[0, getChartMaxForMarket()]}
                hide
                scale={needsScaling() ? "sqrt" : "auto"}
                tickCount={getChartScale()}
              />
              <ReferenceLine
                y={customTier !== null ? customTier : profile.line}
                stroke="#6366f1"
                strokeWidth={2}
                strokeDasharray="3 3"
                isFront={false}
                ifOverflow="extendDomain"
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} minPointSize={getMinBarHeight()}>
                {getRecentGamesData().map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.isHit ? "#10b981" : "#ef4444"} />
                ))}
                <LabelList
                  dataKey="value"
                  position="top"
                  style={{
                    fontSize: 10,
                    fill: "#4b5563",
                    fontWeight: "bold",
                    fontFamily: "system-ui",
                  }}
                  formatter={(value: number) => {
                    // For half values (0.5, 1.5, etc.), format appropriately
                    return value % 1 === 0 ? value.toString() : value.toString()
                  }}
                  offset={5}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Streamlined footer with minimal icons/text */}
        <CardFooter className="p-2 flex justify-between items-center border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-xs gap-1">
          {/* Updated timestamp */}
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            Updated: {formatTimestamp(profile.updated_at)}
          </span>
          {/* Compare Odds Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-gray-600 dark:text-gray-400">
                      <Scale className="h-3.5 w-3.5 mr-1" />
                      Compare
                    </Button>
                  </PopoverTrigger>
                  <TooltipContent>
                    <p>Compare odds</p>
                  </TooltipContent>
                  <PopoverContent className="w-72 p-3">
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Odds Comparison</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Available odds for {profile.market} {customTier !== null ? `${customTier}+` : profile.line.toFixed(1)}
                      </p>
                      <div className="space-y-1 mt-2">
                        {customTier !== null && profile.all_odds ? (
                          <>
                            {(() => {
                              const actualLineValue = (customTier - 0.5).toString();
                              if (profile.all_odds[actualLineValue]) {
                                const sortedEntries = sortOddsEntries(Object.entries(profile.all_odds[actualLineValue]));
                                return sortedEntries.map(([book, bookData]) => {
                                  const bookId = sportsbooks.find((sb) => sb.name.toLowerCase() === book.toLowerCase())?.id || "unknown";
                                  const sbData = sportsbooks.find((sb) => sb.id === bookId);
                                  const hasLink = !!getLinkFromBookData(bookData);
                                  const oddsValue = getOddsValueFromBookData(bookData);

                                  return (
                                    <div
                                      key={book}
                                      className={`flex justify-between items-center p-1.5 odd:bg-gray-50 dark:odd:bg-gray-800 rounded ${hasLink ? "cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/10" : ""}`}
                                      onClick={hasLink ? () => window.open(getLinkFromBookData(bookData), "_blank") : undefined}
                                    >
                                      <div className="flex items-center gap-2">
                                        {sbData ? (
                                          <div className="w-7 h-7 flex items-center justify-center bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-1">
                                            <Image
                                              src={sbData.logo || "/placeholder.svg"}
                                              alt={sbData.name}
                                              width={20}
                                              height={20}
                                              className="object-contain w-full h-full max-h-[16px]"
                                            />
                                          </div>
                                        ) : null}
                                        <span className="font-medium text-sm">{book}</span>
                                        {hasLink && (
                                          <span className="text-xs text-gray-500 dark:text-gray-400">Quick Bet</span>
                                        )}
                                      </div>
                                      <span className={`text-sm ${oddsValue > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"} font-bold`}>
                                        {formatOdds(oddsValue)}
                                      </span>
                                    </div>
                                  );
                                });
                              }
                              return (
                                <div className="text-center text-sm text-gray-500 py-2">
                                  No odds available for {customTier}+
                                </div>
                              );
                            })()}
                          </>
                        ) : profile.all_odds && profile.line && profile.all_odds[profile.line.toString()] ? (
                          <>
                            {(() => {
                              const sortedEntries = sortOddsEntries(Object.entries(profile.all_odds[profile.line.toString()]));
                              return sortedEntries.map(([book, bookData]) => {
                                const bookId = sportsbooks.find((sb) => sb.name.toLowerCase() === book.toLowerCase())?.id || "unknown";
                                const sbData = sportsbooks.find((sb) => sb.id === bookId);
                                const hasLink = !!getLinkFromBookData(bookData);
                                const oddsValue = getOddsValueFromBookData(bookData);

                                return (
                                  <div
                                    key={book}
                                    className={`flex justify-between items-center p-1.5 odd:bg-gray-50 dark:odd:bg-gray-800 rounded ${hasLink ? "cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/10" : ""}`}
                                    onClick={hasLink ? () => window.open(getLinkFromBookData(bookData), "_blank") : undefined}
                                  >
                                    <div className="flex items-center gap-2">
                                      {sbData ? (
                                        <div className="w-7 h-7 flex items-center justify-center bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-1">
                                          <Image
                                            src={sbData.logo || "/placeholder.svg"}
                                            alt={sbData.name}
                                            width={20}
                                            height={20}
                                            className="object-contain w-full h-full max-h-[16px]"
                                          />
                                        </div>
                                      ) : null}
                                      <span className="font-medium text-sm">{book}</span>
                                      {hasLink && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Quick Bet</span>
                                      )}
                                    </div>
                                    <span className={`text-sm ${oddsValue > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"} font-bold`}>
                                      {formatOdds(oddsValue)}
                                    </span>
                                  </div>
                                );
                              });
                            })()}
                          </>
                        ) : (
                          <div className="text-center text-sm text-gray-500 py-2">
                            No additional odds data available
                          </div>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </TooltipTrigger>
            </Tooltip>
          </TooltipProvider>
        </CardFooter>
      </CardContent>
    </Card>
  )
}