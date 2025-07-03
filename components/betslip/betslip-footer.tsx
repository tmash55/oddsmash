"use client"

import { useState } from "react"
import { useBetslip } from "@/contexts/betslip-context"
import { cn } from "@/lib/utils"
import { DollarSign, Scale } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OddsComparisonModal } from "./odds-comparison-modal"

interface BetslipFooterProps {
  betslipId: string
  className?: string
}

export function BetslipFooter({ betslipId, className }: BetslipFooterProps) {
  const { calculateBetslipOdds, calculateBetslipPayout, formatOdds, getBetslipSelections } = useBetslip()
  const [wagerAmount, setWagerAmount] = useState("10")
  const [showComparison, setShowComparison] = useState(false)

  // Get parlay odds for the betslip
  const parlayOdds = calculateBetslipOdds(betslipId)
  const parlayPayout = calculateBetslipPayout(betslipId, Number(wagerAmount))
  const selections = getBetslipSelections(betslipId)

  if (!parlayOdds) return null

  return (
    <>
      <div className={cn("space-y-3", className)}>
        {/* Parlay Odds */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Parlay Odds</span>
            {selections.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowComparison(true)}
              >
                <Scale className="h-4 w-4" />
              </Button>
            )}
          </div>
          <span className={cn(
            "text-base font-bold px-3 py-1.5 rounded-md",
            "bg-background/80 border border-border/30",
            parlayOdds > 0 ? "text-green-600 dark:text-green-500" : "text-blue-600 dark:text-blue-500"
          )}>
            {formatOdds(parlayOdds)}
          </span>
        </div>

        {/* Wager Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Wager Amount</span>
            <span className="text-xs text-muted-foreground">For calculation only</span>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
            </span>
            <input
              type="number"
              value={wagerAmount}
              onChange={(e) => setWagerAmount(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border bg-background"
              placeholder="Enter wager amount"
            />
          </div>
        </div>

        {/* Potential Payout */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm font-medium">Potential Payout</span>
          <span className="text-lg font-bold text-green-600 dark:text-green-500">
            ${parlayPayout.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Odds Comparison Modal */}
      <OddsComparisonModal
        open={showComparison}
        onOpenChange={setShowComparison}
        betslipId={betslipId}
      />
    </>
  )
} 