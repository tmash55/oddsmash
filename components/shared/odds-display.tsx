import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Image from "next/image"
import { sportsbooks } from "@/data/sportsbooks"
import { ArrowUpRight } from "lucide-react"

interface OddsDisplayProps {
  odds: number
  sportsbook?: string
  link?: string | null
  className?: string
  showSportsbook?: boolean
  compact?: boolean
}

// Format odds to always show + for positive odds
function formatOdds(odds: number): string {
  if (odds === undefined || odds === null || isNaN(odds)) {
    return "-"
  }
  return odds > 0 ? `+${odds}` : odds.toString()
}

export function OddsDisplay({
  odds,
  sportsbook,
  link,
  className,
  showSportsbook = true,
  compact = false,
}: OddsDisplayProps) {
  // Find sportsbook data if available
  const sportsbookData = sportsbook ? sportsbooks.find(book => book.id === sportsbook) : undefined

  const content = (
    <div
      className={cn(
        "flex items-center gap-1.5",
        link && "cursor-pointer hover:underline",
        className
      )}
      onClick={() => link && window.open(link, "_blank")}
    >
      <span className="font-medium">{formatOdds(odds)}</span>
      {link && <ArrowUpRight className="h-3 w-3" />}
      {showSportsbook && sportsbookData && (
        <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
          <Image
            src={sportsbookData.logo}
            alt={sportsbookData.name}
            width={16}
            height={16}
            className="object-contain"
          />
        </div>
      )}
    </div>
  )

  if (link) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent>
            <p>Click to view on {sportsbookData?.name || sportsbook}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return content
} 