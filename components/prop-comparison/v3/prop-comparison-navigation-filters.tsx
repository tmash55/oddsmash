"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Search,
  RefreshCw,
  X,
  Zap,
  ArrowUpDown,
  Info,
  Lock,
  Target,
  User,
  LineChart,
  Dices,
  Medal,
  List,
} from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { SUPPORTED_MARKETS, getDefaultMarket, formatMarketLabel } from "@/lib/constants/markets"
import type { BestOddsFilter } from "@/types/prop-comparison"
import { getAllActiveSportsbooks, getSportsbookById } from "@/data/sportsbooks"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

const ALL_SPORTSBOOKS = "all_sportsbooks"
const ALL_LINES = "all_lines"

interface Game {
  odds_event_id: string
  home_team: string
  away_team: string
  commence_time: string
}

interface Sport {
  id: string
  name: string
  icon: React.ReactNode
  color: string
  gradient: string
}

interface OddsCategory {
  id: string
  name: string
  icon: React.ReactNode
  color: string
  gradient: string
}

const sports: Sport[] = [
  {
    id: "mlb",
    name: "MLB",
    icon: <Image src="/images/sport-league/mlb-logo.svg" alt="MLB" width={16} height={16} className="object-contain" />,
    color: "bg-blue-500",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    id: "wnba",
    name: "WNBA",
    icon: (
      <Image src="/images/sport-league/wnba-logo.svg" alt="WNBA" width={16} height={16} className="object-contain" />
    ),
    color: "bg-pink-700",
    gradient: "from-pink-700 to-pink-800",
  },
  {
    id: "nfl",
    name: "NFL",
    icon: <Image src="/images/sport-league/nfl-logo.svg" alt="NFL" width={16} height={16} className="object-contain" />,
    color: "bg-green-500",
    gradient: "from-green-500 to-green-600",
  },
  {
    id: "ncaaf",
    name: "NCAAF",
    icon: <Medal className="h-4 w-4" />,
    color: "bg-red-500",
    gradient: "from-red-500 to-red-600",
  },
  {
    id: "nba",
    name: "NBA",
    icon: <Image src="/images/sport-league/nba-logo.png" alt="NBA" width={14} height={16} className="object-contain" />,
    color: "bg-orange-500",
    gradient: "from-orange-500 to-orange-600",
  },
  {
    id: "nhl",
    name: "NHL",
    icon: <Image src="/images/sport-league/nhl-logo.svg" alt="NHL" width={16} height={16} className="object-contain" />,
    color: "bg-purple-500",
    gradient: "from-purple-500 to-purple-600",
  },
]

const oddsCategories: OddsCategory[] = [
  {
    id: "player-props",
    name: "Player Props",
    icon: <User className="h-4 w-4" />,
    color: "bg-purple-500",
    gradient: "from-purple-500 to-purple-600",
  },
  {
    id: "game-lines",
    name: "Game Lines",
    icon: <LineChart className="h-4 w-4" />,
    color: "bg-blue-500",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    id: "futures",
    name: "Futures",
    icon: <Dices className="h-4 w-4" />,
    color: "bg-amber-500",
    gradient: "from-amber-500 to-amber-600",
  },
]

interface PropComparisonNavigationFiltersProps {
  // Navigation props
  currentSport: string
  currentCategory?: string
  totalProps?: number

  // Filter props
  market: string
  onMarketChange: (market: string) => void
  onMarketHover?: (market: string) => void // Optional prefetching on hover
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedSportsbook: string | null
  onSportsbookChange: (sportsbook: string | null) => void
  selectedLine: string | null
  onLineChange: (line: string | null) => void
  globalLine: string | null
  onGlobalLineChange: (line: string | null) => void
  availableLines: string[]
  lineRange: { min: number; max: number } | null
  sortField: "odds" | "edge" | "name" | "ev"
  sortDirection: "asc" | "desc"
  onSortChange: (field: "odds" | "edge" | "name" | "ev", direction: "asc" | "desc") => void
  availableGames: Game[]
  selectedGames: string[] | null
  onGameFilterChange: (gameIds: string[] | null) => void
  bestOddsFilter: BestOddsFilter | null
  onBestOddsFilterChange: (filter: BestOddsFilter | null) => void
  isLoading: boolean
  refetch: () => void
  viewMode: "table" | "grid"
  onViewModeChange: (mode: "table" | "grid") => void
  lastUpdated?: string
  // Pre-Match / Live (locked) toggle
  mode?: "pregame" | "live"
  onModeChange?: (mode: "pregame" | "live") => void
  preGameCount?: number
  liveCount?: number
}

// Add formatLastUpdated helper function
const formatLastUpdated = (timestamp: string): string => {
  try {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 30) {
      return "Just now"
    }

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    }

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return `${diffInHours}h ago`
    }

    // For older timestamps, show the full date and time
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  } catch (e) {
    return "Unknown"
  }
}

export function PropComparisonNavigationFilters({
  // Navigation props
  currentSport,
  currentCategory,
  totalProps,

  // Filter props
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
  availableGames,
  selectedGames,
  onGameFilterChange,
  bestOddsFilter,
  onBestOddsFilterChange,
  isLoading,
  refetch,
  lastUpdated,
  mode = "pregame",
  onModeChange,
  preGameCount = 0,
  liveCount = 0,
}: PropComparisonNavigationFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
  const isMobile = useMediaQuery("(max-width: 768px)")
  // viewMode is now passed as props

  const markets = SUPPORTED_MARKETS[currentSport] || []
  const activeSportsbooks = getAllActiveSportsbooks()
  const activeCategory = pathname.split("/").filter(Boolean)[2] || "player-props"

  // Set default market if none selected
  useEffect(() => {
    if (!market && currentSport) {
      onMarketChange(getDefaultMarket(currentSport))
    }
  }, [currentSport, market, onMarketChange])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(debouncedSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [debouncedSearch, onSearchChange])

  // Navigation handlers
  const handleSportChange = (sportId: string) => {
    const category = activeCategory || "player-props"

    if (category === "player-props") {
      const defaultMarket = SUPPORTED_MARKETS[sportId]?.[0]
      if (defaultMarket) {
        router.push(`/${sportId}/odds/${category}?market=${encodeURIComponent(defaultMarket)}`)
      } else {
        router.push(`/${sportId}/odds/${category}`)
      }
    } else if (category === "game-lines") {
      router.push(`/${sportId}/odds/${category}?market=h2h`)
    } else {
      router.push(`/${sportId}/odds/${category}`)
    }
  }

  const handleCategoryChange = (categoryId: string) => {
    if (categoryId === "player-props") {
      const defaultMarket = SUPPORTED_MARKETS[currentSport]?.[0]
      if (defaultMarket) {
        router.push(`/${currentSport}/odds/${categoryId}?market=${encodeURIComponent(defaultMarket)}`)
      } else {
        router.push(`/${currentSport}/odds/${categoryId}`)
      }
    } else if (categoryId === "game-lines") {
      router.push(`/${currentSport}/odds/${categoryId}?market=h2h`)
    } else {
      router.push(`/${currentSport}/odds/${categoryId}`)
    }
  }

  // Calculate active filter count for mobile badge
  const activeFilterCount = [selectedGames, searchQuery, selectedSportsbook, selectedLine, bestOddsFilter].filter(
    Boolean,
  ).length

  // Generate line options based on range
  const generateLineOptions = () => {
    if (!lineRange) return availableLines

    const options: string[] = []
    let current = lineRange.min

    // Handle decimal increments for certain markets
    const increment = market.toLowerCase().includes("batting_average") ? 0.01 : 0.5
    const precision = market.toLowerCase().includes("batting_average") ? 3 : 1

    while (current <= lineRange.max) {
      options.push(current.toFixed(precision))
      current += increment
    }

    return options
  }

  // Render sportsbook logo
  const renderSportsbookLogo = (bookId: string, size: "sm" | "md" = "sm") => {
    const book = getSportsbookById(bookId)
    if (!book?.image?.light) return bookId
    return (
      <Image
        src={book.image.light || "/placeholder.svg"}
        alt={book.name}
        width={size === "sm" ? 20 : 24}
        height={size === "sm" ? 20 : 24}
        className="object-contain"
      />
    )
  }

  // Add a custom multi-select games filter component
  const renderGamesFilter = () => {
    const selectedGame = selectedGames?.[0] || null

    const handleGameSelect = (gameId: string | null) => {
      onGameFilterChange(gameId ? [gameId] : null)
      // Update URL with event_id directly (revert slug approach)
      try {
        const params = new URLSearchParams(Array.from(searchParams.entries()))
        if (gameId) params.set("games", gameId)
        else params.delete("games")
        router.replace(`${pathname}?${params.toString()}`)
      } catch (e) {
        // Ignore URL update errors (e.g., when navigation objects are unavailable)
      }
    }

    return (
      <Select value={selectedGame || "all"} onValueChange={(value) => handleGameSelect(value === "all" ? null : value)}>
        <SelectTrigger className="h-9 w-[200px] border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <SelectValue>
            {selectedGame
              ? (() => {
                  const game = availableGames.find((g) => g.odds_event_id === selectedGame)
                  if (!game) return "All Games"
                  const date = new Date(game.commence_time)
                  const dateStr = date.toLocaleDateString("en-US", {
                    month: "numeric",
                    day: "numeric",
                    year: "2-digit",
                  })
                  const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
                  return (
                    <div className="flex flex-col w-full">
                      <div className="flex items-center w-full">
                        <span className="truncate">
                          {game.away_team} @ {game.home_team}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {dateStr} at {timeStr}
                      </span>
                    </div>
                  )
                })()
              : "All Games"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center justify-between w-full">
              <span>All Games</span>
            </div>
          </SelectItem>
          <SelectSeparator />
          {availableGames
            .filter((game) => {
              try {
                return new Date(game.commence_time).getTime() > Date.now()
              } catch {
                return true
              }
            })
            .map((game) => {
              const date = new Date(game.commence_time)
              const dateStr = date.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "2-digit" })
              const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })

              return (
                <SelectItem key={game.odds_event_id} value={game.odds_event_id}>
                  <div className="flex flex-col w-full">
                    <div className="flex items-center w-full">
                      <span>
                        {game.away_team} @ {game.home_team}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {dateStr} at {timeStr}
                    </span>
                  </div>
                </SelectItem>
              )
            })}
        </SelectContent>
      </Select>
    )
  }

  const currentSportData = sports.find((s) => s.id === currentSport)
  const currentCategoryData = oddsCategories.find((c) => c.id === activeCategory)

  if (isMobile) {
    return (
      <div className="w-full space-y-3">
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                  <Target className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <h1 className="text-base font-bold dark:text-white text-slate-900">
                    {currentSport.toUpperCase()} Odds
                  </h1>
                </div>
              </div>
              {totalProps && (
                <span className="text-xs font-medium dark:text-slate-400 text-slate-600">
                  {totalProps.toLocaleString()}
                </span>
              )}
            </div>

            {/* Compact Sport and Category Dropdowns */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Select value={currentSport} onValueChange={handleSportChange}>
                <SelectTrigger className="h-9 text-xs font-medium">
                  <SelectValue>
                    <div className="flex items-center gap-1.5">
                      <div className="p-0.5 rounded-sm dark:bg-slate-700/50 bg-slate-100">{currentSportData?.icon}</div>
                      <span className="font-semibold">{currentSportData?.name}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {sports.map((sport) => (
                    <SelectItem key={sport.id} value={sport.id}>
                      <div className="flex items-center gap-2">
                        <div className="p-0.5 rounded-sm dark:bg-slate-700/50 bg-slate-100">{sport.icon}</div>
                        <span className="font-medium">{sport.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={activeCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="h-9 text-xs font-medium">
                  <SelectValue>
                    <div className="flex items-center gap-1.5">
                      <div className="p-0.5 rounded-sm dark:bg-slate-700/50 bg-slate-100">
                        {currentCategoryData?.icon}
                      </div>
                      <span className="font-semibold truncate">{currentCategoryData?.name}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {oddsCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div className="p-0.5 rounded-sm dark:bg-slate-700/50 bg-slate-100">{category.icon}</div>
                        <span className="font-medium">{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search and Filter Button */}
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 h-9 w-9 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all hover:scale-105"
                  >
                    <List className="h-3.5 w-3.5" />
                    {activeFilterCount > 0 && (
                      <Badge
                        variant="secondary"
                        className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs"
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
                    {lastUpdated && (
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
                        <span>Updated {formatLastUpdated(lastUpdated)}</span>
                      </div>
                    )}
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Market Select */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Market</Label>
                      <Select value={market} onValueChange={onMarketChange}>
                        <SelectTrigger className="w-full h-11">
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

                    {/* Global Line Filter */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Line</Label>
                      <Select
                        value={globalLine || "standard"}
                        onValueChange={(value) => onGlobalLineChange(value === "standard" ? null : value)}
                      >
                        <SelectTrigger className="w-full h-11">
                          <SelectValue>{globalLine || "Standard Lines"}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">
                            <div className="flex items-center">
                              <span>Standard Lines</span>
                            </div>
                          </SelectItem>
                          {generateLineOptions().map((line) => (
                            <SelectItem key={line} value={line}>
                              {line}
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

                    {/* Sort Controls */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sort By</Label>
                      <div className="flex gap-3">
                        <Select
                          value={sortField}
                          onValueChange={(value) => onSortChange(value as typeof sortField, sortDirection)}
                        >
                          <SelectTrigger className="flex-1 h-11">
                            <SelectValue placeholder="Sort by..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="name">Player</SelectItem>
                            <SelectItem value="odds">Best Odds</SelectItem>
                            <SelectItem value="ev">Value</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-11 w-11 shrink-0 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all hover:scale-105"
                          onClick={() => onSortChange(sortField, sortDirection === "asc" ? "desc" : "asc")}
                        >
                          <ArrowUpDown
                            className={cn("h-4 w-4 transition-transform", sortDirection === "desc" && "rotate-180")}
                          />
                        </Button>
                      </div>
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
                              })
                            }
                          }}
                        >
                          <SelectTrigger className="flex-1 h-11">
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
                            <SelectTrigger className="w-24 h-11">
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
                </SheetContent>
              </Sheet>

              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search players..."
                  value={debouncedSearch}
                  onChange={(e) => setDebouncedSearch(e.target.value)}
                  className="pl-8 h-9 text-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Desktop version - Compact design
  return (
    <div className="w-full space-y-3">
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="px-4 py-3 border-b border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                <Target className="h-3.5 w-3.5 text-white" />
              </div>
              <h1 className="text-lg font-bold dark:text-white text-slate-900">{currentSport.toUpperCase()} Odds</h1>
            </div>
            <div className="flex items-center gap-4">
              {totalProps && (
                <div className="text-sm dark:text-slate-400 text-slate-600">
                  {totalProps.toLocaleString()} props • {sports.length} leagues • {oddsCategories.length} types
                </div>
              )}
              {lastUpdated && (
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
                  <span>Updated {formatLastUpdated(lastUpdated)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Sport Dropdown */}
            <Select value={currentSport} onValueChange={handleSportChange}>
              <SelectTrigger className="h-9 w-[120px] border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <div className="p-0.5 rounded-sm dark:bg-slate-700/50 bg-slate-100">{currentSportData?.icon}</div>
                    <span className="font-semibold">{currentSportData?.name}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {sports.map((sport) => (
                  <SelectItem key={sport.id} value={sport.id}>
                    <div className="flex items-center gap-2">
                      <div className="p-0.5 rounded-sm dark:bg-slate-700/50 bg-slate-100">{sport.icon}</div>
                      <span className="font-medium">{sport.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category Dropdown */}
            <Select value={activeCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="h-9 w-[140px] border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <div className="p-0.5 rounded-sm dark:bg-slate-700/50 bg-slate-100">
                      {currentCategoryData?.icon}
                    </div>
                    <span className="font-semibold">{currentCategoryData?.name}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {oddsCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div className="p-0.5 rounded-sm dark:bg-slate-700/50 bg-slate-100">{category.icon}</div>
                      <span className="font-medium">{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Pre-Match / Live Toggle */}
            <div className="flex items-center rounded-lg border px-1 py-1 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
              <button
                type="button"
                className={`px-2.5 py-1 rounded-md text-xs font-medium ${mode !== "live" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow" : "text-slate-600 dark:text-slate-300"}`}
                onClick={() => onModeChange?.("pregame")}
              >
                Pre-Game <span className="ml-1 tabular-nums">{preGameCount}</span>
              </button>
              <button
                type="button"
                disabled
                className="px-2.5 py-1 rounded-md text-xs font-medium text-slate-400 dark:text-slate-500 inline-flex items-center gap-1"
                title="Live props coming soon"
              >
                Live <Lock className="w-3 h-3" />
              </button>
            </div>

            {/* Market Select */}
            <Select value={market} onValueChange={onMarketChange}>
              <SelectTrigger className="h-9 w-[130px] border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
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

            {/* Global Line Filter */}
            <Select
              value={globalLine || "standard"}
              onValueChange={(value) => onGlobalLineChange(value === "standard" ? null : value)}
            >
              <SelectTrigger className="h-9 w-[120px] border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <SelectValue>{globalLine || "Standard Lines"}</SelectValue>
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
                  <SelectItem key={line} value={line}>
                    {line}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {renderGamesFilter()}

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search players..."
                value={debouncedSearch}
                onChange={(e) => setDebouncedSearch(e.target.value)}
                className="pl-8 h-9 w-[180px] text-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Select
                value={sortField}
                onValueChange={(value) => onSortChange(value as typeof sortField, sortDirection)}
              >
                <SelectTrigger className="h-9 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Player</SelectItem>
                    <SelectItem value="odds">Best Odds</SelectItem>
                    <SelectItem value="ev">Value</SelectItem>
                  </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all hover:scale-105"
                onClick={() => onSortChange(sortField, sortDirection === "asc" ? "desc" : "asc")}
              >
                <ArrowUpDown
                  className={cn("h-3.5 w-3.5 transition-transform", sortDirection === "desc" && "rotate-180")}
                />
              </Button>
            </div>

            {/* Best Odds Filter */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-yellow-500" />
                <span className="text-sm font-medium">Best Odds:</span>
              </div>
              <Select
                value={bestOddsFilter?.sportsbook || ""}
                onValueChange={(value) => {
                  if (!value) {
                    onBestOddsFilterChange(null)
                  } else {
                    onBestOddsFilterChange({
                      sportsbook: value,
                      type: bestOddsFilter?.type || "over",
                    })
                  }
                }}
              >
                <SelectTrigger className="h-9 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
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
                  <SelectTrigger className="w-20 h-9 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
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

        {/* Active Filters */}
        {(selectedGames || searchQuery || selectedSportsbook || selectedLine || bestOddsFilter) && (
          <div className="border-t border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3 flex flex-wrap items-center gap-2">
            {selectedGames && (
              <Badge
                variant="secondary"
                className="h-6 gap-2 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800"
              >
                <span className="font-medium text-xs">
                  {selectedGames.length} game{selectedGames.length > 1 ? "s" : ""}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-3.5 w-3.5 p-0 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full"
                  onClick={() => onGameFilterChange(null)}
                >
                  <X className="h-2.5 w-2.5" />
                </Button>
              </Badge>
            )}
            {searchQuery && (
              <Badge
                variant="secondary"
                className="h-6 gap-2 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800"
              >
                <span className="truncate max-w-[100px] font-medium text-xs">{searchQuery}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-3.5 w-3.5 p-0 hover:bg-green-200 dark:hover:bg-green-800 rounded-full"
                  onClick={() => {
                    setDebouncedSearch("")
                    onSearchChange("")
                  }}
                >
                  <X className="h-2.5 w-2.5" />
                </Button>
              </Badge>
            )}
            {selectedSportsbook && (
              <Badge
                variant="secondary"
                className="h-6 gap-2 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-800"
              >
                <div className="flex items-center gap-2">
                  {renderSportsbookLogo(selectedSportsbook)}
                  <span className="font-medium text-xs">{getSportsbookById(selectedSportsbook)?.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-3.5 w-3.5 p-0 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full"
                  onClick={() => onSportsbookChange(null)}
                >
                  <X className="h-2.5 w-2.5" />
                </Button>
              </Badge>
            )}
            {selectedLine && (
              <Badge
                variant="secondary"
                className="h-6 gap-2 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 border-orange-200 dark:border-orange-800"
              >
                <span className="font-medium text-xs">Line: {selectedLine}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-3.5 w-3.5 p-0 hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full"
                  onClick={() => onLineChange(null)}
                >
                  <X className="h-2.5 w-2.5" />
                </Button>
              </Badge>
            )}
            {bestOddsFilter && (
              <Badge
                variant="secondary"
                className="h-6 gap-2 bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
              >
                <div className="flex items-center gap-2">
                  {renderSportsbookLogo(bestOddsFilter.sportsbook)}
                  <span className="font-medium text-xs">Best {bestOddsFilter.type === "over" ? "Over" : "Under"}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-3.5 w-3.5 p-0 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded-full"
                  onClick={() => onBestOddsFilterChange(null)}
                >
                  <X className="h-2.5 w-2.5" />
                </Button>
              </Badge>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
