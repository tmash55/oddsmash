"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, RefreshCw, Grid3X3, List, X, ArrowUpDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { sportsbooks } from "@/data/sportsbooks"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Filter } from "lucide-react"
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
}

export function GameLinesFiltersV2({
  sport,
  selectedMarket,
  onMarketChange,
  selectedSportsbook,
  onSportsbookChange,
  selectedPeriod,
  onPeriodChange,
  selectedGames,
  onGamesChange,
  searchQuery,
  onSearchChange,
  
  availableGames = [],
}: GameLinesFiltersV2Props) {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const activeSportsbooks = sportsbooks.filter((book) => book.isActive)

  // Calculate active filter count for mobile badge
  const activeFilterCount = [selectedGames, selectedSportsbook].filter(Boolean).length

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

            {/* Sportsbook filter */}
            <Select value={selectedSportsbook || "all"} onValueChange={(v) => onSportsbookChange?.(v === "all" ? null : v)}>
              <SelectTrigger className="w-[200px] h-10 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <SelectValue placeholder="Sportsbook" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sportsbooks</SelectItem>
                {activeSportsbooks.map((book) => (
                  <SelectItem key={book.id} value={book.id}>
                    <div className="flex items-center gap-2">
                      <Image src={book.logo} alt={book.name} width={18} height={18} className="object-contain" />
                      <span>{book.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
                {availableGames.map((g) => (
                  <SelectItem key={g.event_id} value={g.event_id}>
                    {g.away_team} @ {g.home_team}
                  </SelectItem>
                ))}
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
    </div>
  )
} 