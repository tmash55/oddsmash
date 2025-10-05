import type { Game, ParlayLeg } from "@/data/sports-data";

// Interface for comparing odds across sportsbooks
export interface OddsComparison {
  marketType: string;
  marketName: string;
  selection: string;
  line?: number;
  odds: {
    [sportsbook: string]: number;
  };
  bestOdds: {
    sportsbook: string;
    value: number;
  };
}

// Function to compare odds for a single market across sportsbooks
export function compareMarketOdds(
  game: Game,
  marketId: string,
  sportsbooks: string[]
): OddsComparison | null {
  // Find the market
  let market: any;
  let marketType = "";

  Object.entries(game.markets).forEach(([type, markets]) => {
    if (Array.isArray(markets)) {
      const found = markets.find((m) => m.id === marketId);
      if (found) {
        market = found;
        marketType = type;
      }
    }
  });

  if (!market) return null;

  // Get odds for each sportsbook
  const oddsMap: { [sportsbook: string]: number } = {};
  let bestSportsbook = "";
  let bestOddsValue = Number.NEGATIVE_INFINITY;

  sportsbooks.forEach((sportsbook) => {
    if (market.odds && market.odds[sportsbook] !== undefined) {
      oddsMap[sportsbook] = market.odds[sportsbook];

      // Track best odds
      if (market.odds[sportsbook] > bestOddsValue) {
        bestOddsValue = market.odds[sportsbook];
        bestSportsbook = sportsbook;
      }
    }
  });

  return {
    marketType,
    marketName: market.name || marketType,
    selection: market.selection,
    line: market.line,
    odds: oddsMap,
    bestOdds: {
      sportsbook: bestSportsbook,
      value: bestOddsValue,
    },
  };
}

// Function to compare odds for a parlay across sportsbooks
export function compareParlayOdds(
  legs: ParlayLeg[],
  games: Game[],
  sportsbooks: string[]
): {
  totalOdds: { [sportsbook: string]: number };
  bestSportsbook: string;
  bestOddsValue: number;
} {
  // Calculate parlay odds for each sportsbook
  const parlayOdds: { [sportsbook: string]: number } = {};

  sportsbooks.forEach((sportsbook) => {
    // Convert American odds to decimal for multiplication
    const decimalOdds = legs.map((leg) => {
      // Find the game and market for this leg
      const game = games.find((g) => g.id === leg.gameId);
      if (!game) return 1;

      let market: any;
      Object.values(game.markets).forEach((markets) => {
        if (Array.isArray(markets)) {
          const found = markets.find((m) => m.id === leg.marketId);
          if (found) market = found;
        }
      });

      if (!market || !market.odds || market.odds[sportsbook] === undefined) {
        return 1;
      }

      const americanOdds = market.odds[sportsbook];

      // Convert to decimal
      if (americanOdds > 0) {
        return americanOdds / 100 + 1;
      } else {
        return 100 / Math.abs(americanOdds) + 1;
      }
    });

    // Multiply all decimal odds
    const totalDecimalOdds = decimalOdds.reduce((acc, odds) => acc * odds, 1);

    // Convert back to American
    let americanOdds;
    if (totalDecimalOdds >= 2) {
      americanOdds = Math.round((totalDecimalOdds - 1) * 100);
    } else {
      americanOdds = Math.round(-100 / (totalDecimalOdds - 1));
    }

    parlayOdds[sportsbook] = americanOdds;
  });

  // Find the best sportsbook
  let bestSportsbook = "";
  let bestOddsValue = Number.NEGATIVE_INFINITY;

  Object.entries(parlayOdds).forEach(([sportsbook, odds]) => {
    if (odds > bestOddsValue) {
      bestOddsValue = odds;
      bestSportsbook = sportsbook;
    }
  });

  return {
    totalOdds: parlayOdds,
    bestSportsbook,
    bestOddsValue,
  };
}

// Helper function to calculate potential payout for a parlay
export function calculateParlayPayout(
  legs: ParlayLeg[],
  wagerAmount: number,
  sportsbook: string,
  games: Game[]
): number {
  // Get the odds for each leg from the specified sportsbook
  const decimalOdds = legs.map((leg) => {
    // Find the game and market for this leg
    const game = games.find((g) => g.id === leg.gameId);
    if (!game) return 1;

    let market: any;
    Object.values(game.markets).forEach((markets) => {
      if (Array.isArray(markets)) {
        const found = markets.find((m) => m.id === leg.marketId);
        if (found) market = found;
      }
    });

    if (!market || !market.odds || market.odds[sportsbook] === undefined) {
      return 1;
    }

    const americanOdds = market.odds[sportsbook];

    // Convert to decimal
    if (americanOdds > 0) {
      return americanOdds / 100 + 1;
    } else {
      return 100 / Math.abs(americanOdds) + 1;
    }
  });

  // Multiply all decimal odds
  const totalDecimalOdds = decimalOdds.reduce((acc, odds) => acc * odds, 1);

  // Calculate payout
  return wagerAmount * totalDecimalOdds;
}
