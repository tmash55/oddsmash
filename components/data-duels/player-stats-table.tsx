"use client"

import React from "react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Image from "next/image"

// Define Redis odds data structure
interface RedisOddsData {
  odds: number
  over_link?: string | null
  sid?: string | null
}

// Create a new DataDuelsOddsCell component
interface DataDuelsOddsCellProps {
  odds: {
    american: number
    sportsbook: string
    link?: string | null
  } | null
}

function DataDuelsOddsCell({ odds }: DataDuelsOddsCellProps) {
  if (!odds) {
    return null
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <Image
        src={`/images/sportsbooks/${odds.sportsbook.toLowerCase().replace(/\s+/g, '')}.png`}
        alt={odds.sportsbook}
        width={20}
        height={20}
        className="rounded-sm"
      />
      <span className="font-mono font-medium">
        {odds.american > 0 ? `+${odds.american}` : odds.american}
      </span>
    </div>
  )
}

interface PlayerStats {
  name: string
  position: string
  teamAbbr: string
  [key: string]: any
  odds?: {
    american: number
    sportsbook: string
    link?: string | null
  }
  all_odds?: Record<string, Record<string, RedisOddsData>>
}

interface PlayerStatsTableProps {
  players: PlayerStats[]
  teamAbbr: string
  className?: string
  showBestOdds?: boolean
  selectedSportsbook?: string
}

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

// Get team colors based on abbreviation
function getTeamColor(abbr: string): string {
  const teamColors: Record<string, string> = {
    NYY: "bg-blue-600",
    BOS: "bg-red-600",
    LAD: "bg-blue-500",
    SF: "bg-orange-500",
    // Add more team colors as needed
  }
  return teamColors[abbr] || "bg-slate-600"
}

export default function PlayerStatsTable({ 
  players, 
  teamAbbr, 
  className,
  showBestOdds = false,
  selectedSportsbook
}: PlayerStatsTableProps) {
  // Add detailed logging when component mounts
  React.useEffect(() => {
    console.log('[PLAYER STATS TABLE] Full player data:', players.map(player => ({
      name: player.name,
      position: player.position,
      teamAbbr: player.teamAbbr,
      all_odds: player.all_odds,
      // Log all available stats
      stats: Object.entries(player)
        .filter(([key]) => !['name', 'position', 'teamAbbr', 'all_odds'].includes(key))
        .reduce((acc, [key, value]) => ({
          ...acc,
          [key]: {
            line: value?.line,
            market: value?.market,
            odds: value?.odds,
            all_odds: player.all_odds?.[value?.line?.toString()]
          }
        }), {})
    })))
  }, [players])

  // Filter players by team abbreviation
  const teamPlayers = players.filter((p) => p.teamAbbr === teamAbbr)

  const formatHitRate = (rate: number) => {
    // Convert from 6000 to 60%
    const percentage = rate / 100
    return `${percentage}%`
  }

  const getHitRateColor = (rate: number) => {
    // Convert from 6000 to 60 for comparison
    const percentage = rate / 100
    if (percentage >= 60) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    if (percentage <= 40) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
  }

  const formatLine = (line: number) => line.toFixed(1)

  console.log(
    `[PLAYER STATS TABLE] Rendering ${teamAbbr} players:`,
    teamPlayers.map((p) => ({
      name: p.name,
      position: p.position,
      teamAbbr: p.teamAbbr,
      markets: Object.keys(p).filter((k) => !["name", "position", "teamAbbr"].includes(k)),
    })),
  )

  // Define stat categories with their display names and keys
  const statCategories = [
    {
      key: "hitting",
      label: "Hitting",
      stats: [
        { key: "hits", label: "Hits" },
        { key: "singles", label: "Singles" },
        { key: "doubles", label: "Doubles" },
        { key: "triples", label: "Triples" },
        { key: "homeruns", label: "Home Runs" },
        { key: "totalbases", label: "Total Bases" },
      ],
    },
    {
      key: "production",
      label: "Run Production",
      stats: [
        { key: "rbis", label: "RBIs" },
        { key: "hrr", label: "Hits + Runs + RBIs" },
      ],
    },
    {
      key: "discipline",
      label: "Plate Discipline",
      stats: [
        { key: "battingstrikeouts", label: "Batting Strikeouts" },
        { key: "battingwalks", label: "Batting Walks" },
      ],
    },
    {
      key: "pitching",
      label: "Pitching",
      stats: [
        { key: "strikeouts", label: "Strikeouts" },
        { key: "walks", label: "Walks" },
        { key: "outs", label: "Outs" },
        { key: "earnedruns", label: "Earned Runs" },
        { key: "pitcherwin", label: "Pitcher Win" },
      ],
    },
  ]

  // Helper function to get best odds from Redis data structure
  const getBestOdds = (player: PlayerStats, statKey: string) => {
    const stat = player[statKey]
    if (!stat || !stat.line) {
      console.log(`[PLAYER STATS TABLE] Missing stat or line for ${player.name} - ${statKey}:`, {
        stat,
        player
      })
      return null
    }

    // Get odds data from Redis cache
    const redisOdds = player.all_odds?.[stat.line.toString()]
    if (!redisOdds) {
      console.log(`[PLAYER STATS TABLE] No odds found for line ${stat.line}`, {
        player: player.name,
        statKey,
        line: stat.line,
        allOdds: player.all_odds,
        availableLines: player.all_odds ? Object.keys(player.all_odds) : []
      })
      return null
    }

    // Log the full odds data structure
    console.log(`[PLAYER STATS TABLE] Found odds data for ${player.name} - ${statKey}:`, {
      line: stat.line,
      redisOdds,
      availableSportsbooks: Object.keys(redisOdds)
    })

    // Find the best odds
    let bestOdds = -Infinity
    let bestSportsbook = ""
    let bestLink: string | null = null

    Object.entries(redisOdds).forEach(([book, data]) => {
      if (data.odds > bestOdds) {
        bestOdds = data.odds
        bestSportsbook = book
        bestLink = data.over_link || null
      }
    })

    if (bestOdds === -Infinity) {
      console.log(`[PLAYER STATS TABLE] No valid odds found in data for ${player.name} - ${statKey}`)
      return null
    }

    const result = {
      american: bestOdds,
      sportsbook: bestSportsbook,
      link: bestLink
    }

    console.log(`[PLAYER STATS TABLE] Best odds for ${player.name} - ${statKey}:`, result)
    return result
  }

  // Helper function to render players for a specific stat
  const renderPlayersForStat = (statKey: string, index: number) => {
    const playersWithStat = teamPlayers.filter((p) => p[statKey])

    if (playersWithStat.length === 0) return null

    return playersWithStat.map((player, playerIndex) => {
      const stat = player[statKey] as any
      const rowIndex = index * 100 + playerIndex // Create unique index for alternating colors

      // Get best odds for this player and stat
      const bestOdds = getBestOdds(player, statKey)

      // Log player data for debugging
      console.log(`[PLAYER STATS TABLE] Player data for ${player.name} - ${statKey}:`, {
        stat,
        bestOdds,
        market: stat.market || statKey,
        redisOdds: player.all_odds?.[stat.line?.toString()]
      })

      return (
        <TableRow
          key={`${player.name}-${statKey}-${playerIndex}`}
          className={cn(
            "transition-colors",
            rowIndex % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50 dark:bg-slate-900",
            "hover:bg-slate-100 dark:hover:bg-slate-800",
          )}
        >
          <TableCell className="font-medium py-3">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 relative flex-shrink-0" data-team-logo={player.teamAbbr}>
                <Image
                  src={`/images/mlb-teams/${getTeamLogoFilename(getStandardAbbreviation(player.teamAbbr))}.svg`}
                  alt={player.teamAbbr || "Team"}
                  width={16}
                  height={16}
                  className="object-contain w-full h-full p-0.5"
                  onError={() => {
                    const fallback = document.createElement("div")
                    fallback.className =
                      "w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded text-[8px] font-bold"
                    fallback.textContent = getStandardAbbreviation(player.teamAbbr)?.substring(0, 2) || "?"

                    const imgContainer = document.querySelector(`[data-team-logo="${player.teamAbbr}"]`)
                    if (imgContainer) {
                      imgContainer.innerHTML = ""
                      imgContainer.appendChild(fallback)
                    }
                  }}
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm">{player.name}</span>
                <Badge variant="outline" className="w-fit text-xs mt-1">
                  {player.position}
                </Badge>
              </div>
            </div>
          </TableCell>
          <TableCell className="text-center">
            <Badge variant="outline" className="font-mono">
              {formatLine(stat.line)}
            </Badge>
          </TableCell>
          <TableCell className="text-center font-mono">{formatLine(stat.playoffAvg)}</TableCell>
          <TableCell className="text-center">
            <div className="flex items-center justify-center">
              <div className={cn("px-2 py-1 rounded-md font-medium text-sm", getHitRateColor(stat.l10HitRate))}>
                {formatHitRate(stat.l10HitRate)}
              </div>
            </div>
          </TableCell>
          <TableCell className="text-center font-mono">{stat.l5vsOpp}</TableCell>
          <TableCell className="text-center">
            <DataDuelsOddsCell odds={bestOdds} />
          </TableCell>
        </TableRow>
      )
    })
  }

  // Get team name for display
  const getTeamName = (abbr: string) => {
    const teamNames: Record<string, string> = {
      NYY: "New York Yankees",
      BOS: "Boston Red Sox",
      LAD: "Los Angeles Dodgers",
      SF: "San Francisco Giants",
      // Add more team names as needed
    }
    return teamNames[abbr] || `${abbr} Team`
  }

  return (
    <Card className={cn("w-full overflow-hidden", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${getTeamColor(teamAbbr)}`} />
          {getTeamName(teamAbbr)}
          <Badge variant="outline" className="ml-auto">
            {teamPlayers.length} Players
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="hitting" className="w-full">
          <div className="px-6 pb-4">
            <TabsList className="grid w-full grid-cols-4">
              {statCategories.map((category) => (
                <TabsTrigger key={category.key} value={category.key} className="text-sm">
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {statCategories.map((category) => (
            <TabsContent key={category.key} value={category.key} className="mt-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Player</TableHead>
                      <TableHead className="font-semibold text-center">Line</TableHead>
                      <TableHead className="font-semibold text-center">2025 Avg</TableHead>
                      <TableHead className="font-semibold text-center">L10 Hit Rate</TableHead>
                      <TableHead className="font-semibold text-center">L5 vs Opp</TableHead>
                      <TableHead className="font-semibold text-center">Best Odds</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {category.stats.map((stat, statIndex) => {
                      const playersWithStat = teamPlayers.filter((p) => p[stat.key])

                      if (playersWithStat.length === 0) return null

                      return (
                        <React.Fragment key={stat.key}>
                          {/* Stat category header */}
                          <TableRow className="bg-muted/30 border-t-2">
                            <TableCell colSpan={6} className="font-semibold text-muted-foreground py-2">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                {stat.label}
                                <Badge variant="secondary" className="ml-auto text-xs">
                                  {playersWithStat.length}
                                </Badge>
                              </div>
                            </TableCell>
                          </TableRow>
                          {/* Players for this stat */}
                          {renderPlayersForStat(stat.key, statIndex)}
                        </React.Fragment>
                      )
                    })}

                    {/* Show message if no stats in this category */}
                    {category.stats.every((stat) => teamPlayers.filter((p) => p[stat.key]).length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No {category.label.toLowerCase()} data available for this team
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
