"use client"

import { PlayerHitRateProfile, PlayerPropOdds } from "@/types/hit-rates"
import { Card } from "@/components/ui/card"
import { SportsbookOption } from "./types"

interface BatterSectionProps {
  batters: PlayerHitRateProfile[]
  selectedSportsbook: SportsbookOption
}

export default function BatterSection({ batters, selectedSportsbook }: BatterSectionProps) {
  // Markets we want to show for batters
  const batterMarkets = ["Hits", "Total Bases", "Home Runs"]
  
  const formatOdds = (odds: number | PlayerPropOdds | undefined) => {
    if (!odds) return null
    if (typeof odds === 'number') {
      return odds > 0 ? `+${odds}` : odds.toString()
    }
    return odds.odds > 0 ? `+${odds.odds}` : odds.odds.toString()
  }

  return (
    <div className="space-y-4">
      {batters.map((batter) => (
        <Card key={batter.player_id} className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold text-lg">{batter.player_name}</h4>
              <p className="text-sm text-muted-foreground">{batter.position_type || "Batter"}</p>
            </div>
            <img 
              src={`https://img.mlbstatic.com/mlb-photos/image/upload/w_120,q_auto:good,f_auto/v1/people/${batter.player_id}/headshot/67/current`}
              alt={batter.player_name}
              className="w-12 h-12 rounded-full"
            />
          </div>

          <div className="space-y-4">
            {batterMarkets.map((market) => {
              // Find the profile for this market
              const marketProfile = batters.find(
                (p) => p.player_id === batter.player_id && p.market === market
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
                      <span>•</span>
                      <span>L20: {marketProfile.last_20_hit_rate}%</span>
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