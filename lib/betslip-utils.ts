import { SPORTSBOOK_ID_MAP } from "./constants/sportsbook-mappings";
import { getMarketsForSport } from "./constants/markets";

// Map sport keys to API format
const SPORT_API_KEYS: Record<string, string> = {
  nba: "basketball_nba",
  wnba: "basketball_wnba",
  ncaab: "basketball_ncaab",
  nfl: "football_nfl",
  ncaaf: "football_ncaaf",
  mlb: "baseball_mlb",
  nhl: "icehockey_nhl"
};

interface BetslipSelectionParams {
  event_id: string;
  sport_key: string;
  market: string;
  market_display?: string;
  bet_type: "over" | "under";
  player_name: string;
  player_id: string;
  player_team: string;
  line: number;
  commence_time: string;
  home_team: string;
  away_team: string;
  odds_data: Record<string, any>;
}

/**
 * Creates a betslip selection with proper market keys based on sport
 */
export function createBetslipSelection(params: BetslipSelectionParams) {
  const {
    event_id,
    sport_key,
    market,
    market_display,
    bet_type,
    player_name,
    player_id,
    player_team,
    line,
    commence_time,
    home_team,
    away_team,
    odds_data
  } = params;

  // Get the correct API sport key
  const apiSportKey = SPORT_API_KEYS[sport_key.toLowerCase()] || sport_key;

  // Find the correct market key from our markets configuration
  const markets = getMarketsForSport(apiSportKey);
  // First try to find by value, then by apiKey
  const marketConfig = markets.find(m => m.value === market) || 
                      markets.find(m => m.apiKey === market);
  
  if (!marketConfig) {
    console.warn(`[BetslipUtils] Market config not found for ${market} in ${apiSportKey}`);
  }
  
  // Get the appropriate market key (combining base and alternate if available)
  const marketKey = marketConfig ? (
    marketConfig.hasAlternates ? 
    `${marketConfig.apiKey},${marketConfig.alternateKey}` : 
    marketConfig.apiKey
  ) : market;

  // Always use the proper display label from market config, fallback to passed display or default
  const displayLabel = marketConfig?.label || market_display || "Points";

  // Map the odds data to use standardized sportsbook IDs
  const mappedOddsData = Object.entries(odds_data).reduce((acc, [book, odds]) => {
    const standardizedId = SPORTSBOOK_ID_MAP[book.toLowerCase()];
    if (standardizedId) {
      acc[standardizedId] = odds;
    }
    return acc;
  }, {} as Record<string, any>);

  return {
    event_id,
    sport_key: apiSportKey,
    market_key: marketKey,
    market_display: displayLabel, // Always prioritize proper market config label
    bet_type: "player_prop",
    market_type: "player_prop",
    selection: bet_type === "over" ? "Over" : "Under",
    player_name,
    player_id,
    player_team,
    line,
    commence_time,
    home_team,
    away_team,
    odds_data: mappedOddsData
  };
} 