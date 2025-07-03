"use client"

import { PlayerHitRateProfile, PlayerPropOdds } from "@/types/hit-rates"
import { Card } from "@/components/ui/card"
import { SportsbookOption } from "./types"

interface PitcherSectionProps {
  pitchers: PlayerHitRateProfile[]
  selectedSportsbook: SportsbookOption
}

export default function PitcherSection({ pitchers, selectedSportsbook }: PitcherSectionProps) {
  // Markets we want to show for pitchers
  const pitcherMarkets = ["Strikeouts", "Earned Runs"]
  
  const formatOdds = (odds: number | PlayerPropOdds | undefined) => {
    if (!odds) return null
    if (typeof odds === 'number') {
      return odds > 0 ? `+${odds}` : odds.toString()
    }
    return odds.odds > 0 ? `+${odds.odds}` : odds.odds.toString()
  }

  return (
    <div className="space-y-4">
      {pitchers.map((pitcher) => (
        <Card key={pitcher.player_id} className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold text-lg">{pitcher.player_name}</h4>
              <p className="text-sm text-muted-foreground">Starting Pitcher</p>
            </div>
            <img 
              src={`https://img.mlbstatic.com/mlb-photos/image/upload/w_120,q_auto:good,f_auto/v1/people/${pitcher.player_id}/headshot/67/current`}
              alt={pitcher.player_name}
              className="w-12 h-12 rounded-full"
            />
          </div>

          <div className="space-y-4">
            {pitcherMarkets.map((market) => {
              // Find the profile for this market
              const marketProfile = pitchers.find(
                (p) => p.player_id === pitcher.player_id && p.market === market
              )

              if (!marketProfile) return null

              // Get the appropriate odds based on selected sportsbook
              const odds = selectedSportsbook === "best_odds"
                ? marketProfile.best_odds
                : marketProfile.all_odds?.[selectedSportsbook]?.odds

              const formattedOdds = formatOdds(odds)

              return (
                <div key={market} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{market}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span>L5: {marketProfile.last_5_hit_rate}%</span>
                      <span>•</span>
                      <span>L10: {marketProfile.last_10_hit_rate}%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">Line: {marketProfile.line}</p>
                    {formattedOdds && (
                      <p className="text-sm text-muted-foreground">
                        {formattedOdds}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      ))}
    </div>
  )
} 