"use client"

import { useState, useEffect } from "react"
import { Search, RefreshCw, Grid, TableIcon, Filter, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type SupportedSport, type SportMarket, SPORT_CONFIGS } from "@/types/sports"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import Image from "next/image"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Game {
  odds_event_id: string
  home_team: string
  away_team: string
  commence_time: string
}

interface HitRateFiltersV4Props {
  sport: SupportedSport
  onMarketChange: (market: SportMarket) => void
  onViewModeChange: (mode: "table" | "grid") => void
  onSearchChange: (query: string) => void
  onSortChange: (field: string, direction: "asc" | "desc") => void
  onGameFilterChange: (gameIds: string[] | null) => void
  onRefreshData: () => void
  onCustomTierChange: (tier: number | null) => void
  currentMarket: SportMarket
  currentViewMode: "table" | "grid"
  searchQuery: string
  availableGames: Game[]
  selectedGames: string[] | null
  isLoading: boolean
  currentSortField: string
  currentSortDirection: "asc" | "desc"
  customTierOptions: number[]
  customTier: number | null
}

// Helper functions for team logos and abbreviations
function getTeamLogoFilename(abbr: string): string {
  if (!abbr) return "default"
  const teamAbbreviationMap: Record<string, string> = {
    ARI: "AZ", // Arizona Diamondbacks
    AT: "OAK", // Oakland Athletics  
    ATH: "OAK", // Oakland Athletics (alternative)
    A: "OAK", // Oakland Athletics (alternative)
    CWS: "CHW", // Chicago White Sox - use CHW.svg
  }
  const upperAbbr = abbr.toUpperCase()
  return teamAbbreviationMap[upperAbbr] || upperAbbr
}

function getStandardAbbreviation(abbr: string): string {
  const map: Record<string, string> = {
    AT: "OAK",
  }
  return map[abbr] || abbr
}

function getTeamAbbreviation(teamName: string): string {
  const teamMap: Record<string, string> = {
    "Los Angeles Angels": "LAA",
    "Houston Astros": "HOU",
    "Oakland Athletics": "OAK",
    "Toronto Blue Jays": "TOR",
    "Atlanta Braves": "ATL",
    "Milwaukee Brewers": "MIL",
    "St. Louis Cardinals": "STL",
    "Arizona Diamondbacks": "ARI",
    "Los Angeles Dodgers": "LAD",
    "San Francisco Giants": "SF",
    "Cleveland Guardians": "CLE",
    "Seattle Mariners": "SEA",
    "Miami Marlins": "MIA",
    "New York Mets": "NYM",
    "Washington Nationals": "WSH",
    "Baltimore Orioles": "BAL",
    "San Diego Padres": "SD",
    "Philadelphia Phillies": "PHI",
    "Pittsburgh Pirates": "PIT",
    "Texas Rangers": "TEX",
    "Tampa Bay Rays": "TB",
    "Boston Red Sox": "BOS",
    "Cincinnati Reds": "CIN",
    "Colorado Rockies": "COL",
    "Detroit Tigers": "DET",
    "Kansas City Royals": "KC",
    "Minnesota Twins": "MIN",
    "Chicago White Sox": "CWS",
    "Chicago Cubs": "CHC",
    "New York Yankees": "NYY",
  }
  return teamMap[teamName] || teamName.slice(0, 3).toUpperCase()
}

const formatGameTime = (timeString: string): string => {
  try {
    const date = new Date(timeString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const gameDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    const isToday = gameDate.getTime() === today.getTime()
    const isTomorrow = gameDate.getTime() === today.getTime() + 24 * 60 * 60 * 1000
    
    const timeFormat = date.toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    
    if (isToday) {
      return `Today ${timeFormat}`
    } else if (isTomorrow) {
      return `Tomorrow ${timeFormat}`
    } else {
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    }
  } catch (e) {
    return "TBD"
  }
}

// Helper function to get market-specific terminology
const getMarketTerminology = (market: SportMarket) => {
  const marketMap: Record<string, { singular: string; plural: string; label: string }> = {
    Hits: { singular: "Hit", plural: "Hits", label: "Line" },
    Strikeouts: { singular: "Strikeout", plural: "Strikeouts", label: "Line" },
    "Total Bases": { singular: "Total Base", plural: "Total Bases", label: "Line" },
    RBI: { singular: "RBI", plural: "RBIs", label: "Line" },
    RBIs: { singular: "RBI", plural: "RBIs", label: "Line" },
    Runs: { singular: "Run", plural: "Runs", label: "Line" },
    "Home Runs": { singular: "Home Run", plural: "Home Runs", label: "Line" },
    Walks: { singular: "Walk", plural: "Walks", label: "Line" },
    "Batting Walks": { singular: "Walk", plural: "Walks", label: "Line" },
    Singles: { singular: "Single", plural: "Singles", label: "Line" },
    Doubles: { singular: "Double", plural: "Doubles", label: "Line" },
    Triples: { singular: "Triple", plural: "Triples", label: "Line" },
    "Hits + Runs + RBIs": { singular: "H+R+RBI", plural: "H+R+RBI", label: "Line" },
    "Hits Allowed": { singular: "Hit Allowed", plural: "Hits Allowed", label: "Line" },
    "Earned Runs": { singular: "Earned Run", plural: "Earned Runs", label: "Line" },
    Outs: { singular: "Out", plural: "Outs", label: "Line" },
    "Stolen Bases": { singular: "Stolen Base", plural: "Stolen Bases", label: "Line" },
  }
  
  return marketMap[market] || { singular: "Unit", plural: "Units", label: "Line" }
}

// Helper function to format tier options with market context
const formatTierOption = (tier: number, market: SportMarket): string => {
  const terminology = getMarketTerminology(market)
  
  if (tier === 1) {
    return `1 ${terminology.singular}`
  } else {
    return `${tier}+ ${terminology.plural}`
  }
}

// Add this new component for consistent game display
const GameDisplay = ({ game, showTime = false }: { game: Game, showTime?: boolean }) => {
  const awayAbbr = getStandardAbbreviation(getTeamAbbreviation(game.away_team))
  const homeAbbr = getStandardAbbreviation(getTeamAbbreviation(game.home_team))
  const gameTime = showTime ? formatGameTime(game.commence_time) : null
  
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex items-center gap-1">
        <Image
          src={`/images/mlb-teams/${getTeamLogoFilename(awayAbbr)}.svg`}
          alt={awayAbbr}
          width={16}
          height={16}
          className="object-contain"
        />
        <span className="text-sm font-medium">{awayAbbr}</span>
      </div>
      <span className="text-sm text-slate-400">@</span>
      <div className="flex items-center gap-1">
        <Image
          src={`/images/mlb-teams/${getTeamLogoFilename(homeAbbr)}.svg`}
          alt={homeAbbr}
          width={16}
          height={16}
          className="object-contain"
        />
        <span className="text-sm font-medium">{homeAbbr}</span>
      </div>
      {showTime && <span className="text-xs text-slate-400 ml-auto">{gameTime}</span>}
    </div>
  )
}

export default function HitRateFiltersV4({
  sport,
  onMarketChange,
  onViewModeChange,
  onSearchChange,
  onSortChange,
  onGameFilterChange,
  onRefreshData,
  onCustomTierChange,
  currentMarket,
  currentViewMode,
  searchQuery,
  availableGames,
  selectedGames,
  isLoading,
  currentSortField,
  currentSortDirection,
  customTierOptions,
  customTier,
}: HitRateFiltersV4Props) {
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Set default line on mount if not already set
  useEffect(() => {
    if (customTier === undefined) {
      onCustomTierChange(null)
    }
  }, [])

  // Calculate active filter count for mobile badge
  const activeFilterCount = [selectedGames, searchQuery, customTier].filter(Boolean).length

  // Get available markets based on sport
  const getAvailableMarkets = (): SportMarket[] => {
    const config = SPORT_CONFIGS[sport]
    return config.markets.map((m) => m.value)
  }

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(debouncedSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [debouncedSearch, onSearchChange])

  // Mobile filters render function
  const renderMobileFilters = () => (
    <div className="space-y-6 p-6 bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-900/50 dark:to-slate-900">
      {/* Line Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Line</Label>
        <Select value={customTier?.toString() || "all"} onValueChange={(value) => onCustomTierChange(value === "all" ? null : Number(value))}>
          <SelectTrigger className="w-full h-11 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <SelectValue placeholder="All Lines" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Lines</SelectItem>
            {customTierOptions.map((tier) => (
              <SelectItem key={tier} value={tier.toString()}>
                {formatTierOption(tier, currentMarket)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Market Select */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Market</Label>
              <Select value={currentMarket} onValueChange={onMarketChange}>
          <SelectTrigger className="w-full h-11 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
                  <SelectValue placeholder="Select market" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableMarkets().map((market) => (
              <SelectItem key={market} value={market}>
                      {market}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

      {/* Games Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Games</Label>
        <Select
          value={selectedGames?.[0] || "all"}
          onValueChange={(value) => onGameFilterChange(value === "all" ? null : [value])}
        >
          <SelectTrigger className="h-11 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <SelectValue>
              {selectedGames?.[0] ? (
                <GameDisplay game={availableGames.find(g => g.odds_event_id === selectedGames[0])!} />
              ) : (
                "All Games"
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-80">
            <SelectItem value="all">All Games</SelectItem>
            {availableGames.map((game) => (
              <SelectItem key={game.odds_event_id} value={game.odds_event_id}>
                <GameDisplay game={game} showTime />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Search */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Search Players</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search players..."
            value={debouncedSearch}
            onChange={(e) => setDebouncedSearch(e.target.value)}
            className="pl-10 h-11 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* View Mode */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">View Mode</Label>
              <Select value={currentViewMode} onValueChange={onViewModeChange}>
          <SelectTrigger className="w-full h-11 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent>
            <SelectItem value="grid">
                    <div className="flex items-center gap-2">
                      <Grid className="h-4 w-4" />
                      <span>Cards</span>
                    </div>
                  </SelectItem>
            <SelectItem value="table">
                    <div className="flex items-center gap-2">
                      <TableIcon className="h-4 w-4" />
                      <span>Table</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

      {/* Advanced Settings Section */}
      <div className="space-y-6">
        <h3 className="font-semibold text-base text-slate-800 dark:text-slate-200">Advanced Settings</h3>

        {/* Custom Tier */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {getMarketTerminology(currentMarket).label}
          </Label>
              <Select 
                value={customTier?.toString() || "default"} 
                onValueChange={(value) => onCustomTierChange(value === "default" ? null : Number(value))}
              >
            <SelectTrigger className="w-full h-11 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
                  <SelectValue placeholder="Default Line" />
                </SelectTrigger>
                <SelectContent>
              <SelectItem value="default">Default Line</SelectItem>
                  {customTierOptions.map((tier) => (
                <SelectItem key={tier} value={tier.toString()}>
                      {formatTierOption(tier, currentMarket)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

        {/* Games Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Games</Label>
              <Select
                value={selectedGames?.join(",") || "all"}
                onValueChange={(value) => onGameFilterChange(value === "all" ? null : value.split(","))}
              >
            <SelectTrigger className="h-11 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <SelectValue>
                {selectedGames?.length === 1 ? (
                  <GameDisplay 
                    game={availableGames.find(g => g.odds_event_id === selectedGames[0])!} 
                    showTime={false}
                  />
                ) : selectedGames?.length ? (
                  `${selectedGames.length} Games Selected`
                ) : (
                  "All games"
                )}
              </SelectValue>
                </SelectTrigger>
            <SelectContent className="max-h-80">
              <SelectItem value="all">All games</SelectItem>
                  {availableGames.map((game) => {
                    return (
                  <SelectItem key={game.odds_event_id} value={game.odds_event_id}>
                    <GameDisplay game={game} showTime={true} />
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
    </div>
  )

  // Render line filter
  const renderLineFilter = () => (
    <Select value={customTier?.toString() || "standard"} onValueChange={(value) => onCustomTierChange(value === "standard" ? null : Number(value))}>
      <SelectTrigger className="h-10 w-[140px] border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
        <SelectValue>
          {customTier ? formatTierOption(customTier, currentMarket) : "Standard Lines"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="standard">Standard Lines</SelectItem>
        {customTierOptions.map((tier) => (
          <SelectItem key={tier} value={tier.toString()}>
            {formatTierOption(tier, currentMarket)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

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
                <SheetContent side="left" className="w-full sm:w-[400px] p-0 flex flex-col h-full">
                  <SheetHeader className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <SheetTitle>Filters</SheetTitle>
                      <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <X className="h-4 w-4" />
            </Button>
                      </SheetTrigger>
                    </div>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto">
                    {renderMobileFilters()}
                  </div>
                </SheetContent>
              </Sheet>

              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search players..."
                  value={debouncedSearch}
                  onChange={(e) => setDebouncedSearch(e.target.value)}
                  className="pl-10 h-10 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          {/* Primary Filters */}
          <div className="p-4 flex flex-wrap items-center gap-3">
            {/* Line Filter */}
            {renderLineFilter()}

            {/* Market Select */}
            <Select value={currentMarket} onValueChange={onMarketChange}>
              <SelectTrigger className="h-10 w-[140px] border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <SelectValue placeholder="Select market" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableMarkets().map((market) => (
                  <SelectItem key={market} value={market}>
                    {market}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Games Filter */}
            <Select 
              value={selectedGames?.[0] || "all"}
              onValueChange={(value) => onGameFilterChange(value === "all" ? null : [value])}
            >
              <SelectTrigger className="h-10 w-[180px] border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <SelectValue>
                  {selectedGames?.[0] ? (
                    <GameDisplay game={availableGames.find(g => g.odds_event_id === selectedGames[0])!} />
                  ) : (
                    "All Games"
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Games</SelectItem>
                {availableGames.map((game) => (
                  <SelectItem key={game.odds_event_id} value={game.odds_event_id}>
                    <GameDisplay game={game} showTime />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search players..."
                value={debouncedSearch}
                onChange={(e) => setDebouncedSearch(e.target.value)}
                className="pl-10 h-10 w-[200px] border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow focus:ring-2 focus:ring-blue-500/20"
                              />
                            </div>
                        </div>
                        
          {/* Secondary Filters */}
          <div className="px-4 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* View Mode */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all",
                    currentViewMode === "table" && "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/20"
                  )}
                  onClick={() => onViewModeChange("table")}
                >
                  <TableIcon className="h-4 w-4 mr-2" />
                  Table
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all",
                    currentViewMode === "grid" && "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/20"
                  )}
                  onClick={() => onViewModeChange("grid")}
                >
                  <Grid className="h-4 w-4 mr-2" />
                  Cards
                </Button>
              </div>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

              {/* Sort Controls */}
              <div className="flex items-center gap-2">
                <Select value={currentSortField} onValueChange={(value) => onSortChange(value, currentSortDirection)}>
                  <SelectTrigger className="h-8 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Player</SelectItem>
                    <SelectItem value="tier">Line</SelectItem>
                    <SelectItem value="hit_rate">Hit Rate</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all hover:scale-105"
                  onClick={() => onSortChange(currentSortField, currentSortDirection === "asc" ? "desc" : "asc")}
                >
                  <RefreshCw className={cn("h-4 w-4 transition-transform", currentSortDirection === "desc" && "rotate-180")} />
                </Button>
              </div>
          </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow"
              onClick={onRefreshData}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>

          {/* Active Filters */}
          {(selectedGames || searchQuery || customTier) && (
            <div className="border-t border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 flex flex-wrap items-center gap-2">
              {selectedGames && (
                <Badge
                  variant="secondary"
                  className="h-7 gap-2 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                >
                  <span className="font-medium">{selectedGames.length} game{selectedGames.length > 1 ? 's' : ''}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full"
                    onClick={() => onGameFilterChange(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {searchQuery && (
                <Badge
                  variant="secondary"
                  className="h-7 gap-2 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800"
                >
                  <span className="truncate max-w-[100px] font-medium">{searchQuery}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-green-200 dark:hover:bg-green-800 rounded-full"
                    onClick={() => {
                      setDebouncedSearch("")
                      onSearchChange("")
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {customTier && (
                <Badge
                  variant="secondary"
                  className="h-7 gap-2 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 border-orange-200 dark:border-orange-800"
                >
                  <span className="font-medium">{formatTierOption(customTier, currentMarket)}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full"
                    onClick={() => onCustomTierChange(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  )
} 
