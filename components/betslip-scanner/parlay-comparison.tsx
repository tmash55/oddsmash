"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Trophy, TrendingUp } from "lucide-react"
import { formatOdds } from "@/lib/odds-utils"

interface ParlayResult {
  parlayOdds: number | null
  individualOdds: number[]
  hasAllSelections: boolean
  numSelections: number
}

interface ParlayComparisonData {
  parlayResults: Record<string, ParlayResult>
  bestSportsbook: string
  bestOdds: number | null
  numSelectionsWithOdds: number
  totalSelections: number
}

interface ParlayComparisonProps {
  parlayComparison: ParlayComparisonData | null
  parlayLinks?: Record<string, string | null>
}

// Sportsbook display names and colors
const SPORTSBOOK_INFO: Record<string, { name: string; color: string }> = {
  fanduel: { name: "FanDuel", color: "bg-blue-600" },
  draftkings: { name: "DraftKings", color: "bg-green-600" },
  betmgm: { name: "BetMGM", color: "bg-yellow-600" },
  williamhill_us: { name: "Caesars", color: "bg-purple-600" },
  betrivers: { name: "BetRivers", color: "bg-red-600" }
}

function SportsbookCard({ 
  sportsbook, 
  result, 
  isBest, 
  link 
}: { 
  sportsbook: string
  result: ParlayResult
  isBest: boolean
  link?: string | null
}) {
  const info = SPORTSBOOK_INFO[sportsbook] || { name: sportsbook, color: "bg-gray-600" }
  
  return (
    <Card className={`p-4 transition-all duration-200 ${isBest ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${info.color}`} />
          <h4 className="font-semibold">{info.name}</h4>
          {isBest && (
            <Badge className="bg-primary text-primary-foreground">
              <Trophy className="h-3 w-3 mr-1" />
              Best
            </Badge>
          )}
        </div>
        
        {result.hasAllSelections && result.parlayOdds && (
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {formatOdds(result.parlayOdds)}
            </div>
            <div className="text-xs text-muted-foreground">
              Parlay Odds
            </div>
          </div>
        )}
      </div>
      
      {!result.hasAllSelections ? (
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 rounded-full bg-yellow-100 flex items-center justify-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
            </div>
            Missing odds for some selections
          </div>
          <div className="text-xs">
            Has odds for {result.numSelections} selections
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            Individual odds: {result.individualOdds.map(formatOdds).join(" × ")}
          </div>
          
          {link && (
            <Button size="sm" variant="outline" className="w-full gap-2" asChild>
              <a href={link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Place Bet
              </a>
            </Button>
          )}
          
          {!link && (
            <Button size="sm" variant="outline" className="w-full" disabled>
              Visit {info.name}
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}

export function ParlayComparison({ parlayComparison, parlayLinks }: ParlayComparisonProps) {
  if (!parlayComparison) {
    return null
  }

  const { parlayResults, bestSportsbook, bestOdds, numSelectionsWithOdds, totalSelections } = parlayComparison
  
  // Filter to only show sportsbooks with results
  const availableSportsbooks = Object.entries(parlayResults).filter(([_, result]) => 
    result.numSelections > 0
  )

  if (availableSportsbooks.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-2">
          <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto" />
          <h3 className="font-semibold">No Parlay Comparison Available</h3>
          <p className="text-sm text-muted-foreground">
            We couldn't find current odds for the extracted selections.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Parlay Comparison
          </h3>
          <p className="text-sm text-muted-foreground">
            {numSelectionsWithOdds} of {totalSelections} selections have current odds
          </p>
        </div>
        
        {bestOdds && (
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Best Parlay Odds</div>
            <div className="text-xl font-bold text-primary">
              {formatOdds(bestOdds)}
            </div>
            <div className="text-xs text-muted-foreground">
              at {SPORTSBOOK_INFO[bestSportsbook]?.name || bestSportsbook}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableSportsbooks.map(([sportsbook, result]) => (
          <SportsbookCard
            key={sportsbook}
            sportsbook={sportsbook}
            result={result}
            isBest={sportsbook === bestSportsbook && result.hasAllSelections}
            link={parlayLinks?.[sportsbook]}
          />
        ))}
      </div>
      
      {numSelectionsWithOdds < totalSelections && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center mt-0.5">
              <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />
            </div>
            <div className="space-y-1">
              <h4 className="font-medium text-yellow-800">Incomplete Parlay</h4>
              <p className="text-sm text-yellow-700">
                Some selections don't have current odds available. The parlay comparison shows odds for available selections only.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
} 