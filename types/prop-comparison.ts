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
}

export interface BestOddsFilter {
  sportsbook: string;
  type: "over" | "under" | null;
  minOdds: number;
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