// Comprehensive team name to abbreviation mapping
export const teamNameToAbbreviation: Record<string, string> = {
  "New York Yankees": "NYY",
  "New York Mets": "NYM",
  "Boston Red Sox": "BOS",
  "Los Angeles Dodgers": "LAD",
  "Los Angeles Angels": "LAA",
  "Chicago Cubs": "CHC",
  "Chicago White Sox": "CHW",
  "Milwaukee Brewers": "MIL",
  "Atlanta Braves": "ATL",
  "Houston Astros": "HOU",
  "Philadelphia Phillies": "PHI",
  "San Francisco Giants": "SF",
  "San Diego Padres": "SD",
  "Toronto Blue Jays": "TOR",
  "Texas Rangers": "TEX",
  "Cleveland Guardians": "CLE",
  "Detroit Tigers": "DET",
  "Minnesota Twins": "MIN",
  "Kansas City Royals": "KC",
  "Colorado Rockies": "COL",
  "Arizona Diamondbacks": "ARI",
  "Seattle Mariners": "SEA",
  "Tampa Bay Rays": "TB",
  "Miami Marlins": "MIA",
  "Baltimore Orioles": "BAL",
  "Washington Nationals": "WSH",
  "Pittsburgh Pirates": "PIT",
  "Cincinnati Reds": "CIN",
  "Oakland Athletics": "OAK",
  "St. Louis Cardinals": "STL",
}

// Function to get team abbreviation from full name
export function getTeamAbbreviation(teamName: string | undefined): string {
  if (!teamName) return "N/A"
  return teamNameToAbbreviation[teamName] || teamName.substring(0, 3).toUpperCase()
}

// Comprehensive team abbreviation variations mapping
export const teamAbbreviationMap: Record<string, string> = {
  // Arizona Diamondbacks variations
  ARI: "AZ", // File is AZ.svg, not ARI.svg
  ARIZONA: "AZ",
  DIAMONDBACKS: "AZ",
  ARZ: "AZ",
  ARIZ: "AZ",

  // Oakland Athletics variations
  AT: "OAK",
  ATH: "OAK",
  ATHLETICS: "OAK",
  A: "OAK",

  // Chicago variations
  CHI: "CHC", // Default to Cubs, but this might need game context
  CWS: "CHW", // Chicago White Sox alternative

  // Kansas City Royals variations
  KCR: "KC",
  ROYALS: "KC",

  // Los Angeles variations
  LAD: "LAD", // Dodgers
  LAA: "LAA", // Angels
  ANGELS: "LAA",
  DODGERS: "LAD",

  // San Diego Padres variations
  SDP: "SD",
  PADRES: "SD",

  // San Francisco Giants variations
  SFG: "SF",
  GIANTS: "SF",

  // Tampa Bay Rays variations
  TBR: "TB",
  RAYS: "TB",

  // Washington Nationals variations
  WAS: "WSH",
  NATIONALS: "WSH",

  // New York variations
  YANKEES: "NYY",
  METS: "NYM",

  // Boston Red Sox variations
  REDSOX: "BOS",
  RED_SOX: "BOS",

  // Other common variations
  BRAVES: "ATL",
  ORIOLES: "BAL",
  CUBS: "CHC",
  WHITESOX: "CHW",
  WHITE_SOX: "CHW",
  REDS: "CIN",
  GUARDIANS: "CLE",
  ROCKIES: "COL",
  TIGERS: "DET",
  ASTROS: "HOU",
  ROYALS: "KC",
  MARLINS: "MIA",
  BREWERS: "MIL",
  TWINS: "MIN",
  PHILLIES: "PHI",
  PIRATES: "PIT",
  MARINERS: "SEA",
  CARDINALS: "STL",
  RANGERS: "TEX",
  BLUEJAYS: "TOR",
  BLUE_JAYS: "TOR",
}

// Function to get the correct file name for a team abbreviation
export function getTeamLogoFilename(abbr: string): string {
  if (!abbr) return "default"
  const upperAbbr = abbr.toUpperCase()
  return teamAbbreviationMap[upperAbbr] || abbr
}

// Function to standardize team abbreviations for logo lookup
export function getStandardAbbreviation(abbr: string): string {
  if (!abbr) return ""
  const upperAbbr = abbr.toUpperCase()
  
  // First check our comprehensive mapping
  if (teamAbbreviationMap[upperAbbr]) {
    return teamAbbreviationMap[upperAbbr]
  }
  
  // Standard MLB team abbreviations
  const standardAbbreviations = [
    'ARI', 'ATL', 'BAL', 'BOS', 'CHC', 'CHW', 'CIN', 'CLE', 'COL', 'DET',
    'HOU', 'KC', 'LAA', 'LAD', 'MIA', 'MIL', 'MIN', 'NYM', 'NYY', 'OAK',
    'PHI', 'PIT', 'SD', 'SEA', 'SF', 'STL', 'TB', 'TEX', 'TOR', 'WSH'
  ]
  
  // Check if it's already a standard abbreviation
  if (standardAbbreviations.includes(upperAbbr)) {
    // For file lookup, we need to map some standard abbreviations to actual file names
    const fileNameMap: Record<string, string> = {
      ARI: "AZ", // Arizona file is AZ.svg, not ARI.svg
    }
    return fileNameMap[upperAbbr] || upperAbbr
  }
  
  // If nothing matches, return as-is
  return upperAbbr
}

// Debug function to help identify team matching issues
export function debugTeamMapping(originalAbbr: string): {
  original: string
  standardized: string
  filename: string
  logoPath: string
} {
  const standardized = getStandardAbbreviation(originalAbbr)
  const filename = getTeamLogoFilename(standardized)
  const logoPath = `/images/mlb-teams/${filename}.svg`
  
  return {
    original: originalAbbr,
    standardized,
    filename,
    logoPath
  }
} 