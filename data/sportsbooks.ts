export interface Sportsbook {
  id: string;
  name: string;
  logo?: string;
  regions?: string[];
  isActive?: boolean;
  url?: string; // Add URL property
}

export const sportsbooks: Sportsbook[] = [
  {
    id: "draftkings",
    name: "DraftKings",
    logo: "/placeholder.svg?height=24&width=24",
    regions: ["us"],
    isActive: true,
    url: "https://sportsbook.draftkings.com/",
  },
  {
    id: "fanduel",
    name: "FanDuel",
    logo: "/placeholder.svg?height=24&width=24",
    regions: ["us"],
    isActive: true,
    url: "https://sportsbook.fanduel.com/",
  },
  {
    id: "betmgm",
    name: "BetMGM",
    logo: "/placeholder.svg?height=24&width=24",
    regions: ["us"],
    isActive: true,
    url: "https://sports.betmgm.com/",
  },

  {
    id: "pointsbet",
    name: "PointsBet",
    logo: "/placeholder.svg?height=24&width=24",
    regions: ["us"],
    isActive: true,
    url: "https://pointsbet.com/",
  },
  {
    id: "williamhill_us",
    name: "Caesars",
    logo: "/placeholder.svg?height=24&width=24",
    regions: ["us"],
    isActive: true,
    url: "https://www.williamhill.com/us/",
  },
  {
    id: "espnbet",
    name: "ESPN BET",
    logo: "/placeholder.svg?height=24&width=24",
    regions: ["us"],
    isActive: true,
    url: "https://espnbet.com/",
  },
  {
    id: "fanatics",
    name: "Fanatics",
    logo: "/placeholder.svg?height=24&width=24",
    regions: ["us"],
    isActive: true,
    url: "https://sportsbook.fanatics.com/",
  },
  {
    id: "bet365",
    name: "Bet365",
    logo: "/placeholder.svg?height=24&width=24",
    regions: ["us", "uk", "eu"],
    isActive: true,
    url: "https://www.bet365.com/",
  },
  {
    id: "unibet_us",
    name: "Unibet",
    logo: "/placeholder.svg?height=24&width=24",
    regions: ["us"],
    isActive: true,
    url: "https://unibet.com/",
  },
];
