"use client"

import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, X, ChevronDown, Check, ArrowDown, ArrowUp, Grid, List, SlidersHorizontal } from "lucide-react"
import type { Market } from "@/types/hit-rates"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter,
} from "@/components/ui/sheet"
import Image from "next/image"

// Add interface for game filter
interface GameInfo {
  odds_event_id: string
  home_team: string
  away_team: string
  commence_time: string
  display_name?: string // formatted name for display
}

// Map team abbreviations to handle special cases and variations
const teamAbbreviationMap: Record<string, string> = {
  // Arizona Diamondbacks variations
  ARI: "AZ", // Standard abbreviation maps to file name
  ARIZONA: "AZ",
  DIAMONDBACKS: "AZ",

  // Keep other mappings as needed
  // 'SFG': 'SF'  // Example: If a file is named SF.svg but the abbreviation in data is SFG
}

// Function to get the correct file name for a team abbreviation
function getTeamLogoFilename(abbr: string): string {
  if (!abbr) return "default"

  const upperAbbr = abbr.toUpperCase()
  return teamAbbreviationMap[upperAbbr] || abbr
}

// Get the 3-letter code from a team name
function getTeamCode(teamName: string): string {
  // Common team name mappings
  const teamAbbreviations: Record<string, string> = {
    "New York Yankees": "NYY",
    "New York Mets": "NYM",
    "Boston Red Sox": "BOS",
    "Los Angeles Dodgers": "LAD",
    "Los Angeles Angels": "LAA",
    "Chicago Cubs": "CHC",
    "Chicago White Sox": "CHW",
    "Milwaukee Brewers": "MIL",
    "Atlanta Braves": "ATL",
    "Houston Astros": "HOU",
    "Philadelphia Phillies": "PHI",
    "San Francisco Giants": "SF",
    "San Diego Padres": "SD",
    "Toronto Blue Jays": "TOR",
    "Texas Rangers": "TEX",
    "Cleveland Guardians": "CLE",
    "Detroit Tigers": "DET",
    "Minnesota Twins": "MIN",
    "Kansas City Royals": "KC",
    "Colorado Rockies": "COL",
    "Arizona Diamondbacks": "ARI",
    "Seattle Mariners": "SEA",
    "Tampa Bay Rays": "TB",
    "Miami Marlins": "MIA",
    "Baltimore Orioles": "BAL",
    "Washington Nationals": "WSH",
    "Pittsburgh Pirates": "PIT",
    "Cincinnati Reds": "CIN",
    "Oakland Athletics": "OAK",
    "St. Louis Cardinals": "STL",
  }

  // Check if we have a direct mapping
  if (teamAbbreviations[teamName]) {
    return teamAbbreviations[teamName]
  }

  // If no direct mapping, generate an abbreviation from the team name
  // by taking the first letter of each word
  return teamName
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
}

interface HitRateFiltersV2Props {
  onMarketChange: (market: string) => void
  onViewModeChange: (mode: "table" | "grid") => void
  onSearchChange: (query: string) => void
  onSortChange?: (field: string, direction: "asc" | "desc") => void
  onGameFilterChange?: (gameIds: string[] | null) => void // Add game filter callback
  currentMarket: Market
  currentViewMode: "table" | "grid"
  searchQuery: string
  availableMarkets: { value: Market; label: string }[]
  availableGames?: GameInfo[] // Add available games prop
  selectedGames?: string[] | null // Add selected games prop
  onRefreshData: () => void
  isLoading: boolean
  currentSortField?: string
  currentSortDirection?: "asc" | "desc"
  customTier: number | null // Add custom tier prop
  setCustomTier: (value: number | null) => void // Add setter for custom tier
  getCustomTierOptions: (market: string) => number[] // Add function to get tier options for current market
}

export default function HitRateFiltersV2({
  onMarketChange,
  onViewModeChange,
  onSearchChange,
  onSortChange,
  onGameFilterChange,
  currentMarket,
  currentViewMode,
  searchQuery,
  availableMarkets,
  availableGames = [],
  selectedGames = null,
  onRefreshData,
  isLoading,
  currentSortField,
  currentSortDirection,
  customTier,
  setCustomTier,
  getCustomTierOptions,
}: HitRateFiltersV2Props) {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

  // Handle search input focus
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchExpanded])

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value)
  }

  // Clear search query
  const clearSearch = () => {
    onSearchChange("")
    setIsSearchExpanded(false)
  }

  // Horizontal scroll with mousewheel for market pills
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (scrollContainerRef.current) {
        e.preventDefault()
        scrollContainerRef.current.scrollLeft += e.deltaY
      }
    }

    const currentRef = scrollContainerRef.current
    if (currentRef) {
      currentRef.addEventListener("wheel", handleWheel, { passive: false })
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener("wheel", handleWheel)
      }
    }
  }, [])

  // Sort fields available
  const sortFields = [
    { value: "L5", label: "Last 5 Games Hit Rate" },
    { value: "L10", label: "Last 10 Games Hit Rate" },
    { value: "L20", label: "Last 20 Games Hit Rate" },
    { value: "name", label: "Player Name" },
    { value: "line", label: "Line Value" },
    { value: "average", label: "Average Per Game" },
  ]

  // Get display name for current sort field
  const getCurrentSortLabel = () => {
    const field = sortFields.find((f) => f.value === currentSortField)
    return field ? field.label : "Last 10 Games Hit Rate"
  }

  // Format game display name - updated to use logos and short codes
  const formatGameDisplay = (game: GameInfo) => {
    // Get team codes
    const awayTeamCode = getTeamCode(game.away_team)
    const homeTeamCode = getTeamCode(game.home_team)

    // Format time
    const gameDate = new Date(game.commence_time)
    const formattedTime = gameDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })

    return (
      <div className="flex items-center gap-1 w-full">
        {/* Away Team */}
        <div className="flex items-center gap-0.5">
          <div className="w-5 h-5 relative flex-shrink-0">
            <Image
              src={`/images/mlb-teams/${getTeamLogoFilename(awayTeamCode)}.svg`}
              alt={awayTeamCode}
              width={20}
              height={20}
              className="object-contain w-full h-full p-0.5"
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                const target = e.target as HTMLImageElement;
                // Try PNG if SVG fails
                target.src = `/images/mlb-teams/${getTeamLogoFilename(awayTeamCode)}.png`;
                // Fallback to placeholder if PNG also fails
                target.onerror = () => {
                  target.src = "/placeholder.svg?height=20&width=20";
                  target.onerror = null; // Prevent infinite loop
                }
              }}
            />
          </div>
          <span className="text-xs font-medium">{awayTeamCode}</span>
        </div>

        <span className="mx-1">@</span>

        {/* Home Team */}
        <div className="flex items-center gap-0.5">
          <span className="text-xs font-medium">{homeTeamCode}</span>
          <div className="w-5 h-5 relative flex-shrink-0">
            <Image
              src={`/images/mlb-teams/${getTeamLogoFilename(homeTeamCode)}.svg`}
              alt={homeTeamCode}
              width={20}
              height={20}
              className="object-contain w-full h-full p-0.5"
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                const target = e.target as HTMLImageElement;
                // Try PNG if SVG fails
                target.src = `/images/mlb-teams/${getTeamLogoFilename(homeTeamCode)}.png`;
                // Fallback to placeholder if PNG also fails
                target.onerror = () => {
                  target.src = "/placeholder.svg?height=20&width=20";
                  target.onerror = null; // Prevent infinite loop
                }
              }}
            />
          </div>
        </div>

        {/* Time */}
        <span className="text-xs text-muted-foreground ml-auto">{formattedTime}</span>
      </div>
    )
  }

  // Get display text for game filter button
  const getGameFilterText = (): React.ReactNode => {
    if (!selectedGames || selectedGames.length === 0) {
      return "All Games"
    }

    if (selectedGames.length === 1) {
      const game = availableGames.find((g) => g.odds_event_id === selectedGames[0])
      if (game) {
        const awayTeamCode = getTeamCode(game.away_team)
        const homeTeamCode = getTeamCode(game.home_team)
        return (
          <span className="flex items-center gap-1">
            <span>{awayTeamCode}</span>
            <span>@</span>
            <span>{homeTeamCode}</span>
          </span>
        )
      }
      return "1 Game"
    }

    return `${selectedGames.length} Games`
  }

  // Toggle game selection in the filter
  const toggleGameSelection = (gameId: string) => {
    if (!onGameFilterChange) return

    if (!selectedGames) {
      // If null (all games), start with just this one game
      onGameFilterChange([gameId])
    } else {
      if (selectedGames.includes(gameId)) {
        // Remove game if already selected
        const newSelection = selectedGames.filter((id) => id !== gameId)
        onGameFilterChange(newSelection.length > 0 ? newSelection : null)
      } else {
        // Add game if not already selected
        onGameFilterChange([...selectedGames, gameId])
      }
    }
  }

  // Select all games
  const selectAllGames = () => {
    if (onGameFilterChange) {
      onGameFilterChange(null)
    }
  }

  // Apply sort from mobile filters
  const applySort = (field: string, direction: "asc" | "desc") => {
    if (onSortChange) {
      onSortChange(field, direction)
    }
    setIsMobileFiltersOpen(false)
  }

  // Get a label for the current custom tier selection
  const getCustomTierLabel = (): string => {
    if (customTier === null) {
      return "Default Line"
    }
    return `${customTier}+ Line`
  }

  return (
    <div className="space-y-4">
      {/* Top Row - Improved Hierarchy */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Left Section: Search and Market (Desktop) */}
        <div className="flex items-center gap-2 flex-grow order-1">
          {/* Search - Responsive */}
          <div className="relative flex-grow max-w-full sm:max-w-xs">
            {isSearchExpanded || searchQuery ? (
              <div className="relative w-full">
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search players or teams..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-9 pr-9 w-full h-9"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                    onClick={clearSearch}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ) : (
              <Button
                variant="outline"
                className="gap-2 w-full sm:w-[180px] h-9"
                onClick={() => setIsSearchExpanded(true)}
              >
                <Search className="h-4 w-4" />
                <span className="truncate">Search players</span>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Filters Button - Only visible on small screens */}
        <div className="order-3 sm:order-2 flex-shrink-0 md:hidden">
          <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only">Filters</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] sm:h-[60vh] pt-6">
              <SheetHeader className="mb-4">
                <SheetTitle>Filters & Sort</SheetTitle>
              </SheetHeader>

              <div className="space-y-6 overflow-y-auto h-[calc(100%-8rem)]">
                {/* Market Selection in Mobile Sheet - Dropdown */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Market</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        <span>{availableMarkets.find((m) => m.value === currentMarket)?.label || "Hits"}</span>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[200px]" align="start">
                      {availableMarkets.map((market) => (
                        <DropdownMenuItem
                          key={market.value}
                          className={cn(currentMarket === market.value && "font-medium")}
                          onClick={() => onMarketChange(market.value)}
                        >
                          {market.label}
                          {currentMarket === market.value && <Check className="h-4 w-4 ml-2" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Custom Tier Selection in Mobile Sheet */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Custom Line</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      key="default"
                      variant={customTier === null ? "default" : "outline"}
                      className={cn(
                        "px-3 py-1 text-sm cursor-pointer",
                        customTier === null ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
                      )}
                      onClick={() => setCustomTier(null)}
                    >
                      Default Line
                    </Badge>

                    {getCustomTierOptions(currentMarket).map((tier) => (
                      <Badge
                        key={tier}
                        variant={customTier === tier ? "default" : "outline"}
                        className={cn(
                          "px-3 py-1 text-sm cursor-pointer",
                          customTier === tier ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
                        )}
                        onClick={() => setCustomTier(tier)}
                      >
                        {tier}+ Line
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Game Filter in Mobile Sheet */}
                {availableGames.length > 0 && onGameFilterChange && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Games</h3>
                    <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
                      <div
                        className={cn(
                          "flex items-center px-2 py-1.5 rounded-md cursor-pointer",
                          !selectedGames ? "bg-secondary" : "hover:bg-secondary/50",
                        )}
                        onClick={selectAllGames}
                      >
                        <div className="w-5 h-5 rounded-md border border-input flex items-center justify-center mr-2">
                          {!selectedGames && <Check className="h-3.5 w-3.5" />}
                        </div>
                        <span className="font-medium">All Games</span>
                      </div>

                      {availableGames.map((game) => (
                        <div
                          key={game.odds_event_id}
                          className={cn(
                            "flex items-center px-2 py-1.5 rounded-md cursor-pointer",
                            selectedGames?.includes(game.odds_event_id) ? "bg-secondary" : "hover:bg-secondary/50",
                          )}
                          onClick={() => toggleGameSelection(game.odds_event_id)}
                        >
                          <div className="w-5 h-5 rounded-md border border-input flex items-center justify-center mr-2">
                            {selectedGames?.includes(game.odds_event_id) && <Check className="h-3.5 w-3.5" />}
                          </div>
                          {formatGameDisplay(game)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sort Options in Mobile Sheet */}
                {onSortChange && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Sort By</h3>
                    <div className="space-y-1">
                      {sortFields.map((field) => (
                        <div
                          key={field.value}
                          className={cn(
                            "flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer",
                            currentSortField === field.value ? "bg-secondary" : "hover:bg-secondary/50",
                          )}
                          onClick={() => {
                            if (currentSortField === field.value) {
                              // Toggle direction if same field
                              applySort(field.value, currentSortDirection === "asc" ? "desc" : "asc")
                            } else {
                              // Default to desc for new field
                              applySort(field.value, "desc")
                            }
                          }}
                        >
                          <span>{field.label}</span>
                          {currentSortField === field.value &&
                            (currentSortDirection === "desc" ? (
                              <ArrowDown className="h-4 w-4" />
                            ) : (
                              <ArrowUp className="h-4 w-4" />
                            ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* View Mode in Mobile Sheet */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">View Mode</h3>
                  <div className="flex gap-2">
                    <Button
                      variant={currentViewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => {
                        onViewModeChange("grid")
                        setIsMobileFiltersOpen(false)
                      }}
                    >
                      <Grid className="h-4 w-4" />
                      <span>Grid</span>
                    </Button>
                    <Button
                      variant={currentViewMode === "table" ? "default" : "outline"}
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => {
                        onViewModeChange("table")
                        setIsMobileFiltersOpen(false)
                      }}
                    >
                      <List className="h-4 w-4" />
                      <span>Table</span>
                    </Button>
                  </div>
                </div>
              </div>

              <SheetFooter className="mt-4 flex-row gap-2 sm:justify-end">
                <SheetClose asChild>
                  <Button variant="outline" className="flex-1 sm:flex-none">
                    Cancel
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button className="flex-1 sm:flex-none">Apply Filters</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Controls - Hidden on mobile */}
        <div className="order-2 sm:order-3 flex-shrink-0 flex items-center gap-2 ml-auto">
          {/* Filter Controls Group - Desktop */}
          <div className="hidden md:flex items-center gap-2 border rounded-lg p-1 bg-background">
            {/* Market Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 h-8">
                  <span className="font-medium text-xs text-muted-foreground">Market</span>
                  <span className="font-medium">
                    {availableMarkets.find((m) => m.value === currentMarket)?.label || "Hits"}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[220px]">
                <div className="grid grid-cols-2 gap-1 p-1">
                  {availableMarkets.map((market) => (
                    <DropdownMenuItem
                      key={market.value}
                      className={cn(
                        "flex items-center gap-1 justify-start px-3 py-1.5 cursor-pointer rounded-md",
                        currentMarket === market.value && "bg-secondary font-medium",
                      )}
                      onClick={() => onMarketChange(market.value)}
                    >
                      {currentMarket === market.value && <Check className="h-3.5 w-3.5 mr-1" />}
                      <span className="truncate">{market.label}</span>
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Line Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 h-8">
                  <span className="font-medium text-xs text-muted-foreground">Line</span>
                  <span className="font-medium">{getCustomTierLabel()}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className={cn(customTier === null && "font-medium")}
                  onClick={() => setCustomTier(null)}
                >
                  Default Line
                  {customTier === null && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {getCustomTierOptions(currentMarket).map((tier) => (
                  <DropdownMenuItem
                    key={tier}
                    className={cn(customTier === tier && "font-medium")}
                    onClick={() => setCustomTier(tier)}
                  >
                    {tier}+ Line
                    {customTier === tier && <Check className="h-4 w-4 ml-2" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Game Filter Dropdown */}
            {availableGames.length > 0 && onGameFilterChange && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1 h-8">
                    <span className="font-medium text-xs text-muted-foreground">Game</span>
                    <span className="font-medium">{getGameFilterText()}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[300px]">
                  <div className="p-2">
                    <div
                      className={cn(
                        "flex items-center mb-1 p-1.5 rounded-md cursor-pointer",
                        !selectedGames ? "bg-secondary/80" : "hover:bg-secondary/30",
                      )}
                      onClick={() => selectAllGames()}
                    >
                      <div className="w-5 h-5 rounded-md border border-input flex items-center justify-center mr-2">
                        {!selectedGames && <Check className="h-3.5 w-3.5" />}
                      </div>
                      <span className="font-medium">All Games</span>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto mt-2 space-y-1">
                      {availableGames.map((game) => (
                        <div
                          key={game.odds_event_id}
                          className={cn(
                            "flex items-center p-1.5 rounded-md cursor-pointer",
                            selectedGames?.includes(game.odds_event_id) ? "bg-secondary/80" : "hover:bg-secondary/30",
                          )}
                          onClick={() => toggleGameSelection(game.odds_event_id)}
                        >
                          <div className="w-5 h-5 rounded-md border border-input flex items-center justify-center mr-2">
                            {selectedGames?.includes(game.odds_event_id) && <Check className="h-3.5 w-3.5" />}
                          </div>
                          {formatGameDisplay(game)}
                        </div>
                      ))}
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Sort and View Controls Group - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            {/* Sort dropdown */}
            {onSortChange && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-1 h-9">
                    <span className="hidden lg:inline">Sort:</span>
                    <span className="truncate max-w-[80px] lg:max-w-[150px]">{getCurrentSortLabel()}</span>
                    {currentSortDirection === "desc" ? (
                      <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ArrowUp className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {sortFields.map((field) => (
                    <DropdownMenuItem
                      key={field.value}
                      className={cn("flex items-center gap-1", currentSortField === field.value && "font-medium")}
                      onClick={() => {
                        if (onSortChange) {
                          if (currentSortField === field.value) {
                            // Toggle direction if same field
                            onSortChange(field.value, currentSortDirection === "asc" ? "desc" : "asc")
                          } else {
                            // Default to desc for new field
                            onSortChange(field.value, "desc")
                          }
                        }
                      }}
                    >
                      {field.label}
                      {currentSortField === field.value &&
                        (currentSortDirection === "desc" ? (
                          <ArrowDown className="h-3.5 w-3.5 ml-1" />
                        ) : (
                          <ArrowUp className="h-3.5 w-3.5 ml-1" />
                        ))}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* View Toggle */}
            <div className="border rounded-md flex h-9">
              <Button
                variant={currentViewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="rounded-none border-r h-full"
                onClick={() => onViewModeChange("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={currentViewMode === "table" ? "secondary" : "ghost"}
                size="icon"
                className="rounded-none h-full"
                onClick={() => onViewModeChange("table")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Market Pills - Mobile Only, Horizontally Scrollable */}
      <div className="relative md:hidden mt-3">
        <div
          ref={scrollContainerRef}
          className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent px-1"
        >
          {availableMarkets.map((market) => (
            <Badge
              key={market.value}
              variant={currentMarket === market.value ? "default" : "outline"}
              className={cn(
                "px-3 py-1 text-sm cursor-pointer whitespace-nowrap",
                currentMarket === market.value ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
              )}
              onClick={() => onMarketChange(market.value)}
            >
              {market.label}
            </Badge>
          ))}
        </div>

        {/* More subtle fade indicators for horizontal scroll */}
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent opacity-40 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent opacity-40 pointer-events-none"></div>
      </div>

      {/* Active Filters Display - Optional */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {/* Display custom tier as an active filter */}
        {customTier !== null && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <span className="truncate">
              {currentMarket} Line: {customTier}+
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
              onClick={() => setCustomTier(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}

        {/* Existing selected games badges */}
        {selectedGames && selectedGames.length > 0 && (
          <>
            <span className="text-muted-foreground">Active filters:</span>
            {selectedGames.map((gameId) => {
              const game = availableGames.find((g) => g.odds_event_id === gameId)
              if (!game) return null

              const awayTeamCode = getTeamCode(game.away_team)
              const homeTeamCode = getTeamCode(game.home_team)

              return (
                <Badge key={gameId} variant="secondary" className="flex items-center gap-1">
                  <span className="truncate">
                    {awayTeamCode} @ {homeTeamCode}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                    onClick={() => toggleGameSelection(gameId)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
