"use client"

import type { HitRateFilters, PlayerHitRateProfile } from "@/types/hit-rates"
import { useState, useEffect } from "react"
import { fetchHitRateProfiles } from "@/services/hit-rates"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import PlayerStatsTable from "@/components/data-duels/player-stats-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays, Clock, MapPin, Users, TrendingUp } from "lucide-react"
import { Separator } from "@/components/ui/separator"

// Define the market categories we want to display
const MARKET_CATEGORIES = {
  // Hitting
  Hits: ["Hits", "Singles", "Doubles", "Triples", "Home Runs", "Total Bases"],

  // Run Production
  RunProduction: ["RBIs", "Hits + Runs + RBIs"],

  // Plate Discipline
  PlateOutcomes: ["Batting Strikeouts", "Batting Walks"],

  // Pitching
  Pitching: ["Strikeouts", "Walks", "Outs", "Earned Runs", "Pitcher Win"],
} as const

type SportsbookOption = "best_odds" | "dk" | "fd" | "mgm" | "czr"

// Add team abbreviation helpers
const teamAbbreviationMap: Record<string, string> = {
  // Arizona Diamondbacks variations
  ARI: "AZ",
  ARIZONA: "AZ",
  DIAMONDBACKS: "AZ",

  // Oakland Athletics variations
  AT: "OAK",

  // Add more mappings as needed
}

// Helper to get the correct file name for a team abbreviation
function getTeamLogoFilename(abbr: string): string {
  if (!abbr) return "default"
  const upperAbbr = abbr.toUpperCase()
  return teamAbbreviationMap[upperAbbr] || abbr
}

// Helper to standardize team abbreviations
function getStandardAbbreviation(abbr: string): string {
  const map: Record<string, string> = {
    AT: "OAK",
    // Add more mappings as needed
  }
  return map[abbr] || abbr
}

// Helper to convert a full team name to an abbreviation
const getTeamAbbreviation = (teamName: string): string => {
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

  // First try direct lookup
  if (teamAbbreviations[teamName]) {
    return teamAbbreviations[teamName]
  }

  // If not found, try matching parts of the name
  const upperName = teamName.toUpperCase()
  for (const [fullName, abbr] of Object.entries(teamAbbreviations)) {
    if (upperName.includes(fullName.toUpperCase())) {
      return abbr
    }
  }

  // If still not found, try to match the raw abbreviation
  if (teamName.length <= 3) {
    return teamName.toUpperCase()
  }

  // Last resort: generate abbreviation from the team name
  return teamName
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
}

// Get team colors based on abbreviation
function getTeamColor(abbr: string): string {
  const teamColors: Record<string, string> = {
    NYY: "bg-blue-600",
    BOS: "bg-red-600",
    LAD: "bg-blue-500",
    SF: "bg-orange-500",
    ATL: "bg-red-500",
    HOU: "bg-orange-600",
    PHI: "bg-red-600",
    SD: "bg-yellow-600",
    // Add more team colors as needed
  }
  return teamColors[abbr] || "bg-slate-600"
}

interface PlayerStats {
  name: string
  position: string
  teamAbbr: string // Add team abbreviation
  [key: string]: any // Allow dynamic market stats
}

interface TeamData {
  name: string
  abbreviation: string // Add team abbreviation
  players: PlayerStats[]
}

interface DataDuelsGameData {
  homeTeam: TeamData
  awayTeam: TeamData
  date: string
  startTime: string
  venue: string
}

interface DataDuelsProps {
  sport: string
  date: string
  matchup: string
}

export default function DataDuelsPage({ params }: { params: DataDuelsProps }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [gameData, setGameData] = useState<DataDuelsGameData | null>(null)
  const [selectedSportsbook, setSelectedSportsbook] = useState<SportsbookOption>("best_odds")

  // Parse matchup from URL
  const [team1Raw, team2Raw] = params.matchup.split("-vs-")

  if (!team1Raw || !team2Raw) {
    console.error("[DATA DUELS] Invalid matchup format:", params.matchup)
    throw new Error("Invalid matchup format. Expected format: Team1-vs-Team2")
  }

  // Convert URL format to proper team names
  const team1 = team1Raw.replace(/([A-Z])/g, " $1").trim()
  const team2 = team2Raw.replace(/([A-Z])/g, " $1").trim()

  console.log("[DATA DUELS] Parsed team names:", {
    team1Raw,
    team2Raw,
    team1,
    team2,
    team1Abbr: getTeamAbbreviation(team1),
    team2Abbr: getTeamAbbreviation(team2),
  })

  const transformProfileToPlayerStats = (profile: PlayerHitRateProfile): Partial<PlayerStats> => {
    const marketKey = profile.market.toLowerCase().replace(/\s+/g, "")

    return {
      name: profile.player_name,
      position: profile.position_abbreviation || "N/A",
      teamAbbr: profile.team_abbreviation || "N/A",
      [marketKey]: {
        line: profile.line,
        playoffAvg: profile.avg_stat_per_game,
        l10HitRate: profile.last_10_hit_rate,
        l5vsOpp:
          profile.recent_games
            ?.slice(0, 5)
            .map((g) => g.value)
            .join(", ") || "N/A",
      },
    }
  }

  const mergePlayerStats = (players: Partial<PlayerStats>[]): PlayerStats[] => {
    const playerMap = new Map<string, PlayerStats>()

    players.forEach((player) => {
      if (!player.name) return

      const existing = playerMap.get(player.name) || {
        name: player.name,
        position: player.position || "N/A",
        teamAbbr: player.teamAbbr || "N/A",
      }

      playerMap.set(player.name, { ...existing, ...player })
    })

    return Array.from(playerMap.values())
  }

    const loadGameData = async () => {
      setLoading(true)
    try {
      // Create an array of promises to fetch all markets in parallel
      const marketPromises = Object.values(MARKET_CATEGORIES)
        .flat()
        .map((market) => {
          const filters: HitRateFilters = {
            sport: params.sport,
            market: market,
            timeWindow: "10_games",
            minHitRate: 0,
          }
          return fetchHitRateProfiles(filters)
        })

      const allMarketProfiles = await Promise.all(marketPromises)
      console.log(`[DATA DUELS] Fetched data for ${allMarketProfiles.length} markets`)

      // Combine all profiles
      const allProfiles = allMarketProfiles.flat()

      // Filter profiles for this specific game
      const gameProfiles = allProfiles.filter((profile) => {
        const matchesTeams =
          (profile.home_team === team1 && profile.away_team === team2) ||
          (profile.home_team === team2 && profile.away_team === team1)
        return matchesTeams
      })

      console.log("[DATA DUELS] Game profiles found:", gameProfiles.length)
      console.log("[DATA DUELS] Team names:", { team1, team2 })
      console.log("[DATA DUELS] Sample profile team names:", gameProfiles[0]?.home_team, gameProfiles[0]?.away_team)

      // Transform and group players by team
      const homeTeamProfiles = gameProfiles.filter((p) => {
        const isHomeTeam = p.team_abbreviation === getTeamAbbreviation(team1)
        if (isHomeTeam) {
          console.log("[DATA DUELS] Found home team player:", p.player_name, p.team_abbreviation)
        }
        return isHomeTeam
      })

      const awayTeamProfiles = gameProfiles.filter((p) => {
        const isAwayTeam = p.team_abbreviation === getTeamAbbreviation(team2)
        if (isAwayTeam) {
          console.log("[DATA DUELS] Found away team player:", p.player_name, p.team_abbreviation)
        }
        return isAwayTeam
      })

      console.log("[DATA DUELS] Home team players found:", homeTeamProfiles.length)
      console.log("[DATA DUELS] Away team players found:", awayTeamProfiles.length)

      // Transform profiles to player stats and merge by player
      const homeTeamPlayers = mergePlayerStats(homeTeamProfiles.map(transformProfileToPlayerStats))
      const awayTeamPlayers = mergePlayerStats(awayTeamProfiles.map(transformProfileToPlayerStats))

      console.log("[DATA DUELS] Final home team players:", homeTeamPlayers.length)
      console.log("[DATA DUELS] Final away team players:", awayTeamPlayers.length)

      // Get game details from first matching profile
      const gameDetails = gameProfiles[0]

      setGameData({
          homeTeam: {
            name: team1,
          abbreviation: getTeamAbbreviation(team1),
          players: homeTeamPlayers,
          },
          awayTeam: {
            name: team2,
          abbreviation: getTeamAbbreviation(team2),
          players: awayTeamPlayers,
        },
        date: params.date,
        startTime: gameDetails?.commence_time ? new Date(gameDetails.commence_time).toLocaleTimeString() : "TBD",
        venue: "TBD",
      })
    } catch (error) {
      console.error("[DATA DUELS] Error loading game data:", error)
        setError("Failed to load game data")
      } finally {
        setLoading(false)
      }
    }

  useEffect(() => {
    loadGameData()
  }, [params.sport, params.date, params.matchup, team1, team2])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <Card className="p-8">
          <div className="flex flex-col items-center gap-4">
        <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
            <p className="text-muted-foreground">Loading game data...</p>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Error Loading Game Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={loadGameData} className="mt-4 w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!gameData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Game Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Unable to find game data for this matchup.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-6 lg:py-8 max-w-7xl">
      {/* Game Header */}
        <Card className="mb-6 lg:mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 text-white p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Teams and Score */}
              <div className="space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <h1 className="text-2xl lg:text-4xl font-bold">
                    <span className="inline-flex items-center gap-2">
                      <div
                        className={`w-3 h-3 lg:w-4 lg:h-4 rounded-full ${getTeamColor(gameData.homeTeam.abbreviation)}`}
                      />
                      {gameData.homeTeam.name}
                    </span>
                    <span className="mx-2 lg:mx-4 text-slate-300">vs</span>
                    <span className="inline-flex items-center gap-2">
                      <div
                        className={`w-3 h-3 lg:w-4 lg:h-4 rounded-full ${getTeamColor(gameData.awayTeam.abbreviation)}`}
                      />
                      {gameData.awayTeam.name}
                    </span>
        </h1>
                </div>

                {/* Game Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm lg:text-base text-slate-300">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    {new Date(gameData.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {gameData.startTime}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {gameData.venue}
                  </div>
                </div>
          </div>
          
              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-3 lg:items-center">
                <Select
                  value={selectedSportsbook}
                  onValueChange={(value: SportsbookOption) => setSelectedSportsbook(value)}
                >
                  <SelectTrigger className="w-full sm:w-[180px] bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Select Sportsbook" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="best_odds">Best Odds</SelectItem>
                    <SelectItem value="dk">DraftKings</SelectItem>
                    <SelectItem value="fd">FanDuel</SelectItem>
                    <SelectItem value="mgm">BetMGM</SelectItem>
                    <SelectItem value="czr">Caesars</SelectItem>
            </SelectContent>
          </Select>

                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>Live Odds</span>
                </div>
              </div>
        </div>
      </div>

          {/* Quick Stats */}
          <div className="p-4 lg:p-6 bg-white/50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Home Players</span>
                </div>
                <div className="text-2xl font-bold">{gameData.homeTeam.players.length}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Away Players</span>
                </div>
                <div className="text-2xl font-bold">{gameData.awayTeam.players.length}</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-muted-foreground mb-1">Markets</div>
                <div className="text-2xl font-bold">{Object.values(MARKET_CATEGORIES).flat().length}</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-muted-foreground mb-1">Categories</div>
                <div className="text-2xl font-bold">{Object.keys(MARKET_CATEGORIES).length}</div>
              </div>
            </div>
          </div>
        </Card>

      {/* Team Sections */}
        <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-8">
        {/* Home Team */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-2">
              <div className={`w-4 h-4 rounded-full ${getTeamColor(gameData.homeTeam.abbreviation)}`} />
              <h2 className="text-xl lg:text-2xl font-bold">{gameData.homeTeam.name}</h2>
              <Badge variant="outline" className="ml-auto">
                {gameData.homeTeam.abbreviation}
              </Badge>
            </div>
            <PlayerStatsTable
              players={gameData.homeTeam.players}
              teamAbbr={gameData.homeTeam.abbreviation}
              className="shadow-lg"
            />
          </div>

          {/* Away Team */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-2">
              <div className={`w-4 h-4 rounded-full ${getTeamColor(gameData.awayTeam.abbreviation)}`} />
              <h2 className="text-xl lg:text-2xl font-bold">{gameData.awayTeam.name}</h2>
              <Badge variant="outline" className="ml-auto">
                {gameData.awayTeam.abbreviation}
              </Badge>
            </div>
            <PlayerStatsTable
              players={gameData.awayTeam.players}
              teamAbbr={gameData.awayTeam.abbreviation}
              className="shadow-lg"
            />
          </div>
          </div>

        {/* Footer */}
        <div className="mt-8 lg:mt-12 text-center">
          <Separator className="mb-6" />
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Data updated in real-time • Last updated: {new Date().toLocaleTimeString()}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="outline">Live Odds</Badge>
              <Badge variant="outline">Player Statistics</Badge>
              <Badge variant="outline">Hit Rate Analysis</Badge>
              <Badge variant="outline">Performance Metrics</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
