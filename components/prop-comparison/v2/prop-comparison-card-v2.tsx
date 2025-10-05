"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, ChevronDown, ChevronUp, ExternalLink, BarChart3, TrendingUp, TrendingDown, Plus, ArrowDown } from "lucide-react"
import Image from "next/image"
import type { PlayerOdds, BestOddsFilter } from "@/types/prop-comparison"
import { sportsbooks } from "@/data/sportsbooks"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserIcon } from "lucide-react"
import { useBetActions } from "@/hooks/use-bet-actions"
import { BetslipDialog } from "@/components/betting/betslip-dialog"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { americanToDecimal, decimalToAmerican } from "@/lib/odds-utils"
import { 
  getTeamLogoUrl,
  getPlayerHeadshotUrl,
  getDefaultPlayerImage
} from "@/lib/constants/sport-assets"
import { SPORT_MARKETS, getMarketsForSport } from "@/lib/constants/markets"
import { SportMarket } from "@/lib/constants/markets"

// Add back the SPORTSBOOK_ID_MAP since it's not exported from sportsbooks
const SPORTSBOOK_ID_MAP: Record<string, string> = {
  espnbet: "espn bet",
  espn_bet: "espn bet",
  "espn-bet": "espn bet",
  espn: "espn bet",

  "william hill": "caesars",
  williamhill: "caesars",
  williamhill_us: "caesars",
  caesars: "caesars",

  "bally bet": "bally bet",
  ballybet: "bally bet",
  bally: "bally bet",
  bally_bet: "bally bet",

  "hard rock bet": "hard rock bet",
  hardrockbet: "hard rock bet",
  "hard rock": "hard rock bet",
  hardrock: "hard rock bet",

  "bet mgm": "betmgm",
  mgm: "betmgm",
  betmgm: "betmgm",

  draftkings: "draftkings",
  dk: "draftkings",

  fanduel: "fanduel",
  fd: "fanduel",

  betrivers: "betrivers",
  rivers: "betrivers",
  bet_rivers: "betrivers",

  fanatics: "fanatics",
  fanatics_sportsbook: "fanatics",

  pinnacle: "pinnacle",
  pin: "pinnacle",

  novig: "novig",
  superbook: "superbook",
  bet365: "bet365",
}

interface OddsWithBook {
  price: number
  link?: string
  book: string
}

interface BestOdds {
  over: OddsWithBook | null
  under: OddsWithBook | null
}

interface BookOdds {
  over?: {
    price: number
    link?: string
  }
  under?: {
    price: number
    link?: string
  }
}

interface PropComparisonCardV3Props {
  data: PlayerOdds & {
    bestOverBook?: string
    bestUnderBook?: string
  }
  bestOddsFilter: BestOddsFilter | null
  globalLine: string | null
  sortField: "odds" | "line" | "edge" | "name" | "ev"
  sortDirection: "asc" | "desc"
  sport: string
}

// Add EV calculation functions
function getTop3Odds(odds: Record<string, BookOdds>, type: 'over' | 'under'): number[] {
  return Object.values(odds)
    .filter(bookOdds => type === 'over' ? bookOdds.over?.price : bookOdds.under?.price)
    .map(bookOdds => type === 'over' ? bookOdds.over!.price : bookOdds.under!.price)
    .sort((a, b) => type === 'over' 
      ? b - a  // Highest odds for over
      : Math.abs(a) - Math.abs(b)) // Lowest absolute value for under
    .slice(0, 3);
}

function calculateNoVigEV(
  bestOdds: number,
  odds: Record<string, BookOdds>,
  type: 'over' | 'under'
): number | null {
  // Get top 3 odds for both sides
  const top3Over = getTop3Odds(odds, 'over');
  const top3Under = getTop3Odds(odds, 'under');
  
  if (top3Over.length < 3 || top3Under.length < 3) return null;

  // Calculate average implied probabilities
  const avgOverProb = top3Over.map(calculateImpliedProbability).reduce((a, b) => a + b, 0) / 3;
  const avgUnderProb = top3Under.map(calculateImpliedProbability).reduce((a, b) => a + b, 0) / 3;
  
  // Remove vig
  const vigTotal = avgOverProb + avgUnderProb;
  const noVigOverProb = avgOverProb / vigTotal;
  const noVigUnderProb = avgUnderProb / vigTotal;
  
  // Calculate fair probability based on bet type
  const fairProb = type === 'over' ? noVigOverProb : noVigUnderProb;
  
  // Calculate payout multiplier
  const payoutMultiplier = bestOdds > 0 
    ? bestOdds / 100 
    : 100 / Math.abs(bestOdds);
  
  // Calculate EV
  const ev = ((fairProb * (1 + payoutMultiplier)) - 1) * 100;
  
  return Math.round(ev * 10) / 10; // Round to 1 decimal
}

// Calculate implied probability from American odds
function calculateImpliedProbability(odds: number): number {
  return odds > 0 
    ? 100 / (odds + 100) 
    : Math.abs(odds) / (Math.abs(odds) + 100);
}

// Calculate EV percentage using best odds and average odds
function calculateEVPercentage(bestOdds: number, avgOdds: number, direction: 'over' | 'under'): number | null {
  if (!bestOdds || !avgOdds) return null;
  
  const bestDecimal = americanToDecimal(bestOdds);
  const avgDecimal = americanToDecimal(avgOdds);
  
  if (!bestDecimal || !avgDecimal) return null;
  
  const trueProb = decimalToProbability(avgDecimal);
  const ev = (trueProb * bestDecimal - 1) * 100;
  
  return Math.round(ev * 10) / 10; // Round to 1 decimal
}

// Convert decimal odds to implied probability
function decimalToProbability(decimal: number): number {
  return 1 / decimal;
}

const getPlayerInitials = (name: string | undefined): string => {
  if (!name) return "NA"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

// Add helper function to calculate average odds for sorting
function calculateAveragePrice(odds: Record<string, BookOdds> | undefined, type: 'over' | 'under'): number | null {
  if (!odds) return null;
  
  let decimalSum = 0;
  let count = 0;
  
  Object.values(odds).forEach(bookOdds => {
    const price = type === 'over' ? bookOdds.over?.price : bookOdds.under?.price;
    if (price) {
      decimalSum += americanToDecimal(price);
      count++;
    }
  });
  
  return count > 0 ? decimalToAmerican(decimalSum / count) : null;
}

// Update helper function to get max EV using only pre-calculated metrics
function getMaxValuePercent(item: PlayerOdds, selectedLine: string): number {
  // Only use pre-calculated metrics
  const metrics = item.metrics?.[selectedLine];
  if (!metrics) return 0;

  const overValue = metrics.over?.value_pct || 0;
  const underValue = metrics.under?.value_pct || 0;
  return Math.max(overValue, underValue);
}

// Add helper function to get Value% from pre-calculated metrics
function getValuePercent(item: PlayerOdds, selectedLine: string, type: "over" | "under"): number | null {
  // First try to get from pre-calculated metrics
  const metrics = item.metrics?.[selectedLine]?.[type];
  if (metrics?.value_pct !== undefined) {
    return Math.round(metrics.value_pct * 10) / 10; // Round to 1 decimal
  }
  
  // Fallback to frontend calculation if metrics not available
  const lineOdds = item.lines[selectedLine];
  if (!lineOdds) return null;
  
  const bestOdds = type === "over" ? item.best_over_price : item.best_under_price;
  if (!bestOdds) return null;
  
  const avgPrice = calculateAveragePrice(lineOdds, type);
  if (!avgPrice) return null;
  
  return calculateEVPercentage(bestOdds, avgPrice, type);
}

export function PropComparisonCardV2({ 
  data, 
  bestOddsFilter, 
  globalLine,
  sortField,
  sortDirection,
  sport
}: PropComparisonCardV3Props) {
  const [selectedLine, setSelectedLine] = useState(() => {
    // Use global line if available and the player has odds for that line
    if (globalLine && data.lines?.[globalLine]) {
      return globalLine
    }
    // Otherwise use the primary line
    return data.primary_line
  })

  // Update selected line when global line changes or when data/lines change
  useEffect(() => {
    if (globalLine && data.lines?.[globalLine]) {
      setSelectedLine(globalLine)
    } else if (data.primary_line) {
      setSelectedLine(data.primary_line)
    } else {
      // If no primary line, use the first available line
      const firstLine = Object.keys(data.lines || {})[0]
      setSelectedLine(firstLine)
    }
  }, [globalLine, data.lines, data.primary_line])

  // Add sorting value calculation for display
  const sortValue = useMemo(() => {
    if (sortField === "name") {
      return data.description;
    }
    
    if (sortField === "line") {
      return parseFloat(selectedLine);
    }
    
    if (sortField === "odds") {
      const maxOdds = Math.max(
        data.best_over_price || Number.NEGATIVE_INFINITY,
        data.best_under_price || Number.NEGATIVE_INFINITY
      );
      return maxOdds === Number.NEGATIVE_INFINITY ? null : maxOdds;
    }
    
    if (sortField === "ev") {
      const valuePercent = getMaxValuePercent(data, selectedLine);
      return valuePercent === 0 ? null : valuePercent;
    }
    
    return null;
  }, [data, selectedLine, sortField, sortDirection]);

  // Add sort value display
  const renderSortValue = () => {
    if (!sortValue) return null;

    let displayValue = "";
    let colorClass = "";

    switch (sortField) {
      case "name":
        return null; // Don't show name sort value
      case "line":
        displayValue = sortValue.toString();
        break;
      case "odds":
        displayValue = formatOdds(sortValue as number);
        colorClass = (sortValue as number) > 0 ? "text-green-500" : "text-red-500";
        break;
      case "ev":
        // Don't show badge if EV is -Infinity or negative
        if (typeof sortValue !== 'number' || sortValue <= 0) return null;
        displayValue = `${sortValue.toFixed(1)}%`;
        colorClass = "text-blue-500";
        break;
    }

    return (
      <Badge 
        variant="outline" 
        className={cn(
          "absolute top-2 right-2",
          colorClass
        )}
      >
        {displayValue}
      </Badge>
    );
  };

  const [showAllOdds, setShowAllOdds] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [showBetslipDialog, setShowBetslipDialog] = useState(false)
  const [pendingSelection, setPendingSelection] = useState<any>(null)
  const {
    betslips,
    handleBetslipSelect,
    handleCreateBetslip,
    conflictingSelection,
    handleResolveConflict
  } = useBetActions()

  // Function to create betslip selection
  const createBetslipSelection = (type: 'over' | 'under') => {
    const lineOdds = data.lines?.[selectedLine] || {};
    const oddsData: Record<string, any> = {};

    Object.entries(lineOdds).forEach(([bookId, bookOdds]) => {
      const mappedId = SPORTSBOOK_ID_MAP[bookId.toLowerCase()] || bookId.toLowerCase();
      if (bookOdds) {
        oddsData[mappedId] = {
          over: bookOdds.over ? {
            ...bookOdds.over,
            sid: bookOdds.over.sid || 'default'
          } : null,
          under: bookOdds.under ? {
            ...bookOdds.under,
            sid: bookOdds.under.sid || 'default'
          } : null,
          line: parseFloat(selectedLine),
          last_update: new Date().toISOString()
        };
      }
    });

    // Get market config from our constants
    const markets = getMarketsForSport(sport);
    const marketConfig = markets.find((m: SportMarket) => m.value === data.market || m.apiKey === data.market);

    return {
      event_id: data.event_id,
      sport_key: sport,
      market_key: data.market,
      market_type: "player_props",
      bet_type: type,
      player_name: data.description,
      player_id: data.player_id,
      player_team: data.team,
      line: parseFloat(selectedLine),
      commence_time: data.commence_time,
      home_team: data.home_team || "",
      away_team: data.away_team || "",
      odds_data: oddsData,
      market_display: marketConfig?.label || data.market_display || data.market,
      selection: type === 'over' ? 'Over' : 'Under'
    };
  };

  // Function to handle adding to betslip
  const handleAddToBetslip = (type: 'over' | 'under') => {
    const selection = createBetslipSelection(type)
    setPendingSelection(selection)
    setShowBetslipDialog(true)
  }

  const formatOdds = (odds: number | undefined) => {
    if (!odds || odds === Number.POSITIVE_INFINITY || odds === Number.NEGATIVE_INFINITY) return "-"
    if (odds > 0) return `+${odds}`
    return odds.toString()
  }

  // Find best odds for over/under
  const bestOdds = useMemo(() => {
    const odds = data.lines[selectedLine]
    if (!odds) return { over: null, under: null }

    let bestOverPrice = Number.NEGATIVE_INFINITY
    let bestOverBook = ""
    let bestOverOdds: BookOdds["over"] = null
    let bestUnderPrice = Number.NEGATIVE_INFINITY
    let bestUnderBook = ""
    let bestUnderOdds: BookOdds["under"] = null

    Object.entries(odds).forEach(([bookId, bookOdds]) => {
      const mappedId = SPORTSBOOK_ID_MAP[bookId.toLowerCase()] || bookId.toLowerCase()
      if (bookOdds.over?.price && bookOdds.over.price > bestOverPrice) {
        bestOverPrice = bookOdds.over.price
        bestOverBook = mappedId
        bestOverOdds = bookOdds.over
      }
      if (bookOdds.under?.price && bookOdds.under.price > bestUnderPrice) {
        bestUnderPrice = bookOdds.under.price
        bestUnderBook = mappedId
        bestUnderOdds = bookOdds.under
      }
    })

    // Apply best odds filter
    if (bestOddsFilter) {
      const filterBookId = SPORTSBOOK_ID_MAP[bestOddsFilter.sportsbook.toLowerCase()] || bestOddsFilter.sportsbook.toLowerCase()
      const bookOdds = odds[filterBookId]
      
      if (!bookOdds) return { over: null, under: null }
      
      // For over bets, check if this book has the best over odds
      if (bestOddsFilter.type === "over") {
        if (!bookOdds.over || bookOdds.over.price !== bestOverPrice || bestOverBook !== filterBookId) {
          return { over: null, under: null }
        }
      }
      
      // For under bets, check if this book has the best under odds
      if (bestOddsFilter.type === "under") {
        if (!bookOdds.under || bookOdds.under.price !== bestUnderPrice || bestUnderBook !== filterBookId) {
          return { over: null, under: null }
        }
      }
    }

    return {
      over: bestOverOdds ? { ...bestOverOdds, book: bestOverBook } : null,
      under: bestUnderOdds ? { ...bestUnderOdds, book: bestUnderBook } : null,
    }
  }, [data, selectedLine, bestOddsFilter])

  // Get filtered odds for the expanded view
  const filteredOdds = useMemo(() => {
    const lineOdds = data.lines[selectedLine]
    return lineOdds
  }, [data.lines, selectedLine])

  // Get player info and other required data
  const playerHeadshotUrl = getPlayerHeadshotUrl(data.player_id.toString(), sport)
  const availableLines = Object.keys(data.lines).sort((a, b) => Number.parseFloat(a) - Number.parseFloat(b))
  const activeSportsbooks = sportsbooks.filter((book) => book.isActive)

  // Get sportsbook info for logos
  const overSportsbook = bestOdds?.over?.book
    ? sportsbooks.find((book) => book.id.toLowerCase() === bestOdds.over.book.toLowerCase())
    : null
  const underSportsbook = bestOdds?.under?.book
    ? sportsbooks.find((book) => book.id.toLowerCase() === bestOdds.under.book.toLowerCase())
    : null

  // Update the getBookLogo function to include a default fallback
  const getBookLogo = (bookId: string): string => {
    if (!bookId) return "/images/sports-books/generic-sportsbook.png"

    const mappedId = SPORTSBOOK_ID_MAP[bookId.toLowerCase()] || bookId.toLowerCase()
    const sportsbook = sportsbooks.find((book) => {
      const bookIdLower = book.id.toLowerCase()
      const mappedIdLower = mappedId.toLowerCase()

      return (
        bookIdLower === mappedIdLower ||
        (bookIdLower === "espnbet" && mappedIdLower === "espn bet") ||
        (bookIdLower === "williamhill_us" && mappedIdLower === "caesars") ||
        (bookIdLower === "ballybet" && mappedIdLower === "bally bet") ||
        (bookIdLower === "hardrockbet" && mappedIdLower === "hard rock bet")
      )
    })

    return sportsbook?.logo || "/images/sports-books/generic-sportsbook.png"
  }

  // Add helper function to get sportsbook name for alt text
  const getBookName = (bookId: string) => {
    if (!bookId) return "Sportsbook"

    const mappedId = SPORTSBOOK_ID_MAP[bookId.toLowerCase()] || bookId.toLowerCase()
    const sportsbook = sportsbooks.find((book) => book.id.toLowerCase() === mappedId)

    return sportsbook?.name || bookId
  }

  // Helper function to format the average display
  const formatAverageOdds = (type: "over" | "under") => {
    const result = calculateAveragePrice(data.lines[selectedLine], type)
    if (!result) return "-"
    return `${formatOdds(result)}`
  }

  // Update EV calculation to use pre-calculated metrics
  const calculateEV = (type: 'over' | 'under'): number | null => {
    // Try to get from pre-calculated metrics first
    return getValuePercent(data, selectedLine, type);
  };

  // Calculate EVs for both sides using pre-calculated metrics
  const overEV = calculateEV('over');
  const underEV = calculateEV('under');

  // If filtered out by best odds filter, render nothing
  if (bestOddsFilter && !bestOdds.over && !bestOdds.under) {
    return null
  }

  return (
    <>
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 border-0 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 backdrop-blur-sm">
        <CardContent className="p-0">
          {/* Header Section */}
          <div className="p-4 pb-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-start justify-between gap-3">
              {/* Add sort value display */}
              {renderSortValue()}
              
              {/* Player Info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="relative">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 ring-2 ring-white dark:ring-gray-800 shadow-sm">
                    {data.description ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={getPlayerHeadshotUrl(data.player_id.toString(), sport)}
                          alt={data.description || "Player"}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            // Show parent div with initials
                            target.parentElement.querySelector('.player-initials')?.classList.remove('hidden');
                          }}
                        />
                        <div className="player-initials hidden absolute inset-0 flex items-center justify-center text-xl font-semibold text-gray-600 dark:text-gray-300">
                          {getPlayerInitials(data.description)}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-semibold text-gray-600 dark:text-gray-300">
                        NA
                      </div>
                    )}
                  </div>
                  {/* Team logo overlay */}
                  {data.team && (
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-white dark:bg-gray-800 shadow-md ring-2 ring-white dark:ring-gray-800 overflow-hidden">
                      <Image
                        src={getTeamLogoUrl(data.team, sport)}
                        alt={data.team}
                        width={28}
                        height={28}
                        className="object-contain w-full h-full p-0.5"
                      />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate leading-tight">
                    {data.description}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-0.5">{data.market}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs font-medium">
                      {data.team}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      {format(new Date(data.commence_time || ""), "h:mm a")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full",
                    "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-400",
                    "dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30 dark:hover:text-emerald-300",
                    "border-emerald-500/20",
                    !bestOdds?.over && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => handleAddToBetslip('over')}
                  disabled={!bestOdds?.over}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Over
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full",
                    "bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400",
                    "dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30 dark:hover:text-red-300",
                    "border-red-500/20",
                    !bestOdds?.under && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => handleAddToBetslip('under')}
                  disabled={!bestOdds?.under}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Under
                </Button>
              </div>
            </div>
          </div>

          {/* Line Selector & Best Odds */}
          <div className="p-4 space-y-4">
            {/* Line Selector */}
            <div className="flex items-center gap-3">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Line</Label>
              <Select value={selectedLine?.toString()} onValueChange={(value) => setSelectedLine(value)}>
                <SelectTrigger className="w-20 h-8 text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <SelectValue>{selectedLine}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableLines.map((line) => (
                    <SelectItem key={line} value={line.toString()}>
                      {line}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Best Odds Display with EV */}
            <div className="grid grid-cols-2 gap-3">
              {/* Over */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Over</span>
                  <TrendingUp className="w-3 h-3 text-green-500" />
                </div>

                <div className="relative">
                  {bestOdds?.over ? (
                    <div className="group/odds">
                      {bestOdds.over.link ? (
                        <a href={bestOdds.over.link} target="_blank" rel="noopener noreferrer" className="block">
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-xl p-3 hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <span className="text-xl font-bold text-green-700 dark:text-green-400">
                                {formatOdds(bestOdds.over.price)}
                              </span>
                              <ExternalLink className="w-4 h-4 text-green-600 dark:text-green-400 opacity-0 group-hover/odds:opacity-100 transition-opacity" />
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="w-5 h-5 rounded-md overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
                                <Image
                                  src={getBookLogo(bestOdds.over.book)}
                                  alt={getBookName(bestOdds.over.book)}
                                  width={20}
                                  height={20}
                                  className="object-contain w-full h-full"
                                />
                              </div>
                              <span className="text-xs font-medium text-green-600 dark:text-green-400 capitalize">
                                {getBookName(bestOdds.over.book)}
                              </span>
                            </div>
                          </div>
                        </a>
                      ) : (
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-xl p-3">
                          <span className="text-xl font-bold text-green-700 dark:text-green-400">
                            {formatOdds(bestOdds.over.price)}
                          </span>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-5 h-5 rounded-md overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
                              <Image
                                src={getBookLogo(bestOdds.over.book)}
                                alt={getBookName(bestOdds.over.book)}
                                width={20}
                                height={20}
                                className="object-contain w-full h-full"
                              />
                            </div>
                            <span className="text-xs font-medium text-green-600 dark:text-green-400 capitalize">
                              {getBookName(bestOdds.over.book)}
                            </span>
                          </div>
                        </div>
                      )}
                      {/* Average and EV row */}
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Avg: {formatAverageOdds("over")}</span>
                        {overEV && overEV > 0 && (
                          <span className="text-green-500 dark:text-green-400">
                            Value: +{overEV.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                      <span className="text-xl font-bold text-gray-400 dark:text-gray-500">-</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Under */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Under</span>
                  <TrendingDown className="w-3 h-3 text-red-500" />
                </div>

                <div className="relative">
                  {bestOdds?.under ? (
                    <div className="group/odds">
                      {bestOdds.under.link ? (
                        <a href={bestOdds.under.link} target="_blank" rel="noopener noreferrer" className="block">
                          <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3 hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <span className="text-xl font-bold text-red-700 dark:text-red-400">
                                {formatOdds(bestOdds.under.price)}
                              </span>
                              <ExternalLink className="w-4 h-4 text-red-600 dark:text-red-400 opacity-0 group-hover/odds:opacity-100 transition-opacity" />
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="w-5 h-5 rounded-md overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
                                <Image
                                  src={getBookLogo(bestOdds.under.book)}
                                  alt={getBookName(bestOdds.under.book)}
                                  width={20}
                                  height={20}
                                  className="object-contain w-full h-full"
                                />
                              </div>
                              <span className="text-xs font-medium text-red-600 dark:text-red-400 capitalize">
                                {getBookName(bestOdds.under.book)}
                              </span>
                            </div>
                          </div>
                        </a>
                      ) : (
                        <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3">
                          <span className="text-xl font-bold text-red-700 dark:text-red-400">
                            {formatOdds(bestOdds.under.price)}
                          </span>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-5 h-5 rounded-md overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
                              <Image
                                src={getBookLogo(bestOdds.under.book)}
                                alt={getBookName(bestOdds.under.book)}
                                width={20}
                                height={20}
                                className="object-contain w-full h-full"
                              />
                            </div>
                            <span className="text-xs font-medium text-red-600 dark:text-red-400 capitalize">
                              {getBookName(bestOdds.under.book)}
                            </span>
                          </div>
                        </div>
                      )}
                      {/* Average and EV row */}
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Avg: {formatAverageOdds("under")}</span>
                        {underEV && underEV > 0 && (
                          <span className="text-red-500 dark:text-red-400">
                            Value: +{underEV.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                      <span className="text-xl font-bold text-gray-400 dark:text-gray-500">-</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Expandable Section */}
          <div className="border-t border-gray-100 dark:border-gray-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllOdds(!showAllOdds)}
              className="w-full h-12 rounded-none hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              {showAllOdds ? "Hide All Odds" : "Compare All Odds"}
              {showAllOdds ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
            </Button>

            <AnimatePresence>
              {showAllOdds && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 bg-gray-50/50 dark:bg-gray-800/20">
                    <div className="space-y-4">
                      {/* Over Odds */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          Over Odds
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                          {activeSportsbooks
                            .map((book) => {
                              const bookId = book.id.toLowerCase()
                              const mappedId = SPORTSBOOK_ID_MAP[bookId] || bookId
                              const bookOdds =
                                filteredOdds[mappedId] ||
                                filteredOdds[bookId] ||
                                filteredOdds[SPORTSBOOK_ID_MAP[bookId]] ||
                                filteredOdds[book.id]
                              const overOdds = bookOdds?.over
                              const isBest = book.id === bestOdds?.over?.book

                              if (!overOdds) return null

                              return {
                                book,
                                odds: overOdds,
                                isBest,
                              }
                            })
                            .filter(Boolean)
                            .sort((a, b) => (b.odds.price || 0) - (a.odds.price || 0))
                            .map(({ book, odds: overOdds, isBest }) => (
                              <div
                                key={`${book.id}-over`}
                                className={cn(
                                  "relative p-2 rounded-lg border transition-all duration-200",
                                  overOdds.link ? "hover:scale-105 cursor-pointer" : "",
                                  isBest
                                    ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 ring-1 ring-green-200 dark:ring-green-800"
                                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
                                )}
                                onClick={() => {
                                  if (overOdds.link) {
                                    window.open(overOdds.link, '_blank')
                                  }
                                }}
                              >
                                {isBest && (
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-800"></div>
                                )}
                                {overOdds.link && (
                                  <div className="absolute -top-1.5 -right-1.5 w-3 h-3">
                                    <ExternalLink className="w-full h-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                                    <Image
                                      src={getBookLogo(book.id)}
                                      alt={getBookName(book.id)}
                                      width={24}
                                      height={24}
                                      className="object-contain w-full h-full"
                                    />
                                  </div>
                                  <span
                                    className={cn(
                                      "text-sm font-semibold truncate",
                                      isBest ? "text-green-700 dark:text-green-400" : "text-gray-900 dark:text-white",
                                    )}
                                  >
                                    {formatOdds(overOdds.price)}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Under Odds */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          Under Odds
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                          {activeSportsbooks
                            .map((book) => {
                              const bookId = book.id.toLowerCase()
                              const mappedId = SPORTSBOOK_ID_MAP[bookId] || bookId
                              const bookOdds =
                                filteredOdds[mappedId] ||
                                filteredOdds[bookId] ||
                                filteredOdds[SPORTSBOOK_ID_MAP[bookId]] ||
                                filteredOdds[book.id]
                              const underOdds = bookOdds?.under
                              const isBest = book.id === bestOdds?.under?.book

                              if (!underOdds) return null

                              return {
                                book,
                                odds: underOdds,
                                isBest,
                              }
                            })
                            .filter(Boolean)
                            .sort((a, b) => (b.odds.price || 0) - (a.odds.price || 0))
                            .map(({ book, odds: underOdds, isBest }) => (
                              <div
                                key={`${book.id}-under`}
                                className={cn(
                                  "relative p-2 rounded-lg border transition-all duration-200",
                                  underOdds.link ? "hover:scale-105 cursor-pointer" : "",
                                  isBest
                                    ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 ring-1 ring-red-200 dark:ring-red-800"
                                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
                                )}
                                onClick={() => {
                                  if (underOdds.link) {
                                    window.open(underOdds.link, '_blank')
                                  }
                                }}
                              >
                                {isBest && (
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800"></div>
                                )}
                                {underOdds.link && (
                                  <div className="absolute -top-1.5 -right-1.5 w-3 h-3">
                                    <ExternalLink className="w-full h-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                                    <Image
                                      src={getBookLogo(book.id)}
                                      alt={getBookName(book.id)}
                                      width={24}
                                      height={24}
                                      className="object-contain w-full h-full"
                                    />
                                  </div>
                                  <span
                                    className={cn(
                                      "text-sm font-semibold truncate",
                                      isBest ? "text-red-700 dark:text-red-400" : "text-gray-900 dark:text-white",
                                    )}
                                  >
                                    {formatOdds(underOdds.price)}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

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
            <p className="text-sm text-muted-foreground mb-4">
              You already have a selection for this player:
            </p>
            
            {conflictingSelection && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg border bg-muted/50">
                  <div className="text-xs font-medium text-foreground mb-0.5">
                    {Math.ceil(conflictingSelection.existingSelection.line || 0)}+ {
                      conflictingSelection.existingSelection.market_key.split('_')
                        .map(word => word.toLowerCase() === 'mlb' ? 'MLB' : word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')
                    }
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
                    {Math.ceil(conflictingSelection.newSelection.line || 0)}+ {
                      conflictingSelection.newSelection.market_key.split('_')
                        .map(word => word.toLowerCase() === 'mlb' ? 'MLB' : word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')
                    }
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {conflictingSelection.newSelection.player_name}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleResolveConflict(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => handleResolveConflict(true)}
              className="bg-primary"
            >
              Replace Selection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
