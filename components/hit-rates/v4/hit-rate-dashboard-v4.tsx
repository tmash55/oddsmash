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
  PaginationPrevious 
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
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { resolveOddsForProfiles } from "@/lib/redis-odds-resolver"

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
  market: SportMarket
}

export default function HitRateDashboardV4({ sport, market: initialMarket }: HitRateDashboardV4Props) {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  
  // Memoize sportConfig to prevent unnecessary re-renders
  const sportConfig = useMemo(() => SPORT_CONFIGS[sport], [sport])
  
  // UI State
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentMarket, setCurrentMarket] = useState<SportMarket>(initialMarket)
  const [currentViewMode, setCurrentViewMode] = useState<"table" | "grid">("table")
  const [sortField, setSortField] = useState("L10")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [customTier, setCustomTier] = useState<number | null>(null)
  const [selectedGames, setSelectedGames] = useState<string[] | null>(null)
  
  // Data State (V2 approach - load all data once)
  const [allProfiles, setAllProfiles] = useState<PlayerHitRateProfile[]>([])
  const [playerTeamData, setPlayerTeamData] = useState<Record<number, PlayerTeamData>>({})
  const [freshOddsData, setFreshOddsData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  
  const isMobile = useMediaQuery("(max-width: 768px)")
  const itemsPerPage = 25

  // Update currentMarket when initialMarket prop changes (URL navigation)
  useEffect(() => {
    setCurrentMarket(initialMarket)
    setCustomTier(null) // Reset custom tier when market changes
    
    // Reset data when market changes
    if (initialMarket !== currentMarket) {
      setInitialLoadComplete(false)
      setAllProfiles([])
      setPlayerTeamData({})
      setFreshOddsData({})
    }
  }, [initialMarket, currentMarket])

  // V4 Main Data Loading with Redis Odds Resolver
  useEffect(() => {
    const loadAllData = async () => {
      if (initialLoadComplete) return

      setLoading(true)
      setError(null)
      
      try {
        console.log(`[HIT RATES V4] 🚀 Loading all data for ${sport} ${currentMarket}`)
        
        // Load hit rates data (V2 approach with V3's Redis optimization built-in)
        const hitRatesData = await fetchHitRatesData({
          sport,
          market: currentMarket,
          page: 1,
          limit: 1000, // Get all data at once (V2 approach)
          sortField: "L10",
          sortDirection: "desc",
          selectedGames: null,
        })
        console.log(`[HIT RATES V4] 📊 API returned ${hitRatesData?.profiles?.length || 0} profiles`)

        if (hitRatesData?.profiles) {
          setAllProfiles(hitRatesData.profiles)
          console.log(`[HIT RATES V4] 📋 Loaded ${hitRatesData.profiles.length} profiles`)
          
          // Load team data in parallel (V3 optimization)
          const teamDataPromise = fetchPlayerTeamData(
            hitRatesData.profiles.map((p: PlayerHitRateProfile) => p.player_id)
          ).then((teamData: Record<number, PlayerTeamData>) => {
            setPlayerTeamData(teamData)
            console.log(`[HIT RATES V4] 👥 Loaded team data for ${Object.keys(teamData).length} players`)
            return teamData
          }).catch((err: any) => {
            console.error("Failed to fetch team data:", err)
            return {}
          })

          // NEW: Use Redis Odds Resolver for fresh odds
          console.log(`[HIT RATES V4] 💰 Resolving fresh odds using Redis Odds Resolver`)
          const freshOddsPromise = resolveOddsForProfiles(
            hitRatesData.profiles.map((profile: PlayerHitRateProfile) => ({
              player_id: profile.player_id,
              market: profile.market,
              line: profile.line,
              all_odds: profile.all_odds
            })),
            sport
          ).then((oddsData: Record<string, any>) => {
            setFreshOddsData(oddsData)
            console.log(`[HIT RATES V4] 💰 Resolved odds for ${Object.keys(oddsData).length} profiles`)
            return oddsData
          }).catch((err: any) => {
            console.error("Failed to resolve fresh odds:", err)
            return {}
          })
          
          // Wait for both team data and fresh odds to complete
          await Promise.all([teamDataPromise, freshOddsPromise])
          
          setInitialLoadComplete(true)
          console.log(`[HIT RATES V4] ✅ All data loaded successfully`)
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err)
        setError("Failed to load hit rate data")
      } finally {
        setLoading(false)
      }
    }

    loadAllData()
  }, [sport, currentMarket, initialLoadComplete])

  // V3 Performance Optimizations - Background Prefetching
  useEffect(() => {
    if (!initialLoadComplete || !allProfiles.length) return

    const prefetchOtherMarkets = async () => {
      const commonMarkets: SportMarket[] = ['Hits', 'Home Runs', 'Total Bases', 'RBIs', 'Strikeouts']
      
      for (const market of commonMarkets) {
        if (market !== currentMarket) {
          try {
            // Cache the query for instant switching
            queryClient.prefetchQuery({
              queryKey: ['hitRates', sport, market, 'all'],
              queryFn: () => fetchHitRatesData({
                sport,
                market,
                page: 1,
                limit: 1000,
                sortField: "L10",
                sortDirection: "desc",
                selectedGames: null,
              }),
              staleTime: 2 * 60 * 1000, // 2 minutes
              gcTime: 10 * 60 * 1000, // 10 minutes
            })
          } catch (error) {
            // Ignore prefetch errors
          }
        }
      }
    }

    // Start prefetching after a short delay
    const timer = setTimeout(prefetchOtherMarkets, 1000)
    return () => clearTimeout(timer)
  }, [initialLoadComplete, allProfiles.length, currentMarket, sport, queryClient])

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

  // V2 Approach - Client-side filtering with performance optimizations
  const displayProfiles = useMemo(() => {
    if (!allProfiles.length) return []
    
    let filtered = [...allProfiles]
    
    // Filter out players whose games have already started
    const now = new Date()
    filtered = filtered.filter((profile: PlayerHitRateProfile) => {
      if (!profile.commence_time) return true
      const gameTime = new Date(profile.commence_time)
      return gameTime > now
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

  // Client-side pagination
  const totalPages = Math.ceil(displayProfiles.length / itemsPerPage)
  const currentPageProfiles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return displayProfiles.slice(startIndex, startIndex + itemsPerPage)
  }, [displayProfiles, currentPage, itemsPerPage])

  // Extract available games from profiles (V2 approach)
  const availableGames = useMemo(() => {
    if (!allProfiles.length) return []
    
    const gamesMap = new Map()
    const now = new Date()
    
    allProfiles.forEach((profile: PlayerHitRateProfile) => {
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
  }, [allProfiles])

  // Simplified approach using Redis Odds Resolver
  const getBestOddsForProfile = (profile: PlayerHitRateProfile): BestOddsV4 | null => {
    console.log(`[getBestOddsForProfile] ${profile.player_name} | ${profile.market} | Line: ${profile.line}`);
    
    // Priority 1: Check if we have resolved fresh odds from Redis Odds Resolver
    const profileKey = `${profile.player_id}:${profile.market}:${profile.line}`;
    const resolvedOdds = freshOddsData[profileKey];
    
    if (resolvedOdds) {
      console.log(`[getBestOddsForProfile] ✅ Using resolved fresh odds from ${resolvedOdds.source}`);
      
      // For now, return just the over odds in the old format for compatibility
      // The V4OddsCell will handle both over and under separately
      if (resolvedOdds.over) {
        return {
          american: resolvedOdds.over.odds,
          decimal: resolvedOdds.over.odds > 0 ? (resolvedOdds.over.odds / 100) + 1 : (-100 / resolvedOdds.over.odds) + 1,
          sportsbook: resolvedOdds.over.sportsbook,
          link: resolvedOdds.over.link || null,
          // Add the full resolved structure for V4OddsCell
          _resolved: resolvedOdds
        }
      }
    }
    
    // Priority 2: Check if profile.all_odds contains fresh Redis structure with lines data
    if (profile.all_odds && profile.all_odds.lines) {
      console.log(`[getBestOddsForProfile] ✅ Found fresh Redis structure in profile.all_odds`);
      console.log(`[getBestOddsForProfile] Available lines:`, Object.keys(profile.all_odds.lines));
      
      // Return the full structure for V4OddsCell to handle both over and under
      return {
        american: 0,
        decimal: 1,
        sportsbook: "Multiple",
        link: null,
        lines: profile.all_odds.lines
      };
    }
    
    // Priority 3: Fallback to old format for backward compatibility
    if (profile.all_odds) {
      console.log(`[getBestOddsForProfile] 📋 Using old format from profile.all_odds`);
      console.log(`[getBestOddsForProfile] Available lines:`, Object.keys(profile.all_odds));
      
      let bestOddsValue = -Infinity;
      let bestBook = "";
      let directLink: string | undefined = undefined;
      
      const lineToSearch = customTier !== null ? (customTier - 0.5).toString() : profile.line.toString();
      console.log(`[getBestOddsForProfile] Searching for line: ${lineToSearch}`);
      
      if (profile.all_odds[lineToSearch]) {
        const availableOddsForLine = profile.all_odds[lineToSearch];
        console.log(`[getBestOddsForProfile] Found odds for line ${lineToSearch}:`, availableOddsForLine);
        
        Object.entries(availableOddsForLine).forEach(([book, bookData]) => {
          let currentOdds: number | undefined;
          
          if (bookData && bookData.odds !== undefined) {
            currentOdds = Math.round(Number(bookData.odds));
          } else if (!isNaN(Number(bookData))) {
            currentOdds = Math.round(Number(bookData));
          }
          
          console.log(`[getBestOddsForProfile] Sportsbook ${book}: ${currentOdds} (raw: ${JSON.stringify(bookData)})`);
          
          if (currentOdds !== undefined && !isNaN(currentOdds)) {
            if ((currentOdds > 0 && currentOdds > bestOddsValue) || 
                (currentOdds < 0 && currentOdds > bestOddsValue)) {
              bestOddsValue = currentOdds;
              bestBook = book;
              
              if (bookData && bookData.over_link) {
                directLink = bookData.over_link;
              } else if (bookData && bookData.link) {
                directLink = bookData.link;
              }
            }
          }
        });
        
        if (bestOddsValue !== -Infinity) {
          console.log(`[getBestOddsForProfile] ⚠️ Using OLD FORMAT - Best: ${bestOddsValue} from ${bestBook}`);
          return {
            american: bestOddsValue,
            decimal: bestOddsValue > 0 ? (bestOddsValue / 100) + 1 : (-100 / bestOddsValue) + 1,
            sportsbook: bestBook,
            link: directLink || null
          }
        } else {
          console.log(`[getBestOddsForProfile] ❌ No valid odds found for line ${lineToSearch}`);
        }
      } else {
        console.log(`[getBestOddsForProfile] ❌ No odds found for line ${lineToSearch}`);
      }
    }
    
    console.log(`[getBestOddsForProfile] ❌ No odds data available`);
    return null
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
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      default:
        return [1, 2, 3]
    }
  }

  // Handle filter callbacks - all client-side (V2 approach)
  const handleMarketChange = (market: SportMarket) => {
    setCurrentMarket(market)
    setCustomTier(null)
    setInitialLoadComplete(false) // Trigger new data fetch
    setAllProfiles([]) // Clear cached profiles
    
    // Update URL
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
    setFreshOddsData({})
  }

  // Helper function to get team abbreviation and position for a player
  const getPlayerData = (playerId: number) => {
    const data = playerTeamData[playerId]
    
    if (data) {
      return {
        teamAbbreviation: data.team_abbreviation,
        positionAbbreviation: data.position_abbreviation,
      }
    }
    
    // Fallback using profile data
    const playerProfile = allProfiles.find((p) => p.player_id === playerId)
    let teamAbbr = "—"
    
    if (playerProfile?.team_name) {
      teamAbbr = playerProfile.team_name
        .split(" ")
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase()
    }
    
    return {
      teamAbbreviation: teamAbbr,
      positionAbbreviation: "—",
    }
  }

  // Check if all games have passed
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

  // Show loading state
  if (loading || !initialLoadComplete) {
    return (
      <main className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
          <span className="ml-3 text-sm text-muted-foreground">Loading hit rates data...</span>
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
          <h1 className="text-3xl font-bold mb-2">
            {sportConfig.name} {currentMarket}
            <Badge variant="outline" className="ml-2 text-xs">V4</Badge>
          </h1>
          <p className="text-base text-muted-foreground/90 leading-relaxed max-w-[85ch]">
            Analyze {currentMarket.toLowerCase()} {sportConfig.statTerminology.hitRate.toLowerCase()} for {sportConfig.name} players.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <FeedbackButton toolName={`${sport}_hit_rates_v4`} />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <HitRateFiltersV4
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
          customTierOptions={getCustomTierOptions(currentMarket)}
          customTier={customTier}
          onCustomTierChange={setCustomTier}
        />
      </div>

      {/* Show "no upcoming games" message */}
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
          {displayProfiles.length === 0 && (
            <div className="p-8 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
              <h3 className="font-semibold text-lg text-gray-600 dark:text-gray-300">No Hit Rate Profiles Found</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Try adjusting your filters or search query.</p>
            </div>
          )}

          {/* Content */}
          {displayProfiles.length > 0 && (
            <>
              {/* Table */}
              <HitRateTableV4
                profiles={currentPageProfiles}
                playerTeamData={playerTeamData}
                sport={sport}
                market={currentMarket}
                activeTimeWindow="10_games"
                customTier={customTier}
                onSort={handleSortChange}
                sortField={sortField}
                sortDirection={sortDirection}
                calculateHitRate={calculateHitRate}
                getPlayerData={getPlayerData}
                getBestOddsForProfile={getBestOddsForProfile}
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

              {/* Results count */}
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