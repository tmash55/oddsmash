"use client"

import type { ReactElement } from "react"
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
import { OddsDisplay } from "@/components/shared/odds-display"
import { motion } from "framer-motion"
import { useBetActions } from "@/hooks/use-bet-actions"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BetslipDialog } from "@/components/betting/betslip-dialog"
import { getStandardAbbreviation, getSportSpecificStyles } from "@/lib/constants/team-mappings"
import { SPORTSBOOK_ID_MAP, REVERSE_SPORTSBOOK_MAP } from "@/lib/constants/sportsbook-mappings"
import { getTeamLogoUrl, getPlayerHeadshotUrl } from "@/lib/constants/sport-assets"
import { createBetslipSelection } from "@/lib/betslip-utils"
import { Badge } from "@/components/ui/badge"

// Format odds to always show + for positive odds
function formatOdds(odds: number): string {
  return odds >= 0 ? `+${odds}` : odds.toString()
}

// Convert American odds to decimal
function americanToDecimal(americanOdds: number): number {
  if (americanOdds >= 0) {
    return americanOdds / 100 + 1
  }
  return 100 / Math.abs(americanOdds) + 1
}

// Helper: identify yes/no markets (touchdown scorer)
function isYesNoMarket(market: string): boolean {
  const m = (market || "").toLowerCase()
  return m === "anytime touchdown scorer" || m === "1st touchdown scorer" || m === "last touchdown scorer"
}

// Add helpers to format date and time like game lines table
function formatShortDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
  })
}

function formatShortTime(date: string): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

// Function to get Value% from pre-calculated metrics
function getValuePercent(item: PlayerOdds, activeLine: string, type: "over" | "under"): number | null {
  // Use pre-calculated metrics from Redis; fallback to yes/no for scorer markets
  const path: any = item.metrics?.[activeLine]
  const val = path?.[type]?.value_pct ?? (type === "over" ? path?.yes?.value_pct : path?.no?.value_pct)
  if (val !== undefined && val !== null) return Math.round(val * 10) / 10

  // Fallback: compute from best vs average at this line, if available
  if (isYesNoMarket(item.market)) return null
  const { bestPrice, avgAmerican } = computeBestAndAverageAtLine(item, activeLine, type)
  if (bestPrice == null || avgAmerican == null) return null
  const bestDec = americanToDecimal(bestPrice)
  const avgDec = americanToDecimal(avgAmerican)
  if (!Number.isFinite(bestDec) || !Number.isFinite(avgDec) || avgDec <= 1) return null
  const trueProb = 1 / avgDec
  const evPct = (trueProb * bestDec - 1) * 100
  
  // Debug logging for MLB value calculation issues
  if (process.env.NODE_ENV === 'development' && (bestPrice || avgAmerican)) {
    console.log(`Value calc for ${item.description} ${type}: bestPrice=${bestPrice}, avgAmerican=${avgAmerican}, evPct=${evPct}`)
  }
  
  return Math.round(evPct * 10) / 10
}

// Function to get average odds from pre-calculated metrics
function getAverageOdds(item: PlayerOdds, activeLine: string, type: "over" | "under"): number | null {
  const path: any = item.metrics?.[activeLine]
  const pre = path?.[type]?.avg_price ?? (type === "over" ? path?.yes?.avg_price : path?.no?.avg_price)
  if (pre != null) return pre
  // Fallback: compute average from sportsbook odds at this line
  if (isYesNoMarket(item.market)) return null
  const { avgAmerican } = computeBestAndAverageAtLine(item, activeLine, type)
  return avgAmerican
}

// Helpers to compute best and average across books at a specific line
function computeBestAndAverageAtLine(
  item: PlayerOdds,
  lineStr: string,
  type: "over" | "under",
): { bestPrice: number | null; avgAmerican: number | null } {
  const lineOdds = (item.lines || {})[lineStr] as Record<string, any> | undefined
  if (!lineOdds) return { bestPrice: null, avgAmerican: null }
  let bestPrice: number | null = null
  const decimals: number[] = []
  for (const [, bookOdds] of Object.entries(lineOdds)) {
    const pick: any = type === "over" ? (bookOdds as any)?.over : (bookOdds as any)?.under
    const price = typeof pick?.price === "number" ? pick.price : null
    if (price == null) continue
    if (bestPrice == null || price > bestPrice) bestPrice = price
    const dec = americanToDecimal(price)
    if (Number.isFinite(dec)) decimals.push(dec)
  }
  if (decimals.length === 0) return { bestPrice, avgAmerican: null }
  const avgDec = decimals.reduce((s, d) => s + d, 0) / decimals.length
  // Convert back to American
  const avgAmerican = avgDec >= 2 ? Math.round((avgDec - 1) * 100) : Math.round(-100 / (avgDec - 1))
  return { bestPrice, avgAmerican }
}

// Function to render average odds cell with both over/under
function renderAverageOddsCell(item: PlayerOdds, activeLine: string): ReactElement {
  const overAvgOdds = getAverageOdds(item, activeLine, "over")
  const underAvgOdds = getAverageOdds(item, activeLine, "under")
  const isYesNo = isYesNoMarket(item.market)
  const numericLine = Number.parseFloat(activeLine)
  const showLine = !isYesNo && Number.isFinite(numericLine)

  return (
    <td className="px-2 py-2">
      <div className="flex flex-col gap-2 items-center">
        <div className="flex items-center justify-center px-3 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border border-blue-200/50 dark:border-blue-800/50 min-w-[80px]">
          <div className="flex items-center gap-1">
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">O</span>
            {showLine && (
              <span className="text-[11px] text-muted-foreground">{numericLine.toFixed(1)}</span>
            )}
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              {overAvgOdds ? formatOdds(Math.round(overAvgOdds)) : "—"}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-center px-3 py-2 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border border-purple-200/50 dark:border-purple-800/50 min-w-[80px]">
          <div className="flex items-center gap-1">
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">U</span>
            {showLine && (
              <span className="text-[11px] text-muted-foreground">{numericLine.toFixed(1)}</span>
            )}
            <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
              {underAvgOdds ? formatOdds(Math.round(underAvgOdds)) : "—"}
            </span>
          </div>
        </div>
      </div>
    </td>
  )
}

// Update helper function to get max EV using only pre-calculated metrics
function getMaxEV(item: ProcessedPlayerOdds): number {
  // Use unified getter that falls back to client-side computation when metrics are missing
  const over = getValuePercent(item, item.activeLine, "over")
  const under = getValuePercent(item, item.activeLine, "under")
  const values = [over, under].filter((v): v is number => typeof v === "number" && Number.isFinite(v))
  if (values.length === 0) return 0
  return Math.max(...values)
}

interface ProcessedPlayerOdds extends PlayerOdds {
  bestOverOdds: OddsPrice | null
  bestUnderOdds: OddsPrice | null
  bestOverPrice: number
  bestUnderPrice: number
  bestOverBook: string
  bestUnderBook: string
  bestOverLine?: number
  bestUnderLine?: number
  activeLine: string
}

// Update the renderClickableOdds function
function renderClickableOdds(
  odds: OddsPrice | null | undefined,
  type: "over" | "under" | null = null,
): ReactElement | null {
  if (!odds) {
    return <span className="text-sm text-muted-foreground">—</span>
  }

  return <OddsDisplay odds={odds.price} link={odds.link} className="text-sm font-semibold" />
}

// Update the renderEV function with consistent width
function renderEV(item: PlayerOdds, activeLine: string, type: "over" | "under"): ReactElement | null {
  // Use pre-calculated metrics or fallback computation
  const valuePercent = getValuePercent(item, activeLine, type)
  if (valuePercent == null) {
    return (
      <div className="flex items-center justify-center px-3 py-2 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 min-w-[80px]">
        <span className="text-gray-500 dark:text-gray-400 font-medium">—</span>
        </div>
    )
  }

  const isPositive = valuePercent > 0
  const isZero = valuePercent === 0
  const formatted = `${isPositive ? "+" : ""}${valuePercent.toFixed(1)}%`

  // Pull metrics for tooltip when available
  const mroot: any = item.metrics?.[activeLine]
  const metrics: any = mroot?.[type] || null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center justify-center px-3 py-2 rounded-xl min-w-[80px] cursor-help border",
              isPositive && "bg-gradient-to-r from-emerald-50 to-green-100 dark:from-emerald-950/30 dark:to-green-900/30 border-emerald-200/50 dark:border-emerald-800/50",
              !isPositive && !isZero && "bg-gradient-to-r from-rose-50 to-red-100 dark:from-rose-950/30 dark:to-red-900/30 border-rose-200/50 dark:border-rose-800/50",
              isZero && "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 border-gray-200/50 dark:border-gray-700/50",
            )}
          >
            <span className={cn("text-sm font-bold", isPositive ? "text-emerald-600 dark:text-emerald-400" : !isZero ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-300")}>{formatted}</span>
          </div>
        </TooltipTrigger>
        {metrics && (
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">Value Analysis</p>
              {typeof metrics.best_price === "number" && <p>Best: {formatOdds(metrics.best_price)}</p>}
              {typeof metrics.avg_price === "number" && <p>Average: {formatOdds(Math.round(metrics.avg_price))}</p>}
              <p>Value: {formatted}</p>
            <p className="text-xs text-gray-500">Market Average Method</p>
          </div>
        </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}

// Update the average odds cell with consistent width
function renderAverageOdds(item: PlayerOdds, activeLine: string, type: "over" | "under"): ReactElement | null {
  const avgOdds = getAverageOdds(item, activeLine, type)
  
  if (!avgOdds) {
    return (
      <div className="flex items-center justify-center px-3 py-2 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 min-w-[80px]">
        <span className="text-gray-500 dark:text-gray-400 font-medium">—</span>
        </div>
    )
  }

  // Round to nearest whole number
  const roundedOdds = Math.round(avgOdds)

  return (
    <div className="flex items-center justify-center px-3 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border border-blue-200/50 dark:border-blue-800/50 min-w-[80px]">
      <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{formatOdds(roundedOdds)}</span>
      </div>
  )
}

// Update the table cell to show both over/under values with consistent styling
function renderValueCell(item: PlayerOdds, activeLine: string): ReactElement {
  return (
    <td className="px-2 py-2">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium w-4">O</span>
          {renderEV(item, activeLine, "over")}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-purple-600 dark:text-purple-400 font-medium w-4">U</span>
          {renderEV(item, activeLine, "under")}
        </div>
      </div>
    </td>
  )
}

// Helper to determine if sport is NFL/NCAAF
function isFootballSport(sport: string): boolean {
  const s = (sport || "").toLowerCase()
  return ["football_nfl", "americanfootball_nfl", "nfl", "football_ncaaf", "americanfootball_ncaaf", "ncaaf"].includes(s)
}

// Find odds for a given book at active line; if missing and NFL/NCAAF, allow nearest line within tolerance
function getBookOddsWithTolerance(
  item: PlayerOdds,
  bookIds: string[],
  side: "over" | "under",
  sport: string,
  activeLineStr: string,
  tolerancePoints = 2.0,
): { price: number; link?: string; line: number } | null {
  const yesNo = isYesNoMarket(item.market)
  if (yesNo) {
    // Do not apply tolerance for yes/no markets
    const oddsAtActive = item.lines?.[activeLineStr]
    if (!oddsAtActive) return null
    for (const id of bookIds) {
      const bookOdds: any = oddsAtActive[id]
      if (!bookOdds) continue
      const pick: any = side === "over" ? bookOdds.over : bookOdds.under
      if (pick && typeof pick.price === "number") {
        const lineNum = Number.parseFloat(activeLineStr)
        return { price: pick.price, link: pick.link, line: lineNum }
      }
    }
    return null
  }

  const oddsAtActive = item.lines?.[activeLineStr]
  const activeLineNum = Number.parseFloat(activeLineStr)
  if (oddsAtActive) {
    for (const id of bookIds) {
      const bookOdds: any = oddsAtActive[id]
      if (!bookOdds) continue
      const pick: any = side === "over" ? bookOdds.over : bookOdds.under
      if (pick && typeof pick.price === "number") {
        return { price: pick.price, link: pick.link, line: activeLineNum }
      }
    }
  }

  if (!isFootballSport(sport)) return null

  // Search nearest within tolerance; choose most favorable line for the side
  let bestCandidate: { price: number; link?: string; line: number } | null = null
  for (const [lineKey, lineOdds] of Object.entries(item.lines || {})) {
    const lineNum = Number.parseFloat(lineKey)
    if (!Number.isFinite(lineNum)) continue
    const diff = Math.abs(lineNum - activeLineNum)
    if (diff > tolerancePoints) continue
    for (const id of bookIds) {
      const bookOdds: any = (lineOdds as any)[id]
      if (!bookOdds) continue
      const pick: any = side === "over" ? bookOdds.over : bookOdds.under
      if (pick && typeof pick.price === "number") {
        if (!bestCandidate) {
          bestCandidate = { price: pick.price, link: pick.link, line: lineNum }
        } else {
          // Over: prefer lower line; Under: prefer higher line. Tie-break on better price
          const betterLine = side === "over" ? lineNum < bestCandidate.line : lineNum > bestCandidate.line
          const tieLineBetterPrice = lineNum === bestCandidate.line && pick.price > bestCandidate.price
          if (betterLine || tieLineBetterPrice) {
            bestCandidate = { price: pick.price, link: pick.link, line: lineNum }
          }
        }
      }
    }
  }
  return bestCandidate
}

// Find the best line for a specific book across ALL available lines (no tolerance)
function getBookBestLineAnyDistance(
  item: PlayerOdds,
  bookIds: string[],
  side: "over" | "under",
  maxNegativePrice?: number, // e.g. -200 to exclude heavily juiced alternates
): { price: number; link?: string; line: number } | null {
  let best: { price: number; link?: string; line: number } | null = null
  for (const [lineKey, oddsByBook] of Object.entries(item.lines || {})) {
    const lineNum = Number.parseFloat(lineKey)
    if (!Number.isFinite(lineNum)) continue
    for (const id of bookIds) {
      const bookOdds: any = (oddsByBook as any)[id]
      if (!bookOdds) continue
      const pick: any = side === "over" ? bookOdds.over : bookOdds.under
      if (pick && typeof pick.price === "number") {
        if (typeof maxNegativePrice === "number" && pick.price < maxNegativePrice) {
          // Skip extremely juiced prices when restricting to standard-lines-friendly odds
          continue
        }
        if (!best) {
          best = { price: pick.price, link: pick.link, line: lineNum }
        } else {
          // Over: prefer lower line; Under: prefer higher line. Tie-break on better price
          const betterLine = side === "over" ? lineNum < best.line : lineNum > best.line
          const tieBetterPrice = lineNum === best.line && pick.price > best.price
          if (betterLine || tieBetterPrice) {
            best = { price: pick.price, link: pick.link, line: lineNum }
          }
        }
      }
    }
  }
  return best
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

interface PropComparisonTableV2Props {
  data: PlayerOdds[]
  sortField: "odds" | "line" | "edge" | "name" | "ev"
  sortDirection: "asc" | "desc"
  onSortChange: (field: "odds" | "line" | "edge" | "name" | "ev", direction: "asc" | "desc") => void
  bestOddsFilter: BestOddsFilter | null
  globalLine: string | null
  sport: string
}

export function PropComparisonTableV2({
  data,
  sortField,
  sortDirection,
  onSortChange,
  bestOddsFilter,
  globalLine,
  sport,
}: PropComparisonTableV2Props) {
  const activeSportsbooks = sportsbooks.filter((book) => book.isActive)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set())
  const [showBetslipDialog, setShowBetslipDialog] = useState(false)
  const [pendingSelection, setPendingSelection] = useState<any>(null)

  const { betslips, handleBetslipSelect, handleCreateBetslip, conflictingSelection, handleResolveConflict } =
    useBetActions()

  // Function to create betslip selection
  const createBetslipSelectionFromItem = (item: PlayerOdds, type: "over" | "under") => {
    const activeLine = globalLine && item.lines?.[globalLine] ? globalLine : Object.keys(item.lines || {})[0]
    const lineOdds = item.lines?.[activeLine] || {}

    // Debug logging for WNBA vs MLB comparison
    console.log(`[PropComparison] Creating betslip selection:`, {
      sport,
      player: item.description,
      market: item.market,
      type,
      activeLine,
      globalLine,
      allAvailableLines: Object.keys(item.lines || {}),
      primaryLine: item.primary_line,
      hasOddsData: Object.keys(lineOdds).length > 0,
      event_id: item.event_id,
      team: item.team,
      home_team: item.home_team,
      away_team: item.away_team,
      lineSelectionLogic: {
        globalLineExists: !!(globalLine && item.lines?.[globalLine]),
        usingGlobalLine: !!(globalLine && item.lines?.[globalLine]),
        firstAvailableLine: Object.keys(item.lines || {})[0],
        finalActiveLine: activeLine,
      },
    })

    const selection = createBetslipSelection({
      event_id: item.event_id,
      sport_key: sport,
      market: item.market,
      // Remove market_display - let betslip-utils.ts handle the proper lookup
      bet_type: type,
      player_name: item.description,
      player_id: item.player_id.toString(),
      player_team: item.team,
      line: Number.parseFloat(activeLine),
      commence_time: item.commence_time,
      home_team: item.home_team || "",
      away_team: item.away_team || "",
      odds_data: lineOdds,
    })

    // Debug the output
    console.log(`[PropComparison] Created selection:`, {
      sport_key: selection.sport_key,
      market_key: selection.market_key,
      market_display: selection.market_display,
      selection: selection.selection,
      bet_type: selection.bet_type,
      hasOddsData: Object.keys(selection.odds_data).length > 0,
    })

    return selection
  }

  // Function to handle adding to betslip
  const handleAddToBetslip = (item: PlayerOdds, type: "over" | "under") => {
    const selection = createBetslipSelectionFromItem(item, type)
    setPendingSelection(selection)
    setShowBetslipDialog(true)
  }

  // Process data to include best odds for each selection
  const processedData: ProcessedPlayerOdds[] = useMemo(() => {
    return data.map((item) => {
      const yesNo = isYesNoMarket(item.market)
      // When using standard lines, use the primary_line from Redis if available
      // Otherwise, use global line if available and the player has odds for that line
      const activeLine =
        !globalLine && item.primary_line
          ? item.primary_line
          : globalLine && item.lines?.[globalLine]
            ? globalLine
            : Object.keys(item.lines || {})[0]

      const lineOdds = item.lines?.[activeLine] || {}
      const isStandardLinesView = item.primary_line ? activeLine === item.primary_line : false

      // Find best odds for over/under (or yes/no for scorer markets)
      let bestOverOdds: OddsPrice | null = null
      let bestUnderOdds: OddsPrice | null = null
      let bestOverPrice = Number.NEGATIVE_INFINITY
      let bestUnderPrice = Number.NEGATIVE_INFINITY
      let bestOverBook = ""
      let bestUnderBook = ""
      let bestOverLine: number | undefined
      let bestUnderLine: number | undefined

      // Process odds for each sportsbook
      Object.entries(lineOdds).forEach(([bookId, bookOdds]) => {
        const mappedId = SPORTSBOOK_ID_MAP[bookId] || bookId
        const overObj: any = yesNo ? (bookOdds as any).yes : (bookOdds as any).over
        const underObj: any = yesNo ? (bookOdds as any).no : (bookOdds as any).under
        // Exclude extremely juiced prices in standard-lines view
        if (overObj && typeof overObj.price === 'number' && (!isStandardLinesView || overObj.price >= -140) && overObj.price > bestOverPrice) {
          bestOverPrice = overObj.price
          bestOverBook = mappedId
          bestOverOdds = {
            ...overObj,
            sid: overObj.sid || "default",
          }
        }
        if (underObj && typeof underObj.price === 'number' && (!isStandardLinesView || underObj.price >= -140) && underObj.price > bestUnderPrice) {
          bestUnderPrice = underObj.price
          bestUnderBook = mappedId
          bestUnderOdds = {
            ...underObj,
            sid: underObj.sid || "default",
          }
        }
      })

      // If football and we allow tolerance, scan other lines to find a better "best" by line advantage
      if (!yesNo && isFootballSport(sport)) {
        const activeNum = Number.parseFloat(activeLine)
        for (const [lineKey, oddsByBook] of Object.entries(item.lines || {})) {
          const lineNum = Number.parseFloat(lineKey)
          if (!Number.isFinite(lineNum)) continue
          // Over: lower line preferable; Under: higher line preferable
          for (const [bookId, bookOdds] of Object.entries<any>(oddsByBook)) {
            const mappedId = SPORTSBOOK_ID_MAP[bookId] || bookId
            const o = (bookOdds as any).over
            const u = (bookOdds as any).under
            if (o && typeof o.price === "number") {
              if (isStandardLinesView && o.price < -140) {
                // Skip extremely juiced alternates when emphasizing standard lines
                continue
              }
              const betterLine = bestOverLine == null || lineNum < (bestOverLine as number)
              const tieBetterPrice = bestOverLine != null && lineNum === bestOverLine && o.price > (bestOverOdds?.price ?? Number.NEGATIVE_INFINITY)
              if (betterLine || tieBetterPrice) {
                bestOverLine = lineNum
                bestOverOdds = { ...o }
                bestOverBook = mappedId
                bestOverPrice = o.price
              }
            }
            if (u && typeof u.price === "number") {
              if (isStandardLinesView && u.price < -140) {
                continue
              }
              const betterLine = bestUnderLine == null || lineNum > (bestUnderLine as number)
              const tieBetterPrice = bestUnderLine != null && lineNum === bestUnderLine && u.price > (bestUnderOdds?.price ?? Number.NEGATIVE_INFINITY)
              if (betterLine || tieBetterPrice) {
                bestUnderLine = lineNum
                bestUnderOdds = { ...u }
                bestUnderBook = mappedId
                bestUnderPrice = u.price
              }
            }
          }
        }
      }

      return {
        ...item,
        bestOverOdds,
        bestUnderOdds,
        bestOverPrice: bestOverPrice === Number.NEGATIVE_INFINITY ? 0 : bestOverPrice,
        bestUnderPrice: bestUnderPrice === Number.NEGATIVE_INFINITY ? 0 : bestUnderPrice,
        bestOverBook,
        bestUnderBook,
        bestOverLine,
        bestUnderLine,
        activeLine,
      }
    })
  }, [data, globalLine, sport])

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
      lg: 32,
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
    const teamAbbr = getStandardAbbreviation(item.team, sport)
    const yesNo = isYesNoMarket(item.market)
    const isExpanded = expandedRows.has(item.player_id.toString())
    
    // Get average odds from metrics
    const overAvgOdds = getAverageOdds(item, item.activeLine, "over")
    const underAvgOdds = getAverageOdds(item, item.activeLine, "under")

    return (
      <>
        <motion.tr
          key={item.player_id.toString()}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="cursor-pointer hover:bg-gradient-to-r hover:from-muted/20 hover:to-muted/10 transition-all duration-200 border-border/50"
          onClick={() => toggleRow(item.player_id)}
        >
          <TableCell>
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <span className="font-medium text-foreground">{item.description}</span>
                <div className="flex items-center gap-1">
                  <Image
                    src={getTeamLogoUrl(teamAbbr, sport) || "/placeholder.svg"}
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
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {item.activeLine}
            </Badge>
          </TableCell>
          <TableCell className="text-center">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border border-blue-200/50 dark:border-blue-800/50">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">{yesNo ? "Y" : "O"}</span>
                  {renderClickableOdds(item.bestOverOdds, "over")}
                </div>
                {item.bestOverBook && renderSportsbookLogo(item.bestOverBook, "sm")}
              </div>
              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border border-purple-200/50 dark:border-purple-800/50">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">{yesNo ? "N" : "U"}</span>
                  {renderClickableOdds(item.bestUnderOdds, "under")}
                </div>
                {item.bestUnderBook && renderSportsbookLogo(item.bestUnderBook, "sm")}
              </div>
            </div>
          </TableCell>
          <TableCell>
            <div className="flex flex-col gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="w-full">{renderEV(item, item.activeLine, "over")}</TooltipTrigger>
                  <TooltipContent>
                    <p>{getFairOddsExplanation(item.lines[item.activeLine], "over")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="w-full">{renderEV(item, item.activeLine, "under")}</TooltipTrigger>
                  <TooltipContent>
                    <p>{getFairOddsExplanation(item.lines[item.activeLine], "under")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </TableCell>
          <TableCell className="text-center">
            <div className="flex flex-col gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    key={`${item.player_id}-over`}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-full min-w-[40px] px-2",
                        "bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-600 hover:from-emerald-500/20 hover:to-green-500/20 hover:text-emerald-700",
                        "dark:from-emerald-500/20 dark:to-green-500/20 dark:text-emerald-400 dark:hover:from-emerald-500/30 dark:hover:to-green-500/30 dark:hover:text-emerald-300",
                        "border-emerald-500/30 shadow-sm",
                      !item.bestOverOdds && "opacity-50 cursor-not-allowed",
                    )}
                    onClick={() => handleAddToBetslip(item, "over")}
                    disabled={!item.bestOverOdds}
                  >
                      <Plus className="w-3 h-3 mr-1" />O
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
                    key={`${item.player_id}-under`}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-full min-w-[40px] px-2",
                        "bg-gradient-to-r from-red-500/10 to-pink-500/10 text-red-600 hover:from-red-500/20 hover:to-pink-500/20 hover:text-red-700",
                        "dark:from-red-500/20 dark:to-pink-500/20 dark:text-red-400 dark:hover:from-red-500/30 dark:hover:to-pink-500/30 dark:hover:text-red-300",
                        "border-red-500/30 shadow-sm",
                      !item.bestUnderOdds && "opacity-50 cursor-not-allowed",
                    )}
                    onClick={() => handleAddToBetslip(item, "under")}
                    disabled={!item.bestUnderOdds}
                  >
                      <Plus className="w-3 h-3 mr-1" />U
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
        </motion.tr>
        {isExpanded && (
          <TableRow className="bg-gradient-to-r from-muted/30 to-muted/20 border-border/50">
            <TableCell colSpan={4} className="p-4">
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-border/50 bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-950/80 dark:to-slate-950/40 backdrop-blur-xl rounded-xl"
              >
                <div className="p-4">
                  <div className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Compare Odds Across Books
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        {isYesNoMarket(item.market) ? "Yes Odds" : "Over Odds"}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {activeSportsbooks
                          .map((book) => {
                            const bookId = book.id.toLowerCase()
                            const mappedId = SPORTSBOOK_ID_MAP[bookId] || bookId
                            const bookOdds =
                              odds[mappedId] || odds[bookId] || odds[SPORTSBOOK_ID_MAP[bookId]] || odds[book.id]
                            const overOdds = isYesNoMarket(item.market)
                              ? (bookOdds as any)?.yes
                              : (bookOdds as any)?.over
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
                              key={`${book.id}-${item.player_id}-over`}
                              className={cn(
                                "flex items-center gap-2 p-3 rounded-xl border transition-all duration-200 shadow-sm",
                                "hover:scale-105 hover:shadow-md active:scale-95",
                                hasOverBestOdds
                                  ? "bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200 dark:from-emerald-950/30 dark:to-green-900/30 dark:border-emerald-800"
                                  : "bg-gradient-to-br from-white/80 to-white/60 border-border/50 dark:from-slate-800/80 dark:to-slate-700/80 dark:border-slate-600",
                              )}
                            >
                              <div className="w-6 h-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex items-center justify-center flex-shrink-0 border border-border/50">
                                {renderSportsbookLogo(book.id, "sm")}
                              </div>
                              <span
                                className={cn(
                                  "text-sm font-semibold",
                                  hasOverBestOdds ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
                                )}
                              >
                                {formatOdds(overOdds.price)}
                              </span>
                            </button>
                          ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        {isYesNoMarket(item.market) ? "No Odds" : "Under Odds"}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {activeSportsbooks
                          .map((book) => {
                            const bookId = book.id.toLowerCase()
                            const mappedId = SPORTSBOOK_ID_MAP[bookId] || bookId
                            const bookOdds =
                              odds[mappedId] || odds[bookId] || odds[SPORTSBOOK_ID_MAP[bookId]] || odds[book.id]
                            const underOdds = isYesNoMarket(item.market)
                              ? (bookOdds as any)?.no
                              : (bookOdds as any)?.under
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
                              key={`${book.id}-${item.player_id}-under`}
                              className={cn(
                                "flex items-center gap-2 p-3 rounded-xl border transition-all duration-200 shadow-sm",
                                "hover:scale-105 hover:shadow-md active:scale-95",
                                hasUnderBestOdds
                                  ? "bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200 dark:from-emerald-950/30 dark:to-green-900/30 dark:border-emerald-800"
                                  : "bg-gradient-to-br from-white/80 to-white/60 border-border/50 dark:from-slate-800/80 dark:to-slate-700/80 dark:border-slate-600",
                              )}
                            >
                              <div className="w-6 h-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex items-center justify-center flex-shrink-0 border border-border/50">
                                {renderSportsbookLogo(book.id, "sm")}
                              </div>
                              <span
                                className={cn(
                                  "text-sm font-semibold",
                                  hasUnderBestOdds ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
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
              </motion.div>
            </TableCell>
          </TableRow>
        )}
      </>
    )
  }

  // Update the sorting logic to use metrics
  const sortedData = useMemo(() => {
    return [...processedData].sort((a, b) => {
      if (sortField === "name") {
        return sortDirection === "asc"
          ? a.description.localeCompare(b.description)
          : b.description.localeCompare(a.description)
      }
      
      if (sortField === "line") {
        const aLine = Number.parseFloat(a.activeLine)
        const bLine = Number.parseFloat(b.activeLine)
        return sortDirection === "asc" ? aLine - bLine : bLine - aLine
      }
      
      if (sortField === "edge") {
        const type = bestOddsFilter?.type || "over"
        const aValue = getValuePercent(a, a.activeLine, type) || 0
        const bValue = getValuePercent(b, b.activeLine, type) || 0
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
      }
      
      if (sortField === "odds") {
        const aMetrics = a.metrics?.[a.activeLine]?.over
        const bMetrics = b.metrics?.[b.activeLine]?.over
        const aBestPrice = aMetrics?.best_price || 0
        const bBestPrice = bMetrics?.best_price || 0
        return sortDirection === "asc" ? aBestPrice - bBestPrice : bBestPrice - aBestPrice
      }

      if (sortField === "ev") {
        // Get max EV value for each player (max of over/under value%)
        const aOverValue = getValuePercent(a, a.activeLine, "over") || 0
        const aUnderValue = getValuePercent(a, a.activeLine, "under") || 0
        const bOverValue = getValuePercent(b, b.activeLine, "over") || 0
        const bUnderValue = getValuePercent(b, b.activeLine, "under") || 0
        
        const aMaxValue = Math.max(aOverValue, aUnderValue)
        const bMaxValue = Math.max(bOverValue, bUnderValue)
        
        // Debug logging for MLB sorting issues
        if (process.env.NODE_ENV === 'development') {
          console.log(`Sorting EV: ${a.description} (${aMaxValue}) vs ${b.description} (${bMaxValue})`)
        }
        
        return sortDirection === "asc" ? aMaxValue - bMaxValue : bMaxValue - aMaxValue
      }

      return 0
    })
  }, [processedData, sortField, sortDirection, bestOddsFilter?.type])

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      className={cn(
          "rounded-2xl border bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-950/80 dark:to-slate-950/40 backdrop-blur-xl border-border/50 shadow-xl",
        isMobile && "-mx-4 border-x-0 rounded-none",
      )}
    >
      <div className="relative h-[70vh] overflow-auto">
        <Table>
            <TableHeader className="sticky top-0 z-30 bg-gradient-to-r from-white/95 to-white/90 dark:from-slate-950/95 dark:to-slate-950/90 backdrop-blur-xl border-b border-border/50 shadow-sm">
              <TableRow className="hover:bg-transparent border-border/50 divide-x divide-border/30">
              {isMobile ? (
                <>
                    <TableHead className="w-[35%] bg-gradient-to-r from-white/95 to-white/90 dark:from-slate-950/95 dark:to-slate-950/90 text-foreground font-semibold sticky top-0">
                      Player
                    </TableHead>
                    <TableHead className="w-[15%] text-center bg-gradient-to-r from-white/95 to-white/90 dark:from-slate-950/95 dark:to-slate-950/90 text-foreground font-semibold sticky top-0">
                    Line
                  </TableHead>
                    <TableHead className="w-[30%] text-center bg-gradient-to-r from-white/95 to-white/90 dark:from-slate-950/95 dark:to-slate-950/90 text-foreground font-semibold sticky top-0">
                    Odds
                  </TableHead>
                    <TableHead className="w-[20%] text-center bg-gradient-to-r from-white/95 to-white/90 dark:from-slate-950/95 dark:to-slate-950/90 text-foreground font-semibold sticky top-0">
                    Value%
                  </TableHead>
                    <TableHead className="w-[10%] text-center bg-gradient-to-r from-white/95 to-white/90 dark:from-slate-950/95 dark:to-slate-950/90 text-foreground font-semibold sticky top-0">
                    Act
                  </TableHead>
                </>
              ) : (
                <>
                    <TableHead className="w-[120px] text-center bg-gradient-to-r from-white/95 to-white/90 dark:from-slate-950/95 dark:to-slate-950/90 text-foreground font-semibold sticky top-0">
                      <div className="flex items-center justify-between gap-1">
                        <span>Date / Time</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          onClick={() =>
                            onSortChange(
                              "name", // keep existing default sort; optional: wire a dedicated time sort in parent later
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
                    <TableHead className="w-[380px] bg-gradient-to-r from-white/95 to-white/90 dark:from-slate-950/95 dark:to-slate-950/90 text-foreground font-semibold sticky top-0">
                    <div className="flex items-center justify-between gap-1">
                      <span>Player</span>
                      <Button
                        variant="ghost"
                        size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
                    <TableHead className="w-[80px] text-center bg-gradient-to-r from-white/95 to-white/90 dark:from-slate-950/95 dark:to-slate-950/90 text-foreground font-semibold sticky top-0">
                    <div className="flex items-center justify-between gap-1">
                      <span>Line</span>
                      <Button
                        variant="ghost"
                        size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
                    <TableHead className="w-[120px] bg-gradient-to-r from-white/95 to-white/90 dark:from-slate-950/95 dark:to-slate-950/90 text-foreground font-semibold sticky top-0">
                    <div className="flex items-center justify-between gap-1">
                      <span>Best Odds</span>
                      <Button
                        variant="ghost"
                        size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
                    <TableHead className="w-[100px] bg-gradient-to-r from-white/95 to-white/90 dark:from-slate-950/95 dark:to-slate-950/90 text-foreground font-semibold sticky top-0">
                    <span>Avg Odds</span>
                  </TableHead>
                    <TableHead className="bg-gradient-to-r from-white/95 to-white/90 dark:from-slate-950/95 dark:to-slate-950/90 text-foreground font-semibold sticky top-0">
                    <div className="flex items-center justify-end gap-1">
                      <span>Value%</span>
                      <Button
                        variant="ghost"
                        size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
                      <TableHead
                        key={`header-${book.id}`}
                        className="text-center w-[80px] bg-gradient-to-r from-white/95 to-white/90 dark:from-slate-950/95 dark:to-slate-950/90 sticky top-0"
                      >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                              <div className="flex justify-center">{renderSportsbookLogo(book.id, "lg")}</div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{book.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                  ))}
                    <TableHead className="w-[60px] text-center bg-gradient-to-r from-white/95 to-white/90 dark:from-slate-950/95 dark:to-slate-950/90 text-foreground font-semibold sticky top-0">
                    Actions
                  </TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
              {sortedData.map((item, index) => {
              if (isMobile) {
                return renderMobileRow(item)
              }

              const odds = item.lines[item.activeLine]
                const yesNo = isYesNoMarket(item.market)
              const teamAbbr = getStandardAbbreviation(item.team, sport)
              const homeTeamAbbr = getStandardAbbreviation(item.home_team || "", sport)
              const awayTeamAbbr = getStandardAbbreviation(item.away_team || "", sport)
              const isHomeTeam = teamAbbr === homeTeamAbbr
              const avgOdds = getAverageOdds(item, item.activeLine, "over")

              return (
                  <motion.tr
                    key={item.player_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-border/50 hover:bg-gradient-to-r hover:from-muted/20 hover:to-muted/10 transition-all duration-200 divide-x divide-border/30"
                  >
                    {/* New Date/Time cell */}
                    <TableCell className="text-center py-4">
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <span className="text-xs font-medium">{formatShortDate(item.commence_time)}</span>
                        <span className="text-xs">{formatShortTime(item.commence_time)}</span>
                      </div>
                    </TableCell>
                                      {/* Player cell */}
                    <TableCell className="text-foreground py-4">
                      {(() => {
                        const isFootball = [
                          "football_nfl",
                          "americanfootball_nfl",
                          "nfl",
                          "football_ncaaf",
                          "americanfootball_ncaaf",
                          "ncaaf",
                        ].includes(sport)

                        if (isFootball) {
                          const awayFull = item.away_team || awayTeamAbbr
                          const homeFull = item.home_team || homeTeamAbbr
                          return (
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">{item.description}</span>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>
                                  {awayFull} @ {homeFull}
                                </span>
                              </div>
                            </div>
                          )
                        }

                        return (
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className={getSportSpecificStyles(sport).avatarSize}>
                          <AvatarImage
                                  src={getPlayerHeadshotUrl(item.player_id.toString(), sport) || "/placeholder.svg"}
                            alt={item.description}
                            className="object-cover"
                          />
                                <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-foreground">
                            {item.description
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                              {!["baseball_mlb", "mlb"].includes(sport) && (
                        <div className="absolute -bottom-1 -right-1">
                          <Image
                                    src={getTeamLogoUrl(teamAbbr, sport) || "/placeholder.svg"}
                            alt={teamAbbr}
                            width={20}
                            height={20}
                            className={getSportSpecificStyles(sport).teamLogoSize}
                          />
                        </div>
                              )}
                      </div>
                      <div className="flex flex-col">
                              <span className="font-medium text-foreground">{item.description}</span>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            {isHomeTeam ? (
                              <>
                                <span className="text-xs">vs</span>
                                <Image
                                        src={getTeamLogoUrl(awayTeamAbbr, sport) || "/placeholder.svg"}
                                  alt={awayTeamAbbr}
                                  width={24}
                                  height={24}
                                  className="h-6 w-6"
                                />
                              </>
                            ) : (
                              <>
                                <span className="text-xs">@</span>
                                <Image
                                        src={getTeamLogoUrl(homeTeamAbbr, sport) || "/placeholder.svg"}
                                  alt={homeTeamAbbr}
                                  width={24}
                                  height={24}
                                  className="h-6 w-6"
                                />
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                        )
                      })()}
                  </TableCell>
                    {/* Line cell */}
                    <TableCell className="text-center py-4">
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium"
                      >
                        {item.activeLine}
                      </Badge>
                    </TableCell>
                    {/* Best Odds cell */}
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border border-blue-200/50 dark:border-blue-800/50">
                            <div className="flex items-center gap-1">
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                              {yesNo ? "Y" : "O"}
                            </span>
                              {item.bestOverOdds ? (
                              <div className="flex items-center gap-1">
                                {!yesNo && item.bestOverLine != null && (
                                  <span className="text-[11px] text-muted-foreground">o{item.bestOverLine.toFixed(1)}</span>
                                )}
                                <OddsDisplay 
                                  odds={item.bestOverOdds.price} 
                                  link={item.bestOverOdds.link} 
                                  className="text-sm font-semibold text-blue-700 dark:text-blue-300 hover:underline"
                                />
                              </div>
                              ) : (
                              <span className="text-sm text-muted-foreground font-medium">—</span>
                              )}
                            </div>
                            {item.bestOverBook && renderSportsbookLogo(item.bestOverBook, "sm")}
                          </div>
                        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border border-purple-200/50 dark:border-purple-800/50">
                            <div className="flex items-center gap-1">
                            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                              {yesNo ? "N" : "U"}
                            </span>
                              {item.bestUnderOdds ? (
                              <div className="flex items-center gap-1">
                                {!yesNo && item.bestUnderLine != null && (
                                  <span className="text-[11px] text-muted-foreground">u{item.bestUnderLine.toFixed(1)}</span>
                                )}
                                <OddsDisplay 
                                  odds={item.bestUnderOdds.price} 
                                  link={item.bestUnderOdds.link} 
                                  className="text-sm font-semibold text-purple-700 dark:text-purple-300 hover:underline"
                                />
                              </div>
                              ) : (
                              <span className="text-sm text-muted-foreground font-medium">—</span>
                              )}
                            </div>
                            {item.bestUnderBook && renderSportsbookLogo(item.bestUnderBook, "sm")}
                        </div>
                      </div>
                    </TableCell>
                    {/* Avg Odds cell with both Over/Under */}
                    {renderAverageOddsCell(item, item.activeLine)}
                    {/* Value% cell */}
                    {renderValueCell(item, item.activeLine)}
                    {/* Sportsbook cells */}
                    {activeSportsbooks.map((book) => {
                      const bookId = book.id.toLowerCase()
                      const mappedId = SPORTSBOOK_ID_MAP[bookId] || bookId
                      
                      // Try all possible variations of the sportsbook ID
                      const possibleIds = [
                        mappedId,
                        bookId,
                        book.id,
                        SPORTSBOOK_ID_MAP[bookId],
                        // Add common variations
                        bookId === "williamhill_us" ? "caesars" : null,
                        bookId === "caesars" ? "williamhill_us" : null,
                        bookId === "espnbet" ? "espn_bet" : null,
                        bookId === "hardrockbet" ? "hard_rock" : null,
                        bookId === "ballybet" ? "bally_bet" : null,
                      ].filter(Boolean) as string[]

                      // Find odds at active line; if missing and NFL/NCAAF, fall back within tolerance
                      const bookOdds = possibleIds.reduce((found: BookmakerOdds | null, id) => {
                        const foundOdds = odds[id]
                        return found || (foundOdds as BookmakerOdds)
                      }, null)

                      const overCandidate = getBookOddsWithTolerance(item, possibleIds, "over", sport, item.activeLine)
                      const underCandidate = getBookOddsWithTolerance(item, possibleIds, "under", sport, item.activeLine)
                      const isFootball = isFootballSport(sport)
                      // When we fall back to scanning alternates, exclude extremely juiced prices (e.g., -2000)
                      const overAny = !isFootball || overCandidate ? null : getBookBestLineAnyDistance(item, possibleIds, "over", -140)
                      const underAny = !isFootball || underCandidate ? null : getBookBestLineAnyDistance(item, possibleIds, "under", -140)

                      // Highlight all books that match the best price (ties included)
                      const overPrice = yesNo
                        ? (bookOdds as any)?.yes?.price
                        : overCandidate?.price ?? overAny?.price ?? (bookOdds as any)?.over?.price
                      const underPrice = yesNo
                        ? (bookOdds as any)?.no?.price
                        : underCandidate?.price ?? underAny?.price ?? (bookOdds as any)?.under?.price
                      const isOverBest = overPrice != null && overPrice === item.bestOverPrice
                      const isUnderBest = underPrice != null && underPrice === item.bestUnderPrice

                      return (
                        <TableCell key={`${item.player_id}-${book.id}`} className="text-center py-4">
                          <div className="flex flex-col gap-2">
                            <div
                              className={cn(
                                "flex items-center justify-center px-3 py-2 rounded-xl border shadow-sm",
                                isOverBest
                                  ? "bg-gradient-to-r from-emerald-50 to-green-100 border-emerald-200/50 dark:from-emerald-950/30 dark:to-green-900/30 dark:border-emerald-800/50"
                                  : "bg-gradient-to-r from-white/80 to-white/60 border-border/50 dark:from-slate-800/80 dark:to-slate-700/80 dark:border-slate-600",
                              )}
                            >
                              {(yesNo ? (bookOdds as any)?.yes : overCandidate || overAny || (bookOdds as any)?.over) ? (
                                <div className="flex items-center gap-1">
                                  {isFootballSport(sport) && !yesNo && (
                                    <span className="text-xs text-muted-foreground">o{(overCandidate?.line ?? overAny?.line ?? Number(item.activeLine)).toFixed(1)}</span>
                                  )}
                                <OddsDisplay 
                                    odds={yesNo ? (bookOdds as any)?.yes?.price : (overCandidate?.price ?? overAny?.price ?? (bookOdds as any)?.over?.price)}
                                    link={yesNo ? (bookOdds as any)?.yes?.link : (overCandidate?.link ?? overAny?.link ?? (bookOdds as any)?.over?.link)}
                                  className={cn(
                                      "text-sm font-semibold",
                                      isOverBest ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
                                  )} 
                                />
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground font-medium">—</span>
                              )}
                            </div>
                            <div
                              className={cn(
                                "flex items-center justify-center px-3 py-2 rounded-xl border shadow-sm",
                                isUnderBest
                                  ? "bg-gradient-to-r from-emerald-50 to-green-100 border-emerald-200/50 dark:from-emerald-950/30 dark:to-green-900/30 dark:border-emerald-800/50"
                                  : "bg-gradient-to-r from-white/80 to-white/60 border-border/50 dark:from-slate-800/80 dark:to-slate-700/80 dark:border-slate-600",
                              )}
                            >
                              {(yesNo ? (bookOdds as any)?.no : underCandidate || underAny || (bookOdds as any)?.under) ? (
                                <div className="flex items-center gap-1">
                                  {isFootballSport(sport) && !yesNo && (
                                    <span className="text-xs text-muted-foreground">u{(underCandidate?.line ?? underAny?.line ?? Number(item.activeLine)).toFixed(1)}</span>
                                  )}
                                <OddsDisplay 
                                    odds={yesNo ? (bookOdds as any)?.no?.price : (underCandidate?.price ?? underAny?.price ?? (bookOdds as any)?.under?.price)}
                                    link={yesNo ? (bookOdds as any)?.no?.link : (underCandidate?.link ?? underAny?.link ?? (bookOdds as any)?.under?.link)}
                                  className={cn(
                                      "text-sm font-semibold",
                                      isUnderBest ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
                                  )} 
                                />
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground font-medium">—</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      )
                    })}
                    {/* Add Actions cell at the end */}
                    <TableCell className="p-2 py-4">
                      <div className="flex flex-col gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "w-full min-w-[40px] px-2",
                                  "bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-600 hover:from-emerald-500/20 hover:to-green-500/20 hover:text-emerald-700",
                                  "dark:from-emerald-500/20 dark:to-green-500/20 dark:text-emerald-400 dark:hover:from-emerald-500/30 dark:hover:to-green-500/30 dark:hover:text-emerald-300",
                                  "border-emerald-500/30 shadow-sm",
                                  !item.bestOverOdds && "opacity-50 cursor-not-allowed",
                                )}
                                onClick={() => handleAddToBetslip(item, "over")}
                                disabled={!item.bestOverOdds}
                              >
                                <Plus className="w-3 h-3 mr-1" />O
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
                                  "bg-gradient-to-r from-red-500/10 to-pink-500/10 text-red-600 hover:from-red-500/20 hover:to-pink-500/20 hover:text-red-700",
                                  "dark:from-red-500/20 dark:to-pink-500/20 dark:text-red-400 dark:hover:from-red-500/30 dark:hover:to-pink-500/30 dark:hover:text-red-300",
                                  "border-red-500/30 shadow-sm",
                                  !item.bestUnderOdds && "opacity-50 cursor-not-allowed",
                                )}
                                onClick={() => handleAddToBetslip(item, "under")}
                                disabled={!item.bestUnderOdds}
                              >
                                <Plus className="w-3 h-3 mr-1" />U
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
                  </motion.tr>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      <BetslipDialog open={showBetslipDialog} onOpenChange={setShowBetslipDialog} selection={pendingSelection} />

      {/* Conflict Resolution Dialog */}
      <Dialog open={conflictingSelection !== null} onOpenChange={() => handleResolveConflict(false)}>
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
