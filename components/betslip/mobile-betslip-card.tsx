"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Star, Clock, TrendingUp, ArrowRight, Loader2, Check, X, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { formatDistanceToNow, format } from "date-fns"
import { cn } from "@/lib/utils"
import { getTeamAbbreviation } from "@/lib/team-utils"
import { SPORT_MARKETS } from "@/lib/constants/markets"
import type { BetslipCardProps } from "@/types/betslip"

// Helper functions (same as desktop card)
const getMarketLabel = (marketKey: string, sport = "baseball_mlb"): string => {
  const markets = SPORT_MARKETS[sport] || SPORT_MARKETS["baseball_mlb"]
  const market = markets.find((m) => m.value === marketKey || m.apiKey === marketKey)
  return market?.label || marketKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
}

const formatSelectionDisplay = (selection: any): { mainText: string; subText: string; metaText: string; dkOdds: string | null } => {
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

  // Format DraftKings odds
  let dkOdds: string | null = null
  if (selection.odds_data?.draftkings?.odds) {
    const odds = selection.odds_data.draftkings.odds
    dkOdds = odds > 0 ? `+${odds}` : odds.toString()
  }

  return { mainText, subText, metaText, dkOdds }
}

export function MobileBetslipCard({
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
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card
        className={cn(
          "h-full transition-all duration-300 touch-manipulation border-0 shadow-lg hover:shadow-xl",
          isActive
            ? "bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950/30 dark:via-gray-900 dark:to-purple-950/30 ring-2 ring-blue-500 shadow-blue-500/25"
            : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800",
        )}
      >
        <CardHeader className="pb-4 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {isEditingTitle ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={handleKeyPress}
                    onBlur={handleTitleSubmit}
                    className="h-10 text-lg font-bold border-2"
                    maxLength={50}
                    autoFocus
                  />
                  <Button size="sm" variant="ghost" onClick={handleTitleSubmit} className="h-9 w-9 p-0">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleTitleCancel} className="h-9 w-9 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <CardTitle
                  className="text-lg font-bold cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate leading-tight"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {betslip.title || `Betslip ${index + 1}`}
                </CardTitle>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              {isActive && (
                <Badge className="text-xs bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-3 py-1.5 shadow-sm">
                  <div className="w-1.5 h-1.5 bg-white rounded-full mr-2 animate-pulse"></div>
                  Current
                </Badge>
              )}
              {betslip.is_default && <Star className="h-5 w-5 fill-amber-400 text-amber-400" />}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{formatDistanceToNow(new Date(betslip.updated_at), { addSuffix: true })}</span>
            </div>
            <Badge variant="outline" className="text-sm px-3 py-1.5 font-medium">
              {selectionCount} {selectionCount === 1 ? "pick" : "picks"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pb-6">
          {/* Selections Preview */}
          {selectionCount > 0 ? (
            <div className="space-y-3">
              {betslip.selections?.slice(0, 2).map((selection: any, idx: number) => {
                const {
                  mainText: selectionText,
                  subText: marketText,
                  metaText: gameInfo,
                  dkOdds,
                } = formatSelectionDisplay(selection)
                return (
                  <div
                    key={idx}
                    className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate mb-1 text-gray-900 dark:text-white">{selectionText}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{marketText}</p>
                        {gameInfo && <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{gameInfo}</p>}
                      </div>
                      {dkOdds && (
                        <div className="flex-shrink-0 ml-3">
                          <Badge variant="outline" className="font-mono">
                            {dkOdds}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {selectionCount > 2 && (
                <div className="text-xs text-center py-3 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/30 rounded-xl">
                  +{selectionCount - 2} more selections
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No selections yet</p>
              <Button variant="ghost" size="sm" asChild className="text-sm">
                <a href="/mlb/props">Browse Props</a>
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 pt-2">
            {isActive ? (
              <div className="flex items-center justify-center py-3 px-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-xl">
                <div className="w-2 h-2 bg-green-600 rounded-full mr-3 animate-pulse"></div>
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">Current Betslip</span>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-10 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 dark:hover:bg-blue-950/30 dark:hover:text-blue-400 dark:hover:border-blue-800 transition-all duration-200 border-2 bg-transparent"
                onClick={onView}
              >
                Make Current
              </Button>
            )}

            {selectionCount > 0 && (
              <Button
                size="sm"
                className="w-full h-10 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-green-500/25"
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
                  className="flex-1 text-xs h-9 border-2 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 dark:hover:bg-amber-950/30 dark:hover:text-amber-400 dark:hover:border-amber-800 bg-transparent"
                >
                  <Star className="h-3 w-3 mr-1" />
                  Default
                </Button>
              )}
              {selectionCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClear}
                  className={cn(
                    "text-xs h-9 border-2 hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:hover:bg-red-950/30 dark:hover:text-red-400 dark:hover:border-red-800",
                    betslip.is_default ? "flex-1" : "",
                  )}
                >
                  Clear
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 h-9 px-3"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
