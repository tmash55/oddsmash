"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Star, Clock, TrendingUp, ArrowRight, Loader2, Check, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { formatDistanceToNow, format } from "date-fns"
import { cn } from "@/lib/utils"
import { getTeamAbbreviation } from "@/lib/team-utils"
import { SPORT_MARKETS } from "@/lib/constants/markets"
import { getMarketsForSport } from "@/lib/constants/markets"
import type { BetslipCardProps } from "@/types/betslip"
import Image from "next/image"
import { sportsbooks } from "@/data/sportsbooks"
import { useBetslip } from "@/contexts/betslip-context"


// Helper functions
const getMarketLabel = (marketKey: string, sport = "baseball_mlb"): string => {
  // Handle comma-separated market keys by taking the first part (base market)
  const baseMarketKey = marketKey.split(',')[0].trim()
  
  // Get markets for the specific sport
  const markets = getMarketsForSport(sport)
  
  // Find market config using the base market key - try multiple approaches
  let marketConfig = markets.find(m => m.apiKey === baseMarketKey)
  
  // If not found by apiKey, try by value (in case marketKey is actually a value)
  if (!marketConfig) {
    marketConfig = markets.find(m => m.value === baseMarketKey)
  }
  
  // If not found, try by label (in case marketKey is actually a label)
  if (!marketConfig) {
    marketConfig = markets.find(m => m.label === baseMarketKey)
  }
  
  // Return the proper label, or fallback to formatted base market key
  return marketConfig?.label || baseMarketKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
}

// Helper function to check if a string looks like an API key (contains underscores)
const isApiKey = (str: string): boolean => {
  return str.includes('_') && !str.includes(' ')
}

const formatSelectionDisplay = (
  selection: any,
): { mainText: string; subText: string; metaText: string; odds: string; sportsbook: string; logo: string } => {
  const mainText = selection.player_name || selection.selection || "Unknown Selection"
  const line = selection.line
  
  // Use the selection's sport key for accurate market lookup, fallback to baseball_mlb
  const sportKey = selection.sport_key || "baseball_mlb"
  
  // Always use getMarketLabel to ensure proper display, even if market_display exists
  // because market_display might contain API keys instead of proper labels
  const marketToUse = selection.market_key || selection.market || selection.market_display || ""
  let subText = getMarketLabel(marketToUse, sportKey)
  
  // Handle over/under display
  if (line !== null) {
    const isUnder = selection.selection?.toLowerCase() === "under"
    if (isUnder) {
      subText = `U ${line} ${subText}` // Exact line for unders
    } else {
      const roundedLine = Math.ceil(line)
      subText = `${roundedLine}+ ${subText}` // Rounded up for overs
    }
  }
  
  const awayAbbr = getTeamAbbreviation(selection.away_team)
  const homeAbbr = getTeamAbbreviation(selection.home_team)
  const matchup = awayAbbr && homeAbbr ? `${awayAbbr} @ ${homeAbbr}` : ""
  const gameTime = selection.commence_time ? format(new Date(selection.commence_time), "M/d, h:mm a") : ""
  const metaText = [matchup, gameTime].filter(Boolean).join(", ")

  // Handle best odds display across all sportsbooks
  let odds = "N/A"
  let sportsbook = ""
  let logo = ""
  
  if (selection.odds_data) {
    try {
      const oddsData = typeof selection.odds_data === "string" ? JSON.parse(selection.odds_data) : selection.odds_data
      const isOver = selection.selection?.toLowerCase().includes("over")
      
      let bestOdds = -Infinity
      let bestSportsbook = ""
      let bestLogo = ""

      // Iterate through all sportsbooks to find the best odds
      Object.entries(oddsData).forEach(([sportsbookKey, bookOdds]: [string, any]) => {
        if (!bookOdds) return

        let currentOdds: number | null = null

        // Handle new format (with over/under structure)
        if (bookOdds.over || bookOdds.under) {
          const relevantOdds = isOver ? bookOdds.over?.price : bookOdds.under?.price
          if (relevantOdds !== undefined) {
            currentOdds = relevantOdds
          }
        }
        // Handle old format (with direct odds field)
        else if (bookOdds.odds !== undefined) {
          currentOdds = bookOdds.odds
        }

        // Compare odds (higher is better)
        if (currentOdds !== null && currentOdds > bestOdds) {
          bestOdds = currentOdds
          bestSportsbook = sportsbookKey
          
          // Find the sportsbook logo
          const sportsbookData = sportsbooks.find((book) => 
            book.id === sportsbookKey || 
            book.name.toLowerCase().replace(/\s+/g, '') === sportsbookKey.toLowerCase().replace(/\s+/g, '')
          )
          bestLogo = sportsbookData?.logo || ""
        }
      })

      if (bestOdds !== -Infinity && bestSportsbook) {
        odds = bestOdds > 0 ? `+${bestOdds}` : `${bestOdds}`
        sportsbook = bestSportsbook
        logo = bestLogo
      }
    } catch (e) {
      console.error("Error parsing odds data:", e)
    }
  }

  return {
    mainText,
    subText,
    metaText,
    odds,
    sportsbook,
    logo,
  }
}

const BetslipSelection = ({ selection, betslipId }: { selection: any; betslipId: string }) => {
  const { mainText, subText, metaText, odds, sportsbook, logo } = formatSelectionDisplay(selection)
  const { removeSelection } = useBetslip()
  
  return (
    <div className="relative bg-slate-800/50 dark:bg-slate-800/80 rounded-2xl border border-slate-700/50 dark:border-slate-600 p-4 transition-all duration-200 hover:bg-slate-700/50">
      {/* Remove button - top right corner */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-3 right-3 h-6 w-6 p-0 hover:text-red-400 hover:bg-red-500/20 rounded-lg text-slate-400"
        onClick={() => removeSelection(selection.id, betslipId)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <div className="flex flex-col gap-2 pr-8">
        {/* Main content */}
        <div className="space-y-1">
          {/* Player name */}
          <div className="font-bold text-base text-white leading-tight">{mainText}</div>

          {/* Market info */}
          <div className="text-sm font-medium text-slate-300">{subText}</div>

          {/* Game info */}
          <div className="text-xs text-slate-400">{metaText}</div>
        </div>

        {/* Odds display - right aligned */}
        {odds !== "N/A" && logo && (
          <div className="flex items-center gap-2 bg-slate-700/50 dark:bg-slate-700/80 rounded-xl px-3 py-2 border border-slate-600/50 self-start mt-1">
            <div className="w-4 h-4 relative flex-shrink-0">
              <Image src={logo || "/placeholder.svg"} alt={sportsbook} fill className="object-contain" />
            </div>
            <Badge
              variant="outline"
              className={cn(
                "font-mono text-sm font-bold border-0",
                odds.startsWith("+") ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400",
              )}
            >
              {odds}
            </Badge>
          </div>
        )}
      </div>
    </div>
  )
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
  const { removeSelection } = useBetslip()
  const selectionCount = betslip.selections?.length || 0
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState(betslip.title || `Betslip ${index + 1}`)
  const [isExpanded, setIsExpanded] = useState(false)

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
          "h-full transition-all duration-300 touch-manipulation border-0 shadow-lg hover:shadow-xl rounded-3xl overflow-hidden",
          isActive
            ? "bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950/30 dark:via-slate-900 dark:to-purple-950/30 ring-2 ring-blue-500 shadow-blue-500/25"
            : "bg-white/95 dark:bg-slate-900/95 hover:bg-slate-50 dark:hover:bg-slate-800 backdrop-blur-sm",
        )}
      >
        <CardHeader className="pb-4 space-y-4 px-6 pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {isEditingTitle ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={handleKeyPress}
                    onBlur={handleTitleSubmit}
                    className="h-11 text-lg font-bold border-2 rounded-xl"
                    maxLength={50}
                    autoFocus
                  />
                  <Button size="sm" variant="ghost" onClick={handleTitleSubmit} className="h-10 w-10 p-0 rounded-xl">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleTitleCancel} className="h-10 w-10 p-0 rounded-xl">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <CardTitle
                  className="text-xl font-bold cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate leading-tight"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {betslip.title || `Betslip ${index + 1}`}
                </CardTitle>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              {isActive && (
                <Badge className="text-xs bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 px-3 py-1.5 shadow-sm rounded-xl">
                  <div className="w-1.5 h-1.5 bg-white rounded-full mr-2 animate-pulse"></div>
                  Current
                </Badge>
              )}
              {betslip.is_default && <Star className="h-5 w-5 fill-amber-400 text-amber-400" />}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{formatDistanceToNow(new Date(betslip.updated_at), { addSuffix: true })}</span>
            </div>
            <Badge
              variant="outline"
              className="text-sm px-3 py-1.5 font-medium bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
            >
              {selectionCount} {selectionCount === 1 ? "pick" : "picks"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pb-6 px-6">
          {/* Selections Preview */}
          {selectionCount > 0 ? (
            <div className="space-y-3">
              {/* Show first 3 selections or all if expanded */}
              {(isExpanded ? betslip.selections : betslip.selections?.slice(0, 3))?.map((selection: any, idx: number) => (
                <BetslipSelection key={selection.id} selection={selection} betslipId={betslip.id} />
              ))}

              {/* View All / Show Less button */}
              {selectionCount > 3 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-full text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 py-3 px-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors flex items-center justify-center gap-1"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      View All ({selectionCount})
                    </>
                  )}
                </button>
              )}

              {/* Show count if not expanded and more selections */}
              {!isExpanded && selectionCount > 3 && (
                <div className="text-xs text-center py-4 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-700">
                  +{selectionCount - 3} more selections
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 font-medium">No selections yet</p>
              <Button variant="ghost" size="sm" asChild className="text-sm rounded-xl">
                <a href="/mlb/props">Browse Props</a>
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 pt-2">
            {isActive ? (
              <div className="flex items-center justify-center py-4 px-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
                <div className="w-2 h-2 bg-emerald-600 rounded-full mr-3 animate-pulse"></div>
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Current Betslip</span>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-11 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 dark:hover:bg-blue-950/30 dark:hover:text-blue-400 dark:hover:border-blue-800 transition-all duration-200 border-2 bg-transparent rounded-2xl font-semibold"
                onClick={onView}
              >
                Make Current
              </Button>
            )}

            {selectionCount > 0 && (
              <Button
                size="sm"
                className="w-full h-11 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold shadow-lg shadow-emerald-500/25 rounded-2xl"
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
                  className="flex-1 text-xs h-10 border-2 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 dark:hover:bg-amber-950/30 dark:hover:text-amber-400 dark:hover:border-amber-800 bg-transparent rounded-xl font-medium"
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
                    "text-xs h-10 border-2 hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:hover:bg-red-950/30 dark:hover:text-red-400 dark:hover:border-red-800 rounded-xl font-medium",
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
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 h-10 px-3 rounded-xl"
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
