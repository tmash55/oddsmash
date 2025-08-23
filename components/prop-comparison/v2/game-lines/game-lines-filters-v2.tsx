"use client"

import { Search, Filter, Lock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { getGameLinesForSport } from "@/lib/constants/game-markets"
import { pathToApiId } from "@/data/sport-mappings"

interface Game {
  odds_event_id: string
  home_team: string
  away_team: string
  commence_time: string
  bookmakers?: Array<{
    key: string
    title: string
    markets: Array<{
      key: string
      line?: string
      outcomes: Array<{
        name: string
        price: number
        point?: number
      }>
    }>
  }>
}

interface GameLinesFiltersV2Props {
  sport: string
  selectedMarket: string
  onMarketChange: (market: string) => void
  selectedSportsbook: string | null
  onSportsbookChange: (sportsbook: string | null) => void
  selectedPeriod: string
  onPeriodChange: (period: string) => void
  selectedGames: string[] | null
  onGamesChange: (games: string[] | null) => void
  // New props
  searchQuery?: string
  onSearchChange?: (query: string) => void
  availableGames?: Array<{ event_id: string; home_team: string; away_team: string; commence_time: string }>
  // Pre-match / Live toggle (Live locked for now)
  mode?: "prematch" | "live"
  onModeChange?: (mode: "prematch" | "live") => void
  preMatchCount?: number
  liveCount?: number
}

export function GameLinesFiltersV2({
  sport,
  selectedMarket,
  onMarketChange,
  selectedPeriod,
  onPeriodChange,
  selectedGames,
  onGamesChange,
  searchQuery,
  onSearchChange,
  
  availableGames = [],
  mode = "prematch",
  onModeChange,
  preMatchCount = 0,
  liveCount = 0,
}: GameLinesFiltersV2Props) {
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Calculate active filter count for mobile badge
  const activeFilterCount = [selectedGames].filter(Boolean).length

  return (
    <div className="w-full space-y-4">
      {isMobile ? (
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3 w-full">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 h-10 w-10 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all hover:scale-105"
                  >
                    <Filter className="h-4 w-4" />
                    {activeFilterCount > 0 && (
                      <Badge
                        variant="secondary"
                        className="absolute -top-2 -right-2 h-5 min-w-[20px] bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      >
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full sm:w-[400px] p-0">
                  <SheetHeader className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  {/* Mobile filters will go here */}
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          {/* Primary Filters */}
          <div className="p-4 flex flex-wrap items-center gap-3">
            {/* Market */}
            <Select value={selectedMarket} onValueChange={onMarketChange}>
              <SelectTrigger className="w-[220px] h-10 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <SelectValue placeholder="Select market" />
              </SelectTrigger>
              <SelectContent>
                {(() => {
                  const sportApiId = pathToApiId[sport]
                  const normalizeSportForMarkets = (s: string): string => {
                    switch (s) {
                      case "americanfootball_nfl":
                        return "football_nfl"
                      case "americanfootball_ncaaf":
                        return "football_ncaaf"
                      case "basketball_wnba":
                        return "basketball_wnba"
                      default:
                        return s
                    }
                  }
                  const markets = getGameLinesForSport(normalizeSportForMarkets(sportApiId))
                  return markets.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      <div className="flex flex-col">
                        <span>{m.label}</span>
                        {m.description && (
                          <span className="text-xs text-slate-500">{m.description}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                })()}
              </SelectContent>
            </Select>

            {/* Line selector removed: always display standard lines */}

            {/* Games (single-select for now) */}
            <Select
              value={selectedGames?.[0] || "all"}
              onValueChange={(v) => onGamesChange?.(v === "all" ? null : [v])}
            >
              <SelectTrigger className="w-[260px] h-10 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <SelectValue placeholder="All Games" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Games</SelectItem>
                {availableGames.filter((g) => {
                  try {
                    return new Date(g.commence_time).getTime() > Date.now()
                  } catch {
                    return true
                  }
                }).map((g) => {
                  const date = new Date(g.commence_time)
                  const dateStr = date.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "2-digit" })
                  const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
                  return (
                    <SelectItem key={g.event_id} value={g.event_id}>
                      <div className="flex flex-col w-full">
                        <div className="flex items-center w-full">
                          <span>{g.away_team} @ {g.home_team}</span>
                        </div>
                        <span className="text-[11px] text-slate-500">{dateStr} at {timeStr}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search teams..."
                value={searchQuery || ""}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="pl-10 h-10 w-[220px] border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
              />
            </div>
          </div>
        </Card>
      )}
      {/* Second row: Pre-Match / Live next to view toggles area */}
      {!isMobile && (
        <div className="px-4 pb-4 flex items-center gap-3">
          <div className="flex items-center rounded-2xl border px-1 py-1 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
            <button
              type="button"
              className={`px-3 py-1.5 rounded-xl text-sm font-medium ${mode !== 'live' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow' : 'text-slate-600 dark:text-slate-300'}`}
              onClick={() => onModeChange?.('prematch')}
            >
              Pre-Match <span className="ml-1 tabular-nums">{preMatchCount}</span>
            </button>
            <button
              type="button"
              disabled
              className="px-3 py-1.5 rounded-xl text-sm font-medium text-slate-400 dark:text-slate-500 inline-flex items-center gap-1"
              title="Live game lines coming soon"
            >
              Live <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 