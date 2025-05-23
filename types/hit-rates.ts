export type Market = 'Hits' | 'Total Bases' | 'Home Runs' | 'Strikeouts' | 'RBIs' | 'Singles' | 'Hits + Runs + RBIs' | 'Doubles' | 'Triples' | 'Earned Runs' | 'Record Win' | 'Batting Strikeouts' | 'Batting Walks' | 'Outs' | 'Walks';

export type TimeWindow = '5_games' | '10_games' | '20_games';

export interface PointsHistogram {
  last_5: Record<string, number>;
  last_10: Record<string, number>;
  last_20: Record<string, number>;
}

export interface LineStreaks {
  [key: string]: number;
}

export interface RecentGame {
  game_id: number;
  date: string;
  opponent_abbr: string;
  is_home: boolean;
  value: number;
}

export interface PlayerHitRateProfile {
  id: number;
  league_id: number;
  player_id: number;
  player_name: string;
  team_name: string | null;
  market: Market;
  line: number;
  last_5_hit_rate: number;
  last_10_hit_rate: number;
  last_20_hit_rate: number;
  avg_stat_per_game: number;
  points_histogram: PointsHistogram;
  line_streaks: LineStreaks;
  updated_at: string;
  recent_games?: RecentGame[];
  season_hit_rate?: number;
  season_games_count?: number;
  all_odds?: Record<string, Record<string, {
    odds: number;
    over_link?: string;
  }>>;
  home_team?: string;
  away_team?: string;
  commence_time?: string;
  odds_event_id?: string;
}

export interface HitRateFilters {
  team?: string;
  market?: Market;
  minHitRate?: number;
  sportsbook?: string;
  timeWindow?: TimeWindow;
}

export interface HitRateTableRow extends PlayerHitRateProfile {
  bestOdds?: {
    american: number;
    decimal: number;
    sportsbook: string;
  };
} 