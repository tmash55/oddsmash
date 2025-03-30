export type Sport = {
  id: string;
  name: string;
  icon: string;
  active: boolean;
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
};

export const sports: Sport[] = [
  {
    id: "nba",
    name: "NBA",
    icon: "/basketball.svg",
    active: true,
  },
  {
    id: "nfl",
    name: "NFL",
    icon: "/football.svg",
    active: true,
  },
  {
    id: "mlb",
    name: "MLB",
    icon: "/baseball.svg",
    active: true,
  },
  {
    id: "nhl",
    name: "NHL",
    icon: "/hockey.svg",
    active: true,
  },
  {
    id: "soccer",
    name: "Soccer",
    icon: "/soccer.svg",
    active: true,
  },
];

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

// Sample NBA games data
export const nbaGames: Game[] = [
  {
    id: "nba-1",
    sportId: "nba",
    startTime: "2024-04-15T19:00:00Z",
    status: "scheduled",
    homeTeam: {
      id: "bos",
      name: "Boston Celtics",
      abbreviation: "BOS",
      logo: "/placeholder.svg?height=40&width=40",
      record: "64-18",
    },
    awayTeam: {
      id: "mia",
      name: "Miami Heat",
      abbreviation: "MIA",
      logo: "/placeholder.svg?height=40&width=40",
      record: "46-36",
    },
    markets: {
      spread: [
        {
          id: "bos-spread",
          type: "spread",
          name: "Spread",
          selection: "BOS -8.5",
          odds: {
            draftkings: -110,
            fanduel: -110,
            betmgm: -115,
            caesars: -110,
            pointsbet: -108,
          },
          line: -8.5,
          team: "BOS",
        },
        {
          id: "mia-spread",
          type: "spread",
          name: "Spread",
          selection: "MIA +8.5",
          odds: {
            draftkings: -110,
            fanduel: -110,
            betmgm: -105,
            caesars: -110,
            pointsbet: -112,
          },
          line: 8.5,
          team: "MIA",
        },
      ],
      moneyline: [
        {
          id: "bos-ml",
          type: "moneyline",
          name: "Moneyline",
          selection: "BOS",
          odds: {
            draftkings: -380,
            fanduel: -375,
            betmgm: -400,
            caesars: -380,
            pointsbet: -385,
          },
          team: "BOS",
        },
        {
          id: "mia-ml",
          type: "moneyline",
          name: "Moneyline",
          selection: "MIA",
          odds: {
            draftkings: +310,
            fanduel: +300,
            betmgm: +320,
            caesars: +310,
            pointsbet: +305,
          },
          team: "MIA",
        },
      ],
      total: [
        {
          id: "over-total",
          type: "total",
          name: "Total",
          selection: "Over 215.5",
          odds: {
            draftkings: -110,
            fanduel: -110,
            betmgm: -110,
            caesars: -110,
            pointsbet: -110,
          },
          line: 215.5,
        },
        {
          id: "under-total",
          type: "total",
          name: "Total",
          selection: "Under 215.5",
          odds: {
            draftkings: -110,
            fanduel: -110,
            betmgm: -110,
            caesars: -110,
            pointsbet: -110,
          },
          line: 215.5,
        },
      ],
      playerProps: [
        {
          id: "jayson-tatum-pts",
          type: "player-prop",
          name: "Points",
          selection: "Jayson Tatum Over 28.5",
          odds: {
            draftkings: -115,
            fanduel: -110,
            betmgm: -120,
            caesars: -115,
            pointsbet: -110,
          },
          line: 28.5,
          player: "Jayson Tatum",
        },
        {
          id: "jayson-tatum-pts-under",
          type: "player-prop",
          name: "Points",
          selection: "Jayson Tatum Under 28.5",
          odds: {
            draftkings: -105,
            fanduel: -110,
            betmgm: +100,
            caesars: -105,
            pointsbet: -110,
          },
          line: 28.5,
          player: "Jayson Tatum",
        },
        {
          id: "jimmy-butler-pts",
          type: "player-prop",
          name: "Points",
          selection: "Jimmy Butler Over 22.5",
          odds: {
            draftkings: -110,
            fanduel: -115,
            betmgm: -110,
            caesars: -110,
            pointsbet: -115,
          },
          line: 22.5,
          player: "Jimmy Butler",
        },
        {
          id: "jimmy-butler-pts-under",
          type: "player-prop",
          name: "Points",
          selection: "Jimmy Butler Under 22.5",
          odds: {
            draftkings: -110,
            fanduel: -105,
            betmgm: -110,
            caesars: -110,
            pointsbet: -105,
          },
          line: 22.5,
          player: "Jimmy Butler",
        },
      ],
      gameProps: [
        {
          id: "first-basket",
          type: "game-prop",
          name: "First Basket",
          selection: "Jayson Tatum",
          odds: {
            draftkings: +450,
            fanduel: +460,
            betmgm: +450,
            caesars: +440,
            pointsbet: +450,
          },
          player: "Jayson Tatum",
        },
        {
          id: "race-to-20",
          type: "game-prop",
          name: "Race to 20 Points",
          selection: "BOS",
          odds: {
            draftkings: -150,
            fanduel: -155,
            betmgm: -150,
            caesars: -150,
            pointsbet: -155,
          },
          team: "BOS",
        },
      ],
    },
  },
  {
    id: "nba-2",
    sportId: "nba",
    startTime: "2024-04-15T21:30:00Z",
    status: "scheduled",
    homeTeam: {
      id: "den",
      name: "Denver Nuggets",
      abbreviation: "DEN",
      logo: "/placeholder.svg?height=40&width=40",
      record: "57-25",
    },
    awayTeam: {
      id: "lal",
      name: "Los Angeles Lakers",
      abbreviation: "LAL",
      logo: "/placeholder.svg?height=40&width=40",
      record: "47-35",
    },
    markets: {
      spread: [
        {
          id: "den-spread",
          type: "spread",
          name: "Spread",
          selection: "DEN -6.5",
          odds: {
            draftkings: -110,
            fanduel: -110,
            betmgm: -110,
            caesars: -110,
            pointsbet: -110,
          },
          line: -6.5,
          team: "DEN",
        },
        {
          id: "lal-spread",
          type: "spread",
          name: "Spread",
          selection: "LAL +6.5",
          odds: {
            draftkings: -110,
            fanduel: -110,
            betmgm: -110,
            caesars: -110,
            pointsbet: -110,
          },
          line: 6.5,
          team: "LAL",
        },
      ],
      moneyline: [
        {
          id: "den-ml",
          type: "moneyline",
          name: "Moneyline",
          selection: "DEN",
          odds: {
            draftkings: -260,
            fanduel: -255,
            betmgm: -275,
            caesars: -260,
            pointsbet: -265,
          },
          team: "DEN",
        },
        {
          id: "lal-ml",
          type: "moneyline",
          name: "Moneyline",
          selection: "LAL",
          odds: {
            draftkings: +220,
            fanduel: +215,
            betmgm: +225,
            caesars: +220,
            pointsbet: +215,
          },
          team: "LAL",
        },
      ],
      total: [
        {
          id: "over-total-2",
          type: "total",
          name: "Total",
          selection: "Over 226.5",
          odds: {
            draftkings: -110,
            fanduel: -110,
            betmgm: -110,
            caesars: -110,
            pointsbet: -110,
          },
          line: 226.5,
        },
        {
          id: "under-total-2",
          type: "total",
          name: "Total",
          selection: "Under 226.5",
          odds: {
            draftkings: -110,
            fanduel: -110,
            betmgm: -110,
            caesars: -110,
            pointsbet: -110,
          },
          line: 226.5,
        },
      ],
      playerProps: [
        {
          id: "nikola-jokic-pts",
          type: "player-prop",
          name: "Points",
          selection: "Nikola Jokic Over 26.5",
          odds: {
            draftkings: -115,
            fanduel: -110,
            betmgm: -120,
            caesars: -115,
            pointsbet: -110,
          },
          line: 26.5,
          player: "Nikola Jokic",
        },
        {
          id: "lebron-james-pts",
          type: "player-prop",
          name: "Points",
          selection: "LeBron James Over 25.5",
          odds: {
            draftkings: -110,
            fanduel: -115,
            betmgm: -110,
            caesars: -110,
            pointsbet: -115,
          },
          line: 25.5,
          player: "LeBron James",
        },
      ],
      gameProps: [
        {
          id: "first-basket-2",
          type: "game-prop",
          name: "First Basket",
          selection: "Nikola Jokic",
          odds: {
            draftkings: +450,
            fanduel: +460,
            betmgm: +450,
            caesars: +440,
            pointsbet: +450,
          },
          player: "Nikola Jokic",
        },
      ],
    },
  },
];

// Sample NFL games data
export const nflGames: Game[] = [
  {
    id: "nfl-1",
    sportId: "nfl",
    startTime: "2024-04-16T20:20:00Z",
    status: "scheduled",
    homeTeam: {
      id: "kc",
      name: "Kansas City Chiefs",
      abbreviation: "KC",
      logo: "/placeholder.svg?height=40&width=40",
      record: "14-3",
    },
    awayTeam: {
      id: "bal",
      name: "Baltimore Ravens",
      abbreviation: "BAL",
      logo: "/placeholder.svg?height=40&width=40",
      record: "13-4",
    },
    markets: {
      spread: [
        {
          id: "kc-spread",
          type: "spread",
          name: "Spread",
          selection: "KC -3.5",
          odds: {
            draftkings: -110,
            fanduel: -110,
            betmgm: -110,
            caesars: -110,
            pointsbet: -110,
          },
          line: -3.5,
          team: "KC",
        },
        {
          id: "bal-spread",
          type: "spread",
          name: "Spread",
          selection: "BAL +3.5",
          odds: {
            draftkings: -110,
            fanduel: -110,
            betmgm: -110,
            caesars: -110,
            pointsbet: -110,
          },
          line: 3.5,
          team: "BAL",
        },
      ],
      moneyline: [
        {
          id: "kc-ml",
          type: "moneyline",
          name: "Moneyline",
          selection: "KC",
          odds: {
            draftkings: -180,
            fanduel: -175,
            betmgm: -185,
            caesars: -180,
            pointsbet: -180,
          },
          team: "KC",
        },
        {
          id: "bal-ml",
          type: "moneyline",
          name: "Moneyline",
          selection: "BAL",
          odds: {
            draftkings: +150,
            fanduel: +145,
            betmgm: +155,
            caesars: +150,
            pointsbet: +150,
          },
          team: "BAL",
        },
      ],
      total: [
        {
          id: "over-total-nfl",
          type: "total",
          name: "Total",
          selection: "Over 49.5",
          odds: {
            draftkings: -110,
            fanduel: -110,
            betmgm: -110,
            caesars: -110,
            pointsbet: -110,
          },
          line: 49.5,
        },
        {
          id: "under-total-nfl",
          type: "total",
          name: "Total",
          selection: "Under 49.5",
          odds: {
            draftkings: -110,
            fanduel: -110,
            betmgm: -110,
            caesars: -110,
            pointsbet: -110,
          },
          line: 49.5,
        },
      ],
      playerProps: [
        {
          id: "mahomes-passing-yds",
          type: "player-prop",
          name: "Passing Yards",
          selection: "Patrick Mahomes Over 275.5",
          odds: {
            draftkings: -115,
            fanduel: -110,
            betmgm: -120,
            caesars: -115,
            pointsbet: -110,
          },
          line: 275.5,
          player: "Patrick Mahomes",
        },
        {
          id: "lamar-passing-yds",
          type: "player-prop",
          name: "Passing Yards",
          selection: "Lamar Jackson Over 230.5",
          odds: {
            draftkings: -110,
            fanduel: -115,
            betmgm: -110,
            caesars: -110,
            pointsbet: -115,
          },
          line: 230.5,
          player: "Lamar Jackson",
        },
      ],
      gameProps: [
        {
          id: "first-td",
          type: "game-prop",
          name: "First Touchdown",
          selection: "Travis Kelce",
          odds: {
            draftkings: +650,
            fanduel: +660,
            betmgm: +650,
            caesars: +640,
            pointsbet: +650,
          },
          player: "Travis Kelce",
        },
      ],
    },
  },
];

// Function to get games by sport
export function getGamesBySport(sportId: string): Game[] {
  switch (sportId) {
    case "nba":
      return nbaGames;
    case "nfl":
      return nflGames;
    default:
      return [];
  }
}

// Format odds for display
export function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : odds.toString();
}

// Calculate parlay odds
export function calculateParlayOdds(legs: ParlayLeg[]): {
  [key: string]: number;
} {
  const sportsbookOdds: { [key: string]: number } = {};

  sportsbooks.forEach((sportsbook) => {
    let decimalOdds = 1;

    legs.forEach((leg) => {
      const americanOdds = leg.odds;
      let decimal = 0;

      if (americanOdds > 0) {
        decimal = americanOdds / 100 + 1;
      } else {
        decimal = 100 / Math.abs(americanOdds) + 1;
      }

      decimalOdds *= decimal;
    });

    // Convert back to American odds
    let americanOdds = 0;
    if (decimalOdds >= 2) {
      americanOdds = Math.round((decimalOdds - 1) * 100);
    } else {
      americanOdds = Math.round(-100 / (decimalOdds - 1));
    }

    sportsbookOdds[sportsbook.id] = americanOdds;
  });

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
