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

// Common market definitions for reuse
const BASKETBALL_MARKETS: SportMarket[] = [
  // Game-level markets
  { value: "Moneyline", label: "Moneyline", apiKey: "h2h" },
  { value: "Spread", label: "Point Spread", apiKey: "spreads" },
  { value: "Total", label: "Total Points", apiKey: "totals" },
  
  // Player props
  {
    value: "Points",
    label: "Points",
    apiKey: "player_points",
    hasAlternates: true,
    alternateKey: "player_points_alternate",
    alwaysFetchAlternate: true,
  },
  {
    value: "Rebounds",
    label: "Rebounds",
    apiKey: "player_rebounds",
    hasAlternates: true,
    alternateKey: "player_rebounds_alternate",
    alwaysFetchAlternate: true,
  },
  {
    value: "Assists",
    label: "Assists",
    apiKey: "player_assists",
    hasAlternates: true,
    alternateKey: "player_assists_alternate",
    alwaysFetchAlternate: true,
  },
  {
    value: "Threes",
    label: "Threes",
    apiKey: "player_threes",
    hasAlternates: true,
    alternateKey: "player_threes_alternate",
    alwaysFetchAlternate: true,
  },
  {
    value: "PRA",
    label: "Pts+Reb+Ast",
    apiKey: "player_points_rebounds_assists",
    hasAlternates: true,
    alternateKey: "player_points_rebounds_assists_alternate",
    alwaysFetchAlternate: true,
  },
  {
    value: "Points_Rebounds",
    label: "Pts+Reb",
    apiKey: "player_points_rebounds",
    hasAlternates: true,
    alternateKey: "player_points_rebounds_alternate",
    alwaysFetchAlternate: true,
  },
  {
    value: "Points_Assists",
    label: "Pts+Ast",
    apiKey: "player_points_assists",
    hasAlternates: true,
    alternateKey: "player_points_assists_alternate",
    alwaysFetchAlternate: true,
  },
  {
    value: "Rebounds_Assists",
    label: "Reb+Ast",
    apiKey: "player_rebounds_assists",
    hasAlternates: true,
    alternateKey: "player_rebounds_assists_alternate",
    alwaysFetchAlternate: true,
  },
  {
    value: "Double_Double",
    label: "Double Double",
    apiKey: "player_double_double",
  },
  {
    value: "Triple_Double",
    label: "Triple Double",
    apiKey: "player_triple_double",
  },
  {
    value: "Blocks",
    label: "Blocks",
    apiKey: "player_blocks",
    hasAlternates: true,
    alternateKey: "player_blocks_alternate",
    alwaysFetchAlternate: true,
  },
  {
    value: "Steals",
    label: "Steals",
    apiKey: "player_steals",
    hasAlternates: true,
    alternateKey: "player_steals_alternate",
    alwaysFetchAlternate: true,
  },
  {
    value: "Blocks_steals",
    label: "Blocks+Steals",
    apiKey: "player_blocks_steals",
  },
  {
    value: "Turnovers",
    label: "Turnovers",
    apiKey: "player_turnovers",
    hasAlternates: true,
    alternateKey: "player_turnovers_alternate",
    alwaysFetchAlternate: true,
  },
  {
    value: "First_Team_Basket",
    label: "Team First Point",
    apiKey: "player_first_team_basket",
  },
  {
    value: "First_Field_Goal",
    label: "First Point",
    apiKey: "player_first_basket",
  },
  {
    value: "Player_Points_Q1",
    label: "Points - 1st Quarter",
    apiKey: "player_points_q1",
  },
  {
    value: "Player_Assists_Q1",
    label: "Assists- 1st Quarter",
    apiKey: "player_assists_q1",
  },
  {
    value: "Player_Rebounds_Q1",
    label: "Rebounds - 1st Quarter",
    apiKey: "player_rebounds_q1",
  },
];

const FOOTBALL_MARKETS: SportMarket[] = [
  // Game-level markets
  { value: "Moneyline", label: "Moneyline", apiKey: "h2h" },
  { value: "Spread", label: "Point Spread", apiKey: "spreads" },
  { value: "Total", label: "Total Points", apiKey: "totals" },

  // Player props
  {
    value: "Passing_Yards",
    label: "Passing Yards",
    apiKey: "player_passing_yards",
    hasAlternates: true,
    alternateKey: "player_passing_yards_alternate",
    alwaysFetchAlternate: true,
  },
  {
    value: "Rushing_Yards",
    label: "Rushing Yards",
    apiKey: "player_rushing_yards",
    hasAlternates: true,
    alternateKey: "player_rushing_yards_alternate",
    alwaysFetchAlternate: true,
  },
  {
    value: "Receiving_Yards",
    label: "Receiving Yards",
    apiKey: "player_receiving_yards",
    hasAlternates: true,
    alternateKey: "player_receiving_yards_alternate",
    alwaysFetchAlternate: true,
  },
  {
    value: "Passing_Touchdowns",
    label: "Passing Touchdowns",
    apiKey: "player_passing_touchdowns",
    hasAlternates: true,
    alternateKey: "player_passing_touchdowns_alternate",
    alwaysFetchAlternate: true,
  },
  {
    value: "Rushing_Touchdowns",
    label: "Rushing Touchdowns",
    apiKey: "player_rushing_touchdowns",
    hasAlternates: true,
    alternateKey: "player_rushing_touchdowns_alternate",
    alwaysFetchAlternate: true,
  },
  {
    value: "Receiving_Touchdowns",
    label: "Receiving Touchdowns",
    apiKey: "player_receiving_touchdowns",
    hasAlternates: true,
    alternateKey: "player_receiving_touchdowns_alternate",
    alwaysFetchAlternate: true,
  },
  {
    value: "Anytime_Touchdown",
    label: "Anytime Touchdown",
    apiKey: "player_anytime_touchdown",
  },
  {
    value: "Receptions",
    label: "Receptions",
    apiKey: "player_receptions",
    hasAlternates: true,
    alternateKey: "player_receptions_alternate",
    alwaysFetchAlternate: true,
  },
  {
    value: "Completions",
    label: "Completions",
    apiKey: "player_completions",
    hasAlternates: true,
    alternateKey: "player_completions_alternate",
    alwaysFetchAlternate: true,
  },
  {
    value: "Pass_Attempts",
    label: "Pass Attempts",
    apiKey: "player_pass_attempts",
    hasAlternates: true,
    alternateKey: "player_pass_attempts_alternate",
    alwaysFetchAlternate: true,
  },
  {
    value: "Carries",
    label: "Carries",
    apiKey: "player_carries",
    hasAlternates: true,
    alternateKey: "player_carries_alternate",
    alwaysFetchAlternate: true,
  },
  {
    value: "Targets",
    label: "Targets",
    apiKey: "player_targets",
    hasAlternates: true,
    alternateKey: "player_targets_alternate",
    alwaysFetchAlternate: true,
  },
  {
    value: "Interceptions_Thrown",
    label: "Interceptions Thrown",
    apiKey: "player_interceptions_thrown",
    hasAlternates: true,
    alternateKey: "player_interceptions_thrown_alternate",
    alwaysFetchAlternate: true,
  },
  {
    value: "Sacks_Taken",
    label: "Sacks Taken",
    apiKey: "player_sacks_taken",
    hasAlternates: true,
    alternateKey: "player_sacks_taken_alternate",
    alwaysFetchAlternate: true,
  }
];

export const SPORT_MARKETS: SportMarkets = {
  basketball_nba: BASKETBALL_MARKETS,
  basketball_wnba: BASKETBALL_MARKETS,
  basketball_ncaab: BASKETBALL_MARKETS,
  football_nfl: FOOTBALL_MARKETS,
  football_ncaaf: FOOTBALL_MARKETS,
  baseball_mlb: [
    // Game-level markets
    { value: "Moneyline", label: "Moneyline", apiKey: "h2h" },
    { value: "Spread", label: "Run Line", apiKey: "spreads" },
    { value: "Total", label: "Total Runs", apiKey: "totals" },
    
    // Batter Props
    {
      value: "Home_Runs",
      label: "Home Runs",
      apiKey: "batter_home_runs",
      hasAlternates: true,
      alternateKey: "batter_home_runs_alternate",
      alwaysFetchAlternate: true,
    },
    {
      value: "Hits",
      label: "Hits",
      apiKey: "batter_hits",
      hasAlternates: true,
      alternateKey: "batter_hits_alternate",
      alwaysFetchAlternate: true,
    },
    {
      value: "Total_Bases",
      label: "Total Bases",
      apiKey: "batter_total_bases",
      hasAlternates: true,
      alternateKey: "batter_total_bases_alternate",
      alwaysFetchAlternate: true,
    },

    {
      value: "RBIs",
      label: "RBIs",
      apiKey: "batter_rbis",
      hasAlternates: true,
      alternateKey: "batter_rbis_alternate",
      alwaysFetchAlternate: true,
    },
    { value: "Runs", label: "Runs Scored", apiKey: "batter_runs_scored" },
    { value: "Walks", label: "Walks", apiKey: "batter_walks" },
    { value: "Singles", label: "Singles", apiKey: "batter_singles" },
    { value: "Doubles", label: "Doubles", apiKey: "batter_doubles" },
    { value: "Triples", label: "Triples", apiKey: "batter_triples" },
    { value: "Stolen_Bases", label: "Stolen Bases", apiKey: "batter_stolen_bases" },
    {
      value: "Extra_Base_Hits",
      label: "Extra Base Hits",
      apiKey: "batter_extra_base_hits",
    },
    {
      value: "Hits_Runs_RBIs",
      label: "Hits + Runs + RBIs",
      apiKey: "batter_hits_runs_rbis",
    },
    {
      value: "Batter_First_Home_Run",
      label: "1st Home Run",
      apiKey: "batter_first_home_run",
    },

    // Pitcher Props
    {
      value: "Strikeouts",
      label: "Strikeouts",
      apiKey: "pitcher_strikeouts",
      hasAlternates: true,
      alternateKey: "pitcher_strikeouts_alternate",
      alwaysFetchAlternate: true,
    },
    {
      value: "Hits_Allowed",
      label: "Hits Allowed",
      apiKey: "pitcher_hits_allowed",
      hasAlternates: true,
      alternateKey: "pitcher_hits_allowed_alternate",
      alwaysFetchAlternate: true,
    },
    {
      value: "Walks_Allowed",
      label: "Walks Allowed",
      apiKey: "pitcher_walks",
      hasAlternates: true,
      alternateKey: "pitcher_walks_alternate",
      alwaysFetchAlternate: true,
    },
    {
      value: "Earned_Runs",
      label: "Earned Runs",
      apiKey: "pitcher_earned_runs",
    },
    { value: "Outs_Recorded", label: "Outs Recorded", apiKey: "pitcher_outs" },
    {
      value: "Pitches_Thrown",
      label: "Pitches Thrown",
      apiKey: "pitcher_pitches_thrown",
    },
  ],
  icehockey_nhl: [
    // Game-level markets
    { value: "Moneyline", label: "Moneyline", apiKey: "h2h" },
    { value: "Spread", label: "Puck Line", apiKey: "spreads" },
    { value: "Total", label: "Total Goals", apiKey: "totals" },
    
    // Player props
    {
      value: "Points",
      label: "Points",
      apiKey: "player_points",
      hasAlternates: true,
      alternateKey: "player_points_alternate",
      alwaysFetchAlternate: true,
    },
    {
      value: "Shots",
      label: "Shots on Goal",
      apiKey: "player_shots_on_goal",
      hasAlternates: true,
      alternateKey: "player_shots_on_goal_alternate",
      alwaysFetchAlternate: true,
    },
    {
      value: "Goals",
      label: "Goals",
      apiKey: "player_goals",
      hasAlternates: true,
      alternateKey: "player_goals_alternate",
      alwaysFetchAlternate: true,
    },
    {
      value: "Assists",
      label: "Assists",
      apiKey: "player_assists",
      hasAlternates: true,
      alternateKey: "player_assists_alternate",
      alwaysFetchAlternate: true,
    },
    {
      value: "Power_Play_Points",
      label: "Power Play Points",
      apiKey: "player_power_play_points",
      hasAlternates: true,
      alternateKey: "player_power_play_points_alternate",
      alwaysFetchAlternate: true,
    },
    {
      value: "Blocked_Shots",
      label: "Blocked Shots",
      apiKey: "player_blocked_shots",
      hasAlternates: true,
      alternateKey: "player_blocked_shots_alternate",
      alwaysFetchAlternate: true,
    },
    {
      value: "Total_Saves",
      label: "Total Saves",
      apiKey: "player_total_saves",
      hasAlternates: true,
      alternateKey: "player_total_saves_alternate",
      alwaysFetchAlternate: true,
    },

    {
      value: "First_Goal_Scorer",
      label: "First Goal",
      apiKey: "player_goal_scorer_first",
    },
    {
      value: "Last_Goal_Scorer",
      label: "Last Goal",
      apiKey: "player_goal_scorer_last",
    },
    {
      value: "Anytime_Goal_Scorer",
      label: "Anytime Goal",
      apiKey: "player_goal_scorer_anytime",
    },
  ],
};

// Helper function to get markets for a sport
export function getMarketsForSport(sport: string): SportMarket[] {
  return SPORT_MARKETS[sport] || [];
}

// Market types by sport
export const SUPPORTED_MARKETS: Record<string, string[]> = {
  mlb: [
    // Batter markets
    'home runs',  // Set as first item to be default
    'hits',
    'total bases',
    'rbis',
    'runs',
    'batting strikeouts',
    'batting walks',
    'singles',
    'doubles',
    'triples',
    'hits + runs + rbis',
    'stolen bases',
    // Pitcher markets
    'strikeouts',
    'hits allowed',
    'walks',
    'earned runs',
    'outs',
    'pitcher win'
  ],
  nba: [
    'points', // Set as default
    'rebounds',
    'assists',
    'threes',
    'pra',  // Points + Rebounds + Assists
    'pr',   // Points + Rebounds
    'pa',   // Points + Assists
    'ra',   // Rebounds + Assists
    'blocks',
    'steals',
    'bs',   // Blocks + Steals
    'turnovers',
    'double_double',
    'triple_double'
  ],
  wnba: [
    'points', // Set as default
    'rebounds',
    'assists',
    'threes',
    'pra',  // Points + Rebounds + Assists
    'pr',   // Points + Rebounds
    'pa',   // Points + Assists
    'ra',   // Rebounds + Assists
    'blocks',
    'steals',
    'bs',   // Blocks + Steals
    'turnovers',
    'double_double',
    'triple_double'
  ],
  ncaab: [
    'points', // Set as default
    'rebounds',
    'assists',
    'threes',
    'pra',  // Points + Rebounds + Assists
    'pr',   // Points + Rebounds
    'pa',   // Points + Assists
    'ra',   // Rebounds + Assists
    'blocks',
    'steals',
    'bs',   // Blocks + Steals
    'turnovers',
    'double_double',
    'triple_double'
  ],
  nfl: [
    'anytime touchdown', // Set as default
    'passing yards',
    'rushing yards',
    'receiving yards',
    'touchdowns',
    'receptions',
    'passing touchdowns',
    'rushing touchdowns',
    'receiving touchdowns',
    'interceptions thrown',
    'sacks taken',
    'completions',
    'attempts',
    'carries',
    'targets'
  ],
  ncaaf: [
    'anytime touchdown', // Set as default
    'passing yards',
    'rushing yards',
    'receiving yards',
    'touchdowns',
    'receptions',
    'passing touchdowns',
    'rushing touchdowns',
    'receiving touchdowns',
    'interceptions thrown',
    'sacks taken',
    'completions',
    'attempts',
    'carries',
    'targets'
  ],
  nhl: [
    'anytime goal', // Set as default
    'points',
    'goals',
    'assists',
    'shots on goal',
    'power play points',
    'blocked shots',
    'total saves',
    'first goal',
    'last goal'
  ]
};

// Export supported sports array
export const SUPPORTED_SPORTS = ['mlb', 'nba', 'wnba', 'ncaab', 'nfl', 'ncaaf', 'nhl'] as const;

// Helper function to format market labels with special cases
export function formatMarketLabel(market: string): string {
  // Special case mappings
  const specialCases: Record<string, string> = {
    'rbis': 'RBIs',
    'hits + runs + rbis': 'Hits + Runs + RBIs',
    'pra': 'Points + Rebounds + Assists',
    'pr': 'Points + Rebounds',
    'pa': 'Points + Assists',
    'ra': 'Rebounds + Assists',
    'bs': 'Blocks + Steals',
    'double_double': 'Double Double',
    'triple_double': 'Triple Double'
  };

  if (specialCases[market]) {
    return specialCases[market];
  }

  // Handle markets with + signs
  if (market.includes(' + ')) {
    return market.split(' + ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' + ');
  }

  return market
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper function to get default market for a sport
export function getDefaultMarket(sport: string): string {
  const markets = SUPPORTED_MARKETS[sport] || [];
  if (!markets.length) return '';
  
  // Sport-specific defaults
  switch (sport) {
    case 'mlb':
      return 'home runs';
    case 'nba':
    case 'wnba':
    case 'ncaab':
      return 'points';
    case 'nfl':
    case 'ncaaf':
      return 'anytime touchdown';
    case 'nhl':
      return 'anytime goal';
    default:
      return markets[0];
  }
}

// Helper function to get API key for a market
export function getMarketApiKey(
  sport: string,
  marketValue: string,
  useAlternate: boolean = false
): string {
  const market = getMarketsForSport(sport).find((m) => m.value === marketValue);
  if (!market) return "player_points";

  if (useAlternate && market.hasAlternates && market.alternateKey) {
    return market.alternateKey;
  }

  return market.apiKey;
}
