// EV Play Types - matches actual Redis data structure

export interface BaseEVPlay {
  id: string
  sport: string
  scope: 'pregame' | 'live'
  event_id: string
  market: string
  side: 'over' | 'under'
  line: number
  ev_percentage: number
  best_book: string
  best_odds: number
  fair_odds: number
  timestamp: number
  market_key: string
  home: string
  away: string
  start: string // ISO date string
}

export interface GameEVPlay extends BaseEVPlay {
  // Game props don't have player info
  player_id?: never
  player_name?: never
  team?: never
  position?: never
}

export interface PlayerEVPlay extends BaseEVPlay {
  // Player props have additional player info
  player_id: string
  player_name: string
  team: string
  position: string
}

export type EVPlay = GameEVPlay | PlayerEVPlay

// Helper type guards
export function isPlayerEVPlay(play: EVPlay): play is PlayerEVPlay {
  return 'player_id' in play && play.player_id !== undefined
}

export function isGameEVPlay(play: EVPlay): play is GameEVPlay {
  return !('player_id' in play) || play.player_id === undefined
}

// API Response types
export interface EVPlaysResponse {
  success: boolean
  data: EVPlay[]
  metadata: {
    total_count: number
    sports: string[]
    last_updated: string
    cache_hit: boolean
  }
}

// Filters for API requests
export interface EVFilters {
  sports?: string[]
  min_ev?: number
  max_ev?: number
  markets?: string[]
  books?: string[]
  limit?: number
  offset?: number
  sort_by?: 'ev_percentage' | 'best_odds' | 'start' | 'timestamp'
  sort_direction?: 'asc' | 'desc'
}

// Expansion data structure (for drill-down)
export interface EVExpansionData {
  play: EVPlay
  all_books: Array<{
    book: string
    odds: number
    line: number
    link?: string
    last_updated: number
  }>
  market_stats: {
    total_books: number
    best_odds: number
    worst_odds: number
    odds_spread: number
    avg_odds: number
  }
  line_movement?: Array<{
    timestamp: number
    line: number
    odds: number
    book: string
  }>
}

// Redis key patterns
export const EV_KEYS = {
  sport: (sport: string, scope: string) => `ev:${sport}:${scope}`,
  combined: (sports: string[], scopes: string[]) => 
    `ev:combined:${sports.sort().join('+')}:${scopes.sort().join('+')}`,
  expansion: (sport: string, eventId: string, market: string, playerId?: string) => 
    `ev:expansion:${sport}:${eventId}:${market}${playerId ? `:${playerId}` : ''}`,
  meta: (sport: string, scope: string) => `ev:meta:${sport}:${scope}`
} as const

// Market display helpers
export const MARKET_LABELS: Record<string, string> = {
  total: 'Total Points',
  spread: 'Point Spread',
  moneyline: 'Moneyline',
  rush_attempts: 'Rush Attempts',
  passing_yards: 'Passing Yards',
  receiving_yards: 'Receiving Yards',
  rushing_yards: 'Rushing Yards',
  receptions: 'Receptions',
  passing_tds: 'Passing TDs',
  rushing_tds: 'Rushing TDs',
  receiving_tds: 'Receiving TDs'
}

export function getMarketLabel(market: string): string {
  return MARKET_LABELS[market] || market.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Odds formatting utilities
export function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : odds.toString()
}

export function formatEVPercentage(ev: number): string {
  return `${ev >= 0 ? '+' : ''}${ev.toFixed(1)}%`
}

export function calculateImpliedProbability(odds: number): number {
  if (odds > 0) {
    return 100 / (odds + 100)
  } else {
    return Math.abs(odds) / (Math.abs(odds) + 100)
  }
}

// Sport configuration
export const SUPPORTED_SPORTS = ['nfl', 'nba', 'mlb', 'nhl', 'ncaaf', 'ncaab'] as const
export const SUPPORTED_SCOPES = ['pregame', 'live'] as const

export type SupportedSport = typeof SUPPORTED_SPORTS[number]
export type SupportedScope = typeof SUPPORTED_SCOPES[number]


