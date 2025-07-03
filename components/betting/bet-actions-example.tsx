"use client"

import { BetActions } from "./bet-actions"

export function BetActionsExample() {
  const exampleSelection = {
    event_id: "123",
    sport_key: "baseball_mlb",
    commence_time: new Date().toISOString(),
    home_team: "New York Yankees",
    away_team: "Boston Red Sox",
    bet_type: "player_prop" as const,
    market_type: "player_prop" as const,
    market_key: "batter_home_runs",
    selection: "Over 0.5",
    player_name: "Aaron Judge",
    player_team: "New York Yankees",
    line: 0.5,
    odds_data: {
      fanduel: {
        odds: 190,
        line: 0.5,
        sid: "12345",
        link: "https://fanduel.com/bet/123",
        last_update: new Date().toISOString()
      },
      draftkings: {
        odds: 185,
        line: 0.5,
        sid: "67890",
        link: "https://draftkings.com/bet/123",
        last_update: new Date().toISOString()
      }
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Bet Actions Example</h2>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h3 className="text-sm font-medium mb-1">Aaron Judge</h3>
          <p className="text-sm text-muted-foreground">Home Runs Over 0.5</p>
        </div>
        <BetActions
          selection={exampleSelection}
          directBetLink={exampleSelection.odds_data.fanduel.link}
        />
      </div>
    </div>
  )
} 