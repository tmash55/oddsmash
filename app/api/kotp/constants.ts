// Redis cache keys and TTLs
export const GAMELOG_CACHE_KEY = "kotp_playoff_game_logs";
export const LEADERBOARD_CACHE_KEY = "kotp_leaderboard";
export const SCOREBOARD_CACHE_KEY = "kotp_scoreboard";
export const CACHE_TTL = 60 * 5; // 5 minutes in seconds
export const SCOREBOARD_CACHE_TTL = 60; // 1 minute for more frequent updates

// Types
export type PlayerGameLog = {
  playerId: string;
  playerName: string;
  teamAbbreviation: string;
  teamId: string;
  gameId: string;
  gameDate: string;
  matchup: string;
  points: number;
  winLoss: string;
};

export type SeriesRecord = {
  wins: number;
  losses: number;
  eliminated: boolean;
  advanced: boolean;
}; 