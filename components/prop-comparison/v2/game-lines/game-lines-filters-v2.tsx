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
  selectedLine: string | null
  onLineChange: (line: string | null) => void
  selectedSportsbook: string | null
  onSportsbookChange: (sportsbook: string | null) => void
  selectedPeriod: string
  onPeriodChange: (period: string) => void
  selectedGames: string[] | null
  onGamesChange: (games: string[] | null) => void
}

export function GameLinesFiltersV2({
  sport,
  selectedMarket,
  onMarketChange,
  selectedLine,
  onLineChange,
  selectedSportsbook,
  onSportsbookChange,
  selectedPeriod,
  onPeriodChange,
  selectedGames,
  onGamesChange,
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
            <Select value={selectedMarket} onValueChange={onMarketChange}>
              <SelectTrigger className="w-[200px] h-10 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <SelectValue placeholder="Select market" />
              </SelectTrigger>
              <SelectContent>
                {(() => {
                  const sportApiId = pathToApiId[sport]
                  const markets = getGameLinesForSport(sportApiId)
                  return markets.map((market) => (
                    <SelectItem key={market.value} value={market.value}>
                      <div className="flex flex-col">
                        <span>{market.label}</span>
                        {market.description && (
                          <span className="text-xs text-slate-500">{market.description}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                })()}
              </SelectContent>
            </Select>

            {/* Add other filters here */}
          </div>
        </Card>
      )}
    </div>
  )
} 