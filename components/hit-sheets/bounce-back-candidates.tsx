"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import QuickHitTable from "./quick-hit-table"
import { BounceBackCandidate } from "./types"
import { formatOdds } from "@/lib/utils"
import OddsCell from "@/components/shared/odds-cell"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"
import { getTeamAbbreviation, getTeamLogoFilename, getStandardAbbreviation } from "@/lib/team-utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

interface BounceBackCandidatesProps {
  data: BounceBackCandidate[]
  onParamsChange: (params: { hitRate?: string; sampleSpan?: string }) => void
  params: {
    hitRate: string
    sampleSpan: string
  }
}

export default function BounceBackCandidates({ data, onParamsChange, params }: BounceBackCandidatesProps) {
  const [sortField, setSortField] = useState("out_hit_rate")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const isMobile = useMediaQuery("(max-width: 768px)")

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "desc" ? "asc" : "desc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const getSortIcon = (field: string) => {
    if (field !== sortField) return null
    return sortDirection === "desc" ? "↓" : "↑"
  }

  const sortData = (data: BounceBackCandidate[]) => {
    return [...data].sort((a, b) => {
      let result = 0
      switch (sortField) {
        case "out_hit_rate": {
          const hitRateA = typeof a.out_hit_rate === 'number' ? a.out_hit_rate : 0
          const hitRateB = typeof b.out_hit_rate === 'number' ? b.out_hit_rate : 0
          result = hitRateB - hitRateA
          break
        }
        case "out_line": {
          const lineA = typeof a.out_line === 'number' ? a.out_line : 0
          const lineB = typeof b.out_line === 'number' ? b.out_line : 0
          result = lineB - lineA
          break
        }
        case "out_player": {
          result = a.out_full_name.localeCompare(b.out_full_name)
          break
        }
        case "pre_slump_performance": {
          const aRate = a.out_pre_slump_hits / a.out_pre_slump_total
          const bRate = b.out_pre_slump_hits / b.out_pre_slump_total
          result = bRate - aRate
          break
        }
        default: {
          const defaultHitRateA = typeof a.out_hit_rate === 'number' ? a.out_hit_rate : 0
          const defaultHitRateB = typeof b.out_hit_rate === 'number' ? b.out_hit_rate : 0
          result = defaultHitRateB - defaultHitRateA
        }
      }
      return sortDirection === "asc" ? -result : result
    })
  }

  const handleHitRateChange = (value: string) => {
    onParamsChange({ hitRate: value })
  }

  const handleSampleSpanChange = (value: string) => {
    onParamsChange({ sampleSpan: value })
  }

  const columns = [
    {
      key: "out_player",
      title: "Player",
      width: isMobile ? "50%" : "20%",
      sortable: true,
      render: (value: any, row: BounceBackCandidate) => {
        const playerHeadshotUrl = `https://img.mlbstatic.com/mlb-photos/image/upload/w_240,q_auto:good,f_auto/v1/people/${row.out_player_id}/headshot/67/current`
        const teamAbbr = row.out_team_abbreviation

        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10 border-2 border-slate-200 shadow-sm overflow-hidden">
              <AvatarImage
                src={playerHeadshotUrl}
                alt={row.out_full_name}
                className="object-cover"
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
                    onError={(e) => {
                      const container = document.createElement("div")
                      container.className = "w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded text-[8px] font-bold"
                      container.textContent = teamAbbr?.substring(0, 2) || "??"
                      
                      const img = e.target as HTMLImageElement
                      if (img.parentElement) {
                        img.style.display = "none"
                        img.parentElement.appendChild(container)
                      }
                    }}
                  />
                </div>
                <span>{teamAbbr}</span>
              </div>
            </div>
          </div>
        )
      }
    },
    {
      key: "out_line",
      title: "Line",
      width: isMobile ? "50%" : "10%",
      sortable: true,
      className: "text-center",
      render: (value: any, row: BounceBackCandidate) => {
        const line = row.out_line
        if (typeof line !== 'number') return null
        return (
          <div className="text-center">
            <div className="px-1.5 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 rounded-md font-bold inline-block text-xs">
              {line.toFixed(1)}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{row.out_market}</div>
          </div>
        )
      },
    },
    {
      key: "out_hit_rate",
      title: "2025 Hit Rate",
      width: isMobile ? "50%" : "15%",
      sortable: true,
      className: "text-center",
      render: (value: any, row: BounceBackCandidate) => {
        const hitRate = row.out_hit_rate
        if (typeof hitRate !== 'number') return null
        return (
          <div
            className={cn(
              "flex items-center justify-center rounded-lg shadow-sm",
              hitRate >= 0.9 ? "bg-green-200 dark:bg-green-800/50 text-green-900 dark:text-green-200" :
              hitRate >= 0.8 ? "bg-green-100 dark:bg-green-800/40 text-green-800 dark:text-green-300" :
              hitRate >= 0.7 ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" :
              hitRate >= 0.6 ? "bg-green-50 dark:bg-green-900/25 text-green-700 dark:text-green-400" :
              "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
            )}
          >
            <div className="py-2 px-3 font-medium text-sm sm:text-base">
              {(hitRate * 100).toFixed(1)}%
            </div>
          </div>
        )
      },
    },
    {
      key: "pre_slump_performance",
      title: "Pre-Slump",
      width: isMobile ? "50%" : "20%",
      sortable: true,
      render: (value: any, row: BounceBackCandidate) => {
        const hitRate = row.out_pre_slump_hits / row.out_pre_slump_total
        return (
          <div className="text-sm">
            <span className="font-medium">{row.out_pre_slump_hits}/{row.out_pre_slump_total}</span>
            <span className="text-muted-foreground ml-1">
              ({(hitRate * 100).toFixed(1)}%)
            </span>
          </div>
        )
      },
    },
   
    {
      key: "out_matchup",
      title: "Next Game",
      width: isMobile ? "50%" : "15%",
      render: (value: any, row: BounceBackCandidate) => {
        if (!row.out_is_playing_today) {
          return <span className="text-xs text-muted-foreground">No Game Today</span>
        }

        const isHome = row.out_team_name === row.out_home_team_name
        const opponentTeam = isHome ? row.out_away_team_name : row.out_home_team_name
        const opponentAbbr = getTeamAbbreviation(opponentTeam)
        
        const gameTime = new Date(row.out_commence_time)
        const timeString = gameTime.toLocaleTimeString('en-US', { 
          hour: 'numeric',
          minute: '2-digit',
          hour12: true 
        })

        return (
          <div className="flex items-center justify-start pl-2">
            <div className="px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800">
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium">{isHome ? "vs" : "@"}</span>
                  <div className="w-5 h-5 relative flex-shrink-0">
                    <Image
                      src={`/images/mlb-teams/${getTeamLogoFilename(getStandardAbbreviation(opponentAbbr))}.svg`}
                      alt={opponentTeam}
                      width={20}
                      height={20}
                      className="object-contain w-full h-full p-0.5"
                      onError={(e) => {
                        const container = document.createElement("div")
                        container.className = "w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded text-[8px] font-bold"
                        container.textContent = opponentAbbr?.substring(0, 2) || "??"
                        
                        const img = e.target as HTMLImageElement
                        if (img.parentElement) {
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
      key: "out_odds",
      title: "Best Odds",
      width: isMobile ? "50%" : "10%",
      className: "text-center",
      render: (value: any, row: BounceBackCandidate) => {
        if (row.out_odds_json && Object.keys(row.out_odds_json).length > 0) {
          const sortedOdds = Object.entries(row.out_odds_json).sort(([, a], [, b]) => b.odds - a.odds)
          const [bestBook, bestOddsData] = sortedOdds[0]
          
          return (
            <div className="flex justify-center"><OddsCell
              odds={bestOddsData.odds}
              sportsbook={bestBook}
              market={row.out_market}
              line={row.out_line}
              customTier={null}
              allOdds={row.out_odds_json}
              directLink={bestOddsData.over_link}
              compact={true}
            /></div>
          )
        }
        return null
      },
    },
  ].filter(Boolean)

  const handleShare = (player: BounceBackCandidate) => {
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

    const shareText = `⚾️ ${player.out_full_name} (${player.out_team_abbreviation}) - Bounce Back Candidate\n` +
      `📊 Current Hit Rate: ${(player.out_hit_rate * 100).toFixed(1)}%\n` +
      `💫 Pre-Slump: ${player.out_pre_slump_hits}/${player.out_pre_slump_total} (${((player.out_pre_slump_hits / player.out_pre_slump_total) * 100).toFixed(1)}%)\n` +
      `🎯 Line: Over ${player.out_line.toFixed(1)}\n` +
      (bestOdds ? `💰 Best odds: ${formatOdds(bestOdds.odds)} (${bestOdds.book})\n` : "") +
      `🏟️ Today's game: ${player.out_away_team_name} @ ${player.out_home_team_name}\n` +
      "\nvia @oddsmash"

    navigator.clipboard.writeText(shareText)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 border-b border-slate-200 dark:border-slate-700 pb-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Find MLB players who are due for a bounce back based on their historical performance. 
          We analyze each player&apos;s pre-slump stats and current trends to identify those likely 
          to return to their previous form, helping you make more informed betting decisions.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Season Hit Rate Threshold</label>
            <Select value={params.hitRate} onValueChange={handleHitRateChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5">50%</SelectItem>
                <SelectItem value="0.6">60%</SelectItem>
                <SelectItem value="0.7">70%</SelectItem>
                <SelectItem value="0.8">80%</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Sample Size</label>
            <Select value={params.sampleSpan} onValueChange={handleSampleSpanChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_10">Last 10 Games</SelectItem>
                <SelectItem value="last_20">Last 20 Games</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <QuickHitTable
        data={sortData(data)}
        columns={columns}
        title="Bounce Back Candidates"
        subtitle="Players likely to return to their previous form"
        onSort={handleSort}
        sortField={sortField}
        sortDirection={sortDirection}
        onShare={handleShare}
      />
    </div>
  )
} 