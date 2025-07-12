"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Star, Clock, TrendingUp, ArrowRight, Loader2, Check, X, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatDistanceToNow, format } from "date-fns"
import { cn } from "@/lib/utils"
import { getTeamAbbreviation } from "@/lib/team-utils"
import { SPORT_MARKETS } from "@/lib/constants/markets"
import type { BetslipCardProps } from "@/types/betslip"

// Helper functions
const getMarketLabel = (marketKey: string, sport = "baseball_mlb"): string => {
  const markets = SPORT_MARKETS[sport] || SPORT_MARKETS["baseball_mlb"]
  const market = markets.find((m) => m.value === marketKey || m.apiKey === marketKey)
  return market?.label || marketKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
}

const formatSelectionDisplay = (selection: any): { mainText: string; subText: string; metaText: string } => {
  const mainText = selection.player_name || selection.selection || "Unknown Selection"
  const line = selection.line ? Math.ceil(selection.line) : null
  let subText = selection.market_display || getMarketLabel(selection.market_key || selection.market)
  if (line !== null) {
    subText = `${line}+ ${subText}`
  }
  const awayAbbr = getTeamAbbreviation(selection.away_team)
  const homeAbbr = getTeamAbbreviation(selection.home_team)
  const matchup = awayAbbr && homeAbbr ? `${awayAbbr} @ ${homeAbbr}` : ""
  const gameTime = selection.commence_time ? format(new Date(selection.commence_time), "M/d, h:mm a") : ""
  const metaText = [matchup, gameTime].filter(Boolean).join(" • ")
  return { mainText, subText, metaText }
}

export function BetslipCard({
  betslip,
  index,
  isActive,
  onView,
  onDelete,
  onSetDefault,
  onClear,
  onCompareOdds,
  onInlineRename,
  canDelete,
  calculateOdds,
  calculatePayout,
  isComparing,
}: BetslipCardProps) {
  const selectionCount = betslip.selections?.length || 0
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState(betslip.title || `Betslip ${index + 1}`)

  const handleTitleSubmit = () => {
    onInlineRename(editTitle)
    setIsEditingTitle(false)
  }

  const handleTitleCancel = () => {
    setEditTitle(betslip.title || `Betslip ${index + 1}`)
    setIsEditingTitle(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSubmit()
    } else if (e.key === "Escape") {
      handleTitleCancel()
    }
  }

  return (
    <motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ duration: 0.2 }}>
      <TooltipProvider>
        <Card
          className={cn(
            "h-fit transition-all duration-300 border-0 shadow-lg hover:shadow-xl",
            isActive
              ? "bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950/30 dark:via-gray-900 dark:to-purple-950/30 ring-2 ring-blue-500 shadow-blue-500/25"
              : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800",
          )}
        >
          <CardHeader className="pb-4">
            <div className="space-y-3">
              {/* Title Row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {isEditingTitle ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={handleKeyPress}
                        onBlur={handleTitleSubmit}
                        className="h-9 text-xl font-bold border-2"
                        maxLength={50}
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleTitleSubmit}
                        className="h-9 w-9 p-0 flex-shrink-0"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleTitleCancel}
                        className="h-9 w-9 p-0 flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <CardTitle
                      className="text-xl font-bold cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors leading-tight"
                      onClick={() => setIsEditingTitle(true)}
                      title={betslip.title || `Betslip ${index + 1}`}
                    >
                      {betslip.title || `Betslip ${index + 1}`}
                    </CardTitle>
                  )}
                </div>

                {/* Status Indicators */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {betslip.is_default && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                          <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Default betslip</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {isActive && (
                    <Badge className="text-xs bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-sm px-3 py-1.5">
                      <div className="w-1.5 h-1.5 bg-white rounded-full mr-2 animate-pulse"></div>
                      Current
                    </Badge>
                  )}
                </div>
              </div>

              {/* Metadata Row */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>Updated {formatDistanceToNow(new Date(betslip.updated_at), { addSuffix: true })}</span>
                </div>

                <Badge
                  variant="outline"
                  className="text-sm font-semibold px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                >
                  {selectionCount} {selectionCount === 1 ? "pick" : "picks"}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Selections Preview */}
            {selectionCount > 0 ? (
              <div className="space-y-3">
                {betslip.selections?.slice(0, 3).map((selection: any, idx: number) => {
                  const {
                    mainText: selectionText,
                    subText: marketText,
                    metaText: gameInfo,
                  } = formatSelectionDisplay(selection)
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-xl p-3 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate text-gray-900 dark:text-white">{selectionText}</p>
                        <p className="text-gray-600 dark:text-gray-400 text-xs truncate">{marketText}</p>
                        {gameInfo && <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{gameInfo}</p>}
                      </div>
                    </div>
                  )
                })}

                {selectionCount > 3 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-3 bg-gray-50 dark:bg-gray-800/30 rounded-xl">
                    +{selectionCount - 3} more selections
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10">
                <TrendingUp className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No selections yet</p>
                <Button variant="ghost" size="sm" asChild className="text-sm">
                  <a href="/mlb/props">Browse Props</a>
                </Button>
              </div>
            )}

            <Separator />

            {/* Actions */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {isActive ? (
                  <div className="flex-1 flex items-center justify-center py-3 px-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-xl">
                    <div className="w-2 h-2 bg-green-600 rounded-full mr-3 animate-pulse"></div>
                    <span className="text-sm font-semibold text-green-700 dark:text-green-400">Current Betslip</span>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 dark:hover:bg-blue-950/30 dark:hover:text-blue-400 dark:hover:border-blue-800 transition-all duration-200 border-2 bg-transparent"
                    onClick={onView}
                  >
                    Make Current
                  </Button>
                )}
              </div>

              {selectionCount > 0 && (
                <Button
                  variant="default"
                  size="sm"
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-green-500/25"
                  onClick={onCompareOdds}
                  disabled={isComparing}
                >
                  {isComparing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Comparing...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Compare Odds
                    </>
                  )}
                </Button>
              )}

              <div className="flex items-center gap-3">
                {!betslip.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onSetDefault}
                    className="flex-1 text-xs border-2 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 dark:hover:bg-amber-950/30 dark:hover:text-amber-400 dark:hover:border-amber-800 bg-transparent"
                  >
                    <Star className="h-3 w-3 mr-1" />
                    Set Default
                  </Button>
                )}
                {selectionCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClear}
                    className={cn(
                      "text-xs border-2 hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:hover:bg-red-950/30 dark:hover:text-red-400 dark:hover:border-red-800",
                      betslip.is_default ? "flex-1" : "",
                    )}
                  >
                    Clear All
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>
    </motion.div>
  )
}
