"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, ArrowUp, ArrowDown, Clock, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { sportsbooks } from "@/data/sportsbooks"
import type { TransformedGameOdds } from "@/hooks/use-game-lines-transforms"
import type { GameOddsBookmaker, GameOddsMarket, GameOddsOutcome } from "@/types/game-lines"
import { useMemo, useState } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { OddsDisplay } from "@/components/shared/odds-display"
import { motion } from "framer-motion"
import { useBetActions } from "@/hooks/use-bet-actions"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BetslipDialog } from "@/components/betting/betslip-dialog"
import { getTeamLogoUrl } from "@/lib/constants/sport-assets"

// Helper functions for team logos and abbreviations
function getTeamLogoPath(sport: string): string {
  switch (sport) {
    case "football_nfl":
      return "team-logos/nfl"
    case "basketball_wnba":
      return "team-logos/wnba"
    case "baseball_mlb":
    default:
      return "mlb-teams"
  }
}

function getTeamLogoFilename(abbr: string, sport = "baseball_mlb"): string {
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
    STL: "STL", // St. Louis Cardinals
    WSH: "WSH", // Washington Nationals
  }
  const upperAbbr = abbr.toUpperCase()
  return teamAbbreviationMap[upperAbbr] || upperAbbr
}

// Format date and time
function formatGameDateTime(date: string) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

function formatGameDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
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

// Convert decimal odds to American
function decimalToAmerican(decimalOdds: number): number {
  if (decimalOdds === 1) return 0
  const american = decimalOdds >= 2 ? Math.round((decimalOdds - 1) * 100) : Math.round(-100 / (decimalOdds - 1))
  return american
}

// Calculate implied probability from American odds
function calculateImpliedProbability(odds: number): number {
  return odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100)
}

// Calculate EV percentage using best odds and average odds
function calculateEVPercentage(bestOdds: number, avgOdds: number): number | null {
  if (!bestOdds || !avgOdds) return null

  const bestDecimal = americanToDecimal(bestOdds)
  const avgDecimal = americanToDecimal(avgOdds)

  if (!bestDecimal || !avgDecimal) return null

  const trueProb = 1 / avgDecimal
  const ev = (trueProb * bestDecimal - 1) * 100

  return Math.round(ev * 10) / 10 // Round to 1 decimal
}

// Function to format total line with odds
function formatTotalLine(point: number | undefined, price: number, isOver: boolean): string {
  if (!point) return formatOdds(price)
  return `${isOver ? "o" : "u"}${point} ${formatOdds(price)}`
}

// Using TransformedGameOdds from hooks, which extends the base GameOdds with
// derived fields: best, average, evPct, and activeLine.

interface GameLinesTableV2Props {
  data: TransformedGameOdds[]
  sport: string
  sortField: "time" | "home" | "away" | "odds"
  sortDirection: "asc" | "desc"
  onSortChange: (field: "time" | "home" | "away" | "odds", direction: "asc" | "desc") => void
  evMethod?: "market-average" | "no-vig"
  selectedLine?: string | null
  selectedMarket: string
}

// Add function to calculate average odds for a team
function calculateAverageOdds(game: TransformedGameOdds, teamName: string): number | null {
  let totalOdds = 0
  let count = 0

  game.bookmakers.forEach((bookmaker) => {
    const h2hMarket = bookmaker.markets.find((m) => m.key === "h2h")
    if (h2hMarket) {
      const teamOutcome = h2hMarket.outcomes.find((o) => o.name === teamName)
      if (teamOutcome) {
        totalOdds += teamOutcome.price
        count++
      }
    }
  })

  return count > 0 ? Math.round(totalOdds / count) : null
}

export function GameLinesTableV2({
  data,
  sport,
  sortField,
  sortDirection,
  onSortChange,
  evMethod = "market-average",
  selectedLine,
  selectedMarket,
}: GameLinesTableV2Props) {
  const activeSportsbooks = sportsbooks.filter((book) => book.isActive)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [showBetslipDialog, setShowBetslipDialog] = useState(false)
  const [pendingSelection, setPendingSelection] = useState<any>(null)

  const { betslips, handleBetslipSelect, handleCreateBetslip, conflictingSelection, handleResolveConflict } =
    useBetActions()

  // Toggle row expansion
  const toggleRow = (gameId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(Array.from(prev))
      if (newSet.has(gameId)) {
        newSet.delete(gameId)
      } else {
        newSet.add(gameId)
      }
      return newSet
    })
  }

  // Function to get best odds for a team from bookmakers
  const getBestOdds = (
    game: TransformedGameOdds,
    teamName: string,
    line?: string | null,
  ): { price: number; bookmaker: string; link?: string } | null => {
    let bestOdds: number | null = null
    let bestBook: string | null = null
    let bestLink: string | undefined

    game.bookmakers.forEach((bookmaker: GameOddsBookmaker) => {
      // H2H path (preferred) - new schema uses lines + sportsbooks with home/away
      const h2h = bookmaker.markets.find((m: GameOddsMarket) => m.key === "h2h") as any
      if (h2h?.lines) {
        let candidatePrice: number | null = null
        let candidateLink: string | undefined

        for (const [, ld] of Object.entries<any>(h2h.lines)) {
          const sb = ld?.sportsbooks?.[bookmaker.key]
          if (!sb) continue
          // Prefer standard line per book; if multiple iterate but keep first standard
          const teamKey = teamName.toLowerCase() === (game.away_team?.name || "").toLowerCase() ? "away" : "home"
          const side = sb?.[teamKey]
          if (!side || typeof side.price !== "number") continue
          if (candidatePrice == null || sb.is_standard) {
            candidatePrice = side.price
            candidateLink = side.link
            if (sb.is_standard) break
          }
        }

        if (candidatePrice != null) {
          if (bestOdds === null || candidatePrice > bestOdds) {
            bestOdds = candidatePrice
            bestBook = bookmaker.key
            bestLink = candidateLink
          }
        }
        return
      }

      // Spreads path: team-specific entries in lines map
      const spreads = bookmaker.markets.find((m: GameOddsMarket) => m.key === "spreads") as any
      if (spreads?.lines) {
        for (const [, ld] of Object.entries<any>(spreads.lines)) {
          const sb = ld?.sportsbooks?.[bookmaker.key]
          if (!sb) continue
          const teamKey = teamName.toLowerCase() === (game.away_team?.name || "").toLowerCase() ? "away" : "home"
          const side = sb?.[teamKey]
          if (side && typeof side.price === "number") {
            if (bestOdds === null || side.price > bestOdds) {
              bestOdds = side.price
              bestBook = bookmaker.key
              bestLink = side.link
            }
          }
        }
        return
      }
    })

    return bestOdds && bestBook ? { price: bestOdds, bookmaker: bestBook, link: bestLink } : null
  }

  // Spreads helpers
  const formatSignedPoint = (point: number | null | undefined) => {
    if (point == null || Number.isNaN(Number(point))) return ""
    const n = Number(point)
    return n > 0 ? `+${n}` : `${n}`
  }

  const getBookSpreadStandard = (
    game: TransformedGameOdds,
    bookId: string,
  ): {
    away?: { point: number; price: number; link?: string }
    home?: { point: number; price: number; link?: string }
  } => {
    const spreadsMarket = game.bookmakers.find((b) => b.key === bookId)?.markets.find((m) => m.key === "spreads")
    const result: {
      away?: { point: number; price: number; link?: string }
      home?: { point: number; price: number; link?: string }
    } = {}
    if (!spreadsMarket?.lines) return result
    // Determine consensus abs point in this game for spreads
    const absCounts: Record<string, number> = {}
    game.bookmakers.forEach((b) => {
      const m = b.markets.find((mm) => mm.key === "spreads")
      if (!m?.lines) return
      for (const [, ld] of Object.entries<any>(m.lines)) {
        const k = String(Math.abs(Number(ld.point)))
        absCounts[k] = (absCounts[k] || 0) + 1
      }
    })
    const consensusAbs = Object.entries(absCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k)[0]

    for (const [, ld] of Object.entries<any>(spreadsMarket.lines)) {
      const sb = ld.sportsbooks?.[bookId]
      const isStd = !!sb?.is_standard
      const matchesConsensus = consensusAbs != null && String(Math.abs(Number(ld.point))) === String(consensusAbs)
      if (!sb || (!isStd && !matchesConsensus)) continue
      const point = typeof ld.point === "number" ? ld.point : Number(ld.point)
      if (sb.away && typeof sb.away.price === "number") {
        result.away = { point, price: sb.away.price, link: sb.away.link }
      }
      if (sb.home && typeof sb.home.price === "number") {
        result.home = { point, price: sb.home.price, link: sb.home.link }
      }
    }
    return result
  }

  // For spreads, best line per side across ALL available points (ignore consensus filtering):
  // - Positive: larger number is better; Negative: closer to zero is better. Tie-break on higher price.
  const getBestSpreadAcrossBooks = (game: TransformedGameOdds) => {
    let bestHome: { price: number; book: string; point: number; link?: string } | null = null
    let bestAway: { price: number; book: string; point: number; link?: string } | null = null

    for (const b of game.bookmakers) {
      const spreads = b.markets.find((m) => m.key === "spreads") as any
      if (!spreads?.lines) continue
      for (const [, ld] of Object.entries<any>(spreads.lines)) {
        const sb = ld.sportsbooks?.[b.key]
        if (!sb) continue
        const point = typeof ld.point === "number" ? ld.point : Number(ld.point)
        if (!Number.isFinite(point)) continue

        if (sb.home && typeof sb.home.price === "number") {
          const cur = { price: sb.home.price, book: b.key, point, link: sb.home.link }
          if (!bestHome) bestHome = cur
          else {
            const a = bestHome.point
            const c = cur.point
            const pointBetter = a < 0 && c < 0 ? c > a : a > 0 && c > 0 ? c > a : c > a
            if (pointBetter || (c === a && cur.price > bestHome.price)) bestHome = cur
          }
        }
        if (sb.away && typeof sb.away.price === "number") {
          const cur = { price: sb.away.price, book: b.key, point, link: sb.away.link }
          if (!bestAway) bestAway = cur
          else {
            const a = bestAway.point
            const c = cur.point
            const pointBetter = a < 0 && c < 0 ? c > a : a > 0 && c > 0 ? c > a : c > a
            if (pointBetter || (c === a && cur.price > bestAway.price)) bestAway = cur
          }
        }
      }
    }
    return { home: bestHome, away: bestAway }
  }

  const getAverageSpreadAcrossBooks = (game: TransformedGameOdds) => {
    const home: number[] = []
    const away: number[] = []
    game.bookmakers.forEach((b) => {
      const res = getBookSpreadStandard(game, b.key)
      if (res.home) home.push(res.home.price)
      if (res.away) away.push(res.away.price)
    })
    const toAmericanAvg = (arr: number[]) => {
      if (arr.length === 0) return null
      const decs = arr.map(americanToDecimal)
      const avg = decs.reduce((s, d) => s + d, 0) / decs.length
      return decimalToAmerican(avg)
    }
    return { home: toAmericanAvg(home), away: toAmericanAvg(away) }
  }

  // Compute best totals across books using most favorable points regardless of consensus/standard:
  // - Over: choose the LOWEST point offered across any book; tie-break by highest price
  // - Under: choose the HIGHEST point offered across any book; tie-break by highest price
  const getBestTotalsAcrossBooks = (
    game: TransformedGameOdds,
  ): {
    over?: { price: number; book: string; link?: string; point: number }
    under?: { price: number; book: string; link?: string; point: number }
  } => {
    let bestOver: { price: number; book: string; link?: string; point: number } | undefined
    let bestUnder: { price: number; book: string; link?: string; point: number } | undefined

    game.bookmakers.forEach((b) => {
      const totals = b.markets.find((m) => m.key === "totals")
      if (!totals?.lines) return
      for (const [, ld] of Object.entries<any>(totals.lines)) {
        const sb = ld.sportsbooks?.[b.key]
        if (!sb) continue
        const point = Number(ld.point)
        if (Number.isNaN(point)) continue
        // Over: lower point is better; tie-break by higher price
        if (
          sb.over &&
          (bestOver === undefined ||
            point < bestOver.point ||
            (point === bestOver.point && sb.over.price > bestOver.price))
        ) {
          bestOver = { price: sb.over.price, book: b.key, link: sb.over.link, point }
        }
        // Under: higher point is better; tie-break by higher price
        if (
          sb.under &&
          (bestUnder === undefined ||
            point > bestUnder.point ||
            (point === bestUnder.point && sb.under.price > bestUnder.price))
        ) {
          bestUnder = { price: sb.under.price, book: b.key, link: sb.under.link, point }
        }
      }
    })

    return { over: bestOver, under: bestUnder }
  }

  // Function to get average odds for a team
  const getAverageOdds = (game: TransformedGameOdds, teamName: string, line?: string | null) => {
    let totalDecimalOdds = 0
    let count = 0

    game.bookmakers.forEach((bookmaker) => {
      const h2hMarket = bookmaker.markets.find((m) => m.key === "h2h")
      if (h2hMarket?.outcomes?.length) {
        const teamOutcome = h2hMarket.outcomes.find((o) => o.name.toLowerCase() === teamName.toLowerCase())
        const isStandardLine = line ? line === h2hMarket.line : h2hMarket.is_standard
        if (teamOutcome && isStandardLine) {
          totalDecimalOdds += americanToDecimal(teamOutcome.price)
          count++
        }
      }
      // Else if backend only sent lines map for spreads/totals, there is no team outcome to average for h2h
    })

    if (count === 0) return null

    // Calculate average decimal odds
    const averageDecimalOdds = totalDecimalOdds / count

    // Convert back to American odds
    const averageAmericanOdds = decimalToAmerican(averageDecimalOdds)

    return averageAmericanOdds
  }

  // Function to create betslip selection
  const createBetslipSelection = (game: TransformedGameOdds, team: "home" | "away") => {
    const teamData = team === "home" ? game.home_team : game.away_team
    const bestOdds = getBestOdds(game, teamData.name)

    if (!bestOdds) return null

    return {
      event_id: game.event_id,
      sport_key: game.sport_key,
      market_key: "h2h",
      market_type: "game_lines",
      bet_type: "moneyline",
      team_name: teamData.name,
      team_abbreviation: teamData.abbreviation,
      commence_time: game.commence_time,
      home_team: game.home_team.name,
      away_team: game.away_team.name,
      odds_data: game.bookmakers.reduce<Record<string, any>>((acc, bookmaker: GameOddsBookmaker) => {
        const h2hMarket = bookmaker.markets.find((m: GameOddsMarket) => m.key === "h2h")
        if (h2hMarket) {
          const teamOutcome = h2hMarket.outcomes.find((o: GameOddsOutcome) => o.name === teamData.name)
          if (teamOutcome) {
            acc[bookmaker.key] = {
              price: teamOutcome.price,
              link: teamOutcome.link,
              sid: teamOutcome.sid,
              last_update: bookmaker.last_update,
            }
          }
        }
        return acc
      }, {}),
      market_display: "Moneyline",
      selection: teamData.name,
    }
  }

  // Function to handle adding to betslip
  const handleAddToBetslip = (game: TransformedGameOdds, team: "home" | "away") => {
    const selection = createBetslipSelection(game, team)
    if (selection) {
      setPendingSelection(selection)
      setShowBetslipDialog(true)
    }
  }

  // Sort the data
  const sortedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return []
    const now = Date.now()
    const upcoming = data.filter((g) => {
      try {
        return new Date(g.commence_time).getTime() > now
      } catch {
        return true
      }
    })
    return [...upcoming].sort((a, b) => {
      try {
        if (sortField === "time") {
          const aTime = new Date(a.commence_time).getTime()
          const bTime = new Date(b.commence_time).getTime()
          return sortDirection === "asc" ? aTime - bTime : bTime - aTime
        }
        if (sortField === "home") {
          const aName = a.home_team?.name || ""
          const bName = b.home_team?.name || ""
          return sortDirection === "asc" ? aName.localeCompare(bName) : bName.localeCompare(aName)
        }
        if (sortField === "away") {
          const aName = a.away_team?.name || ""
          const bName = b.away_team?.name || ""
          return sortDirection === "asc" ? aName.localeCompare(bName) : bName.localeCompare(aName)
        }
        if (sortField === "odds") {
          let aOdds = 0
          let bOdds = 0
          const isSpreadSelected =
            selectedMarket === "spread" || selectedMarket === "run_line" || selectedMarket === "puck_line"
          if (isSpreadSelected) {
            aOdds = getBestSpreadAcrossBooks(a).home?.price || 0
            bOdds = getBestSpreadAcrossBooks(b).home?.price || 0
          } else if (selectedMarket === "total") {
            const aMax = Math.max(
              a.best.over?.price ?? Number.NEGATIVE_INFINITY,
              a.best.under?.price ?? Number.NEGATIVE_INFINITY,
            )
            const bMax = Math.max(
              b.best.over?.price ?? Number.NEGATIVE_INFINITY,
              b.best.under?.price ?? Number.NEGATIVE_INFINITY,
            )
            aOdds = Number.isFinite(aMax) ? aMax : 0
            bOdds = Number.isFinite(bMax) ? bMax : 0
          } else {
            aOdds = getBestOdds(a, a.home_team?.name || "", a.primary_line || "standard")?.price || 0
            bOdds = getBestOdds(b, b.home_team?.name || "", b.primary_line || "standard")?.price || 0
          }
          return sortDirection === "asc" ? aOdds - bOdds : bOdds - aOdds
        }
        return 0
      } catch (e) {
        console.error("Error sorting data:", e)
        return 0
      }
    })
  }, [data, sortField, sortDirection, selectedMarket])

  return (
    <>
      <div
        className={cn(
          "rounded-xl border bg-white/80 dark:bg-slate-950/50 backdrop-blur-sm border-gray-200 dark:border-slate-800 shadow-lg",
          isMobile && "-mx-4 border-x-0 rounded-none",
        )}
      >
        <div className="relative h-[70vh] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm border-b border-gray-200 dark:border-slate-800 shadow-lg">
              <TableRow className="hover:bg-transparent border-gray-200 dark:border-slate-800">
                <TableHead className="w-[110px] text-center bg-white/95 dark:bg-slate-950/95 text-gray-900 dark:text-slate-200 font-semibold sticky top-0">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <Clock className="w-3 h-3 text-white" />
                      </div>
                      <span>Date / Time</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
                      onClick={() =>
                        onSortChange("time", sortField === "time" ? (sortDirection === "asc" ? "desc" : "asc") : "asc")
                      }
                    >
                      {sortField === "time" ? (
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
                <TableHead className="w-[300px] bg-white/95 dark:bg-slate-950/95 text-gray-900 dark:text-slate-200 font-semibold sticky top-0">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                      <Trophy className="w-3 h-3 text-white" />
                    </div>
                    <span>Game</span>
                  </div>
                </TableHead>
                <TableHead className="w-[160px] bg-white/95 dark:bg-slate-950/95 text-gray-900 dark:text-slate-200 font-semibold sticky top-0">
                  <span>Best Odds</span>
                </TableHead>
                {activeSportsbooks.map((book) => (
                  <TableHead
                    key={book.id}
                    className="text-center w-[80px] bg-white/95 dark:bg-slate-950/95 sticky top-0"
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex justify-center">
                            <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex items-center justify-center border border-gray-200 dark:border-slate-600">
                              <Image
                                src={book.logo || "/placeholder.svg"}
                                alt={book.name}
                                width={24}
                                height={24}
                                className="object-contain"
                              />
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{book.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((game, index) => {
                const isExpanded = expandedRows.has(game.event_id)
                const homeTeamAbbr = game.home_team.abbreviation
                const awayTeamAbbr = game.away_team.abbreviation
                const currentLine = game.primary_line || "standard"

                // Treat MLB run_line and NHL puck_line as spreads in UI handling
                const isSpreadSelected =
                  selectedMarket === "spread" || selectedMarket === "run_line" || selectedMarket === "puck_line"
                // Best based on selected market
                const spreadBest = isSpreadSelected ? getBestSpreadAcrossBooks(game) : null

                // Moneyline/spread best-odds references
                const homeBestOdds = isSpreadSelected
                  ? spreadBest?.home
                    ? { price: spreadBest.home.price, bookmaker: spreadBest.home.book, link: spreadBest.home.link }
                    : null
                  : selectedMarket === "total"
                    ? null
                    : getBestOdds(game, game.home_team.name, currentLine)
                const awayBestOdds = isSpreadSelected
                  ? spreadBest?.away
                    ? { price: spreadBest.away.price, bookmaker: spreadBest.away.book, link: spreadBest.away.link }
                    : null
                  : selectedMarket === "total"
                    ? null
                    : getBestOdds(game, game.away_team.name, currentLine)

                // Totals best-odds (from transformed hook)
                const totalsBest = selectedMarket === "total" ? getBestTotalsAcrossBooks(game) : null

                const hideTeamLogos =
                  sport === "ncaaf" || sport === "football_ncaaf" || sport === "americanfootball_ncaaf"

                return (
                  <motion.tr
                    key={game.event_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="border-gray-200 dark:border-slate-800 hover:bg-gray-50/50 dark:hover:bg-slate-900/30 transition-colors"
                  >
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1 text-gray-600 dark:text-slate-300">
                        <span className="text-xs font-medium">{formatGameDate(game.commence_time)}</span>
                        <span className="text-xs">{formatGameDateTime(game.commence_time)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-900 dark:text-slate-200">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="w-full">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-3">
                                {!hideTeamLogos && (
                                  <div className="w-6 h-6 bg-white dark:bg-slate-800 rounded-md shadow-sm flex items-center justify-center border border-gray-200 dark:border-slate-600">
                                    <Image
                                      src={getTeamLogoUrl(awayTeamAbbr, sport) || "/placeholder.svg"}
                                      alt={awayTeamAbbr}
                                      width={16}
                                      height={16}
                                      className="h-4 w-4 object-contain"
                                    />
                                  </div>
                                )}
                                <span className="font-medium text-gray-900 dark:text-slate-200">
                                  {game.away_team.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                {!hideTeamLogos && (
                                  <div className="w-6 h-6 bg-white dark:bg-slate-800 rounded-md shadow-sm flex items-center justify-center border border-gray-200 dark:border-slate-600">
                                    <Image
                                      src={getTeamLogoUrl(homeTeamAbbr, sport) || "/placeholder.svg"}
                                      alt={homeTeamAbbr}
                                      width={16}
                                      height={16}
                                      className="h-4 w-4 object-contain"
                                    />
                                  </div>
                                )}
                                <span className="font-medium text-gray-900 dark:text-slate-200">
                                  {game.home_team.name}
                                </span>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Game Time: {formatGameDateTime(game.commence_time)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-1 px-3 py-2 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 border border-gray-200 dark:border-slate-600">
                          {selectedMarket === "total" ? (
                            totalsBest?.over ? (
                              <div className="flex items-center justify-between w-full">
                                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                                  o{totalsBest.over.point}
                                </span>
                                <div className="flex items-center gap-2">
                                  <OddsDisplay
                                    odds={totalsBest.over.price}
                                    link={totalsBest.over.link}
                                    className="text-sm font-semibold text-gray-900 dark:text-slate-200 hover:underline"
                                  />
                                  {totalsBest.over.book && (
                                    <div className="w-5 h-5 bg-white dark:bg-slate-800 rounded shadow-sm flex items-center justify-center border border-gray-200 dark:border-slate-600">
                                      <Image
                                        src={sportsbooks.find((b) => b.id === totalsBest.over.book)?.logo || ""}
                                        alt={totalsBest.over.book}
                                        width={16}
                                        height={16}
                                        className="h-4 w-4 object-contain"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 dark:text-slate-500">-</span>
                            )
                          ) : isSpreadSelected ? (
                            spreadBest?.away ? (
                              <div className="flex items-center justify-between w-full">
                                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                                  {formatSignedPoint(spreadBest.away.point)}
                                </span>
                                <div className="flex items-center gap-2">
                                  <OddsDisplay
                                    odds={spreadBest.away.price}
                                    link={spreadBest.away.link}
                                    className="text-sm font-semibold text-gray-900 dark:text-slate-200 hover:underline"
                                  />
                                  {spreadBest.away.book && (
                                    <div className="w-5 h-5 bg-white dark:bg-slate-800 rounded shadow-sm flex items-center justify-center border border-gray-200 dark:border-slate-600">
                                      <Image
                                        src={sportsbooks.find((b) => b.id === spreadBest.away.book)?.logo || ""}
                                        alt={spreadBest.away.book}
                                        width={16}
                                        height={16}
                                        className="h-4 w-4 object-contain"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 dark:text-slate-500">-</span>
                            )
                          ) : awayBestOdds ? (
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <OddsDisplay
                                  odds={awayBestOdds.price}
                                  link={awayBestOdds.link}
                                  className="text-sm font-semibold text-gray-900 dark:text-slate-200 hover:underline"
                                />
                                {awayBestOdds.bookmaker && (
                                  <div className="w-5 h-5 bg-white dark:bg-slate-800 rounded shadow-sm flex items-center justify-center border border-gray-200 dark:border-slate-600">
                                    <Image
                                      src={sportsbooks.find((b) => b.id === awayBestOdds.bookmaker)?.logo || ""}
                                      alt={awayBestOdds.bookmaker}
                                      width={16}
                                      height={16}
                                      className="h-4 w-4 object-contain"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-slate-500">-</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-1 px-3 py-2 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 border border-gray-200 dark:border-slate-600">
                          {selectedMarket === "total" ? (
                            totalsBest?.under ? (
                              <div className="flex items-center justify-between w-full">
                                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                                  u{totalsBest.under.point}
                                </span>
                                <div className="flex items-center gap-2">
                                  <OddsDisplay
                                    odds={totalsBest.under.price}
                                    link={totalsBest.under.link}
                                    className="text-sm font-semibold text-gray-900 dark:text-slate-200 hover:underline"
                                  />
                                  {totalsBest.under.book && (
                                    <div className="w-5 h-5 bg-white dark:bg-slate-800 rounded shadow-sm flex items-center justify-center border border-gray-200 dark:border-slate-600">
                                      <Image
                                        src={sportsbooks.find((b) => b.id === totalsBest.under.book)?.logo || ""}
                                        alt={totalsBest.under.book}
                                        width={16}
                                        height={16}
                                        className="h-4 w-4 object-contain"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 dark:text-slate-500">-</span>
                            )
                          ) : isSpreadSelected ? (
                            spreadBest?.home ? (
                              <div className="flex items-center justify-between w-full">
                                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                                  {formatSignedPoint(spreadBest.home.point)}
                                </span>
                                <div className="flex items-center gap-2">
                                  <OddsDisplay
                                    odds={spreadBest.home.price}
                                    link={spreadBest.home.link}
                                    className="text-sm font-semibold text-gray-900 dark:text-slate-200 hover:underline"
                                  />
                                  {spreadBest.home.book && (
                                    <div className="w-5 h-5 bg-white dark:bg-slate-800 rounded shadow-sm flex items-center justify-center border border-gray-200 dark:border-slate-600">
                                      <Image
                                        src={sportsbooks.find((b) => b.id === spreadBest.home.book)?.logo || ""}
                                        alt={spreadBest.home.book}
                                        width={16}
                                        height={16}
                                        className="h-4 w-4 object-contain"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 dark:text-slate-500">-</span>
                            )
                          ) : homeBestOdds ? (
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <OddsDisplay
                                  odds={homeBestOdds.price}
                                  link={homeBestOdds.link}
                                  className="text-sm font-semibold text-gray-900 dark:text-slate-200 hover:underline"
                                />
                                {homeBestOdds.bookmaker && (
                                  <div className="w-5 h-5 bg-white dark:bg-slate-800 rounded shadow-sm flex items-center justify-center border border-gray-200 dark:border-slate-600">
                                    <Image
                                      src={sportsbooks.find((b) => b.id === homeBestOdds.bookmaker)?.logo || ""}
                                      alt={homeBestOdds.bookmaker}
                                      width={16}
                                      height={16}
                                      className="h-4 w-4 object-contain"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-slate-500">-</span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {activeSportsbooks.map((book) => {
                      const normalizeKey = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "")
                      const bookId = normalizeKey(book.id)

                      const bookmaker = game.bookmakers.find((b) => normalizeKey(b.key) === bookId)

                      if (selectedMarket === "total") {
                        // Handle totals market
                        const totalsMarket = bookmaker?.markets.find((m) => m.key === "totals")

                        // Find the standard line for this sportsbook
                        let standardLine = null
                        let standardOverOdds = null
                        let standardUnderOdds = null

                        if (totalsMarket?.lines) {
                          // First pass: prefer the book's standard line
                          for (const [, lineData] of Object.entries(totalsMarket.lines)) {
                            const sbEntry = Object.entries<any>(lineData.sportsbooks || {}).find(
                              ([k]) => normalizeKey(k) === bookId,
                            )
                            const sb: any = sbEntry ? sbEntry[1] : null
                            if (sb?.is_standard) {
                              standardLine =
                                typeof lineData.point === "number" ? lineData.point : Number(lineData.point)
                              standardOverOdds = sb.over?.price ?? null
                              standardUnderOdds = sb.under?.price ?? null
                              break
                            }
                          }
                          // Second pass: if no standard line for this book, use game's selected/primary point if present
                          if (standardLine == null) {
                            const targetPoint =
                              selectedLine != null
                                ? Number(selectedLine)
                                : typeof game.primary_line === "string"
                                  ? Number(game.primary_line)
                                  : Number(game.primary_line)
                            if (!Number.isNaN(targetPoint)) {
                              for (const [, lineData] of Object.entries(totalsMarket.lines)) {
                                if (Number(lineData.point) === Number(targetPoint)) {
                                  const sbEntry = Object.entries<any>(lineData.sportsbooks || {}).find(
                                    ([k]) => normalizeKey(k) === bookId,
                                  )
                                  const sb: any = sbEntry ? sbEntry[1] : null
                                  if (sb) {
                                    standardLine =
                                      typeof lineData.point === "number" ? lineData.point : Number(lineData.point)
                                    standardOverOdds = sb.over?.price ?? null
                                    standardUnderOdds = sb.under?.price ?? null
                                  }
                                  break
                                }
                              }
                            }
                          }
                          // Final pass: if still not found, use the first available line for this book
                          if (standardLine == null) {
                            for (const [, lineData] of Object.entries<any>(totalsMarket.lines)) {
                              const sbEntry = Object.entries<any>(lineData.sportsbooks || {}).find(
                                ([k]) => normalizeKey(k) === bookId,
                              )
                              const sb: any = sbEntry ? sbEntry[1] : null
                              if (sb) {
                                standardLine =
                                  typeof lineData.point === "number" ? lineData.point : Number(lineData.point)
                                standardOverOdds = sb.over?.price ?? null
                                standardUnderOdds = sb.under?.price ?? null
                                break
                              }
                            }
                          }
                        }

                        const isBestOver =
                          totalsBest?.over &&
                          standardLine != null &&
                          Number(standardLine) === Number(totalsBest.over.point) &&
                          standardOverOdds != null &&
                          Number(standardOverOdds) === Number(totalsBest.over.price)
                        const isBestUnder =
                          totalsBest?.under &&
                          standardLine != null &&
                          Number(standardLine) === Number(totalsBest.under.point) &&
                          standardUnderOdds != null &&
                          Number(standardUnderOdds) === Number(totalsBest.under.price)
                        return (
                          <TableCell key={book.id} className="text-center">
                            <div className="flex flex-col gap-2">
                              {standardLine ? (
                                <>
                                  <div
                                    className={cn(
                                      "flex items-center justify-center px-2 py-1 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 border border-gray-200 dark:border-slate-600",
                                      isBestOver &&
                                        "from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-950/30 dark:to-emerald-900/30 dark:border-emerald-800",
                                    )}
                                  >
                                    <span className="text-sm text-gray-700 dark:text-slate-300 mr-1">
                                      o{standardLine}
                                    </span>
                                    {standardOverOdds && (
                                      <OddsDisplay
                                        odds={standardOverOdds}
                                        className={cn(
                                          "text-sm font-medium",
                                          isBestOver
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : "text-gray-900 dark:text-slate-200",
                                        )}
                                      />
                                    )}
                                  </div>
                                  <div
                                    className={cn(
                                      "flex items-center justify-center px-2 py-1 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 border border-gray-200 dark:border-slate-600",
                                      isBestUnder &&
                                        "from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-950/30 dark:to-emerald-900/30 dark:border-emerald-800",
                                    )}
                                  >
                                    <span className="text-sm text-gray-700 dark:text-slate-300 mr-1">
                                      u{standardLine}
                                    </span>
                                    {standardUnderOdds && (
                                      <OddsDisplay
                                        odds={standardUnderOdds}
                                        className={cn(
                                          "text-sm font-medium",
                                          isBestUnder
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : "text-gray-900 dark:text-slate-200",
                                        )}
                                      />
                                    )}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center justify-center px-2 py-1 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 border border-gray-200 dark:border-slate-600">
                                    <span className="text-sm text-gray-400 dark:text-slate-500">-</span>
                                  </div>
                                  <div className="flex items-center justify-center px-2 py-1 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 border border-gray-200 dark:border-slate-600">
                                    <span className="text-sm text-gray-400 dark:text-slate-500">-</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </TableCell>
                        )
                      } else if (
                        selectedMarket === "spread" ||
                        selectedMarket === "run_line" ||
                        selectedMarket === "puck_line"
                      ) {
                        // Handle spreads market (new nested + old team/price schemas)
                        const spreadsMarket: any = bookmaker?.markets.find((m) => m.key === "spreads")
                        let homeOdds: number | null = null
                        let homePoint: number | null = null
                        let awayOdds: number | null = null
                        let awayPoint: number | null = null
                        let homeStandard = false
                        let awayStandard = false
                        if (spreadsMarket?.lines) {
                          for (const [, ld] of Object.entries<any>(spreadsMarket.lines)) {
                            const sportsbooksMap: any = ld.sportsbooks || {}
                            const sbEntry = Object.entries<any>(sportsbooksMap).find(
                              ([k]) => normalizeKey(k) === bookId,
                            )
                            const sb: any = sbEntry ? sbEntry[1] : null
                            if (!sb) continue
                            const point = typeof ld.point === "number" ? ld.point : Number(ld.point)

                            // New schema: nested home/away
                            if (sb.away && typeof sb.away.price === "number") {
                              const prefer = (sb.is_standard && !awayStandard) || awayOdds == null
                              if (prefer) {
                                awayOdds = sb.away.price
                                awayPoint = point
                                awayStandard = !!sb.is_standard
                              }
                            }
                            if (sb.home && typeof sb.home.price === "number") {
                              const prefer = (sb.is_standard && !homeStandard) || homeOdds == null
                              if (prefer) {
                                homeOdds = sb.home.price
                                homePoint = point
                                homeStandard = !!sb.is_standard
                              }
                            }

                            // Old schema: single object with { team, price }
                            if (!sb.home && !sb.away && sb.team) {
                              const teamName = String(sb.team || "").toLowerCase()
                              if (teamName === game.home_team.name.toLowerCase()) {
                                const prefer = (sb.is_standard && !homeStandard) || homeOdds == null
                                if (prefer) {
                                  homeOdds =
                                    typeof sb.price === "number"
                                      ? sb.price
                                      : typeof sb.price === "string"
                                        ? Number(sb.price)
                                        : homeOdds
                                  homePoint = point
                                  homeStandard = !!sb.is_standard
                                }
                              } else if (teamName === game.away_team.name.toLowerCase()) {
                                const prefer = (sb.is_standard && !awayStandard) || awayOdds == null
                                if (prefer) {
                                  awayOdds =
                                    typeof sb.price === "number"
                                      ? sb.price
                                      : typeof sb.price === "string"
                                        ? Number(sb.price)
                                        : awayOdds
                                  awayPoint = point
                                  awayStandard = !!sb.is_standard
                                }
                              }
                            }
                          }
                        }
                        const isBestAway =
                          spreadBest?.away &&
                          awayPoint != null &&
                          Number(awayPoint) === Number(spreadBest.away.point) &&
                          typeof awayOdds === "number" &&
                          awayOdds === spreadBest.away.price
                        const isBestHome =
                          spreadBest?.home &&
                          homePoint != null &&
                          Number(homePoint) === Number(spreadBest.home.point) &&
                          typeof homeOdds === "number" &&
                          homeOdds === spreadBest.home.price
                        return (
                          <TableCell key={book.id} className="text-center">
                            <div className="flex flex-col gap-2">
                              <div
                                className={cn(
                                  "flex items-center justify-center px-2 py-1 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 border border-gray-200 dark:border-slate-600",
                                  isBestAway &&
                                    "from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-950/30 dark:to-emerald-900/30 dark:border-emerald-800",
                                )}
                              >
                                {awayPoint != null ? (
                                  <span
                                    className={cn(
                                      "text-sm mr-1",
                                      isBestAway
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-gray-700 dark:text-slate-300",
                                    )}
                                  >
                                    {formatSignedPoint(awayPoint)}
                                  </span>
                                ) : (
                                  <span className="text-sm text-gray-400 dark:text-slate-500 ml-1">-</span>
                                )}
                                {typeof awayOdds === "number" ? (
                                  <OddsDisplay
                                    odds={awayOdds}
                                    className={cn(
                                      "text-sm font-medium",
                                      isBestAway
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-gray-900 dark:text-slate-200",
                                    )}
                                  />
                                ) : (
                                  <span className="text-sm text-gray-400 dark:text-slate-500">-</span>
                                )}
                              </div>
                              <div
                                className={cn(
                                  "flex items-center justify-center px-2 py-1 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 border border-gray-200 dark:border-slate-600",
                                  isBestHome &&
                                    "from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-950/30 dark:to-emerald-900/30 dark:border-emerald-800",
                                )}
                              >
                                {homePoint != null ? (
                                  <span
                                    className={cn(
                                      "text-sm mr-1",
                                      isBestHome
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-gray-700 dark:text-slate-300",
                                    )}
                                  >
                                    {formatSignedPoint(homePoint)}
                                  </span>
                                ) : (
                                  <span className="text-sm text-gray-400 dark:text-slate-500 ml-1">-</span>
                                )}
                                {typeof homeOdds === "number" ? (
                                  <OddsDisplay
                                    odds={homeOdds}
                                    className={cn(
                                      "text-sm font-medium",
                                      isBestHome
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-gray-900 dark:text-slate-200",
                                    )}
                                  />
                                ) : (
                                  <span className="text-sm text-gray-400 dark:text-slate-500">-</span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        )
                      } else {
                        // Handle moneyline (h2h) market - new schema
                        const h2hMarket: any = bookmaker?.markets.find((m) => m.key === "h2h")

                        let awayOutcome: { price: number; link?: string } | null = null
                        let homeOutcome: { price: number; link?: string } | null = null
                        if (h2hMarket?.lines) {
                          let selected: any = null
                          for (const [, ld] of Object.entries<any>(h2hMarket.lines)) {
                            // sportsbooks may have keys with spaces; normalize compare
                            const sbEntry = Object.entries<any>(ld.sportsbooks || {}).find(
                              ([k]) => normalizeKey(k) === bookId,
                            )
                            const sb = sbEntry ? sbEntry[1] : null
                            if (!sb) continue
                            selected = sb
                            if (sb.is_standard) break
                          }
                          if (selected?.away && typeof selected.away.price === "number") {
                            awayOutcome = { price: selected.away.price, link: selected.away.link }
                          }
                          if (selected?.home && typeof selected.home.price === "number") {
                            homeOutcome = { price: selected.home.price, link: selected.home.link }
                          }
                        }

                        const isAwayBest = awayOutcome && awayBestOdds && awayOutcome.price === awayBestOdds.price
                        const isHomeBest = homeOutcome && homeBestOdds && homeOutcome.price === homeBestOdds.price

                        return (
                          <TableCell key={book.id} className="text-center">
                            <div className="flex flex-col gap-2">
                              <div
                                className={cn(
                                  "flex items-center justify-center px-2 py-1 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 border border-gray-200 dark:border-slate-600",
                                  isAwayBest &&
                                    "from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-950/30 dark:to-emerald-900/30 dark:border-emerald-800",
                                )}
                              >
                                {awayOutcome ? (
                                  <OddsDisplay
                                    odds={awayOutcome.price}
                                    link={awayOutcome.link}
                                    className={cn(
                                      "text-sm font-medium",
                                      isAwayBest
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-gray-900 dark:text-slate-200",
                                    )}
                                  />
                                ) : (
                                  <span className="text-sm text-gray-400 dark:text-slate-500">-</span>
                                )}
                              </div>
                              <div
                                className={cn(
                                  "flex items-center justify-center px-2 py-1 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 border border-gray-200 dark:border-slate-600",
                                  isHomeBest &&
                                    "from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-950/30 dark:to-emerald-900/30 dark:border-emerald-800",
                                )}
                              >
                                {homeOutcome ? (
                                  <OddsDisplay
                                    odds={homeOutcome.price}
                                    link={homeOutcome.link}
                                    className={cn(
                                      "text-sm font-medium",
                                      isHomeBest
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-gray-900 dark:text-slate-200",
                                    )}
                                  />
                                ) : (
                                  <span className="text-sm text-gray-400 dark:text-slate-500">-</span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        )
                      }
                    })}
                  </motion.tr>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <BetslipDialog open={showBetslipDialog} onOpenChange={setShowBetslipDialog} selection={pendingSelection} />

      {/* Conflict Resolution Dialog */}
      <Dialog open={conflictingSelection !== null} onOpenChange={() => handleResolveConflict(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Replace Existing Selection?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              You already have a selection for this game. Would you like to replace it?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleResolveConflict(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleResolveConflict(true)}>Replace Selection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
