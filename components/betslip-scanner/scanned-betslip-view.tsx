"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import {
  Trophy,
  ExternalLink,
  Sparkles,
  Grid3X3,
  List,
  Edit3,
  Image,
  ChevronDown,
  TrendingDown,
  Camera,
  PieChart,
  BarChart3,
  TrendingUp,
  RefreshCw,
  Eye,
  Info,
  Zap,
  BadgeIcon,
  Target,
  Shield,
  EyeOff,
  Lightbulb,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { sportsbooks } from "@/data/sportsbooks"
import { calculateParlayOdds, formatOdds } from "@/lib/odds-utils"
import { generateSportsbookUrl, type ParlayLeg } from "@/lib/sportsbook-links"
import { cn } from "@/lib/utils"
import { SPORT_MARKETS } from "@/lib/constants/markets"
import { usePlayerHitRates } from "@/hooks/use-hit-rates"
import { formatDistanceToNow } from "date-fns"
import { calculateAllHitRatesForLine, shouldRecalculateForLine } from "@/lib/hit-rate-calculator"

// Import the new components
import { BetslipHeader } from "./betslip-header"
import { SelectionCard } from "./selection-card"
import { QuickStatsCard } from "./quick-stats-card"
import { ValueSnapshotCard } from "./value-snapshot-card"
import { OddsComparisonCard } from "./odds-comparison-card"

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
  const [activeTab, setActiveTab] = useState<'parlay' | 'individual' | 'screenshot'>('parlay')
  const [viewMode, setViewMode] = useState<'cards' | 'chart'>('cards')
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
      console.log('No hitRatesData available')
      return null
    }
    
    const playerName = selection.player_name || selection.description?.split(' ')?.[0] || ''
    
    
    
    // Hit rate data is stored with player name as key, not compound key
    const rawHitRateData = hitRatesData[playerName] || null
    
    if (!rawHitRateData) {
      console.log('No hit rate data found for player')
      return null
    }

    // Process hit rate data based on bet type and line
    const betType = selection.bet_type || 'over'
    const line = selection.line || rawHitRateData.line
    
    
    // If it's an under bet, we need to flip the hit rates
    if (betType === 'under') {
      // For under bets, flip all the percentages
      const processedData = {
        ...rawHitRateData,
        bet_type: 'under',
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
        // Import the calculator function dynamically to avoid module issues
        const { calculateAllHitRatesForLine } = require('@/lib/hit-rate-calculator')
        const recalculatedData = calculateAllHitRatesForLine(rawHitRateData, line, betType)
        

        return recalculatedData
      } catch (error) {

        // Fall back to original data
        return rawHitRateData
      }
    }
    
    // Return original data for standard over bets
    const result = {
      ...rawHitRateData,
      bet_type: 'over',
      line: line
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
  const shareToTwitter = () => {
    const text = `Just found the best odds for this ${betslip.sportsbook} betslip with ${betslip.total_selections} picks! 🎯`
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const shareToReddit = () => {
    const title = `${betslip.sportsbook} Betslip - ${betslip.total_selections} picks with odds comparison`
    const url = `https://reddit.com/submit?title=${encodeURIComponent(title)}&url=${encodeURIComponent(window.location.href)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const shareToLinkedIn = () => {
    const title = `${betslip.sportsbook} Betslip Odds Comparison`
    const summary = `Compare odds for this ${betslip.total_selections}-pick parlay across all major sportsbooks`
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(summary)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // Calculate parlay odds for each sportsbook
  const calculateParlayComparison = () => {
    const parlayResults: Record<string, any> = {}

    // Get selections that have current odds
    const selectionsWithOdds = currentSelections.filter(
      (s) => s.current_odds && s.current_odds.bookmakers && Object.keys(s.current_odds.bookmakers).length > 0,
    )


    
    currentSelections.forEach((selection, i) => {
      const hasOdds = selection.current_odds && selection.current_odds.bookmakers && Object.keys(selection.current_odds.bookmakers).length > 0
      console.log(`Selection ${i + 1}: ${selection.player_name} - Has odds: ${hasOdds}`)
      if (hasOdds) {
        console.log(`  Available sportsbooks: ${Object.keys(selection.current_odds.bookmakers).join(', ')}`)
      } else {
        console.log(`  Current odds structure:`, selection.current_odds)
      }
    })

    if (selectionsWithOdds.length === 0) {
      console.log('❌ No selections with odds found')
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

    console.log(`🏢 All available sportsbooks: ${Array.from(allSportsbooks).join(', ')}`)

    // Calculate parlay for each sportsbook
    for (const sportsbook of Array.from(allSportsbooks)) {
      const oddsForThisBook: number[] = []
      let hasAllSelections = true

      console.log(`\n📊 Checking ${sportsbook}:`)

      for (const selection of selectionsWithOdds) {
        const bookOdds = selection.current_odds?.bookmakers?.[sportsbook]?.price
        console.log(`  ${selection.player_name}: ${bookOdds || 'N/A'}`)

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
    console.log('📋 Final parlay results:', parlayResults)

    return {
      parlayResults,
      bestSportsbook,
      bestOdds: bestOdds !== Number.NEGATIVE_INFINITY ? bestOdds : null,
    }
  }

  const { parlayResults, bestSportsbook, bestOdds } = calculateParlayComparison()

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
    const supportedSportsbooks = ['fanduel', 'draftkings', 'williamhill_us']
    
    if (!supportedSportsbooks.includes(sportsbookId)) {
      return false
    }
    
    return currentSelections.some(selection => {
      const bookmakers = selection.current_odds?.bookmakers
      if (!bookmakers || !bookmakers[sportsbookId]) return false
      
      const sportsbookData = bookmakers[sportsbookId]
      return sportsbookData.link || sportsbookData.sid
    })
  }

  // Helper function to create parlay legs from current selections
  const createParlayLegs = (sportsbookId: string): ParlayLeg[] => {
    return currentSelections.map(selection => {
      const bookmakers = selection.current_odds?.bookmakers
      
      if (!bookmakers || !bookmakers[sportsbookId]) {
        return {}
      }
      
      const sportsbookData = bookmakers[sportsbookId]
      
      // Base leg data
      const leg: ParlayLeg = {
        eventId: selection.event_id,
        sid: sportsbookData.sid,
        link: sportsbookData.link
      }
      
      // Extract specific parameters based on sportsbook
      if (sportsbookId === 'fanduel' && sportsbookData.link) {
        try {
          const url = new URL(sportsbookData.link)
          const marketId = url.searchParams.get('marketId')
          const selectionId = url.searchParams.get('selectionId')
          
          if (marketId && selectionId) {
            leg.marketId = marketId
            leg.selectionId = selectionId
          }
        } catch (e) {
          console.error(`Error parsing FanDuel link:`, e)
        }
      } else if (sportsbookId === 'draftkings' && sportsbookData.link) {
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
    }).filter((leg: ParlayLeg) => Object.keys(leg).length > 0)
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
      const selection = currentSelections.find(s => s.id === selectionId)
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
        window.open(sportsbookData.link, '_blank', 'noopener,noreferrer')
        toast.success(`Opened ${sportsbookInfo.name} for ${selection.player_name}`)
        return
      }

      // Otherwise, try to generate a single-selection deep link
      const singleLeg: ParlayLeg = {
        eventId: selection.event_id,
        sid: sportsbookData.sid,
        link: sportsbookData.link
      }

      // Extract specific parameters based on sportsbook
      if (sportsbookId === 'fanduel' && sportsbookData.link) {
        try {
          const url = new URL(sportsbookData.link)
          const marketId = url.searchParams.get('marketId')
          const selectionId = url.searchParams.get('selectionId')
          
          if (marketId && selectionId) {
            singleLeg.marketId = marketId
            singleLeg.selectionId = selectionId
          }
        } catch (e) {
          console.error(`Error parsing FanDuel link:`, e)
        }
      } else if (sportsbookId === 'draftkings' && sportsbookData.link) {
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
            state: 'nj', // TODO: Get user's actual state from preferences
            legs: [singleLeg]
          }
          
          const betUrl = generateSportsbookUrl(sportsbookId, linkParams)

          if (betUrl) {
            window.open(betUrl, '_blank', 'noopener,noreferrer')
            toast.success(`Opened ${sportsbookInfo.name} for ${selection.player_name}`)
            return
          }
        } catch (error) {
          console.error('Error generating single selection URL:', error)
        }
      }

      // Fallback to base sportsbook URL for individual selection
      const sportsbook = sportsbooks.find(sb => sb.id === sportsbookId)
      const baseUrl = sportsbook?.url
      if (baseUrl) {
        window.open(baseUrl, '_blank', 'noopener,noreferrer')
        toast.success(`Opened ${sportsbookInfo.name} - please find ${selection.player_name}`)
      } else {
        toast.error("Unable to open sportsbook")
      }
      return
    }

    // Original full parlay betting logic
    const legs = createParlayLegs(sportsbookId)
    
    if (legs.length === 0) {
      // Fallback to base sportsbook URL if no deep linking available
      const sportsbook = sportsbooks.find(sb => sb.id === sportsbookId)
      const baseUrl = sportsbook?.url
      if (baseUrl) {
        window.open(baseUrl, '_blank', 'noopener,noreferrer')
        toast.success(`Opened ${sportsbookInfo.name}`)
      } else {
        toast.error("Unable to open sportsbook")
      }
      return
    }

    try {
      // Generate the deep link URL using the sportsbook-links utility
      const linkParams = {
        state: 'nj', // TODO: Get user's actual state from preferences
        legs: legs
      }
      
      const betUrl = generateSportsbookUrl(sportsbookId, linkParams)

      if (betUrl) {
        window.open(betUrl, '_blank', 'noopener,noreferrer')
        toast.success(`Opened ${sportsbookInfo.name} with your selections`)
      } else {
        // Fallback to base URL
        const sportsbook = sportsbooks.find(sb => sb.id === sportsbookId)
        const baseUrl = sportsbook?.url
        if (baseUrl) {
          window.open(baseUrl, '_blank', 'noopener,noreferrer')
          toast.success(`Opened ${sportsbookInfo.name}`)
        }
      }
    } catch (error) {
      console.error('Error generating sportsbook URL:', error)
      // Fallback to base URL
      const sportsbook = sportsbooks.find(sb => sb.id === sportsbookId)
      const baseUrl = sportsbook?.url
      if (baseUrl) {
        window.open(baseUrl, '_blank', 'noopener,noreferrer')
        toast.success(`Opened ${sportsbookInfo.name}`)
      }
    }
  }

  // Helper function to get proper market label from markets.ts
  const getMarketLabel = (marketKey: string, sport: string = "baseball_mlb"): string => {
    const markets = SPORT_MARKETS[sport] || SPORT_MARKETS["baseball_mlb"]
    const market = markets.find(m => m.value === marketKey || m.apiKey === marketKey)
    return market?.label || marketKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // Helper function to format odds properly (avoid double plus signs)
  const formatOddsClean = (odds: number | string): string => {
    if (typeof odds === 'string') {
      // If it's already a string, check if it already has a + sign
      const numericOdds = parseFloat(odds.replace(/[+]/g, ''))
      return formatOdds(numericOdds)
    }
    return formatOdds(odds)
  }

  // Helper function to get best odds for a selection
  const getBestOddsForSelection = (selection: any): {
    sportsbook: string;
    odds: any;
    price: number;
    info: any;
  } | null => {
    if (!selection.current_odds?.bookmakers) return null
    
    let bestOdds: any = null
    let bestSportsbook: string | null = null
    let bestPrice = -Infinity
    
    Object.entries(selection.current_odds.bookmakers).forEach(([sportsbookId, odds]) => {
      const price = (odds as any).price
      if (price && price > bestPrice) {
        bestPrice = price
        bestOdds = odds
        bestSportsbook = sportsbookId
      }
    })
    
    return bestSportsbook ? {
      sportsbook: bestSportsbook,
      odds: bestOdds,
      price: bestPrice,
      info: getSportsbookInfo(bestSportsbook)
    } : null
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
        hasDeepLink: hasDeepLinking(sportsbookId)
      }))
      .filter(item => item.odds && typeof item.odds === 'number')
      .sort((a, b) => b.odds - a.odds) // Sort by odds descending (best first)
    
    // Find the best odds value
    const bestOddsValue = oddsArray.length > 0 ? oddsArray[0].odds : null
    
    // Mark all items with the best odds as "isBest"
    return oddsArray.map(item => ({
      ...item,
      isBest: bestOddsValue !== null && item.odds === bestOddsValue
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
    return currentSelections.map(selection => {
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
        isMatched: !!selection.event_id
      }
    }).filter(leg => leg.odds !== null) // Only show legs that have odds
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6 max-w-7xl">
          
          {/* Header Section */}
          <BetslipHeader
            betslip={betslip}
            isOwner={isOwner}
            isPublicState={isPublicState}
            isRefreshing={isRefreshing}
            isUpdatingPrivacy={isUpdatingPrivacy}
            canRefresh={canRefresh}
            getTimeUntilNextRefresh={getTimeUntilNextRefresh}
            formatTimeRemaining={formatTimeRemaining}
            handleRefreshOdds={handleRefreshOdds}
            handleTogglePrivacy={handleTogglePrivacy}
            handleCopyLink={handleCopyLink}
            shareToTwitter={shareToTwitter}
            shareToReddit={shareToReddit}
          />

          {/* Public betslip notification - Lighter design */}
          {!isOwner && isPublicState && (
            <div className="mb-3 sm:mb-6">
              <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 rounded-xl p-3 sm:p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 sm:gap-3 text-blue-700 dark:text-blue-300">
                  <div className="p-1.5 sm:p-2 bg-blue-100/80 dark:bg-blue-900/50 rounded-lg">
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                  <span className="font-medium text-sm sm:text-base opacity-90">
                    You're viewing a public betslip. Only the owner can refresh odds or change privacy settings.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Mobile-First Quick Stats - Enhanced */}
          <div className="block lg:hidden mb-4">
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Picks & Books - Enhanced */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 text-white shadow-lg">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Trophy className="h-4 w-4" />
                    <span className="text-xs font-semibold opacity-90">Your Picks</span>
                  </div>
                  <div className="text-2xl font-black mb-0.5">{betslip.total_selections}</div>
                  <div className="text-xs opacity-75 font-medium">
                    📚 {Object.keys(parlayResults).length} books compared
                  </div>
                </div>
                <div className="absolute -right-3 -top-3 h-12 w-12 rounded-full bg-white/10"></div>
              </div>
              
              {/* OddSmash Score - Enhanced */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-3 text-white shadow-lg">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="h-4 w-4" />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 cursor-help">
                          <span className="text-xs font-semibold opacity-90">OddSmash Score</span>
                          <div className="w-3 h-3 rounded-full border border-white/40 flex items-center justify-center">
                            <span className="text-[8px] font-bold opacity-70">i</span>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-64 text-xs">
                        <p>Combines player hit rates (40%) with odds value (60%) to score your betslip from 0-100. Higher scores indicate better value and performance.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="text-2xl font-black mb-0.5">
                    {(() => {
                      // Quick score calculation for mobile
                      const hitRateAnalysis = currentSelections.map(selection => {
                        const hitRateData = getHitRateForSelection(selection)
                        return {
                          l10HitRate: hitRateData?.l10_hit_rate || hitRateData?.last_10_hit_rate || 0,
                          isAlternateLine: hitRateData?.is_alternate_line || false
                        }
                      })
                      const avgHitRate = hitRateAnalysis.length > 0 
                        ? hitRateAnalysis.reduce((sum, item) => sum + item.l10HitRate, 0) / hitRateAnalysis.length 
                        : 0
                      const booksBeaten = Object.values(parlayResults).filter(result => 
                        result.hasAllSelections && result.parlayOdds && result.parlayOdds < bestOdds
                      ).length
                      const totalBooks = Math.max(Object.keys(parlayResults).length, 1)
                      const quickScore = Math.round((avgHitRate * 0.4) + ((booksBeaten / totalBooks) * 60))
                      return `${Math.min(quickScore, 100)}/100`
                    })()}
                  </div>
                  <div className="text-xs opacity-75 font-medium">
                    {(() => {
                      const score = parseInt(((() => {
                        const hitRateAnalysis = currentSelections.map(selection => {
                          const hitRateData = getHitRateForSelection(selection)
                          return {
                            l10HitRate: hitRateData?.l10_hit_rate || hitRateData?.last_10_hit_rate || 0,
                            isAlternateLine: hitRateData?.is_alternate_line || false
                          }
                        })
                        const avgHitRate = hitRateAnalysis.length > 0 
                          ? hitRateAnalysis.reduce((sum, item) => sum + item.l10HitRate, 0) / hitRateAnalysis.length 
                          : 0
                        const booksBeaten = Object.values(parlayResults).filter(result => 
                          result.hasAllSelections && result.parlayOdds && result.parlayOdds < bestOdds
                        ).length
                        const totalBooks = Math.max(Object.keys(parlayResults).length, 1)
                        const quickScore = Math.round((avgHitRate * 0.4) + ((booksBeaten / totalBooks) * 60))
                        return `${Math.min(quickScore, 100)}`
                      })()).split('/')[0])
                      const quality = score >= 80 ? 'Elite' : score >= 60 ? 'Strong' : score >= 40 ? 'Good' : 'Fair'
                      const emoji = score >= 80 ? '🟢' : score >= 60 ? '🟡' : score >= 40 ? '🟠' : '🔴'
                      return `${emoji} ${quality}`
                    })()}
                  </div>
                </div>
                <div className="absolute -right-3 -top-3 h-12 w-12 rounded-full bg-white/10"></div>
              </div>
            </div>
            
            {/* Best Value Card - Mobile */}
            {bestOdds && (
              <div className="bg-gradient-to-r from-green-50 to-green-50 dark:from-green-950/30 dark:to-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-3 mb-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <img
                        src={getSportsbookInfo(bestSportsbook).logo}
                        alt={getSportsbookInfo(bestSportsbook).name}
                        className="w-4 h-4 object-contain"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-green-800 dark:text-green-200">Best Odds</div>
                      <div className="text-xs text-green-600 dark:text-green-400 font-medium">{getSportsbookInfo(bestSportsbook).name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-green-700 dark:text-green-400">
                      +{formatOddsClean(bestOdds).replace('+', '')}
                    </div>
                  </div>
                </div>
                
                {/* Payout Section - Tighter alignment */}
                <div className="flex items-center justify-between mb-3 p-2 bg-green-100/50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-green-200 dark:bg-green-800 rounded">
                      <PieChart className="h-3 w-3 text-green-700 dark:text-green-300" />
                    </div>
                    <span className="text-xs text-green-700 dark:text-green-300 font-semibold">$100 bet wins</span>
                  </div>
                  <div className="text-sm font-black text-green-800 dark:text-green-200">
                    ${(100 * (bestOdds > 0 ? bestOdds / 100 : 100 / Math.abs(bestOdds) - 1)).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  </div>
                </div>
                
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white h-9 text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200"
                  onClick={() => handlePlaceBet(bestSportsbook)}
                >
                  <ExternalLink className="h-3 w-3 mr-2" />
                  ⚡ Place Bet Now
                </Button>
              </div>
            )}

            {/* Selection Cards */}
            <div className="space-y-2 sm:space-y-3">
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
          <div className="hidden lg:grid lg:grid-cols-3 gap-6 lg:items-start">
            
            {/* Left Column - Betslip (2/3 width on desktop) */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-md h-full">
                <CardHeader className="pb-4 px-6 pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                      <Trophy className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">Your Betslip</CardTitle>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {betslip.total_selections} selections • {Object.keys(parlayResults).length} books compared
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  {/* Best Odds Section - Desktop Only */}
                  {bestOdds && (
                    <div className="mb-6 bg-gradient-to-r from-green-50 to-green-50 dark:from-green-950/30 dark:to-green-950/30 border border-green-200 dark:border-green-800 rounded-2xl p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                            <img
                              src={getSportsbookInfo(bestSportsbook).logo}
                              alt={getSportsbookInfo(bestSportsbook).name}
                              className="w-6 h-6 object-contain"
                            />
                          </div>
                          <div>
                            <div className="text-lg font-bold text-green-800 dark:text-green-200">Best Odds Available</div>
                            <div className="text-sm text-green-600 dark:text-green-400 font-medium">{getSportsbookInfo(bestSportsbook).name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-black text-green-700 dark:text-green-400">
                            {formatOddsClean(bestOdds)}
                          </div>
                          <div className="text-sm text-green-600 dark:text-green-400 font-medium">American Odds</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        {/* Payout Info */}
                        <div className="flex items-center gap-3 p-3 bg-green-100/50 dark:bg-green-900/20 rounded-xl">
                          <div className="p-2 bg-green-200 dark:bg-green-800 rounded-lg">
                            <PieChart className="h-4 w-4 text-green-700 dark:text-green-300" />
                          </div>
                          <div>
                            <div className="text-xs text-green-700 dark:text-green-300 font-semibold uppercase tracking-wide">$100 Bet Wins</div>
                            <div className="text-lg font-black text-green-800 dark:text-green-200">
                              ${(100 * (bestOdds > 0 ? bestOdds / 100 : 100 / Math.abs(bestOdds) - 1)).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                            </div>
                          </div>
                        </div>
                        
                        {/* Books Beaten */}
                        <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl">
                          <div className="p-2 bg-blue-200 dark:bg-blue-800 rounded-lg">
                            <Trophy className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                          </div>
                          <div>
                            <div className="text-xs text-blue-700 dark:text-blue-300 font-semibold uppercase tracking-wide">Books Beaten</div>
                            <div className="text-lg font-black text-blue-800 dark:text-blue-200">
                              {Object.values(parlayResults).filter(result => 
                                result.hasAllSelections && result.parlayOdds && result.parlayOdds < bestOdds
                              ).length}/{Object.keys(parlayResults).length}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base font-bold shadow-md hover:shadow-lg transition-all duration-200"
                        onClick={() => handlePlaceBet(bestSportsbook)}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Place Bet at {getSportsbookInfo(bestSportsbook).name}
                      </Button>
                    </div>
                  )}

                  {/* Desktop Selection Cards */}
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
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Stats & Odds Comparison (1/3 width on desktop) */}
            <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          
          {/* Quick Stats Card */}
          <Card className="border-0 shadow-lg bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
  <CardHeader className="pb-3">
    <CardTitle className="text-base font-bold flex items-center gap-2">
      <BarChart3 className="h-4 w-4 text-blue-600" />
      Quick Stats
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {(() => {
      // Calculate enhanced stats
      const originalTotalOdds = currentSelections.reduce((acc, sel) => {
        const odds = sel.original_odds
        return acc * (odds > 0 ? odds / 100 + 1 : 100 / Math.abs(odds) + 1)
      }, 1)
      const originalAmericanOdds = originalTotalOdds >= 2 ? Math.round((originalTotalOdds - 1) * 100) : Math.round(-100 / (originalTotalOdds - 1))
      const originalPayout = originalAmericanOdds > 0 ? originalAmericanOdds / 100 * 100 : 100 / Math.abs(originalAmericanOdds) * 100
      const bestPayout = bestOdds > 0 ? bestOdds / 100 * 100 : 100 / Math.abs(bestOdds) * 100
      const valueEdge = bestOdds && originalAmericanOdds ? ((bestPayout - originalPayout) / originalPayout) * 100 : 0
      const winDelta = bestPayout - originalPayout
      const booksBeaten = Object.values(parlayResults).filter(result => 
        result.hasAllSelections && result.parlayOdds && result.parlayOdds < bestOdds
      ).length
      
      // Hit rate analysis for OddSmash Score calculation
      const hitRateAnalysis = currentSelections.map(selection => {
        const hitRateData = getHitRateForSelection(selection)
        console.log('🎯 INLINE ODDSMASH SCORE DEBUG - Selection:', {
          playerName: selection.player_name,
          market: selection.market,
          hitRateData: hitRateData,
          hasHitRateData: !!hitRateData,
          l10HitRate: hitRateData?.l10_hit_rate || hitRateData?.last_10_hit_rate || 0,
          isAlternateLine: hitRateData?.is_alternate_line || false
        })
        return {
          l10HitRate: hitRateData?.l10_hit_rate || hitRateData?.last_10_hit_rate || 0,
          isAlternateLine: hitRateData?.is_alternate_line || false
        }
      })
      
      const avgHitRate = hitRateAnalysis.length > 0 
        ? hitRateAnalysis.reduce((sum, item) => sum + item.l10HitRate, 0) / hitRateAnalysis.length 
        : 0
      
      const highConfidencePicks = hitRateAnalysis.filter(item => item.l10HitRate >= 70).length
      const alternateLinesCount = hitRateAnalysis.filter(item => item.isAlternateLine).length
      
      console.log('🎯 INLINE ODDSMASH SCORE ANALYSIS:', {
        hitRateAnalysis,
        avgHitRate,
        highConfidencePicks,
        alternateLinesCount,
        bestOdds,
        originalAmericanOdds,
        parlayResults: Object.keys(parlayResults).length
      })
      
      // Enhanced OddSmash Score calculation
      const totalBooks = Math.max(Object.keys(parlayResults).length, 1)
      let edgeScore = 0
      if (bestOdds && originalAmericanOdds && bestPayout > 0 && originalPayout > 0) {
        const edgePercent = ((bestPayout - originalPayout) / originalPayout) * 100
        edgeScore = Math.min(Math.max(edgePercent * 1.5, 0), 35) // Up to 35 points for value edge
      } else {
        // Alternative scoring when no original odds available
        edgeScore = Math.min((bestPayout / 100) * 4, 18) // Base scoring on absolute payout
      }
      
      const marketBeatScore = (booksBeaten / totalBooks) * 20 // Up to 20 points
      const hitRateScore = Math.min((avgHitRate / 100) * 25, 25) // Up to 25 points for hit rate
      const confidenceBonus = Math.min(highConfidencePicks * 2, 10) // Up to 10 points (2 per high-confidence pick)
      const alternateLineBonus = Math.min(alternateLinesCount * 1.5, 5) // Up to 5 points for alternate lines
      const dataQualityScore = hitRateAnalysis.length > 0 ? 5 : 0 // 5 points for having hit rate data
      
      const rawScore = edgeScore + marketBeatScore + hitRateScore + confidenceBonus + alternateLineBonus + dataQualityScore
      const oddsmashScore = Math.round(Math.min(Math.max(rawScore, 0), 100))

      return (
        <>
          {/* Hero Stats - Mobile Optimized */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-white">
              <div className="relative z-10">
                <div className="text-2xl font-bold">{betslip.total_selections}</div>
                <div className="text-xs font-medium opacity-90">Picks</div>
                <div className="text-lg font-semibold mt-1">{Object.keys(parlayResults).length}</div>
                <div className="text-xs font-medium opacity-90">Books</div>
              </div>
              <div className="absolute -right-2 -top-2 h-12 w-12 rounded-full bg-white/10"></div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-4 text-white cursor-help">
                  <div className="relative z-10">
                    <div className="text-2xl font-bold">{oddsmashScore}/100</div>
                    <div className="text-xs font-medium opacity-90">OddSmash Score</div>
                    <div className="text-sm font-semibold mt-1 opacity-90">
                      {oddsmashScore >= 80 ? 'Elite' :
                       oddsmashScore >= 60 ? 'Strong' :
                       oddsmashScore >= 40 ? 'Good' : 'Fair'}
                    </div>
                  </div>
                  <div className="absolute -right-2 -top-2 h-12 w-12 rounded-full bg-white/10"></div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-2 text-xs">
                  <div className="font-semibold">Score Breakdown:</div>
                  <div>• Value Edge: {Math.round(edgeScore)}/35 pts</div>
                  <div>• Hit Rate: {Math.round(hitRateScore)}/25 pts</div>
                  <div>• Market Beat: {Math.round(marketBeatScore)}/20 pts</div>
                  <div>• High Confidence: {Math.round(confidenceBonus)}/10 pts</div>
                  <div>• Data Quality: {dataQualityScore}/5 pts</div>
                  {alternateLineBonus > 0 && <div>• Alt Lines: {Math.round(alternateLineBonus)}/5 pts</div>}
                  <div className="pt-1 border-t border-gray-200 dark:border-gray-600">
                    <div className="font-medium">Total: {Math.round(edgeScore + hitRateScore + marketBeatScore + confidenceBonus + dataQualityScore + alternateLineBonus)}/100</div>
                    <div className="mt-1 text-gray-500">Higher scores indicate better value and stronger data backing</div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Value Metrics */}
          <div className="space-y-3">
            {valueEdge > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border border-emerald-200 dark:border-emerald-800 p-4 cursor-help">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-1.5">
                          <TrendingUp className="h-3 w-3 text-emerald-600" />
                        </div>
                        <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Value Edge</span>
                        <Info className="h-3 w-3 text-emerald-600 opacity-60" />
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                          +{valueEdge.toFixed(1)}%
                        </div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400">vs market</div>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="space-y-1 text-xs">
                    <div className="font-semibold">Value Edge Explained:</div>
                    <div>• Percentage advantage over your original odds</div>
                    <div>• Higher percentages indicate better value</div>
                    <div>• Based on current market prices vs. your betslip</div>
                    <div className="pt-1 border-t border-gray-200 dark:border-gray-600">
                      <div className="text-gray-500">Positive edge suggests this bet offers above-market value</div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}

            {winDelta > 10 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border border-orange-200 dark:border-orange-800 p-4 cursor-help">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-orange-100 dark:bg-orange-900/30 p-1.5">
                          <Sparkles className="h-3 w-3 text-orange-600" />
                        </div>
                        <span className="text-sm font-semibold text-orange-800 dark:text-orange-200">Win Bonus</span>
                        <Info className="h-3 w-3 text-orange-600 opacity-60" />
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-orange-700 dark:text-orange-400">
                          +${winDelta.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                        </div>
                        <div className="text-xs text-orange-600 dark:text-orange-400">
                          with {bestSportsbook ? getSportsbookInfo(bestSportsbook).name : 'best book'}
                        </div>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="space-y-1 text-xs">
                    <div className="font-semibold">Win Bonus Explained:</div>
                    <div>• Extra winnings compared to your original sportsbook</div>
                    <div>• Shows potential additional profit on $100 bet</div>
                    <div>• Calculated from best available odds vs. original</div>
                    <div className="pt-1 border-t border-gray-200 dark:border-gray-600">
                      <div className="text-gray-500">Higher bonus means better odds shopping opportunity</div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          
          {/* Secondary Stats */}
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 cursor-help">
                    <Target className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Books Beaten</span>
                    <Info className="h-3 w-3 text-gray-500 opacity-60" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="space-y-1 text-xs">
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
              <Badge variant="outline" className="bg-gray-50 dark:bg-gray-800 font-semibold">
                {booksBeaten}/{Object.keys(parlayResults).length}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 cursor-help">
                    <Shield className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Scan Confidence</span>
                    <Info className="h-3 w-3 text-gray-500 opacity-60" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="space-y-1 text-xs">
                    <div className="font-semibold">Scan Confidence:</div>
                    <div>• AI accuracy in reading your betslip image</div>
                    <div>• Higher percentage means more reliable data</div>
                    <div>• Based on text clarity and recognition quality</div>
                    <div className="pt-1 border-t border-gray-200 dark:border-gray-600">
                      <div className="text-gray-500">80%+ is considered highly accurate</div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
              <Badge 
                variant="outline" 
                className={`font-semibold ${
                  betslip.scan_confidence >= 0.8 
                    ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400"
                    : "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400"
                }`}
              >
                {Math.round(betslip.scan_confidence * 100)}%
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 cursor-help">
                    {isPublicState ? <Eye className="h-4 w-4 text-gray-500" /> : <EyeOff className="h-4 w-4 text-gray-500" />}
                    <span className="text-sm text-gray-600 dark:text-gray-400">Privacy</span>
                    <Info className="h-3 w-3 text-gray-500 opacity-60" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="space-y-1 text-xs">
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
                className={`font-semibold ${
                  isPublicState
                    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400"
                    : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300"
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
<Card className="border-0 sm:shadow-lg bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm">
  <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
    <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
      <TrendingUp className="h-4 w-4 text-green-600" />
      Value Snapshot
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
    {(() => {
      // Enhanced value calculations with better fallback handling
      const hasOriginalOdds = currentSelections.some(sel => sel.original_odds && !isNaN(sel.original_odds))
      
      // Calculate original odds (with fallback for missing data)
      let originalTotalOdds = 1
      let originalDataAvailable = true
      
      if (betslip.original_odds && !isNaN(betslip.original_odds)) {
        originalTotalOdds = betslip.original_odds
      } else if (hasOriginalOdds) {
        originalTotalOdds = currentSelections.reduce((acc, sel) => {
          if (sel.original_odds && !isNaN(sel.original_odds)) {
            return acc * (sel.original_odds > 0 ? sel.original_odds / 100 + 1 : 100 / Math.abs(sel.original_odds) + 1)
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
      
      const originalAmericanOdds = originalTotalOdds >= 2 ? Math.round((originalTotalOdds - 1) * 100) : Math.round(-100 / (originalTotalOdds - 1))
      const originalPayoutOn100 = originalAmericanOdds > 0 ? originalAmericanOdds / 100 * 100 : 100 / Math.abs(originalAmericanOdds) * 100
      const bestPayoutOn100 = bestOdds > 0 ? bestOdds / 100 * 100 : 100 / Math.abs(bestOdds) * 100
      const potentialGain = bestPayoutOn100 - originalPayoutOn100
      
      // Enhanced value leg analysis
      const bestValueLegs: Array<{
        player: string;
        market: string;
        odds: number;
        originalOdds: number;
        sportsbook: string;
        edge: number;
        hitRate?: number;
        avgStat?: number;
        isAlternateLine?: boolean;
      }> = []
      
      currentSelections.forEach(selection => {
        if (selection.current_odds?.bookmakers) {
          let bestLegOdds = -Infinity
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
                edge: selection.original_odds ? ((price - selection.original_odds) / selection.original_odds) * 100 : 0,
                hitRate: hitRateData?.last_10_hit_rate,
                avgStat: hitRateData?.avg_stat_per_game,
                isAlternateLine: hitRateData?.is_alternate_line
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
      const hitRateAnalysis = currentSelections.map(selection => {
        const hitRateData = getHitRateForSelection(selection)
        return {
          player: selection.player_name,
          market: getMarketLabel(selection.market),
          line: selection.line,
          l10HitRate: hitRateData?.last_10_hit_rate || 0,
          seasonHitRate: hitRateData?.season_hit_rate || 0,
          avgStat: hitRateData?.avg_stat_per_game || 0,
          isAlternateLine: hitRateData?.is_alternate_line || false,
          hasData: !!hitRateData
        }
      }).filter(item => item.hasData)
      
      const avgHitRate = hitRateAnalysis.length > 0 
        ? hitRateAnalysis.reduce((sum, item) => sum + item.l10HitRate, 0) / hitRateAnalysis.length 
        : 0
      
      const highConfidencePicks = hitRateAnalysis.filter(item => item.l10HitRate >= 70).length
      const alternateLinesCount = hitRateAnalysis.filter(item => item.isAlternateLine).length
      
      // Enhanced OddSmash Score calculation
      const booksBeaten = Object.values(parlayResults).filter(result => 
        result.hasAllSelections && result.parlayOdds && result.parlayOdds < bestOdds
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
      
      const rawScore = edgeScore + marketBeatScore + hitRateScore + confidenceBonus + alternateLineBonus + dataQualityScore
      const oddsmashScore = Math.round(Math.min(Math.max(rawScore, 0), 100))
      
      // Market volatility analysis
      const oddsSpread = bestOdds && Object.values(parlayResults).length > 1 
        ? Object.values(parlayResults)
            .filter(result => result.hasAllSelections && result.parlayOdds)
            .map(result => result.parlayOdds!)
            .reduce((acc, odds) => {
              const payout = odds > 0 ? odds / 100 * 100 : 100 / Math.abs(odds) * 100
              return { min: Math.min(acc.min, payout), max: Math.max(acc.max, payout) }
            }, { min: Infinity, max: -Infinity })
        : null
      
      const marketVolatility = oddsSpread ? ((oddsSpread.max - oddsSpread.min) / oddsSpread.min) * 100 : 0
      
      return (
        <div className="space-y-3 sm:space-y-4">
          {/* Primary Value Display */}
          {originalDataAvailable && potentialGain > 0 ? (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 p-3 sm:p-4 text-white">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="rounded-full bg-white/20 p-1">
                    <TrendingUp className="h-3 w-3" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium opacity-90">Potential Gain</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold mb-1">+${potentialGain.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</div>
                <div className="text-xs opacity-80">
                  vs original • {bestSportsbook ? getSportsbookInfo(bestSportsbook).name : 'best book'}
                </div>
              </div>
              <div className="absolute -right-3 -top-3 h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-white/10"></div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-3 sm:p-4 text-white">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="rounded-full bg-white/20 p-1">
                    <PieChart className="h-3 w-3" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium opacity-90">Best Available Payout</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold mb-1">${bestPayoutOn100.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</div>
                <div className="text-xs opacity-80">
                  on $100 • {bestSportsbook ? getSportsbookInfo(bestSportsbook).name : 'best book'}
                </div>
              </div>
              <div className="absolute -right-3 -top-3 h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-white/10"></div>
            </div>
          )}
          
          
          {/* Hit Rate Intelligence */}
          {hitRateAnalysis.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 p-3 sm:p-4 cursor-help">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-1.5">
                      <Target className="h-3 w-3 text-amber-600" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-amber-800 dark:text-amber-200">Hit Rate Intelligence</span>
                    <Info className="h-3 w-3 text-amber-600 opacity-60" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="text-center">
                      <div className={`text-base sm:text-lg font-bold ${
                        avgHitRate >= 70 ? 'text-emerald-600' :
                        avgHitRate >= 50 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {avgHitRate.toFixed(0)}%
                      </div>
                      <div className="text-xs text-amber-600 dark:text-amber-400">Avg L10 Hit Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-base sm:text-lg font-bold text-amber-700 dark:text-amber-400">
                        {highConfidencePicks}/{hitRateAnalysis.length}
                      </div>
                      <div className="text-xs text-amber-600 dark:text-amber-400">High Confidence</div>
                    </div>
                  </div>
                  {alternateLinesCount > 0 && (
                    <div className="flex items-center gap-1 mb-2">
                      <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300">
                        {alternateLinesCount} Alternate Line{alternateLinesCount > 1 ? 's' : ''}
                      </Badge>
                      <span className="text-xs text-amber-600 dark:text-amber-400">
                        Custom calculations applied
                      </span>
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <div className="space-y-1 text-xs">
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
                <div className="rounded-2xl bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 border border-cyan-200 dark:border-cyan-800 p-3 sm:p-4 cursor-help">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="rounded-full bg-cyan-100 dark:bg-cyan-900/30 p-1.5">
                      <BarChart3 className="h-3 w-3 text-cyan-600" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-cyan-800 dark:text-cyan-200">Market Volatility</span>
                    <Info className="h-3 w-3 text-cyan-600 opacity-60" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-cyan-600 dark:text-cyan-400">
                      {marketVolatility.toFixed(1)}% spread across books
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        marketVolatility > 15 
                          ? 'bg-red-50 text-red-700 border-red-300'
                          : marketVolatility > 10
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                          : 'bg-green-50 text-green-700 border-green-300'
                      }`}
                    >
                      {marketVolatility > 15 ? 'High' : marketVolatility > 10 ? 'Medium' : 'Low'}
                    </Badge>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <div className="space-y-1 text-xs">
                  <div className="font-semibold">Market Volatility:</div>
                  <div>• Measures price differences across sportsbooks</div>
                  <div>• High volatility = bigger spreads between books</div>
                  <div>• Low volatility = market consensus on pricing</div>
                  <div className="pt-1 border-t border-gray-200 dark:border-gray-600">
                    <div className="text-gray-500">Higher volatility often means better shopping opportunities</div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
          
          {/* Best Picks Analysis */}
          {topValueLegs.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 p-3 sm:p-4 cursor-help">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-1.5">
                      <Sparkles className="h-3 w-3 text-blue-600" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-blue-800 dark:text-blue-200">
                      {originalDataAvailable ? 'Best Value Picks' : 'Top Picks by Performance'}
                    </span>
                    <Info className="h-3 w-3 text-blue-600 opacity-60" />
                  </div>
                  <div className="space-y-2">
                    {topValueLegs.slice(0, 2).map((leg, index) => (
                      <div key={index} className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-400 truncate">
                            {leg.player}
                          </div>
                          <div className="flex items-center gap-1 flex-wrap">
                            <div className="text-xs text-blue-600 dark:text-blue-500">
                              {formatOddsClean(leg.odds)} • {leg.sportsbook}
                            </div>
                            {leg.hitRate && (
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  leg.hitRate >= 70 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                    : leg.hitRate >= 50
                                    ? 'bg-amber-50 text-amber-700 border-amber-300'
                                    : 'bg-red-50 text-red-700 border-red-300'
                                }`}
                              >
                                {leg.hitRate}% L10
                              </Badge>
                            )}
                            {leg.isAlternateLine && (
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-300">
                                Alt Line
                              </Badge>
                            )}
                          </div>
                        </div>
                        {originalDataAvailable && leg.edge > 0 ? (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300 shrink-0">
                            +{leg.edge.toFixed(1)}%
                          </Badge>
                        ) : leg.avgStat ? (
                          <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-300 shrink-0">
                            {leg.avgStat} avg
                          </Badge>
                        ) : null}
                      </div>
                    ))}
                    {topValueLegs.length > 2 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-xs text-blue-600 dark:text-blue-400 cursor-help border-b border-dashed border-blue-400 inline-block">
                            +{topValueLegs.length - 2} more picks analyzed
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Upgrade to Pro for complete analysis</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <div className="space-y-1 text-xs">
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
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-2 sm:p-3">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-1">
                  <Info className="h-3 w-3 text-amber-600" />
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Note:</span> Original odds unavailable - analysis based on current market data
                </div>
              </div>
            </div>
          )}
        </div>
      )
    })()}
  </CardContent>
</Card>

              {/* Additional Insights Card - For Better Balance */}
              
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
              return originalTotalOdds >= 2 ? Math.round((originalTotalOdds - 1) * 100) : Math.round(-100 / (originalTotalOdds - 1))
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
