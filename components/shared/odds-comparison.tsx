import { ArrowLeftRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { sportsbooks } from "@/data/sportsbooks"
import { getSportsbookDisplayName } from "@/lib/sportsbook-utils"
import { cn } from "@/lib/utils"

interface OddsData {
  [key: string]: {
    odds: number;
    over_link?: string;
    link?: string;
  } | {
    [line: string]: {
      [sportsbook: string]: {
        odds: number;
        over_link?: string;
        link?: string;
      }
    }
  }
}

interface OddsComparisonProps {
  market?: string;
  line?: number;
  customTier: number | null;
  allOdds?: OddsData;
  className?: string;
  compact?: boolean;
  betType?: 'over' | 'under';
}

// Format American odds for display
const formatOdds = (odds: number): string => {
  if (odds === undefined || odds === null || isNaN(odds)) {
    return "-"
  }
  return odds > 0 ? `+${odds}` : odds.toString()
}

export default function OddsComparison({ 
  market = "", 
  line, 
  customTier, 
  allOdds, 
  className, 
  compact = false, 
  betType = 'over' 
}: OddsComparisonProps) {
  // Format the line display
  const getLineDisplay = () => {
    if (customTier !== null) {
      return `${customTier}+`
    }
    if (typeof line === 'number') {
      return line.toFixed(1)
    }
    return ''
  }

  // Get all available odds for the current line
  const getAvailableOdds = () => {
    if (!allOdds) return []

    // Check if we have a flat structure (direct sportsbook odds)
    const isFlat = Object.values(allOdds).every(value => 
      typeof value === 'object' && 'odds' in value
    )

    if (isFlat) {
      // Handle flat structure
      return Object.entries(allOdds)
        .map(([book, data]: [string, any]) => ({
          book,
          odds: data.odds,
          link: data.over_link || data.link
        }))
        .sort((a, b) => b.odds - a.odds) // Higher odds are always better
    }

    // Handle nested structure
    const targetLine = customTier !== null 
      ? (customTier - 0.5).toString()
      : line?.toString()

    if (!targetLine || !allOdds[targetLine]) {
      return []
    }

    return Object.entries(allOdds[targetLine])
      .map(([book, data]) => ({
        book,
        odds: data.odds,
        link: data.over_link || data.link
      }))
      .sort((a, b) => b.odds - a.odds) // Higher odds are always better
  }

  const availableOdds = getAvailableOdds()

  // Only show comparison if we have multiple odds
  if (!allOdds || Object.keys(allOdds).length <= 1) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors",
                  compact ? "h-5 w-5" : "h-7 w-7"
                )}
              >
                <ArrowLeftRight className={cn(
                  compact ? "h-3 w-3" : "h-4 w-4"
                )} />
              </Button>
            </PopoverTrigger>
            <TooltipContent side="top" className="text-xs">
              Compare odds across sportsbooks
            </TooltipContent>
            <PopoverContent className="w-64 p-0" align="end">
              <div className="p-3 border-b">
                <h4 className="font-medium text-sm">
                  {betType === 'over' ? 'Over' : 'Under'} {getLineDisplay()}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {availableOdds.length} sportsbook{availableOdds.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="max-h-60 overflow-y-auto">
                {availableOdds.length > 0 ? (
                  <div className="p-1">
                    {availableOdds.map(({ book, odds, link }, index) => {
                      const sbData = sportsbooks.find(
                        (sb) => sb.name.toLowerCase() === book.toLowerCase() || sb.id === book
                      )
                      const hasLink = !!link
                      const isBest = index === 0

                      const handleClick = () => {
                        if (hasLink && link) {
                          window.open(link, "_blank")
                        }
                      }

                      return (
                        <div
                          key={book}
                          className={cn(
                            "flex items-center justify-between p-2 rounded border-b border-border/30 last:border-b-0",
                            "hover:bg-muted/50 transition-colors",
                            isBest && "bg-primary/5",
                            hasLink ? "cursor-pointer" : "cursor-default opacity-75"
                          )}
                          onClick={hasLink ? handleClick : undefined}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {/* Sportsbook Logo */}
                            <div className="relative w-5 h-5 flex-shrink-0">
                              {sbData ? (
                                <Image
                                  src={sbData.logo}
                                  alt={sbData.name}
                                  width={20}
                                  height={20}
                                  className="object-contain w-full h-full"
                                />
                              ) : (
                                <div className="w-full h-full bg-muted rounded-sm flex items-center justify-center">
                                  <span className="text-[8px] font-bold text-muted-foreground">
                                    {book.slice(0, 2).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {/* Sportsbook Name */}
                            <span className="text-xs font-medium truncate">
                              {sbData?.name || getSportsbookDisplayName(book)}
                            </span>
                          </div>

                          {/* Odds */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {isBest && (
                              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            )}
                            <span
                              className={cn(
                                "text-sm font-bold tabular-nums",
                                odds > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                              )}
                            >
                              {formatOdds(odds)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-xs text-muted-foreground">No odds available</p>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </TooltipTrigger>
      </Tooltip>
    </TooltipProvider>
  )
} 