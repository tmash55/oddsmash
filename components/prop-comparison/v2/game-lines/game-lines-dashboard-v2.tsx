"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { RefreshCw, Grid3X3, List, AlertCircle, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { getMarketsForSport, getDefaultMarket } from "@/lib/constants/markets"
import { GameLinesTableV2 } from "./game-lines-table-v2"
import { GameLinesFiltersV2 } from "./game-lines-filters-v2"

// Compact loading skeleton
function GameLinesTableSkeleton() {
  const isMobile = useMediaQuery("(max-width: 768px)")

  return (
    <div className="space-y-4">
      {/* Compact filters skeleton */}
      <Card className={cn("p-4 bg-slate-900/50 border-slate-800", isMobile && "-mx-4 border-x-0 rounded-none")}>
        <div className="flex flex-wrap gap-2 mb-3">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 bg-slate-700" />
            ))}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1 bg-slate-700" />
          <Skeleton className="h-8 w-20 bg-slate-700" />
        </div>
      </Card>

      {/* Table skeleton */}
      <Card className={cn("p-4 bg-slate-900/50 border-slate-800", isMobile && "-mx-4 border-x-0 rounded-none")}>
        <div className="space-y-3">
          <div className="grid grid-cols-7 gap-2">
            {Array(7)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-6 w-full bg-slate-700" />
              ))}
          </div>
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="grid grid-cols-7 gap-2">
                {Array(7)
                  .fill(0)
                  .map((_, j) => (
                    <Skeleton key={j} className="h-10 w-full bg-slate-700" />
                  ))}
              </div>
            ))}
        </div>
      </Card>
    </div>
  )
}

interface GameLinesDashboardV2Props {
  sport: string
}

export function GameLinesDashboardV2({ sport }: GameLinesDashboardV2Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("")

  // View state (table/grid)
  const [viewMode, setViewMode] = useState<"table" | "grid">(isMobile ? "grid" : "table")

  // Filter states
  const [market, setMarket] = useState(() => {
    const urlMarket = searchParams.get("market")
    // Default to moneyline, but use total if specified in URL
    return urlMarket === "total" ? "total" : (urlMarket || "moneyline")
  })
  
  const [selectedLine, setSelectedLine] = useState<string | null>(() => {
    const urlLine = searchParams.get("line")
    return urlLine || null
  })

  const [selectedSportsbook, setSelectedSportsbook] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<string>("full") // full, q1, q2, etc.
  const [selectedGames, setSelectedGames] = useState<string[] | null>(null)

  // Sort states
  const [sortField, setSortField] = useState<"time" | "home" | "away" | "odds">("time")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Fetch data
  const [data, setData] = useState<any[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/odds/${sport}/${market}`)
      const json = await response.json()
      setData(json)
      setIsError(false)
    } catch (error) {
      console.error("Error fetching game lines:", error)
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }

  const refetch = () => {
    fetchData()
  }

  useEffect(() => {
    fetchData()
  }, [sport, market])

  // Process data
  const processedData = useMemo(() => {
    if (!data) return []
    return data
  }, [data])

  const sortedData = useMemo(() => {
    return processedData
  }, [processedData])

  const totalCount = data?.length || 0
  const filteredCount = sortedData.length || 0

  // Update sort direction when field changes
  useEffect(() => {
    if (["odds"].includes(sortField)) {
      setSortDirection("desc")
    } else if (["time"].includes(sortField)) {
      setSortDirection("asc")
    }
  }, [sortField])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(Array.from(searchParams.entries()))

    if (market) {
      params.set("market", market)
    } else {
      params.delete("market")
    }

    if (selectedLine) {
      params.set("line", selectedLine)
    } else {
      params.delete("line")
    }

    if (selectedSportsbook) {
      params.set("sportsbook", selectedSportsbook)
    } else {
      params.delete("sportsbook")
    }

    if (selectedPeriod !== "full") {
      params.set("period", selectedPeriod)
    } else {
      params.delete("period")
    }

    if (selectedGames?.length) {
      params.set("games", selectedGames.join(","))
    } else {
      params.delete("games")
    }

    const newUrl = `${pathname}?${params.toString()}`
    router.replace(newUrl)
  }, [market, selectedLine, selectedSportsbook, selectedPeriod, selectedGames, pathname, router, searchParams])

  return (
    <div
      className={cn(
        "space-y-4",
        isMobile && "-mx-4", // Extend to screen edges on mobile
      )}
    >
      {/* Loading state */}
      {isLoading && <GameLinesTableSkeleton />}

      {/* Error state */}
      {isError && (
        <Alert
          variant="destructive"
          className={cn("bg-red-900/20 border-red-800 text-red-400", isMobile && "-mx-4 border-x-0 rounded-none")}
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Error loading game lines data. Please try refreshing the page.</AlertDescription>
        </Alert>
      )}

      {/* Empty state */}
      {!isLoading && !isError && filteredCount === 0 && (
        <Card
          className={cn(
            "p-8 text-center bg-slate-900/50 border-slate-800",
            isMobile && "-mx-4 border-x-0 rounded-none",
          )}
        >
          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-slate-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">No games found</h3>
              <p className="text-sm text-slate-400">Try adjusting your filters to see more results</p>
            </div>
          </div>
        </Card>
      )}

      {/* Data display */}
      {!isLoading && !isError && filteredCount > 0 && (
        <>
          {/* Compact Filters and Controls */}
          <Card
            className={cn(
              "p-4 bg-slate-900/50 border-slate-800",
              isMobile && "border-x-0 rounded-none", // Full width on mobile
            )}
          >
            <div className="space-y-3">
              {/* Top row - Results count and view controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-400" />
                  <span className="text-sm font-medium text-white">
                    {filteredCount.toLocaleString()} of {totalCount.toLocaleString()} games
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-slate-800 border-slate-700 hover:bg-slate-700"
                    onClick={refetch}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      "h-8 w-8 bg-slate-800 border-slate-700 hover:bg-slate-700",
                      viewMode === "grid" && "bg-slate-700",
                    )}
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      "h-8 w-8 bg-slate-800 border-slate-700 hover:bg-slate-700",
                      viewMode === "table" && "bg-slate-700",
                    )}
                    onClick={() => setViewMode("table")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <GameLinesFiltersV2
                sport={sport}
                selectedMarket={market}
                onMarketChange={setMarket}
                selectedLine={selectedLine}
                onLineChange={setSelectedLine}
                selectedSportsbook={selectedSportsbook}
                onSportsbookChange={setSelectedSportsbook}
                selectedPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
                selectedGames={selectedGames}
                onGamesChange={setSelectedGames}
              />
            </div>
          </Card>

          {/* Table View */}
          {viewMode === "table" && (
            <GameLinesTableV2
              data={sortedData}
              sport={sport}
              sortField={sortField}
              sortDirection={sortDirection}
              onSortChange={(field, direction) => {
                setSortField(field)
                setSortDirection(direction)
              }}
              selectedLine={selectedLine}
              selectedMarket={market}  // Add this line
            />
          )}

          {/* Grid View */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Grid view implementation */}
            </div>
          )}
        </>
      )}
    </div>
  )
} 