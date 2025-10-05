"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import {
  Trophy,
  ExternalLink,
  Sparkles,
  PieChart,
  BarChart3,
  TrendingUp,
  Eye,
  Info,
  Target,
  Shield,
  EyeOff,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { sportsbooks } from "@/data/sportsbooks"
import { calculateParlayOdds, formatOdds } from "@/lib/odds-utils"
import { generateSportsbookUrl, type ParlayLeg } from "@/lib/sportsbook-links"
import { SPORT_MARKETS } from "@/lib/constants/markets"
import { 
  calculateEnhancedOddSmashScore, 
  prepareSelectionsForScoring,
  type OddSmashScoreResult 
} from "@/lib/oddsmash-score-calculator"

// Import the new components
import { BetslipHeader } from "./betslip-header"
import { SelectionCard } from "./selection-card"
import { OddsComparisonCard } from "./odds-comparison-card"
import { EnhancedOddSmashScore } from "./enhanced-oddsmash-score"

interface ScannedBetslipViewProps {
  betslip: any // TODO: Type this properly
  selections: any[] // TODO: Type this properly
  user: any // TODO: Type this properly
  hitRatesData?: Record<string, any> // Hit rate data from initial scan
  isOwner?: boolean
  isPublic?: boolean
}

export function ScannedBetslipView({
  betslip,
  selections,
  user,
  hitRatesData,
  isOwner = false,
  isPublic = false,
}: ScannedBetslipViewProps) {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null)
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false)
  const [isPublicState, setIsPublicState] = useState(isPublic)
  const [currentSelections, setCurrentSelections] = useState(selections)
  const [activeTab, setActiveTab] = useState<"parlay" | "individual" | "screenshot">("parlay")
  const [viewMode, setViewMode] = useState<"cards" | "chart">("cards")
  const [showAllBooks, setShowAllBooks] = useState(false)
  const [parlayLinks, setParlayLinks] = useState<Record<string, string | null>>({})

  // Dashboard state
  const [selectedSelection, setSelectedSelection] = useState<any>(null)

  // Selection dropdown state
  const [expandedSelections, setExpandedSelections] = useState<Set<string>>(new Set())

  // Odds comparison dropdown state
  const [expandedOddsComparison, setExpandedOddsComparison] = useState<Set<string>>(new Set())

  // Add state for showing all sportsbooks
  const [showAllSportsbooks, setShowAllSportsbooks] = useState(false)

  // Add state for customizable bet amount
  const [betAmount, setBetAmount] = useState(100)

  // Helper function to format currency with commas
  const formatCurrency = (amount: number): string => {
    return amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  // Helper function to get hit rate data for a selection with bet type awareness
  const getHitRateForSelection = (selection: any) => {
    //console.log('=== GET HIT RATE FOR SELECTION DEBUG ===')
    //console.log('Selection object:', selection)
    //console.log('hitRatesData available:', !!hitRatesData)
    //console.log('hitRatesData keys:', hitRatesData ? Object.keys(hitRatesData) : 'N/A')

    if (!hitRatesData) {
      console.log("No hitRatesData available")
      return null
    }

    const playerName = selection.player_name || selection.description?.split(" ")?.[0] || ""

    // Hit rate data is stored with player name as key, not compound key
    const rawHitRateData = hitRatesData[playerName] || null

    if (!rawHitRateData) {
      console.log("No hit rate data found for player")
      return null
    }

    // Process hit rate data based on bet type and line
    const betType = selection.bet_type || "over"
    const line = selection.line || rawHitRateData.line

    // If it's an under bet, we need to flip the hit rates
    if (betType === "under") {
      // For under bets, flip all the percentages
      const processedData = {
        ...rawHitRateData,
        bet_type: "under",
        last_5_hit_rate: rawHitRateData.last_5_hit_rate !== null ? 100 - rawHitRateData.last_5_hit_rate : null,
        last_10_hit_rate: rawHitRateData.last_10_hit_rate !== null ? 100 - rawHitRateData.last_10_hit_rate : null,
        last_20_hit_rate: rawHitRateData.last_20_hit_rate !== null ? 100 - rawHitRateData.last_20_hit_rate : null,
        season_hit_rate: rawHitRateData.season_hit_rate !== null ? 100 - rawHitRateData.season_hit_rate : null,
        line: line, // Use the actual bet line
        is_under_bet: true, // Flag to indicate this is processed for under
      }

      return processedData
    }

    // For over bets, check if we need alternate line calculation
    if (Math.abs(line - rawHitRateData.line) >= 0.5 && rawHitRateData.points_histogram) {
      try {
        console.log(`[HIT RATE DEBUG] Alternate line detected for ${playerName}:`)
        console.log(`  Selection line: ${line}`)
        console.log(`  Profile line: ${rawHitRateData.line}`)
        console.log(`  Difference: ${Math.abs(line - rawHitRateData.line)}`)
        console.log(`  Has recent_games: ${!!rawHitRateData.recent_games}`)
        console.log(`  Recent games count: ${rawHitRateData.recent_games?.length || 0}`)
        
        // Import the calculator function dynamically to avoid module issues
        const { calculateAllHitRatesForLine } = require("@/lib/hit-rate-calculator")
        const recalculatedData = calculateAllHitRatesForLine(rawHitRateData, line, betType)

        console.log(`[HIT RATE DEBUG] Recalculated hit rates for ${playerName} ${line}:`)
        console.log(`  L10 Hit Rate: ${recalculatedData.last_10_hit_rate}%`)
        console.log(`  Is Alternate Line: ${recalculatedData.is_alternate_line}`)

        return recalculatedData
      } catch (error) {
        console.error(`[HIT RATE DEBUG] Error calculating alternate line for ${playerName}:`, error)
        // Fall back to original data
        return rawHitRateData
      }
    }

    // Return original data for standard over bets
    const result = {
      ...rawHitRateData,
      bet_type: "over",
      line: line,
    }

    //console.log('=== END HIT RATE DEBUG ===')

    return result
  }

  // Rate limiting for odds refresh (5 minutes)
  const REFRESH_COOLDOWN_MINUTES = 5

  const getLastRefreshTime = () => {
    const lastRefreshFromBetslip = betslip.last_odds_refresh ? new Date(betslip.last_odds_refresh) : null
    const lastRefreshFromState = refreshedAt ? new Date(refreshedAt) : null

    // Return the most recent refresh time
    if (!lastRefreshFromBetslip && !lastRefreshFromState) return null
    if (!lastRefreshFromBetslip) return lastRefreshFromState
    if (!lastRefreshFromState) return lastRefreshFromBetslip

    return lastRefreshFromBetslip > lastRefreshFromState ? lastRefreshFromBetslip : lastRefreshFromState
  }

  const getTimeUntilNextRefresh = () => {
    const lastRefresh = getLastRefreshTime()
    if (!lastRefresh) return 0

    const now = new Date()
    const timeSinceLastRefresh = now.getTime() - lastRefresh.getTime()
    const cooldownMs = REFRESH_COOLDOWN_MINUTES * 60 * 1000
    const timeRemaining = cooldownMs - timeSinceLastRefresh

    return Math.max(0, timeRemaining)
  }

  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / (60 * 1000))
    const seconds = Math.floor((ms % (60 * 1000)) / 1000)

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }

  const canRefresh = () => {
    if (!isOwner) return false
    return getTimeUntilNextRefresh() === 0
  }

  const handleRefreshOdds = async () => {
    if (!isOwner) {
      toast.error("Only the owner can refresh odds")
      return
    }

    if (!canRefresh()) {
      const remaining = formatTimeRemaining(getTimeUntilNextRefresh())
      toast.error(`Please wait ${remaining} before refreshing odds again`)
      return
    }

    setIsRefreshing(true)
    try {
      const response = await fetch(`/api/betslip-scanner/${betslip.id}/refresh`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to refresh odds")
      }

      const data = await response.json()
      if (data.success) {
        setCurrentSelections(data.data.selections)
        setRefreshedAt(data.data.lastRefresh)

        // Enhanced success message with details
        const { summary } = data.data
        if (summary) {
          const successCount = summary.successful_refreshes || 0
          const totalCount = summary.total_selections || 0
          toast.success(`Odds refreshed! ${successCount}/${totalCount} selections updated successfully`)
        } else {
          toast.success("Odds refreshed successfully")
        }
      } else {
        throw new Error(data.error || "Failed to refresh odds")
      }
    } catch (error) {
      console.error("Error refreshing odds:", error)
      toast.error("Failed to refresh odds. Please try again.")
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleTogglePrivacy = async () => {
    if (!isOwner) {
      toast.error("Only the owner can change privacy settings")
      return
    }

    setIsUpdatingPrivacy(true)
    try {
      const response = await fetch(`/api/betslip-scanner/${betslip.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_public: !isPublicState,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update privacy setting")
      }

      const data = await response.json()
      if (data.success) {
        setIsPublicState(data.data.is_public)
        toast.success(`Betslip is now ${data.data.is_public ? "public" : "private"}!`)
      } else {
        throw new Error(data.error || "Failed to update privacy")
      }
    } catch (error) {
      console.error("Error updating privacy:", error)
      toast.error("Failed to update privacy setting. Please try again.")
    } finally {
      setIsUpdatingPrivacy(false)
    }
  }

  const handleUpdateTitle = async (newTitle: string) => {
    if (!isOwner) {
      toast.error("Only the owner can edit the title")
      return
    }

    try {
      const response = await fetch(`/api/betslip-scanner/${betslip.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTitle,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update title")
      }

      const data = await response.json()
      if (data.success) {
        // Update the betslip object to reflect the new title
        betslip.title = newTitle
        toast.success("Title updated successfully!")
      } else {
        throw new Error(data.error || "Failed to update title")
      }
    } catch (error) {
      console.error("Error updating title:", error)
      toast.error("Failed to update title. Please try again.")
      throw error // Re-throw to let the header component handle the error state
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success("Link copied to clipboard!")
    } catch (error) {
      console.error("Failed to copy link:", error)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${betslip.sportsbook} Betslip - ${betslip.total_selections} picks`,
          text: `Check out this ${betslip.sportsbook} betslip with ${betslip.total_selections} selections`,
          url: window.location.href,
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      // Fallback to copy link
      handleCopyLink()
    }
  }

  // Social sharing helpers
  const shareToX = () => {
    const text = `Just scanned my parlay with @OddSmash. See the full odds breakdown, hit rate & value insights →`
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const shareToReddit = () => {
    const title = `Just scanned my parlay with OddSmash - Full odds breakdown, hit rate & value insights`
    const url = `https://reddit.com/submit?title=${encodeURIComponent(title)}&url=${encodeURIComponent(window.location.href)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const shareToLinkedIn = () => {
    const title = `Parlay Analysis with OddSmash`
    const summary = `Just scanned my parlay with OddSmash. See the full odds breakdown, hit rate & value insights.`
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(summary)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const shareToWhatsApp = () => {
    const text = `Just scanned my parlay with OddSmash. See the full odds breakdown, hit rate & value insights →`
    const url = `https://wa.me/?text=${encodeURIComponent(`${text}\n${window.location.href}`)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const shareToEmail = () => {
    const subject = `Check out my parlay analysis on OddSmash`
    const body = `Just scanned my parlay with OddSmash. See the full odds breakdown, hit rate & value insights:\n\n${window.location.href}`
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  // Calculate parlay odds for each sportsbook
  const calculateParlayComparison = () => {
    const parlayResults: Record<string, any> = {}

    // Get selections that have current odds
    const selectionsWithOdds = currentSelections.filter(
      (s) => s.current_odds && s.current_odds.bookmakers && Object.keys(s.current_odds.bookmakers).length > 0,
    )

    currentSelections.forEach((selection, i) => {
      const hasOdds =
        selection.current_odds &&
        selection.current_odds.bookmakers &&
        Object.keys(selection.current_odds.bookmakers).length > 0
      console.log(`Selection ${i + 1}: ${selection.player_name} - Has odds: ${hasOdds}`)
      if (hasOdds) {
        console.log(`  Available sportsbooks: ${Object.keys(selection.current_odds.bookmakers).join(", ")}`)
      } else {
        console.log(`  Current odds structure:`, selection.current_odds)
      }
    })

    if (selectionsWithOdds.length === 0) {
      console.log("❌ No selections with odds found")
      return { parlayResults: {}, bestSportsbook: "", bestOdds: null }
    }

    // Get all unique sportsbooks that have odds for at least one selection
    const allSportsbooks = new Set<string>()
    selectionsWithOdds.forEach((selection) => {
      if (selection.current_odds?.bookmakers) {
        Object.keys(selection.current_odds.bookmakers).forEach((book) => {
          allSportsbooks.add(book)
        })
      }
    })

    console.log(`🏢 All available sportsbooks: ${Array.from(allSportsbooks).join(", ")}`)

    // Calculate parlay for each sportsbook
    for (const sportsbook of Array.from(allSportsbooks)) {
      const oddsForThisBook: number[] = []
      let hasAllSelections = true

      console.log(`\n📊 Checking ${sportsbook}:`)

      for (const selection of selectionsWithOdds) {
        const bookOdds = selection.current_odds?.bookmakers?.[sportsbook]?.price
        console.log(`  ${selection.player_name}: ${bookOdds || "N/A"}`)

        if (bookOdds && typeof bookOdds === "number") {
          oddsForThisBook.push(bookOdds)
        } else {
          console.log(`    ❌ Missing or invalid odds for ${selection.player_name} at ${sportsbook}`)
          hasAllSelections = false
          break
        }
      }

      console.log(`  Has all selections: ${hasAllSelections}, Odds count: ${oddsForThisBook.length}`)

      if (hasAllSelections && oddsForThisBook.length === selectionsWithOdds.length) {
        const parlayOdds = calculateParlayOdds(oddsForThisBook)
        console.log(`  ✅ Parlay odds: ${parlayOdds}`)
        parlayResults[sportsbook] = {
          parlayOdds,
          hasAllSelections: true,
          numSelections: oddsForThisBook.length,
        }
      } else {
        parlayResults[sportsbook] = {
          parlayOdds: null,
          hasAllSelections: false,
          numSelections: oddsForThisBook.length,
        }
      }
    }

    // Find best odds
    let bestSportsbook = ""
    let bestOdds = Number.NEGATIVE_INFINITY

    Object.entries(parlayResults).forEach(([sportsbook, result]) => {
      if (result.hasAllSelections && result.parlayOdds !== null) {
        if (result.parlayOdds > bestOdds) {
          bestOdds = result.parlayOdds
          bestSportsbook = sportsbook
        }
      }
    })

    console.log(`🏆 Best sportsbook: ${bestSportsbook} with odds: ${bestOdds}`)
    console.log("📋 Final parlay results:", parlayResults)

    return {
      parlayResults,
      bestSportsbook,
      bestOdds: bestOdds !== Number.NEGATIVE_INFINITY ? bestOdds : null,
    }
  }

  const { parlayResults, bestSportsbook, bestOdds } = calculateParlayComparison()

  // Memoize enhanced OddSmash score calculation
  const enhancedScore = useMemo(() => {
    if (currentSelections.length === 0 || !bestOdds) {
      return null
    }
    
    try {
      const scoreInputs = prepareSelectionsForScoring(
        currentSelections,
        getHitRateForSelection,
        parlayResults,
        bestOdds
      )
      
      return calculateEnhancedOddSmashScore(scoreInputs)
    } catch (error) {
      console.error("Error calculating enhanced OddSmash score:", error)
      return null
    }
  }, [
    currentSelections.length,
    bestOdds,
    // Use a stable representation of parlayResults
    JSON.stringify(Object.keys(parlayResults).sort()),
    // Create a stable key for the selections to detect changes
    currentSelections.map(s => `${s.id}-${s.player_name}-${s.line}`).join(',')
  ])

  // Get sportsbook info
  const getSportsbookInfo = (sportsbookId: string) => {
    return (
      sportsbooks.find((sb) => sb.id === sportsbookId) || {
        id: sportsbookId,
        name: sportsbookId,
        logo: "/images/sports-books/default.png",
      }
    )
  }

  // Check if sportsbook has one-click betting capability
  const hasDeepLinking = (sportsbookId: string) => {
    // Only these sportsbooks have proper deep linking support implemented
    const supportedSportsbooks = ["fanduel", "draftkings", "williamhill_us"]

    if (!supportedSportsbooks.includes(sportsbookId)) {
      return false
    }

    return currentSelections.some((selection) => {
      const bookmakers = selection.current_odds?.bookmakers
      if (!bookmakers || !bookmakers[sportsbookId]) return false

      const sportsbookData = bookmakers[sportsbookId]
      return sportsbookData.link || sportsbookData.sid
    })
  }

  // Helper function to create parlay legs from current selections
  const createParlayLegs = (sportsbookId: string): ParlayLeg[] => {
    return currentSelections
      .map((selection) => {
        const bookmakers = selection.current_odds?.bookmakers

        if (!bookmakers || !bookmakers[sportsbookId]) {
          return {}
        }

        const sportsbookData = bookmakers[sportsbookId]

        // Base leg data
        const leg: ParlayLeg = {
          eventId: selection.event_id,
          sid: sportsbookData.sid,
          link: sportsbookData.link,
        }

        // Extract specific parameters based on sportsbook
        if (sportsbookId === "fanduel" && sportsbookData.link) {
          try {
            const url = new URL(sportsbookData.link)
            const marketId = url.searchParams.get("marketId")
            const selectionId = url.searchParams.get("selectionId")

            if (marketId && selectionId) {
              leg.marketId = marketId
              leg.selectionId = selectionId
            }
          } catch (e) {
            console.error(`Error parsing FanDuel link:`, e)
          }
        } else if (sportsbookId === "draftkings" && sportsbookData.link) {
          try {
            const url = new URL(sportsbookData.link)
            const eventId = url.pathname.match(/event\/(\d+)/)?.[1]

            if (eventId) {
              leg.eventId = eventId
            }
          } catch (e) {
            console.error(`Error parsing DraftKings link:`, e)
          }
        }

        return leg
      })
      .filter((leg: ParlayLeg) => Object.keys(leg).length > 0)
  }

  // Handle placing a bet at a specific sportsbook - can be for individual selection or full parlay
  const handlePlaceBet = (sportsbookId: string, selectionId?: string) => {
    const sportsbookInfo = getSportsbookInfo(sportsbookId)
    if (!sportsbookInfo) {
      toast.error("Sportsbook information not found")
      return
    }

    // If selectionId is provided, bet on individual selection only
    if (selectionId) {
      const selection = currentSelections.find((s) => s.id === selectionId)
      if (!selection) {
        toast.error("Selection not found")
        return
      }

      const bookmakers = selection.current_odds?.bookmakers
      if (!bookmakers || !bookmakers[sportsbookId]) {
        toast.error("No odds available for this selection at this sportsbook")
        return
      }

      const sportsbookData = bookmakers[sportsbookId]

      // If there's a direct link, use it
      if (sportsbookData.link) {
        window.open(sportsbookData.link, "_blank", "noopener,noreferrer")
        toast.success(`Opened ${sportsbookInfo.name} for ${selection.player_name}`)
        return
      }

      // Otherwise, try to generate a single-selection deep link
      const singleLeg: ParlayLeg = {
        eventId: selection.event_id,
        sid: sportsbookData.sid,
        link: sportsbookData.link,
      }

      // Extract specific parameters based on sportsbook
      if (sportsbookId === "fanduel" && sportsbookData.link) {
        try {
          const url = new URL(sportsbookData.link)
          const marketId = url.searchParams.get("marketId")
          const selectionId = url.searchParams.get("selectionId")

          if (marketId && selectionId) {
            singleLeg.marketId = marketId
            singleLeg.selectionId = selectionId
          }
        } catch (e) {
          console.error(`Error parsing FanDuel link:`, e)
        }
      } else if (sportsbookId === "draftkings" && sportsbookData.link) {
        try {
          const url = new URL(sportsbookData.link)
          const eventId = url.pathname.match(/event\/(\d+)/)?.[1]

          if (eventId) {
            singleLeg.eventId = eventId
          }
        } catch (e) {
          console.error(`Error parsing DraftKings link:`, e)
        }
      }

      if (Object.keys(singleLeg).length > 0) {
        try {
          const linkParams = {
            state: "nj", // TODO: Get user's actual state from preferences
            legs: [singleLeg],
          }

          const betUrl = generateSportsbookUrl(sportsbookId, linkParams)
          if (betUrl) {
            window.open(betUrl, "_blank", "noopener,noreferrer")
            toast.success(`Opened ${sportsbookInfo.name} for ${selection.player_name}`)
            return
          }
        } catch (error) {
          console.error("Error generating single selection URL:", error)
        }
      }

      // Fallback to sportsbook URL, preferring affiliate link when available
      const sportsbook = sportsbooks.find((sb) => sb.id === sportsbookId)
      const href = sportsbook?.affiliate && sportsbook.affiliateLink ? sportsbook.affiliateLink : sportsbook?.url
      if (href) {
        window.open(href, "_blank", "noopener,noreferrer")
        toast.success(`Opened ${sportsbookInfo.name} - please find ${selection.player_name}`)
      } else {
        toast.error("Unable to open sportsbook")
      }
      return
    }

    // Original full parlay betting logic
    const legs = createParlayLegs(sportsbookId)

    if (legs.length === 0) {
      // Fallback to sportsbook URL, preferring affiliate link when available
      const sportsbook = sportsbooks.find((sb) => sb.id === sportsbookId)
      const href = sportsbook?.affiliate && sportsbook.affiliateLink ? sportsbook.affiliateLink : sportsbook?.url
      if (href) {
        window.open(href, "_blank", "noopener,noreferrer")
        toast.success(`Opened ${sportsbookInfo.name}`)
      } else {
        toast.error("Unable to open sportsbook")
      }
      return
    }

    try {
      // Generate the deep link URL using the sportsbook-links utility
      const linkParams = {
        state: "nj", // TODO: Get user's actual state from preferences
        legs: legs,
      }

      const betUrl = generateSportsbookUrl(sportsbookId, linkParams)
      if (betUrl) {
        window.open(betUrl, "_blank", "noopener,noreferrer")
        toast.success(`Opened ${sportsbookInfo.name} with your selections`)
      } else {
        // Fallback to sportsbook URL, preferring affiliate link when available
        const sportsbook = sportsbooks.find((sb) => sb.id === sportsbookId)
        const href = sportsbook?.affiliate && sportsbook.affiliateLink ? sportsbook.affiliateLink : sportsbook?.url
        if (href) {
          window.open(href, "_blank", "noopener,noreferrer")
          toast.success(`Opened ${sportsbookInfo.name}`)
        }
      }
    } catch (error) {
      console.error("Error generating sportsbook URL:", error)
      // Fallback to sportsbook URL, preferring affiliate link when available
      const sportsbook = sportsbooks.find((sb) => sb.id === sportsbookId)
      const href = sportsbook?.affiliate && sportsbook.affiliateLink ? sportsbook.affiliateLink : sportsbook?.url
      if (href) {
        window.open(href, "_blank", "noopener,noreferrer")
        toast.success(`Opened ${sportsbookInfo.name}`)
      }
    }
  }

  // Helper function to get proper market label from markets.ts
  const getMarketLabel = (marketKey: string, sport = "baseball_mlb"): string => {
    if (!marketKey) return "Unknown Market"

    const markets = SPORT_MARKETS[sport] || SPORT_MARKETS["baseball_mlb"]
    const market = markets.find((m) => m.value === marketKey || m.apiKey === marketKey)
    return market?.label || marketKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  // Helper function to format odds properly (avoid double plus signs)
  const formatOddsClean = (odds: number | string): string => {
    if (typeof odds === "string") {
      // If it's already a string, check if it already has a + sign
      const numericOdds = Number.parseFloat(odds.replace(/[+]/g, ""))
      return formatOdds(numericOdds)
    }
    return formatOdds(odds)
  }

  // Helper function to get best odds for a selection
  const getBestOddsForSelection = (
    selection: any,
  ): {
    sportsbook: string
    odds: any
    price: number
    info: any
  } | null => {
    if (!selection.current_odds?.bookmakers) return null

    let bestOdds: any = null
    let bestSportsbook: string | null = null
    let bestPrice = Number.NEGATIVE_INFINITY

    Object.entries(selection.current_odds.bookmakers).forEach(([sportsbookId, odds]) => {
      const price = (odds as any).price
      if (price && price > bestPrice) {
        bestPrice = price
        bestOdds = odds
        bestSportsbook = sportsbookId
      }
    })

    return bestSportsbook
      ? {
          sportsbook: bestSportsbook,
          odds: bestOdds,
          price: bestPrice,
          info: getSportsbookInfo(bestSportsbook),
        }
      : null
  }

  // Helper function to toggle selection dropdown
  const toggleSelectionDropdown = (selectionId: string) => {
    const newExpanded = new Set(expandedSelections)
    if (newExpanded.has(selectionId)) {
      newExpanded.delete(selectionId)
    } else {
      newExpanded.add(selectionId)
    }
    setExpandedSelections(newExpanded)
  }

  // Helper function to get sorted odds for a selection
  const getSortedOddsForSelection = (selection: any) => {
    if (!selection.current_odds?.bookmakers) return []

    const oddsArray = Object.entries(selection.current_odds.bookmakers)
      .map(([sportsbookId, odds]: [string, any]) => ({
        sportsbookId,
        odds: odds.price,
        info: getSportsbookInfo(sportsbookId),
        hasDeepLink: hasDeepLinking(sportsbookId),
      }))
      .filter((item) => item.odds && typeof item.odds === "number")
      .sort((a, b) => b.odds - a.odds) // Sort by odds descending (best first)

    // Find the best odds value
    const bestOddsValue = oddsArray.length > 0 ? oddsArray[0].odds : null

    // Mark all items with the best odds as "isBest"
    return oddsArray.map((item) => ({
      ...item,
      isBest: bestOddsValue !== null && item.odds === bestOddsValue,
    }))
  }

  // Helper function to toggle odds comparison dropdown
  const toggleOddsComparisonDropdown = (sportsbookId: string) => {
    const newExpanded = new Set(expandedOddsComparison)
    if (newExpanded.has(sportsbookId)) {
      newExpanded.delete(sportsbookId)
    } else {
      newExpanded.add(sportsbookId)
    }
    setExpandedOddsComparison(newExpanded)
  }

  // Helper function to get leg odds for a specific sportsbook
  const getLegOddsForSportsbook = (sportsbookId: string) => {
    return currentSelections
      .map((selection) => {
        const bookmakers = selection.current_odds?.bookmakers
        const sportsbookData = bookmakers?.[sportsbookId]

        return {
          id: selection.id,
          playerName: selection.player_name,
          market: getMarketLabel(selection.market),
          line: selection.line,
          awayTeam: selection.away_team,
          homeTeam: selection.home_team,
          odds: sportsbookData?.price || null,
          hasDeepLink: sportsbookData?.link ? true : false,
          isMatched: !!selection.event_id,
        }
      })
      .filter((leg) => leg.odds !== null) // Only show legs that have odds
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 max-w-7xl">
          {/* Header Section */}
          <BetslipHeader
            betslip={betslip}
            user={user}
            isOwner={isOwner}
            isPublicState={isPublic}
            isRefreshing={isRefreshing}
            isUpdatingPrivacy={isUpdatingPrivacy}
            canRefresh={canRefresh}
            getTimeUntilNextRefresh={getTimeUntilNextRefresh}
            formatTimeRemaining={formatTimeRemaining}
            handleRefreshOdds={handleRefreshOdds}
            handleTogglePrivacy={handleTogglePrivacy}
            handleUpdateTitle={handleUpdateTitle}
            handleCopyLink={handleCopyLink}
            shareToX={shareToX}
            shareToReddit={shareToReddit}
            shareToFacebook={shareToFacebook}
            shareToLinkedIn={shareToLinkedIn}
            shareToWhatsApp={shareToWhatsApp}
            shareToEmail={shareToEmail}
          />

          {/* Public betslip notification - Modern design */}
          {!isOwner && isPublicState && (
            <div className="mb-4 sm:mb-6">
              <div className="bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 rounded-2xl p-4 sm:p-5 backdrop-blur-sm shadow-sm">
                <div className="flex items-center gap-3 text-blue-700 dark:text-blue-300">
                  <div className="p-2 bg-blue-100/80 dark:bg-blue-900/50 rounded-xl">
                    <Eye className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm sm:text-base">Viewing Public Betslip</div>
                    <div className="text-xs sm:text-sm opacity-80 mt-0.5">
                      Only the owner can refresh odds or change privacy settings
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mobile-First Quick Stats - Enhanced */}
          <div className="block lg:hidden mb-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Picks & Books - Enhanced */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-white shadow-lg">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-5 w-5" />
                    <span className="text-sm font-semibold opacity-90">Your Picks</span>
                  </div>
                  <div className="text-3xl font-black mb-1">{betslip.total_selections}</div>
                  <div className="text-sm opacity-75 font-medium">
                    📚 {Object.keys(parlayResults).length} books compared
                  </div>
                </div>
                <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/10"></div>
              </div>

              {/* Enhanced OddSmash Score */}
              {enhancedScore && (
                <EnhancedOddSmashScore 
                  scoreResult={enhancedScore} 
                  isCompact={true}
                />
              )}
            </div>

            {/* Best Value Card - Mobile */}
            {bestOdds && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-2xl p-4 mb-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                      <img
                        src={getSportsbookInfo(bestSportsbook).logo || "/placeholder.svg"}
                        alt={getSportsbookInfo(bestSportsbook).name}
                        className="w-5 h-5 object-contain"
                      />
                    </div>
                    <div>
                      <div className="text-base font-bold text-green-800 dark:text-green-200">Best Odds</div>
                      <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                        {getSportsbookInfo(bestSportsbook).name}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-green-700 dark:text-green-400">
                      {formatOddsClean(bestOdds)}
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base font-bold shadow-md hover:shadow-lg transition-all duration-200"
                  onClick={() => handlePlaceBet(bestSportsbook)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />⚡ Place Bet Now
                </Button>
              </div>
            )}

            {/* Selection Cards */}
            <div className="space-y-3">
              {currentSelections.map((selection, index) => (
                <SelectionCard
                  key={selection.id}
                  selection={selection}
                  index={index}
                  bestSportsbook={bestSportsbook}
                  isExpanded={expandedSelections.has(selection.id)}
                  sortedOdds={getSortedOddsForSelection(selection)}
                  hasMultipleBooks={getSortedOddsForSelection(selection).length > 1}
                  hasAnyOdds={getSortedOddsForSelection(selection).length > 0}
                  hitRateData={getHitRateForSelection(selection)}
                  formatOddsClean={formatOddsClean}
                  getMarketLabel={getMarketLabel}
                  getSportsbookInfo={getSportsbookInfo}
                  toggleSelectionDropdown={toggleSelectionDropdown}
                  handlePlaceBet={handlePlaceBet}
                />
              ))}
            </div>
          </div>

          {/* Desktop Layout - Hidden on Mobile */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-8 lg:items-start">
            {/* Left Column - Betslip (2/3 width on desktop) */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md h-full">
                <CardHeader className="pb-6 px-8 pt-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                      <Trophy className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold">Your Betslip</CardTitle>
                      <p className="text-slate-600 dark:text-slate-400 text-base">
                        {betslip.total_selections} selections • {Object.keys(parlayResults).length} books compared
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  {/* Best Odds Section - Desktop Only */}
                  {bestOdds && (
                    <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-3xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-2xl">
                            <img
                              src={getSportsbookInfo(bestSportsbook).logo || "/placeholder.svg"}
                              alt={getSportsbookInfo(bestSportsbook).name}
                              className="w-8 h-8 object-contain"
                            />
                          </div>
                          <div>
                            <div className="text-xl font-bold text-green-800 dark:text-green-200">
                              Best Odds Available
                            </div>
                            <div className="text-base text-green-600 dark:text-green-400 font-medium">
                              {getSportsbookInfo(bestSportsbook).name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-4xl font-black text-green-700 dark:text-green-400">
                            {formatOddsClean(bestOdds)}
                          </div>
                          <div className="text-sm text-green-600 dark:text-green-400 font-medium">American Odds</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 mb-6">
                        {/* Payout Info */}
                        <div className="flex items-center gap-4 p-4 bg-green-100/50 dark:bg-green-900/20 rounded-2xl">
                          <div className="p-3 bg-green-200 dark:bg-green-800 rounded-xl">
                            <PieChart className="h-5 w-5 text-green-700 dark:text-green-300" />
                          </div>
                          <div>
                            <div className="text-sm text-green-700 dark:text-green-300 font-semibold uppercase tracking-wide">
                              $100 Bet Wins
                            </div>
                            <div className="text-xl font-black text-green-800 dark:text-green-200">
                              $
                              {(bestOdds > 0 
                                ? bestOdds  // For +odds, you win the odds amount on $100
                                : (100 * 100) / Math.abs(bestOdds)  // For -odds, you win (100 * stake) / |odds|
                              ).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                            </div>
                          </div>
                        </div>

                        {/* Books Beaten */}
                        <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-2xl">
                          <div className="p-3 bg-blue-200 dark:bg-blue-800 rounded-xl">
                            <Trophy className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                          </div>
                          <div>
                            <div className="text-sm text-blue-700 dark:text-blue-300 font-semibold uppercase tracking-wide">
                              Books Beaten
                            </div>
                            <div className="text-xl font-black text-blue-800 dark:text-blue-200">
                              {
                                Object.values(parlayResults).filter(
                                  (result) =>
                                    result.hasAllSelections && result.parlayOdds && result.parlayOdds < bestOdds,
                                ).length
                              }
                              /{Object.keys(parlayResults).length}
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 text-white h-14 text-lg font-bold shadow-md hover:shadow-lg transition-all duration-200"
                        onClick={() => handlePlaceBet(bestSportsbook)}
                      >
                        <ExternalLink className="h-5 w-5 mr-3" />
                        Place Bet at {getSportsbookInfo(bestSportsbook).name}
                      </Button>
                    </div>
                  )}

                  {/* Desktop Selection Cards */}
                  <div className="space-y-4">
                    {currentSelections.map((selection, index) => (
                      <SelectionCard
                        key={selection.id}
                        selection={selection}
                        index={index}
                        bestSportsbook={bestSportsbook}
                        isExpanded={expandedSelections.has(selection.id)}
                        sortedOdds={getSortedOddsForSelection(selection)}
                        hasMultipleBooks={getSortedOddsForSelection(selection).length > 1}
                        hasAnyOdds={getSortedOddsForSelection(selection).length > 0}
                        hitRateData={getHitRateForSelection(selection)}
                        formatOddsClean={formatOddsClean}
                        getMarketLabel={getMarketLabel}
                        getSportsbookInfo={getSportsbookInfo}
                        toggleSelectionDropdown={toggleSelectionDropdown}
                        handlePlaceBet={handlePlaceBet}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Stats & Odds Comparison (1/3 width on desktop) */}
            <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
              {/* Enhanced OddSmash Score Card */}
              {enhancedScore && (
                <EnhancedOddSmashScore 
                  scoreResult={enhancedScore} 
                  isCompact={false}
                />
              )}
              
              {/* Quick Stats Card */}
              <Card className="border-0 shadow-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {(() => {
                    // Calculate enhanced stats
                    const originalTotalOdds = currentSelections.reduce((acc, sel) => {
                      const odds = sel.original_odds
                      return acc * (odds > 0 ? odds / 100 + 1 : 100 / Math.abs(odds) + 1)
                    }, 1)
                    const originalAmericanOdds =
                      originalTotalOdds >= 2
                        ? Math.round((originalTotalOdds - 1) * 100)
                        : Math.round(-100 / (originalTotalOdds - 1))
                    // Calculate profit (winnings) on $100 bet for American odds
                    const originalPayout =
                      originalAmericanOdds > 0
                        ? originalAmericanOdds  // For +odds, you win the odds amount on $100
                        : (100 * 100) / Math.abs(originalAmericanOdds)  // For -odds, you win (100 * stake) / |odds|
                    
                    const bestPayout = bestOdds > 0 
                      ? bestOdds  // For +odds, you win the odds amount on $100
                      : (100 * 100) / Math.abs(bestOdds)  // For -odds, you win (100 * stake) / |odds|
                    const valueEdge =
                      bestOdds && originalAmericanOdds ? ((bestPayout - originalPayout) / originalPayout) * 100 : 0
                    const winDelta = bestPayout - originalPayout
                    const booksBeaten = Object.values(parlayResults).filter(
                      (result) => result.hasAllSelections && result.parlayOdds && result.parlayOdds < bestOdds,
                    ).length

                    // Enhanced analytics for display

                    return (
                      <>
                        {/* Hero Stats - Mobile Optimized */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-5 text-white">
                            <div className="relative z-10">
                              <div className="text-3xl font-bold">{betslip.total_selections}</div>
                              <div className="text-sm font-medium opacity-90">Picks</div>
                              <div className="text-2xl font-semibold mt-2">{Object.keys(parlayResults).length}</div>
                              <div className="text-sm font-medium opacity-90">Books</div>
                            </div>
                            <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-white/10"></div>
                          </div>

                        </div>

                        {/* Value Metrics */}
                        <div className="space-y-4">
                          {valueEdge > 0 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border border-emerald-200 dark:border-emerald-800 p-5 cursor-help">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-2">
                                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                                      </div>
                                      <span className="text-base font-semibold text-emerald-800 dark:text-emerald-200">
                                        Value Edge
                                      </span>
                                      <Info className="h-4 w-4 text-emerald-600 opacity-60" />
                                    </div>
                                    <div className="text-right">
                                      <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                                        +{valueEdge.toFixed(1)}%
                                      </div>
                                      <div className="text-sm text-emerald-600 dark:text-emerald-400">vs market</div>
                                    </div>
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="max-w-xs">
                                <div className="space-y-1 text-sm">
                                  <div className="font-semibold">Value Edge Explained:</div>
                                  <div>• Percentage advantage over your original odds</div>
                                  <div>• Higher percentages indicate better value</div>
                                  <div>• Based on current market prices vs. your betslip</div>
                                  <div className="pt-1 border-t border-gray-200 dark:border-gray-600">
                                    <div className="text-gray-500">
                                      Positive edge suggests this bet offers above-market value
                                    </div>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {winDelta > 10 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border border-orange-200 dark:border-orange-800 p-5 cursor-help">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="rounded-full bg-orange-100 dark:bg-orange-900/30 p-2">
                                        <Sparkles className="h-4 w-4 text-orange-600" />
                                      </div>
                                      <span className="text-base font-semibold text-orange-800 dark:text-orange-200">
                                        Win Bonus
                                      </span>
                                      <Info className="h-4 w-4 text-orange-600 opacity-60" />
                                    </div>
                                    <div className="text-right">
                                      <div className="text-xl font-bold text-orange-700 dark:text-orange-400">
                                        +${winDelta.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                      </div>
                                      <div className="text-sm text-orange-600 dark:text-orange-400">
                                        with {bestSportsbook ? getSportsbookInfo(bestSportsbook).name : "best book"}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="max-w-xs">
                                <div className="space-y-1 text-sm">
                                  <div className="font-semibold">Win Bonus Explained:</div>
                                  <div>• Extra winnings compared to your original sportsbook</div>
                                  <div>• Shows potential additional profit on $100 bet</div>
                                  <div>• Calculated from best available odds vs. original</div>
                                  <div className="pt-1 border-t border-gray-200 dark:border-gray-600">
                                    <div className="text-gray-500">
                                      Higher bonus means better odds shopping opportunity
                                    </div>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>

                        {/* Secondary Stats */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between py-3">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-3 cursor-help">
                                  <Target className="h-5 w-5 text-slate-500" />
                                  <span className="text-base text-slate-600 dark:text-slate-400">Books Beaten</span>
                                  <Info className="h-4 w-4 text-slate-500 opacity-60" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="max-w-xs">
                                <div className="space-y-1 text-sm">
                                  <div className="font-semibold">Books Beaten:</div>
                                  <div>• Number of sportsbooks offering worse odds</div>
                                  <div>• Higher ratio means better market position</div>
                                  <div>• Indicates how competitive your odds are</div>
                                  <div className="pt-1 border-t border-gray-200 dark:border-gray-600">
                                    <div className="text-gray-500">More books beaten = better value found</div>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                            <Badge
                              variant="outline"
                              className="bg-slate-50 dark:bg-slate-800 font-semibold text-base px-3 py-1"
                            >
                              {booksBeaten}/{Object.keys(parlayResults).length}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between py-3">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-3 cursor-help">
                                  {isPublicState ? (
                                    <Eye className="h-5 w-5 text-slate-500" />
                                  ) : (
                                    <EyeOff className="h-5 w-5 text-slate-500" />
                                  )}
                                  <span className="text-base text-slate-600 dark:text-slate-400">Privacy</span>
                                  <Info className="h-4 w-4 text-slate-500 opacity-60" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="max-w-xs">
                                <div className="space-y-1 text-sm">
                                  <div className="font-semibold">Privacy Setting:</div>
                                  <div>• Public: Anyone with link can view this betslip</div>
                                  <div>• Private: Only you can access this betslip</div>
                                  <div>• Change anytime using the toggle button</div>
                                  <div className="pt-1 border-t border-gray-200 dark:border-gray-600">
                                    <div className="text-gray-500">Public betslips can be shared easily</div>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                            <Badge
                              variant={isPublicState ? "default" : "secondary"}
                              className={`font-semibold text-base px-3 py-1 ${
                                isPublicState
                                  ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400"
                                  : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300"
                              }`}
                            >
                              {isPublicState ? "Public" : "Private"}
                            </Badge>
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </CardContent>
              </Card>

              {/* Enhanced Value Snapshot Card */}
              <Card className="border-0 shadow-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Value Snapshot
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {(() => {
                    // Enhanced value calculations with better fallback handling
                    const hasOriginalOdds = currentSelections.some(
                      (sel) => sel.original_odds && !isNaN(sel.original_odds),
                    )

                    // Calculate original odds (with fallback for missing data)
                    let originalTotalOdds = 1
                    let originalDataAvailable = true

                    if (betslip.original_odds && !isNaN(betslip.original_odds)) {
                      originalTotalOdds = betslip.original_odds
                    } else if (hasOriginalOdds) {
                      originalTotalOdds = currentSelections.reduce((acc, sel) => {
                        if (sel.original_odds && !isNaN(sel.original_odds)) {
                          return (
                            acc *
                            (sel.original_odds > 0
                              ? sel.original_odds / 100 + 1
                              : 100 / Math.abs(sel.original_odds) + 1)
                          )
                        }
                        return acc
                      }, 1)
                    } else {
                      // No original odds available - use market average estimation
                      originalDataAvailable = false
                      // Estimate based on typical parlay odds for this many selections
                      const estimatedIndividualOdds = currentSelections.length <= 3 ? -110 : -120
                      originalTotalOdds = currentSelections.reduce((acc) => {
                        return acc * (100 / Math.abs(estimatedIndividualOdds) + 1)
                      }, 1)
                    }

                    const originalAmericanOdds =
                      originalTotalOdds >= 2
                        ? Math.round((originalTotalOdds - 1) * 100)
                        : Math.round(-100 / (originalTotalOdds - 1))
                    // Calculate profit (winnings) on $100 bet for American odds
                    const originalPayoutOn100 =
                      originalAmericanOdds > 0
                        ? originalAmericanOdds  // For +odds, you win the odds amount on $100
                        : (100 * 100) / Math.abs(originalAmericanOdds)  // For -odds, you win (100 * stake) / |odds|
                    
                    const bestPayoutOn100 = bestOdds > 0 
                      ? bestOdds  // For +odds, you win the odds amount on $100
                      : (100 * 100) / Math.abs(bestOdds)  // For -odds, you win (100 * stake) / |odds|
                    const potentialGain = bestPayoutOn100 - originalPayoutOn100

                    // Enhanced value leg analysis
                    const bestValueLegs: Array<{
                      player: string
                      market: string
                      odds: number
                      originalOdds: number
                      sportsbook: string
                      edge: number
                      hitRate?: number
                      avgStat?: number
                      isAlternateLine?: boolean
                    }> = []

                    currentSelections.forEach((selection) => {
                      if (selection.current_odds?.bookmakers) {
                        let bestLegOdds = Number.NEGATIVE_INFINITY
                        let bestLegData: any = null

                        Object.entries(selection.current_odds.bookmakers).forEach(([sportsbookId, odds]) => {
                          const price = (odds as any).price
                          if (price && price > bestLegOdds) {
                            bestLegOdds = price
                            const hitRateData = getHitRateForSelection(selection)

                            bestLegData = {
                              player: selection.player_name,
                              market: getMarketLabel(selection.market),
                              odds: price,
                              originalOdds: selection.original_odds || -110, // Fallback for missing original odds
                              sportsbook: getSportsbookInfo(sportsbookId).name,
                              edge: selection.original_odds
                                ? ((price - selection.original_odds) / selection.original_odds) * 100
                                : 0,
                              hitRate: hitRateData?.last_10_hit_rate,
                              avgStat: hitRateData?.avg_stat_per_game,
                              isAlternateLine: hitRateData?.is_alternate_line,
                            }
                          }
                        })

                        if (bestLegData && (bestLegData.edge > 0 || !originalDataAvailable)) {
                          bestValueLegs.push(bestLegData)
                        }
                      }
                    })

                    // Sort by edge and take top 3 (or by hit rate if no edge data)
                    bestValueLegs.sort((a, b) => {
                      if (originalDataAvailable) {
                        return b.edge - a.edge
                      } else {
                        // Sort by hit rate when no original odds available
                        return (b.hitRate || 0) - (a.hitRate || 0)
                      }
                    })
                    const topValueLegs = bestValueLegs.slice(0, 3)

                    // Hit Rate Analysis
                    const hitRateAnalysis = currentSelections
                      .map((selection) => {
                        const hitRateData = getHitRateForSelection(selection)
                        return {
                          player: selection.player_name,
                          market: getMarketLabel(selection.market),
                          line: selection.line,
                          l10HitRate: hitRateData?.last_10_hit_rate || 0,
                          seasonHitRate: hitRateData?.season_hit_rate || 0,
                          avgStat: hitRateData?.avg_stat_per_game || 0,
                          isAlternateLine: hitRateData?.is_alternate_line || false,
                          hasData: !!hitRateData,
                        }
                      })
                      .filter((item) => item.hasData)

                    const avgHitRate =
                      hitRateAnalysis.length > 0
                        ? hitRateAnalysis.reduce((sum, item) => sum + item.l10HitRate, 0) / hitRateAnalysis.length
                        : 0

                    const highConfidencePicks = hitRateAnalysis.filter((item) => item.l10HitRate >= 70).length
                    const alternateLinesCount = hitRateAnalysis.filter((item) => item.isAlternateLine).length

                    // Enhanced OddSmash Score calculation
                    const booksBeaten = Object.values(parlayResults).filter(
                      (result) => result.hasAllSelections && result.parlayOdds && result.parlayOdds < bestOdds,
                    ).length
                    const totalBooks = Math.max(Object.keys(parlayResults).length, 1)

                    // Scoring components (Total: 100 points max)
                    let edgeScore = 0
                    if (originalDataAvailable && bestPayoutOn100 > 0 && originalPayoutOn100 > 0) {
                      const edgePercent = ((bestPayoutOn100 - originalPayoutOn100) / originalPayoutOn100) * 100
                      edgeScore = Math.min(Math.max(edgePercent * 1.5, 0), 35) // Up to 35 points for value edge
                    } else {
                      // Alternative scoring when no original odds available
                      edgeScore = Math.min((bestPayoutOn100 / 100) * 4, 18) // Base scoring on absolute payout
                    }

                    const marketBeatScore = (booksBeaten / totalBooks) * 20 // Up to 20 points
                    const hitRateScore = Math.min((avgHitRate / 100) * 25, 25) // Up to 25 points for hit rate
                    const confidenceBonus = Math.min(highConfidencePicks * 2, 10) // Up to 10 points (2 per high-confidence pick)
                    const alternateLineBonus = Math.min(alternateLinesCount * 1.5, 5) // Up to 5 points for alternate lines
                    const dataQualityScore = hitRateAnalysis.length > 0 ? 5 : 0 // 5 points for having hit rate data

                    const rawScore =
                      edgeScore +
                      marketBeatScore +
                      hitRateScore +
                      confidenceBonus +
                      alternateLineBonus +
                      dataQualityScore
                    const oddsmashScore = Math.round(Math.min(Math.max(rawScore, 0), 100))

                    // Market volatility analysis
                    const oddsSpread =
                      bestOdds && Object.values(parlayResults).length > 1
                        ? Object.values(parlayResults)
                            .filter((result) => result.hasAllSelections && result.parlayOdds)
                            .map((result) => result.parlayOdds!)
                            .reduce(
                              (acc, odds) => {
                                // Calculate profit (winnings) on $100 bet for American odds
                                const payout = odds > 0 
                                  ? odds  // For +odds, you win the odds amount on $100
                                  : (100 * 100) / Math.abs(odds)  // For -odds, you win (100 * stake) / |odds|
                                return { min: Math.min(acc.min, payout), max: Math.max(acc.max, payout) }
                              },
                              { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
                            )
                        : null

                    const marketVolatility = oddsSpread ? ((oddsSpread.max - oddsSpread.min) / oddsSpread.min) * 100 : 0

                    return (
                      <div className="space-y-5">
                        {/* Primary Value Display */}
                        {originalDataAvailable && potentialGain > 0 ? (
                          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 p-5 text-white">
                            <div className="relative z-10">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="rounded-full bg-white/20 p-2">
                                  <TrendingUp className="h-4 w-4" />
                                </div>
                                <span className="text-base font-medium opacity-90">Potential Gain</span>
                              </div>
                              <div className="text-3xl font-bold mb-2">
                                +${potentialGain.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                              </div>
                              <div className="text-sm opacity-80">
                                vs original • {bestSportsbook ? getSportsbookInfo(bestSportsbook).name : "best book"}
                              </div>
                            </div>
                            <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10"></div>
                          </div>
                        ) : (
                          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-5 text-white">
                            <div className="relative z-10">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="rounded-full bg-white/20 p-2">
                                  <PieChart className="h-4 w-4" />
                                </div>
                                <span className="text-base font-medium opacity-90">$100 Bet Wins</span>
                              </div>
                              <div className="text-3xl font-bold mb-2">
                                ${bestPayoutOn100.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                              </div>
                              <div className="text-sm opacity-80">
                                on $100 • {bestSportsbook ? getSportsbookInfo(bestSportsbook).name : "best book"}
                              </div>
                            </div>
                            <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10"></div>
                          </div>
                        )}

                        {/* Hit Rate Intelligence */}
                        {hitRateAnalysis.length > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 p-5 cursor-help">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-2">
                                    <Target className="h-4 w-4 text-amber-600" />
                                  </div>
                                  <span className="text-base font-semibold text-amber-800 dark:text-amber-200">
                                    Hit Rate Intelligence
                                  </span>
                                  <Info className="h-4 w-4 text-amber-600 opacity-60" />
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div className="text-center">
                                    <div
                                      className={`text-xl font-bold ${
                                        avgHitRate >= 70
                                          ? "text-emerald-600"
                                          : avgHitRate >= 50
                                            ? "text-amber-600"
                                            : "text-red-600"
                                      }`}
                                    >
                                      {avgHitRate.toFixed(0)}%
                                    </div>
                                    <div className="text-sm text-amber-600 dark:text-amber-400">Avg L10 Hit Rate</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-xl font-bold text-amber-700 dark:text-amber-400">
                                      {highConfidencePicks}/{hitRateAnalysis.length}
                                    </div>
                                    <div className="text-sm text-amber-600 dark:text-amber-400">High Confidence</div>
                                  </div>
                                </div>
                                {alternateLinesCount > 0 && (
                                  <div className="flex items-center gap-2 mb-3">
                                    <Badge
                                      variant="outline"
                                      className="text-sm bg-amber-100 text-amber-700 border-amber-300"
                                    >
                                      {alternateLinesCount} Alternate Line{alternateLinesCount > 1 ? "s" : ""}
                                    </Badge>
                                    <span className="text-sm text-amber-600 dark:text-amber-400">
                                      Custom calculations applied
                                    </span>
                                  </div>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-xs">
                              <div className="space-y-1 text-sm">
                                <div className="font-semibold">Hit Rate Intelligence:</div>
                                <div>• Avg L10: Average success rate over last 10 games</div>
                                <div>• High Confidence: Picks with 70%+ hit rate</div>
                                <div>• Alt Lines: Custom calculations for non-standard lines</div>
                                <div className="pt-1 border-t border-gray-200 dark:border-gray-600">
                                  <div className="text-gray-500">Based on historical player performance data</div>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}

                        {/* Market Analysis */}
                        {marketVolatility > 5 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="rounded-2xl bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 border border-cyan-200 dark:border-cyan-800 p-5 cursor-help">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="rounded-full bg-cyan-100 dark:bg-cyan-900/30 p-2">
                                    <BarChart3 className="h-4 w-4 text-cyan-600" />
                                  </div>
                                  <span className="text-base font-semibold text-cyan-800 dark:text-cyan-200">
                                    Market Volatility
                                  </span>
                                  <Info className="h-4 w-4 text-cyan-600 opacity-60" />
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="text-sm text-cyan-600 dark:text-cyan-400">
                                    {marketVolatility.toFixed(1)}% spread across books
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className={`text-sm ${
                                      marketVolatility > 15
                                        ? "bg-red-50 text-red-700 border-red-300"
                                        : marketVolatility > 10
                                          ? "bg-yellow-50 text-yellow-700 border-yellow-300"
                                          : "bg-green-50 text-green-700 border-green-300"
                                    }`}
                                  >
                                    {marketVolatility > 15 ? "High" : marketVolatility > 10 ? "Medium" : "Low"}
                                  </Badge>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-xs">
                              <div className="space-y-1 text-sm">
                                <div className="font-semibold">Market Volatility:</div>
                                <div>• Measures price differences across sportsbooks</div>
                                <div>• High volatility = bigger spreads between books</div>
                                <div>• Low volatility = market consensus on pricing</div>
                                <div className="pt-1 border-t border-gray-200 dark:border-gray-600">
                                  <div className="text-gray-500">
                                    Higher volatility often means better shopping opportunities
                                  </div>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}

                        {/* Best Picks Analysis */}
                        {topValueLegs.length > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 p-5 cursor-help">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2">
                                    <Sparkles className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <span className="text-base font-semibold text-blue-800 dark:text-blue-200">
                                    {originalDataAvailable ? "Best Value Picks" : "Top Picks by Performance"}
                                  </span>
                                  <Info className="h-4 w-4 text-blue-600 opacity-60" />
                                </div>
                                <div className="space-y-3">
                                  {topValueLegs.slice(0, 5).map((leg, index) => (
                                    <div key={index} className="flex justify-between items-start gap-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="text-base font-medium text-blue-700 dark:text-blue-400 truncate">
                                          {leg.player}
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap mt-1">
                                          <div className="text-sm text-blue-600 dark:text-blue-500">
                                            {formatOddsClean(leg.odds)} • {leg.sportsbook}
                                          </div>
                                          {leg.hitRate && (
                                            <Badge
                                              variant="outline"
                                              className={`text-xs ${
                                                leg.hitRate >= 70
                                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                                  : leg.hitRate >= 50
                                                    ? "bg-amber-50 text-amber-700 border-amber-300"
                                                    : "bg-red-50 text-red-700 border-red-300"
                                              }`}
                                            >
                                              {leg.hitRate}% L10
                                            </Badge>
                                          )}
                                          {leg.isAlternateLine && (
                                            <Badge
                                              variant="outline"
                                              className="text-xs bg-purple-50 text-purple-700 border-purple-300"
                                            >
                                              Alt Line
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      {originalDataAvailable && leg.edge > 0 ? (
                                        <Badge
                                          variant="outline"
                                          className="text-sm bg-blue-50 text-blue-700 border-blue-300 shrink-0"
                                        >
                                          +{leg.edge.toFixed(1)}%
                                        </Badge>
                                      ) : leg.avgStat ? (
                                        <Badge
                                          variant="outline"
                                          className="text-sm bg-slate-50 text-slate-700 border-slate-300 shrink-0"
                                        >
                                          {leg.avgStat} avg
                                        </Badge>
                                      ) : null}
                                    </div>
                                  ))}
                                  {topValueLegs.length > 5 && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="text-sm text-blue-600 dark:text-blue-400 cursor-help border-b border-dashed border-blue-400 inline-block">
                                          +{topValueLegs.length - 5} more picks analyzed
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>More Analysis Coming Soon</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-xs">
                              <div className="space-y-1 text-sm">
                                <div className="font-semibold">Best Picks Analysis:</div>
                                <div>• Ranked by value edge or performance data</div>
                                <div>• Shows top 2 picks with best odds/hit rates</div>
                                <div>• L10: Last 10 games hit rate percentage</div>
                                <div>• Alt Line: Custom line calculations applied</div>
                                <div className="pt-1 border-t border-gray-200 dark:border-gray-600">
                                  <div className="text-gray-500">Combines odds value with historical performance</div>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}

                        {/* Data Quality Indicator */}
                        {!originalDataAvailable && (
                          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4">
                            <div className="flex items-center gap-3">
                              <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-1.5">
                                <Info className="h-4 w-4 text-amber-600" />
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                <span className="font-medium">Note:</span> Original odds unavailable - analysis based on
                                current market data
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Full-Width Odds Comparison Section - Now Using Component */}
          <OddsComparisonCard
            parlayResults={parlayResults}
            bestSportsbook={bestSportsbook}
            bestOdds={bestOdds}
            currentSelections={currentSelections}
            originalAmericanOdds={(() => {
              const originalTotalOdds = currentSelections.reduce((acc, sel) => {
                const odds = sel.original_odds
                return acc * (odds > 0 ? odds / 100 + 1 : 100 / Math.abs(odds) + 1)
              }, 1)
              return originalTotalOdds >= 2
                ? Math.round((originalTotalOdds - 1) * 100)
                : Math.round(-100 / (originalTotalOdds - 1))
            })()}
            betAmount={betAmount}
            expandedOddsComparison={expandedOddsComparison}
            getSportsbookInfo={getSportsbookInfo}
            hasDeepLinking={hasDeepLinking}
            getLegOddsForSportsbook={getLegOddsForSportsbook}
            getHitRateForSelection={getHitRateForSelection}
            getMarketLabel={getMarketLabel}
            formatOddsClean={formatOddsClean}
            toggleOddsComparisonDropdown={toggleOddsComparisonDropdown}
            handlePlaceBet={handlePlaceBet}
          />
        </div>
      </div>
    </TooltipProvider>
  )
}
