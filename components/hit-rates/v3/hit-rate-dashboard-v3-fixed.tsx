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

export default function HitRateDashboardV3Fixed({ sport, market: initialMarket }: HitRateDashboardV3Props) {
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
  
  // Add state for caching all profiles data (like v2)
  const [allProfiles, setAllProfiles] = useState<PlayerHitRateProfile[]>([])
  const [playerTeamData, setPlayerTeamData] = useState<Record<number, PlayerTeamData>>({})
  const [playerOddsData, setPlayerOddsData] = useState<Record<string, PlayerPropOdds | null>>({})
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const isMobile = useMediaQuery("(max-width: 768px)")
  const itemsPerPage = 25

  // Update currentMarket when initialMarket prop changes (URL navigation)
  useEffect(() => {
    setCurrentMarket(initialMarket)
    setCustomTier(null) // Reset custom tier when market changes
    setInitialLoadComplete(false) // Trigger new data fetch for new market
    setAllProfiles([]) // Clear cached profiles
  }, [initialMarket])

  // Initial data fetch - only when market changes or initial load
  useEffect(() => {
    const loadInitialData = async () => {
      if (initialLoadComplete) return

      setLoading(true)
      setError(null)
      
      try {
        console.log(`[DASHBOARD V3] Loading initial data for ${sport} ${currentMarket}`)
        
        // Fetch hit rate profiles
        const hitRatesData = await fetchHitRatesData({
          sport,
          market: currentMarket,
          page: 1,
          limit: 1000, // Get all data initially for client-side filtering
          sortField: "L10",
          sortDirection: "desc",
          selectedGames: null,
        })

        if (hitRatesData?.profiles) {
          console.log(`[DASHBOARD V3] Loaded ${hitRatesData.profiles.length} profiles`)
          setAllProfiles(hitRatesData.profiles)
          
          // Fetch team data for all players
          const playerIds = hitRatesData.profiles.map((p: PlayerHitRateProfile) => p.player_id)
          try {
            const teamData = await fetchPlayerTeamData(playerIds)
            setPlayerTeamData(teamData)
            console.log(`[DASHBOARD V3] Loaded team data for ${Object.keys(teamData).length} players`)
          } catch (err) {
            console.error("Failed to fetch team data:", err)
          }

          // Fetch odds data for all profiles (like v2)
          try {
            // Check if profiles already have all_odds data
            const hasAllOddsData = hitRatesData.profiles.length > 0 && hitRatesData.profiles[0].all_odds;
            
            if (!hasAllOddsData) {
              const oddsData = await fetchBestOddsForHitRateProfiles(hitRatesData.profiles)
              setPlayerOddsData(oddsData)
              console.log(`[DASHBOARD V3] Loaded odds data for ${Object.keys(oddsData).length} profiles`)
            } else {
              console.log(`[DASHBOARD V3] Profiles already have all_odds data, skipping odds fetch`)
            }
          } catch (err) {
            console.error("Failed to fetch odds data:", err)
          }
          
          setInitialLoadComplete(true)
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err)
        setError("Failed to load hit rate data")
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [sport, currentMarket, initialLoadComplete])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedGames, customTier, sortField, sortDirection])

  // Calculate hit rate for a profile based on time window and custom tier (from v2)
  const calculateHitRateWithCustomTier = (
    profile: PlayerHitRateProfile,
    customTier: number,
    timeWindow: "last_5" | "last_10" | "last_20",
  ): number => {
    const histogram = profile.points_histogram[timeWindow]
    if (!histogram) return 0

    const totalGames = Object.values(histogram).reduce((sum, count) => sum + count, 0)
    if (totalGames === 0) return 0

    let gamesHittingTier = 0
    Object.entries(histogram).forEach(([value, count]) => {
      if (Number(value) >= customTier) {
        gamesHittingTier += count
      }
    })

    return Math.round((gamesHittingTier / totalGames) * 100)
  }

  const calculateHitRate = (profile: PlayerHitRateProfile, timeWindow: string): number => {
    // If we have a custom tier, use the custom calculation
    if (customTier !== null) {
      const windowKey = timeWindow === "5_games" ? "last_5" : timeWindow === "10_games" ? "last_10" : "last_20";
      return calculateHitRateWithCustomTier(profile, customTier, windowKey);
    }
    
    // Otherwise, use the standard hit rates
    if (timeWindow === "5_games") {
      return profile.last_5_hit_rate;
    } else if (timeWindow === "10_games") {
      return profile.last_10_hit_rate;
    } else if (timeWindow === "20_games") {
      return profile.last_20_hit_rate;
    }
    return profile.last_10_hit_rate; // Default to last 10 games
  }

  // Sort profiles function (from v2)
  const sortProfiles = (profiles: PlayerHitRateProfile[]): PlayerHitRateProfile[] => {
    return [...profiles].sort((a, b) => {
      let result = 0;

      // Sort based on the selected field
      switch (sortField) {
        case "name": {
          result = a.player_name.localeCompare(b.player_name);
          break;
        }
        case "line": {
          result = a.line - b.line;
          break;
        }
        case "L5": {
          if (customTier !== null) {
            const aL5CustomRate = calculateHitRateWithCustomTier(a, customTier, "last_5");
            const bL5CustomRate = calculateHitRateWithCustomTier(b, customTier, "last_5");
            result = aL5CustomRate - bL5CustomRate;
          } else {
            result = a.last_5_hit_rate - b.last_5_hit_rate;
          }
          break;
        }
        case "L10": {
          if (customTier !== null) {
            const aL10CustomRate = calculateHitRateWithCustomTier(a, customTier, "last_10");
            const bL10CustomRate = calculateHitRateWithCustomTier(b, customTier, "last_10");
            result = aL10CustomRate - bL10CustomRate;
          } else {
            result = a.last_10_hit_rate - b.last_10_hit_rate;
          }
          break;
        }
        case "L20": {
          if (customTier !== null) {
            const aL20CustomRate = calculateHitRateWithCustomTier(a, customTier, "last_20");
            const bL20CustomRate = calculateHitRateWithCustomTier(b, customTier, "last_20");
            result = aL20CustomRate - bL20CustomRate;
          } else {
            result = a.last_20_hit_rate - b.last_20_hit_rate;
          }
          break;
        }
        case "seasonHitRate": {
          const aSeasonRate = a.season_hit_rate || 0;
          const bSeasonRate = b.season_hit_rate || 0;
          result = aSeasonRate - bSeasonRate;
          break;
        }
        case "average": {
          result = a.avg_stat_per_game - b.avg_stat_per_game;
          break;
        }
        default: {
          result = a.last_10_hit_rate - b.last_10_hit_rate;
        }
      }
      
      // Apply the sort direction
      return sortDirection === "asc" ? result : -result;
    })
  }

  // Client-side filtering and pagination (like v2)
  const displayProfiles = useMemo(() => {
    if (!allProfiles.length) return []
    
    let filtered = [...allProfiles]
    
    // Filter out players whose games have already started
    const now = new Date()
    filtered = filtered.filter((profile: PlayerHitRateProfile) => {
      if (!profile.commence_time) return true // Keep if no commence_time
      const gameTime = new Date(profile.commence_time)
      return gameTime > now // Only include future games
    })
    
    // Apply game filter if selected
    if (selectedGames && selectedGames.length > 0) {
      filtered = filtered.filter((profile: PlayerHitRateProfile) => 
        profile.odds_event_id && selectedGames.includes(profile.odds_event_id)
      );
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((profile: PlayerHitRateProfile) => 
        profile.player_name.toLowerCase().includes(query) ||
        profile.team_abbreviation?.toLowerCase().includes(query)
      )
    }
    
    // Sort the filtered results
    const sorted = sortProfiles(filtered)
    
    return sorted
  }, [allProfiles, searchQuery, selectedGames, sortField, sortDirection, customTier])

  // Pagination
  const totalPages = Math.ceil(displayProfiles.length / itemsPerPage)
  const currentPageProfiles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return displayProfiles.slice(startIndex, startIndex + itemsPerPage)
  }, [displayProfiles, currentPage, itemsPerPage])

  // Extract available games from profiles
  const availableGames = useMemo(() => {
    if (!allProfiles.length) return []
    
    const gamesMap = new Map()
    const now = new Date()
    
    allProfiles.forEach((profile: PlayerHitRateProfile) => {
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
  }, [allProfiles])

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

  // Handle filter callbacks - now client-side only (like v2)
  const handleMarketChange = (market: SportMarket) => {
    setCurrentMarket(market)
    setCustomTier(null) // Reset custom tier when market changes
    setInitialLoadComplete(false) // Trigger new data fetch
    setAllProfiles([]) // Clear cached profiles
    
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
    setInitialLoadComplete(false)
    setAllProfiles([])
    setPlayerTeamData({})
    setPlayerOddsData({})
    // This will trigger useEffect to reload data
  }

  // Helper function to get team abbreviation and position for a player (from v2)
  const getPlayerData = (playerId: number) => {
    const data = playerTeamData[playerId]
    
    if (data) {
      return {
        teamAbbreviation: data.team_abbreviation,
        positionAbbreviation: data.position_abbreviation,
      }
    }
    
    // Look for the player in the profiles to get team name for fallback
    const playerProfile = allProfiles.find((p) => p.player_id === playerId)
    let teamAbbr = "—"
    
    // Generate a fallback abbreviation from team_name if available
    if (playerProfile?.team_name) {
      teamAbbr = playerProfile.team_name
        .split(" ")
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase()
    }
    
    // Fallback if player data not found
    return {
      teamAbbreviation: teamAbbr,
      positionAbbreviation: "—",
    }
  }

  // Check if all games have passed (no upcoming games)
  const allGamesPassed = useMemo(() => {
    if (!allProfiles.length) return false
    
    const now = new Date()
    const hasUpcomingGames = allProfiles.some((profile: PlayerHitRateProfile) => {
      if (!profile.commence_time) return false
      const gameTime = new Date(profile.commence_time)
      return gameTime > now
    })
    
    return !hasUpcomingGames
  }, [allProfiles])

  // Show loading state when initially loading
  if (loading || !initialLoadComplete) {
    return (
      <main className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
        </div>
      </main>
    )
  }

  // Render error state
  if (error) {
    return (
      <main className="container mx-auto py-8 px-4">
        <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
          <h3 className="font-bold text-lg">Error Loading Data</h3>
          <p>{error}</p>
          <div className="mt-4">
            <Button onClick={handleRefreshData} className="bg-red-600 hover:bg-red-700 text-white">
              Retry
            </Button>
          </div>
        </div>
      </main>
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
          isLoading={loading}
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
          {/* Empty State */}
          {!loading && displayProfiles.length === 0 && (
            <div className="p-8 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
              <h3 className="font-semibold text-lg text-gray-600 dark:text-gray-300">No Hit Rate Profiles Found</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Try adjusting your filters or search query.</p>
            </div>
          )}

          {/* Content Views */}
          {displayProfiles.length > 0 && (
            <>
              {/* Render the table with the filtered and sorted data */}
              <HitRateTableV3
                profiles={currentPageProfiles}
                playerTeamData={playerTeamData}
                playerOddsData={playerOddsData}
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
                Showing {currentPage * itemsPerPage - itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, displayProfiles.length)} of {displayProfiles.length} players
                {selectedGames && selectedGames.length > 0 && ` from ${selectedGames.length} selected game${selectedGames.length > 1 ? 's' : ''}`}
                {searchQuery && ` (filtered by "${searchQuery}")`}
              </div>
            </>
          )}
        </>
      )}
    </main>
  )
} 