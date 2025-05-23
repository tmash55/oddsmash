import Image from "next/image"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { sportsbooks } from "@/data/sportsbooks"
import OddsComparison from "./odds-comparison"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowUpRight } from "lucide-react"

interface OddsCellProps {
  odds: number
  sportsbook: string
  market: string
  line?: number
  customTier: number | null
  allOdds: Record<string, any>
  directLink?: string
  compact?: boolean
}

// Format American odds for display
const formatOdds = (odds: number): string => {
  if (odds === undefined || odds === null || isNaN(odds)) {
    return "-"
  }
  return odds > 0 ? `+${odds}` : odds.toString()
}

export default function OddsCell({
  odds,
  sportsbook,
  market,
  line,
  customTier,
  allOdds,
  directLink,
  compact = false,
}: OddsCellProps) {
  // Find the sportsbook in our data
  const bookId = sportsbooks.find((book) => book.name.toLowerCase() === sportsbook.toLowerCase())?.id || "unknown"
  const bookData = sportsbooks.find((book) => book.id === bookId)

  // Handle click on sportsbook logo
  const handleClick = () => {
    if (directLink) {
      window.open(directLink, "_blank")
    }
  }

  return (
    <div className="flex items-center gap-1">
      <div className={cn(
        "flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg px-2 py-1",
        compact ? "text-xs" : "text-sm"
      )}>
        {bookData && (
          <div 
            className={cn(
              "flex items-center justify-center bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700",
              compact ? "w-5 h-5 p-0.5" : "w-7 h-7 p-1",
              directLink && "cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-400"
            )}
            onClick={handleClick}
          >
            <Image
              src={bookData.logo || `/images/sports-books/${bookId}.png`}
              alt={bookData.name}
              width={compact ? 16 : 20}
              height={compact ? 16 : 20}
              className="object-contain w-full h-full max-h-[16px]"
            />
          </div>
        )}
        <span className="font-bold text-emerald-700 dark:text-emerald-300">
          {formatOdds(odds)}
        </span>
      </div>
      
      {/* Odds comparison */}
      <OddsComparison 
        market={market} 
        line={line} 
        customTier={customTier} 
        allOdds={allOdds}
        compact={compact}
      />
    </div>
  )
} 