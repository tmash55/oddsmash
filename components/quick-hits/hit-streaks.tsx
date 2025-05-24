"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import QuickHitTable from "./quick-hit-table"
import { HitStreakPlayer } from "./types"
import { Badge } from "@/components/ui/badge"
import { formatOdds } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Copy, Loader2 } from "lucide-react"
import { ReactNode } from "react"
import OddsCell from "@/components/shared/odds-cell"
import { cn } from "@/lib/utils"

interface HitStreaksProps {
  data: HitStreakPlayer[]
}

export default function HitStreaks({ data }: HitStreaksProps) {
  const [minStreak, setMinStreak] = useState(5)
  const [sortField, setSortField] = useState("streak_length")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [isLoading, setIsLoading] = useState(false)
  const [favorites, setFavorites] = useState<Record<number, boolean>>({})

  // Helper function to get streak badge color - now using a consistent color
  const getStreakBadgeColor = (streakLength: number): string => {
    return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
  }

  // Helper function to check if a player is likely injured
  const isLikelyInjured = (player: HitStreakPlayer): boolean => {
    const hasNoOdds = !player.hit_odds_json || Object.keys(player.hit_odds_json).length === 0
    const streakEndDate = new Date(player.streak_end)
    const fourDaysAgo = new Date()
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4)
    const isOldStreak = streakEndDate < fourDaysAgo
    return hasNoOdds && isOldStreak
  }

  const toggleFavorite = (playerId: number) => {
    setFavorites(prev => ({
      ...prev,
      [playerId]: !prev[playerId]
    }))
  }

  const handleMinStreakChange = (value: number) => {
    setIsLoading(true)
    setMinStreak(value)
    // Simulate loading state
    setTimeout(() => setIsLoading(false), 300)
  }

  const filteredData = data.filter((player) => {
    // Check for likely injured players
    if (isLikelyInjured(player)) return false
    
    // Check minimum streak
    if (player.streak_length < minStreak) return false

    return true
  })

  // Sort the filtered data
  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = a[sortField as keyof HitStreakPlayer]
    const bValue = b[sortField as keyof HitStreakPlayer]
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    
    return 0
  })

  const handleSort = (field: string, direction: "asc" | "desc") => {
    setSortField(field)
    setSortDirection(direction)
  }

  const columns = [
    {
      key: "player",
      title: "Player",
      width: "30%",
    },
    {
      key: "streak_length",
      title: "Streak",
      width: "15%",
      sortable: true,
      render: (value: number) => (
        <Badge variant="secondary" className={cn("font-bold whitespace-nowrap", getStreakBadgeColor(value))}>
          {value} Games
        </Badge>
      ),
    },
    {
      key: "total_home_runs",
      title: "HRs in Streak",
      width: "15%",
      sortable: true,
      render: (value: number) => (
        <span className={cn(
          "font-medium",
          value >= 3 ? "text-orange-600 dark:text-orange-400" :
          value >= 1 ? "text-amber-600 dark:text-amber-400" :
          "text-slate-600 dark:text-slate-400"
        )}>
          {value}
        </span>
      ),
    },
    {
      key: "matchup",
      title: "Next Game",
      width: "20%",
      className: "text-center",
    },
    {
      key: "odds",
      title: "Best Odds",
      width: "15%",
      render: (value: any, row: HitStreakPlayer) => {
        if (row.hit_odds_json && Object.keys(row.hit_odds_json).length > 0) {
          const sortedOdds = Object.entries(row.hit_odds_json).sort(([, a], [, b]) => b.odds - a.odds)
          const [bestBook, bestOddsData] = sortedOdds[0]
          
          return (
            <OddsCell
              odds={bestOddsData.odds}
              sportsbook={bestBook}
              market={row.market}
              line={row.line}
              customTier={null}
              allOdds={row.hit_odds_json}
              directLink={bestOddsData.link}
              compact={true}
            />
          )
        }
        return null
      },
    },
  ]

  const handleShare = (player: HitStreakPlayer) => {
    const bestOdds = player.hit_odds_json
      ? Object.entries(player.hit_odds_json).reduce(
          (best, [book, odds]) => {
            if (!best.odds || odds.odds > best.odds) {
              return { book, odds: odds.odds }
            }
            return best
          },
          { book: "", odds: 0 }
        )
      : null

    const shareText = `🔥 ${player.full_name} (${player.team_abbreviation}) is on a ${
      player.streak_length
    } game hitting streak!\n${
      player.total_home_runs > 0
        ? `💣 ${player.total_home_runs} HR${
            player.total_home_runs > 1 ? "s" : ""
          } during the streak\n`
        : ""
    }${
      bestOdds
        ? `📊 Best odds for a hit today: ${formatOdds(bestOdds.odds)} (${
            bestOdds.book
          })\n`
        : ""
    }${
      player.is_playing_today
        ? `⚾️ Today's game: ${player.away_team_name} @ ${player.home_team_name}\n`
        : ""
    }\nvia @oddsmash`

    navigator.clipboard.writeText(shareText)
  }

  return (
    <div className="space-y-6">
      {/* Explanation section */}
      <div className="space-y-2 border-b border-slate-200 dark:border-slate-700 pb-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Track active MLB hitting streaks and find the best odds for players to extend their streaks. 
          Our data shows players with streaks of 5 or more games who have a game scheduled today. 
          We automatically filter out players who are likely injured or haven&apos;t played in several days.
        </p>
      </div>

      {/* Filters section */}
      <div className="sticky top-0 z-10 bg-background pt-2 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-end gap-8">
          <div className="space-y-2 flex-1 max-w-xs">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="minStreak" className="text-sm font-medium">
                Min Streak Length
              </Label>
              <span className="text-sm text-muted-foreground">
                {minStreak} games
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Slider
                id="minStreak"
                value={[minStreak]}
                onValueChange={([value]) => handleMinStreakChange(value)}
                min={5}
                max={20}
                step={1}
                className="flex-1"
              />
            </div>
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Updating...</span>
            </div>
          )}
        </div>
      </div>

      <QuickHitTable
        data={sortedData}
        columns={columns}
        title="Active Hit Streaks"
        subtitle="Players with active hitting streaks and their upcoming games"
        onSort={handleSort}
        sortField={sortField}
        sortDirection={sortDirection}
        onShare={handleShare}
      />
    </div>
  )
} 