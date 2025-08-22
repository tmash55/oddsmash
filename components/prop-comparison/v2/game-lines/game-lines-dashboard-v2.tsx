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
import { useGameLinesV2 } from "@/hooks/use-game-lines-v2"
import { useTransformedGameLinesData } from "@/hooks/use-game-lines-transforms"

// Compact loading skeleton
function GameLinesTableSkeleton() {
  const isMobile = useMediaQuery("(max-width: 768px)")

  return (
    <div className="space-y-4">
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

  // Pre-Match / Live mode (Live locked for now)
  const [mode, setMode] = useState<"prematch" | "live">("prematch")

  // Filter states
  const normalizeMarket = (raw: string | null): string => {
    const v = (raw || "").toLowerCase()
    if (!v) return "moneyline"
    if (v === "h2h" || v === "moneyline" || v === "ml") return "moneyline"
    if (v === "spread" || v === "spreads") return "spread"
    if (v === "total" || v === "totals") return "total"
    if (v === "runline" || v === "run_line") return "run_line"
    if (v === "puckline" || v === "puck_line") return "puck_line"
    return v
  }

  const [market, setMarket] = useState(() => {
    const urlMarket = searchParams.get("market")
    return normalizeMarket(urlMarket)
  })
  
  // Removed line selection; always use standard per-book lines

  const [selectedSportsbook, setSelectedSportsbook] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<string>("full") // full, q1, q2, etc.
  const [selectedGames, setSelectedGames] = useState<string[] | null>(null)

  // Sort states
  const [sortField, setSortField] = useState<"time" | "home" | "away" | "odds">("time")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Fetch data via hook
  const { data, isLoading, isError, refetch } = useGameLinesV2({
    sport,
    market,
    gameId: selectedGames?.[0] || undefined,
  })

  // Process data
  const { processedData, sortedData, availableLines, availableGames, totalCount, filteredCount } =
    useTransformedGameLinesData({
      data: data?.games,
      market,
      globalLine: null,
      searchQuery,
      selectedGames,
      sportsbookFilter: selectedSportsbook,
      sortField,
      sortDirection,
    })

  // Pre-match count from processed/filtered games
  const preMatchCount = useMemo(() => {
    const now = Date.now()
    return (sortedData || []).filter((g) => {
      const t = new Date(g.commence_time).getTime()
      return isFinite(t) && t > now
    }).length
  }, [sortedData])

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

    // Remove line param handling

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
  }, [market, selectedSportsbook, selectedPeriod, selectedGames, pathname, router, searchParams])

  return (
    <div
      className={cn(
        "space-y-4",
        isMobile && "-mx-4", // Extend to screen edges on mobile
      )}
    >
      {/* Filters - always visible */}
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
            selectedSportsbook={selectedSportsbook}
            onSportsbookChange={setSelectedSportsbook}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            selectedGames={selectedGames}
            onGamesChange={setSelectedGames}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            availableGames={availableGames}
            // Pre-Match / Live control
            mode={mode}
            onModeChange={setMode}
            preMatchCount={preMatchCount}
          />
        </div>
      </Card>

      {/* Loading state - table only */}
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
                selectedLine={null}
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