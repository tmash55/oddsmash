"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import QuickHitTable from "./quick-hit-table"
import { StrikeoutOverCandidate } from "./types"
import { Badge } from "@/components/ui/badge"
import { formatOdds } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Copy, Loader2 } from "lucide-react"
import { ReactNode } from "react"
import OddsCell from "@/components/shared/odds-cell"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getTeamAbbreviation, getTeamLogoFilename, getStandardAbbreviation } from "@/lib/team-utils"

interface StrikeoutOversProps {
  data: StrikeoutOverCandidate[]
}

export default function StrikeoutOvers({ data }: StrikeoutOversProps) {
  const [sortField, setSortField] = useState("out_hit_rate")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [isLoading, setIsLoading] = useState(false)

  // Add debug logging
  console.log("Initial data:", data)

  const handleSort = (field: string, direction: "asc" | "desc") => {
    setSortField(field)
    setSortDirection(direction)
  }

  const columns = [
    {
      key: "out_player",
      title: "Player",
      width: "30%",
      render: (value: any, row: StrikeoutOverCandidate) => {
        // Debug logging for player column
        console.log("Player row data:", {
          fullName: row.out_full_name,
          teamName: row.out_team_name,
          playerId: row.out_player_id
        })

        // Generate MLB headshot URL
        const playerHeadshotUrl = `https://img.mlbstatic.com/mlb-photos/image/upload/w_240,q_auto:good,f_auto/v1/people/${row.out_player_id}/headshot/67/current`

        // Debug logging for team abbreviation
        const teamAbbr = getTeamAbbreviation(row.out_team_name)
        console.log("Team abbreviation conversion:", {
          teamName: row.out_team_name,
          abbreviation: teamAbbr
        })

        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10 border-2 border-slate-200 shadow-sm">
              <AvatarImage
                src={playerHeadshotUrl}
                alt={row.out_full_name}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none"
                }}
              />
              <AvatarFallback className="bg-slate-200 text-slate-800">
                {row.out_full_name?.substring(0, 2) || "??"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="font-bold text-sm">{row.out_full_name}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="w-4 h-4 relative flex-shrink-0">
                  <Image
                    src={`/images/mlb-teams/${getTeamLogoFilename(getStandardAbbreviation(teamAbbr))}.svg`}
                    alt={row.out_team_name || "Team"}
                    width={16}
                    height={16}
                    className="object-contain w-full h-full p-0.5"
                    onError={() => {
                      // Use fallback text instead of trying PNG
                      const container = document.createElement("div")
                      container.className = "w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded text-[8px] font-bold"
                      container.textContent = teamAbbr?.substring(0, 2) || "??"
                      
                      const img = document.querySelector(`img[alt="${row.out_team_name || "Team"}"]`) as HTMLImageElement
                      if (img && img.parentElement) {
                        img.style.display = "none"
                        img.parentElement.appendChild(container)
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )
      }
    },
    {
      key: "out_matchup",
      title: "Next Game",
      width: "20%",
      render: (value: any, row: StrikeoutOverCandidate) => {
        const isHome = row.out_team_name === row.out_home_team
        const opponentTeam = isHome ? row.out_away_team : row.out_home_team

        // Debug logging for matchup
        console.log("Matchup data:", {
          isHome,
          teamName: row.out_team_name,
          homeTeam: row.out_home_team,
          awayTeam: row.out_away_team,
          opponentTeam
        })

        const opponentAbbr = getTeamAbbreviation(opponentTeam)
        console.log("Opponent abbreviation:", {
          opponentTeam,
          abbreviation: opponentAbbr
        })
        
        // Format the commence time
        const gameTime = new Date(row.out_commence_time)
        const timeString = gameTime.toLocaleTimeString('en-US', { 
          hour: 'numeric',
          minute: '2-digit',
          hour12: true 
        })

        return (
          <div className="flex items-center justify-center gap-2">
            <div className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800">
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium">{isHome ? "vs" : "@"}</span>
                  <div className="w-5 h-5 relative flex-shrink-0">
                    <Image
                      src={`/images/mlb-teams/${getTeamLogoFilename(getStandardAbbreviation(opponentAbbr))}.svg`}
                      alt={opponentTeam || "Team"}
                      width={20}
                      height={20}
                      className="object-contain w-full h-full p-0.5"
                      onError={() => {
                        // Use fallback text instead of trying PNG
                        const container = document.createElement("div")
                        container.className = "w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded text-[8px] font-bold"
                        container.textContent = opponentAbbr?.substring(0, 2) || "??"
                        
                        const img = document.querySelector(`img[alt="${opponentTeam || "Team"}"]`) as HTMLImageElement
                        if (img && img.parentElement) {
                          img.style.display = "none"
                          img.parentElement.appendChild(container)
                        }
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium">{opponentAbbr}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{timeString}</span>
              </div>
            </div>
          </div>
        )
      }
    },
    {
      key: "out_line",
      title: "Line",
      width: "15%",
      sortable: true,
      render: (value: any, row: StrikeoutOverCandidate) => {
        const line = row.out_line_used
        if (typeof line !== 'number' && typeof line !== 'string') return null
        const lineValue = typeof line === 'string' ? parseFloat(line) : line
        return (
          <Badge variant="secondary" className="font-bold whitespace-nowrap">
            {lineValue.toFixed(1)}
          </Badge>
        )
      },
    },
    {
      key: "out_hit_rate",
      title: "Hit Rate",
      width: "15%",
      sortable: true,
      render: (value: any, row: StrikeoutOverCandidate) => {
        const hitRate = row.out_hit_rate
        if (typeof hitRate !== 'number' && typeof hitRate !== 'string') return null
        const hitRateValue = typeof hitRate === 'string' ? parseFloat(hitRate) : hitRate
        return (
          <span className={cn(
            "font-medium",
            hitRateValue >= 0.9 ? "text-green-600 dark:text-green-400" :
            hitRateValue >= 0.8 ? "text-emerald-600 dark:text-emerald-400" :
            "text-slate-600 dark:text-slate-400"
          )}>
            {(hitRateValue * 100).toFixed(1)}%
          </span>
        )
      },
    },
    {
      key: "out_odds",
      title: "Best Odds",
      width: "15%",
      render: (value: any, row: StrikeoutOverCandidate) => {
        if (row.out_odds_json && Object.keys(row.out_odds_json).length > 0) {
          const sortedOdds = Object.entries(row.out_odds_json).sort(([, a], [, b]) => b.odds - a.odds)
          const [bestBook, bestOddsData] = sortedOdds[0]
          
          return (
            <OddsCell
              odds={bestOddsData.odds}
              sportsbook={bestBook}
              market={row.out_market}
              line={parseFloat(row.out_line_used)}
              customTier={null}
              allOdds={row.out_odds_json}
              directLink={bestOddsData.over_link}
              compact={true}
            />
          )
        }
        return null
      },
    },
  ]

  const handleShare = (player: StrikeoutOverCandidate) => {
    const bestOdds = player.out_odds_json
      ? Object.entries(player.out_odds_json).reduce(
          (best, [book, odds]) => {
            if (!best.odds || odds.odds > best.odds) {
              return { book, odds: odds.odds }
            }
            return best
          },
          { book: "", odds: 0 }
        )
      : null

    const shareText = `⚾️ ${player.out_full_name} (${getTeamAbbreviation(player.out_team_name)}) - Strikeout Over Candidate\n` +
      `📊 Hit Rate: ${(parseFloat(player.out_hit_rate) * 100).toFixed(1)}%\n` +
      `🎯 Line: Over ${parseFloat(player.out_line_used).toFixed(1)}\n` +
      (bestOdds ? `💰 Best odds: ${formatOdds(bestOdds.odds)} (${bestOdds.book})\n` : "") +
      `🏟️ Today's game: ${player.out_away_team} @ ${player.out_home_team}\n` +
      "\nvia @oddsmash"

    navigator.clipboard.writeText(shareText)
  }

  return (
    <div className="space-y-6">
      {/* Explanation section */}
      <div className="space-y-2 border-b border-slate-200 dark:border-slate-700 pb-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Find MLB pitchers with high strikeout line hit rates. We analyze each pitcher&apos;s recent performance 
          and identify those who consistently hit their strikeout totals, helping you make more informed betting decisions.
        </p>
      </div>

      <QuickHitTable
        data={data}
        columns={columns}
        title="Strikeout Over Candidates"
        subtitle="Players with high hit rates against their strikeout over line"
        onSort={handleSort}
        sortField={sortField}
        sortDirection={sortDirection}
        onShare={handleShare}
      />
    </div>
  )
}