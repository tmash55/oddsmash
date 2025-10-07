"use client"

import { createHash } from 'crypto'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { sportsbooks } from "@/data/sportsbooks"
import type { Sportsbook as SportsbookType } from "@/data/sportsbooks"
import type { ArbitrageOpportunity } from "@/hooks/use-arbitrage"

// Extended interface for grouped arbitrage opportunities
interface GroupedArbitrageOpportunity
  extends Omit<
    ArbitrageOpportunity,
    | "over_book"
    | "under_book"
    | "over_link"
    | "under_link"
    | "over_sid"
    | "under_sid"
    | "over_mobile_link"
    | "under_mobile_link"
  > {
  over_books: Array<{
    book: string
    link?: string
    sid?: string | null
    mobile_link?: string | null
  }>
  under_books: Array<{
    book: string
    link?: string
    sid?: string | null
    mobile_link?: string | null
  }>
}
import { useMemo, useState, useCallback, memo } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { motion } from "framer-motion"
import {
  TrendingUp,
  Calculator,
  DollarSign,
  Clock,
  ArrowUpDown,
  Zap,
  ExternalLink,
  Hand,
  Smartphone,
  Monitor,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

function formatPct(n: number) {
  return `${(n ?? 0).toFixed(2)}%`
}

function formatDate(date?: string) {
  if (!date) return "TBD"
  try {
    const d = new Date(date)
    return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
  } catch {
    return "TBD"
  }
}

// Robust sportsbook matching similar to EV Table
const normalize = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "")
const SB_BY_ID = new Map<string, SportsbookType>()
const SB_BY_NORM_ID = new Map<string, SportsbookType>()
const SB_BY_NORM_NAME = new Map<string, SportsbookType>()
;(() => {
  sportsbooks.forEach((sb) => {
    SB_BY_ID.set(sb.id, sb as any)
    SB_BY_NORM_ID.set(normalize(sb.id), sb as any)
    SB_BY_NORM_NAME.set(normalize(sb.name), sb as any)
  })
})()

function findBook(book?: string) {
  if (!book) return undefined
  const direct = SB_BY_ID.get(book)
  if (direct) return direct
  const norm = normalize(book)
  return SB_BY_NORM_ID.get(norm) || SB_BY_NORM_NAME.get(norm)
}

function getSportsbookUrlById(bookId?: string): string | undefined {
  const book = findBook(bookId)
  if (!book) return undefined
  // Prefer affiliate link when available
  if (book.affiliate && book.affiliateLink) return book.affiliateLink
  if (!book.url) return undefined
  // Replace optional {state} placeholders with a sensible default if required
  const requiresState = (book as any).requiresState
  return requiresState ? book.url.replace(/\{state\}/g, "nj") : book.url
}

function buildDeepLink(base?: string, sid?: string): string | undefined {
  if (!base) return undefined
  if (!sid) return base
  try {
    const url = new URL(base)
    if (!url.searchParams.get("sid")) {
      url.searchParams.set("sid", sid)
    }
    return url.toString()
  } catch {
    // Fall back to base if invalid URL
    return base
  }
}

function getMobileAppLink(bookId?: string, sid?: string): string | undefined {
  const book = findBook(bookId)
  if (!book?.appLinkTemplate || !sid) return undefined
  try {
    return book.appLinkTemplate.replace(/\{sid\}/g, sid)
  } catch {
    return undefined
  }
}

function formatOdds(odds: number) {
  return odds > 0 ? `+${odds}` : String(odds)
}

function toCurrency(n: number) {
  return `$${n.toFixed(2)}`
}

// Helper function to format market display with line
function formatMarketWithLine(marketKey: string, line: string | number, side: "over" | "under", row?: GroupedArbitrageOpportunity) {
  const market = marketKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  
  // Special handling for Point Spread - use team names with +/- spread
  if (marketKey === "Point Spread" && row) {
    if (side === "over" && row.over_selection) {
      return row.over_selection
    }
    if (side === "under" && row.under_selection) {
      return row.under_selection
    }
  }
  
  // Default formatting for other markets
  const sideText = side === "over" ? "Over" : "Under"
  const lineStr = typeof line === "string" ? line : String(line)
  return `${sideText} ${lineStr} ${market}`
}

// Helper function to clean up description for display
function cleanDescription(description: string, marketKey?: string): string {
  if (!description) return ""

  // Extract the main part before the "—" separator
  const mainPart = description.split("—")[0]?.trim()
  if (!mainPart) return description

  // Special handling for Point Spread - extract game matchup
  if (marketKey === "Point Spread") {
    // For "New Orleans Saints Point Spread 24.5", extract "Saints vs Bills" format
    const spreadMatch = mainPart.match(/^(.+?)\s+Point Spread\s+[\d.]+$/)
    if (spreadMatch) {
      const teamName = spreadMatch[1].trim()
      // Try to shorten team names (e.g., "New Orleans Saints" -> "Saints")
      const shortName = teamName.split(' ').pop() || teamName
      return `${shortName} Spread`
    }
  }

  // Remove "Player" prefix if it exists and clean up spacing
  const cleaned = mainPart
    .replace(/\bPlayer\s+/gi, "") // Remove "Player " (case insensitive)
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()

  return cleaned || description // Fallback to original if cleaning fails
}

// Optimized grouping with memoization and performance tracking
const groupingCache = new Map<string, GroupedArbitrageOpportunity[]>()
const CACHE_TTL = 30000 // 30 seconds

function groupArbitrageOpportunities(data: ArbitrageOpportunity[]): GroupedArbitrageOpportunity[] {
  const startTime = performance.now()
  
  // Create cache key from data hash
  const dataHash = createHash('sha1').update(JSON.stringify(data.map(d => d.event_id + d.market_key + d.line + d.over_odds + d.under_odds))).digest('hex')
  const cacheKey = `${dataHash}-${data.length}`
  
  // Check cache first
  const cached = groupingCache.get(cacheKey)
  if (cached) {
    return cached
  }

  // Optimized grouping algorithm using Map for O(1) lookups
  const groupsMap = new Map<string, GroupedArbitrageOpportunity>()
  const bookSets = new Map<string, { overBooks: Set<string>, underBooks: Set<string> }>()

  data.forEach((item) => {
    // Create a unique key based on event, market, line, and odds (not books)
    const key = `${item.event_id}-${item.market_key}-${item.line}-${item.over_odds}-${item.under_odds}`

    if (groupsMap.has(key)) {
      // Add books to existing group using Sets for O(1) duplicate checking
      const group = groupsMap.get(key)!
      const bookSet = bookSets.get(key)!

      // Check over book
      if (!bookSet.overBooks.has(item.over_book)) {
        bookSet.overBooks.add(item.over_book)
        group.over_books.push({
          book: item.over_book,
          link: item.over_link,
          sid: item.over_sid,
          mobile_link: item.over_mobile_link,
        })
      }

      // Check under book
      if (!bookSet.underBooks.has(item.under_book)) {
        bookSet.underBooks.add(item.under_book)
        group.under_books.push({
          book: item.under_book,
          link: item.under_link,
          sid: item.under_sid,
          mobile_link: item.under_mobile_link,
        })
      }
    } else {
      // Create new group
      const group: GroupedArbitrageOpportunity = {
        ...item,
        over_books: [
          {
            book: item.over_book,
            link: item.over_link,
            sid: item.over_sid,
            mobile_link: item.over_mobile_link,
          },
        ],
        under_books: [
          {
            book: item.under_book,
            link: item.under_link,
            sid: item.under_sid,
            mobile_link: item.under_mobile_link,
          },
        ],
      }
      groupsMap.set(key, group)
      bookSets.set(key, {
        overBooks: new Set([item.over_book]),
        underBooks: new Set([item.under_book])
      })
    }
  })

  const result = Array.from(groupsMap.values())
  
  // Cache the result
  groupingCache.set(cacheKey, result)
  
  // Clean up old cache entries
  setTimeout(() => groupingCache.delete(cacheKey), CACHE_TTL)
  
  const processingTime = performance.now() - startTime
  if (processingTime > 100) {
    console.warn(`[ARBITRAGE] Slow grouping: ${processingTime.toFixed(2)}ms for ${data.length} items`)
  }

  return result
}

interface Props {
  data: ArbitrageOpportunity[]
  mode?: "prematch" | "live"
}

export function ArbitrageTable({ data, mode = "prematch" }: Props) {
  const { toast } = useToast()
  const isMobile = useMediaQuery("(max-width: 1024px)")
  const isTablet = useMediaQuery("(max-width: 1280px)")
  const [stakes, setStakes] = useState<Record<string, { over: number; under: number }>>({})
  const [stakeInputs, setStakeInputs] = useState<Record<string, { over: string; under: string }>>({})

  type SortColumn = "arb" | "event"
  const [sortBy, setSortBy] = useState<SortColumn>("arb")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const WARNING_ARB_THRESHOLD = 10
  
  // Virtual scrolling for large datasets (1000+ opportunities)
  const ITEMS_PER_PAGE = 50
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: ITEMS_PER_PAGE })
  const [isVirtualized, setIsVirtualized] = useState(false)

  const getKey = useCallback(
    (r: GroupedArbitrageOpportunity) => `${r.event_id}-${r.market_key}-${r.line}-${r.over_odds}-${r.under_odds}`,
    [],
  )

  const getStake = useCallback(
    (r: GroupedArbitrageOpportunity) => {
      const key = getKey(r)
      const existing = stakes[key]
      if (existing) return existing

      // Default: anchor higher percentage side at $100 and scale the other proportionally
      const overStakePct = Math.max(0, (r.over_stake_pct ?? 50) / 100)
      const underStakePct = Math.max(0, (r.under_stake_pct ?? 50) / 100)
      const highIsOver = overStakePct >= underStakePct
      const highPct = highIsOver ? overStakePct : underStakePct
      const lowPct = highIsOver ? underStakePct : overStakePct
      const highAmt = 100
      const lowAmt = highPct > 0 ? (lowPct / highPct) * 100 : 0

      return {
        over: Math.round((highIsOver ? highAmt : lowAmt) * 100) / 100,
        under: Math.round((highIsOver ? lowAmt : highAmt) * 100) / 100,
      }
    },
    [stakes, getKey],
  )

  const rows = useMemo(() => {
    // First group the arbitrage opportunities
    const grouped = groupArbitrageOpportunities(data || [])

    // Apply arb% filtering - this is now handled upstream in section component
    // Keep this as a safety fallback with a high default
    const filtered = grouped.filter((r) => {
      const arb = Number(r.arb_percentage) || 0
      return arb <= 50 // High fallback limit, actual filtering done upstream
    })

    // Enable virtualization for large datasets
    if (filtered.length > 200 && !isVirtualized) {
      setIsVirtualized(true)
    } else if (filtered.length <= 200 && isVirtualized) {
      setIsVirtualized(false)
      setVisibleRange({ start: 0, end: ITEMS_PER_PAGE })
    }

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "arb") {
        // Parse arb percentages, handling null/undefined/NaN cases
        const aVal = Number.parseFloat(String(a.arb_percentage || 0))
        const bVal = Number.parseFloat(String(b.arb_percentage || 0))
        const aIsValid = Number.isFinite(aVal)
        const bIsValid = Number.isFinite(bVal)

        // Handle invalid values - put them at the end
        if (!aIsValid && !bIsValid) return 0
        if (!aIsValid) return 1
        if (!bIsValid) return -1

        const result = sortDir === "asc" ? aVal - bVal : bVal - aVal

        // If arb percentages are very close, use start_time as tiebreaker
        if (Math.abs(result) < 0.001) {
          const aTime = Date.parse(a.start_time || "")
          const bTime = Date.parse(b.start_time || "")
          if (Number.isFinite(aTime) && Number.isFinite(bTime)) {
            return aTime - bTime // Earlier games first for tiebreaker
          }
        }
        return result
      }
      // event sort by start_time
      const aTime = Date.parse(a.start_time || "")
      const bTime = Date.parse(b.start_time || "")
      const aHas = Number.isFinite(aTime)
      const bHas = Number.isFinite(bTime)
      if (!aHas && !bHas) return 0
      if (!aHas) return 1
      if (!bHas) return -1
      return sortDir === "asc" ? aTime - bTime : bTime - aTime
    })

    // Apply virtualization if enabled
    if (isVirtualized) {
      return sorted.slice(visibleRange.start, visibleRange.end)
    }
    
    return sorted
  }, [data, sortBy, sortDir, isVirtualized, visibleRange])

  const getStakeInputValues = (r: GroupedArbitrageOpportunity) => {
    const key = getKey(r)
    const existing = stakeInputs[key]
    if (existing) return existing
    const s = getStake(r)
    return { over: s.over.toFixed(2), under: s.under.toFixed(2) }
  }

  const updateStake = (r: GroupedArbitrageOpportunity, which: "over" | "under", value: number) => {
    const key = getKey(r)

    // Get the stake percentages from the API
    const overStakePct = (r.over_stake_pct ?? 50) / 100
    const underStakePct = (r.under_stake_pct ?? 50) / 100

    if (which === "over") {
      const totalBet = value / (overStakePct || 1)
      const underAmount = Math.round(totalBet * underStakePct * 100) / 100

      setStakes((prev) => ({
        ...prev,
        [key]: {
          over: value,
          under: underAmount,
        },
      }))

      setStakeInputs((prev) => ({
        ...prev,
        [key]: {
          over: prev[key]?.over ?? String(value),
          under: underAmount.toFixed(2),
        },
      }))
    } else if (which === "under") {
      const totalBet = value / (underStakePct || 1)
      const overAmount = Math.round(totalBet * overStakePct * 100) / 100

      setStakes((prev) => ({
        ...prev,
        [key]: {
          over: overAmount,
          under: value,
        },
      }))

      setStakeInputs((prev) => ({
        ...prev,
        [key]: {
          over: overAmount.toFixed(2),
          under: prev[key]?.under ?? String(value),
        },
      }))
    }
  }

  const handleStakeChange = (r: GroupedArbitrageOpportunity, which: "over" | "under", str: string) => {
    const key = getKey(r)
    setStakeInputs((prev) => ({
      ...prev,
      [key]: {
        over: which === "over" ? str : (prev[key]?.over ?? getStakeInputValues(r).over),
        under: which === "under" ? str : (prev[key]?.under ?? getStakeInputValues(r).under),
      },
    }))

    const numeric = Number.parseFloat(str)
    if (!Number.isFinite(numeric)) return
    updateStake(r, which, Math.max(0, numeric))
  }

  const handleStakeBlur = (r: GroupedArbitrageOpportunity, which: "over" | "under") => {
    const key = getKey(r)
    const current = stakeInputs[key] ?? getStakeInputValues(r)
    const str = (which === "over" ? current.over : current.under) || "0"
    const numeric = Math.max(0, Number.parseFloat(str) || 0)
    updateStake(r, which, numeric)
    setStakeInputs((prev) => ({
      ...prev,
      [key]: {
        over: (which === "over" ? numeric : (stakes[key]?.over ?? getStake(r).over)).toFixed(2),
        under: (which === "under" ? numeric : (stakes[key]?.under ?? getStake(r).under)).toFixed(2),
      },
    }))
  }

  // Dual bet button for opening both sides simultaneously
  const DualBetButton = memo(function DualBetButton({
    overBooks,
    underBooks,
    isMobile,
  }: {
    overBooks: Array<{ book: string; link?: string; sid?: string | null; mobile_link?: string | null }>
    underBooks: Array<{ book: string; link?: string; sid?: string | null; mobile_link?: string | null }>
    isMobile: boolean
  }) => {
    const handleDualBet = () => {
      // Get the first available link from each side
      const overBook = overBooks[0]
      const underBook = underBooks[0]
      
      if (overBook && underBook) {
        const overHref = isMobile 
          ? overBook.mobile_link || getMobileAppLink(overBook.book, overBook.sid) || buildDeepLink(overBook.link, overBook.sid) || getSportsbookUrlById(overBook.book)
          : buildDeepLink(overBook.link, overBook.sid) || getSportsbookUrlById(overBook.book)
          
        const underHref = isMobile
          ? underBook.mobile_link || getMobileAppLink(underBook.book, underBook.sid) || buildDeepLink(underBook.link, underBook.sid) || getSportsbookUrlById(underBook.book)
          : buildDeepLink(underBook.link, underBook.sid) || getSportsbookUrlById(underBook.book)
        
        if (overHref && underHref) {
          // Open both links in new tabs
          window.open(overHref, '_blank', 'noopener,noreferrer')
          setTimeout(() => {
            window.open(underHref, '_blank', 'noopener,noreferrer')
          }, 100) // Small delay to ensure both tabs open properly
        }
      }
    }

    return (
      <Button
        onClick={handleDualBet}
        className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 shadow-lg"
      >
        Dual Bet
      </Button>
    )
  })

  // Clean sportsbook button for individual sides
  const SportsbookButton = memo(function SportsbookButton({
    bookInfo,
    side,
    odds,
    isMobile,
  }: {
    bookInfo: { book: string; link?: string; sid?: string | null; mobile_link?: string | null }
    side: "over" | "under"
    odds: number
    isMobile: boolean
  }) => {
    const book = findBook(bookInfo.book)
    if (!book) return null

    const appHref = isMobile ? bookInfo.mobile_link || getMobileAppLink(bookInfo.book, bookInfo.sid) : undefined
    const deep = !appHref ? buildDeepLink(bookInfo.link, bookInfo.sid) : undefined
    const href = appHref || deep || getSportsbookUrlById(bookInfo.book)

    if (!href) return null

    return (
      <Button
        asChild
        variant="outline"
        className={cn(
          "flex items-center gap-2 px-3 py-2 h-auto min-w-[100px] transition-all duration-200",
          "border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
          "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800",
          side === "over" ? "hover:bg-emerald-50 dark:hover:bg-emerald-950/20" : "hover:bg-red-50 dark:hover:bg-red-950/20"
        )}
      >
        <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 w-full">
          {book.logo && (
            <Image
              src={book.logo || "/placeholder.svg"}
              alt={book.name}
              width={20}
              height={20}
              className="object-contain rounded flex-shrink-0"
            />
          )}
          <div className="flex flex-col items-start min-w-0 flex-1">
            <span className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{book.name}</span>
            <span className={cn(
              "text-sm font-bold",
              side === "over" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            )}>
              {formatOdds(odds)}
            </span>
          </div>
        </a>
      </Button>
    )
  })

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border bg-gradient-to-br from-white/90 via-gray-50/50 to-gray-100/30 dark:from-gray-950/90 dark:via-gray-900/50 dark:to-gray-800/30 backdrop-blur-sm border-gray-200/80 dark:border-gray-800/80 p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200/80 dark:from-gray-800 dark:to-gray-700/80 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-gray-500 dark:text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Arbitrage Opportunities Found</h3>
            <p className="text-muted-foreground text-sm">
              Try adjusting your filters or check back later for new opportunities.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-gradient-to-br from-white/90 via-gray-50/50 to-gray-100/30 dark:from-gray-950/90 dark:via-gray-900/50 dark:to-gray-800/30 backdrop-blur-sm border-gray-200/80 dark:border-gray-800/80 shadow-xl overflow-hidden">
      {/* Virtualization Info for VC Monitoring */}
      {isVirtualized && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/20 border-b border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
          Virtual scrolling enabled • Showing {visibleRange.start + 1}-{Math.min(visibleRange.end, data.length)} of {data.length} opportunities
        </div>
      )}
      <div className={cn("relative overflow-auto", isMobile ? "max-h-[80vh]" : "max-h-[75vh]", "text-sm")}>
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-gradient-to-r from-white/95 via-gray-50/80 to-gray-100/50 dark:from-gray-950/95 dark:via-gray-900/80 dark:to-gray-800/50 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50">
            <TableRow className="hover:bg-transparent">
              <TableHead
                className={cn("text-center font-semibold text-foreground", isMobile ? "w-[80px]" : "w-[100px]")}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (sortBy === "arb") {
                      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                    } else {
                      setSortBy("arb")
                      setSortDir("desc")
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <TrendingUp className="w-4 h-4" />
                  {!isMobile && "Arb %"}
                  <ArrowUpDown
                    className={cn(
                      "w-3.5 h-3.5 transition-all duration-200",
                      sortBy === "arb" ? "opacity-100" : "opacity-40",
                      sortBy === "arb" && sortDir === "asc" ? "rotate-180" : "",
                    )}
                  />
                </button>
              </TableHead>
              <TableHead className={cn("font-semibold text-foreground", isMobile ? "w-[200px]" : "w-[280px]")}>
                <button
                  type="button"
                  onClick={() => {
                    if (sortBy === "event") {
                      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                    } else {
                      setSortBy("event")
                      setSortDir("asc")
                    }
                  }}
                  className="w-full flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <Clock className="w-4 h-4" />
                  Event
                  <ArrowUpDown
                    className={cn(
                      "w-3.5 h-3.5 transition-all duration-200",
                      sortBy === "event" ? "opacity-100" : "opacity-40",
                      sortBy === "event" && sortDir === "asc" ? "rotate-180" : "",
                    )}
                  />
                </button>
              </TableHead>
              {!isMobile && (
                <TableHead className="w-[220px] font-semibold text-foreground">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4" />
                    Market
                  </div>
                </TableHead>
              )}
              <TableHead className={cn("font-semibold text-foreground", isMobile ? "w-[280px]" : "w-[400px]")}>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Books & Odds
                </div>
              </TableHead>
              {!isMobile && (
                <TableHead className="w-[200px] text-center font-semibold text-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <Calculator className="w-4 h-4" />
                    Bet Size
                  </div>
                </TableHead>
              )}
              <TableHead
                className={cn("text-center font-semibold text-foreground", isMobile ? "w-[120px]" : "w-[140px]")}
              >
                <div className="flex items-center justify-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Profit
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => {
              const stake = getStake(row)
              const inputVals = getStakeInputValues(row)
              const totalStake = stake.over + stake.under
              const profit = (Number(row.arb_percentage) / 100) * totalStake

              return (
                <motion.tr
                  key={getKey(row)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="border-b border-gray-200/50 dark:border-gray-800/50 hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-gray-100/25 dark:hover:from-gray-900/40 dark:hover:to-gray-800/25 transition-all duration-200"
                >
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold px-3 py-2 text-sm shadow-md">
                        +{formatPct(row.arb_percentage)}
                      </Badge>
                      {Number(row.arb_percentage) > WARNING_ARB_THRESHOLD && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toast({
                                    title: "High arbitrage value detected",
                                    description: "Odds might be incorrect or stale. Please verify on the sportsbooks.",
                                  })
                                }}
                                aria-label="High arb values warning"
                                className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-400/15 text-yellow-400 border border-yellow-400/40 ring-1 ring-yellow-400/30 hover:bg-yellow-400/25 transition-colors"
                              >
                                <Hand className="w-3.5 h-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>High arb values, odds might be incorrect.</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {row.description && (
                        <span className="font-semibold text-foreground text-balance">
                          {cleanDescription(row.description, row.market_key)}
                        </span>
                      )}
                      {(row.game || !row.description) && (
                        <span className="text-sm text-muted-foreground">
                          {row.game || cleanDescription(row.description || "", row.market_key)}
                        </span>
                      )}
                      {isMobile && (
                        <Badge
                          variant="outline"
                          className="w-fit text-xs bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 text-primary"
                        >
                          {row.market_key} Line {row.line}
                        </Badge>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{formatDate(row.start_time)}</span>
                      </div>
                    </div>
                  </TableCell>

                  {!isMobile && (
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-foreground">{row.market_key}</span>
                        <Badge
                          variant="outline"
                          className="w-fit text-xs bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 text-primary"
                        >
                          Line {row.line}
                        </Badge>
                      </div>
                    </TableCell>
                  )}

                  <TableCell>
                    <div className="flex flex-col gap-4">
                      <div className="p-3 rounded-lg bg-gradient-to-r from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10 border border-emerald-200/50 dark:border-emerald-800/30">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-foreground text-sm">
                            {formatMarketWithLine(row.market_key, row.line, "over", row)}
                          </span>
                          <Badge
                            variant="secondary"
                            className="font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200"
                          >
                            {formatOdds(row.over_odds)}
                          </Badge>
                        </div>
                        <div className={cn("flex gap-2", isMobile ? "flex-col" : "flex-wrap")}>
                          {row.over_books.map((bookInfo, bookIndex) => (
                            <SportsbookButton 
                              key={`${bookInfo.book}-${bookIndex}`} 
                              bookInfo={bookInfo} 
                              side="over" 
                              isMobile={isMobile}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-gradient-to-r from-red-50/50 to-red-100/30 dark:from-red-950/20 dark:to-red-900/10 border border-red-200/50 dark:border-red-800/30">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-foreground text-sm">
                            {formatMarketWithLine(row.market_key, row.line, "under", row)}
                          </span>
                          <Badge
                            variant="secondary"
                            className="font-bold bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200"
                          >
                            {formatOdds(row.under_odds)}
                          </Badge>
                        </div>
                        <div className={cn("flex gap-2", isMobile ? "flex-col" : "flex-wrap")}>
                          {row.under_books.map((bookInfo, bookIndex) => (
                            <SportsbookButton 
                              key={`${bookInfo.book}-${bookIndex}`} 
                              bookInfo={bookInfo} 
                              side="under" 
                              isMobile={isMobile}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {!isMobile && (
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            className="w-[120px] text-center pl-8 h-10 bg-background/80 backdrop-blur-sm border-border focus:border-primary rounded-lg transition-colors"
                            type="text"
                            inputMode="decimal"
                            value={inputVals.over}
                            onChange={(e) => handleStakeChange(row, "over", e.target.value)}
                            onBlur={() => handleStakeBlur(row, "over")}
                            placeholder="Over"
                          />
                        </div>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            className="w-[120px] text-center pl-8 h-10 bg-background/80 backdrop-blur-sm border-border focus:border-primary rounded-lg transition-colors"
                            type="text"
                            inputMode="decimal"
                            value={inputVals.under}
                            onChange={(e) => handleStakeChange(row, "under", e.target.value)}
                            onBlur={() => handleStakeBlur(row, "under")}
                            placeholder="Under"
                          />
                        </div>
                        <div className="text-xs text-muted-foreground font-medium">Total: ${totalStake.toFixed(2)}</div>
                      </div>
                    </TableCell>
                  )}

                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold px-4 py-2 text-lg shadow-md">
                        {toCurrency(profit)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {((profit / totalStake) * 100).toFixed(1)}% ROI
                      </span>
                      {isMobile && (
                        <div className="text-xs text-muted-foreground font-medium mt-1">
                          Stake: ${totalStake.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                </motion.tr>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
