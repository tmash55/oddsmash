export type BetType = 'standard' | 'player_prop';
export type MarketType = 'spread' | 'moneyline' | 'total' | 'player_prop';

export interface BetslipSelection {
  id: string;
  betslip_id: string;
  event_id: string;
  sport_key: string;
  market_key: string;
  market_display?: string;
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
