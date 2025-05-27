"use client"

import type React from "react"
import { useState } from "react"
import { Share2, Star, ArrowUpDown, ArrowLeftRight } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { sportsbooks } from "@/data/sportsbooks"
import Image from "next/image"
import { HitOdds, HitOddsJson, HitStreakPlayer } from "./types"
import OddsCell from "@/components/shared/odds-cell"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"

// Map team abbreviations to handle special cases and variations
const teamAbbreviationMap: Record<string, string> = {
  // Arizona Diamondbacks variations
  ARI: "AZ", // Standard abbreviation maps to file name
  ARIZONA: "AZ",
  DIAMONDBACKS: "AZ",

  // Oakland Athletics variations
  AT: "OAK",

  // Keep other mappings as needed
  // 'SFG': 'SF'  // Example: If a file is named SF.svg but the abbreviation in data is SFG
}

// Function to get the correct file name for a team abbreviation
function getTeamLogoFilename(abbr: string): string {
  if (!abbr) return "default"

  const upperAbbr = abbr.toUpperCase()
  return teamAbbreviationMap[upperAbbr] || abbr
}

// Function to standardize team abbreviations for logo lookup
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

// Format American odds for display
const formatOdds = (odds: number): string => {
  // Handle NaN, undefined or null values
  if (odds === undefined || odds === null || isNaN(odds)) {
    return "-"
  }
  return odds > 0 ? `+${odds}` : odds.toString()
}

// Format the game time from ISO string to a readable format
const formatGameTime = (timeString?: string): string => {
  if (!timeString) return ""

  try {
    const date = new Date(timeString)
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  } catch (e) {
    return ""
  }
}

// Extend HitStreakPlayer to allow string indexing
interface ExtendedHitStreakPlayer extends HitStreakPlayer {
  [key: string]: any;
}

// Update getBestOdds function with proper types
const getBestOdds = (oddsJson: HitOddsJson | undefined) => {
  if (!oddsJson || Object.keys(oddsJson).length === 0) {
    return { odds: 0, sportsbook: "", link: undefined as string | undefined }
  }

  let bestOdds = Number.NEGATIVE_INFINITY
  let bestSportsbook = ""
  let bestLink: string | undefined = undefined

  Object.entries(oddsJson).forEach(([book, data]) => {
    const odds = data.odds ? Number(data.odds) : Number.NEGATIVE_INFINITY

    // For positive odds, higher is better
    // For negative odds, closer to zero is better
    if ((odds > 0 && odds > bestOdds) || (odds < 0 && odds > bestOdds)) {
      bestOdds = odds
      bestSportsbook = book
      bestLink = data.over_link
    }
  })

  return { odds: bestOdds, sportsbook: bestSportsbook, link: bestLink }
}

// Define column configuration type
export type QuickHitColumn = {
  key: string
  title: string
  width?: string
  sortable?: boolean
  className?: string
  render?: (value: any, row: any) => React.ReactNode
}

// Update the props interface to be generic
export interface QuickHitTableProps<T> {
  data: T[]
  columns: QuickHitColumn[]
  title: string
  subtitle?: string
  onSort?: (field: string, direction: "asc" | "desc") => void
  sortField?: string
  sortDirection?: "asc" | "desc"
  onShare?: (item: T) => void
}

export default function QuickHitTable<T extends Record<string, any>>({
  data,
  columns,
  title,
  subtitle,
  onSort,
  sortField = "",
  sortDirection = "desc",
  onShare,
}: QuickHitTableProps<T>) {
  const [favorites, setFavorites] = useState<Record<number, boolean>>({})
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Helper function to split name
  const splitName = (fullName: string) => {
    const parts = fullName.split(' ')
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' ')
    }
  }

  // Toggle favorite status for a player
  const toggleFavorite = (playerId: number) => {
    setFavorites((prev) => ({
      ...prev,
      [playerId]: !prev[playerId],
    }))
  }

  // Modified handle sort to call the parent's onSort function if provided
  const handleSort = (field: string) => {
    if (onSort) {
      const newDirection = sortField === field && sortDirection === "desc" ? "asc" : "desc"
      onSort(field, newDirection)
    }
  }

  // Determine which columns to show based on screen size
  const visibleColumns = isMobile
    ? columns.filter(col => !["total_home_runs", "matchup"].includes(col.key))
    : columns

  // Get matchup info
  const getMatchupInfo = (row: T) => {
    const isHome = row.team_name === row.home_team_name
    const opponent = isHome ? row.away_team_name : row.home_team_name
    const opponentAbbr = getTeamAbbreviation(opponent || "")

    return {
      opponent: opponentAbbr,
      isHome,
      time: formatGameTime(row.commence_time),
    }
  }

  return (
    <div className="w-full overflow-auto rounded-xl border shadow-sm">
      <div className="bg-slate-50 dark:bg-slate-900 p-3 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <Table>
        <TableHeader className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-20">
          <TableRow className="hover:bg-transparent border-b border-slate-200 dark:border-slate-700">
            {visibleColumns.map((column) => (
              <TableHead 
                key={column.key} 
                className={cn(
                  "py-2 first:pl-4 last:pr-4",
                  column.width ? `w-[${column.width}]` : "",
                  column.className
                )}
              >
                {column.sortable ? (
                  <Button variant="ghost" className="p-0 font-semibold text-sm -ml-2" onClick={() => handleSort(column.key)}>
                    {column.title}
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                ) : (
                  <span className="font-semibold text-sm">{column.title}</span>
                )}
              </TableHead>
            ))}
            {/* Actions column */}
            <TableHead className="text-center w-[60px] py-2">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => {
            const isFavorite = !!favorites[row.player_id]

            return (
              <TableRow
                key={row.player_id || index}
                className={cn(
                  "transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50",
                  "data-[state=selected]:bg-slate-100 dark:data-[state=selected]:bg-slate-800"
                )}
              >
                {visibleColumns.map((column) => {
                  if (column.key === "player") {
                    const { firstName, lastName } = splitName(row.full_name)
                    return (
                      <TableCell key={column.key} className="font-medium py-3 pl-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-slate-200 shadow-sm overflow-hidden">
                            <AvatarImage
                              src={`https://img.mlbstatic.com/mlb-photos/image/upload/w_240,q_auto:good,f_auto/v1/people/${row.player_id}/headshot/67/current`}
                              alt={row.full_name}
                              className="object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none"
                              }}
                            />
                            <AvatarFallback className="bg-slate-200 text-slate-800">
                              {row.full_name.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            {isMobile ? (
                              <>
                                <div className="font-bold text-sm leading-tight">{firstName}</div>
                                <div className="font-bold text-sm leading-tight text-muted-foreground">{lastName}</div>
                              </>
                            ) : (
                              <div className="font-bold text-sm truncate">{row.full_name}</div>
                            )}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <div className="w-4 h-4 relative flex-shrink-0">
                                <Image
                                  src={`/images/mlb-teams/${getTeamLogoFilename(getStandardAbbreviation(row.team_abbreviation))}.svg`}
                                  alt={row.team_abbreviation || "Team"}
                                  width={16}
                                  height={16}
                                  className="object-contain w-full h-full p-0.5"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = `/images/mlb-teams/${getTeamLogoFilename(getStandardAbbreviation(row.team_abbreviation))}.png`
                                    ;(e.target as HTMLImageElement).onerror = () => {
                                      (e.target as HTMLImageElement).style.display = "none"
                                      const parent = (e.target as HTMLImageElement).parentNode as HTMLElement
                                      if (parent) {
                                        const fallback = document.createElement("div")
                                        fallback.className = "w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded text-[8px] font-bold"
                                        fallback.textContent = getStandardAbbreviation(row.team_abbreviation)?.substring(0, 2) || "?"
                                        parent.appendChild(fallback)
                                      }
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    )
                  }

                  // Special handling for matchup column
                  if (column.key === "matchup") {
                    const gameInfo = getMatchupInfo(row)
                    return (
                      <TableCell key={column.key} className="font-medium p-1 text-center">
                        {row.is_playing_today ? (
                          <div className="inline-flex flex-col items-center px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800/50">
                            <div className="flex items-center gap-1.5">
                              {gameInfo.isHome ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-medium">vs</span>
                                  <div className="w-5 h-5 relative flex-shrink-0">
                                    <Image
                                      src={`/images/mlb-teams/${getTeamLogoFilename(getStandardAbbreviation(gameInfo.opponent))}.svg`}
                                      alt={gameInfo.opponent}
                                      width={20}
                                      height={20}
                                      className="object-contain w-full h-full p-0.5"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = `/images/mlb-teams/${getTeamLogoFilename(getStandardAbbreviation(gameInfo.opponent))}.png`
                                        ;(e.target as HTMLImageElement).onerror = () => {
                                          (e.target as HTMLImageElement).style.display = "none"
                                          const parent = (e.target as HTMLImageElement).parentNode as HTMLElement
                                          if (parent) {
                                            const fallback = document.createElement("div")
                                            fallback.className = "w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded text-[8px] font-bold"
                                            fallback.textContent = getStandardAbbreviation(gameInfo.opponent)?.substring(0, 2) || "?"
                                            parent.appendChild(fallback)
                                          }
                                        }
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium">{gameInfo.opponent}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-medium">@</span>
                                  <div className="w-5 h-5 relative flex-shrink-0">
                                    <Image
                                      src={`/images/mlb-teams/${getTeamLogoFilename(getStandardAbbreviation(gameInfo.opponent))}.svg`}
                                      alt={gameInfo.opponent}
                                      width={20}
                                      height={20}
                                      className="object-contain w-full h-full p-0.5"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = `/images/mlb-teams/${getTeamLogoFilename(getStandardAbbreviation(gameInfo.opponent))}.png`
                                        ;(e.target as HTMLImageElement).onerror = () => {
                                          (e.target as HTMLImageElement).style.display = "none"
                                          const parent = (e.target as HTMLImageElement).parentNode as HTMLElement
                                          if (parent) {
                                            const fallback = document.createElement("div")
                                            fallback.className = "w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded text-[8px] font-bold"
                                            fallback.textContent = getStandardAbbreviation(gameInfo.opponent)?.substring(0, 2) || "?"
                                            parent.appendChild(fallback)
                                          }
                                        }
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium">{gameInfo.opponent}</span>
                                </div>
                              )}
                            </div>
                            {gameInfo.time && (
                              <div className="text-[10px] text-muted-foreground mt-1">{gameInfo.time}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No Game Today</span>
                        )}
                      </TableCell>
                    )
                  }

                  // Special handling for odds column
                  if (column.key === "odds") {
                    const { odds, sportsbook, link } = getBestOdds(row.hit_odds_json || {})
                    
                    return (
                      <TableCell key={column.key} className="p-1">
                        {row.hit_odds_json && Object.keys(row.hit_odds_json).length > 0 ? (
                          <OddsCell
                            odds={odds}
                            sportsbook={sportsbook}
                            market={row.market || ""}
                            line={typeof row.line === 'number' ? row.line : undefined}
                            customTier={null}
                            allOdds={row.hit_odds_json}
                            directLink={link}
                          />
                        ) : null}
                      </TableCell>
                    )
                  }

                  // Use custom render function if provided
                  if (column.render) {
                    return (
                      <TableCell key={column.key} className="p-2">
                        {column.render(row[column.key], row)}
                      </TableCell>
                    )
                  }

                  // Default rendering for other columns
                  return (
                    <TableCell key={column.key} className="p-2">
                      {row[column.key]}
                    </TableCell>
                  )
                })}

                {/* Actions column */}
                <TableCell className="p-1 pr-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-40 hover:opacity-100"
                      onClick={() => toggleFavorite(row.player_id)}
                    >
                      <Star className={cn(
                        "h-4 w-4",
                        isFavorite ? "fill-yellow-400 text-yellow-400" : "text-slate-600"
                      )} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-40 hover:opacity-100"
                      onClick={() => onShare?.(row)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
} 