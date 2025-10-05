export interface MispricedSelection {
  player_id: number
  player_name: string
  sport_key: string
  market: string
  line: number
  bet_type: 'over' | 'under'
  
  event_id: string
  home_team: string
  away_team: string
  commence_time: string
  
  best_sportsbook: string
  best_odds: number
  average_odds: number
  percentage_diff: number
  sportsbooks_count: number
  
  value_score: number
  last_updated: string
}

export interface MispricedOddsCache {
  selections: MispricedSelection[]
  generated_at: string
  sports_scanned: string[]
  total_selections: number
}

export interface MispricedOddsResponse extends MispricedOddsCache {
  cache_hit: boolean
  message?: string
  error?: string
}

// Sport mapping from sports-data.ts to Redis keys
export const SPORT_REDIS_MAPPING: Record<string, string> = {
  'baseball_mlb': 'mlb',
  'basketball_wnba': 'wnba', 
  'americanfootball_nfl': 'nfl',
  'basketball_nba': 'nba',
  'icehockey_nhl': 'nhl'
}

// Priority markets to scan (in order of preference)
export const PRIORITY_MARKETS_BY_SPORT: Record<string, string[]> = {
  'mlb': ['home runs', 'total bases', 'hits', 'rbis', 'strikeouts', 'runs', 'stolen bases'],
  'wnba': ['points', 'rebounds', 'assists', 'threes made'],
  'nfl': ['passing yards', 'rushing yards', 'receiving yards', 'touchdowns'],
  'nba': ['points', 'rebounds', 'assists', 'threes made'],
  'nhl': ['goals', 'assists', 'shots on goal', 'points']
} 