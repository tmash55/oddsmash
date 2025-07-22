"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { RefreshCw, Grid3X3, List, AlertCircle, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useMediaQuery } from "@/hooks/use-media-query"
import { usePropComparisonV2 } from "@/hooks/use-prop-comparison-v2"
import { useTransformedPropData } from "@/hooks/use-prop-comparison-transforms"
import { cn } from "@/lib/utils"
import { getMarketsForSport, getDefaultMarket } from "@/lib/constants/markets"
import type { BestOddsFilter } from "@/types/prop-comparison"
import { PropComparisonFiltersV2 } from "@/components/prop-comparison/v2/prop-comparison-filters-v2"
import { PropComparisonTableV2 } from "@/components/prop-comparison/v2/prop-comparison-table-v2"
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

interface PropComparisonDashboardV2Props {
  sport: string
}

export function PropComparisonDashboardV2({ sport }: PropComparisonDashboardV2Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const queryClient = useQueryClient()

  // View state (table/grid)
  const [viewMode, setViewMode] = useState<"table" | "grid">(isMobile ? "grid" : "table")

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
  const [sortField, setSortField] = useState<"odds" | "line" | "edge" | "name" | "ev">("name")
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

  // Fetch data
  const { data, isLoading, isError, refetch } = usePropComparisonV2({
    sport,
    market,
    sportsbook: selectedSportsbook,
    line: selectedLine,
    gameId: selectedGames?.[0] || undefined,
  })

  // Transform data with optimized caching
  const { processedData, sortedData, totalCount, filteredCount } = useTransformedPropData({
    data: data?.data,
    globalLine,
    searchQuery,
    selectedGames,
    bestOddsFilter,
    sortField,
    sortDirection,
  })

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
      {/* Compact Filters and Controls */}
      <Card
        className={cn(
          "p-4 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800",
          isMobile && "border-x-0 rounded-none", // Full width on mobile
        )}
      >
        <div className="space-y-3">
          {/* Top row - Results count and view controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500 dark:text-purple-400" />
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                {filteredCount.toLocaleString()} of {totalCount.toLocaleString()} props
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                className="h-8 px-2 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
              >
                <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
              </Button>

              <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-md p-0.5 bg-slate-100/50 dark:bg-slate-800/50">
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className={cn(
                    "h-6 px-2",
                    viewMode === "table"
                      ? "bg-purple-500 hover:bg-purple-600 text-white"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700",
                  )}
                >
                  <List className="h-3 w-3" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "h-6 px-2",
                    viewMode === "grid"
                      ? "bg-purple-500 hover:bg-purple-600 text-white"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700",
                  )}
                >
                  <Grid3X3 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <PropComparisonFiltersV2
            market={market}
            onMarketChange={setMarket}
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
            onSortChange={(field: "odds" | "line" | "edge" | "name", direction: "asc" | "desc") => {
              setSortField(field)
              setSortDirection(direction)
            }}
            sport={sport}
            availableGames={availableGames}
            selectedGames={selectedGames}
            onGameFilterChange={setSelectedGames}
            bestOddsFilter={bestOddsFilter}
            onBestOddsFilterChange={setBestOddsFilter}
            isLoading={isLoading}
            refetch={refetch}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            // Remove evMethod props
            // evMethod={evMethod}
            // onEvMethodChange={setEvMethod}
          />
        </div>
      </Card>

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
      {!isLoading && !isError && filteredCount === 0 && (
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
      {!isLoading && !isError && filteredCount > 0 && (
        <>
          {viewMode === "table" ? (
            <PropComparisonTableV2
              data={sortedData}
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
                {sortedData.map((item) => (
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
