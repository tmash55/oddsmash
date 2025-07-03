"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Info } from "lucide-react"

interface HitRateDisplayProps {
  hitRateData: any
}

export function HitRateDisplay({ hitRateData }: HitRateDisplayProps) {
  if (!hitRateData) return null

  return (
    <div className="flex items-center gap-2 mb-2">
      {/* Last 10 Games Hit Rate */}
      <Badge 
        variant="outline" 
        className={`text-xs px-2 py-1 ${
          hitRateData.last_10_hit_rate >= 70 
            ? 'bg-green-50 text-green-700 border-green-300 dark:bg-green-950/20 dark:text-green-400'
            : hitRateData.last_10_hit_rate >= 50
            ? 'bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950/20 dark:text-yellow-400'
            : 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/20 dark:text-red-400'
        }`}
      >
        🎯 L10: {hitRateData.last_10_hit_rate}%
      </Badge>
      
      {/* Season Hit Rate */}
      <Badge 
        variant="outline"
        className={`text-xs px-2 py-1 ${
          hitRateData.season_hit_rate >= 50
            ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/20 dark:text-blue-400'
            : 'bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-950/20 dark:text-gray-400'
        }`}
      >
        📊 Season: {hitRateData.season_hit_rate}%
      </Badge>
      
      {/* Average per game */}
      <Badge variant="outline" className="text-xs px-2 py-1 bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/20 dark:text-purple-400">
        📈 Avg: {hitRateData.avg_stat_per_game}
      </Badge>
      
      {/* Hit rate tooltip with more details */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="text-xs space-y-1">
            <div className="font-medium">{hitRateData.player_name} Hit Rates</div>
            <div>Last 5 games: {hitRateData.last_5_hit_rate}%</div>
            <div>Last 10 games: {hitRateData.last_10_hit_rate}%</div>
            <div>Last 20 games: {hitRateData.last_20_hit_rate}%</div>
            <div>Season ({hitRateData.season_games_count} games): {hitRateData.season_hit_rate}%</div>
            <div className="pt-1 border-t border-gray-200">
              <div>Line: {hitRateData.line}+ {hitRateData.market}</div>
              <div>Team: {hitRateData.team_abbreviation}</div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  )
} 