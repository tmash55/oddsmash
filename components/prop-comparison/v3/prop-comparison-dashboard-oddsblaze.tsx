"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { RefreshCw, Grid3X3, List, AlertCircle, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useMediaQuery } from "@/hooks/use-media-query"
import { usePropComparisonV3 } from "@/hooks/use-prop-comparison-v3"
import { usePropComparisonPrefetch } from "@/hooks/use-prop-comparison-prefetch"
import { useTransformedPropData } from "@/hooks/use-prop-comparison-transforms"
import { cn } from "@/lib/utils"
import { getMarketsForSport, getDefaultMarket } from "@/lib/constants/markets"
import type { BestOddsFilter } from "@/types/prop-comparison"
import { PropComparisonNavigationFilters } from "@/components/prop-comparison/v3/prop-comparison-navigation-filters"
import { PropComparisonTableOddsBlaze } from "@/components/prop-comparison/v3/prop-comparison-table-oddsblaze"
import { PropComparisonCardV2 } from "@/components/prop-comparison/v2/prop-comparison-card-v2"
import { useQueryClient } from "@tanstack/react-query"
import { prefetchPropComparison } from "@/lib/query-client"

// Compact loading skeleton
function PropComparisonTableSkeleton() {
  const isMobile = useMediaQuery("(max-width: 768px)")

  return (
    <div className="space-y-4">
      {/* Compact filters skeleton */}
      <Card
        className={cn(
          "p-4 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800",
          isMobile && "-mx-4 border-x-0 rounded-none",
        )}
      >
        <div className="flex flex-wrap gap-2 mb-3">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 bg-slate-200 dark:bg-slate-700" />
            ))}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1 bg-slate-200 dark:bg-slate-700" />
          <Skeleton className="h-8 w-20 bg-slate-200 dark:bg-slate-700" />
        </div>
      </Card>

      {/* Table skeleton */}
      <Card
        className={cn(
          "p-4 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800",
          isMobile && "-mx-4 border-x-0 rounded-none",
        )}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-7 gap-2">
            {Array(7)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-6 w-full bg-slate-200 dark:bg-slate-700" />
              ))}
          </div>
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="grid grid-cols-7 gap-2">
                {Array(7)
                  .fill(0)
                  .map((_, j) => (
                    <Skeleton key={j} className="h-10 w-full bg-slate-200 dark:bg-slate-700" />
                  ))}
              </div>
            ))}
        </div>
      </Card>
    </div>
  )
}

interface PropComparisonDashboardOddsBlazeProps {
  sport: string
}

export function PropComparisonDashboardOddsBlaze({ sport }: PropComparisonDashboardOddsBlazeProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const queryClient = useQueryClient()

  // View state (table/grid)
  const [viewMode, setViewMode] = useState<"table" | "grid">(isMobile ? "grid" : "table")

  // Pre-Match / Live mode
  const [mode, setMode] = useState<"pregame" | "live">("pregame")

  // Filter states
  const [market, setMarket] = useState(() => {
    const urlMarket = searchParams.get("market")
    const defaultMarket = getDefaultMarket(sport)
    return urlMarket || defaultMarket || ""
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSportsbook, setSelectedSportsbook] = useState<string | null>(null)
  const [selectedLine, setSelectedLine] = useState<string | null>(null)
  const [globalLine, setGlobalLine] = useState<string | null>(null)
  const [selectedGames, setSelectedGames] = useState<string[] | null>(null)
  // Remove evMethod state
  // const [evMethod, setEvMethod] = useState<"market-average" | "no-vig">("market-average")

  // Sort states
  const [sortField, setSortField] = useState<"odds" | "edge" | "name" | "ev">("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(() => {
    return ["ev", "odds"].includes(sortField) ? "desc" : "asc"
  })

  // Update sort direction when field changes
  useEffect(() => {
    if (["ev", "odds"].includes(sortField)) {
      setSortDirection("desc")
    }
  }, [sortField])

  // Add best odds filter state
  const [bestOddsFilter, setBestOddsFilter] = useState<BestOddsFilter | null>(null)

  // Add lastUpdated state
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Fetch data using V3 API
  const { data: v3Response, isLoading, isError, refetch } = usePropComparisonV3({
    sport,
    market,
    scope: mode, // "pregame" or "live"
  })

  // Initialize prefetching for better UX
  const { prefetchOnIdle, prefetchAdjacentMarkets } = usePropComparisonPrefetch();

  // Use V3 data directly (no transformation needed - already pre-processed on server)
  const data = useMemo(() => {
    console.log('[Dashboard] V3 Response:', v3Response)
    
    // V3 API returns { success: boolean, data: V3PlayerOdds[], metadata: {...} }
    if (!v3Response?.success || !v3Response?.data || !Array.isArray(v3Response.data)) {
      console.log('[Dashboard] No V3 data found or invalid format')
      return { data: [], metadata: null }
    }
    
    console.log('[Dashboard] Found', v3Response.data.length, 'pre-processed players in V3 response')
    
    // V3 data is now pre-processed on the server - use directly!
    return {
      data: v3Response.data, // Already fully processed
      metadata: {
        globalLastUpdated: v3Response.metadata?.lastUpdated || null,
        sport: v3Response.metadata?.sport || sport,
        market: v3Response.metadata?.market || market,
      }
    }
  }, [v3Response, sport, market])

  // Update lastUpdated when data changes - use global timestamp from API
  useEffect(() => {
    if (data?.metadata?.globalLastUpdated) {
      // Use the global most recent timestamp from the API metadata
      setLastUpdated(data.metadata.globalLastUpdated);
    } else if (data?.data?.length > 0) {
      // Fallback to calculating from filtered data if global timestamp not available
      const mostRecent = data.data.reduce((latest, item) => {
        if (!item.last_updated) return latest;
        const itemDate = new Date(item.last_updated);
        return !latest || itemDate > new Date(latest) ? item.last_updated : latest;
      }, null as string | null);
      
      setLastUpdated(mostRecent);
    }
  }, [data]);

  // **CACHING OPTIMIZATION**: Prefetch adjacent markets for better UX
  useEffect(() => {
    if (!isLoading && !isError && v3Response?.success) {
      // Prefetch related markets in the background during idle time
      prefetchOnIdle({
        sport,
        market,
        scope: mode,
      });
    }
  }, [sport, market, mode, isLoading, isError, v3Response?.success, prefetchOnIdle]);

  // Prefetch high-priority markets when user starts typing in search or hovering over navigation
  const handleMarketHover = useCallback((hoveredMarket: string) => {
    if (hoveredMarket !== market) {
      prefetchAdjacentMarkets({
        sport,
        market: hoveredMarket,
        scope: mode,
      }, 'high');
    }
  }, [sport, market, mode, prefetchAdjacentMarkets]);

  // Convert V3PlayerOdds to PlayerOdds format for legacy compatibility
  const compatibleData = useMemo(() => {
    if (!data?.data) return []
    return data.data.map(player => ({
      ...player,
      player_id: typeof player.player_id === 'string' ? parseInt(player.player_id, 10) : player.player_id,
    }))
  }, [data?.data])

  // Transform data with optimized caching
  const { processedData, sortedData, totalCount, filteredCount } = useTransformedPropData({
    data: compatibleData,
    globalLine,
    searchQuery,
    selectedGames,
    bestOddsFilter,
    sortField,
    sortDirection,
  })

  // Compute Pre-Game count (items that haven't started yet) from current filtered list
  const preGameCount = useMemo(() => {
    const now = Date.now()
    return (sortedData || []).filter((item) => {
      const t = new Date(item.commence_time).getTime()
      return isFinite(t) && t > now
    }).length
  }, [sortedData])

  // Compute Live count (items that are currently live)
  const liveCount = useMemo(() => {
    const now = Date.now()
    return (sortedData || []).filter((item) => {
      const t = new Date(item.commence_time).getTime()
      return isFinite(t) && t <= now && t > now - (3 * 60 * 60 * 1000) // Within last 3 hours
    }).length
  }, [sortedData])

  // Choose data to render based on mode
  const displayData = useMemo(() => {
    if (mode === "pregame") {
      const now = Date.now()
      return (sortedData || []).filter((item) => {
        const t = new Date(item.commence_time).getTime()
        return isFinite(t) && t > now
      })
    } else if (mode === "live") {
      const now = Date.now()
      return (sortedData || []).filter((item) => {
        const t = new Date(item.commence_time).getTime()
        return isFinite(t) && t <= now && t > now - (3 * 60 * 60 * 1000) // Within last 3 hours
      })
    }
    return sortedData
  }, [mode, sortedData])

  // Get available games from processed data
  const availableGames = useMemo(() => {
    const uniqueGames = new Map()
    processedData.forEach((item) => {
      if (!uniqueGames.has(item.event_id)) {
        uniqueGames.set(item.event_id, {
          odds_event_id: item.event_id,
          home_team: item.home_team,
          away_team: item.away_team,
          commence_time: item.commence_time,
        })
      }
    })

    return Array.from(uniqueGames.values()).sort(
      (a, b) => new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime(),
    )
  }, [processedData])

  // Get available lines from processed data
  const availableLines = useMemo(() => {
    const lines = new Set<string>()
    processedData.forEach((item) => {
      if (item.lines) {
        Object.keys(item.lines).forEach((line) => lines.add(line))
      }
    })

    return Array.from(lines).sort((a, b) => Number(a) - Number(b))
  }, [processedData])

  // Handle all URL parameters in a single effect
  useEffect(() => {
    const urlMarket = searchParams.get("market")
    const urlGlobalLine = searchParams.get("globalLine")
    const urlSportsbook = searchParams.get("sportsbook")
    const urlLine = searchParams.get("line")
    const urlGames = searchParams.get("games")

    if (urlMarket && urlMarket !== market) {
      setMarket(urlMarket)
    }

    if (urlGlobalLine === "all") {
      setGlobalLine(null)
    } else if (urlGlobalLine !== globalLine) {
      setGlobalLine(urlGlobalLine)
    }

    if (urlSportsbook !== selectedSportsbook) {
      setSelectedSportsbook(urlSportsbook)
    }

    if (urlLine !== selectedLine) {
      setSelectedLine(urlLine)
    }

    if (urlGames) {
      setSelectedGames(urlGames.split(","))
    } else if (!urlGames && selectedGames) {
      setSelectedGames(null)
    }
  }, [searchParams])

  // Reset globalLine when market changes and prefetch next market data
  useEffect(() => {
    setGlobalLine(null)

    // Get all markets for the sport
    const markets = getMarketsForSport(sport)

    // Find current market index
    const currentIndex = markets.findIndex((m) => m.value === market)

    // Prefetch next market if exists
    if (currentIndex >= 0 && currentIndex < markets.length - 1) {
      const nextMarket = markets[currentIndex + 1].value
      prefetchPropComparison(sport, nextMarket)
    }

    // Prefetch previous market if exists
    if (currentIndex > 0) {
      const prevMarket = markets[currentIndex - 1].value
      prefetchPropComparison(sport, prevMarket)
    }
  }, [market, sport])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(Array.from(searchParams.entries()))

    if (market) {
      params.set("market", market)
    } else {
      params.delete("market")
    }

    if (globalLine) {
      params.set("globalLine", globalLine)
    } else {
      params.delete("globalLine")
    }

    if (selectedSportsbook) {
      params.set("sportsbook", selectedSportsbook)
    } else {
      params.delete("sportsbook")
    }

    if (selectedLine) {
      params.set("line", selectedLine)
    } else {
      params.delete("line")
    }

    if (selectedGames?.length) {
      params.set("games", selectedGames.join(","))
    } else {
      params.delete("games")
    }

    const newUrl = `${pathname}?${params.toString()}`
    router.replace(newUrl)
  }, [market, globalLine, selectedSportsbook, selectedLine, selectedGames, pathname, router, searchParams])

  return (
    <div
      className={cn(
        "space-y-4",
        isMobile && "-mx-4", // Extend to screen edges on mobile
      )}
    >
      {/* Combined Navigation and Filters */}
      <PropComparisonNavigationFilters
        // Navigation props
        currentSport={sport}
        currentCategory="player-props"
        totalProps={totalCount}
        
        // Filter props
        market={market}
        onMarketChange={setMarket}
        onMarketHover={handleMarketHover}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedSportsbook={selectedSportsbook}
        onSportsbookChange={setSelectedSportsbook}
        selectedLine={selectedLine}
        onLineChange={setSelectedLine}
        globalLine={globalLine}
        onGlobalLineChange={setGlobalLine}
        availableLines={availableLines}
        lineRange={null}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={(field: "odds" | "edge" | "name" | "ev", direction: "asc" | "desc") => {
          setSortField(field)
          setSortDirection(direction)
        }}
        availableGames={availableGames}
        selectedGames={selectedGames}
        onGameFilterChange={setSelectedGames}
        bestOddsFilter={bestOddsFilter}
        onBestOddsFilterChange={setBestOddsFilter}
        isLoading={isLoading}
        refetch={refetch}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        lastUpdated={lastUpdated}
        // Pre-Game / Live control
        mode={mode}
        onModeChange={setMode}
        preGameCount={preGameCount}
        liveCount={liveCount}
      />

      {/* Loading state */}
      {isLoading && <PropComparisonTableSkeleton />}

      {/* Error state */}
      {isError && (
        <Alert
          variant="destructive"
          className={cn(
            "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-400",
            isMobile && "-mx-4 border-x-0 rounded-none",
          )}
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Error loading prop comparison data. Please try refreshing the page.</AlertDescription>
        </Alert>
      )}

      {/* Empty state */}
      {!isLoading && !isError && displayData?.length === 0 && (
        <Card
          className={cn(
            "p-8 text-center bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800",
            isMobile && "-mx-4 border-x-0 rounded-none",
          )}
        >
          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-slate-400 dark:text-slate-500" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">No props found</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Try adjusting your filters to see more results
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Data display */}
      {!isLoading && !isError && displayData && displayData.length > 0 && (
        <>
          {viewMode === "table" ? (
            <PropComparisonTableOddsBlaze
              data={displayData}
              sortField={sortField}
              sortDirection={sortDirection}
              onSortChange={(field, direction) => {
                setSortField(field)
                setSortDirection(direction)
              }}
              bestOddsFilter={bestOddsFilter}
              // Remove evMethod prop
              // evMethod={evMethod}
              globalLine={globalLine}
              sport={sport}
            />
          ) : (
            <Card
              className={cn(
                "p-6 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800",
                isMobile && "-mx-4 border-x-0 rounded-none px-4",
              )}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayData.map((item) => (
                  <PropComparisonCardV2
                    key={item.player_id}
                    data={item}
                    bestOddsFilter={bestOddsFilter}
                    globalLine={globalLine}
                    // Remove evMethod prop
                    // evMethod={evMethod}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    sport={sport}
                  />
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
