export interface BetslipSelection {
  id: string;
  betslip_id: string;
  event_id: string;
  sport_key: string;
  market_key: string;
  market_type: string;
  bet_type: string;
  selection: string;
  player_name?: string;
  player_id?: number;
  player_team?: string;
  line?: number;
  commence_time: string;
  home_team: string;
  away_team: string;
  odds_data: Record<string, {
    odds: number;
    line?: number;
    link?: string;
    sid?: string;
    last_update: string;
  }>;
  created_at?: string;
  updated_at?: string;
}

export type Betslip = {
  id: string;
  user_id: string;
  title: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  selections: BetslipSelection[];
}; 