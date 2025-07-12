"use client"

import { useBetslip } from "@/contexts/betslip-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Icons } from "@/components/shared/icons"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { cn, capitalizeMarket } from "@/lib/utils"
import { sportsbooks } from "@/data/sportsbooks"
import { SPORT_MARKETS } from "@/lib/constants/markets"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Zap } from "lucide-react"
import { useState } from "react"

interface BetslipSelectionProps {
  selection: {
    id: string;
    event_id: string;
    sport_key: string;
    market_key: string;
    market_display?: string;
    selection: string;
    player_name?: string;
    line?: number;
    commence_time: string;
    home_team: string;
    away_team: string;
    odds_data: Record<string, {
      odds: number;
      line?: number;
      link?: string;
      last_update: string;
    }>;
  }
}

export function BetslipSelection({ selection }: BetslipSelectionProps) {
  const { removeSelection } = useBetslip()
  const [showOddsComparison, setShowOddsComparison] = useState(false)

  // Find best odds from available books
  const bestOdds = Object.entries(selection.odds_data).reduce(
    (best, [book, data]) => {
      if (!best || data.odds > best.odds) {
        return { book, ...data }
      }
      return best
    },
    null as (null | { book: string; odds: number; line?: number; link?: string; last_update: string })
  )

  // Sort sportsbooks by odds (highest to lowest)
  const sortedSportsbooks = Object.entries(selection.odds_data)
    .sort(([, a], [, b]) => b.odds - a.odds)
    .map(([book, data]) => ({
      book,
      ...data,
      sportsbook: sportsbooks.find(sb => sb.id === book)
    }))

  // Format the game time
  const gameTime = format(new Date(selection.commence_time), "h:mm a")

  // Get sportsbook info for best odds
  const bestSportsbook = bestOdds ? sportsbooks.find(sb => sb.id === bestOdds.book) : null

  // Format selection text (O/U)
  const formatSelection = (text: string) => {
    return text.replace("Over", "O").replace("Under", "U")
  }

  // Format line with rounding and + symbol
  const formatLine = (line?: number) => {
    if (!line) return ""
    const roundedLine = Math.ceil(line)
    return `${roundedLine}+`
  }

  // Create a combined selection display that shows the bet type with line and market
  const getSelectionDisplay = () => {
    const roundedLine = selection.line ? Math.ceil(selection.line) : ""
    const marketLabel = getMarketLabel()
    
    // For under bets, show "U 1+ Hits" format
    // For over bets, show "O 1+ Hits" format
    if (selection.selection === "Under") {
      return `U ${roundedLine}+ ${marketLabel}`
    } else if (selection.selection === "Over") {
      return `O ${roundedLine}+ ${marketLabel}`
    }
    
    // Fallback to original format if neither Over nor Under
    return `${selection.selection} ${roundedLine}+ ${marketLabel}`
  }

  // Format odds display
  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : odds.toString()
  }

  // Get market label from SPORT_MARKETS
  const getMarketLabel = () => {
    // If market_display is available, use it
    if (selection.market_display) {
      return selection.market_display;
    }
    // Fallback to old behavior
    const sportMarkets = SPORT_MARKETS[selection.sport_key] || []
    const market = sportMarkets.find(m => m.apiKey === selection.market_key)
    return market?.label || selection.market_key.split("_").join(" ")
  }

  // Format team name to show abbreviation for city
  const formatTeamName = (fullName: string) => {
    const parts = fullName.split(" ")
    if (parts.length < 2) return fullName

    // Special cases for cities with multiple words
    if (parts.length > 2 && ["New", "Los", "San"].includes(parts[0])) {
      const city = parts.slice(0, 2).map(word => word.charAt(0)).join("")
      const teamName = parts.slice(2).join(" ")
      return `${city} ${teamName}`
    }

    // Regular case
    const cityAbbrev = parts[0].slice(0, 3).toUpperCase()
    const teamName = parts.slice(1).join(" ")
    return `${cityAbbrev} ${teamName}`
  }

  // Find where market is displayed and update it
  const marketDisplay = capitalizeMarket(selection.market_key)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="relative overflow-hidden p-3">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1 h-6 w-6"
          onClick={() => removeSelection(selection.id)}
        >
          <Icons.close className="h-3 w-3" />
        </Button>

        <div className="space-y-1.5 pr-6">
          {/* Selection with O/U prefix */}
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">
              {getSelectionDisplay()}
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 gap-1 pl-2 pr-1"
                    onClick={() => setShowOddsComparison(!showOddsComparison)}
                  >
                    {bestOdds && (
                      <span className="text-sm font-semibold">
                        {formatOdds(bestOdds.odds)}
                      </span>
                    )}
                    {bestSportsbook && (
                      <div className="relative h-4 w-4">
                        <Image
                          src={bestSportsbook.logo}
                          alt={bestSportsbook.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  {sortedSportsbooks.map(({ book, odds, link, sportsbook }) => (
                    <DropdownMenuItem key={book} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {sportsbook && (
                          <div className="relative h-4 w-4">
                            <Image
                              src={sportsbook.logo}
                              alt={sportsbook.name}
                              fill
                              className="object-contain"
                            />
                          </div>
                        )}
                        <span className="text-sm">{sportsbook?.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={cn(
                          "text-sm font-medium",
                          book === bestOdds?.book && "text-primary"
                        )}>
                          {formatOdds(odds)}
                        </span>
                        {link && <Zap className="h-3 w-3 text-primary" />}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Player Name */}
          <div className="flex items-center text-sm">
            <span className="font-medium truncate">
              {selection.player_name}
            </span>
          </div>

          {/* Teams and Time */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
            <span>{formatTeamName(selection.away_team)}</span>
            <span>@</span>
            <span>{formatTeamName(selection.home_team)}</span>
            <span>•</span>
            <span>{gameTime}</span>
          </div>

          {/* Place Bet Link */}
          {bestOdds?.link && (
            <div className="flex justify-end">
              <a
                href={bestOdds.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Place bet →
              </a>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
} 