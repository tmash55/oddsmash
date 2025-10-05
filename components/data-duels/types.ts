import { PlayerHitRateProfile } from "@/types/hit-rates"

export type TeamData = {
  name: string
  abbreviation: string
  pitchers: PlayerHitRateProfile[]
  batters: PlayerHitRateProfile[]
}

export type GameData = {
  id: string
  date: string
  homeTeam: TeamData
  awayTeam: TeamData
  venue: string
  startTime: string
}

export type SportsbookOption = "best_odds" | string // specific sportsbook IDs

export interface DataDuelsProps {
  sport: string
  date: string
  matchup: string
} 