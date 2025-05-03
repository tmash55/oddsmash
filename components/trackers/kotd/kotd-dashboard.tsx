"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Trophy, LayoutGrid, TableIcon, Star, Crown, CircleDot, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import ScheduledGames from "./scheduled-games"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"

type ViewMode = "card" | "table"

interface Player {
  personId: string;
  name: string;
  team: string;
  teamId: number;
  opponent: string;
  opponentId: number;
  homeRun: boolean;
  homeRunCount: number;
  atBats: number;
  teamRuns: number;
  opponentRuns: number;
  currentInning: string;
  inningNumber: number;
  inningHalf: string;
  gameId: number;
  gamePk?: number;
  gameStatus: string;
  winningTeam: boolean;
  isPostponed?: boolean;
  position?: string;
}

interface Game {
  gamePk: number;
  homeTeam: string;
  homeTeamId: number;
  homeTeamRuns: number;
  homeTeamHomeRuns: number;
  homeTeamWins: number;
  homeTeamLosses: number;
  homeTeamWinPct: string;
  awayTeam: string;
  awayTeamId: number;
  awayTeamRuns: number;
  awayTeamHomeRuns: number;
  awayTeamWins: number;
  awayTeamLosses: number;
  awayTeamWinPct: string;
  inning: number;
  inningHalf: "top" | "bottom";
  gameStatus: string;
  abstractGameState: string;
  startTime: string;
  venue?: string;
  isPostponed: boolean;
}

type KOTDDashboardProps = {
  players: Player[]
  games: Game[]
  allGamesFinal: boolean
  lastUpdated: string
  dateLabel?: string
}

// Add a new state to track players who recently hit home runs
interface RecentHR {
  personId: string;
  timestamp: number;
}

// Add a styles object that handles the grid for different screen sizes
const styles = {
  cardGrid: cn(
    "grid grid-cols-1 gap-3",
    "sm:grid-cols-2",
    "lg:grid-cols-3",
    "xl:grid-cols-4"
  ),
  buttonRow: cn(
    "flex flex-wrap gap-2",
    "grid grid-cols-2 sm:flex sm:flex-row"
  ),
  filterButton: cn(
    "flex-1 sm:flex-initial",
    "flex items-center justify-center"
  ),
}

export default function KOTDDashboard({ players, games, allGamesFinal, lastUpdated, dateLabel }: KOTDDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768 ? "card" : "table"
    }
    return "card"
  })
  const [showStarredOnly, setShowStarredOnly] = useState(false)
  const [showHomeRunsOnly, setShowHomeRunsOnly] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [activeTab, setActiveTab] = useState<string>("tracker")
  const [starredPlayers, setStarredPlayers] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("starredHRPlayers")
      return stored ? new Set(JSON.parse(stored)) : new Set()
    }
    return new Set()
  })
  
  // Track recent home runs for 5 minutes
  const [recentHomeRuns, setRecentHomeRuns] = useState<RecentHR[]>([])
  
  // On first load or when players update, check for new home runs
  useEffect(() => {
    const playersWithHR = players.filter(p => p.homeRun)
    
    // Check for new home runs that aren't in recentHomeRuns
    const newHRs = playersWithHR.filter(p => 
      !recentHomeRuns.some(rhr => rhr.personId === p.personId)
    ).map(p => ({
      personId: p.personId,
      timestamp: Date.now()
    }))
    
    if (newHRs.length > 0) {
      setRecentHomeRuns(prev => [...prev, ...newHRs])
    }
    
    // Clean up old HRs (older than 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    setRecentHomeRuns(prev => prev.filter(hr => hr.timestamp > fiveMinutesAgo))
  }, [players])

  // Check if a player just hit a home run (within the last 5 minutes)
  const hasRecentHR = (playerId: string) => {
    return recentHomeRuns.some(hr => hr.personId === playerId)
  }

  useEffect(() => {
    localStorage.setItem("starredHRPlayers", JSON.stringify(Array.from(starredPlayers)))
  }, [starredPlayers])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, showStarredOnly, showHomeRunsOnly])

  const filteredPlayers = players.filter((player) => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          player.team.toLowerCase().includes(searchTerm.toLowerCase())
    const isStarred = starredPlayers.has(player.personId)
    const hasHomeRun = player.homeRun
    
    // Filter out pitchers except for Ohtani
    const isPitcher = player.position === 'P'
    const isOhtani = player.name.includes('Ohtani')

    // Apply filters
    if (showStarredOnly && !isStarred) return false
    if (showHomeRunsOnly && !hasHomeRun) return false
    if (isPitcher && !isOhtani) return false
    
    return matchesSearch
  })

  const toggleStarPlayer = (playerId: string) => {
    setStarredPlayers((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(playerId)) {
        newSet.delete(playerId)
      } else {
        newSet.add(playerId)
      }
      return newSet
    })
  }

  // Sort by: Most team runs first, then HR count
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    // First by star status
    if (starredPlayers.has(a.personId) && !starredPlayers.has(b.personId)) return -1
    if (!starredPlayers.has(a.personId) && starredPlayers.has(b.personId)) return 1
    
    // Then by team runs (higher runs first)
    if (a.teamRuns !== b.teamRuns) return b.teamRuns - a.teamRuns;
    
    // Then by HR count
    return b.homeRunCount - a.homeRunCount;
  })

  // Find the highest team run total for the day
  const maxTeamRuns = players.length > 0 
    ? Math.max(...players.map(player => player.teamRuns))
    : 0;

  // Track which teams have the highest runs
  const teamsWithMostRuns = players.length > 0
    ? players
        .filter(p => p.teamRuns === maxTeamRuns)
        .map(p => p.team)
        .filter((team, index, self) => self.indexOf(team) === index)
    : [];

  const isPlayerKOTD = (player: Player) => {
    // KOTD = hit a home run AND on the team with the most runs across all games
    return player.homeRun && player.teamRuns === maxTeamRuns && maxTeamRuns > 0;
  }

  const isTeamLeading = (teamName: string) => {
    return teamsWithMostRuns.some(team => team === teamName) && maxTeamRuns > 0;
  }

  // Format team name with trophy if they have the most runs
  const formatTeamNameWithStatus = (teamName: string, includeIcon = true) => {
    const formattedName = formatTeamName(teamName);
    
    if (isTeamLeading(teamName) && includeIcon) {
      return (
        <div className="flex items-center gap-1">
          <span className="font-semibold text-yellow-700 dark:text-yellow-400">{formattedName}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Trophy className="h-3 w-3 text-yellow-600" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Leading Team ({maxTeamRuns} Runs)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    }
    
    return formattedName;
  }

  // Format team name to remove location
  const formatTeamName = (teamName: string) => {
    // Common MLB team locations to remove
    const locations = [
      "Arizona", "Atlanta", "Baltimore", "Boston", "Chicago", "Cincinnati", 
      "Cleveland", "Colorado", "Detroit", "Houston", "Kansas City", "Los Angeles", 
      "Miami", "Milwaukee", "Minnesota", "New York", "Oakland", "Philadelphia", 
      "Pittsburgh", "San Diego", "San Francisco", "Seattle", "St. Louis", 
      "Tampa Bay", "Texas", "Toronto", "Washington"
    ];
    
    // Check if team name starts with any location
    for (const location of locations) {
      if (teamName.startsWith(location)) {
        return teamName.substring(location.length).trim();
      }
    }
    
    return teamName;
  }

  const getCardClassName = (player: Player) => {
    // KOTD winners get gold cards - must have hit a home run and be on team with most runs
    if (isPlayerKOTD(player)) {
      return "bg-gradient-to-br from-yellow-50 to-white border-yellow-200 dark:from-yellow-900/30 dark:to-gray-900 dark:border-yellow-700/50";
    }
    
    // All other cards
    return "bg-white dark:bg-gray-950 hover:shadow-md dark:shadow-none border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900";
  }

  const getTableRowClassName = (player: Player, isStarred: boolean) => {
    const baseClasses = "transition-all duration-200";
    const starredClass = isStarred ? "bg-yellow-50 dark:bg-yellow-950/20" : "";

    // KOTD winners get gold - must have hit a home run and be on team with most runs
    if (isPlayerKOTD(player)) {
      return `${baseClasses} bg-gradient-to-r from-yellow-50 to-white dark:from-yellow-900/20 dark:to-gray-900 shadow-sm hover:shadow-md hover:from-yellow-100 hover:to-yellow-50 dark:hover:from-yellow-900/30 dark:hover:to-gray-800`;
    }
    
    // Default for all other rows
    return `${baseClasses} ${starredClass} hover:bg-gray-50 dark:hover:bg-gray-900 hover:shadow-sm`;
  }

  const getStatusBadge = (player: Player) => {
    const isFinal = player.gameStatus === "Final" || player.gameStatus.includes("Final");
    const isPostponed = player.isPostponed || player.gameStatus === "Postponed";
    
    // Format inning display to show "Top" instead of "top" and "Bot" instead of "bottom"
    let inningDisplay = player.currentInning;
    if (inningDisplay) {
      inningDisplay = inningDisplay.replace("top", "Top").replace("bottom", "Bot");
    }
    
    return (
      <Badge
        variant={isFinal ? "secondary" : "outline"}
        className={`
          ${
            isPostponed
              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
              : isFinal
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                : "bg-amber-600 text-white dark:bg-amber-800 dark:text-amber-100"
          }
          px-2 py-0.5 text-xs
        `}
      >
        {isPostponed ? "Postponed" : isFinal ? "Final" : inningDisplay}
      </Badge>
    )
  }

  const PlayerCard = ({ player, game, isStarred, onToggleStar }: { player: Player, game?: Game, isStarred: boolean, onToggleStar: () => void }) => {
    const justHitHR = hasRecentHR(player.personId)
    const isFinal = player.gameStatus === "Final" || player.gameStatus.includes("Final")
    const isPostponed = player.isPostponed || player.gameStatus === "Postponed"
    
    return (
      <Card 
        className={`overflow-hidden ${getCardClassName(player)} transition-all duration-200 hover:shadow-lg`}
      >
        <CardContent className="p-3">
          {/* Header with player name and star button */}
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-1 max-w-[80%]">
              {isPlayerKOTD(player) && <Crown className="h-4 w-4 min-w-4 text-yellow-600" />}
              {justHitHR ? 
                <span className="animate-pulse bg-green-500 rounded-full h-3 w-3 min-w-3 inline-block" /> :
                (player.homeRun && <CircleDot className="h-3 w-3 min-w-3 text-green-600" />)
              }
              <h3 className={`font-bold truncate ${player.homeRun || justHitHR ? "text-green-700 dark:text-green-500" : ""}`}>
                {player.name}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onToggleStar()
              }}
              className={`p-0 h-6 w-6 min-w-6 ${
                isStarred ? "text-yellow-500" : "text-gray-400"
              } hover:text-yellow-500 transition-colors`}
            >
              <span className="text-lg">
                {isStarred ? "★" : "☆"}
              </span>
            </Button>
          </div>
          
          {/* Score and teams strip */}
          <div className="flex justify-between items-center mb-2 bg-secondary/10 rounded p-2">
            <div className="flex items-center gap-2">
              {/* Team and score */}
              <div className="flex items-center gap-1">
                <span className={`text-sm font-medium ${isTeamLeading(player.team) ? "text-yellow-700 dark:text-yellow-400" : ""}`}>
                  {formatTeamName(player.team)}
                  {isTeamLeading(player.team) && <Trophy className="h-3 w-3 text-yellow-600 inline ml-1" />}
                </span>
                <span className={`text-base font-bold ${player.teamRuns > player.opponentRuns ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                  {player.teamRuns}
                </span>
                <span className="text-sm mx-px">-</span>
                <span className={`text-base font-bold ${player.opponentRuns > player.teamRuns ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                  {player.opponentRuns}
                </span>
                <span className={`text-sm font-medium ${isTeamLeading(player.opponent) ? "text-yellow-700 dark:text-yellow-400" : ""}`}>
                  {formatTeamName(player.opponent)}
                </span>
              </div>
            </div>
            
            {/* Only show badge for active games, not for Final/Postponed to save space */}
            {!isFinal && !isPostponed && player.currentInning && (
              <Badge
                variant="outline"
                className="ml-1 text-xs py-0.5 px-2 h-5 bg-amber-600 text-white dark:bg-amber-800 dark:text-amber-100"
              >
                {player.currentInning.replace("top", "Top").replace("bottom", "Bot")}
              </Badge>
            )}
            
            {/* Show text status for Final/Postponed to save vertical space */}
            {(isFinal || isPostponed) && (
              <span className={`text-xs ${isPostponed ? "text-red-600" : "text-green-600"}`}>
                {isPostponed ? "PPD" : "Final"}
              </span>
            )}
          </div>
          
          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-1 bg-secondary/20 rounded">
              <div className={`text-lg font-bold ${player.homeRun ? "text-green-700 dark:text-green-500" : ""}`}>
                {player.homeRunCount}
              </div>
              <div className="text-xs text-muted-foreground">HRs</div>
            </div>
            <div className="text-center p-1 bg-secondary/20 rounded">
              <div className="text-lg font-bold">{player.teamRuns}</div>
              <div className="text-xs text-muted-foreground">Runs</div>
            </div>
            <div className="text-center p-1 bg-secondary/20 rounded">
              <div className="text-lg font-bold">{player.atBats}</div>
              <div className="text-xs text-muted-foreground">AB</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Pagination
  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedPlayers = sortedPlayers.slice(startIndex, endIndex)

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = []
    
    // Always show first page
    pageNumbers.push(1)
    
    // Calculate range of pages to show around current page
    let startPage = Math.max(2, currentPage - 1)
    let endPage = Math.min(totalPages - 1, currentPage + 1)
    
    // Add ellipsis after first page if needed
    if (startPage > 2) {
      pageNumbers.push('...')
    }
    
    // Add pages around current page
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }
    
    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      pageNumbers.push('...')
    }
    
    // Add last page if it's not the first page
    if (totalPages > 1) {
      pageNumbers.push(totalPages)
    }
    
    return pageNumbers
  }

  // Format matchup display
  const formatMatchup = (player: Player) => {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          <span className={`${player.teamRuns > player.opponentRuns ? "font-bold" : ""} ${isTeamLeading(player.team) ? "text-yellow-700 dark:text-yellow-400" : ""}`}>
            {formatTeamNameWithStatus(player.team, false)}
          </span>
          <span className="text-muted-foreground ml-1">{player.teamRuns}</span>
          <span className="text-muted-foreground mx-1">–</span>
          <span className="text-muted-foreground">{player.opponentRuns}</span>
          <span className={`${player.opponentRuns > player.teamRuns ? "font-bold ml-1" : "ml-1"} ${isTeamLeading(player.opponent) ? "text-yellow-700 dark:text-yellow-400" : ""}`}>
            {formatTeamNameWithStatus(player.opponent, false)}
          </span>
        </div>
        
        <Badge
          variant={(player.gameStatus === "Final" || player.gameStatus.includes("Final")) ? "secondary" : "outline"}
          className={`
            ml-2 text-xs py-0.5 px-2 h-6 ${
              player.isPostponed || player.gameStatus === "Postponed"
                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                : (player.gameStatus === "Final" || player.gameStatus.includes("Final"))
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                  : "bg-amber-600 text-white dark:bg-amber-800 dark:text-amber-100"
            }
          `}
        >
          {player.isPostponed || player.gameStatus === "Postponed" 
            ? "Postponed" 
            : (player.gameStatus === "Final" || player.gameStatus.includes("Final"))
              ? "Final"
              : player.currentInning?.replace("top", "Top").replace("bottom", "Bot") || "-"}
        </Badge>
      </div>
    );
  };

  const renderPlayerNameWithBadge = (player: Player) => {
    const justHitHR = hasRecentHR(player.personId)
    
    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          {isPlayerKOTD(player) && <Crown className="h-4 w-4 text-yellow-600" />}
          {justHitHR ? 
            <span className="animate-pulse bg-green-500 rounded-full h-3 w-3 inline-block mr-1" /> :
            (player.homeRun && <CircleDot className="h-3 w-3 text-green-600" />)
          }
          <span className={`${player.homeRun || justHitHR ? "font-semibold text-green-700 dark:text-green-500" : ""} ${!player.teamRuns ? "text-muted-foreground" : ""}`}>
            {player.name}
          </span>
        </div>
        <div className="text-xs text-muted-foreground flex items-center mt-1 ml-6">
          {formatTeamNameWithStatus(player.team, true)}
        </div>
      </div>
    );
  };

  const Pagination = ({ totalItems, itemsPerPage, currentPage, onPageChange }: { 
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
    onPageChange: (page: number) => void;
  }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    
    return (
      <div className="flex flex-wrap justify-center items-center gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        
        {getPageNumbers().map((page, i) => (
          typeof page === 'number' ? (
            <Button
              key={i}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          ) : (
            <span key={i} className="px-2 flex items-center">
              {page}
            </span>
          )
        ))}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with icons showing what's happening */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center">
          <h2 className="text-xl sm:text-2xl font-bold truncate">
            {dateLabel || "Home Run Tracker"}{" "}
            {allGamesFinal && (
              <Badge className="ml-1 text-xs px-1.5 py-0 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                Final
              </Badge>
            )}
          </h2>
          <Link href="/kotd" className="ml-2">
            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
              <Crown className="h-3 w-3 text-yellow-500" />
              How It Works
            </Button>
          </Link>
        </div>

        <div className="text-xs sm:text-sm text-muted-foreground">
          Updated: {lastUpdated}
        </div>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow">
        <div className="p-3 sm:p-6">
          {/* Properly structured tabs with content inside */}
          <Tabs defaultValue="tracker" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto mb-6 grid-cols-2">
              <TabsTrigger value="tracker">Today&apos;s Tracker</TabsTrigger>
              <TabsTrigger value="schedule">Today&apos;s Schedule</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tracker" className="mt-0">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search players or teams..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className={styles.buttonRow}>
                  <Button
                    variant={viewMode === "card" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("card")}
                    className={styles.filterButton}
                  >
                    <LayoutGrid className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Cards</span>
                  </Button>
                  <Button
                    variant={viewMode === "table" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("table")}
                    className={styles.filterButton}
                  >
                    <TableIcon className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Table</span>
                  </Button>
                  <Button
                    variant={showStarredOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowStarredOnly(!showStarredOnly)}
                    className={styles.filterButton}
                  >
                    <Star
                      className="h-4 w-4 mr-1 sm:mr-2"
                      fill={showStarredOnly ? "currentColor" : "none"}
                    />
                    <span className="hidden sm:inline">Starred</span>
                  </Button>
                  <Button
                    variant={showHomeRunsOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowHomeRunsOnly(!showHomeRunsOnly)}
                    className={styles.filterButton}
                  >
                    <CircleDot className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Home Runs</span>
                  </Button>
                </div>
              </div>

              {/* Team leader banner - more compact on mobile */}
              {maxTeamRuns > 0 && (
                <div className="p-2 sm:p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md mb-4 border border-yellow-200 dark:border-yellow-800/40">
                  <div className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
                    <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600 flex-shrink-0" />
                    <span className="font-medium truncate">
                      {teamsWithMostRuns.length > 1 
                        ? "Leaders" 
                        : "Leader"}: {teamsWithMostRuns.map(formatTeamName).join(", ")} 
                      <span className="whitespace-nowrap">({maxTeamRuns} Runs)</span>
                    </span>
                  </div>
                </div>
              )}

              {filteredPlayers.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No players match your filters</AlertTitle>
                  <AlertDescription>
                    {showHomeRunsOnly
                      ? "No home runs hit yet matching your filters."
                      : "No players match your current filter settings."}
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {viewMode === "card" ? (
                    <div
                      className={cn(
                        "grid gap-3 mb-4",
                        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                      )}
                    >
                      {paginatedPlayers.map((player) => (
                        <PlayerCard
                          key={`${player.personId}-${player.teamId}-${player.homeRunCount}`}
                          player={player}
                          game={games.find((g) => g.gamePk === player.gameId)}
                          isStarred={starredPlayers.has(player.personId)}
                          onToggleStar={() => toggleStarPlayer(player.personId)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12 text-center">#</TableHead>
                            <TableHead>Player</TableHead>
                            <TableHead className="text-center">HRs</TableHead>
                            <TableHead className="text-center">AB</TableHead>
                            <TableHead>Matchup</TableHead>
                            <TableHead className="w-10 text-center"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedPlayers.map((player, idx) => {
                            const isStarred = starredPlayers.has(player.personId);
                            return (
                              <TableRow
                                key={`${player.personId}-${player.teamId}`}
                                className={getTableRowClassName(player, isStarred)}
                              >
                                <TableCell className="text-center font-medium">
                                  {startIndex + idx + 1}
                                </TableCell>
                                <TableCell>
                                  {renderPlayerNameWithBadge(player)}
                                </TableCell>
                                <TableCell className="text-center font-bold">
                                  <span className={player.homeRun ? "text-green-600 dark:text-green-400" : ""}>
                                    {player.homeRunCount}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center">
                                  {player.atBats}
                                </TableCell>
                                <TableCell>
                                  {formatMatchup(player)}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleStarPlayer(player.personId)}
                                    className={`p-0 h-6 w-6 ${
                                      isStarred ? "text-yellow-500" : "text-gray-400"
                                    } hover:text-yellow-500 transition-colors`}
                                  >
                                    <span className="text-lg">
                                      {isStarred ? "★" : "☆"}
                                    </span>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {filteredPlayers.length > itemsPerPage && (
                    <Pagination
                      totalItems={filteredPlayers.length}
                      itemsPerPage={itemsPerPage}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              )}
            </TabsContent>
            
            <TabsContent value="schedule" className="mt-0">
              <h2 className="text-2xl font-bold mb-4 text-center md:text-left">
                {dateLabel || "Today's"} MLB Schedule
              </h2>
              {games.length > 0 ? (
                <ScheduledGames games={games} />
              ) : (
                <div className="text-center p-4 border rounded-lg bg-muted/20">
                  <p className="text-muted-foreground">No games scheduled for this date</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 