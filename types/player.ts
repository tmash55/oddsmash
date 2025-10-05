export type Player = {
  personId: string;
  name: string;
  matchup: string;
  points: number;
  rebounds: number;
  assists: number;
  pra: number;
  gameStatus: string;
  gameClock: string;
  period: number;
  gameDate: string;
  oncourt: boolean;
  starred: boolean; // New property
};

// Points Only Player type
export type PointsPlayer = {
  personId: string;
  name: string;
  matchup: string;
  points: number;
  gameStatus: string;
  gameClock: string;
  period: number;
  gameDate: string;
  oncourt: boolean;
};
