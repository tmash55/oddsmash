"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { SupportedSport, SPORT_CONFIGS, SportMarket } from "@/types/sports"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

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

import { Card } from "@/components/ui/card"
import HitRateTableV4 from "./hit-rate-table-v4"
import HitRateFiltersV4 from "./hit-rate-filters-v4"
import { fetchHitRatesData } from "@/hooks/use-hit-rates"
import { PlayerHitRateProfile } from "@/types/hit-rates"
import { PlayerPropOdds, fetchBestOddsForHitRateProfiles } from "@/services/player-prop-odds"
import { fetchPlayerTeamData } from "@/services/teams"
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
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
  
  // Memoize sportConfig to prevent unnecessary re-renders (moved up to use in market logic)
  const sportConfig = useMemo(() => SPORT_CONFIGS[sport], [sport])

  // Get market from search params (for new protected route) or URL params (for legacy route)
  const searchMarket = searchParams.get('market')
  const urlMarket = pathname.split('/').pop()
  
  let initialMarket: SportMarket
  if (searchMarket) {
    // New protected route format: ?market=home+runs
    const decodedSearchMarket = decodeURIComponent(searchMarket.replace(/\+/g, ' '))
    // Find the correct case-sensitive market value from sport config
    const marketConfig = sportConfig.markets.find(m => 
      m.value.toLowerCase() === decodedSearchMarket.toLowerCase() ||
      m.label.toLowerCase() === decodedSearchMarket.toLowerCase()
    )
    initialMarket = marketConfig?.value || sportConfig.defaultMarket
  } else if (urlMarket && urlMarket !== 'hit-rates') {
    // Legacy route format: /hit-rates/mlb/Home%20Runs
    const decodedUrlMarket = decodeURIComponent(urlMarket)
    // Find the correct case-sensitive market value from sport config
    const marketConfig = sportConfig.markets.find(m => 
      m.value.toLowerCase() === decodedUrlMarket.toLowerCase() ||
      m.label.toLowerCase() === decodedUrlMarket.toLowerCase()
    )
    initialMarket = marketConfig?.value || sportConfig.defaultMarket
  } else {
    // Default fallback
    initialMarket = sportConfig.defaultMarket
  }
  
  // UI State - Proper view mode initialization
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
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
  const [showPastGames, setShowPastGames] = useState(false) // Changed to false to filter past games by default
  const [selectedTimeWindow, setSelectedTimeWindow] = useState<"5_games" | "10_games" | "20_games">("10_games")
  
  // Sync currentMarket with URL changes
  useEffect(() => {
    if (initialMarket !== currentMarket) {
      setCurrentMarket(initialMarket)
    }
  }, [initialMarket, currentMarket])
  
  // Enhanced React Query implementation - now only fetches once per market
  const {
    data: hitRatesData,
    isLoading: isHitRatesLoading,
    isFetching: isHitRatesFetching,
  } = useQuery({
    queryKey: ['hitRates', sport, currentMarket],
    queryFn: () => {
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

  // Enhanced logging to debug data structure
  useEffect(() => {
    if (hitRatesData?.profiles?.length) {
      const sampleProfile = hitRatesData.profiles[0]
      
      // Check how many profiles have odds data
      const profilesWithOdds = hitRatesData.profiles.filter(p => p.all_odds && Object.keys(p.all_odds).length > 0)
      
      if (profilesWithOdds.length === 0) {
        console.warn(`⚠️ [V4 Dashboard] No profiles have all_odds data! This will cause display issues.`)
      }
    }
  }, [hitRatesData])

  // Log cache status
  useEffect(() => {
    // Cache status logging removed for production
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

  // REMOVED: Failing Redis Odds Resolver query
  // Instead, we'll extract odds from the embedded all_odds data in hit rate profiles
  
  // Function to extract best odds from profile's embedded all_odds data
  const extractBestOddsFromProfile = (profile: PlayerHitRateProfile, customTier?: number | null) => {
    const targetLine = customTier !== null ? customTier - 0.5 : profile.line
    const lineKey = targetLine.toString()
    
    if (!profile.all_odds) {
      return null
    }
    
    if (Object.keys(profile.all_odds).length === 0) {
      return null
    }
    
    if (!profile.all_odds[lineKey]) {
      return null
    }
    
    const lineOdds = profile.all_odds[lineKey]
    let bestOdds = -Infinity
    let bestBook = ""
    let bestLink: string | null = null
    
    // Find best odds across all sportsbooks
    Object.entries(lineOdds).forEach(([book, bookData]: [string, any]) => {
      let odds: number | undefined
      let link: string | undefined
      
      if (bookData && typeof bookData.odds === 'number') {
        odds = bookData.odds
        link = bookData.over_link || bookData.link
      } else if (typeof bookData === 'number') {
        odds = bookData
      }
      
      if (odds !== undefined && odds > bestOdds) {
        bestOdds = odds
        bestBook = book
        bestLink = link || null
      }
    })
    
    if (bestOdds === -Infinity) {
      return null
    }
    
    return {
      over: {
        odds: bestOdds,
        sportsbook: bestBook,
        link: bestLink
      },
      source: "embedded",
      lastUpdated: new Date().toISOString()
    }
  }

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

  // Update the availableGames memo to filter out past games
  const availableGames = useMemo(() => {
    if (!hitRatesData?.profiles?.length) return []
    
    const gamesMap = new Map()
    const now = new Date()
    
    hitRatesData.profiles.forEach((profile: PlayerHitRateProfile) => {
      // Skip if missing required fields
      if (!profile.odds_event_id || !profile.home_team || !profile.away_team || !profile.commence_time) {
        return
      }
      
      const gameTime = new Date(profile.commence_time)
      
      // Skip if game is in the past
      if (gameTime <= now) {
        return
      }
      
      gamesMap.set(profile.odds_event_id, {
        odds_event_id: profile.odds_event_id,
        home_team: profile.home_team,
        away_team: profile.away_team,
        commence_time: profile.commence_time,
      })
    })
    
    return Array.from(gamesMap.values()).sort((a, b) => {
      const timeA = new Date(a.commence_time).getTime()
      const timeB = new Date(b.commence_time).getTime()
      return timeA - timeB
    })
  }, [hitRatesData?.profiles])

  // Update the filteredAndSortedProfiles memo to ensure we're not showing past games
  const filteredAndSortedProfiles = useMemo(() => {
    if (!hitRatesData?.profiles) {
      return []
    }

    let profiles = [...hitRatesData.profiles]
    const now = new Date()
    
    // Filter out past games first
    profiles = profiles.filter(profile => {
      if (!profile.commence_time) return false
      const gameTime = new Date(profile.commence_time)
      return gameTime > now
    })

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
        selectedGames.includes(profile.odds_event_id)
      )
    }

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
          if (customTier !== null) {
            aValue = calculateHitRateWithCustomTier(a, customTier, "last_5")
            bValue = calculateHitRateWithCustomTier(b, customTier, "last_5")
          } else {
            aValue = a.last_5_hit_rate
            bValue = b.last_5_hit_rate
          }
          break
        case "L10":
          if (customTier !== null) {
            aValue = calculateHitRateWithCustomTier(a, customTier, "last_10")
            bValue = calculateHitRateWithCustomTier(b, customTier, "last_10")
          } else {
            aValue = a.last_10_hit_rate
            bValue = b.last_10_hit_rate
          }
          break
        case "L20":
          if (customTier !== null) {
            aValue = calculateHitRateWithCustomTier(a, customTier, "last_20")
            bValue = calculateHitRateWithCustomTier(b, customTier, "last_20")
          } else {
            aValue = a.last_20_hit_rate
            bValue = b.last_20_hit_rate
          }
          break
        default:
          if (customTier !== null) {
            aValue = calculateHitRateWithCustomTier(a, customTier, "last_10")
            bValue = calculateHitRateWithCustomTier(b, customTier, "last_10")
          } else {
            aValue = a.last_10_hit_rate
            bValue = b.last_10_hit_rate
          }
      }

      return sortDirection === "asc" 
        ? aValue > bValue ? 1 : -1
        : aValue < bValue ? 1 : -1
    })

    return profiles
  }, [hitRatesData?.profiles, searchQuery, selectedGames, sortField, sortDirection, customTier])

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

  // Update pagination calculation based on filtered results
  const totalPages = Math.ceil(filteredAndSortedProfiles.length / 25);
  const currentProfiles = useMemo(() => {
    const startIndex = (currentPage - 1) * 25;
    const slicedProfiles = filteredAndSortedProfiles.slice(startIndex, startIndex + 25);
    
    return slicedProfiles;
  }, [filteredAndSortedProfiles, currentPage, hitRatesData?.profiles?.length]);

  // Extract available games from profiles
  // This useMemo is now redundant as availableGames is calculated directly above
  // const availableGames = useMemo(() => {
  //   if (!hitRatesData?.profiles?.length) return []
    
  //   const gamesMap = new Map()
  //   const now = new Date()
  //   // Show all games in the next 24 hours to capture late games and timezone differences
  //   const hoursAhead = 24
  //   const futureTime = new Date(now.getTime() + (hoursAhead * 60 * 60 * 1000))
    
  //   // Look specifically for Seattle Mariners late game
  //   const seattleProfiles = hitRatesData.profiles.filter(p => 
  //     p.home_team?.includes('Seattle') || p.away_team?.includes('Seattle') ||
  //     p.home_team?.includes('Mariners') || p.away_team?.includes('Mariners')
  //   )
  //   // Look specifically for Josh Naylor late game
  //   const joshProfiles = hitRatesData.profiles.filter(p => 
  //     p.player_name?.includes('Josh Naylor') ||
  //     p.home_team?.includes('Arizona') || p.away_team?.includes('Arizona') ||
  //     p.home_team?.includes('Diamondbacks') || p.away_team?.includes('Diamondbacks')
  //   )
    
  //   let processedCount = 0
  //   let excludedCount = 0
  //   let missingFieldsCount = 0
  //   let timeFilteredCount = 0
    
  //   hitRatesData.profiles.forEach((profile: PlayerHitRateProfile) => {
  //     processedCount++
      
  //     // Check for missing required fields
  //     if (!profile.odds_event_id || !profile.home_team || !profile.away_team || !profile.commence_time) {
  //       missingFieldsCount++
  //       return
  //     }
      
  //     const gameTime = new Date(profile.commence_time)
  //     const isWithinWindow = gameTime <= futureTime
      
  //     if (isWithinWindow) {
  //       gamesMap.set(profile.odds_event_id, {
  //         odds_event_id: profile.odds_event_id,
  //         home_team: profile.home_team,
  //         away_team: profile.away_team,
  //         commence_time: profile.commence_time,
  //       })
  //     } else {
  //       timeFilteredCount++
  //     }
  //   })
    
  //   const games = Array.from(gamesMap.values()).sort((a, b) => {
  //     const timeA = new Date(a.commence_time).getTime()
  //     const timeB = new Date(b.commence_time).getTime()
  //     return timeA - timeB
  //   })
    
  //   return games
  // }, [hitRatesData?.profiles])

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
    setCurrentMarket(initialMarket)
    // Only reset custom tier when market changes, preserve everything else
    if (initialMarket !== currentMarket) {
      setCustomTier(null)
    }
  }, [initialMarket, currentMarket])

  // Log view mode changes
  useEffect(() => {
    // View mode logging removed for production
  }, [currentViewMode])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedGames, customTier, sortField, sortDirection])

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
    // Show all games in the next 24 hours to capture late games and timezone differences
    const hoursAhead = 24;
    const futureTime = new Date(now.getTime() + (hoursAhead * 60 * 60 * 1000));
    
    profiles = profiles.filter(profile => {
      if (!profile.commence_time) return true;
      const gameTime = new Date(profile.commence_time);
      return gameTime <= futureTime;
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
      case "Runs":
        return [1, 2, 3, 4]
      default:
        return [1, 2, 3]
    }
  }

  // Handle filter callbacks
  const handleMarketChange = (market: SportMarket) => {
    setCurrentMarket(market)
    setCustomTier(null)
    // No longer resetting selectedGames to preserve the game filter across market changes
    
    // Update URL based on route format
    if (pathname.includes('/(protected)/') || searchMarket) {
      // New protected route format: use search params
      const encodedMarket = encodeURIComponent(market).replace(/%20/g, '+')
      const newUrl = `${pathname}?market=${encodedMarket}`
      router.push(newUrl)
    } else {
      // Legacy route format: use URL params
      const newPath = pathname.replace(/\/[^/]+$/, `/${encodeURIComponent(market)}`)
      router.push(newPath)
    }
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
    // Removed oddsData invalidation since we now use embedded odds
  }



  // Check if all games have passed
  const allGamesPassed = useMemo(() => {
    if (!hitRatesData?.profiles?.length) return false
    
    const now = new Date()
    // Show all games in the next 24 hours to capture late games and timezone differences
    const hoursAhead = 24
    const futureTime = new Date(now.getTime() + (hoursAhead * 60 * 60 * 1000))
    
    const hasUpcomingGames = hitRatesData.profiles.some((profile: PlayerHitRateProfile) => {
      if (!profile.commence_time) return false
      const gameTime = new Date(profile.commence_time)
      return gameTime <= futureTime
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



  // Dashboard only renders for active sports now - coming soon is handled at page level

  return (
    <main className="w-full">
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
            const odds = extractBestOddsFromProfile(profile, customTier)
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
                const odds = extractBestOddsFromProfile(profile, customTier)
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