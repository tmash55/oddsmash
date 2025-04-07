export interface Sportsbook {
  id: string;
  name: string;
  logo: string;
  logo_long: string; // Added new field for long/wide logos
  regions?: string[];
  isActive?: boolean;
  url?: string;
  requiresState?: boolean; // Whether this sportsbook requires state in URL
}

export const sportsbooks: Sportsbook[] = [
  {
    id: "draftkings",
    name: "DraftKings",
    logo: "/images/sports-books/draftkings.png",
    logo_long: "/images/sports-books/draftkings_long.png",
    regions: ["us"],
    isActive: true,
    url: "https://sportsbook.draftkings.com/",
    requiresState: false,
  },
  {
    id: "fanduel",
    name: "FanDuel",
    logo: "/images/sports-books/fanduel.png",
    logo_long: "/images/sports-books/fanduel_long.png",
    regions: ["us"],
    isActive: true,
    url: "https://sportsbook.fanduel.com/",
    requiresState: false,
  },
  {
    id: "betmgm",
    name: "BetMGM",
    logo: "/images/sports-books/betmgm.png",
    logo_long: "/images/sports-books/betmgm_long.png",
    regions: ["us"],
    isActive: true,
    url: "https://sports.{state}.betmgm.com/en/sports",
    requiresState: true,
  },
  {
    id: "betrivers",
    name: "BetRivers",
    logo: "/images/sports-books/betrivers.png",
    logo_long: "/images/sports-books/betrivers_long.png",
    regions: ["us"],
    isActive: true,
    url: "https://www.betrivers.com/",
    requiresState: true,
  },
  {
    id: "williamhill_us",
    name: "Caesars",
    logo: "/images/sports-books/caesars.png",
    logo_long: "/images/sports-books/caesars_long.png",
    regions: ["us"],
    isActive: true,
    url: "https://www.caesars.com/sportsbook-and-casino",
    requiresState: true,
  },
  {
    id: "espnbet",
    name: "ESPN BET",
    logo: "/images/sports-books/espnbet.png",
    logo_long: "/images/sports-books/espnbet_long.png",
    regions: ["us2"],
    isActive: true,
    url: "https://espnbet.com/",
    requiresState: false,
  },
  {
    id: "fanatics",
    name: "Fanatics",
    logo: "/images/sports-books/fanatics.png",
    logo_long: "/images/sports-books/fanatics_long.png",
    regions: ["us"],
    isActive: true,
    url: "https://sportsbook.fanatics.com/",
    requiresState: false,
  },
  {
    id: "hardrockbet",
    name: "Hard Rock Bet",
    logo: "/images/sports-books/hardrockbet.png",
    logo_long: "/images/sports-books/hardrockbet_long.png",
    regions: ["u2"],
    isActive: true,
    url: "https://www.hardrock.bet/",
    requiresState: true,
  },
  {
    id: "pinnacle",
    name: "Pinnacle",
    logo: "/images/sports-books/pinnacle.png",
    logo_long: "/images/sports-books/pinnacle_long.png",
    regions: ["eu"],
    isActive: true,
    url: "https://www.pinnacle.com/en/",
    requiresState: false,
  },
];
