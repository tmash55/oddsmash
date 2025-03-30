export interface SportMarket {
  value: string;
  label: string;
  apiKey: string; // The key used in the API request
  hasAlternates?: boolean; // Indicates if this market has alternate lines
  alternateKey?: string; // The API key for alternate lines
  alwaysFetchAlternate?: boolean; // Indicates if we should always fetch both standard and alternate markets
}

export interface SportMarkets {
  [key: string]: SportMarket[];
}

export const SPORT_MARKETS: SportMarkets = {
  'basketball_nba': [
    { 
      value: 'Points', 
      label: 'Points', 
      apiKey: 'player_points',
      hasAlternates: true,
      alternateKey: 'player_points_alternate',
      alwaysFetchAlternate: true
    },
    { 
      value: 'Rebounds', 
      label: 'Rebounds', 
      apiKey: 'player_rebounds',
      hasAlternates: true,
      alternateKey: 'player_rebounds_alternate',
      alwaysFetchAlternate: true
    },
    { 
      value: 'Assists', 
      label: 'Assists', 
      apiKey: 'player_assists',
      hasAlternates: true,
      alternateKey: 'player_assists_alternate',
      alwaysFetchAlternate: true
    },
    { value: 'PRA', label: 'Points + Rebounds + Assists', apiKey: 'player_points,player_rebounds,player_assists' },
    { 
      value: 'Threes', 
      label: 'Three Pointers Made', 
      apiKey: 'player_threes',
      hasAlternates: true,
      alternateKey: 'player_threes_alternate',
      alwaysFetchAlternate: true
    },
    { 
      value: 'Blocks', 
      label: 'Blocks', 
      apiKey: 'player_blocks',
      hasAlternates: true,
      alternateKey: 'player_blocks_alternate',
      alwaysFetchAlternate: true
    },
    { 
      value: 'Steals', 
      label: 'Steals', 
      apiKey: 'player_steals',
      hasAlternates: true,
      alternateKey: 'player_steals_alternate',
      alwaysFetchAlternate: true
    },
    { value: 'Turnovers', label: 'Turnovers', apiKey: 'player_turnovers' },
    { value: 'Double_Double', label: 'Double Double', apiKey: 'player_double_double' },
    { value: 'Triple_Double', label: 'Triple Double', apiKey: 'player_triple_double' },
    { value: 'Points_Rebounds', label: 'Points + Rebounds', apiKey: 'player_points,player_rebounds' },
    { value: 'Points_Assists', label: 'Points + Assists', apiKey: 'player_points,player_assists' },
    { value: 'Rebounds_Assists', label: 'Rebounds + Assists', apiKey: 'player_rebounds,player_assists' },
    { value: 'First_Basket', label: 'First Basket', apiKey: 'player_first_basket' },
    { value: 'First_Field_Goal', label: 'First Field Goal', apiKey: 'player_first_field_goal' },
    { value: 'Minutes', label: 'Minutes Played', apiKey: 'player_minutes' },
  ],
  'baseball_mlb': [
    // Batter Props
    { 
      value: 'Hits', 
      label: 'Hits', 
      apiKey: 'batter_hits',
      hasAlternates: true,
      alternateKey: 'batter_hits_alternate',
      alwaysFetchAlternate: true
    },
    { 
      value: 'Total_Bases', 
      label: 'Total Bases', 
      apiKey: 'batter_total_bases',
      hasAlternates: true,
      alternateKey: 'batter_total_bases_alternate',
      alwaysFetchAlternate: true
    },
    { 
      value: 'Home_Runs', 
      label: 'Home Runs', 
      apiKey: 'batter_home_runs',
      hasAlternates: true,
      alternateKey: 'batter_home_runs_alternate',
      alwaysFetchAlternate: true
    },
    { 
      value: 'RBIs', 
      label: 'RBIs', 
      apiKey: 'batter_rbis',
      hasAlternates: true,
      alternateKey: 'batter_rbis_alternate',
      alwaysFetchAlternate: true
    },
    { value: 'Runs', label: 'Runs Scored', apiKey: 'batter_runs' },
    { value: 'Walks', label: 'Walks', apiKey: 'batter_walks' },
    { value: 'Singles', label: 'Singles', apiKey: 'batter_singles' },
    { value: 'Doubles', label: 'Doubles', apiKey: 'batter_doubles' },
    { value: 'Triples', label: 'Triples', apiKey: 'batter_triples' },
    { value: 'Extra_Base_Hits', label: 'Extra Base Hits', apiKey: 'batter_extra_base_hits' },
    { value: 'Hits_Runs_RBIs', label: 'Hits + Runs + RBIs', apiKey: 'batter_hits_runs_rbis' },

    // Pitcher Props
    { 
      value: 'Strikeouts', 
      label: 'Strikeouts', 
      apiKey: 'pitcher_strikeouts',
      hasAlternates: true,
      alternateKey: 'pitcher_strikeouts_alternate',
      alwaysFetchAlternate: true
    },
    { 
      value: 'Hits_Allowed', 
      label: 'Hits Allowed', 
      apiKey: 'pitcher_hits_allowed',
      hasAlternates: true,
      alternateKey: 'pitcher_hits_allowed_alternate',
      alwaysFetchAlternate: true
    },
    { 
      value: 'Walks', 
      label: 'Walks Allowed', 
      apiKey: 'pitcher_walks',
      hasAlternates: true,
      alternateKey: 'pitcher_walks_alternate',
      alwaysFetchAlternate: true
    },
    { value: 'Earned_Runs', label: 'Earned Runs', apiKey: 'pitcher_earned_runs' },
    { value: 'Outs_Recorded', label: 'Outs Recorded', apiKey: 'pitcher_outs' },
    { value: 'Pitches_Thrown', label: 'Pitches Thrown', apiKey: 'pitcher_pitches_thrown' },
  ],
  'hockey_nhl': [
    { value: 'Points', label: 'Points', apiKey: 'player_points' },
    { value: 'Shots', label: 'Shots on Goal', apiKey: 'player_shots' },
    { value: 'Goals', label: 'Goals', apiKey: 'player_goals' },
    { value: 'Assists', label: 'Assists', apiKey: 'player_assists' },
  ],
};

// Helper function to get markets for a sport
export function getMarketsForSport(sport: string): SportMarket[] {
  return SPORT_MARKETS[sport] || [];
}

// Helper function to get default market for a sport
export function getDefaultMarket(sport: string): string {
  const markets = getMarketsForSport(sport);
  return markets.length > 0 ? markets[0].value : 'Points';
}

// Helper function to get API key for a market
export function getMarketApiKey(sport: string, marketValue: string, useAlternate: boolean = false): string {
  const market = getMarketsForSport(sport).find(m => m.value === marketValue);
  if (!market) return 'player_points';
  
  if (useAlternate && market.hasAlternates && market.alternateKey) {
    return market.alternateKey;
  }
  
  return market.apiKey;
} 