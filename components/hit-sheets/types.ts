export interface HitOdds {
  american: number
  decimal: number
  sportsbook: string
  link?: string | null
  odds: number
  over_link?: string
  under_link?: string
}

export interface HitOddsJson {
  [sportsbook: string]: {
    odds: number
    link?: string
    over_link?: string
  }
}

export interface HitStreakPlayer {
  id: number
  player_id: number
  full_name: string
  team_name: string
  team_abbreviation: string
  streak_length: number
  streak_end: string
  total_home_runs: number
  is_playing_today: boolean
  hit_odds_json: HitOddsJson | null
  away_team_name: string
  home_team_name: string
  commence_time?: string
  market: string
  line: number
  updated_at: string
}

export interface StrikeoutOverCandidate {
  id: number
  out_player_id: number
  out_full_name: string
  out_team_name: string
  out_team_abbreviation: string
  out_position: string
  out_hit_rate: string
  out_line_used: string
  out_line_attempts: number
  out_is_playing_today: boolean
  out_home_team_name: string
  out_away_team_name: string
  out_home_team_abbreviation: string
  out_away_team_abbreviation: string
  out_commence_time?: string
  out_market: string
  out_odds_json: Record<string, { odds: number; over_link?: string }>
  out_updated_at: string
  out_official_date: string
  out_games_sampled: number
}

export interface BounceBackCandidate {
  out_player_id: number
  out_full_name: string
  out_market: string
  out_line: number
  out_hit_rate: number
  out_games_sampled: number
  out_sample_span: string
  out_team_name: string
  out_team_abbreviation: string
  out_is_playing_today: boolean
  out_home_team_name: string
  out_away_team_name: string
  out_official_date: string
  out_commence_time: string
  out_odds_json: Record<string, HitOdds>
  out_pre_slump_hits: number
  out_pre_slump_total: number
}

export interface HitConsistencyCandidate {
  out_player_id: number
  out_full_name: string
  out_market: string
  out_line: number
  out_hit_rate: number
  out_games_sampled: number
  out_sample_span: string
  out_team_name: string
  out_team_abbreviation: string
  out_is_playing_today: boolean
  out_home_team_name: string
  out_away_team_name: string
  out_official_date: string
  out_commence_time: string
  out_odds_json: Record<string, { odds: number; over_link: string }>
} 