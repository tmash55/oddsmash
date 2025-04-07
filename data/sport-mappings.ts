// Centralized mapping between API sport IDs and URL paths

// API sport IDs (used when communicating with the Odds API)
export const API_SPORT_IDS = {
  NBA: "basketball_nba",
  NCAAB: "basketball_ncaab",
  MLB: "baseball_mlb",
  NHL: "icehockey_nhl",
  NFL: "americanfootball_nfl",
} as const;

// URL paths (used in routes and navigation)
export const URL_PATHS = {
  NBA: "nba",
  NCAAB: "ncaab",
  MLB: "mlb",
  NHL: "nhl",
  NFL: "nfl",
} as const;

// Map from API ID to URL path
export const apiIdToPath: Record<string, string> = {
  [API_SPORT_IDS.NBA]: URL_PATHS.NBA,
  [API_SPORT_IDS.NCAAB]: URL_PATHS.NCAAB,
  [API_SPORT_IDS.MLB]: URL_PATHS.MLB,
  [API_SPORT_IDS.NHL]: URL_PATHS.NHL,
  [API_SPORT_IDS.NFL]: URL_PATHS.NFL,
};

// Map from URL path to API ID
export const pathToApiId: Record<string, string> = {
  [URL_PATHS.NBA]: API_SPORT_IDS.NBA,
  [URL_PATHS.NCAAB]: API_SPORT_IDS.NCAAB,
  [URL_PATHS.MLB]: API_SPORT_IDS.MLB,
  [URL_PATHS.NHL]: API_SPORT_IDS.NHL,
  [URL_PATHS.NFL]: API_SPORT_IDS.NFL,
};

// Helper function to convert API ID to URL path
export function getUrlPath(apiId: string): string {
  return apiIdToPath[apiId] || apiId;
}

// Helper function to convert URL path to API ID
export function getApiId(urlPath: string): string {
  return pathToApiId[urlPath] || urlPath;
}
