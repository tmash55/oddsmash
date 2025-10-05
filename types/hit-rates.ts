import { SupportedSport, SportMarket } from "./sports"

export type Market = SportMarket

export type TimeWindow = "5_games" | "10_games" | "20_games"

export interface PointsHistogram {
  last_5: Record<string, number>;
  last_10: Record<string, number>;
  last_20: Record<string, number>;
}

export interface LineStreaks {
  [key: string]: number;
}

export interface RecentGame {
  opponent_abbr: string;
  is_home: boolean;
  value: number;
  date: string;
}

export interface PlayerPropOdds {
  odds: number
  line: number
  over_link?: string | null
  under_link?: string | null
  sid?: string
}

export interface PlayerHitRateProfile {
  player_id: number;
  player_name: string;
  id: string;
  market: SportMarket;
  line: number;
  last_5_hit_rate: number;
  last_10_hit_rate: number;
  last_20_hit_rate: number;
  season_hit_rate: number;
  season_games_count: number;
  avg_stat_per_game: number;
  points_histogram: PointsHistogram;
  recent_games: RecentGame[];
  updated_at: string;
  team_abbreviation: string;
  team_name?: string;
  position_abbreviation: string;
  odds_event_id: string;
  commence_time: string;
  away_team: string;
  home_team: string;
  
  all_odds?: Record<string, Record<string, any>>;
  propsOdds?: Record<string, PlayerPropOdds>;
}

export interface HitRateFilters {
  sport?: SupportedSport
  market?: SportMarket
  timeWindow?: TimeWindow
  minHitRate?: number
  maxHitRate?: number
  minGames?: number
  maxGames?: number
  playerIds?: number[]
  teamIds?: number[]
  positionIds?: number[]
  gameIds?: string[]
  includeInactive?: boolean
}

export interface HitRateStats {
  total_games: number
  hit_rate: number
  points_histogram: number[]
  line_streaks: {
    line: number
    streak: number
  }[]
  recent_games: {
    date: string
    points: number
    line: number
    result: "over" | "under" | "push"
  }[]
}

export interface HitRateTableRow extends PlayerHitRateProfile {
  bestOdds?: {
    american: number;
    decimal: number;
    sportsbook: string;
  };
} 