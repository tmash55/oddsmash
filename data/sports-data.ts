export type Sport = {
  id: string;
  name: string;
  icon?: string; // Optional icon path for image-based icons
  active: boolean;
  apiKey?: string; // Optional API key if different from id
  useImage?: boolean; // Flag to determine if we should use an image or the SportIcon component
};

export type Team = {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  record?: string;
};

export type BettingMarket = {
  id: string;
  type: "spread" | "moneyline" | "total" | "player-prop" | "game-prop";
  name: string;
  selection: string;
  odds: {
    [key: string]: number;
  };
  line?: number;
  player?: string;
  team?: string;
  isSelected?: boolean;
};

export type Game = {
  id: string;
  sportId: string;
  startTime: string;
  status: "scheduled" | "live" | "final";
  homeTeam: Team;
  awayTeam: Team;
  markets: {
    spread: BettingMarket[];
    moneyline: BettingMarket[];
    total: BettingMarket[];
    playerProps?: BettingMarket[];
    gameProps?: BettingMarket[];
  };
  bookmakerData?: { [key: string]: any }; // Added this property to fix the TypeScript error;
};

export type ParlayLeg = {
  id: string;
  gameId: string;
  marketId: string;
  selection: string;
  odds: number;
  sportsbookId: string;
  type: "spread" | "moneyline" | "total" | "player-prop" | "game-prop";
  description: string;
  line?: number;
  sid?: string; // Add this field for sportsbook-specific IDs
  // Add this new field for player props data
  propData?: {
    player: string;
    market: string;
    line: number;
    betType: "Over" | "Under";
    sportId: string;
    sid?: string; // Add sid field for player props too
  };
};

// Updated sports array with API keys matching the Odds API
export const sports: Sport[] = [
  {
    id: "baseball_mlb",
    name: "MLB",
    icon: "/images/sport-league/mlb-logo.png",
    active: true,
    useImage: true,
  },
  {
    id: "basketball_nba",
    name: "NBA",
    icon: "/images/sport-league/nba-logo.png",
    active: true,
    useImage: true,
  },
  {
    id: "basketball_ncaab",
    name: "NCAAB",
    icon: "", // Will use the SportIcon component
    active: true,
    useImage: false,
  },
  {
    id: "icehockey_nhl",
    name: "NHL",
    icon: "/images/sport-league/nhl-logo.png",
    active: true,
    useImage: true,
  },
  {
    id: "americanfootball_nfl",
    name: "NFL",
    icon: "/images/sport-league/nfl-logo.png",
    active: false,
    useImage: true,
  },
];

// Export the sportsbooks array for backward compatibility
// but use the imported allSportsbooks for calculations
export const sportsbooks = [
  {
    id: "draftkings",
    name: "DraftKings",
    logo: "/draftkings-logo.svg",
  },
  {
    id: "fanduel",
    name: "FanDuel",
    logo: "/fanduel-logo.svg",
  },
  {
    id: "betmgm",
    name: "BetMGM",
    logo: "/betmgm-logo.svg",
  },
  {
    id: "caesars",
    name: "Caesars",
    logo: "/caesars-logo.svg",
  },
  {
    id: "pointsbet",
    name: "PointsBet",
    logo: "/pointsbet-logo.svg",
  },
];

// Format odds for display
export function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : odds.toString();
}

// Calculate parlay odds
// Calculate parlay odds
export function calculateParlayOdds(
  legs: ParlayLeg[],
  userSportsbooks: string[] = [],
  games: Game[] = []
): {
  [key: string]: number;
} {
  console.log("calculateParlayOdds - Input legs:", legs);
  console.log("calculateParlayOdds - User sportsbooks:", userSportsbooks);

  const sportsbookOdds: { [key: string]: number } = {};

  // Skip if no legs
  if (legs.length === 0 || games.length === 0) {
    return sportsbookOdds;
  }

  // For each sportsbook, calculate the parlay odds
  userSportsbooks.forEach((sportsbook) => {
    // For each leg, get the odds for this sportsbook
    const legOdds = legs.map((leg) => {
      // Find the game for this leg
      const game = games.find((g) => g.id === leg.gameId);
      if (!game) return 0;

      // Find the market for this leg
      let market: any;
      Object.values(game.markets).forEach((marketGroup) => {
        if (Array.isArray(marketGroup)) {
          const found = marketGroup.find((m) => m.id === leg.marketId);
          if (found) market = found;
        }
      });

      if (!market) return 0;

      // Get the odds for this sportsbook
      const oddsForSportsbook = market.odds?.[sportsbook];

      // If we have odds for this sportsbook, use them
      if (oddsForSportsbook !== undefined) {
        return oddsForSportsbook;
      }

      // If this is the sportsbook that was used to select the leg, use the leg's odds
      if (sportsbook === leg.sportsbookId) {
        return leg.odds;
      }

      // Otherwise, no odds available for this sportsbook
      return 0;
    });

    // Only calculate if we have odds for all legs
    if (legOdds.every((odds) => odds !== 0)) {
      // Convert to decimal odds for multiplication
      const decimalOdds = legOdds.map((odds) => {
        if (odds > 0) {
          return odds / 100 + 1;
        } else {
          return 100 / Math.abs(odds) + 1;
        }
      });

      // Multiply all decimal odds
      const totalDecimalOdds = decimalOdds.reduce((acc, odds) => acc * odds, 1);

      // Convert back to American odds
      let americanOdds;
      if (totalDecimalOdds >= 2) {
        americanOdds = Math.round((totalDecimalOdds - 1) * 100);
      } else {
        americanOdds = Math.round(-100 / (totalDecimalOdds - 1));
      }

      sportsbookOdds[sportsbook] = americanOdds;
    }
  });

  console.log("calculateParlayOdds - Final odds:", sportsbookOdds);

  return sportsbookOdds;
}

// Find best odds for a parlay
export function findBestParlayOdds(parlayOdds: { [key: string]: number }): {
  sportsbook: string;
  odds: number;
} {
  let bestSportsbook = "";
  let bestOdds = Number.NEGATIVE_INFINITY;

  Object.entries(parlayOdds).forEach(([sportsbook, odds]) => {
    if (odds > bestOdds) {
      bestOdds = odds;
      bestSportsbook = sportsbook;
    }
  });

  return { sportsbook: bestSportsbook, odds: bestOdds };
}
