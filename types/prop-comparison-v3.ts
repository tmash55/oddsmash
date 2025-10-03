// New V3 types for updated vendor data structure

export interface V3Link {
  desktop: string | null;
  mobile: string | null;
}

export interface V3BookOdds {
  price: number;
  line: number;
  links: V3Link;
  sgp?: string; // SGP token for same-game parlays
}

export interface V3PlayerBookData {
  over: V3BookOdds;
  under: V3BookOdds;
}

export interface V3BestOdds {
  book: string;
  price: number;
  line: number;
  links: V3Link;
  fair_odds: number | null;
  ev_pct: number | null;
  value_pct: number;
}

export interface V3Metrics {
  avg_price: number;
  avg_decimal: number;
  fair_odds: number | null;
  ev_pct: number | null;
  best_book: string;
  best_price: number;
  value_pct: number;
}

export interface V3Player {
  name: string;
  position: string;
  team: string;
  player_id: string;
  primary_line: number;
  books: Record<string, V3PlayerBookData>; // sportsbook_id -> book data
  best: {
    over: V3BestOdds;
    under: V3BestOdds;
  };
  metrics: {
    over: V3Metrics;
    under: V3Metrics;
  };
}

export interface V3Event {
  id: string;
  home: string;
  away: string;
  start: string; // ISO datetime
  live: boolean;
}

export interface V3EventData {
  event: V3Event;
  players: Record<string, V3Player>; // player_id -> player data
}

export interface V3MarketData {
  updated_at: number; // Unix timestamp
  events: Record<string, V3EventData>; // event_id -> event data
}

// Request/Response types for API
export interface PropComparisonV3Params {
  sport: string;
  market: string;
  scope?: 'pregame' | 'live'; // Optional scope filter
  gameId?: string; // Optional event filter
}

export interface PropComparisonV3Response {
  success: boolean;
  data: V3PlayerOdds[]; // Transformed to match existing component expectations
  metadata: {
    total: number;
    sport: string;
    market: string;
    scope: string;
    gameId?: string;
    keysFound: number;
    eventsFound: number;
    playersFound: number;
    lastUpdated: string | null;
  };
}

// Pre-processed player data with all computed fields (server-side optimization)
export interface V3PlayerOdds {
  description: string; // player name
  player_id: string; // string instead of number for V3
  team: string;
  market: string;
  lines: Record<string, Record<string, V3OddsData>>; // line -> sportsbook -> odds
  event_id: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  primary_line: string; // string representation of primary line
  last_updated: string;
  position?: string; // new field from V3
  metrics: Record<string, {
    over: V3LineMetrics;
    under: V3LineMetrics;
  }>;
  best?: {
    over: {
      book: string;
      price: number;
      line: number;
      link?: string;
      ev_pct?: number;
      value_pct?: number;
    } | null;
    under: {
      book: string;
      price: number;
      line: number;
      link?: string;
      ev_pct?: number;
      value_pct?: number;
    } | null;
  };
  
  // Pre-processed fields (computed server-side to reduce client memory usage)
  activeLine: string; // The line being used for this player
  bestOverOdds: V3OddsPrice | null; // Best over odds with full details
  bestUnderOdds: V3OddsPrice | null; // Best under odds with full details
  bestOverPrice: number; // Best over price for quick access
  bestUnderPrice: number; // Best under price for quick access
  bestOverBook: string; // Sportsbook ID with best over odds
  bestUnderBook: string; // Sportsbook ID with best under odds
  bestOverLine?: number; // Line for best over odds
  bestUnderLine?: number; // Line for best under odds
}

// OddsPrice interface for pre-processed best odds
export interface V3OddsPrice {
  price: number;
  link?: string;
  sid: string;
  last_update?: string;
}

export interface V3OddsData {
  over: {
    price: number;
    link?: string;
    sid: string;
    last_update?: string;
    sgp?: string; // SGP token
  } | null;
  under: {
    price: number;
    link?: string;
    sid: string;
    last_update?: string;
    sgp?: string; // SGP token
  } | null;
  line: number;
  last_update?: string;
}

export interface V3LineMetrics {
  avg_price: number;
  avg_decimal: number;
  fair_odds: number | null;
  ev_pct: number | null;
  best_book: string;
  best_price: number;
  value_pct: number;
}
