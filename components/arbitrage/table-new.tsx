"use client"

import { createHash } from 'crypto'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { sportsbooks } from "@/data/sportsbooks"
import type { ArbitrageOpportunity } from "@/hooks/use-arbitrage"
import { useMemo, useState, useCallback, memo } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useArbitragePreferences } from "@/contexts/preferences-context"
import { TrendingUp, ExternalLink, ArrowUpDown, Radio, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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

interface Props {
  data: ArbitrageOpportunity[]
  mode?: "prematch" | "live"
}

// Sportsbook utilities
const SB_BY_NORM_NAME = new Map(
  sportsbooks.map((sb) => [sb.id.toLowerCase().replace(/[^a-z0-9]/g, ""), sb])
)

function findBook(book?: string) {
  if (!book) return undefined
  const norm = book.toLowerCase().replace(/[^a-z0-9]/g, "")
  return SB_BY_NORM_NAME.get(norm)
}

function getSportsbookUrlById(bookId?: string): string | undefined {
  const book = findBook(bookId)
  if (!book) return undefined
  if (book.affiliate && book.affiliateLink) return book.affiliateLink
  if (!book.url) return undefined
  const requiresState = (book as any).requiresState
  return requiresState ? book.url.replace(/\{state\}/g, "nj") : book.url
}

function buildDeepLink(base?: string, sid?: string): string | undefined {
  if (!base) return undefined
  try {
    const url = new URL(base)
    if (sid && !url.searchParams.has('sid')) {
      url.searchParams.set('sid', sid)
    }
    return url.toString()
  } catch {
    return base
  }
}

function getMobileAppLink(bookId?: string, sid?: string): string | undefined {
  try {
    const book = findBook(bookId)
    return book?.links?.mobile || undefined
  } catch {
    return undefined
  }
}

function formatOdds(odds: number) {
  return odds > 0 ? `+${odds}` : String(odds)
}


// Helper function to format market display with line
function formatMarketWithLine(marketKey: string, line: string | number, side: "over" | "under", row?: GroupedArbitrageOpportunity) {
  const market = marketKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  
  // Special handling for Moneyline - use team names instead of over/under
  if (marketKey.toLowerCase().includes("moneyline") && row) {
    if (side === "over" && row.over_selection) {
      return row.over_selection
    }
    if (side === "under" && row.under_selection) {
      return row.under_selection
    }
    
    // Fallback: extract team names from game string
    if (row.game) {
      const teams = row.game.split(" @ ")
      if (teams.length === 2) {
        return side === "over" ? teams[1] : teams[0] // Home team for "over", away team for "under"
      }
    }
  }
  
  // Special handling for Run Line - use team names with +/- spread
  if (marketKey.toLowerCase().includes("run line") && row) {
    if (side === "over" && row.over_selection) {
      return row.over_selection
    }
    if (side === "under" && row.under_selection) {
      return row.under_selection
    }
  }
  
  // Special handling for Point Spread - use team names with +/- spread
  if ((marketKey.toLowerCase().includes("spread") || 
       marketKey.toLowerCase().includes("handicap") ||
       marketKey.toLowerCase().includes("run_line") ||
       marketKey.toLowerCase().includes("puck_line") ||
       marketKey.toLowerCase().includes("goal_line")) && row) {
    if (side === "over" && row.over_selection) {
      return row.over_selection
    }
    if (side === "under" && row.under_selection) {
      return row.under_selection
    }
    
    // Fallback: construct spread display from game and line if selections aren't available
    if (row.game) {
      const teams = row.game.split(" @ ")
      if (teams.length === 2) {
        const awayTeam = teams[0].trim()
        const homeTeam = teams[1].trim()
        const lineNum = typeof line === "string" ? parseFloat(line) : line
        
        if (!isNaN(lineNum)) {
          // Standard spread convention: 
          // - Negative line means favorite (giving points)
          // - Positive line means underdog (getting points)
          // - "over" side typically refers to the team with the spread
          // - "under" side refers to the opposing team
          
          if (side === "over") {
            // Over side: show the line as given (could be + or -)
            const sign = lineNum >= 0 ? "+" : ""
            return `${awayTeam} ${sign}${lineNum}`
          } else {
            // Under side: show the opposite of the line
            const oppositeNum = -lineNum
            const sign = oppositeNum >= 0 ? "+" : ""
            return `${homeTeam} ${sign}${oppositeNum}`
          }
        }
      }
    }
  }
  
  // Default formatting for other markets
  const sideText = side === "over" ? "Over" : "Under"
  const lineStr = typeof line === "string" ? line : String(line)
  return `${sideText} ${lineStr}`
}

// Helper function to clean up description for display
// Helper function to format currency
function toCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Performance-optimized market display with memoization and cleanup
const marketDisplayCache = new Map<string, string>()
const playerNameRegex = /^([A-Za-z\s.]+?)\s+Player\s+/i // Pre-compiled regex for performance
const CACHE_MAX_SIZE = 1000 // Prevent memory leaks

// Cache cleanup function
const cleanupCache = (cache: Map<string, any>, maxSize: number) => {
  if (cache.size > maxSize) {
    const keysToDelete = Array.from(cache.keys()).slice(0, cache.size - maxSize)
    keysToDelete.forEach(key => cache.delete(key))
  }
}

function getMarketDisplayName(marketKey: string, description?: string): string {
  // Create cache key for memoization
  const cacheKey = `${marketKey}:${description || ''}`
  const cached = marketDisplayCache.get(cacheKey)
  if (cached) return cached

  // Convert market keys to readable display names
  const marketMap: Record<string, string> = {
    // Spreads
    "spread": "Spread",
    "1h_spread": "1st Half Spread", 
    "1st_half_spread": "1st Half Spread",
    "2h_spread": "2nd Half Spread",
    "2nd_half_spread": "2nd Half Spread",
    "1q_spread": "1st Quarter Spread",
    "1st_quarter_spread": "1st Quarter Spread",
    "2q_spread": "2nd Quarter Spread", 
    "2nd_quarter_spread": "2nd Quarter Spread",
    "3q_spread": "3rd Quarter Spread",
    "3rd_quarter_spread": "3rd Quarter Spread", 
    "4q_spread": "4th Quarter Spread",
    "4th_quarter_spread": "4th Quarter Spread",
    
    // Totals
    "total": "Total Points",
    "1h_total": "1st Half Total",
    "1st_half_total": "1st Half Total", 
    "2h_total": "2nd Half Total",
    "2nd_half_total": "2nd Half Total",
    "1q_total": "1st Quarter Total",
    "1st_quarter_total": "1st Quarter Total",
    "2q_total": "2nd Quarter Total",
    "2nd_quarter_total": "2nd Quarter Total", 
    "3q_total": "3rd Quarter Total",
    "3rd_quarter_total": "3rd Quarter Total",
    "4q_total": "4th Quarter Total", 
    "4th_quarter_total": "4th Quarter Total",
    
    // Moneylines
    "moneyline": "Moneyline",
    "1h_moneyline": "1st Half Moneyline",
    "1st_half_moneyline": "1st Half Moneyline",
    "2h_moneyline": "2nd Half Moneyline", 
    "2nd_half_moneyline": "2nd Half Moneyline",
    "1q_moneyline": "1st Quarter Moneyline",
    "1st_quarter_moneyline": "1st Quarter Moneyline",
    
    // Player Props
    "Player Passing Attempts": "Passing Attempts",
    "Player Passing Yards": "Passing Yards", 
    "Player Passing Touchdowns": "Passing Touchdowns",
    "Player Rushing Attempts": "Rushing Attempts",
    "Player Rushing Yards": "Rushing Yards",
    "Player Rushing Touchdowns": "Rushing Touchdowns", 
    "Player Receiving Yards": "Receiving Yards",
    "Player Receiving Touchdowns": "Receiving Touchdowns",
    "Player Receptions": "Receptions",
    "Player Tackles": "Tackles",
    "Player Sacks": "Sacks",
    "Player Interceptions": "Interceptions",
    
    // Team Props
    "home_total": "Home Team Total",
    "away_total": "Away Team Total",
    "1st_half_home_team_total_points": "1st Half Home Total",
    "1st_half_away_team_total_points": "1st Half Away Total",
    "total_touchdowns": "Total Touchdowns",
    "total_field_goals": "Total Field Goals",
    "total_turnovers": "Total Turnovers"
  }
  
  let marketName = marketMap[marketKey] || marketKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  
  // Extract player name from description for player props (optimized)
  if (description && (marketKey.toLowerCase().includes('player') || description.toLowerCase().includes('player'))) {
    const playerMatch = description.match(playerNameRegex)
    if (playerMatch) {
      const fullName = playerMatch[1].trim()
      const nameParts = fullName.split(' ')
      if (nameParts.length >= 2) {
        const firstName = nameParts[0]
        const lastName = nameParts[nameParts.length - 1]
        const playerName = `${lastName}, ${firstName.charAt(0)}.`
        
        // Remove "Player" from the market name if it exists
        marketName = marketName.replace(/^Player\s+/i, '')
        
        const result = `${marketName} - ${playerName}`
        marketDisplayCache.set(cacheKey, result)
        cleanupCache(marketDisplayCache, CACHE_MAX_SIZE)
        return result
      }
    }
  }
  
  marketDisplayCache.set(cacheKey, marketName)
  cleanupCache(marketDisplayCache, CACHE_MAX_SIZE)
  return marketName
}

function cleanDescription(description: string, marketKey?: string): string {
  if (!description) return ""
  
  // Remove everything after " — " (including the dash) to remove sportsbook details
  let cleaned = description.split(" — ")[0] || description
  
  // Special handling for moneyline markets
  if (marketKey && marketKey.toLowerCase().includes("moneyline")) {
    // For moneyline, just return "Moneyline" instead of the full description
    return "Moneyline"
  }
  
  cleaned = cleaned
    .replace(/\s+/g, " ")
    .replace(/^\s*-\s*/, "")
    .replace(/\s*-\s*$/, "")
    .replace(/^(Over|Under)\s+/i, "")
    .replace(/\s+(Over|Under)$/i, "")
    .replace(/\b(Total|Points?|Yards?)\b/gi, "")
    .replace(/\b(ML|Moneyline)\s+None\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()

  return cleaned || description
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

  // Post-processing: Sort books within each group for consistent display
  const result = Array.from(groupsMap.values()).map(group => ({
    ...group,
    over_books: group.over_books.sort((a, b) => a.book.localeCompare(b.book)),
    under_books: group.under_books.sort((a, b) => a.book.localeCompare(b.book))
  }))
  
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

// Sportsbook selection modal state
interface SportsbookSelectionState {
  isOpen: boolean
  overBooks: Array<{ book: string; link?: string; sid?: string | null; mobile_link?: string | null }>
  underBooks: Array<{ book: string; link?: string; sid?: string | null; mobile_link?: string | null }>
  selectedOverBook: number
  selectedUnderBook: number
  marketInfo: {
    market: string
    line: string | number
    overOdds: number
    underOdds: number
  }
}

// Individual bet selection modal state
interface IndividualBetSelectionState {
  isOpen: boolean
  books: Array<{ book: string; link?: string; sid?: string | null; mobile_link?: string | null }>
  selectedBook: number
  side: 'over' | 'under'
  marketInfo: {
    market: string
    line: string | number
    odds: number
  }
}

export function ArbitrageTableNew({ data, mode = "prematch" }: Props) {
  const isMobile = useMediaQuery("(max-width: 1024px)")
  const [sortBy, setSortBy] = useState<"arb" | "event" | "time">("arb")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [customWagers, setCustomWagers] = useState<Record<string, { over: string; under: string }>>({})
  const [sportsbookSelection, setSportsbookSelection] = useState<SportsbookSelectionState>({
    isOpen: false,
    overBooks: [],
    underBooks: [],
    selectedOverBook: 0,
    selectedUnderBook: 0,
    marketInfo: { market: '', line: '', overOdds: 0, underOdds: 0 }
  })
  const [individualBetSelection, setIndividualBetSelection] = useState<IndividualBetSelectionState>({
    isOpen: false,
    books: [],
    selectedBook: 0,
    side: 'over',
    marketInfo: { market: '', line: '', odds: 0 }
  })
  const { filters } = useArbitragePreferences()

  const WARNING_ARB_THRESHOLD = 10

  const getKey = useCallback(
    (r: GroupedArbitrageOpportunity) => `${r.event_id}-${r.market_key}-${r.line}-${r.over_odds}-${r.under_odds}`,
    [],
  )

  // Helper function to open sportsbook selection modal
  const openSportsbookSelection = useCallback((row: GroupedArbitrageOpportunity) => {
    setSportsbookSelection({
      isOpen: true,
      overBooks: row.over_books,
      underBooks: row.under_books,
      selectedOverBook: 0,
      selectedUnderBook: 0,
      marketInfo: {
        market: row.market_key,
        line: row.line,
        overOdds: row.over_odds,
        underOdds: row.under_odds
      }
    })
  }, [])

  // Helper function to execute dual bet with selected sportsbooks
  const executeDualBet = useCallback(() => {
    const { overBooks, underBooks, selectedOverBook, selectedUnderBook } = sportsbookSelection
    const overBook = overBooks[selectedOverBook]
    const underBook = underBooks[selectedUnderBook]
    
    if (overBook && underBook) {
      const getBestLink = (bookInfo: { book: string; link?: string; sid?: string | null; mobile_link?: string | null }) => {
        if (isMobile) {
          return bookInfo.mobile_link || 
                 getMobileAppLink(bookInfo.book, bookInfo.sid) || 
                 buildDeepLink(bookInfo.link, bookInfo.sid) || 
                 bookInfo.link ||
                 getSportsbookUrlById(bookInfo.book)
        } else {
          return buildDeepLink(bookInfo.link, bookInfo.sid) || 
                 bookInfo.link ||
                 getSportsbookUrlById(bookInfo.book)
        }
      }
      
      const overHref = getBestLink(overBook)
      const underHref = getBestLink(underBook)
      
      if (overHref && underHref) {
        window.open(overHref, '_blank', 'noopener,noreferrer,width=1200,height=800,scrollbars=yes,resizable=yes')
        setTimeout(() => {
          window.open(underHref, '_blank', 'noopener,noreferrer,width=1200,height=800,scrollbars=yes,resizable=yes')
        }, 100)
      }
    }
    
    // Close modal
    setSportsbookSelection(prev => ({ ...prev, isOpen: false }))
  }, [sportsbookSelection, isMobile])

  // Helper function to open individual bet selection modal
  const openIndividualBetSelection = useCallback((
    books: Array<{ book: string; link?: string; sid?: string | null; mobile_link?: string | null }>,
    side: 'over' | 'under',
    market: string,
    line: string | number,
    odds: number
  ) => {
    setIndividualBetSelection({
      isOpen: true,
      books,
      selectedBook: 0,
      side,
      marketInfo: { market, line, odds }
    })
  }, [])

  // Helper function to execute individual bet with selected sportsbook
  const executeIndividualBet = useCallback(() => {
    const { books, selectedBook } = individualBetSelection
    const book = books[selectedBook]
    
    if (book) {
      const getBestLink = (bookInfo: { book: string; link?: string; sid?: string | null; mobile_link?: string | null }) => {
        if (isMobile) {
          return bookInfo.mobile_link || 
                 getMobileAppLink(bookInfo.book, bookInfo.sid) || 
                 buildDeepLink(bookInfo.link, bookInfo.sid) || 
                 bookInfo.link ||
                 getSportsbookUrlById(bookInfo.book)
        } else {
          return buildDeepLink(bookInfo.link, bookInfo.sid) || 
                 bookInfo.link ||
                 getSportsbookUrlById(bookInfo.book)
        }
      }
      
      const href = getBestLink(book)
      
      if (href) {
        window.open(href, '_blank', 'noopener,noreferrer,width=1200,height=800,scrollbars=yes,resizable=yes')
      }
    }
    
    // Close modal
    setIndividualBetSelection(prev => ({ ...prev, isOpen: false }))
  }, [individualBetSelection, isMobile])

  // Calculate payout from odds and wager
  const calculatePayout = useCallback((odds: number, wager: number) => {
    if (odds > 0) {
      return wager + (wager * odds / 100)
    } else {
      return wager + (wager * 100 / Math.abs(odds))
    }
  }, [])

  // Calculate profit from both sides
  const calculateProfit = useCallback((overOdds: number, underOdds: number, overWager: number, underWager: number) => {
    const overPayout = calculatePayout(overOdds, overWager)
    const underPayout = calculatePayout(underOdds, underWager)
    const totalWager = overWager + underWager
    
    // Return the guaranteed profit (minimum payout minus total wager)
    return Math.min(overPayout, underPayout) - totalWager
  }, [calculatePayout])

  // Memoized stake calculations for performance
  const stakeCache = useMemo(() => new Map<string, { over: number; under: number; profit: number; overPayout: number; underPayout: number }>(), [])
  
  const getStake = useCallback(
    (r: GroupedArbitrageOpportunity) => {
      const key = getKey(r)
      const customWager = customWagers[key]
      const totalBetAmount = filters?.totalBetAmount || 200

      // Create cache key including custom wagers and total bet amount
      const cacheKey = `${key}:${JSON.stringify(customWager)}:${totalBetAmount}`
      const cached = stakeCache.get(cacheKey)
      if (cached) return cached

      let result: { over: number; under: number; profit: number; overPayout: number; underPayout: number }
      
      // If user has custom wagers, use those
      if (customWager) {
        const overWager = parseFloat(customWager.over) || 0
        const underWager = parseFloat(customWager.under) || 0
        const profit = calculateProfit(r.over_odds, r.under_odds, overWager, underWager)
        
        result = {
          over: overWager,
          under: underWager,
          profit: profit,
          overPayout: calculatePayout(r.over_odds, overWager),
          underPayout: calculatePayout(r.under_odds, underWager)
        }
      } else {
        // Default calculation using total bet amount from preferences
        const overOdds = r.over_odds
        const underOdds = r.under_odds
        const arbPercentage = Number(r.arb_percentage) || 0

        if (arbPercentage <= 0) {
          result = { over: 100, under: 100, profit: 0, overPayout: 0, underPayout: 0 }
        } else {
          // Convert to decimal odds for calculation
          const overDecimal = overOdds > 0 ? (overOdds / 100) + 1 : (100 / Math.abs(overOdds)) + 1
          const underDecimal = underOdds > 0 ? (underOdds / 100) + 1 : (100 / Math.abs(underOdds)) + 1
          
          // Calculate optimal distribution of total bet amount for equal profit
          const overStake = (totalBetAmount * underDecimal) / (overDecimal + underDecimal)
          const underStake = totalBetAmount - overStake
          
          const overPayout = calculatePayout(overOdds, overStake)
          const underPayout = calculatePayout(underOdds, underStake)
          const profit = Math.min(overPayout, underPayout) - totalBetAmount
          
          result = {
            over: overStake,
            under: underStake,
            profit: profit,
            overPayout: overPayout,
            underPayout: underPayout
          }
        }
      }

      // Cache the result with cleanup
      stakeCache.set(cacheKey, result)
      cleanupCache(stakeCache, CACHE_MAX_SIZE)
      return result
    },
    [customWagers, getKey, calculateProfit, calculatePayout, filters, stakeCache],
  )

  // Calculate optimal opposite wager for true arbitrage (equal profit regardless of outcome)
  const calculateOptimalWager = useCallback((inputWager: number, inputOdds: number, oppositeOdds: number) => {
    // Convert American odds to decimal odds for easier calculation
    const inputDecimal = inputOdds > 0 ? (inputOdds / 100) + 1 : (100 / Math.abs(inputOdds)) + 1
    const oppositeDecimal = oppositeOdds > 0 ? (oppositeOdds / 100) + 1 : (100 / Math.abs(oppositeOdds)) + 1
    
    // For true arbitrage, we want equal profit regardless of outcome
    // Let P = profit, W1 = input wager, W2 = opposite wager
    // If input side wins: P = W1 * inputDecimal - (W1 + W2) = W1 * inputDecimal - W1 - W2
    // If opposite side wins: P = W2 * oppositeDecimal - (W1 + W2) = W2 * oppositeDecimal - W1 - W2
    // Setting these equal: W1 * inputDecimal - W1 - W2 = W2 * oppositeDecimal - W1 - W2
    // Simplifying: W1 * inputDecimal - W1 = W2 * oppositeDecimal - W1
    // W1 * inputDecimal = W2 * oppositeDecimal
    // W2 = (W1 * inputDecimal) / oppositeDecimal
    
    const oppositeWager = (inputWager * inputDecimal) / oppositeDecimal
    
    return Math.round(oppositeWager * 100) / 100 // Round to 2 decimal places
  }, [])

  // Handle wager input changes with auto-calculation
  const handleWagerChange = useCallback((key: string, side: 'over' | 'under', value: string, row: GroupedArbitrageOpportunity) => {
    const inputWager = parseFloat(value) || 0
    
    if (inputWager > 0) {
      // Calculate the optimal opposite wager
      const oppositeWager = side === 'over' 
        ? calculateOptimalWager(inputWager, row.over_odds, row.under_odds)
        : calculateOptimalWager(inputWager, row.under_odds, row.over_odds)
      
      setCustomWagers(prev => ({
        ...prev,
        [key]: {
          over: side === 'over' ? value : oppositeWager.toString(),
          under: side === 'under' ? value : oppositeWager.toString()
        }
      }))
    } else {
      // If input is cleared, clear both sides
      setCustomWagers(prev => ({
        ...prev,
        [key]: {
          over: side === 'over' ? value : '',
          under: side === 'under' ? value : ''
        }
      }))
    }
  }, [calculateOptimalWager])

  // Individual bet button for each side
  const BetButton = memo(function BetButton({
    bookInfo,
    side,
    isMobile,
  }: {
    bookInfo: { book: string; link?: string; sid?: string | null; mobile_link?: string | null }
    side: "over" | "under"
    isMobile: boolean
  }) {
    const book = findBook(bookInfo.book)
    if (!book) return null

    const handleBet = () => {
      let href: string | null = null
      
      if (isMobile) {
        // Mobile priority: mobile_link -> mobile app link -> desktop link -> base URL
        href = bookInfo.mobile_link || 
               getMobileAppLink(bookInfo.book, bookInfo.sid) || 
               buildDeepLink(bookInfo.link, bookInfo.sid) || 
               bookInfo.link ||
               getSportsbookUrlById(bookInfo.book)
      } else {
        // Desktop priority: desktop link -> base URL (skip mobile app links on desktop)
        href = buildDeepLink(bookInfo.link, bookInfo.sid) || 
               bookInfo.link ||
               getSportsbookUrlById(bookInfo.book)
      }
      
      if (href) {
        window.open(href, '_blank', 'noopener,noreferrer')
      }
    }

    return (
      <Button
        onClick={handleBet}
        size="sm"
        className="h-8 w-8 p-0 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 transition-colors duration-150"
      >
        <ExternalLink className="h-4 w-4" />
      </Button>
    )
  })

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
    const getBestLink = (bookInfo: { book: string; link?: string; sid?: string | null; mobile_link?: string | null }) => {
      if (isMobile) {
        // Mobile priority: mobile_link -> mobile app link -> desktop link -> base URL
        return bookInfo.mobile_link || 
               getMobileAppLink(bookInfo.book, bookInfo.sid) || 
               buildDeepLink(bookInfo.link, bookInfo.sid) || 
               bookInfo.link ||
               getSportsbookUrlById(bookInfo.book)
      } else {
        // Desktop priority: desktop link -> base URL (skip mobile app links on desktop)
        return buildDeepLink(bookInfo.link, bookInfo.sid) || 
               bookInfo.link ||
               getSportsbookUrlById(bookInfo.book)
      }
    }

    const handleDualBet = () => {
      // Get the first available link from each side
      const overBook = overBooks[0]
      const underBook = underBooks[0]
      
      if (overBook && underBook) {
        const overHref = getBestLink(overBook)
        const underHref = getBestLink(underBook)
        
         if (overHref && underHref) {
           // Open both links in new windows
           window.open(overHref, '_blank', 'noopener,noreferrer,width=1200,height=800,scrollbars=yes,resizable=yes')
           setTimeout(() => {
             window.open(underHref, '_blank', 'noopener,noreferrer,width=1200,height=800,scrollbars=yes,resizable=yes')
           }, 100) // Small delay to ensure both windows open properly
         }
      }
    }

    return (
      <Button
        onClick={handleDualBet}
        className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium px-4 py-6 rounded-lg transition-all duration-200 hover:scale-105 shadow-lg h-full"
      >
        Dual Bet
      </Button>
    )
  })

  const rows = useMemo(() => {
    // First group the arbitrage opportunities
    const grouped = groupArbitrageOpportunities(data || [])

    // Only apply the arb% cap here; rely on upstream (section) for mode/time filtering
    const filtered = grouped.filter((r) => {
      const arb = Number(r.arb_percentage) || 0
      return arb <= 50 // High fallback limit, actual filtering done upstream
    })

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
      
      if (sortBy === "time") {
        // time sort by start_time
        const aTime = Date.parse(a.start_time || "")
        const bTime = Date.parse(b.start_time || "")
        const aHas = Number.isFinite(aTime)
        const bHas = Number.isFinite(bTime)
        if (!aHas && !bHas) return 0
        if (!aHas) return 1
        if (!bHas) return -1
        return sortDir === "asc" ? aTime - bTime : bTime - aTime
      }
      
      // event sort by game name
      const aGame = (a.game || "").toLowerCase()
      const bGame = (b.game || "").toLowerCase()
      if (aGame === bGame) {
        // If game names are the same, use start_time as tiebreaker
        const aTime = Date.parse(a.start_time || "")
        const bTime = Date.parse(b.start_time || "")
        if (Number.isFinite(aTime) && Number.isFinite(bTime)) {
          return aTime - bTime
        }
        return 0
      }
      return sortDir === "asc" ? aGame.localeCompare(bGame) : bGame.localeCompare(aGame)
    })
    
    return sorted
  }, [data, sortBy, sortDir])

  if (rows.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900/90 rounded-lg border border-gray-200 dark:border-slate-600 p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-700/60 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-gray-500 dark:text-slate-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">No Arbitrage Opportunities Found</h3>
            <p className="text-gray-600 dark:text-slate-300 text-sm">
              Try adjusting your filters or check back later for new opportunities.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="bg-white dark:bg-slate-900/90 rounded-lg border border-gray-200 dark:border-slate-600 overflow-hidden shadow-lg dark:shadow-xl">
        <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-gray-200 dark:border-slate-600">
            <TableHead className="font-semibold text-gray-900 dark:text-slate-100">
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
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                ROI %
                <ArrowUpDown
                  className={cn(
                    "w-4 h-4 transition-all duration-200",
                    sortBy === "arb" ? "opacity-100" : "opacity-40",
                    sortBy === "arb" && sortDir === "asc" ? "rotate-180" : "",
                  )}
                />
              </button>
            </TableHead>
            <TableHead className="font-semibold text-gray-900 dark:text-gray-100 text-center">
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
                className="flex items-center gap-2 hover:opacity-80 transition-opacity mx-auto"
              >
                Game
                <ArrowUpDown
                  className={cn(
                    "w-4 h-4 transition-all duration-200",
                    sortBy === "event" ? "opacity-100" : "opacity-40",
                    sortBy === "event" && sortDir === "asc" ? "rotate-180" : "",
                  )}
                />
              </button>
            </TableHead>
             <TableHead className="font-semibold text-gray-900 dark:text-gray-100 text-center">
               <button
                 type="button"
                 onClick={() => {
                   if (sortBy === "time") {
                     setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                   } else {
                     setSortBy("time")
                     setSortDir("asc")
                   }
                 }}
                 className="flex items-center gap-2 hover:opacity-80 transition-opacity mx-auto"
               >
                 Time
                 <ArrowUpDown
                   className={cn(
                     "w-4 h-4 transition-all duration-200",
                     sortBy === "time" ? "opacity-100" : "opacity-40",
                     sortBy === "time" && sortDir === "asc" ? "rotate-180" : "",
                   )}
                 />
               </button>
             </TableHead>
            <TableHead className="font-semibold text-gray-900 dark:text-slate-100 text-center">Market</TableHead>
            <TableHead className="font-semibold text-gray-900 dark:text-slate-100 text-center">Bet Size</TableHead>
            <TableHead className="font-semibold text-gray-900 dark:text-slate-100 text-center">Profit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => {
            const stake = getStake(row)
            const key = getKey(row)
            const arbPercentage = Number.parseFloat(String(row.arb_percentage || 0))
            const isHighArb = arbPercentage >= WARNING_ARB_THRESHOLD

            return (
              <>
                {/* Market Header Row */}
                <TableRow
                  key={`${key}-header`}
                  className="bg-gray-100 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-600"
                >
                  <TableCell rowSpan={3} className="text-center border-r border-gray-200 dark:border-slate-600">
                    <Badge
                      className={cn(
                        "font-bold text-lg px-3 py-2",
                        isHighArb
                          ? "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200"
                          : "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200",
                      )}
                    >
                      {arbPercentage.toFixed(2)}%
                    </Badge>
                  </TableCell>
                  <TableCell rowSpan={3} className="border-r border-gray-200 dark:border-slate-600">
                    <div className="space-y-1">
                      <div className="font-semibold text-lg text-gray-900 dark:text-slate-100">
                        {cleanDescription(row.description || "", row.market_key)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-slate-300">
                        {row.game || "Unknown Game"}
                      </div>
                    </div>
                  </TableCell>
                   <TableCell rowSpan={3} className="border-r border-gray-200 dark:border-slate-600 text-center">
                     <div className="text-sm text-gray-600 dark:text-slate-300">
                      {row.is_live ? (
                        <div className="flex items-center justify-center">
                          <div className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
                            <Radio className="h-3 w-3 animate-pulse" />
                            <span className="text-xs font-medium">LIVE</span>
                          </div>
                        </div>
                      ) : row.start_time ? (
                        <>
                          <div>{new Date(row.start_time).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            {new Date(row.start_time).toLocaleTimeString([], { 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            })}
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-gray-500">TBD</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell 
                    colSpan={1} 
                    className="text-center font-semibold text-gray-700 dark:text-gray-300 py-2 border-r border-gray-200 dark:border-gray-700 relative"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <span>{getMarketDisplayName(row.market_key, row.description)}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => {
                              // Check if there are multiple sportsbooks on either side
                              const hasMultipleOptions = row.over_books.length > 1 || row.under_books.length > 1
                              
                              if (hasMultipleOptions) {
                                // Open sportsbook selection modal
                                openSportsbookSelection(row)
                              } else {
                                // Direct dual bet with single options
                                const overBook = row.over_books[0]
                                const underBook = row.under_books[0]
                                
                                if (overBook && underBook) {
                                  const getBestLink = (bookInfo: { book: string; link?: string; sid?: string | null; mobile_link?: string | null }) => {
                                    if (isMobile) {
                                      return bookInfo.mobile_link || 
                                             getMobileAppLink(bookInfo.book, bookInfo.sid) || 
                                             buildDeepLink(bookInfo.link, bookInfo.sid) || 
                                             bookInfo.link ||
                                             getSportsbookUrlById(bookInfo.book)
                                    } else {
                                      return buildDeepLink(bookInfo.link, bookInfo.sid) || 
                                             bookInfo.link ||
                                             getSportsbookUrlById(bookInfo.book)
                                    }
                                  }
                                  
                                  const overHref = getBestLink(overBook)
                                  const underHref = getBestLink(underBook)
                                  
                                  if (overHref && underHref) {
                                    window.open(overHref, '_blank', 'noopener,noreferrer,width=1200,height=800,scrollbars=yes,resizable=yes')
                                    setTimeout(() => {
                                      window.open(underHref, '_blank', 'noopener,noreferrer,width=1200,height=800,scrollbars=yes,resizable=yes')
                                    }, 100)
                                  }
                                }
                              }
                            }}
                            size="sm"
                            className="h-8 w-8 p-0 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                          >
                            <Zap className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Place dual bet on both sportsbooks</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                   <TableCell rowSpan={3} className="text-center border-r border-gray-200 dark:border-gray-700 p-4">
                     <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 space-y-3 border border-gray-200 dark:border-gray-700 shadow-sm">
                       <div className="space-y-2">
                         <div className="flex items-center justify-between">
                           <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Over Bet</span>
                           <div className="flex items-center gap-1">
                             <span className="text-xs text-gray-500">$</span>
                             <Input
                               type="number"
                               placeholder={stake.over.toFixed(0)}
                               value={customWagers[key]?.over || ''}
                               onChange={(e) => handleWagerChange(key, 'over', e.target.value, row)}
                               className="h-8 w-20 text-sm font-medium bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 rounded-lg text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                             />
                           </div>
                         </div>
                         <div className="flex items-center justify-between">
                           <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Under Bet</span>
                           <div className="flex items-center gap-1">
                             <span className="text-xs text-gray-500">$</span>
                             <Input
                               type="number"
                               placeholder={stake.under.toFixed(0)}
                               value={customWagers[key]?.under || ''}
                               onChange={(e) => handleWagerChange(key, 'under', e.target.value, row)}
                               className="h-8 w-20 text-sm font-medium bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 rounded-lg text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                             />
                           </div>
                         </div>
                       </div>
                       <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                         <div className="flex items-center justify-between">
                           <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Total</span>
                           <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                             {toCurrency((parseFloat(customWagers[key]?.over || '0') || stake.over) + (parseFloat(customWagers[key]?.under || '0') || stake.under))}
                           </span>
                         </div>
                       </div>
                     </div>
                   </TableCell>
                  <TableCell rowSpan={3} className="text-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {toCurrency(stake.profit)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {arbPercentage.toFixed(2)}% ROI
                      </div>
                    </div>
                  </TableCell>
                </TableRow>

                {/* Over row */}
                <TableRow
                  key={`${key}-over`}
                  className={cn(
                    "hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors duration-150 border-b-0",
                    isHighArb && "bg-amber-50/30 dark:bg-amber-900/20"
                  )}
                >
                  <TableCell className="border-r border-gray-200 dark:border-slate-600">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/40 rounded-lg transition-colors duration-150">
                      <div className="flex items-center gap-3">
                        {row.over_books[0] && findBook(row.over_books[0].book)?.logo && (
                          <Image
                            src={findBook(row.over_books[0].book)?.logo || "/placeholder.svg"}
                            alt={findBook(row.over_books[0].book)?.name || ""}
                            width={24}
                            height={24}
                            className="object-contain rounded"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                            {formatMarketWithLine(row.market_key, row.line, "over", row)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {row.over_books.length === 1 
                              ? (findBook(row.over_books[0]?.book)?.name || row.over_books[0]?.book)
                              : (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-help underline decoration-dotted">
                                      {findBook(row.over_books[0]?.book)?.name || row.over_books[0]?.book} +{row.over_books.length - 1} more
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="text-sm">
                                      <div className="font-medium mb-1">All available sportsbooks:</div>
                                      {row.over_books.map((book, idx) => (
                                        <div key={idx}>{findBook(book.book)?.name || book.book}</div>
                                      ))}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              )
                            }
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {formatOdds(row.over_odds)}
                        </div>
                        {row.over_books.length === 1 ? (
                          <BetButton
                            bookInfo={row.over_books[0]}
                            side="over"
                            isMobile={isMobile}
                          />
                        ) : (
                          <Button
                            onClick={() => openIndividualBetSelection(
                              row.over_books,
                              'over',
                              row.market_key,
                              row.line,
                              row.over_odds
                            )}
                            size="sm"
                            className="bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white px-3 py-2 rounded-md transition-all duration-200 shadow-md hover:shadow-lg border-2 border-emerald-300"
                            title={`Choose from ${row.over_books.length} sportsbooks`}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>

                {/* Under row */}
                <TableRow
                  key={`${key}-under`}
                  className={cn(
                    "hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors duration-150 border-b border-gray-200 dark:border-slate-600",
                    isHighArb && "bg-amber-50/30 dark:bg-amber-900/20"
                  )}
                >
                  <TableCell className="border-r border-gray-200 dark:border-slate-600">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/40 rounded-lg transition-colors duration-150">
                      <div className="flex items-center gap-3">
                        {row.under_books[0] && findBook(row.under_books[0].book)?.logo && (
                          <Image
                            src={findBook(row.under_books[0].book)?.logo || "/placeholder.svg"}
                            alt={findBook(row.under_books[0].book)?.name || ""}
                            width={24}
                            height={24}
                            className="object-contain rounded"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-red-600 dark:text-red-400">
                            {formatMarketWithLine(row.market_key, row.line, "under", row)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {row.under_books.length === 1 
                              ? (findBook(row.under_books[0]?.book)?.name || row.under_books[0]?.book)
                              : (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-help underline decoration-dotted">
                                      {findBook(row.under_books[0]?.book)?.name || row.under_books[0]?.book} +{row.under_books.length - 1} more
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="text-sm">
                                      <div className="font-medium mb-1">All available sportsbooks:</div>
                                      {row.under_books.map((book, idx) => (
                                        <div key={idx}>{findBook(book.book)?.name || book.book}</div>
                                      ))}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              )
                            }
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-lg font-bold text-red-600 dark:text-red-400">
                          {formatOdds(row.under_odds)}
                        </div>
                        {row.under_books.length === 1 ? (
                          <BetButton
                            bookInfo={row.under_books[0]}
                            side="under"
                            isMobile={isMobile}
                          />
                        ) : (
                          <Button
                            onClick={() => openIndividualBetSelection(
                              row.under_books,
                              'under',
                              row.market_key,
                              row.line,
                              row.under_odds
                            )}
                            size="sm"
                            className="bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white px-3 py-2 rounded-md transition-all duration-200 shadow-md hover:shadow-lg border-2 border-red-300"
                            title={`Choose from ${row.under_books.length} sportsbooks`}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              </>
            )
          })}
        </TableBody>
        </Table>
      </div>

      {/* Sportsbook Selection Modal */}
      <Dialog open={sportsbookSelection.isOpen} onOpenChange={(open) => setSportsbookSelection(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Sportsbooks for Dual Bet</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Market Info */}
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="font-medium text-lg">{getMarketDisplayName(sportsbookSelection.marketInfo.market)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Line: {sportsbookSelection.marketInfo.line}
              </div>
            </div>

            {/* Over Side Selection */}
            <div className="space-y-3">
              <div className="font-medium text-emerald-600 dark:text-emerald-400">
                Over Side ({formatOdds(sportsbookSelection.marketInfo.overOdds)})
              </div>
              <div className="space-y-2">
                {sportsbookSelection.overBooks.map((book, index) => (
                  <label key={index} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                    <input
                      type="radio"
                      name="overBook"
                      value={index}
                      checked={sportsbookSelection.selectedOverBook === index}
                      onChange={() => setSportsbookSelection(prev => ({ ...prev, selectedOverBook: index }))}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex items-center gap-3">
                      {findBook(book.book)?.logo && (
                        <Image
                          src={findBook(book.book)?.logo || "/placeholder.svg"}
                          alt={findBook(book.book)?.name || ""}
                          width={24}
                          height={24}
                          className="object-contain rounded"
                        />
                      )}
                      <span className="font-medium">{findBook(book.book)?.name || book.book}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Under Side Selection */}
            <div className="space-y-3">
              <div className="font-medium text-red-600 dark:text-red-400">
                Under Side ({formatOdds(sportsbookSelection.marketInfo.underOdds)})
              </div>
              <div className="space-y-2">
                {sportsbookSelection.underBooks.map((book, index) => (
                  <label key={index} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                    <input
                      type="radio"
                      name="underBook"
                      value={index}
                      checked={sportsbookSelection.selectedUnderBook === index}
                      onChange={() => setSportsbookSelection(prev => ({ ...prev, selectedUnderBook: index }))}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <div className="flex items-center gap-3">
                      {findBook(book.book)?.logo && (
                        <Image
                          src={findBook(book.book)?.logo || "/placeholder.svg"}
                          alt={findBook(book.book)?.name || ""}
                          width={24}
                          height={24}
                          className="object-contain rounded"
                        />
                      )}
                      <span className="font-medium">{findBook(book.book)?.name || book.book}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setSportsbookSelection(prev => ({ ...prev, isOpen: false }))}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={executeDualBet}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
              >
                <Zap className="h-4 w-4 mr-2" />
                Place Dual Bet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Individual Bet Selection Modal */}
      <Dialog open={individualBetSelection.isOpen} onOpenChange={(open) => setIndividualBetSelection(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Sportsbook</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Market Info */}
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="font-medium text-lg">{getMarketDisplayName(individualBetSelection.marketInfo.market)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Line: {individualBetSelection.marketInfo.line} • {formatOdds(individualBetSelection.marketInfo.odds)}
              </div>
              <div className={`text-sm font-medium ${individualBetSelection.side === 'over' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {individualBetSelection.side === 'over' ? 'Over Side' : 'Under Side'}
              </div>
            </div>

            {/* Sportsbook Selection */}
            <div className="space-y-3">
              <div className="font-medium text-gray-900 dark:text-gray-100">
                Available Sportsbooks ({individualBetSelection.books.length})
              </div>
              <div className="space-y-2">
                {individualBetSelection.books.map((book, index) => (
                  <label key={index} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                    <input
                      type="radio"
                      name="individualBook"
                      value={index}
                      checked={individualBetSelection.selectedBook === index}
                      onChange={() => setIndividualBetSelection(prev => ({ ...prev, selectedBook: index }))}
                      className={`${individualBetSelection.side === 'over' ? 'text-emerald-600 focus:ring-emerald-500' : 'text-red-600 focus:ring-red-500'}`}
                    />
                    <div className="flex items-center gap-3">
                      {findBook(book.book)?.logo && (
                        <Image
                          src={findBook(book.book)?.logo || "/placeholder.svg"}
                          alt={findBook(book.book)?.name || ""}
                          width={24}
                          height={24}
                          className="object-contain rounded"
                        />
                      )}
                      <span className="font-medium">{findBook(book.book)?.name || book.book}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIndividualBetSelection(prev => ({ ...prev, isOpen: false }))}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={executeIndividualBet}
                className={`flex-1 ${individualBetSelection.side === 'over' 
                  ? 'bg-emerald-600 hover:bg-emerald-700' 
                  : 'bg-red-600 hover:bg-red-700'
                } text-white`}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Place Bet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
