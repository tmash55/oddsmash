"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
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
  PaginationPrevious,
  PaginationEllipsis
} from "@/components/ui/pagination"
import { useMediaQuery } from "@/hooks/use-media-query"
import FeedbackButton from "@/components/shared/FeedbackButton"
import { Card } from "@/components/ui/card"
import HitRateTableV4 from "./hit-rate-table-v4"
import HitRateFiltersV4 from "./hit-rate-filters-v4"
import { fetchHitRatesData } from "@/hooks/use-hit-rates"
import { PlayerHitRateProfile } from "@/types/hit-rates"
import { PlayerPropOdds, fetchBestOddsForHitRateProfiles } from "@/services/player-prop-odds"
import { fetchPlayerTeamData } from "@/services/teams"
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { resolveOddsForProfiles } from "@/lib/redis-odds-resolver"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import HitRateCardV4 from "./hit-rate-card-v4"

interface PlayerTeamData {
  player_id: number
  team_abbreviation: string
  team_name: string
  position_abbreviation: string
}

interface BestOddsV4 {
  american: number
  decimal: number
  sportsbook: string
  link?: string | null
  _resolved?: any
  lines?: any
}

interface HitRateDashboardV4Props {
  sport: SupportedSport
}

// Add loading skeleton component
function HitRateTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-8 gap-4">
        {Array(8).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
      {Array(10).fill(0).map((_, i) => (
        <div key={i} className="grid grid-cols-8 gap-4">
          {Array(8).fill(0).map((_, j) => (
            <Skeleton key={j} className="h-12 w-full" />
          ))}
        </div>
      ))}
    </div>
  )
}

export default function HitRateDashboardV4({ sport }: HitRateDashboardV4Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const isMobile = useMediaQuery("(max-width: 768px)")
  
  // Get market from URL params
  const urlMarket = pathname.split('/').pop()
  const initialMarket = urlMarket ? decodeURIComponent(urlMarket) as SportMarket : 'Hits'
  
  // Memoize sportConfig to prevent unnecessary re-renders
  const sportConfig = useMemo(() => SPORT_CONFIGS[sport], [sport])
  
  // UI State - Proper view mode initialization
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentMarket, setCurrentMarket] = useState<SportMarket>(initialMarket)
  const [currentViewMode, setCurrentViewMode] = useState<"table" | "grid">(() => {
    // Initialize view mode based on device, but allow user preference to override
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hit-rates-view-mode')
      if (saved === 'table' || saved === 'grid') {
        return saved as "table" | "grid"
      }
    }
    return isMobile ? "grid" : "table"
  })
  const [sortField, setSortField] = useState("L10")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [customTier, setCustomTier] = useState<number | null>(null)
  const [selectedGames, setSelectedGames] = useState<string[] | null>(null)
  const [selectedTimeWindow, setSelectedTimeWindow] = useState<"5_games" | "10_games" | "20_games">("10_games")
  
  // Enhanced React Query implementation - now only fetches once per market
  const {
    data: hitRatesData,
    isLoading: isHitRatesLoading,
    isFetching: isHitRatesFetching,
  } = useQuery({
    queryKey: ['hitRates', sport, currentMarket],
    queryFn: () => {
      console.log(`🌐 [CACHE TEST] Making API call for ${sport} ${currentMarket}`)
      return fetchHitRatesData({
        sport,
        market: currentMarket,
        page: 1, // Always fetch page 1 since we're getting all data
        limit: 1000, // Large limit to get all profiles
        sortField,
        sortDirection,
        selectedGames: null,
        searchQuery: '',
      })
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - increased from 30 seconds for better caching
    gcTime: 10 * 60 * 1000, // 10 minutes - increased from 5 minutes
  })

  // Log cache status
  useEffect(() => {
    if (hitRatesData) {
      if (isHitRatesFetching) {
        console.log(`🔄 [CACHE TEST] ${sport} ${currentMarket}: Data from cache, refetching in background`)
      } else {
        console.log(`✅ [CACHE TEST] ${sport} ${currentMarket}: Data loaded (from ${isHitRatesLoading ? 'API' : 'cache'})`)
      }
    }
  }, [hitRatesData, isHitRatesLoading, isHitRatesFetching, sport, currentMarket])

  const {
    data: teamData,
    isLoading: isTeamDataLoading,
  } = useQuery({
    queryKey: ['teamData', hitRatesData?.profiles?.map(p => p.player_id)],
    queryFn: () => fetchPlayerTeamData(hitRatesData?.profiles?.map(p => p.player_id) || []),
    enabled: !!hitRatesData?.profiles?.length,
    staleTime: 10 * 60 * 1000, // 10 minutes - team data stays fresh longer
    gcTime: 30 * 60 * 1000, // 30 minutes
  })

  const {
    data: oddsData,
    isLoading: isOddsLoading,
  } = useQuery({
    queryKey: ['oddsData', hitRatesData?.profiles?.map(p => p.player_id)],
    queryFn: () => resolveOddsForProfiles(
      hitRatesData?.profiles?.map(profile => ({
        player_id: profile.player_id,
        market: profile.market,
        line: profile.line,
        all_odds: profile.all_odds
      })) || [],
      sport
    ),
    enabled: !!hitRatesData?.profiles?.length,
    staleTime: 60 * 1000, // 1 minute - odds data becomes stale more quickly
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  // Client-side filtering and pagination
  const filteredAndSortedProfiles = useMemo(() => {
    if (!hitRatesData?.profiles) return []

    let profiles = [...hitRatesData.profiles]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      profiles = profiles.filter(profile => 
        profile.player_name.toLowerCase().includes(query)
      )
    }

    // Apply game filter
    if (selectedGames?.length) {
      profiles = profiles.filter(profile => 
        profile.odds_event_id && selectedGames.includes(profile.odds_event_id)
      )
    }

    // Filter out past games
    const now = new Date()
    profiles = profiles.filter(profile => {
      if (!profile.commence_time) return true
      const gameTime = new Date(profile.commence_time)
      return gameTime > now
    })

    // Apply sorting
    profiles.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortField) {
        case "name":
          aValue = a.player_name
          bValue = b.player_name
          break
        case "line":
          aValue = a.line
          bValue = b.line
          break
        case "season":
          aValue = a.season_hit_rate
          bValue = b.season_hit_rate
          break
        case "L5":
          aValue = a.last_5_hit_rate
          bValue = b.last_5_hit_rate
          break
        case "L10":
          aValue = a.last_10_hit_rate
          bValue = b.last_10_hit_rate
          break
        case "L20":
          aValue = a.last_20_hit_rate
          bValue = b.last_20_hit_rate
          break
        default:
          aValue = a.last_10_hit_rate
          bValue = b.last_10_hit_rate
      }

      return sortDirection === "asc" 
        ? aValue > bValue ? 1 : -1
        : aValue < bValue ? 1 : -1
    })

    return profiles
  }, [hitRatesData?.profiles, searchQuery, selectedGames, sortField, sortDirection])

  // Update pagination calculation based on filtered results
  const totalPages = Math.ceil(filteredAndSortedProfiles.length / 25);
  const currentProfiles = useMemo(() => {
    const startIndex = (currentPage - 1) * 25;
    return filteredAndSortedProfiles.slice(startIndex, startIndex + 25);
  }, [filteredAndSortedProfiles, currentPage]);

  // Extract available games from profiles
  const availableGames = useMemo(() => {
    if (!hitRatesData?.profiles?.length) return []
    
    const gamesMap = new Map()
    const now = new Date()
    
    hitRatesData.profiles.forEach((profile: PlayerHitRateProfile) => {
      if (profile.odds_event_id && profile.home_team && profile.away_team && profile.commence_time) {
        const gameTime = new Date(profile.commence_time)
        
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
    
    return Array.from(gamesMap.values()).sort((a, b) => {
      const timeA = new Date(a.commence_time).getTime()
      const timeB = new Date(b.commence_time).getTime()
      return timeA - timeB
    })
  }, [hitRatesData?.profiles])

  // Update prefetch query to match
  useEffect(() => {
    if (!hitRatesData) return

    const allMarkets: SportMarket[] = [
      'Hits',
      'Total Bases',
      'Home Runs',
      'RBIs',
      'Singles',
      'Doubles',
      'Triples',
      'Strikeouts',
      'Earned Runs'
    ]
    
    // Only prefetch other markets' data
    allMarkets.forEach(market => {
      if (market !== currentMarket) {
        console.log(`[HIT RATES V4] 🔄 Prefetching data for ${market}`)
        queryClient.prefetchQuery({
          queryKey: ['hitRates', sport, market],
          queryFn: () => fetchHitRatesData({
            sport,
            market,
            page: 1,
            limit: 1000,
            sortField,
            sortDirection,
            selectedGames: null,
            searchQuery: '',
          }),
          staleTime: 2 * 60 * 1000, // Match main query stale time
          gcTime: 10 * 60 * 1000, // Match main query gc time
        })
      }
    })
  }, [hitRatesData, queryClient, sport, currentMarket])

  // Sync currentMarket with URL changes without resetting data
  useEffect(() => {
    console.log(`🔄 [CACHE TEST] URL market: ${initialMarket}, Current market: ${currentMarket}`)
    setCurrentMarket(initialMarket)
    // Only reset custom tier when market changes, preserve everything else
    if (initialMarket !== currentMarket) {
      console.log(`📋 [CACHE TEST] Market changed from ${currentMarket} to ${initialMarket}, resetting custom tier only`)
      setCustomTier(null)
    }
  }, [initialMarket, currentMarket])

  // Log view mode changes
  useEffect(() => {
    console.log(`👁️ [CACHE TEST] View mode: ${currentViewMode}`)
  }, [currentViewMode])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedGames, customTier, sortField, sortDirection])

  // V2 Approach - Client-side filtering and sorting
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
    if (customTier !== null) {
      const windowKey = timeWindow === "5_games" ? "last_5" : timeWindow === "10_games" ? "last_10" : "last_20";
      return calculateHitRateWithCustomTier(profile, customTier, windowKey);
    }
    
    if (timeWindow === "5_games") {
      return profile.last_5_hit_rate;
    } else if (timeWindow === "10_games") {
      return profile.last_10_hit_rate;
    } else if (timeWindow === "20_games") {
      return profile.last_20_hit_rate;
    }
    return profile.last_10_hit_rate;
  }

  // V2 Approach - Client-side sorting
  const sortProfiles = (profiles: PlayerHitRateProfile[]): PlayerHitRateProfile[] => {
    return [...profiles].sort((a, b) => {
      let result = 0;

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
      
      return sortDirection === "asc" ? result : -result;
    })
  }

  // Enhanced memoized filtering to handle both search and games filtering
  const filteredProfiles = useMemo(() => {
    if (!hitRatesData?.profiles) return [];

    let profiles = [...hitRatesData.profiles];
    
    // Apply search filter first
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      profiles = profiles.filter(profile => {
        const nameMatch = profile.player_name.toLowerCase().includes(query);
        const teamMatch = profile.team_abbreviation?.toLowerCase().includes(query) || 
                         profile.team_name?.toLowerCase().includes(query);
        return nameMatch || teamMatch;
      });
    }
    
    // Then filter by selected games
    if (selectedGames && selectedGames.length > 0) {
      profiles = profiles.filter(profile => 
        profile.odds_event_id && selectedGames.includes(profile.odds_event_id)
      );
    }

    // Filter out games that have already started
    const now = new Date();
    profiles = profiles.filter(profile => {
      if (!profile.commence_time) return true;
      const gameTime = new Date(profile.commence_time);
      return gameTime > now;
    });

    return profiles;
  }, [hitRatesData?.profiles, searchQuery, selectedGames]);



  // Update getBestOddsForProfile to include sportsbook
  const getBestOddsForProfile = (profile: PlayerHitRateProfile) => {
    const allOdds = profile.all_odds
    if (!allOdds) return null
    
    // Find the best odds among available sportsbooks
    let bestOdds = {
      american: 0,
      decimal: 0,
      sportsbook: "",
      link: null as string | null
    }

    Object.entries(allOdds).forEach(([sportsbook, odds]) => {
      const overOdds = odds.over?.odds
      if (overOdds && (!bestOdds.american || overOdds > bestOdds.american)) {
        bestOdds = {
          american: overOdds,
          decimal: overOdds > 0 ? (overOdds / 100) + 1 : (-100 / overOdds) + 1,
          sportsbook,
          link: odds.over?.link || null
        }
      }
    })

    return bestOdds.american ? bestOdds : null
  }

  // Get custom tier options for the current market
  const getCustomTierOptions = (market: SportMarket): number[] => {
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
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
      default:
        return [1, 2, 3]
    }
  }

  // Handle filter callbacks
  const handleMarketChange = (market: SportMarket) => {
    setCurrentMarket(market)
    setCustomTier(null)
    // No longer resetting selectedGames to preserve the game filter across market changes
    
    // Update URL
    const newPath = pathname.replace(/\/[^\/]+$/, `/${encodeURIComponent(market)}`)
    router.push(newPath)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
  }

  const handleViewModeChange = (mode: "table" | "grid") => {
    setCurrentViewMode(mode)
    // Persist view mode preference to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('hit-rates-view-mode', mode)
    }
  }

  const handleSortChange = (field: string, direction: "asc" | "desc") => {
    setSortField(field)
    setSortDirection(direction)
  }

  const handleGameFilterChange = (gameIds: string[] | null) => {
    setSelectedGames(gameIds)
  }

  const handleRefreshData = () => {
    // Invalidate and refetch all queries
    queryClient.invalidateQueries({ queryKey: ['hitRates'] })
    queryClient.invalidateQueries({ queryKey: ['teamData'] })
    queryClient.invalidateQueries({ queryKey: ['oddsData'] })
  }



  // Check if all games have passed
  const allGamesPassed = useMemo(() => {
    if (!hitRatesData?.profiles?.length) return false
    
    const now = new Date()
    const hasUpcomingGames = hitRatesData.profiles.some((profile: PlayerHitRateProfile) => {
      if (!profile.commence_time) return false
      const gameTime = new Date(profile.commence_time)
      return gameTime > now
    })
    
    return !hasUpcomingGames
  }, [hitRatesData?.profiles])

  // Show loading state only when we have no data and are loading
  if ((isHitRatesLoading || isHitRatesFetching) && !hitRatesData) {
    return (
      <main className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
          <span className="ml-3 text-muted-foreground">Loading hit rates data...</span>
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

  return (
    <main className={cn(
      "container mx-auto",
      isMobile ? "py-4 px-0" : "py-8 px-4"
    )}>
      <div className={cn(
        "flex flex-col md:flex-row md:items-center justify-between gap-4",
        isMobile ? "mb-4 px-4" : "mb-6"
      )}>
        <div>
          <h1 className={cn(
            "font-bold mb-2",
            isMobile ? "text-2xl" : "text-3xl"
          )}>
            {sportConfig.name} {currentMarket}
            <Badge variant="outline" className="ml-2 text-xs">V4</Badge>
          </h1>
          <p className={cn(
            "text-muted-foreground/90 leading-relaxed max-w-[85ch]",
            isMobile ? "text-sm" : "text-base"
          )}>
            Analyze {currentMarket.toLowerCase()} {sportConfig.statTerminology.hitRate.toLowerCase()} for {sportConfig.name} players.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <FeedbackButton toolName={`${sport}_hit_rates_v4`} />
        </div>
      </div>

      {/* Filters */}
      <div className={cn(isMobile ? "mb-4" : "mb-6")}>
        <HitRateFiltersV4
          sport={sport}
          currentMarket={currentMarket}
          onMarketChange={handleMarketChange}
          onSearchChange={handleSearchChange}
          onViewModeChange={handleViewModeChange}
          onSortChange={handleSortChange}
          onGameFilterChange={handleGameFilterChange}
          onRefreshData={handleRefreshData}
          onCustomTierChange={setCustomTier}
          currentViewMode={currentViewMode}
          searchQuery={searchQuery}
          availableGames={availableGames}
          selectedGames={selectedGames}
          isLoading={isHitRatesLoading || isHitRatesFetching}
          currentSortField={sortField}
          currentSortDirection={sortDirection}
          customTierOptions={getCustomTierOptions(currentMarket)}
          customTier={customTier}
        />
      </div>

      {currentViewMode === "table" ? (
        <HitRateTableV4
          profiles={currentProfiles}
          playerTeamData={teamData || {}}
          sport={sport}
          market={currentMarket}
          customTier={customTier}
          onSort={handleSortChange}
          sortField={sortField}
          sortDirection={sortDirection}
          calculateHitRate={(profile, timeWindow) => {
            if (customTier !== null) {
              const windowKey = timeWindow === "5_games" ? "last_5" : timeWindow === "10_games" ? "last_10" : "last_20"
              return calculateHitRateWithCustomTier(profile, customTier, windowKey)
            }
            const key = timeWindow === "5_games" ? "last_5_hit_rate" : timeWindow === "10_games" ? "last_10_hit_rate" : "last_20_hit_rate"
            return profile[key]
          }}
          getPlayerData={(playerId) => ({
            teamAbbreviation: teamData?.[playerId]?.team_abbreviation || "",
            positionAbbreviation: teamData?.[playerId]?.position_abbreviation || ""
          })}
          getBestOddsForProfile={(profile) => {
            const odds = oddsData?.[`${profile.player_id}:${profile.market}:${profile.line}`]
            if (!odds || !odds.over) return null
            return {
              american: odds.over.odds,
              decimal: odds.over.odds, // Note: We might need to convert American to decimal if needed
              sportsbook: odds.over.sportsbook,
              link: odds.over.link || null,
              _resolved: odds,
              lines: null
            }
          }}
          isLoading={isHitRatesLoading || isHitRatesFetching}
        />
      ) : (
        <div className={cn(
          "grid gap-4 w-full",
          isMobile 
            ? "grid-cols-1 px-2" // Single column on mobile with side padding
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        )}>
          {currentProfiles.map((profile) => (
            <HitRateCardV4
              key={profile.player_id}
              profile={profile}
              customTier={customTier}
              selectedTimeWindow={selectedTimeWindow}
              getPlayerData={(playerId) => ({
                teamAbbreviation: teamData?.[playerId]?.team_abbreviation || "",
                positionAbbreviation: teamData?.[playerId]?.position_abbreviation || ""
              })}
              getBestOddsForProfile={(profile) => {
                const odds = oddsData?.[`${profile.player_id}:${profile.market}:${profile.line}`]
                if (!odds || !odds.over) return null
                return {
                  american: odds.over.odds,
                  decimal: odds.over.odds,
                  sportsbook: odds.over.sportsbook,
                  link: odds.over.link || null,
                  _resolved: odds,
                  lines: null
                }
              }}
              onSort={handleSortChange}
              sortField={sortField}
              sortDirection={sortDirection}
            />
          ))}
        </div>
      )}

      {/* Add pagination UI */}
      {filteredAndSortedProfiles.length > 25 && (
        <div className={cn(
          "flex items-center justify-center space-x-2",
          isMobile ? "mt-4 px-4 pb-6" : "mt-6"
        )}>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                />
              </PaginationItem>

              {/* First page */}
              {currentPage > 3 && (
                <PaginationItem>
                  <PaginationLink onClick={() => setCurrentPage(1)}>1</PaginationLink>
                </PaginationItem>
              )}

              {/* Ellipsis */}
              {currentPage > 4 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNumber = Math.min(
                  Math.max(currentPage - 2 + i, i + 1),
                  totalPages - 2 + i
                )
                if (pageNumber <= 0 || pageNumber > totalPages) return null
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNumber)}
                      isActive={currentPage === pageNumber}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}

              {/* Ellipsis */}
              {currentPage < totalPages - 3 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {/* Last page */}
              {currentPage < totalPages - 2 && (
                <PaginationItem>
                  <PaginationLink onClick={() => setCurrentPage(totalPages)}>
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Update total count display */}
      {filteredAndSortedProfiles.length > 0 && (
        <div className="text-sm text-muted-foreground text-center mt-2">
          Showing {((currentPage - 1) * 25) + 1} to {Math.min(currentPage * 25, filteredAndSortedProfiles.length)} of {filteredAndSortedProfiles.length} profiles
        </div>
      )}

      {/* TanStack Query DevTools for cache debugging */}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </main>
  )
} 