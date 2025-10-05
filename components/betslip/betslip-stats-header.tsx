import { Badge } from "@/components/ui/badge"

interface BetslipStatsHeaderProps {
  totalBetslips: number
  totalSelections: number
  readyToCompare: number
  inCart: number
}

export function BetslipStatsHeader({
  totalBetslips,
  totalSelections,
  readyToCompare,
  inCart,
}: BetslipStatsHeaderProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-blue-500/10 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <div className="text-blue-500 text-2xl font-bold">{totalBetslips}</div>
          <div className="text-muted-foreground">Total Betslips</div>
        </div>
      </div>
      
      <div className="bg-green-500/10 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <div className="text-green-500 text-2xl font-bold">{totalSelections}</div>
          <div className="text-muted-foreground">Total Selections</div>
        </div>
      </div>
      
      <div className="bg-purple-500/10 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <div className="text-purple-500 text-2xl font-bold">{readyToCompare}</div>
          <div className="text-muted-foreground">Ready to Compare</div>
        </div>
      </div>
      
      <div className="bg-orange-500/10 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <div className="text-orange-500 text-2xl font-bold">{inCart}</div>
          <div className="text-muted-foreground">In Cart</div>
        </div>
      </div>
    </div>
  )
} 