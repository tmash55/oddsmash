// All supported sports
export const SUPPORTED_SPORTS = ["mlb", "nfl", "nba", "wnba", "nhl"] as const
export type SupportedSport = typeof SUPPORTED_SPORTS[number]

// Sports with active hit rate features
export const ACTIVE_HIT_RATE_SPORTS = ["mlb"] as const
export type ActiveHitRateSport = typeof ACTIVE_HIT_RATE_SPORTS[number]

// Sport-specific market types
export type MLBMarket = 
  | "Hits"
  | "Total Bases"
  | "Home Runs"
  | "Strikeouts"
  | "Walks"
  | "Batting Walks"
  | "RBIs"
  | "Singles"
  | "Doubles"
  | "Triples"
  | "Earned Runs"
  | "Hits Allowed"
  | "Hits + Runs + RBIs"
  | "Outs"
  | "Stolen Bases"

export type NFLMarket = 
  | "Passing Yards"
  | "Rushing Yards"
  | "Receiving Yards"
  | "Completions"
  | "Touchdowns"

export type NBAMarket = 
  | "Points"
  | "Rebounds"
  | "Assists"
  | "Three Pointers"
  | "Blocks"
  | "Steals"

export type WNBAMarket = NBAMarket
export type NHLMarket = 
  | "Goals"
  | "Assists"
  | "Points"
  | "Shots"
  | "Saves"

// Combined market type
export type SportMarket = MLBMarket | NFLMarket | NBAMarket | WNBAMarket | NHLMarket

// Sport-specific configurations
export interface SportConfig {
  name: string
  isActive: boolean
  markets: { value: SportMarket; label: string }[]
  defaultMarket: SportMarket
  statTerminology: {
    hitRate: string
    success: string
    attempt: string
  }
  comingSoonMessage?: string
}

// Sport configuration map
export const SPORT_CONFIGS: Record<SupportedSport, SportConfig> = {
  mlb: {
    name: "MLB",
    isActive: true,
    markets: [
      { value: "Hits", label: "Hits" },
      { value: "Total Bases", label: "Total Bases" },
      { value: "Home Runs", label: "Home Runs" },
      { value: "Strikeouts", label: "Strikeouts" },
      { value: "Walks", label: "Walks" },
      { value: "Batting Walks", label: "Batting Walks" },
      { value: "RBIs", label: "RBIs" },
      { value: "Singles", label: "Singles" },
      { value: "Doubles", label: "Doubles" },
      { value: "Triples", label: "Triples" },
      { value: "Earned Runs", label: "Earned Runs" },
      { value: "Hits Allowed", label: "Hits Allowed" },
      { value: "Hits + Runs + RBIs", label: "H+R+RBI" },
      { value: "Outs", label: "Outs" },
      { value: "Stolen Bases", label: "Stolen Bases" }
    ],
    defaultMarket: "Hits",
    statTerminology: {
      hitRate: "Hit Rate",
      success: "Hit",
      attempt: "At Bat"
    }
  },
  nfl: {
    name: "NFL",
    isActive: false,
    markets: [],
    defaultMarket: "Passing Yards",
    statTerminology: {
      hitRate: "Success Rate",
      success: "Success",
      attempt: "Attempt"
    },
    comingSoonMessage: "NFL hit rates coming for the 2024 season!"
  },
  nba: {
    name: "NBA",
    isActive: false,
    markets: [],
    defaultMarket: "Points",
    statTerminology: {
      hitRate: "Success Rate",
      success: "Success",
      attempt: "Attempt"
    },
    comingSoonMessage: "NBA hit rates coming soon!"
  },
  wnba: {
    name: "WNBA",
    isActive: false,
    markets: [],
    defaultMarket: "Points",
    statTerminology: {
      hitRate: "Success Rate",
      success: "Success",
      attempt: "Attempt"
    },
    comingSoonMessage: "WNBA hit rates coming soon!"
  },
  nhl: {
    name: "NHL",
    isActive: false,
    markets: [],
    defaultMarket: "Goals",
    statTerminology: {
      hitRate: "Success Rate",
      success: "Success",
      attempt: "Attempt"
    },
    comingSoonMessage: "NHL hit rates coming for the 2024-25 season!"
  }
} 