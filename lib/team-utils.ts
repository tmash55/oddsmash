// Map full team names to their abbreviations
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

// Map team abbreviations for logo filenames
export const teamAbbreviationMap: Record<string, string> = {
  ARI: "AZ",
  ARIZONA: "AZ",
  DIAMONDBACKS: "AZ",
  AT: "OAK",
}

// Function to get the correct file name for a team abbreviation
export function getTeamLogoFilename(abbr: string): string {
  if (!abbr) return "default"
  const upperAbbr = abbr.toUpperCase()
  return teamAbbreviationMap[upperAbbr] || abbr
}

// Function to standardize team abbreviations for logo lookup
export function getStandardAbbreviation(abbr: string): string {
  const map: Record<string, string> = {
    AT: "OAK",
  }
  return map[abbr] || abbr
} 