"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  BarChart3,
  Info,
  ExternalLink,
  Zap,
} from "lucide-react"

interface OddsComparisonDropdownProps {
  isExpanded: boolean
  hasAnyOdds: boolean
  hasMultipleBooks: boolean
  sortedOdds: any[]
  formatOddsClean: (odds: number | string) => string
  handlePlaceBet: (sportsbookId: string, selectionId?: string) => void
  selectionId: string
}

export function OddsComparisonDropdown({
  isExpanded,
  hasAnyOdds,
  hasMultipleBooks,
  sortedOdds,
  formatOddsClean,
  handlePlaceBet,
  selectionId,
}: OddsComparisonDropdownProps) {
  if (!isExpanded) return null

  if (!hasAnyOdds) {
    return (
      <div className="border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
        <div className="p-4 text-center">
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
            <Info className="h-4 w-4" />
            No live odds available for this selection
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
      <div className="p-4">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          {hasMultipleBooks ? 'Compare Odds Across Books' : 'Available Odds'}
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {sortedOdds.map((item, oddsIndex) => (
            <Tooltip key={item.sportsbookId}>
              <TooltipTrigger asChild>
                <div
                  className={`relative group cursor-pointer p-3 rounded-lg border transition-all duration-200 hover:scale-105 hover:shadow-md ${
                    oddsIndex === 0 && hasMultipleBooks
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 dark:from-green-950/30 dark:to-emerald-950/30 dark:border-green-700 shadow-sm'
                      : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 dark:from-gray-700 dark:to-gray-600 dark:border-gray-500 hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-600 dark:hover:to-gray-500'
                  }`}
                  onClick={() => handlePlaceBet(item.sportsbookId, selectionId)}
                >
                  {/* Quick Bet Overlay */}
                  {item.hasDeepLink && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center z-10 shadow-sm">
                      <Zap className="h-3 w-3 text-white" />
                    </div>
                  )}
                  
                  {/* Best Badge */}
                  {(item.isBest && hasMultipleBooks) && (
                    <div className="absolute -top-1 -left-1 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm z-10">
                      BEST
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-md shadow-sm flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-gray-600">
                      <img
                        src={item.info.logo || "/placeholder.svg"}
                        alt={item.info.name}
                        className="w-6 h-6 object-contain"
                      />
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatOddsClean(item.odds)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/5 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <div className="text-center">
                  <div className="font-medium">{item.info.name}</div>
                  {item.hasDeepLink && (
                    <div className="text-blue-300 flex items-center justify-center gap-1 mt-1">
                      <Zap className="h-3 w-3" />
                      Quick Bet Available
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        
        {/* Quick Actions */}
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePlaceBet(sortedOdds[0]?.sportsbookId, selectionId)}
              className="text-xs gap-1 border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ExternalLink className="h-3 w-3" />
              {hasMultipleBooks ? 'Bet Best Odds' : 'Place Bet'}
            </Button>
            {sortedOdds[0]?.hasDeepLink && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-700">
                <Zap className="h-3 w-3 mr-1" />
                One-Click Available
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 