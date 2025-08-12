"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, Plus } from "lucide-react"
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
import { SPORTSBOOK_ID_MAP, REVERSE_SPORTSBOOK_MAP, getNormalizedBookmakerId, getBookmakerLogoId } from "@/lib/constants/sportsbook-mappings"
import { getPlayerHeadshotUrl, getTeamLogoUrl } from '@/lib/constants/sport-assets'

// Helper functions for team logos and abbreviations
function getTeamLogoPath(sport: string): string {
  switch(sport) {
    case "football_nfl":
      return "team-logos/nfl"
    case "basketball_wnba":
      return "team-logos/wnba"
    case "baseball_mlb":
    default:
      return "mlb-teams"
  }
}

function getTeamLogoFilename(abbr: string, sport: string = "baseball_mlb"): string {
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
  return americanOdds > 0 ? (americanOdds / 100) + 1 : (100 / Math.abs(americanOdds)) + 1
}

// Convert decimal odds to American
function decimalToAmerican(decimalOdds: number): number {
  if (decimalOdds === 1) return 0
  const american = decimalOdds >= 2 
    ? Math.round((decimalOdds - 1) * 100) 
    : Math.round(-100 / (decimalOdds - 1))
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
  return `${isOver ? 'o' : 'u'}${point} ${formatOdds(price)}`
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
  selectedMarket,  // Add this line
}: GameLinesTableV2Props) {
  const activeSportsbooks = sportsbooks.filter((book) => book.isActive)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [showBetslipDialog, setShowBetslipDialog] = useState(false)
  const [pendingSelection, setPendingSelection] = useState<any>(null)

  // Log active sportsbooks and check which ones are missing from the data
  console.log('[Component] Active vs Available Sportsbooks:', {
    active: activeSportsbooks.map(b => ({
      id: b.id,
      name: b.name
    })),
    available: data?.[0]?.bookmakers.map(b => ({
      key: b.key,
      title: b.title
    })) || [],
    missing: activeSportsbooks
      .filter(active => !data?.[0]?.bookmakers.some(b => b.key === active.id.toLowerCase()))
      .map(b => ({
        id: b.id,
        name: b.name
      }))
  })

  console.log('[Component] Received game data:', {
    count: data?.length || 0,
    firstGame: data?.[0] ? {
      event_id: data[0].event_id,
      teams: `${data[0].away_team.name} @ ${data[0].home_team.name}`,
      bookmakerCount: data[0].bookmakers?.length || 0,
      bookmakerKeys: data[0].bookmakers?.map(b => b.key) || []
    } : null
  })

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

    console.log(`[Component] Getting best odds for ${teamName}:`, {
      gameId: game.event_id,
      bookmakerCount: game.bookmakers?.length || 0,
      line
    })

    game.bookmakers.forEach((bookmaker: GameOddsBookmaker) => {
      // H2H path (preferred)
      const h2h = bookmaker.markets.find((m: GameOddsMarket) => m.key === "h2h")
      if (h2h?.outcomes?.length) {
        const teamOutcome = h2h.outcomes.find((o: GameOddsOutcome) => o.name.toLowerCase() === teamName.toLowerCase())
        const isStandardLine = line ? String(line) === String(h2h.line) : true
        if (teamOutcome && isStandardLine && (!bestOdds || teamOutcome.price > bestOdds)) {
          bestOdds = teamOutcome.price
          bestBook = bookmaker.key
          bestLink = teamOutcome.link
        }
        return
      }

      // Spreads path: team-specific entries in lines map
      const spreads = bookmaker.markets.find((m: GameOddsMarket) => m.key === "spreads")
      if (spreads?.lines) {
        const activeAbs = line != null && !Number.isNaN(Number(line)) ? Math.abs(Number(line)) : NaN
        const entries = Object.entries(spreads.lines as Record<string, any>).filter(([, ld]: [string, any]) => {
          const isAbsMatch = String(Math.abs(Number(ld.point))) === String(activeAbs)
          const isStd = !!ld.sportsbooks?.[bookmaker.key]?.is_standard
          return line ? isAbsMatch : isStd
        })
        for (const [, ld] of entries as [string, any][]) {
          const sb = (ld.sportsbooks || {})[bookmaker.key] as any
          if (!sb) continue
          if (sb?.team && sb.team.toLowerCase() === teamName.toLowerCase() && typeof sb.price === 'number') {
            if (bestOdds === null || sb.price > bestOdds) {
              bestOdds = sb.price
              bestBook = bookmaker.key
              bestLink = sb.link
            }
          }
        }
        return
      }
    })

    const result = bestOdds && bestBook ? { price: bestOdds, bookmaker: bestBook, link: bestLink } : null
    console.log(`[Component] Best odds result for ${teamName}:`, result)
    return result
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
  ): { away?: { point: number; price: number; link?: string }; home?: { point: number; price: number; link?: string } } => {
    const spreadsMarket = game.bookmakers.find((b) => b.key === bookId)?.markets.find((m) => m.key === "spreads")
    const result: { away?: { point: number; price: number; link?: string }; home?: { point: number; price: number; link?: string } } = {}
    if (!spreadsMarket?.lines) return result
    // Determine consensus abs point in this game for spreads
    const absCounts: Record<string, number> = {}
    game.bookmakers.forEach((b) => {
      const m = b.markets.find((mm) => mm.key === 'spreads')
      if (!m?.lines) return
      for (const [, ld] of Object.entries<any>(m.lines)) {
        const k = String(Math.abs(Number(ld.point)))
        absCounts[k] = (absCounts[k] || 0) + 1
      }
    })
    const consensusAbs = Object.entries(absCounts).sort((a, b) => b[1] - a[1]).map(([k]) => k)[0]

    for (const [, ld] of Object.entries<any>(spreadsMarket.lines)) {
      const sb = ld.sportsbooks?.[bookId]
      const isStd = !!sb?.is_standard
      const matchesConsensus = consensusAbs != null && String(Math.abs(Number(ld.point))) === String(consensusAbs)
      if (!sb || (!isStd && !matchesConsensus)) continue
      const team = (sb.team || "").toLowerCase()
      if (team === game.away_team.name.toLowerCase() && typeof sb.price === "number") {
        const point = typeof ld.point === 'number' ? ld.point : Number(ld.point)
        result.away = { point, price: sb.price, link: sb.link }
      } else if (team === game.home_team.name.toLowerCase() && typeof sb.price === "number") {
        const point = typeof ld.point === 'number' ? ld.point : Number(ld.point)
        result.home = { point, price: sb.price, link: sb.link }
      }
    }
    return result
  }

  // For spreads, “better” means the number closer to + for the favorite you want to back.
  // We treat:
  // - Favorite (negative spread): lower absolute value (e.g., -4.5 is better than -5.5)
  // - Underdog (positive spread): higher absolute value (e.g., +5.5 is better than +4.5)
  const getBestSpreadAcrossBooks = (game: TransformedGameOdds) => {
    let bestHome: { price: number; book: string; point: number; link?: string } | null = null
    let bestAway: { price: number; book: string; point: number; link?: string } | null = null

    game.bookmakers.forEach((b) => {
      const res = getBookSpreadStandard(game, b.key)
      if (res.home) {
        const cur = { price: res.home.price, book: b.key, point: res.home.point, link: res.home.link }
        if (!bestHome) bestHome = cur
        else {
          const a = bestHome.point
          const c = cur.point
          // If both negative, prefer the one closer to zero (greater point)
          // If both positive, prefer the larger positive
          // If signs differ, prefer positive (underdog) as more favorable line
          const pointBetter = (a < 0 && c < 0) ? c > a : (a > 0 && c > 0) ? c > a : c > a
          if (pointBetter) {
            bestHome = cur
          } else if (c === a && cur.price > bestHome.price) {
            // Tie-break on price
            bestHome = cur
          }
        }
      }
      if (res.away) {
        const cur = { price: res.away.price, book: b.key, point: res.away.point, link: res.away.link }
        if (!bestAway) bestAway = cur
        else {
          const a = bestAway.point
          const c = cur.point
          const pointBetter = (a < 0 && c < 0) ? c > a : (a > 0 && c > 0) ? c > a : c > a
          if (pointBetter) {
            bestAway = cur
          } else if (c === a && cur.price > bestAway.price) {
            bestAway = cur
          }
        }
      }
    })
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

  // Compute best totals across books based on most favorable point threshold:
  // - Over: choose the lowest point; tie-break by highest price
  // - Under: choose the highest point; tie-break by highest price
  const getBestTotalsAcrossBooks = (
    game: TransformedGameOdds,
  ): {
    over?: { price: number; book: string; link?: string; point: number }
    under?: { price: number; book: string; link?: string; point: number }
  } => {
    // Build consensus point across books (use most common is_standard point, else most common presence)
    const countStandard: Record<string, number> = {}
    const countPresence: Record<string, number> = {}
    game.bookmakers.forEach((b) => {
      const totals = b.markets.find((m) => m.key === 'totals')
      if (!totals?.lines) return
      for (const [, ld] of Object.entries<any>(totals.lines)) {
        const key = String(ld.point)
        let anyStandard = false
        for (const sb of Object.values<any>(ld.sportsbooks || {})) {
          countPresence[key] = (countPresence[key] || 0) + 1
          if (sb?.is_standard) anyStandard = true
        }
        if (anyStandard) countStandard[key] = (countStandard[key] || 0) + 1
      }
    })
    const pickMaxKey = (counts: Record<string, number>) => Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k]) => k)[0]
    const consensusPoint = pickMaxKey(countStandard) || pickMaxKey(countPresence)

    let bestOver: { price: number; book: string; link?: string; point: number } | undefined
    let bestUnder: { price: number; book: string; link?: string; point: number } | undefined

    game.bookmakers.forEach((b) => {
      const totals = b.markets.find((m) => m.key === 'totals')
      if (!totals?.lines) return
      for (const [, ld] of Object.entries<any>(totals.lines)) {
        const sb = ld.sportsbooks?.[b.key]
        // Prefer standard; if none, allow consensus-matched points to compete
        if (!sb?.is_standard) {
          if (consensusPoint == null || String(ld.point) !== String(consensusPoint)) continue
        }
        if (!sb) continue
        const point = Number(ld.point)
        if (Number.isNaN(point)) continue
        if (sb.over && (bestOver === undefined || point < bestOver.point || (point === bestOver.point && sb.over.price > bestOver.price))) {
          bestOver = { price: sb.over.price, book: b.key, link: sb.over.link, point }
        }
        if (sb.under && (bestUnder === undefined || point > bestUnder.point || (point === bestUnder.point && sb.under.price > bestUnder.price))) {
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

    console.log(`[Component] Average odds for ${teamName}:`, {
      totalDecimalOdds,
      count,
      averageDecimalOdds,
      averageAmericanOdds,
      line,
      isStandardOnly: !line
    })

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
    return [...data].sort((a, b) => {
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
          const isSpreadSelected = selectedMarket === 'spread' || selectedMarket === 'run_line' || selectedMarket === 'puck_line'
          if (isSpreadSelected) {
            aOdds = getBestSpreadAcrossBooks(a).home?.price || 0
            bOdds = getBestSpreadAcrossBooks(b).home?.price || 0
          } else if (selectedMarket === "total") {
            const aMax = Math.max(a.best.over?.price ?? -Infinity, a.best.under?.price ?? -Infinity)
            const bMax = Math.max(b.best.over?.price ?? -Infinity, b.best.under?.price ?? -Infinity)
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
      <div className={cn(
        "rounded-md border bg-slate-950/50 backdrop-blur-sm",
        isMobile && "-mx-4 border-x-0 rounded-none",
      )}>
        <div className="relative h-[70vh] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-30 bg-slate-950 border-b border-slate-800 shadow-lg">
              <TableRow className="hover:bg-transparent border-slate-800">
                <TableHead className="w-[300px] bg-slate-950 text-slate-200 font-semibold sticky top-0">
                  <div className="flex items-center justify-between gap-1">
                    <span>Game</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      onClick={() =>
                        onSortChange(
                          "time",
                          sortField === "time" ? (sortDirection === "asc" ? "desc" : "asc") : "asc",
                        )
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
                <TableHead className="w-[110px] text-center bg-slate-950 text-slate-200 font-semibold sticky top-0">Date / Time</TableHead>
                <TableHead className="w-[160px] bg-slate-950 text-slate-200 font-semibold sticky top-0">Best</TableHead>
                 {activeSportsbooks.map((book) => (
                  <TableHead key={book.id} className="text-center w-[80px] bg-slate-950 sticky top-0">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex justify-center">
                            <Image
                              src={book.logo}
                              alt={book.name}
                              width={32}
                              height={32}
                              className="object-contain"
                            />
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((game) => {
                const isExpanded = expandedRows.has(game.event_id)
                const homeTeamAbbr = game.home_team.abbreviation
                const awayTeamAbbr = game.away_team.abbreviation
                const currentLine = game.primary_line || "standard"

                // Treat MLB run_line and NHL puck_line as spreads in UI handling
                const isSpreadSelected = selectedMarket === 'spread' || selectedMarket === 'run_line' || selectedMarket === 'puck_line'
                // Best based on selected market
                const spreadBest = isSpreadSelected ? getBestSpreadAcrossBooks(game) : null

                // Moneyline/spread best-odds references
                const homeBestOdds = isSpreadSelected
                  ? (spreadBest?.home ? { price: spreadBest.home.price, bookmaker: spreadBest.home.book, link: spreadBest.home.link } : null)
                  : selectedMarket === 'total'
                    ? null
                    : getBestOdds(game, game.home_team.name, currentLine)
                const awayBestOdds = isSpreadSelected
                  ? (spreadBest?.away ? { price: spreadBest.away.price, bookmaker: spreadBest.away.book, link: spreadBest.away.link } : null)
                  : selectedMarket === 'total'
                    ? null
                    : getBestOdds(game, game.away_team.name, currentLine)

                // Totals best-odds (from transformed hook)
                const totalsBest = selectedMarket === 'total' ? getBestTotalsAcrossBooks(game) : null

                const hideTeamLogos = sport === 'ncaaf' || sport === 'football_ncaaf' || sport === 'americanfootball_ncaaf'

                // Averages/EV not used in game-lines table

                return (
                  <TableRow key={game.event_id} className="border-slate-800 hover:bg-slate-900/50">
                    <TableCell className="text-slate-200">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="w-full">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                {!hideTeamLogos && (
                                  <Image
                                    src={getTeamLogoUrl(awayTeamAbbr, sport)}
                                    alt={awayTeamAbbr}
                                    width={16}
                                    height={16}
                                    className="h-4 w-4"
                                  />
                                )}
                                <span className="font-medium text-slate-200">{game.away_team.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {!hideTeamLogos && (
                                  <Image
                                    src={getTeamLogoUrl(homeTeamAbbr, sport)}
                                    alt={homeTeamAbbr}
                                    width={16}
                                    height={16}
                                    className="h-4 w-4"
                                  />
                                )}
                                <span className="font-medium text-slate-200">{game.home_team.name}</span>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Game Time: {formatGameDateTime(game.commence_time)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1 text-slate-300">
                        <span className="text-xs">{formatGameDate(game.commence_time)}</span>
                        <span className="text-xs">{formatGameDateTime(game.commence_time)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-1 px-2 py-1 rounded bg-slate-800/50">
                          {selectedMarket === 'total' ? (
                            totalsBest?.over ? (
                              <div className="flex items-center justify-between w-full">
                                <span className="text-sm text-slate-200 mr-2">o{totalsBest.over.point}</span>
                                <OddsDisplay odds={totalsBest.over.price} link={totalsBest.over.link} className="text-sm text-slate-200 hover:underline" />
                                {totalsBest.over.book && (
                                  <Image
                                    src={sportsbooks.find((b) => b.id === totalsBest.over.book)?.logo || ""}
                                    alt={totalsBest.over.book}
                                    width={20}
                                    height={20}
                                    className="h-5 w-5"
                                  />
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">-</span>
                            )
                          ) : isSpreadSelected ? (
                            spreadBest?.away ? (
                              <div className="flex items-center justify-between w-full">
                                <span className="text-sm text-slate-200 mr-2">{formatSignedPoint(spreadBest.away.point)}</span>
                                <OddsDisplay odds={spreadBest.away.price} link={spreadBest.away.link} className="text-sm text-slate-200 hover:underline" />
                                {spreadBest.away.book && (
                                  <Image
                                    src={sportsbooks.find((b) => b.id === spreadBest.away.book)?.logo || ""}
                                    alt={spreadBest.away.book}
                                    width={20}
                                    height={20}
                                    className="h-5 w-5"
                                  />
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">-</span>
                            )
                          ) : (
                            awayBestOdds ? (
                              <div className="flex items-center justify-between w-full">
                                <OddsDisplay odds={awayBestOdds.price} link={awayBestOdds.link} className="text-sm text-slate-200 hover:underline" />
                                {awayBestOdds.bookmaker && (
                                  <Image
                                    src={sportsbooks.find((b) => b.id === awayBestOdds.bookmaker)?.logo || ""}
                                    alt={awayBestOdds.bookmaker}
                                    width={20}
                                    height={20}
                                    className="h-5 w-5"
                                  />
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">-</span>
                            )
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-1 px-2 py-1 rounded bg-slate-800/50">
                          {selectedMarket === 'total' ? (
                            totalsBest?.under ? (
                              <div className="flex items-center justify-between w-full">
                                <span className="text-sm text-slate-200 mr-2">u{totalsBest.under.point}</span>
                                <OddsDisplay odds={totalsBest.under.price} link={totalsBest.under.link} className="text-sm text-slate-200 hover:underline" />
                                {totalsBest.under.book && (
                                  <Image
                                    src={sportsbooks.find((b) => b.id === totalsBest.under.book)?.logo || ""}
                                    alt={totalsBest.under.book}
                                    width={20}
                                    height={20}
                                    className="h-5 w-5"
                                  />
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">-</span>
                            )
                          ) : isSpreadSelected ? (
                            spreadBest?.home ? (
                              <div className="flex items-center justify-between w-full">
                                <span className="text-sm text-slate-200 mr-2">{formatSignedPoint(spreadBest.home.point)}</span>
                                <OddsDisplay odds={spreadBest.home.price} link={spreadBest.home.link} className="text-sm text-slate-200 hover:underline" />
                                {spreadBest.home.book && (
                                  <Image
                                    src={sportsbooks.find((b) => b.id === spreadBest.home.book)?.logo || ""}
                                    alt={spreadBest.home.book}
                                    width={20}
                                    height={20}
                                    className="h-5 w-5"
                                  />
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">-</span>
                            )
                          ) : (
                            homeBestOdds ? (
                              <div className="flex items-center justify-between w-full">
                                <OddsDisplay odds={homeBestOdds.price} link={homeBestOdds.link} className="text-sm text-slate-200 hover:underline" />
                                {homeBestOdds.bookmaker && (
                                  <Image
                                    src={sportsbooks.find((b) => b.id === homeBestOdds.bookmaker)?.logo || ""}
                                    alt={homeBestOdds.bookmaker}
                                    width={20}
                                    height={20}
                                    className="h-5 w-5"
                                  />
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">-</span>
                            )
                          )}
                        </div>
                      </div>
                    </TableCell>
                    
                    
                    {activeSportsbooks.map((book) => {
                      const bookId = book.id.toLowerCase()
                      
                      console.log(`[Component] Processing sportsbook ${book.name}:`, {
                        bookId,
                        availableBookmakers: game.bookmakers.map(b => b.key),
                        market: selectedMarket
                      })
                      
                      const bookmaker = game.bookmakers.find((b) => b.key === bookId)
                      console.log(`[Component] Found bookmaker:`, {
                        found: !!bookmaker,
                        markets: bookmaker?.markets.map(m => m.key)
                      })

                      if (selectedMarket === "total") {
                        // Handle totals market
                        const totalsMarket = bookmaker?.markets.find((m) => m.key === "totals")
                        console.log(`[Component] Totals market for ${book.name}:`, {
                          found: !!totalsMarket,
                          lines: totalsMarket?.lines,
                        })
                        
                        // Find the standard line for this sportsbook
                        let standardLine = null
                        let standardOverOdds = null
                        let standardUnderOdds = null
                        
                        if (totalsMarket?.lines) {
                          // First pass: prefer the book's standard line
                          for (const [, lineData] of Object.entries(totalsMarket.lines)) {
                            const sb = lineData.sportsbooks?.[bookId]
                            if (sb?.is_standard) {
                              standardLine = lineData.point
                              standardOverOdds = sb.over?.price ?? null
                              standardUnderOdds = sb.under?.price ?? null
                              break
                            }
                          }
                          // Fallback: use selectedLine or game's primary_line point match
                          if (standardLine == null) {
                            const targetPoint = selectedLine != null ? Number(selectedLine) : (typeof game.primary_line === 'string' ? Number(game.primary_line) : Number(game.primary_line))
                            if (!Number.isNaN(targetPoint)) {
                              for (const [, lineData] of Object.entries(totalsMarket.lines)) {
                                if (Number(lineData.point) === Number(targetPoint)) {
                                  const sb = lineData.sportsbooks?.[bookId]
                                  if (sb) {
                                    standardLine = lineData.point
                                    standardOverOdds = sb.over?.price ?? null
                                    standardUnderOdds = sb.under?.price ?? null
                                  }
                                  break
                                }
                              }
                            }
                          }
                        }

                        console.log(`[Component] Standard line for ${book.name}:`, {
                          standardLine,
                          standardOverOdds,
                          standardUnderOdds
                        })

                        const isBestOver = totalsBest?.over && standardLine != null && Number(standardLine) === Number(totalsBest.over.point) && standardOverOdds != null && Number(standardOverOdds) === Number(totalsBest.over.price)
                        const isBestUnder = totalsBest?.under && standardLine != null && Number(standardLine) === Number(totalsBest.under.point) && standardUnderOdds != null && Number(standardUnderOdds) === Number(totalsBest.under.price)
                        return (
                          <TableCell key={book.id} className="text-center">
                            <div className="flex flex-col gap-2">
                              {standardLine ? (
                                <>
                                  <div className={cn("flex items-center justify-center px-2 py-1 rounded", isBestOver ? "bg-emerald-500/20" : "bg-slate-800/50") }>
                                    <span className="text-sm text-slate-200">o{standardLine}</span>
                                    {standardOverOdds && (
                                      <OddsDisplay odds={standardOverOdds} className={cn("text-sm ml-1", isBestOver ? "text-emerald-400" : "text-slate-200")} />
                                    )}
                                  </div>
                                  <div className={cn("flex items-center justify-center px-2 py-1 rounded", isBestUnder ? "bg-emerald-500/20" : "bg-slate-800/50") }>
                                    <span className="text-sm text-slate-200">u{standardLine}</span>
                                    {standardUnderOdds && (
                                      <OddsDisplay odds={standardUnderOdds} className={cn("text-sm ml-1", isBestUnder ? "text-emerald-400" : "text-slate-200")} />
                                    )}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center justify-center px-2 py-1 rounded bg-slate-800/50">
                                    <span className="text-sm text-slate-400">-</span>
                                  </div>
                                  <div className="flex items-center justify-center px-2 py-1 rounded bg-slate-800/50">
                                    <span className="text-sm text-slate-400">-</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </TableCell>
                        )
                       } else if (selectedMarket === "spread" || selectedMarket === 'run_line' || selectedMarket === 'puck_line') {
                        // Handle spreads market
                        const spreadsMarket = bookmaker?.markets.find((m) => m.key === "spreads")
                        let homeOdds: number | null = null
                        let homePoint: number | null = null
                        let awayOdds: number | null = null
                        let awayPoint: number | null = null
                        if (spreadsMarket?.lines) {
                          Object.entries(spreadsMarket.lines).forEach(([lk, ld]) => {
                            const sb = ld.sportsbooks?.[bookId]
                            if (!sb?.is_standard) return
                            if (sb.team?.toLowerCase() === game.home_team.name.toLowerCase()) {
                              homeOdds = typeof sb.price === 'number' ? sb.price : homeOdds
                              homePoint = typeof ld.point === 'number' ? ld.point : homePoint
                            }
                            if (sb.team?.toLowerCase() === game.away_team.name.toLowerCase()) {
                              awayOdds = typeof sb.price === 'number' ? sb.price : awayOdds
                              awayPoint = typeof ld.point === 'number' ? ld.point : awayPoint
                            }
                          })
                        }
                         const isBestAway = spreadBest?.away && awayPoint != null && Number(awayPoint) === Number(spreadBest.away.point) && typeof awayOdds === 'number' && awayOdds === spreadBest.away.price
                         const isBestHome = spreadBest?.home && homePoint != null && Number(homePoint) === Number(spreadBest.home.point) && typeof homeOdds === 'number' && homeOdds === spreadBest.home.price
                        return (
                          <TableCell key={book.id} className="text-center">
                            <div className="flex flex-col gap-2">
                              <div className={cn("flex items-center justify-center px-2 py-1 rounded", isBestAway ? "bg-emerald-500/20" : "bg-slate-800/50") }>
                                {awayPoint != null ? (
                                  <span className={cn("text-sm mr-1", isBestAway ? "text-emerald-400" : "text-slate-200")}>{formatSignedPoint(awayPoint)}</span>
                                ) : (
                                  <span className="text-sm text-slate-400 ml-1">-</span>
                                )}
                                {typeof awayOdds === 'number' ? (
                                  <OddsDisplay odds={awayOdds} className={cn("text-sm", isBestAway ? "text-emerald-400" : "text-slate-200")} />
                                ) : (
                                  <span className="text-sm text-slate-400">-</span>
                                )}
                              </div>
                              <div className={cn("flex items-center justify-center px-2 py-1 rounded", isBestHome ? "bg-emerald-500/20" : "bg-slate-800/50") }>
                                {homePoint != null ? (
                                  <span className={cn("text-sm mr-1", isBestHome ? "text-emerald-400" : "text-slate-200")}>{formatSignedPoint(homePoint)}</span>
                                ) : (
                                  <span className="text-sm text-slate-400 ml-1">-</span>
                                )}
                                {typeof homeOdds === 'number' ? (
                                  <OddsDisplay odds={homeOdds} className={cn("text-sm", isBestHome ? "text-emerald-400" : "text-slate-200")} />
                                ) : (
                                  <span className="text-sm text-slate-400">-</span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        )
                      } else {
                        // Handle moneyline (h2h) market
                        const h2hMarket = bookmaker?.markets.find((m) => m.key === "h2h")
                        console.log(`[Component] Moneyline market for ${book.name}:`, {
                          found: !!h2hMarket,
                          outcomes: h2hMarket?.outcomes
                        })

                        const awayOutcome = h2hMarket?.outcomes.find((o) => o.name.toLowerCase() === game.away_team.name.toLowerCase())
                        const homeOutcome = h2hMarket?.outcomes.find((o) => o.name.toLowerCase() === game.home_team.name.toLowerCase())

                        // Check if this sportsbook has the best odds
                        const isAwayBest = awayOutcome && awayBestOdds && awayOutcome.price === awayBestOdds.price
                        const isHomeBest = homeOutcome && homeBestOdds && homeOutcome.price === homeBestOdds.price

                        return (
                          <TableCell key={book.id} className="text-center">
                            <div className="flex flex-col gap-2">
                              <div className={cn(
                                "flex items-center justify-center px-2 py-1 rounded",
                                isAwayBest ? "bg-emerald-500/20" : "bg-slate-800/50"
                              )}>
                                {awayOutcome ? (
                                  <OddsDisplay 
                                    odds={awayOutcome.price}
                                    link={awayOutcome.link} 
                                    className={cn(
                                      "text-sm",
                                      isAwayBest ? "text-emerald-400" : "text-slate-200"
                                    )} 
                                  />
                                ) : (
                                  <span className="text-sm text-slate-400">-</span>
                                )}
                              </div>
                              <div className={cn(
                                "flex items-center justify-center px-2 py-1 rounded",
                                isHomeBest ? "bg-emerald-500/20" : "bg-slate-800/50"
                              )}>
                                {homeOutcome ? (
                                  <OddsDisplay 
                                    odds={homeOutcome.price}
                                    link={homeOutcome.link} 
                                    className={cn(
                                      "text-sm",
                                      isHomeBest ? "text-emerald-400" : "text-slate-200"
                                    )} 
                                  />
                                ) : (
                                  <span className="text-sm text-slate-400">-</span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        )
                      }
                    })}
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
                                  !awayBestOdds && "opacity-50 cursor-not-allowed",
                                )}
                                onClick={() => handleAddToBetslip(game, "away")}
                                disabled={!awayBestOdds}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                {awayTeamAbbr}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {awayBestOdds
                                ? "Add to betslip to compare across sportsbooks"
                                : "No odds available"}
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
                                  "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-400",
                                  "dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30 dark:hover:text-emerald-300",
                                  "border-emerald-500/20",
                                  !homeBestOdds && "opacity-50 cursor-not-allowed",
                                )}
                                onClick={() => handleAddToBetslip(game, "home")}
                                disabled={!homeBestOdds}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                {homeTeamAbbr}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {homeBestOdds
                                ? "Add to betslip to compare across sportsbooks"
                                : "No odds available"}
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
            <p className="text-sm text-muted-foreground">
              You already have a selection for this game. Would you like to replace it?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleResolveConflict(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleResolveConflict(true)}>
              Replace Selection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 