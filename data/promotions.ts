export interface Promotion {
  id: string;
  title: string;
  sportsbook: string;
  category: string;
  value: string;
  description: string;
  date: Date;
  sports?: string[];
  code?: string;
  terms?: string;
}

export interface Sportsbook {
  id: string;
  name: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
}

export const sportsbooks: Sportsbook[] = [
  {
    id: "draftkings",
    name: "DraftKings",
    logo: "/draftkings-logo.svg",
    primaryColor: "#1AA033",
    secondaryColor: "#000000",
  },
  {
    id: "fanduel",
    name: "FanDuel",
    logo: "/fanduel-logo.svg",
    primaryColor: "#1C74B4",
    secondaryColor: "#FFFFFF",
  },
  {
    id: "betmgm",
    name: "BetMGM",
    logo: "/betmgm-logo.svg",
    primaryColor: "#D4AF37",
    secondaryColor: "#000000",
  },
  {
    id: "caesars",
    name: "Caesars",
    logo: "/caesars-logo.svg",
    primaryColor: "#B4975A",
    secondaryColor: "#000000",
  },
  {
    id: "pointsbet",
    name: "PointsBet",
    logo: "/pointsbet-logo.svg",
    primaryColor: "#E12626",
    secondaryColor: "#172B4D",
  },
  {
    id: "barstool",
    name: "Barstool",
    logo: "/barstool-logo.svg",
    primaryColor: "#000000",
    secondaryColor: "#FFFFFF",
  },
];

export const promotions: Promotion[] = [
  {
    id: "1",
    title: "DraftKings NBA Playoffs Boost",
    sportsbook: "draftkings",
    category: "odds-boost",
    value: "+25%",
    description: "Get a 25% odds boost on any NBA Playoffs bet.",
    date: new Date(2024, 3, 15),
    sports: ["NBA"],
    code: "NBA25",
    terms: "Max bet $25. One per customer.",
  },
  {
    id: "2",
    title: "FanDuel Risk-Free First Bet",
    sportsbook: "fanduel",
    category: "risk-free",
    value: "$1,000",
    description: "Place your first bet risk-free up to $1,000.",
    date: new Date(2024, 3, 10),
    terms: "New customers only. Refund issued as site credit.",
  },
  {
    id: "3",
    title: "BetMGM Deposit Match",
    sportsbook: "betmgm",
    category: "deposit-match",
    value: "100% up to $500",
    description: "Get a 100% deposit match up to $500.",
    date: new Date(2024, 4, 1),
    terms: "New customers only. Minimum deposit $10.",
  },
  {
    id: "4",
    title: "Caesars Free Bet Friday",
    sportsbook: "caesars",
    category: "free-bet",
    value: "$10",
    description: "Get a $10 free bet every Friday.",
    date: new Date(2024, 3, 12),
    sports: ["NFL", "NBA", "MLB"],
    terms: "Opt-in required. Minimum odds -200.",
  },
  {
    id: "5",
    title: "PointsBet Parlay Insurance",
    sportsbook: "pointsbet",
    category: "parlay-insurance",
    value: "Up to $25",
    description: "Get your stake back if one leg of your parlay loses.",
    date: new Date(2024, 3, 18),
    sports: ["NHL"],
    terms: "Minimum 4 legs. Minimum odds -200 per leg.",
  },
  {
    id: "6",
    title: "Barstool Referral Bonus",
    sportsbook: "barstool",
    category: "referral",
    value: "$50",
    description: "Refer a friend and get a $50 bonus.",
    date: new Date(2024, 4, 5),
    terms: "Referred friend must deposit and wager $50.",
  },
  {
    id: "7",
    title: "DraftKings MLB HR Boost",
    sportsbook: "draftkings",
    category: "odds-boost",
    value: "+10%",
    description: "Get a 10% odds boost on any MLB Home Run bet.",
    date: new Date(2024, 3, 22),
    sports: ["MLB"],
    code: "MLBHR",
    terms: "Max bet $50. One per customer.",
  },
  {
    id: "8",
    title: "FanDuel No Sweat Bet",
    sportsbook: "fanduel",
    category: "risk-free",
    value: "$5",
    description: "Place a no sweat bet up to $5.",
    date: new Date(2024, 3, 29),
    terms: "New customers only. Refund issued as site credit.",
  },
];

export function getPromotionsForMonth(
  year: number,
  month: number
): Promotion[] {
  return promotions.filter(
    (promotion) =>
      promotion.date.getFullYear() === year &&
      promotion.date.getMonth() === month
  );
}

export function getSportsbook(sportsbookId: string): Sportsbook | undefined {
  return sportsbooks.find((sportsbook) => sportsbook.id === sportsbookId);
}
