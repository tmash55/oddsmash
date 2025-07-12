export type BetType = 'standard' | 'player_prop';
export type MarketType = 'spread' | 'moneyline' | 'total' | 'player_prop';

export interface BetslipSelection {
  id?: string;
  betslip_id: string;
  event_id: string;
  sport_key: string;           // API sport key (e.g. "baseball_mlb")
  market_key: string;          // API market key(s) (e.g. "batter_home_runs,batter_home_runs_alternate")
  market_display: string;      // Display name (e.g. "Home Runs")
  market_type: string;         // e.g. "player_props"
  bet_type: string;           // e.g. "straight"
  selection: string;          // e.g. "Over 0.5"
  player_name: string;        // e.g. "Brandon Nimmo"
  player_id: number;          // e.g. 607043
  player_team: string;        // e.g. "NYM"
  line: number;              // e.g. 0.5
  commence_time: string;      // ISO date string
  home_team: string;         // e.g. "Baltimore Orioles"
  away_team: string;         // e.g. "New York Mets"
  odds_data: {
    [sportsbook: string]: {
      odds: number;          // American odds format
      line: number;
      link: string | null;
      last_update: string;   // ISO date string
    }
  };
  status?: string;
  result?: string | null;
  settled_at?: string | null;
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

export interface BetslipData {
  id: string
  title: string
  selections: any[]
  is_default: boolean
  updated_at: string
}

export interface BetslipCardProps {
  betslip: BetslipData
  index: number
  isActive: boolean
  onView: () => void
  onDelete: () => void
  onSetDefault: () => void
  onClear: () => void
  onCompareOdds: () => void
  onInlineRename: (newTitle: string) => void
  canDelete: boolean
  calculateOdds: (betslipId: string) => number | null
  calculatePayout: (betslipId: string, wager: number) => number
  isComparing: boolean
}

export interface BetslipStats {
  totalBetslips: number
  totalSelections: number
  betslipsWithSelections: number
  activeSelectionCount: number
}

export type FilterMode = "all" | "ready" | "active"
