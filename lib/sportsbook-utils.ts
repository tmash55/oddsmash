// Map of sportsbook name variations to standardized IDs
const sportsBookIdMap: Record<string, string> = {
  // DraftKings variations
  'draftkings': 'draftkings',
  'dk': 'draftkings',
  'draft kings': 'draftkings',
  'draft_kings': 'draftkings',
  'DraftKings': 'draftkings',
  'DRAFTKINGS': 'draftkings',

  // FanDuel variations
  'fanduel': 'fanduel',
  'fan duel': 'fanduel',
  'fd': 'fanduel',
  'FanDuel': 'fanduel',
  'FANDUEL': 'fanduel',

  // BetMGM variations
  'betmgm': 'betmgm',
  'bet mgm': 'betmgm',
  'mgm': 'betmgm',
  'BetMGM': 'betmgm',
  'BETMGM': 'betmgm',

  // Caesars variations
  'caesars': 'williamhill_us',
  'caesar': 'williamhill_us',
  'williamhill': 'williamhill_us',
  'william hill': 'williamhill_us',
  'wh': 'williamhill_us',
  'Caesars': 'williamhill_us',
  'CAESARS': 'williamhill_us',

  // ESPN BET variations
  'espn bet': 'espnbet',
  'espnbet': 'espnbet',
  'espn': 'espnbet',
  'ESPN BET': 'espnbet',
  'ESPNBET': 'espnbet',

  // Hard Rock Bet variations
  'hardrockbet': 'hardrockbet',
  'hard rock bet': 'hardrockbet',
  'hardrock': 'hardrockbet',
  'hard rock': 'hardrockbet',
  'Hard Rock Bet': 'hardrockbet',
  'HARDROCKBET': 'hardrockbet',

  // Fanatics variations
  'fanatics': 'fanatics',
  'fanatics sportsbook': 'fanatics',
  'Fanatics': 'fanatics',
  'FANATICS': 'fanatics',

  // BetRivers variations
  'betrivers': 'betrivers',
  'bet rivers': 'betrivers',
  'rivers': 'betrivers',
  'BetRivers': 'betrivers',
  'BETRIVERS': 'betrivers',

  // Novig variations
  'novig': 'novig',
  'no vig': 'novig',
  'Novig': 'novig',
  'NOVIG': 'novig',

  // Pinnacle variations
  'pinnacle': 'pinnacle',
  'pin': 'pinnacle',
  'Pinnacle': 'pinnacle',
  'PINNACLE': 'pinnacle',

  // Bally Bet variations
  'bally bet': 'ballybet',
  'ballybet': 'ballybet',
  'bally': 'ballybet',
  'Bally Bet': 'ballybet',
  'BALLYBET': 'ballybet',

  // Legacy mappings
  'pointsbet': 'pb',
  'points bet': 'pb',
  'pb': 'pb',
  'wynn': 'wynn',
  'wynnbet': 'wynn',
  'unibet': 'uni',
  'uni': 'uni',
  'barstool': 'bar',
  'bar': 'bar',
  'twinspires': 'twin',
  'twin': 'twin',
  'superbook': 'super',
  'super': 'super',
  'bet365': '365',
  '365': '365'
}

/**
 * Convert a sportsbook name to its standardized ID
 */
export function getStandardizedSportsbookId(name: string): string {
  if (!name) return 'unknown'
  
  const normalized = name.toLowerCase().trim()
  return sportsBookIdMap[normalized] || normalized
}

/**
 * Get the properly formatted display name for a sportsbook
 */
export function getSportsbookDisplayName(name: string): string {
  if (!name) return 'Unknown'
  
  // Map of lowercase sportsbook keys to proper display names
  const displayNameMap: Record<string, string> = {
    'draftkings': 'DraftKings',
    'fanduel': 'FanDuel',
    'betmgm': 'BetMGM',
    'caesars': 'Caesars',
    'williamhill_us': 'Caesars',
    'espn bet': 'ESPN BET',
    'espnbet': 'ESPN BET',
    'hard rock bet': 'Hard Rock Bet',
    'hardrockbet': 'Hard Rock Bet',
    'fanatics': 'Fanatics',
    'betrivers': 'BetRivers',
    'novig': 'Novig',
    'pinnacle': 'Pinnacle',
    'pointsbet': 'PointsBet',
    'barstool': 'Barstool',
    'wynn': 'WynnBET',
    'wynnbet': 'WynnBET',
    'unibet': 'Unibet',
    'bet365': 'bet365',
    'foxbet': 'FOX Bet',
    'superbook': 'SuperBook',
    'twinspires': 'TwinSpires'
  }

  const normalized = name.toLowerCase().trim()
  return displayNameMap[normalized] || name
} 