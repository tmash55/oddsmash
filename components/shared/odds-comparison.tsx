import { ArrowLeftRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Image from "next/image"
import { sportsbooks } from "@/data/sportsbooks"
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
}

// Helper to sort odds from best to worst (highest positive, then least negative)
function sortOddsEntries(entries: [string, any][]) {
  return entries.sort((a, b) => {
    const getOdds = (oddsObj: any) => {
      if (oddsObj && oddsObj.odds !== undefined) return Number(oddsObj.odds)
      if (!isNaN(Number(oddsObj))) return Number(oddsObj)
      return Number.NEGATIVE_INFINITY
    }
    return getOdds(b[1]) - getOdds(a[1])
  })
}

// Add a helper to safely get link from bookData
const getLinkFromBookData = (bookData: any): string | undefined => {
  if (bookData && bookData.over_link) {
    return bookData.over_link
  }

  if (bookData && bookData.link) {
    return bookData.link
  }

  return undefined
}

// Format American odds for display
const formatOdds = (odds: number): string => {
  if (odds === undefined || odds === null || isNaN(odds)) {
    return "-"
  }
  return odds > 0 ? `+${odds}` : odds.toString()
}

export default function OddsComparison({ market = "", line, customTier, allOdds, className, compact = false }: OddsComparisonProps) {
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
    if (!allOdds) {
      return []
    }

    // Check if we have a flat structure (direct sportsbook odds)
    const isFlat = Object.values(allOdds).every(value => 
      typeof value === 'object' && 'odds' in value
    )

    if (isFlat) {
      // Handle flat structure
      const odds = Object.entries(allOdds)
        .map(([book, data]: [string, any]) => ({
          book,
          odds: data.odds,
          link: data.over_link || data.link
        }))
        .sort((a, b) => {
          // For negative odds, closer to 0 is better
          if (a.odds < 0 && b.odds < 0) {
            return b.odds - a.odds
          }
          // For positive odds, higher is better
          return b.odds - a.odds
        })

      return odds
    }

    // Handle nested structure
    const targetLine = customTier !== null 
      ? (customTier - 0.5).toString()
      : line?.toString()

    if (!targetLine || !allOdds[targetLine]) {
      return []
    }

    const odds = Object.entries(allOdds[targetLine])
      .map(([book, data]) => ({
        book,
        odds: data.odds,
        link: data.over_link || data.link
      }))
      .sort((a, b) => {
        // For negative odds, closer to 0 is better
        if (a.odds < 0 && b.odds < 0) {
          return b.odds - a.odds
        }
        // For positive odds, higher is better
        return b.odds - a.odds
      })

    return odds
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
                  "flex-shrink-0 text-muted-foreground hover:text-foreground",
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
            <PopoverContent className="w-72 p-3">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Odds Comparison</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Available odds{market ? ` for ${market}` : ''} {getLineDisplay()}
                </p>
                <div className="space-y-1 mt-2">
                  {availableOdds.length > 0 ? (
                    availableOdds.map(({ book, odds, link }) => {
                      const bookId = sportsbooks.find(
                        (sb) => sb.name.toLowerCase() === book.toLowerCase()
                      )?.id || "unknown"
                      
                      const sbData = sportsbooks.find((sb) => sb.id === bookId)
                      const hasLink = !!link

                      const handleClick = () => {
                        if (hasLink) {
                          window.open(link, "_blank")
                        }
                      }

                      return (
                        <div
                          key={book}
                          className={cn(
                            "flex justify-between items-center p-1.5 odd:bg-gray-50 dark:odd:bg-gray-800 rounded",
                            hasLink && "cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/10"
                          )}
                          onClick={hasLink ? handleClick : undefined}
                        >
                          <div className="flex items-center gap-2">
                            {sbData ? (
                              <div className="w-7 h-7 flex items-center justify-center bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-1">
                                <Image
                                  src={sbData.logo || `/images/sports-books/${bookId}.png`}
                                  alt={sbData.name}
                                  width={20}
                                  height={20}
                                  className="object-contain w-full h-full max-h-[16px]"
                                />
                              </div>
                            ) : null}
                            <span className="font-medium text-sm">{book}</span>
                            {hasLink && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">Quick Bet</span>
                            )}
                          </div>
                          <span
                            className={cn(
                              "text-sm font-bold",
                              odds > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                            )}
                          >
                            {formatOdds(odds)}
                          </span>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center text-sm text-gray-500 py-2">No odds available</div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </TooltipTrigger>
      </Tooltip>
    </TooltipProvider>
  )
} 