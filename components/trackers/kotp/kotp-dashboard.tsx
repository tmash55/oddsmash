"use client"

import { useState, useEffect, useRef } from "react"
import {
  Search,
  Trophy,
  LayoutGrid,
  TableIcon,
  Star,
  Filter,
  Crown,
  Calendar,
  X,
  CheckCircle2,
  Clock,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type SeriesRecord = {
  wins: number
  losses: number
  eliminated: boolean
  advanced: boolean
}

type PlayoffPlayer = {
  personId: string
  name: string
  teamTricode: string
  points: number // Total playoff points
  livePts: number // Points from currently active game
  totalPts: number // Combined total (playoff + live)
  gamesPlayed: number
  ppg: number // Points per game
  gameStatus: string // Current game status if applicable
  liveMatchup: string // Current game matchup if applicable
  isPlaying: boolean // Whether the player is in an active game
  oncourt: boolean // Whether the player is on the court right now
  playedToday: boolean // Whether the player played in a game today
  seriesRecord: SeriesRecord // Playoff series record
}

type ViewMode = "card" | "table"

type KOTPDashboardProps = {
  players: PlayoffPlayer[]
  allGamesFinal?: boolean
  lastUpdated: string
  playoffRound?: string
}

type ChangedStats = {
  [key: string]: Set<"totalPts" | "livePts" | "points" | "gameStatus" | "ppg">
}

const OnCourtIndicator = ({ isOnCourt }: { isOnCourt: boolean }) =>
  isOnCourt ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
        </TooltipTrigger>
        <TooltipContent>
          <p>Player is on the court</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : null

const getTrueRank = (player: PlayoffPlayer, allPlayers: PlayoffPlayer[]) => {
  return allPlayers.findIndex((p) => p.personId === player.personId) + 1
}

const getRankDisplay = (rank: number) => {
  if (rank === 1) {
    return <Crown className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
  }
  return <span>{rank}</span>
}

export default function KOTPDashboard({
  players,
  allGamesFinal = true,
  lastUpdated,
  playoffRound = "Round 1",
}: KOTPDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Default to card view on mobile
    if (typeof window !== "undefined") {
      return window.innerWidth < 768 ? "card" : "table"
    }
    return "card"
  })
  const [showStarredOnly, setShowStarredOnly] = useState(false)
  const [changedStats, setChangedStats] = useState<ChangedStats>({})
  const [starredPlayers, setStarredPlayers] = useState<Set<string>>(() => {
    // Initialize from local storage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("kotpStarredPlayers")
      return stored ? new Set(JSON.parse(stored)) : new Set()
    }
    return new Set()
  })
  const [hideFinishedLowerRank, setHideFinishedLowerRank] = useState(false)
  const [userViewPreference, setUserViewPreference] = useState<ViewMode | null>(null)
  const prevPlayersRef = useRef<PlayoffPlayer[]>([])

  useEffect(() => {
    const newChangedStats: ChangedStats = {}
    players.forEach((player) => {
      const prevPlayer = prevPlayersRef.current.find((p) => p.personId === player.personId)
      if (prevPlayer) {
        const changedFields = new Set<"totalPts" | "livePts" | "points" | "gameStatus" | "ppg">()
        if (prevPlayer.totalPts !== player.totalPts) changedFields.add("totalPts")
        if (prevPlayer.livePts !== player.livePts) changedFields.add("livePts")
        if (prevPlayer.points !== player.points) changedFields.add("points")
        if (prevPlayer.gameStatus !== player.gameStatus) changedFields.add("gameStatus")
        if (changedFields.size > 0) {
          newChangedStats[player.personId] = changedFields
        }
      }
    })

    if (Object.keys(newChangedStats).length > 0) {
      setChangedStats(newChangedStats)
      const timerId = setTimeout(() => {
        setChangedStats({})
      }, 2000)
      return () => clearTimeout(timerId)
    }
  }, [players])

  useEffect(() => {
    // Save a reference to the current players for the next update
    prevPlayersRef.current = players
  }, [players])

  useEffect(() => {
    // Update local storage when starredPlayers changes
    localStorage.setItem("kotpStarredPlayers", JSON.stringify(Array.from(starredPlayers)))
  }, [starredPlayers])

  const filteredPlayers = players.filter((player) => {
    const matchesSearch =
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.teamTricode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (player.liveMatchup && player.liveMatchup.toLowerCase().includes(searchTerm.toLowerCase()))
    const isStarred = starredPlayers.has(player.personId)
    const trueRank = getTrueRank(player, players)
    const isTopThree = trueRank <= 3

    // Player is "finished" if their team is eliminated or has advanced
    const isSeriesOver = player.seriesRecord.eliminated || player.seriesRecord.advanced

    return matchesSearch && (!showStarredOnly || isStarred) && (!hideFinishedLowerRank || isTopThree || !isSeriesOver)
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

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    if (starredPlayers.has(a.personId) && !starredPlayers.has(b.personId)) return -1
    if (!starredPlayers.has(a.personId) && starredPlayers.has(b.personId)) return 1
    return getTrueRank(a, players) - getTrueRank(b, players)
  })

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />
    if (index === 1) return <Trophy className="h-5 w-5 text-gray-400 dark:text-gray-500" />
    if (index === 2) return <Trophy className="h-5 w-5 text-amber-600" />
    return null
  }

  const getStatusBadge = (player: PlayoffPlayer) => {
    if (!player.isPlaying) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100">
          Inactive
        </Badge>
      )
    }

    const displayStatus = player.gameStatus

    if (player.gameStatus === "Completed") {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
          Final
        </Badge>
      )
    }

    return (
      <Badge
        variant="outline"
        className={`
          bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100
          ${changedStats[player.personId]?.has("gameStatus") ? "animate-pulse" : ""}
        `}
      >
        {displayStatus}
      </Badge>
    )
  }

  const getCardClassName = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-br from-yellow-300 to-yellow-100 dark:from-yellow-600 dark:to-yellow-900 shadow-xl shadow-yellow-200/50 dark:shadow-yellow-900/50 border-yellow-400 dark:border-yellow-700"
      case 2:
        return "bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-800 shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 border-gray-300 dark:border-gray-600"
      case 3:
        return "bg-gradient-to-br from-amber-200 to-amber-100 dark:from-amber-700 dark:to-amber-800 shadow-lg shadow-amber-200/50 dark:shadow-amber-900/50 border-amber-300 dark:border-amber-600"
      default:
        return "bg-white dark:bg-gray-950 hover:shadow-md dark:shadow-none border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
    }
  }

  const getTrophyIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />

      default:
        return null
    }
  }

  const getTableRowClassName = (rank: number, isStarred: boolean) => {
    const baseClasses = "transition-all duration-200"
    const starredClass = isStarred ? "bg-yellow-50 dark:bg-yellow-950/20" : ""

    switch (rank) {
      case 1:
        return `${baseClasses} bg-gradient-to-r from-yellow-300 to-yellow-100 dark:from-yellow-600 dark:to-yellow-900 shadow-md shadow-yellow-200/50 dark:shadow-yellow-900/50 hover:shadow-lg hover:from-yellow-400 hover:to-yellow-200 dark:hover:from-yellow-500 dark:hover:to-yellow-800`
      case 2:
        return `${baseClasses} bg-gradient-to-r from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-800 shadow-md shadow-gray-200/50 dark:shadow-gray-900/50 hover:shadow-lg hover:from-gray-300 hover:to-gray-200 dark:hover:from-gray-600 dark:hover:to-gray-700`
      case 3:
        return `${baseClasses} bg-gradient-to-r from-amber-200 to-amber-100 dark:from-amber-700 dark:to-amber-800 shadow-md shadow-amber-200/50 dark:shadow-amber-900/50 hover:shadow-lg hover:from-amber-300 hover:to-amber-200 dark:hover:from-amber-600 dark:hover:to-amber-700`
      default:
        return `${baseClasses} ${starredClass} hover:bg-gray-50 dark:hover:bg-gray-900 hover:shadow-sm`
    }
  }

  const StatDisplay = ({
    label,
    value,
    playerId,
    statKey,
  }: {
    label: string
    value: number
    playerId: string
    statKey: "totalPts" | "livePts" | "points" | "ppg"
  }) => (
    <div className="space-y-1">
      <span
        className={`text-lg font-bold ${
          changedStats[playerId]?.has(statKey) ? "text-green-600 dark:text-green-400 animate-pulse" : ""
        }`}
      >
        {value}
      </span>
      <span className="text-xs text-muted-foreground block">{label}</span>
    </div>
  )

  const StarButton = ({ playerId }: { playerId: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.stopPropagation()
        toggleStarPlayer(playerId)
      }}
      className={`p-0 h-6 w-6 ${
        starredPlayers.has(playerId) ? "text-yellow-500" : "text-gray-400"
      } hover:text-yellow-500 transition-colors`}
    >
      <Star className="h-4 w-4" fill={starredPlayers.has(playerId) ? "currentColor" : "none"} />
    </Button>
  )

  // Add a new component for the series status indicator
  const SeriesStatus = ({ seriesRecord }: { seriesRecord: SeriesRecord }) => {
    if (seriesRecord.eliminated) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <X className="h-4 w-4 text-red-500 ml-1" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Eliminated from playoffs</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    if (seriesRecord.advanced) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <CheckCircle2 className="h-4 w-4 text-green-500 ml-1" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Advanced to next round</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return null
  }

  // PlayerCard component
  const PlayerCard = ({ player, rank }: { player: PlayoffPlayer; rank: number }) => (
    <Card
      key={player.personId}
      className={`overflow-hidden transition-all duration-300 ${getCardClassName(rank)} relative`}
    >
      {rank === 1 && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            opacity: 0.05,
            transform: "rotate(-10deg)",
            pointerEvents: "none",
          }}
        >
          <Crown className="w-[200%] h-[200%] text-yellow-600/50" strokeWidth={0.5} />
        </div>
      )}
      <CardContent className="p-4 relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-2">
            <div className="mt-1">
              {rank === 1 ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Crown className="h-5 w-5 text-yellow-800 dark:text-yellow-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Currently Leading</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <span className="text-lg font-semibold">{rank}</span>
              )}
            </div>
            <div>
              <h2 className="font-bold text-base text-gray-900 dark:text-gray-100 flex items-center">
                {player.name}
                <SeriesStatus seriesRecord={player.seriesRecord} />
              </h2>
              <div className="flex items-center space-x-1">
                <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                  {player.teamTricode}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <StarButton playerId={player.personId} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center mt-4">
          <StatDisplay label="TOTAL PTS" value={player.points} playerId={player.personId} statKey="points" />
          <StatDisplay label="PPG" value={player.ppg} playerId={player.personId} statKey="ppg" />
          <div className="space-y-1">
            <span className="text-lg font-bold">
              {player.seriesRecord.wins}-{player.seriesRecord.losses}
            </span>
            <span className="text-xs text-muted-foreground block">SERIES</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const setViewModeWithPreference = (mode: ViewMode) => {
    setViewMode(mode)
    setUserViewPreference(mode)
  }

  useEffect(() => {
    const handleResize = () => {
      const newDefaultView = window.innerWidth < 768 ? "card" : "table"
      if (!userViewPreference) {
        setViewMode(newDefaultView)
      }
    }

    window.addEventListener("resize", handleResize)
    handleResize() // Set initial view mode

    return () => window.removeEventListener("resize", handleResize)
  }, [userViewPreference])

  return (
    <div className="space-y-4">
      {/* Improved header section with better hierarchy */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 space-y-4">
        {/* Top row with round info and last updated */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-2 py-1 font-medium text-sm bg-background">
              <Calendar className="h-4 w-4 mr-1.5 text-primary" />
              <span className="font-semibold">{playoffRound}</span>
            </Badge>

            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              <span>
                Updated: <span className="tabular-nums">{lastUpdated}</span>
              </span>
            </div>
          </div>

          {/* View controls for desktop */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center rounded-md border bg-background p-1">
              <Button
                variant={viewMode === "card" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewModeWithPreference("card")}
                className="h-8 px-2"
              >
                <LayoutGrid className="h-4 w-4 mr-1.5" />
                Cards
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewModeWithPreference("table")}
                className="h-8 px-2"
              >
                <TableIcon className="h-4 w-4 mr-1.5" />
                Table
              </Button>
            </div>

            <Button
              variant={showStarredOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowStarredOnly(!showStarredOnly)}
              className="h-8"
            >
              <Star className="h-4 w-4 mr-1.5" fill={showStarredOnly ? "currentColor" : "none"} />
              {showStarredOnly ? "Showing Starred" : "Show Starred"}
            </Button>

            <Button
              variant={hideFinishedLowerRank ? "default" : "outline"}
              size="sm"
              onClick={() => setHideFinishedLowerRank(!hideFinishedLowerRank)}
              className="h-8"
            >
              <Filter className="h-4 w-4 mr-1.5" />
              {hideFinishedLowerRank ? "Hiding Eliminated" : "Show All"}
            </Button>
          </div>
        </div>

        {/* Search row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Search player or team"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Mobile Filter Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Filter className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[40vh]">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="py-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Only Starred</span>
                  <Button
                    variant={showStarredOnly ? "default" : "outline"}
                    onClick={() => setShowStarredOnly(!showStarredOnly)}
                    size="sm"
                  >
                    {showStarredOnly ? "On" : "Off"}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Hide Eliminated (Not Top 3)</span>
                  <Button
                    variant={hideFinishedLowerRank ? "default" : "outline"}
                    onClick={() => setHideFinishedLowerRank(!hideFinishedLowerRank)}
                    size="sm"
                  >
                    {hideFinishedLowerRank ? "On" : "Off"}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">View Mode</span>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === "card" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewModeWithPreference("card")}
                    >
                      <LayoutGrid className="h-4 w-4 mr-2" />
                      Cards
                    </Button>
                    <Button
                      variant={viewMode === "table" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewModeWithPreference("table")}
                    >
                      <TableIcon className="h-4 w-4 mr-2" />
                      Table
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {viewMode === "card" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedPlayers.map((player) => (
            <PlayerCard key={player.personId} player={player} rank={getTrueRank(player, players)} />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border dark:border-gray-800">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800">
                <TableHead className="w-[50px]">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Star className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Star players to pin them to the top</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead className="w-[70px]">Rank</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="w-[80px] text-muted-foreground text-xs uppercase">Team</TableHead>
                <TableHead className="text-right text-muted-foreground text-xs uppercase">Total Pts</TableHead>
                <TableHead className="text-right hidden sm:table-cell text-muted-foreground text-xs uppercase">
                  PPG
                </TableHead>
                <TableHead className="text-right hidden sm:table-cell text-muted-foreground text-xs uppercase">
                  Games
                </TableHead>
                <TableHead className="text-right hidden sm:table-cell text-muted-foreground text-xs uppercase">
                  Series
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPlayers.map((player) => {
                const rank = getTrueRank(player, players)
                const isStarred = starredPlayers.has(player.personId)
                return (
                  <TableRow key={player.personId} className={getTableRowClassName(rank, isStarred)}>
                    <TableCell className="w-[50px]">
                      <StarButton playerId={player.personId} />
                    </TableCell>
                    <TableCell className="w-[70px]">
                      <div className="flex items-center justify-center">
                        {rank <= 1 ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>{getTrophyIcon(rank)}</TooltipTrigger>
                              <TooltipContent>
                                <p>{rank === 1 ? "Currently Leading" : rank === 2 ? "Second Place" : "Third Place"}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="font-medium text-gray-700 dark:text-gray-300">{rank}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{player.name}</span>
                        <SeriesStatus seriesRecord={player.seriesRecord} />
                      </div>
                    </TableCell>
                    <TableCell className="w-[80px]">
                      <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                        {player.teamTricode}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-bold ${
                        changedStats[player.personId]?.has("totalPts")
                          ? "text-green-600 dark:text-green-400 animate-pulse"
                          : ""
                      }`}
                    >
                      {player.points}
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell font-medium">
                      {player.ppg.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell text-muted-foreground">
                      {player.gamesPlayed}
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      {player.seriesRecord.wins > 0 || player.seriesRecord.losses > 0 ? (
                        <span className="font-medium">
                          {player.seriesRecord.wins}-{player.seriesRecord.losses}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0-0</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}