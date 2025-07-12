"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, BarChart3, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import type { PlayerOdds, BestOddsFilter, OddsPrice, BookmakerOdds } from "@/types/prop-comparison"
import { sportsbooks } from "@/data/sportsbooks"
import { useMemo, useState } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { decimalToAmerican } from "@/lib/prop-ev-calculator"
import { OddsDisplay } from "@/components/shared/odds-display"
import { motion } from "framer-motion"
import { useBetActions } from "@/hooks/use-bet-actions"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BetslipDialog } from "@/components/betting/betslip-dialog"

// Helper functions for team logos and abbreviations
function getTeamLogoFilename(abbr: string): string {
  if (!abbr) return "default"
  const teamAbbreviationMap: Record<string, string> = {
    // American League
    LAA: "LAA", // Los Angeles Angels
    BAL: "BAL", // Baltimore Orioles
    BOS: "BOS", // Boston Red Sox
    CWS: "CHW", // Chicago White Sox
    CHW: "CHW", // Chicago White Sox (alternative)
    CLE: "CLE", // Cleveland Guardians
    DET: "DET", // Detroit Tigers
    HOU: "HOU", // Houston Astros
    KC: "KC", // Kansas City Royals
    MIN: "MIN", // Minnesota Twins
    NYY: "NYY", // New York Yankees
    OAK: "OAK", // Oakland Athletics
    A: "OAK", // Oakland Athletics (alternative)
    ATH: "OAK", // Oakland Athletics (alternative)
    Athletics: "OAK", // Oakland Athletics (full name)
    SEA: "SEA", // Seattle Mariners
    TB: "TB", // Tampa Bay Rays
    TEX: "TEX", // Texas Rangers
    TOR: "TOR", // Toronto Blue Jays
    // National League
    ARI: "AZ", // Arizona Diamondbacks
    ATL: "ATL", // Atlanta Braves
    CHC: "CHC", // Chicago Cubs
    CIN: "CIN", // Cincinnati Reds
    COL: "COL", // Colorado Rockies
    LAD: "LAD", // Los Angeles Dodgers
    MIA: "MIA", // Miami Marlins
    MIL: "MIL", // Milwaukee Brewers
    NYM: "NYM", // New York Mets
    PHI: "PHI", // Philadelphia Phillies
    PIT: "PIT", // Pittsburgh Pirates
    SD: "SD", // San Diego Padres
    SF: "SF", // San Francisco Giants
    STL: "STL",
    WSH: "WSH",
  }
  const upperAbbr = abbr.toUpperCase()
  return teamAbbreviationMap[upperAbbr] || upperAbbr
}

function getStandardAbbreviation(teamName: string): string {
  // Handle common variations first
  const variationMap: Record<string, string> = {
    ATH: "OAK",
    Athletics: "OAK",
    "A's": "OAK",
    CWS: "CHW",
    "White Sox": "CHW",
  }
  // Check variations first
  if (variationMap[teamName]) {
    return variationMap[teamName]
  }
  const teamMap: Record<string, string> = {
    // American League
    "Los Angeles Angels": "LAA",
    "Baltimore Orioles": "BAL",
    "Boston Red Sox": "BOS",
    "Chicago White Sox": "CHW",
    "Cleveland Guardians": "CLE",
    "Detroit Tigers": "DET",
    "Houston Astros": "HOU",
    "Kansas City Royals": "KC",
    "Minnesota Twins": "MIN",
    "New York Yankees": "NYY",
    "Oakland Athletics": "OAK",
    "Seattle Mariners": "SEA",
    "Tampa Bay Rays": "TB",
    "Texas Rangers": "TEX",
    "Toronto Blue Jays": "TOR",
    // National League
    "Arizona Diamondbacks": "AZ",
    "Atlanta Braves": "ATL",
    "Chicago Cubs": "CHC",
    "Cincinnati Reds": "CIN",
    "Colorado Rockies": "COL",
    "Los Angeles Dodgers": "LAD",
    "Miami Marlins": "MIA",
    "Milwaukee Brewers": "MIL",
    "New York Mets": "NYM",
    "Philadelphia Phillies": "PHI",
    "Pittsburgh Pirates": "PIT",
    "San Diego Padres": "SD",
    "San Francisco Giants": "SF",
    "St. Louis Cardinals": "STL",
    "Washington Nationals": "WSH",
  }
  return teamMap[teamName] || teamName.slice(0, 3).toUpperCase()
}

// Update the sportsbook ID mapping to be more comprehensive
const SPORTSBOOK_ID_MAP: Record<string, string> = {
  // ESPN Bet variations
  espnbet: "espn bet",
  espn_bet: "espn bet",
  "espn-bet": "espn bet",
  espn: "espn bet",

  // Caesars variations
  "william hill": "caesars",
  williamhill: "caesars",
  williamhill_us: "caesars",
  caesars: "caesars",

  // Bally Bet variations
  "bally bet": "bally bet",
  ballybet: "bally bet",
  bally: "bally bet",
  bally_bet: "bally bet",

  // Hard Rock variations
  "hard rock bet": "hard rock bet",
  hardrockbet: "hard rock bet",
  "hard rock": "hard rock bet",
  hardrock: "hard rock bet",

  // BetMGM variations
  "bet mgm": "betmgm",
  mgm: "betmgm",
  betmgm: "betmgm",

  // DraftKings variations
  draftkings: "draftkings",
  dk: "draftkings",

  // FanDuel variations
  fanduel: "fanduel",
  fd: "fanduel",

  // BetRivers variations
  betrivers: "betrivers",
  rivers: "betrivers",
  bet_rivers: "betrivers",

  // Fanatics variations
  fanatics: "fanatics",
  fanatics_sportsbook: "fanatics",

  // Pinnacle variations
  pinnacle: "pinnacle",
  pin: "pinnacle",

  // Others
  novig: "novig",
  superbook: "superbook",
  bet365: "bet365",
}

// Update the REVERSE_SPORTSBOOK_MAP to match the correct ID for Caesars
const REVERSE_SPORTSBOOK_MAP: Record<string, string> = {
  "espn bet": "espnbet",
  caesars: "williamhill_us", // This is correct but let's update the logo handling
  "bally bet": "ballybet",
  "hard rock bet": "hardrockbet",
  betmgm: "betmgm",
  draftkings: "draftkings",
  fanduel: "fanduel",
  betrivers: "betrivers",
  fanatics: "fanatics",
  pinnacle: "pinnacle",
  novig: "novig",
  superbook: "superbook",
  bet365: "bet365",
}

interface PropComparisonTableV2Props {
  data: PlayerOdds[]
  sortField: "odds" | "line" | "edge" | "name" | "ev"
  sortDirection: "asc" | "desc"
  onSortChange: (field: "odds" | "line" | "edge" | "name" | "ev", direction: "asc" | "desc") => void
  bestOddsFilter: BestOddsFilter | null
  evMethod: "market-average" | "no-vig"
  globalLine: string | null
}

// Format date and time
function formatGameDateTime(date: string) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

// Format odds to always show + for positive odds
function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : odds.toString()
}

// Convert American odds to decimal
function americanToDecimal(americanOdds: number): number {
  if (americanOdds === 0) return 1
  return americanOdds > 0 ? americanOdds / 100 + 1 : 100 / Math.abs(americanOdds) + 1
}

// Calculate implied probability from American odds
function calculateImpliedProbability(odds: number): number {
  return odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100)
}

// Calculate profit per unit from American odds
function calculateProfitPerUnit(odds: number): number {
  // For positive odds: +130 means $1.30 profit per $1
  // For negative odds: -150 means $100/150 = $0.67 profit per $1
  return odds > 0 ? odds / 100 : 100 / Math.abs(odds)
}

// Helper functions for EV calculation
function getTop3Odds(odds: Record<string, BookmakerOdds>, type: "over" | "under"): number[] {
  return Object.values(odds)
    .filter((bookOdds) => (type === "over" ? bookOdds.over?.price : bookOdds.under?.price))
    .map((bookOdds) => (type === "over" ? bookOdds.over!.price : bookOdds.under!.price))
    .sort((a, b) =>
      type === "over"
        ? b - a // Highest odds for over
        : Math.abs(a) - Math.abs(b),
    ) // Lowest absolute value for under
    .slice(0, 3)
}

function calculateNoVigEV(
  bestOdds: number,
  odds: Record<string, BookmakerOdds>,
  type: "over" | "under",
): number | null {
  // Get top 3 odds for both sides
  const top3Over = getTop3Odds(odds, "over")
  const top3Under = getTop3Odds(odds, "under")

  if (top3Over.length < 3 || top3Under.length < 3) return null

  // Calculate average implied probabilities
  const avgOverProb = top3Over.map(calculateImpliedProbability).reduce((a, b) => a + b, 0) / 3
  const avgUnderProb = top3Under.map(calculateImpliedProbability).reduce((a, b) => a + b, 0) / 3

  // Remove vig
  const vigTotal = avgOverProb + avgUnderProb
  const noVigOverProb = avgOverProb / vigTotal
  const noVigUnderProb = avgUnderProb / vigTotal

  // Calculate fair probability based on bet type
  const fairProb = type === "over" ? noVigOverProb : noVigUnderProb

  // Calculate payout multiplier
  const payoutMultiplier = bestOdds > 0 ? bestOdds / 100 : 100 / Math.abs(bestOdds)

  // Calculate EV
  const ev = (fairProb * (1 + payoutMultiplier) - 1) * 100

  return ev
}

// Convert decimal odds to implied probability
function decimalToProbability(decimal: number): number {
  return 1 / decimal
}

// Calculate EV percentage using best odds and average odds
function calculateEVPercentage(bestOdds: number, avgOdds: number): number | null {
  if (!bestOdds || !avgOdds) return null

  const bestDecimal = americanToDecimal(bestOdds)
  const avgDecimal = americanToDecimal(avgOdds)

  if (!bestDecimal || !avgDecimal) return null

  const trueProb = decimalToProbability(avgDecimal)
  const ev = (trueProb * bestDecimal - 1) * 100

  return Math.round(ev * 10) / 10 // Round to 1 decimal
}

// Calculate average odds, excluding null/undefined values
function calculateAverageOdds(odds: Record<string, BookmakerOdds>) {
  let overDecimalSum = 0
  let overCount = 0
  let underDecimalSum = 0
  let underCount = 0

  Object.values(odds).forEach((bookOdds) => {
    if (bookOdds?.over?.price) {
      overDecimalSum += americanToDecimal(bookOdds.over.price)
      overCount++
    }
    if (bookOdds?.under?.price) {
      underDecimalSum += americanToDecimal(bookOdds.under.price)
      underCount++
    }
  })

  return {
    over: overCount > 0 ? decimalToAmerican(overDecimalSum / overCount) : null,
    under: underCount > 0 ? decimalToAmerican(underDecimalSum / underCount) : null,
  }
}

interface ProcessedPlayerOdds extends PlayerOdds {
  bestOverOdds: OddsPrice | null
  bestUnderOdds: OddsPrice | null
  bestOverPrice: number
  bestUnderPrice: number
  bestOverBook: string
  bestUnderBook: string
  activeLine: string
}

// Update the renderClickableOdds function
function renderClickableOdds(odds: OddsPrice | null | undefined, type: "over" | "under" | null = null): JSX.Element {
  if (!odds) {
    return <span className="text-sm text-muted-foreground">-</span>
  }

  return <OddsDisplay odds={odds.price} link={odds.link} className="text-sm" />
}

// Update the renderEV function to include both average and fair odds in tooltip
function renderEV(
  bestOdds: number | null | undefined,
  avgOdds: number | null | undefined,
  marketOverOdds: number | null | undefined,
  marketUnderOdds: number | null | undefined,
  method: "market-average" | "no-vig" = "market-average",
  odds: Record<string, BookmakerOdds>,
  type: "over" | "under",
): JSX.Element {
  if (!bestOdds)
    return (
      <div className="min-w-[30px] text-center">
        <span className="text-gray-500">-</span>
      </div>
    )

  let ev: number | null = null
  let fairOdds: number | null = null

  if (method === "market-average") {
    if (!avgOdds)
      return (
        <div className="min-w-[30px] text-center">
          <span className="text-gray-500">-</span>
        </div>
      )
    ev = calculateEVPercentage(bestOdds, avgOdds)
    fairOdds = avgOdds
  } else {
    ev = calculateNoVigEV(bestOdds, odds, type)
    if (!ev)
      return (
        <div className="min-w-[30px] text-center">
          <span className="text-gray-500">-</span>
        </div>
      )

    // Calculate fair odds
    const top3Over = getTop3Odds(odds, "over")
    const top3Under = getTop3Odds(odds, "under")

    if (top3Over.length >= 3 && top3Under.length >= 3) {
      const avgOverProb = top3Over.map(calculateImpliedProbability).reduce((a, b) => a + b, 0) / 3
      const avgUnderProb = top3Under.map(calculateImpliedProbability).reduce((a, b) => a + b, 0) / 3
      const vigTotal = avgOverProb + avgUnderProb
      const noVigProb = type === "over" ? avgOverProb / vigTotal : avgUnderProb / vigTotal
      fairOdds = decimalToAmerican(1 / noVigProb)
    }
  }

  // Only show positive EV
  if (!ev || ev <= 0)
    return (
      <div className="min-w-[30px] text-center">
        <span className="text-gray-500">-</span>
      </div>
    )

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="min-w-[30px] text-center">
            <span className="text-green-500">+{ev.toFixed(1)}%</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p>Your odds: {formatOdds(bestOdds)}</p>
            {fairOdds && <p>Fair odds: {formatOdds(fairOdds)}</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Helper function to format odds list for tooltip
function formatOddsList(
  odds: Record<string, { over?: { price: number } | null; under?: { price: number } | null }>,
  type: "over" | "under",
): string {
  return Object.entries(odds)
    .filter(([_, bookOdds]) => (type === "over" ? bookOdds.over?.price : bookOdds.under?.price))
    .map(([bookId, bookOdds]) => {
      const price = type === "over" ? bookOdds.over!.price : bookOdds.under!.price
      return `${bookId}: ${formatOdds(price)}`
    })
    .join(", ")
}

// Helper function to get fair odds explanation
function getFairOddsExplanation(odds: Record<string, BookmakerOdds>, type: "over" | "under"): string {
  const validBooks = Object.entries(odds).filter(([_, bookOdds]) =>
    type === "over" ? bookOdds.over?.price : bookOdds.under?.price,
  )
  const hasPinnacle = validBooks.some(([bookId]) => bookId.toLowerCase().includes("pinnacle"))

  return `Based on ${validBooks.length} books${hasPinnacle ? " (including Pinnacle with 10x weight)" : ""}`
}

// Add helper function to calculate max EV
function getMaxEV(
  item: ProcessedPlayerOdds,
  evMethod: "market-average" | "no-vig",
  avgOdds: { over: number | null; under: number | null },
): number {
  const odds = item.lines[item.activeLine]

  // Calculate over EV
  let overEV: number | null = null
  if (item.bestOverOdds?.price) {
    if (evMethod === "market-average") {
      overEV = avgOdds.over ? calculateEVPercentage(item.bestOverOdds.price, avgOdds.over) : null
    } else {
      overEV = calculateNoVigEV(item.bestOverOdds.price, odds, "over")
    }
  }

  // Calculate under EV
  let underEV: number | null = null
  if (item.bestUnderOdds?.price) {
    if (evMethod === "market-average") {
      underEV = avgOdds.under ? calculateEVPercentage(item.bestUnderOdds.price, avgOdds.under) : null
    } else {
      underEV = calculateNoVigEV(item.bestUnderOdds.price, odds, "under")
    }
  }

  // Return the maximum positive EV, or -Infinity if no positive EVs
  const maxEV = Math.max(overEV || Number.NEGATIVE_INFINITY, underEV || Number.NEGATIVE_INFINITY)

  return maxEV > 0 ? maxEV : Number.NEGATIVE_INFINITY
}

export function PropComparisonTableV2({
  data,
  sortField,
  sortDirection,
  onSortChange,
  bestOddsFilter,
  evMethod = "market-average",
  globalLine,
}: PropComparisonTableV2Props) {
  const activeSportsbooks = sportsbooks.filter((book) => book.isActive)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set())
  const [showBetslipDialog, setShowBetslipDialog] = useState(false)
  const [pendingSelection, setPendingSelection] = useState<any>(null)

  const { betslips, handleBetslipSelect, handleCreateBetslip, conflictingSelection, handleResolveConflict } =
    useBetActions()

  // Function to create betslip selection
  const createBetslipSelection = (item: PlayerOdds, type: "over" | "under") => {
    const activeLine = globalLine && item.lines?.[globalLine] ? globalLine : Object.keys(item.lines || {})[0]
    const lineOdds = item.lines?.[activeLine] || {}
    const oddsData: Record<string, any> = {}

    Object.entries(lineOdds).forEach(([bookId, bookOdds]) => {
      const mappedId = SPORTSBOOK_ID_MAP[bookId.toLowerCase()] || bookId.toLowerCase()
      if (bookOdds) {
        oddsData[mappedId] = {
          over: bookOdds.over
            ? {
                ...bookOdds.over,
                sid: bookOdds.over.sid || "default", // Ensure sid is always present
              }
            : null,
          under: bookOdds.under
            ? {
                ...bookOdds.under,
                sid: bookOdds.under.sid || "default", // Ensure sid is always present
              }
            : null,
          line: Number.parseFloat(activeLine),
          last_update: new Date().toISOString(),
        }
      }
    })

    return {
      event_id: item.event_id,
      sport_key: "baseball_mlb", // Make this dynamic based on sport
      market_key: item.market,
      market_type: "player_props",
      bet_type: type,
      player_name: item.description,
      player_id: item.player_id,
      player_team: item.team,
      line: Number.parseFloat(activeLine),
      commence_time: item.commence_time,
      home_team: item.home_team || "",
      away_team: item.away_team || "",
      odds_data: oddsData,
      market_display:
        item.market_display ||
        item.market
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
      selection: type === "over" ? "Over" : "Under", // Add the selection parameter
    }
  }

  // Function to handle adding to betslip
  const handleAddToBetslip = (item: PlayerOdds, type: "over" | "under") => {
    const selection = createBetslipSelection(item, type)
    setPendingSelection(selection)
    setShowBetslipDialog(true)
  }

  // Process data to include best odds for each selection
  const processedData: ProcessedPlayerOdds[] = useMemo(() => {
    return data.map((item) => {
      // When using standard lines, use the primary_line from Redis if available
      // Otherwise, use global line if available and the player has odds for that line
      const activeLine =
        !globalLine && item.primary_line
          ? item.primary_line
          : globalLine && item.lines?.[globalLine]
            ? globalLine
            : Object.keys(item.lines || {})[0]

      const lineOdds = item.lines?.[activeLine] || {}

      // Find best odds for over/under
      let bestOverOdds: OddsPrice | null = null
      let bestUnderOdds: OddsPrice | null = null
      let bestOverPrice = Number.NEGATIVE_INFINITY
      let bestUnderPrice = Number.NEGATIVE_INFINITY
      let bestOverBook = ""
      let bestUnderBook = ""

      // Process odds for each sportsbook
      Object.entries(lineOdds).forEach(([bookId, bookOdds]) => {
        const mappedId = SPORTSBOOK_ID_MAP[bookId] || bookId
        if (bookOdds.over && bookOdds.over.price > bestOverPrice) {
          bestOverPrice = bookOdds.over.price
          bestOverBook = mappedId
          bestOverOdds = {
            ...bookOdds.over,
            sid: bookOdds.over.sid || "default",
          }
        }
        if (bookOdds.under && bookOdds.under.price > bestUnderPrice) {
          bestUnderPrice = bookOdds.under.price
          bestUnderBook = mappedId
          bestUnderOdds = {
            ...bookOdds.under,
            sid: bookOdds.under.sid || "default",
          }
        }
      })

      return {
        ...item,
        bestOverOdds,
        bestUnderOdds,
        bestOverPrice: bestOverPrice === Number.NEGATIVE_INFINITY ? 0 : bestOverPrice,
        bestUnderPrice: bestUnderPrice === Number.NEGATIVE_INFINITY ? 0 : bestUnderPrice,
        bestOverBook,
        bestUnderBook,
        activeLine,
      }
    })
  }, [data, globalLine])

  // Update the renderSportsbookLogo function to use sportsbooks data
  const renderSportsbookLogo = (bookId: string, size: "sm" | "md" | "lg" = "sm") => {
    const mappedId = REVERSE_SPORTSBOOK_MAP[bookId.toLowerCase()] || bookId.toLowerCase()
    const sportsbook = sportsbooks.find((book) => book.id.toLowerCase() === mappedId)

    if (!sportsbook) {
      console.warn(`No sportsbook found for ID: ${bookId} (mapped: ${mappedId})`)
      return null
    }

    const sizes = {
      sm: 20,
      md: 24,
      lg: 32
    }

    return (
      <Image
        src={sportsbook.logo || "/placeholder.svg"}
        alt={`${sportsbook.name} logo`}
        width={sizes[size]}
        height={sizes[size]}
        className="object-contain"
      />
    )
  }

  // Toggle row expansion
  const toggleRow = (playerId: string | number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(Array.from(prev))
      if (newSet.has(playerId.toString())) {
        newSet.delete(playerId.toString())
      } else {
        newSet.add(playerId.toString())
      }
      return newSet
    })
  }

  // Update the mobile row renderer
  const renderMobileRow = (item: ProcessedPlayerOdds) => {
    const odds = item.lines[item.activeLine]
    const teamAbbr = getStandardAbbreviation(item.team)
    const isExpanded = expandedRows.has(item.player_id.toString())
    const avgOdds = calculateAverageOdds(odds)

    return (
      <>
        <TableRow
          key={item.player_id.toString()}
          className="cursor-pointer hover:bg-muted/50"
          onClick={() => toggleRow(item.player_id)}
        >
          <TableCell>
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <span className="font-medium">{item.description}</span>
                <div className="flex items-center gap-1">
                  <Image
                    src={`/images/mlb-teams/${getTeamLogoFilename(teamAbbr)}.svg`}
                    alt={teamAbbr}
                    width={16}
                    height={16}
                    className="h-4 w-4"
                  />
                  <span className="text-xs text-muted-foreground">{teamAbbr}</span>
                </div>
              </div>
              <motion.div
                initial={false}
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-muted-foreground"
              >
                <ChevronDown className="h-5 w-5" />
              </motion.div>
            </div>
          </TableCell>
          <TableCell className="text-center">
            <span className="font-medium">{item.activeLine}</span>
          </TableCell>
          <TableCell className="text-center">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-1 px-2 py-1 rounded bg-gray-100 dark:bg-gray-900">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">O</span>
                  {renderClickableOdds(item.bestOverOdds, "over")}
                </div>
                {item.bestOverBook && renderSportsbookLogo(item.bestOverBook, "sm")}
              </div>
              <div className="flex items-center justify-between gap-1 px-2 py-1 rounded bg-gray-100 dark:bg-gray-900">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">U</span>
                  {renderClickableOdds(item.bestUnderOdds, "under")}
                </div>
                {item.bestUnderBook && renderSportsbookLogo(item.bestUnderBook, "sm")}
              </div>
            </div>
          </TableCell>
          <TableCell>
            <div className="flex flex-col gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="w-full">
                    <div className="flex items-center justify-between gap-2 px-2 py-1 rounded bg-gray-100 dark:bg-gray-900">
                      {renderEV(
                        item.bestOverOdds?.price,
                        avgOdds.over || null,
                        item.bestOverOdds?.price || null,
                        item.bestUnderOdds?.price || null,
                        evMethod,
                        item.lines[item.activeLine],
                        "over",
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{getFairOddsExplanation(item.lines[item.activeLine], "over")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="w-full">
                    <div className="flex items-center justify-between gap-2 px-2 py-1 rounded bg-gray-100 dark:bg-gray-900">
                      {renderEV(
                        item.bestUnderOdds?.price,
                        avgOdds.under || null,
                        item.bestOverOdds?.price || null,
                        item.bestUnderOdds?.price || null,
                        evMethod,
                        item.lines[item.activeLine],
                        "under",
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{getFairOddsExplanation(item.lines[item.activeLine], "under")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </TableCell>
          <TableCell className="text-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-full min-w-[40px] px-2",
                      "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-400",
                      "dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30 dark:hover:text-emerald-300",
                      "border-emerald-500/20",
                      !item.bestOverOdds && "opacity-50 cursor-not-allowed",
                    )}
                    onClick={() => handleAddToBetslip(item, "over")}
                    disabled={!item.bestOverOdds}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    O
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {item.bestOverOdds
                    ? "Add Over to betslip to compare across sportsbooks"
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
                      "w-full min-w-[40px] px-2",
                      "bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400",
                      "dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30 dark:hover:text-red-300",
                      "border-red-500/20",
                      !item.bestUnderOdds && "opacity-50 cursor-not-allowed",
                    )}
                    onClick={() => handleAddToBetslip(item, "under")}
                    disabled={!item.bestUnderOdds}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    U
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {item.bestUnderOdds
                    ? "Add Under to betslip to compare across sportsbooks"
                    : "No odds available for Under"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TableCell>
        </TableRow>
        {isExpanded && (
          <TableRow className="bg-muted/30">
            <TableCell colSpan={4} className="p-4">
              <div className="border-t border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
                <div className="p-2 sm:p-4">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Compare Odds Across Books
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Over Odds</div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {activeSportsbooks
                          .map((book) => {
                            const bookId = book.id.toLowerCase()
                            const mappedId = SPORTSBOOK_ID_MAP[bookId] || bookId
                            const bookOdds =
                              odds[mappedId] || odds[bookId] || odds[SPORTSBOOK_ID_MAP[bookId]] || odds[book.id]
                            const overOdds = bookOdds?.over
                            const hasOverBestOdds = book.id === item.bestOverBook

                            if (!overOdds) return null

                            return {
                              book,
                              odds: overOdds,
                              hasBestOdds: hasOverBestOdds,
                            }
                          })
                          .filter(Boolean)
                          .sort((a, b) => (b.odds.price || 0) - (a.odds.price || 0))
                          .map(({ book, odds: overOdds, hasBestOdds: hasOverBestOdds }) => (
                            <button
                              key={`${book.id}-over`}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded-lg border transition-all duration-200",
                                "hover:scale-105 hover:shadow-md active:scale-95",
                                hasOverBestOdds
                                  ? "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-950/30 dark:to-emerald-900/30 dark:border-emerald-800"
                                  : "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 dark:from-gray-800 dark:to-gray-700 dark:border-gray-600",
                              )}
                            >
                              <div className="w-6 h-6 bg-white dark:bg-gray-800 rounded-md shadow-sm flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-gray-600">
                                {renderSportsbookLogo(book.id, "sm")}
                              </div>
                              <span
                                className={cn(
                                  "text-sm font-medium",
                                  hasOverBestOdds
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-gray-900 dark:text-white",
                                )}
                              >
                                {formatOdds(overOdds.price)}
                              </span>
                            </button>
                          ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Under Odds</div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {activeSportsbooks
                          .map((book) => {
                            const bookId = book.id.toLowerCase()
                            const mappedId = SPORTSBOOK_ID_MAP[bookId] || bookId
                            const bookOdds =
                              odds[mappedId] || odds[bookId] || odds[SPORTSBOOK_ID_MAP[bookId]] || odds[book.id]
                            const underOdds = bookOdds?.under
                            const hasUnderBestOdds = book.id === item.bestUnderBook

                            if (!underOdds) return null

                            return {
                              book,
                              odds: underOdds,
                              hasBestOdds: hasUnderBestOdds,
                            }
                          })
                          .filter(Boolean)
                          .sort((a, b) => (b.odds.price || 0) - (a.odds.price || 0))
                          .map(({ book, odds: underOdds, hasBestOdds: hasUnderBestOdds }) => (
                            <button
                              key={`${book.id}-under`}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded-lg border transition-all duration-200",
                                "hover:scale-105 hover:shadow-md active:scale-95",
                                hasUnderBestOdds
                                  ? "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-950/30 dark:to-emerald-900/30 dark:border-emerald-800"
                                  : "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 dark:from-gray-800 dark:to-gray-700 dark:border-gray-600",
                              )}
                            >
                              <div className="w-6 h-6 bg-white dark:bg-gray-800 rounded-md shadow-sm flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-gray-600">
                                {renderSportsbookLogo(book.id, "sm")}
                              </div>
                              <span
                                className={cn(
                                  "text-sm font-medium",
                                  hasUnderBestOdds
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-gray-900 dark:text-white",
                                )}
                              >
                                {formatOdds(underOdds.price)}
                              </span>
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TableCell>
          </TableRow>
        )}
      </>
    )
  }

  // Sort and filter the processed data
  const sortedData = useMemo(() => {
    // First filter the data based on bestOddsFilter
    let filteredData = [...processedData]

    if (bestOddsFilter) {
      filteredData = filteredData.filter((item) => {
        const lineOdds = item.lines[item.activeLine] || {}
        const bookOdds = lineOdds[bestOddsFilter.sportsbook]

        if (!bookOdds) return false

        // For over bets, check if this book has the best over odds
        if (bestOddsFilter.type === "over") {
          return (
            bookOdds.over &&
            bookOdds.over.price === item.bestOverPrice &&
            item.bestOverBook === bestOddsFilter.sportsbook
          )
        }

        // For under bets, check if this book has the best under odds
        if (bestOddsFilter.type === "under") {
          return (
            bookOdds.under &&
            bookOdds.under.price === item.bestUnderPrice &&
            item.bestUnderBook === bestOddsFilter.sportsbook
          )
        }

        return false
      })
    }

    // Then sort the filtered data
    return filteredData.sort((a, b) => {
      if (sortField === "name") {
        return sortDirection === "asc"
          ? a.description.localeCompare(b.description)
          : b.description.localeCompare(a.description)
      }

      if (sortField === "line") {
        return sortDirection === "asc"
          ? Number.parseFloat(a.activeLine) - Number.parseFloat(b.activeLine)
          : Number.parseFloat(b.activeLine) - Number.parseFloat(a.activeLine)
      }

      if (sortField === "odds") {
        const aOdds = Math.max(a.bestOverPrice, a.bestUnderPrice)
        const bOdds = Math.max(b.bestOverPrice, b.bestUnderPrice)
        return sortDirection === "asc" ? aOdds - bOdds : bOdds - aOdds
      }

      if (sortField === "ev") {
        const avgOddsA = calculateAverageOdds(a.lines[a.activeLine])
        const avgOddsB = calculateAverageOdds(b.lines[b.activeLine])

        const maxEVA = getMaxEV(a, evMethod, avgOddsA)
        const maxEVB = getMaxEV(b, evMethod, avgOddsB)

        return sortDirection === "asc" ? maxEVA - maxEVB : maxEVB - maxEVA
      }

      return 0
    })
  }, [processedData, sortField, sortDirection, evMethod, bestOddsFilter])

  return (
    <>
    <div
      className={cn(
        "rounded-md border bg-slate-950/50 backdrop-blur-sm",
        isMobile && "-mx-4 border-x-0 rounded-none",
      )}
    >
      <div className="relative h-[70vh] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-30 bg-slate-950 border-b border-slate-800 shadow-lg">
            <TableRow className="hover:bg-transparent border-slate-800">
              {isMobile ? (
                <>
                  <TableHead className="w-[35%] bg-slate-950 text-slate-200 font-semibold sticky top-0">Player</TableHead>
                  <TableHead className="w-[15%] text-center bg-slate-950 text-slate-200 font-semibold sticky top-0">
                    Line
                  </TableHead>
                  <TableHead className="w-[30%] text-center bg-slate-950 text-slate-200 font-semibold sticky top-0">
                    Odds
                  </TableHead>
                  <TableHead className="w-[20%] text-center bg-slate-950 text-slate-200 font-semibold sticky top-0">
                    EV%
                  </TableHead>
                  <TableHead className="w-[10%] text-center bg-slate-950 text-slate-200 font-semibold sticky top-0">
                    Act
                  </TableHead>
                </>
              ) : (
                <>
                  <TableHead className="w-[300px] bg-slate-950 text-slate-200 font-semibold sticky top-0">
                    <div className="flex items-center justify-between gap-1">
                      <span>Player</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                        onClick={() =>
                          onSortChange(
                            "name",
                            sortField === "name" ? (sortDirection === "asc" ? "desc" : "asc") : "asc",
                          )
                        }
                      >
                        {sortField === "name" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </TableHead>
                  <TableHead className="w-[80px] text-center bg-slate-950 text-slate-200 font-semibold sticky top-0">
                    <div className="flex items-center justify-between gap-1">
                      <span>Line</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                        onClick={() =>
                          onSortChange(
                            "line",
                            sortField === "line" ? (sortDirection === "asc" ? "desc" : "asc") : "asc",
                          )
                        }
                      >
                        {sortField === "line" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </TableHead>
                  <TableHead className="w-[120px] bg-slate-950 text-slate-200 font-semibold sticky top-0">
                    <div className="flex items-center justify-between gap-1">
                      <span>Best Odds</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                        onClick={() =>
                          onSortChange(
                            "odds",
                            sortField === "odds" ? (sortDirection === "asc" ? "desc" : "asc") : "asc",
                          )
                        }
                      >
                        {sortField === "odds" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </TableHead>
                  <TableHead className="w-[100px] bg-slate-950 text-slate-200 font-semibold sticky top-0">
                    <span>Avg Odds</span>
                  </TableHead>
                  <TableHead className="bg-slate-950 text-slate-200 font-semibold sticky top-0">
                    <div className="flex items-center justify-end gap-1">
                      <span>EV%</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                        onClick={() =>
                          onSortChange("ev", sortField === "ev" ? (sortDirection === "asc" ? "desc" : "asc") : "desc")
                        }
                      >
                        {sortField === "ev" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </TableHead>
                  {activeSportsbooks.map((book) => (
                    <TableHead key={book.id} className="text-center w-[80px] bg-slate-950 sticky top-0">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex justify-center">
                              {renderSportsbookLogo(book.id, "lg")}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{book.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                  ))}
                  <TableHead className="w-[60px] text-center bg-slate-950 text-slate-200 font-semibold sticky top-0">
                    Actions
                  </TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((item) => {
              if (isMobile) {
                return renderMobileRow(item)
              }

              const odds = item.lines[item.activeLine]
              const teamAbbr = getStandardAbbreviation(item.team)
              const homeTeamAbbr = getStandardAbbreviation(item.home_team || "")
              const awayTeamAbbr = getStandardAbbreviation(item.away_team || "")
              const isHomeTeam = teamAbbr === homeTeamAbbr
              const avgOdds = calculateAverageOdds(odds)

              return (
                <TableRow key={item.player_id} className="border-slate-800 hover:bg-slate-900/50">
                  {/* Player cell */}
                  <TableCell className="text-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={`https://img.mlbstatic.com/mlb-photos/image/upload/w_48,q_100/v1/people/${item.player_id}/headshot/silo/current`}
                            alt={item.description}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-slate-800 text-slate-200">
                            {item.description
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1">
                          <Image
                            src={`/images/mlb-teams/${getTeamLogoFilename(teamAbbr)}.svg`}
                            alt={teamAbbr}
                            width={20}
                            height={20}
                            className="h-5 w-5"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-200">{item.description}</span>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>{formatGameDateTime(item.commence_time)}</span>
                          <div className="flex items-center gap-1">
                            {isHomeTeam ? (
                              <>
                                <span className="text-xs">vs</span>
                                <Image
                                  src={`/images/mlb-teams/${getTeamLogoFilename(awayTeamAbbr)}.svg`}
                                  alt={awayTeamAbbr}
                                  width={16}
                                  height={16}
                                  className="h-4 w-4"
                                />
                              </>
                            ) : (
                              <>
                                <span className="text-xs">@</span>
                                <Image
                                  src={`/images/mlb-teams/${getTeamLogoFilename(homeTeamAbbr)}.svg`}
                                  alt={homeTeamAbbr}
                                  width={16}
                                  height={16}
                                  className="h-4 w-4"
                                />
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                    {/* Line cell */}
                    <TableCell className="text-center">
                      <span className="font-medium text-slate-200">{item.activeLine}</span>
                    </TableCell>
                    {/* Best Odds cell */}
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-1 px-2 py-1 rounded bg-slate-800/50">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-400">O</span>
                            {renderClickableOdds(item.bestOverOdds, "over")}
                          </div>
                          {item.bestOverBook && renderSportsbookLogo(item.bestOverBook, "sm")}
                        </div>
                        <div className="flex items-center justify-between gap-1 px-2 py-1 rounded bg-slate-800/50">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-400">U</span>
                            {renderClickableOdds(item.bestUnderOdds, "under")}
                          </div>
                          {item.bestUnderBook && renderSportsbookLogo(item.bestUnderBook, "sm")}
                        </div>
                      </div>
                    </TableCell>
                    {/* Avg Odds cell */}
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-1 px-2 py-1 rounded bg-slate-800/50">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-400">O</span>
                            <span className="text-sm text-slate-300">{avgOdds.over ? formatOdds(avgOdds.over) : "-"}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-1 px-2 py-1 rounded bg-slate-800/50">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-400">U</span>
                            <span className="text-sm text-slate-300">{avgOdds.under ? formatOdds(avgOdds.under) : "-"}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    {/* EV% cell */}
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="w-full">
                              <div className="flex items-center justify-center px-2 py-1 rounded bg-slate-800/50">
                                {renderEV(
                                  item.bestOverOdds?.price,
                                  avgOdds.over || null,
                                  item.bestOverOdds?.price || null,
                                  item.bestUnderOdds?.price || null,
                                  evMethod,
                                  item.lines[item.activeLine],
                                  "over",
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{getFairOddsExplanation(item.lines[item.activeLine], "over")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="w-full">
                              <div className="flex items-center justify-center px-2 py-1 rounded bg-slate-800/50">
                                {renderEV(
                                  item.bestUnderOdds?.price,
                                  avgOdds.under || null,
                                  item.bestOverOdds?.price || null,
                                  item.bestUnderOdds?.price || null,
                                  evMethod,
                                  item.lines[item.activeLine],
                                  "under",
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{getFairOddsExplanation(item.lines[item.activeLine], "under")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                    {/* Sportsbook cells */}
                    {activeSportsbooks.map((book) => {
                      const bookId = book.id.toLowerCase()
                      const mappedId = SPORTSBOOK_ID_MAP[bookId] || bookId
                      const bookOdds =
                        odds[mappedId] || odds[bookId] || odds[SPORTSBOOK_ID_MAP[bookId]] || odds[book.id]

                      // Normalize the IDs before comparison
                      const normalizedBookId = SPORTSBOOK_ID_MAP[book.id.toLowerCase()] || book.id.toLowerCase()
                      const normalizedBestOverBook =
                        SPORTSBOOK_ID_MAP[item.bestOverBook?.toLowerCase()] || item.bestOverBook?.toLowerCase()
                      const normalizedBestUnderBook =
                        SPORTSBOOK_ID_MAP[item.bestUnderBook?.toLowerCase()] || item.bestUnderBook?.toLowerCase()

                      const isOverBest = normalizedBookId === normalizedBestOverBook
                      const isUnderBest = normalizedBookId === normalizedBestUnderBook

                      return (
                        <TableCell key={book.id} className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className={cn("text-slate-200", isOverBest && "text-emerald-400 font-medium")}>
                              {renderClickableOdds(bookOdds?.over)}
                            </div>
                            <div className={cn("text-slate-200", isUnderBest && "text-red-400 font-medium")}>
                              {renderClickableOdds(bookOdds?.under)}
                            </div>
                          </div>
                        </TableCell>
                      )
                    })}
                    {/* Add Actions cell at the end */}
                    <TableCell className="p-1">
                      <div className="flex flex-col gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "w-full min-w-[40px] px-2",
                                  "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-400",
                                  "dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30 dark:hover:text-emerald-300",
                                  "border-emerald-500/20",
                                  !item.bestOverOdds && "opacity-50 cursor-not-allowed",
                                )}
                                onClick={() => handleAddToBetslip(item, "over")}
                                disabled={!item.bestOverOdds}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                O
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {item.bestOverOdds
                                ? "Add Over to betslip to compare across sportsbooks"
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
                                  "w-full min-w-[40px] px-2",
                                  "bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400",
                                  "dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30 dark:hover:text-red-300",
                                  "border-red-500/20",
                                  !item.bestUnderOdds && "opacity-50 cursor-not-allowed",
                                )}
                                onClick={() => handleAddToBetslip(item, "under")}
                                disabled={!item.bestUnderOdds}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                U
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {item.bestUnderOdds
                                ? "Add Under to betslip to compare across sportsbooks"
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
                    {Math.ceil(conflictingSelection.existingSelection.line || 0)}+{" "}
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
                    {Math.ceil(conflictingSelection.newSelection.line || 0)}+{" "}
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
