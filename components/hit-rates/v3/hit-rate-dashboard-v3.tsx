"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import { SupportedSport, SPORT_CONFIGS, SportMarket } from "@/types/sports"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination"
import { useMediaQuery } from "@/hooks/use-media-query"
import FeedbackButton from "@/components/shared/FeedbackButton"
import { Card } from "@/components/ui/card"
import HitRateTableV3 from "./hit-rate-table-v3"
import HitRateFiltersV3 from "./hit-rate-filters-v3"
import { useHitRates, usePlayerOdds, HitRatesResponse, fetchHitRatesData } from "@/hooks/use-hit-rates"
import { PlayerHitRateProfile } from "@/types/hit-rates"
import { PlayerPropOdds, fetchBestOddsForHitRateProfiles } from "@/services/player-prop-odds"
import { fetchPlayerTeamData } from "@/services/teams"
import { useQueryClient } from "@tanstack/react-query"

// Interface for player team data (like v2)
interface PlayerTeamData {
  player_id: number
  team_abbreviation: string
  team_name: string
  position_abbreviation: string
}

interface HitRateDashboardV3Props {
  sport: SupportedSport
  market: SportMarket
}

export default function HitRateDashboardV3({ sport, market: initialMarket }: HitRateDashboardV3Props) {
  const router = useRouter()
  const pathname = usePathname()
  
  // Memoize sportConfig to prevent unnecessary re-renders
  const sportConfig = useMemo(() => SPORT_CONFIGS[sport], [sport])
  
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentMarket, setCurrentMarket] = useState<SportMarket>(initialMarket)
  const [currentViewMode, setCurrentViewMode] = useState<"table" | "grid">("table")
  const [sortField, setSortField] = useState("L10")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [customTier, setCustomTier] = useState<number | null>(null)
  const [selectedGames, setSelectedGames] = useState<string[] | null>(null)
  const [playerTeamData, setPlayerTeamData] = useState<Record<number, PlayerTeamData>>({})
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Update currentMarket when initialMarket prop changes (URL navigation)
  useEffect(() => {
    setCurrentMarket(initialMarket)
  }, [initialMarket])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, currentMarket, selectedGames, customTier, sortField, sortDirection])

  // Fetch hit rates with pagination
  const {
    data: hitRatesData,
    isLoading,
    isError,
    error,
    isFetching
  } = useHitRates({
    sport,
    market: currentMarket,
    page: currentPage,
    limit: 25,
    sortField,
    sortDirection,
    selectedGames,
  })

  // Prefetch common sort orders in background for seamless switching
  const queryClient = useQueryClient()
  useEffect(() => {
    // Prefetch ALL common sort fields for instant switching
    // This covers: performance metrics (L5/L10/L20), season data, player info, and betting lines
    const commonSortFields = ['L5', 'L10', 'L20', 'seasonHitRate', 'name', 'line', 'average']
    const currentSortField = sortField
    
    // Prefetch other common sort orders for page 1
    commonSortFields.forEach(field => {
      if (field !== currentSortField) {
        // Prefetch current sort direction
        queryClient.prefetchQuery({
          queryKey: ['hitRates', sport, currentMarket, 1, 25, field, sortDirection, selectedGames],
          queryFn: () => fetchHitRatesData({ 
            sport, 
            market: currentMarket, 
            page: 1, 
            limit: 25, 
            sortField: field, 
            sortDirection,
            selectedGames
          }),
          staleTime: 30000, // Consider fresh for 30 seconds
        })
        
        // For performance fields (L5, L10, L20, seasonHitRate), also prefetch opposite direction
        // since users often want to see both highest and lowest performers
        if (['L5', 'L10', 'L20', 'seasonHitRate', 'average'].includes(field)) {
          const oppositeDirection = sortDirection === 'asc' ? 'desc' : 'asc'
          queryClient.prefetchQuery({
            queryKey: ['hitRates', sport, currentMarket, 1, 25, field, oppositeDirection, selectedGames],
            queryFn: () => fetchHitRatesData({ 
              sport, 
              market: currentMarket, 
              page: 1, 
              limit: 25, 
              sortField: field, 
              sortDirection: oppositeDirection,
              selectedGames
            }),
            staleTime: 30000,
          })
        }
      }
    })
    
    // Also prefetch the opposite sort direction for current field
    const oppositeCurrentDirection = sortDirection === 'asc' ? 'desc' : 'asc'
    queryClient.prefetchQuery({
      queryKey: ['hitRates', sport, currentMarket, 1, 25, currentSortField, oppositeCurrentDirection, selectedGames],
      queryFn: () => fetchHitRatesData({ 
        sport, 
        market: currentMarket, 
        page: 1, 
        limit: 25, 
        sortField: currentSortField, 
        sortDirection: oppositeCurrentDirection,
        selectedGames
      }),
      staleTime: 30000,
    })

    // 🚀 NEW: Prefetch common markets for instant switching
    const commonMarkets = ['Hits', 'Home Runs', 'Total Bases', 'RBIs', 'Strikeouts']
    commonMarkets.forEach(market => {
      if (market !== currentMarket) {
        queryClient.prefetchQuery({
          queryKey: ['hitRates', sport, market, 1, 25, 'L10', 'desc', null],
          queryFn: () => fetchHitRatesData({ 
            sport, 
            market: market as SportMarket, 
            page: 1, 
            limit: 25, 
            sortField: 'L10', 
            sortDirection: 'desc',
            selectedGames: null
          }),
          staleTime: 60000, // Keep market data fresh for 1 minute
        })
      }
    })

    // 🚀 NEW: Prefetch next 2 pages for smooth pagination
    if (hitRatesData?.totalPages) {
      for (let nextPage = currentPage + 1; nextPage <= Math.min(currentPage + 2, hitRatesData.totalPages); nextPage++) {
        queryClient.prefetchQuery({
          queryKey: ['hitRates', sport, currentMarket, nextPage, 25, sortField, sortDirection, selectedGames],
          queryFn: () => fetchHitRatesData({ 
            sport, 
            market: currentMarket, 
            page: nextPage, 
            limit: 25, 
            sortField, 
            sortDirection,
            selectedGames
          }),
          staleTime: 30000,
        })
      }
    }
  }, [sport, currentMarket, sortDirection, sortField, queryClient, selectedGames, currentPage, hitRatesData?.totalPages])

  // Check if data is already cached for better UX
  const queryKey = ['hitRates', sport, currentMarket, currentPage, 25, sortField, sortDirection, selectedGames]
  const cachedData = queryClient.getQueryData(queryKey)
  const isDataCached = !!cachedData
  
  // Use a more subtle loading state when data is cached
  const showFullLoader = isLoading && !isDataCached

  // Get displayed player IDs from current page
  const displayedPlayerIds = useMemo(() => 
    hitRatesData?.profiles.map((p: PlayerHitRateProfile) => p.player_id) ?? [], 
    [hitRatesData?.profiles]
  )

  // Fetch odds only for displayed players
  const {
    data: oddsData = {},
    isLoading: isLoadingOdds
  } = usePlayerOdds({
    playerIds: displayedPlayerIds,
    sport,
    market: currentMarket
  })

  // Get custom tier options for the current market
  const getCustomTierOptions = (market: SportMarket): number[] => {
    // Define custom tier options based on market type
    switch (market) {
      case "Hits":
        return [1, 2, 3]
      case "Total Bases":
        return [1, 2, 3, 4, 5]
      case "RBIs":
        return [1, 2, 3, 4]
      case "Home Runs":
        return [1, 2]
      case "Strikeouts":
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      default:
        return [1, 2, 3]
    }
  }

  // Handle filter callbacks
  const handleMarketChange = (market: SportMarket) => {
    setCurrentMarket(market)
    setCustomTier(null) // Reset custom tier when market changes
    
    // Update URL to reflect the new market
    const newPath = pathname.replace(/\/[^\/]+$/, `/${encodeURIComponent(market)}`)
    router.push(newPath)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
  }

  const handleViewModeChange = (mode: "table" | "grid") => {
    setCurrentViewMode(mode)
  }

  const handleSortChange = (field: string, direction: "asc" | "desc") => {
    setSortField(field)
    setSortDirection(direction)
  }

  const handleGameFilterChange = (gameIds: string[] | null) => {
    setSelectedGames(gameIds)
  }

  const handleRefreshData = () => {
    // TODO: Implement data refresh logic
    window.location.reload()
  }

  // Extract available games from hit rates data for game filter
  const availableGames = useMemo(() => {
    if (!hitRatesData?.profiles) return []
    
    const gamesMap = new Map()
    const now = new Date()
    
    hitRatesData.profiles.forEach((profile: PlayerHitRateProfile) => {
      if (profile.odds_event_id && profile.home_team && profile.away_team && profile.commence_time) {
        const gameTime = new Date(profile.commence_time)
        
        // Only include games that haven't started yet
        if (gameTime > now) {
          gamesMap.set(profile.odds_event_id, {
            odds_event_id: profile.odds_event_id,
            home_team: profile.home_team,
            away_team: profile.away_team,
            commence_time: profile.commence_time,
          })
        }
      }
    })
    
    // Convert to array and sort by commence_time (earliest first)
    return Array.from(gamesMap.values()).sort((a, b) => {
      const timeA = new Date(a.commence_time).getTime()
      const timeB = new Date(b.commence_time).getTime()
      return timeA - timeB
    })
  }, [hitRatesData?.profiles])

  // Use server data directly (sorting and game filtering now handled server-side)
  // Note: Search filtering is still client-side and only works within current page
  // For full-dataset search, this should be moved to server-side parameters
  const displayProfiles = useMemo(() => {
    if (!hitRatesData?.profiles) return []
    
    let filtered = [...hitRatesData.profiles]
    
    // Filter out players whose games have already started
    const now = new Date()
    filtered = filtered.filter((profile: PlayerHitRateProfile) => {
      if (!profile.commence_time) return true // Keep if no commence_time
      const gameTime = new Date(profile.commence_time)
      return gameTime > now // Only include future games
    })
    
    // Apply search filter (client-side, within current page only)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((profile: PlayerHitRateProfile) => 
        profile.player_name.toLowerCase().includes(query) ||
        profile.team_abbreviation?.toLowerCase().includes(query)
      )
    }
    
    return filtered
  }, [hitRatesData?.profiles, searchQuery])

  // Check if all games have passed (no upcoming games)
  const allGamesPassed = useMemo(() => {
    if (!hitRatesData?.profiles || hitRatesData.profiles.length === 0) return false
    
    const now = new Date()
    const hasUpcomingGames = hitRatesData.profiles.some((profile: PlayerHitRateProfile) => {
      if (!profile.commence_time) return false
      const gameTime = new Date(profile.commence_time)
      return gameTime > now
    })
    
    return !hasUpcomingGames
  }, [hitRatesData?.profiles])

  // Render loading state
  if (showFullLoader) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
      </div>
    )
  }

  // Render error state
  if (isError) {
    return (
      <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
        <h3 className="font-bold text-lg">Error Loading Data</h3>
        <p>{error instanceof Error ? error.message : "Failed to load hit rate data"}</p>
      </div>
    )
  }

  // Render coming soon state for inactive sports
  if (!sportConfig.isActive) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <h1 className="text-3xl font-bold">{sportConfig.name} Hit Rates</h1>
          <Card className="p-8 max-w-lg w-full">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">{sportConfig.comingSoonMessage}</h2>
              <p className="text-muted-foreground">
                We're working hard to bring you comprehensive hit rate analysis for {sportConfig.name}.
                Check back soon for updates!
              </p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Use server pagination data instead of client-side calculations
  const totalPages = hitRatesData?.totalPages || 1
  const totalItems = hitRatesData?.totalProfiles || 0
  const itemsPerPage = 25
  
  // Use server data directly (no client-side slicing needed)
  const currentPageProfiles = displayProfiles

  // Generate pagination items
  const getPaginationItems = () => {
    const items = []
    const maxPagesToShow = 5
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1)
    }
    
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink isActive={currentPage === i} onClick={() => setCurrentPage(i)}>
            {i}
          </PaginationLink>
        </PaginationItem>,
      )
    }
    
    return items
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{sportConfig.name} {currentMarket}</h1>
          <p className="text-base text-muted-foreground/90 leading-relaxed max-w-[85ch]">
            Analyze {currentMarket.toLowerCase()} {sportConfig.statTerminology.hitRate.toLowerCase()} for {sportConfig.name} players.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isFetching && isDataCached && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin h-4 w-4 border-2 border-primary rounded-full border-t-transparent"></div>
              <span>Updating...</span>
            </div>
          )}
          <FeedbackButton toolName={`${sport}_hit_rates`} />
        </div>
      </div>

      {/* Add the filters component */}
      <div className="mb-6">
        <HitRateFiltersV3
          sport={sport}
          onMarketChange={handleMarketChange}
          onViewModeChange={handleViewModeChange}
          onSearchChange={handleSearchChange}
          onSortChange={handleSortChange}
          onGameFilterChange={handleGameFilterChange}
          currentMarket={currentMarket}
          currentViewMode={currentViewMode}
          searchQuery={searchQuery}
          availableGames={availableGames}
          selectedGames={selectedGames}
          onRefreshData={handleRefreshData}
          isLoading={isLoading}
          currentSortField={sortField}
          currentSortDirection={sortDirection}
        />
      </div>

      {/* Show "no upcoming games" message when all games have passed */}
      {allGamesPassed ? (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">No More Games Today</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                All {sportConfig.name} games for today have started or finished. 
                Check back tomorrow morning for fresh hit rates and betting opportunities!
              </p>
            </div>
            <div className="pt-2">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Page
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Render the table with the filtered and sorted data */}
          <HitRateTableV3
            profiles={currentPageProfiles}
            playerTeamData={{}} // We'll implement this later
            playerOddsData={oddsData}
            sport={sport}
            market={currentMarket}
            activeTimeWindow="10_games"
            customTier={customTier}
            onSort={handleSortChange}
            sortField={sortField}
            sortDirection={sortDirection}
          />
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  />
                </PaginationItem>
                
                {getPaginationItems()}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}

          {/* Show results count */}
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Showing {currentPage * itemsPerPage - itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} players
            {selectedGames && selectedGames.length > 0 && ` from ${selectedGames.length} selected game${selectedGames.length > 1 ? 's' : ''}`}
            {searchQuery && ` (filtered by "${searchQuery}" within current page)`}
          </div>
        </>
      )}
    </main>
  )
} 