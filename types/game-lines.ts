export interface GameOddsOutcome {
  name: string
  price: number
  point?: number
  link?: string
  sid?: string
}

export interface GameOddsMarket {
  key: string
  line?: string | number
  outcomes: GameOddsOutcome[]
  // Some providers include a lines map with per-line per-book info. Optional here.
  lines?: Record<
    string,
    {
      point: number
      sportsbooks: Record<
        string,
        {
          is_standard: boolean
          over?: { price: number; link?: string; sid?: string }
          under?: { price: number; link?: string; sid?: string }
          // spreads variant: single side price + team name
          price?: number
          link?: string
          sid?: string
          team?: string
          // h2h variant: nested home/away entries
          home_team?: { price: number; link?: string | null; sid?: string | null; team?: string | null }
          away_team?: { price: number; link?: string | null; sid?: string | null; team?: string | null }
        }
      >
    }
  >
  is_standard?: boolean
}

export interface GameOddsBookmaker {
  key: string
  title: string
  last_update: string
  markets: GameOddsMarket[]
}

export interface GameOddsTeam {
  name: string
  abbreviation: string
}

export interface GameOdds {
  event_id: string
  sport_key: string
  commence_time: string
  home_team: GameOddsTeam
  away_team: GameOddsTeam
  bookmakers: GameOddsBookmaker[]
  last_update: string
  primary_line?: string
}

// NEW BACKEND SCHEMAS (union) - used for normalization
export interface NewSchemaBase {
  market_key: "h2h" | "spreads" | "totals"
  market_label: string
  market_type: string
  description: string
  has_alternates: boolean
  lines: Record<
    string,
    {
      point: number | null
      sportsbooks: Record<string, any>
    }
  >
  primary_line: string
  event_id: string
  sport_key: string
  home_team: string
  away_team: string
  commence_time: string
  last_update: string
}

export type NewSchemaGameOdds = NewSchemaBase



