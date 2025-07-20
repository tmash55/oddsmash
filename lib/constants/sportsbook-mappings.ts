// Sportsbook ID mappings for normalization
export const SPORTSBOOK_ID_MAP: Record<string, string> = {
  // ESPN Bet variations
  espnbet: "espn bet",
  espn_bet: "espn bet",
  "espn-bet": "espn bet",
  espn: "espn bet",
  "espn bet": "espn bet",

  // Hard Rock variations
  hardrockbet: "hard rock bet",
  hard_rock: "hard rock bet",
  "hard-rock": "hard rock bet",
  hardrock: "hard rock bet",
  "hard rock bet": "hard rock bet",

  // Bally Bet variations
  ballybet: "bally bet",
  bally_bet: "bally bet",
  "bally-bet": "bally bet",
  bally: "bally bet",
  "bally bet": "bally bet",

  // Caesars/William Hill variations
  williamhill_us: "caesars",
  "william hill": "caesars",
  williamhill: "caesars",
  caesars: "caesars",

  // BetMGM variations
  "bet mgm": "betmgm",
  mgm: "betmgm",
  betmgm: "betmgm",

  // DraftKings variations
  draftkings: "draftkings",
  dk: "draftkings",

  // FanDuel variations
  fanduel: "fanduel",
  fd: "fanduel",

  // BetRivers variations
  betrivers: "betrivers",
  rivers: "betrivers",
  bet_rivers: "betrivers",

  // Fanatics variations
  fanatics: "fanatics",
  fanatics_sportsbook: "fanatics",

  // Pinnacle variations
  pinnacle: "pinnacle",
  pin: "pinnacle",

  // Others
  novig: "novig",
  superbook: "superbook",
  bet365: "bet365",
}

// Reverse mapping for logo lookups
export const REVERSE_SPORTSBOOK_MAP: Record<string, string> = {
  "espn bet": "espnbet",
  "hard rock bet": "hardrockbet",
  "bally bet": "ballybet",
  "caesars": "williamhill_us", // Updated to match the logo ID
  ballybet: "ballybet",
  hardrockbet: "hardrockbet",
  betmgm: "betmgm",
  draftkings: "draftkings",
  fanduel: "fanduel",
  betrivers: "betrivers",
  fanatics: "fanatics",
  pinnacle: "pinnacle",
  novig: "novig",
  superbook: "superbook",
  bet365: "bet365",
}

// Get normalized sportsbook ID
export function getNormalizedBookmakerId(bookId: string): string {
  return SPORTSBOOK_ID_MAP[bookId.toLowerCase()] || bookId.toLowerCase()
}

// Get logo ID for a sportsbook
export function getBookmakerLogoId(bookId: string): string {
  const normalizedId = getNormalizedBookmakerId(bookId)
  return REVERSE_SPORTSBOOK_MAP[normalizedId] || normalizedId
} 