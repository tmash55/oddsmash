"use client"

import { useState, useEffect } from "react"
import { Search, RefreshCw, Grid3X3, List, X, Zap, ArrowUpDown, BarChart3, Info, Check, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { SUPPORTED_MARKETS, getDefaultMarket, formatMarketLabel } from "@/lib/constants/markets"
import type { BestOddsFilter } from "@/types/prop-comparison"
import { sportsbooks } from "@/data/sportsbooks"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Filter } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Settings } from "lucide-react"
import { getTeamLogoUrl } from '@/lib/constants/sport-assets'

const ALL_SPORTSBOOKS = "all_sportsbooks"
const ALL_LINES = "all_lines"

interface Game {
  odds_event_id: string
  home_team: string
  away_team: string
  commence_time: string
}

interface PropComparisonFiltersV2Props {
  market: string
  onMarketChange: (market: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedSportsbook: string | null
  onSportsbookChange: (sportsbook: string | null) => void
  selectedLine: string | null
  onLineChange: (line: string | null) => void
  globalLine: string | null
  onGlobalLineChange: (line: string | null) => void
  availableLines: string[]
  lineRange: { min: number; max: number } | null // Add line range prop
  sortField: "odds" | "line" | "edge" | "name" | "ev"
  sortDirection: "asc" | "desc"
  onSortChange: (field: "odds" | "line" | "edge" | "name" | "ev", direction: "asc" | "desc") => void
  sport: string
  availableGames: Game[]
  selectedGames: string[] | null
  onGameFilterChange: (gameIds: string[] | null) => void
  bestOddsFilter: BestOddsFilter | null
  onBestOddsFilterChange: (filter: BestOddsFilter | null) => void
  isLoading: boolean
  refetch: () => void
  viewMode: "table" | "grid"
  onViewModeChange: (mode: "table" | "grid") => void
  evMethod?: "market-average" | "no-vig"
  onEvMethodChange?: (method: "market-average" | "no-vig") => void
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
    // MLB variations
    AT: "OAK",
    // WNBA variations
    CON: "CTN", // Connecticut Sun
    LOS: "LAS", // Los Angeles Sparks
    PHX: "PHO"  // Phoenix Mercury
  }
  return map[abbr] || abbr
}

function getTeamAbbreviation(teamName: string): string {
  const teamMap: Record<string, string> = {
    // MLB Teams
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
    // WNBA Teams
    "Atlanta Dream": "ATL",
    "Chicago Sky": "CHI",
    "Connecticut Sun": "CTN",
    "Dallas Wings": "DAL",
    "Indiana Fever": "IND",
    "Los Angeles Sparks": "LAS",
    "Las Vegas Aces": "LVA",
    "Minnesota Lynx": "MIN",
    "New York Liberty": "NYL",
    "Phoenix Mercury": "PHO",
    "Seattle Storm": "SEA",
    "Washington Mystics": "WAS"
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

export function PropComparisonFiltersV2({
  market,
  onMarketChange,
  searchQuery,
  onSearchChange,
  selectedSportsbook,
  onSportsbookChange,
  selectedLine,
  onLineChange,
  globalLine,
  onGlobalLineChange,
  availableLines,
  lineRange,
  sortField,
  sortDirection,
  onSortChange,
  sport,
  availableGames,
  selectedGames,
  onGameFilterChange,
  bestOddsFilter,
  onBestOddsFilterChange,
  isLoading,
  refetch,
  viewMode,
  onViewModeChange,
  evMethod = "market-average",
  onEvMethodChange,
}: PropComparisonFiltersV2Props) {
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const markets = SUPPORTED_MARKETS[sport] || []
  const activeSportsbooks = sportsbooks.filter((book) => book.isActive)

  // Set default market if none selected
  useEffect(() => {
    if (!market && sport) {
      onMarketChange(getDefaultMarket(sport))
    }
  }, [sport, market, onMarketChange])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(debouncedSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [debouncedSearch, onSearchChange])

  // Set default view mode based on screen size
  useEffect(() => {
    if (isMobile) {
      onViewModeChange("grid")
    }
  }, [isMobile, onViewModeChange])

  // Calculate active filter count for mobile badge
  const activeFilterCount = [selectedGames, searchQuery, selectedSportsbook, selectedLine, bestOddsFilter].filter(
    Boolean,
  ).length

  // Generate line options based on range
  const generateLineOptions = () => {
    if (!lineRange) return availableLines;
    
    const options: string[] = [];
    let current = lineRange.min;
    
    // Handle decimal increments for certain markets
    const increment = market.toLowerCase().includes('batting_average') ? 0.010 : 0.5;
    const precision = market.toLowerCase().includes('batting_average') ? 3 : 1;
    
    while (current <= lineRange.max) {
      options.push(current.toFixed(precision));
      current += increment;
    }
    
    return options;
  };

  // Render sportsbook logo
  const renderSportsbookLogo = (bookId: string, size: "sm" | "md" = "sm") => {
    const book = sportsbooks.find((b) => b.id === bookId)
    if (!book?.logo) return bookId
    return (
      <Image
        src={book.logo || "/placeholder.svg"}
        alt={book.name}
        width={size === "sm" ? 20 : 24}
        height={size === "sm" ? 20 : 24}
        className="object-contain"
      />
    )
  }

  // Add the global line filter component
  const renderGlobalLineFilter = () => (
    <Select 
      value={globalLine || "standard"} 
      onValueChange={(value) => onGlobalLineChange(value === "standard" ? null : value)}
    >
      <SelectTrigger className="h-10 w-[140px] border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
        <SelectValue>
          {globalLine || "Standard Lines"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="standard">
          <div className="flex items-center">
            <span>Standard Lines</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="ml-2">
                  <Info className="h-4 w-4 text-slate-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">Shows each player&apos;s default line from their market</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </SelectItem>
        {generateLineOptions().map((line) => (
          <SelectItem key={line} value={line}>{line}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  // Add a custom multi-select games filter component
  const renderGamesFilter = () => {
    const selectedGame = selectedGames?.[0] || null;
    
    const handleGameSelect = (gameId: string | null) => {
      onGameFilterChange(gameId ? [gameId] : null);
    };

    return (
      <Select
        value={selectedGame || "all"}
        onValueChange={(value) => handleGameSelect(value === "all" ? null : value)}
      >
        <SelectTrigger className="h-10 w-[180px] border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <SelectValue>
            {selectedGame ? (
              availableGames.find(g => g.odds_event_id === selectedGame) ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {(() => {
                      const game = availableGames.find(g => g.odds_event_id === selectedGame)!;
                      const awayAbbr = getStandardAbbreviation(getTeamAbbreviation(game.away_team));
                      const homeAbbr = getStandardAbbreviation(getTeamAbbreviation(game.home_team));
                      return (
                        <>
                          <Image
                            src={getTeamLogoUrl(awayAbbr, sport)}
                            alt={awayAbbr}
                            width={24}
                            height={24}
                            className="object-contain"
                          />
                          <span className="font-medium text-sm">{awayAbbr}</span>
                          <span className="text-slate-400">@</span>
                          <Image
                            src={getTeamLogoUrl(homeAbbr, sport)}
                            alt={homeAbbr}
                            width={24}
                            height={24}
                            className="object-contain"
                          />
                          <span className="font-medium text-sm">{homeAbbr}</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                "All Games"
              )
            ) : (
              "All Games"
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center justify-between w-full">
              <span>All Games</span>
              {!selectedGame && <Check className="h-4 w-4 ml-2" />}
            </div>
          </SelectItem>
          <SelectSeparator />
          {availableGames.map((game) => {
            const awayAbbr = getStandardAbbreviation(getTeamAbbreviation(game.away_team));
            const homeAbbr = getStandardAbbreviation(getTeamAbbreviation(game.home_team));
            const gameTime = formatGameTime(game.commence_time);
            const isSelected = game.odds_event_id === selectedGame;

            return (
              <SelectItem key={game.odds_event_id} value={game.odds_event_id}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Image
                        src={getTeamLogoUrl(awayAbbr, sport)}
                        alt={awayAbbr}
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                      <span className="font-medium">{awayAbbr}</span>
                    </div>
                    <span className="text-slate-400">@</span>
                    <div className="flex items-center gap-1">
                      <Image
                        src={getTeamLogoUrl(homeAbbr, sport)}
                        alt={homeAbbr}
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                      <span className="font-medium">{homeAbbr}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{gameTime}</span>
                    {isSelected && <Check className="h-4 w-4 ml-2" />}
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  };

  // Update view mode click handler
  const handleViewModeChange = () => {
    onViewModeChange?.(viewMode === "table" ? "grid" : "table")
  }

  // Update the renderMobileFilters function
  const renderMobileFilters = () => (
    <div className="space-y-6 p-4 pb-8">
      {/* Global Line Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Line</Label>
        <Select 
          value={globalLine || "standard"} 
          onValueChange={(value) => onGlobalLineChange(value === "standard" ? null : value)}
        >
          <SelectTrigger className="w-full h-11 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <SelectValue>
              {globalLine || "Standard Lines"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">
              <div className="flex items-center">
                <span>Standard Lines</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="ml-2">
                      <Info className="h-4 w-4 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">Shows each player&apos;s default line from their market</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </SelectItem>
            {generateLineOptions().map((line) => (
              <SelectItem key={line} value={line}>{line}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Market Select */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Market</Label>
        <Select value={market} onValueChange={onMarketChange}>
          <SelectTrigger className="w-full h-11 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <SelectValue placeholder="Select market" />
          </SelectTrigger>
          <SelectContent>
            {markets.map((marketValue) => (
              <SelectItem key={marketValue} value={marketValue}>
                {formatMarketLabel(marketValue)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Games Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Games</Label>
        {renderGamesFilter()}
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

      {/* Sort Controls */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sort By</Label>
        <div className="flex gap-3">
          <Select value={sortField} onValueChange={(value) => onSortChange(value as typeof sortField, sortDirection)}>
            <SelectTrigger className="flex-1 h-11 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Player</SelectItem>
              <SelectItem value="line">Line</SelectItem>
              <SelectItem value="odds">Best Odds</SelectItem>
              <SelectItem value="ev">Expected Value</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all hover:scale-105"
            onClick={() => onSortChange(sortField, sortDirection === "asc" ? "desc" : "asc")}
          >
            <ArrowUpDown className={cn("h-4 w-4 transition-transform", sortDirection === "desc" && "rotate-180")} />
          </Button>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

      {/* Advanced Settings Section */}
      <div className="space-y-6">
        <h3 className="font-semibold text-base text-slate-800 dark:text-slate-200">Advanced Settings</h3>

        {/* EV Method */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            EV Calculation
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">Choose how to calculate Expected Value</p>
                  <ul className="text-xs text-muted-foreground mt-1 list-disc pl-4 space-y-1">
                    <li>Market Average: Uses average odds across books</li>
                    <li>No Vig: Removes vigorish from market prices</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Select value={evMethod} onValueChange={(value: "market-average" | "no-vig") => onEvMethodChange?.(value)}>
            <SelectTrigger className="w-full h-11 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <SelectValue placeholder="Choose EV method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="market-average">Market Average</SelectItem>
              <SelectItem value="no-vig">No Vig</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Best Odds Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            Best Odds Filter
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Zap className="h-4 w-4 text-yellow-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Filter props where a sportsbook offers the best odds</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <div className="flex gap-3">
            <Select
              value={bestOddsFilter?.sportsbook || ""}
              onValueChange={(value) => {
                if (!value) {
                  onBestOddsFilterChange(null)
                } else {
                  onBestOddsFilterChange({
                    sportsbook: value,
                    type: bestOddsFilter?.type || "over",
                    minOdds: 0,
                  })
                }
              }}
            >
              <SelectTrigger className="flex-1 h-11 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <SelectValue placeholder="Select sportsbook" />
              </SelectTrigger>
              <SelectContent>
                {activeSportsbooks.map((book) => (
                  <SelectItem key={book.id} value={book.id}>
                    <div className="flex items-center gap-2">
                      {renderSportsbookLogo(book.id)}
                      <span>{book.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {bestOddsFilter && (
              <Select
                value={bestOddsFilter.type}
                onValueChange={(value: "over" | "under") => {
                  onBestOddsFilterChange({
                    ...bestOddsFilter,
                    type: value,
                  })
                }}
              >
                <SelectTrigger className="w-24 h-11 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="over">Over</SelectItem>
                  <SelectItem value="under">Under</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* View Mode */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            View Mode
          </Label>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className={cn(
                "flex-1 h-11 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all",
                viewMode === "table" && "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/20"
              )}
              onClick={() => onViewModeChange("table")}
            >
              <List className="h-4 w-4 mr-2" />
              Table
            </Button>
            <Button
              variant="outline"
              size="lg"
              className={cn(
                "flex-1 h-11 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all",
                viewMode === "grid" && "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/20"
              )}
              onClick={() => onViewModeChange("grid")}
            >
              <Grid3X3 className="h-4 w-4 mr-2" />
              Cards
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

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
            {renderGlobalLineFilter()}
            <Select value={market} onValueChange={onMarketChange}>
              <SelectTrigger className="h-10 w-[140px] border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <SelectValue placeholder="Select market" />
              </SelectTrigger>
              <SelectContent>
                {markets.map((marketValue) => (
                  <SelectItem key={marketValue} value={marketValue}>
                    {formatMarketLabel(marketValue)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {renderGamesFilter()}

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
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all",
                    viewMode === "table" && "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/20"
                  )}
                  onClick={() => onViewModeChange("table")}
                >
                  <List className="h-4 w-4 mr-2" />
                  Table
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all",
                    viewMode === "grid" && "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/20"
                  )}
                  onClick={() => onViewModeChange("grid")}
                >
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Cards
                </Button>
              </div>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

              <div className="flex items-center gap-2">
                <Select value={sortField} onValueChange={(value) => onSortChange(value as typeof sortField, sortDirection)}>
                  <SelectTrigger className="h-8 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Player</SelectItem>
                    <SelectItem value="line">Line</SelectItem>
                    <SelectItem value="odds">Best Odds</SelectItem>
                    <SelectItem value="ev">Expected Value</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all hover:scale-105"
                  onClick={() => onSortChange(sortField, sortDirection === "asc" ? "desc" : "asc")}
                >
                  <ArrowUpDown className={cn("h-4 w-4 transition-transform", sortDirection === "desc" && "rotate-180")} />
                </Button>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Advanced
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[300px]">
                <div className="p-4 space-y-4">
                  {/* EV Method */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      EV Calculation
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <BarChart3 className="h-4 w-4 text-blue-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">Choose how to calculate Expected Value</p>
                            <ul className="text-xs text-muted-foreground mt-1 list-disc pl-4 space-y-1">
                              <li>Market Average: Uses average odds across books</li>
                              <li>No Vig: Removes vigorish from market prices</li>
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Select value={evMethod} onValueChange={(value: "market-average" | "no-vig") => onEvMethodChange?.(value)}>
                      <SelectTrigger className="w-full h-9 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
                        <SelectValue placeholder="Choose EV method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="market-average">Market Average</SelectItem>
                        <SelectItem value="no-vig">No Vig</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Best Odds Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      Best Odds Filter
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Zap className="h-4 w-4 text-yellow-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Filter props where a sportsbook offers the best odds</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <div className="flex gap-2">
                      <Select
                        value={bestOddsFilter?.sportsbook || ""}
                        onValueChange={(value) => {
                          if (!value) {
                            onBestOddsFilterChange(null)
                          } else {
                            onBestOddsFilterChange({
                              sportsbook: value,
                              type: bestOddsFilter?.type || "over",
                              minOdds: 0,
                            })
                          }
                        }}
                      >
                        <SelectTrigger className="flex-1 h-9 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
                          <SelectValue placeholder="Select sportsbook" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeSportsbooks.map((book) => (
                            <SelectItem key={book.id} value={book.id}>
                              <div className="flex items-center gap-2">
                                {renderSportsbookLogo(book.id)}
                                <span>{book.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {bestOddsFilter && (
                        <Select
                          value={bestOddsFilter.type}
                          onValueChange={(value: "over" | "under") => {
                            onBestOddsFilterChange({
                              ...bestOddsFilter,
                              type: value,
                            })
                          }}
                        >
                          <SelectTrigger className="w-24 h-9 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="over">Over</SelectItem>
                            <SelectItem value="under">Under</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Active Filters */}
          {(selectedGames || searchQuery || selectedSportsbook || selectedLine || bestOddsFilter) && (
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
              {selectedSportsbook && (
                <Badge
                  variant="secondary"
                  className="h-7 gap-2 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                >
                  <div className="flex items-center gap-2">
                    {renderSportsbookLogo(selectedSportsbook)}
                    <span className="font-medium">{sportsbooks.find((b) => b.id === selectedSportsbook)?.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full"
                    onClick={() => onSportsbookChange(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {selectedLine && (
                <Badge
                  variant="secondary"
                  className="h-7 gap-2 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 border-orange-200 dark:border-orange-800"
                >
                  <span className="font-medium">Line: {selectedLine}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full"
                    onClick={() => onLineChange(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {bestOddsFilter && (
                <Badge
                  variant="secondary"
                  className="h-7 gap-2 bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
                >
                  <div className="flex items-center gap-2">
                    {renderSportsbookLogo(bestOddsFilter.sportsbook)}
                    <span className="font-medium">Best {bestOddsFilter.type === "over" ? "Over" : "Under"}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded-full"
                    onClick={() => onBestOddsFilterChange(null)}
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
 