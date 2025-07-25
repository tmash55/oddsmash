export interface OddsPrice {
  price: number;
  link?: string;
  sid: string;
  last_update?: string;
}

export interface BookmakerOdds {
  over: OddsPrice | null;
  under: OddsPrice | null;
  line: number;
  last_update?: string;
}

export interface OddsData {
  over: {
    price: number;
    link?: string;
    sid: string; // Make sid required to match OddsPrice
    last_update?: string;
  } | null;
  under: {
    price: number;
    link?: string;
    sid: string; // Make sid required to match OddsPrice
    last_update?: string;
  } | null;
  line: number;
  last_update?: string;
}

export interface LineMetrics {
  avg_price: number;
  avg_decimal: number;
  fair_odds: number | null;
  ev_pct: number | null;
  best_book: string;
  best_price: number;
  value_pct: number;
}

export interface PlayerOdds {
  description: string;
  player_id: number;
  team: string;
  market: string;
  market_display?: string;
  lines: Record<string, Record<string, OddsData>>;
  event_id: string;
  commence_time: string;
  home_team?: string;
  away_team?: string;
  ev?: number;
  best_over_price?: number;
  best_under_price?: number;
  best_over_book?: string;
  best_under_book?: string;
  primary_line?: string; // Add this property
  last_updated?: string; // Add missing last_updated property
  metrics?: Record<string, {
    over?: LineMetrics;
    under?: LineMetrics;
  }>; // Add pre-calculated metrics from Redis
}

export interface PropComparisonParams {
  sport: string;
  market?: string;
  gameId?: string;
  sportsbook?: string;
  line?: string;
  bestOverOddsBook?: string;
  bestUnderOddsBook?: string;
}

export interface PropComparisonResponse {
  success: boolean;
  data: PlayerOdds[];
  metadata?: {
    total: number;
    sport: string;
    market: string;
    gameId: string;
    keyPattern: string;
    keysFound: number;
    itemsWithMetrics: number;
    globalLastUpdated: string | null;
  };
}

export interface BestOddsFilter {
  sportsbook: string;
  type: "over" | "under";  // Remove null since we always need a type
}

export interface TransformedPlayerOdds extends PlayerOdds {
  bestOverOdds: OddsPrice | null;
  bestUnderOdds: OddsPrice | null;
  bestOverPrice: number;
  bestUnderPrice: number;
  bestOverBook: string;
  bestUnderBook: string;
  activeLine: string;
  edgeValues: Map<'over' | 'under', number>;
} 