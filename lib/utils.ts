import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Update the formatOdds function to handle undefined or null values
export function formatOdds(odds: number | undefined | null): string {
  if (odds === undefined || odds === null) {
    return "-";
  }
  return odds > 0 ? `+${odds}` : odds.toString();
}

// Valid sports for the application
export const VALID_SPORTS = ['MLB', 'NBA', 'NFL', 'NHL'] as const
export type Sport = typeof VALID_SPORTS[number]

// Validate sport parameter
export function validateSport(sport: string): sport is Sport {
  return VALID_SPORTS.includes(sport as Sport)
}

export function capitalizeMarket(market: string): string {
  // Handle special cases like 'RBIs' or 'HR'
  const specialCases: Record<string, string> = {
    'rbis': 'RBIs',
    'hr': 'HR',
    'h': 'Hits',
    'tb': 'Total Bases',
  };

  // Check if it's a special case
  if (specialCases[market.toLowerCase()]) {
    return specialCases[market.toLowerCase()];
  }

  // Split by spaces and underscores
  return market
    .split(/[\s_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Helper functions for team logos and abbreviations
export function getTeamLogoFilename(abbr: string): string {
  if (!abbr) return "default"
  const teamAbbreviationMap: Record<string, string> = {
    // American League
    "LAA": "LAA", // Los Angeles Angels
    "BAL": "BAL", // Baltimore Orioles
    "BOS": "BOS", // Boston Red Sox
    "CWS": "CHW", // Chicago White Sox
    "CHW": "CHW", // Chicago White Sox (alternative)
    "WHITE SOX": "CHW", // Chicago White Sox (full name)
    "WHITESOX": "CHW", // Chicago White Sox (no space)
    "CLE": "CLE", // Cleveland Guardians
    "DET": "DET", // Detroit Tigers
    "HOU": "HOU", // Houston Astros
    "KC": "KC",   // Kansas City Royals
    "MIN": "MIN", // Minnesota Twins
    "NYY": "NYY", // New York Yankees
    "OAK": "OAK", // Oakland Athletics
    "A'S": "OAK", // Oakland Athletics (alternative)
    "AS": "OAK",  // Oakland Athletics (no apostrophe)
    "ATH": "OAK", // Oakland Athletics (alternative)
    "ATHLETICS": "OAK", // Oakland Athletics (full name)
    "SEA": "SEA", // Seattle Mariners
    "TB": "TB",   // Tampa Bay Rays
    "TEX": "TEX", // Texas Rangers
    "TOR": "TOR", // Toronto Blue Jays

    // National League
    "ARI": "AZ",  // Arizona Diamondbacks
    "ATL": "ATL", // Atlanta Braves
    "CHC": "CHC", // Chicago Cubs
    "CIN": "CIN", // Cincinnati Reds
    "COL": "COL", // Colorado Rockies
    "LAD": "LAD", // Los Angeles Dodgers
    "MIA": "MIA", // Miami Marlins
    "MIL": "MIL", // Milwaukee Brewers
    "NYM": "NYM", // New York Mets
    "PHI": "PHI", // Philadelphia Phillies
    "PIT": "PIT", // Pittsburgh Pirates
    "SD": "SD",   // San Diego Padres
    "SF": "SF",   // San Francisco Giants
    "STL": "STL", // St. Louis Cardinals
    "WSH": "WSH", // Washington Nationals
  }
  const upperAbbr = abbr.toUpperCase().trim()
  return teamAbbreviationMap[upperAbbr] || upperAbbr
}

export function getStandardAbbreviation(teamName: string): string {
  if (!teamName) return ""
  
  // Handle common variations first
  const variationMap: Record<string, string> = {
    "ATH": "OAK",
    "Athletics": "OAK",
    "A's": "OAK",
    "As": "OAK",
    "Oakland": "OAK",
    "CWS": "CHW",
    "White Sox": "CHW",
    "WhiteSox": "CHW",
    "Chicago": "CHW" // Only if we're sure this refers to White Sox
  }

  // Clean up the input
  const cleanName = teamName.trim()

  // Check variations first
  if (variationMap[cleanName]) {
    return variationMap[cleanName]
  }

  // Check if the name contains any of our variation keys
  for (const [key, value] of Object.entries(variationMap)) {
    if (cleanName.toLowerCase().includes(key.toLowerCase())) {
      return value
    }
  }

  const teamMap: Record<string, string> = {
    // American League
    "Los Angeles Angels": "LAA",
    "Baltimore Orioles": "BAL",
    "Boston Red Sox": "BOS",
    "Chicago White Sox": "CHW",
    "Cleveland Guardians": "CLE",
    "Detroit Tigers": "DET",
    "Houston Astros": "HOU",
    "Kansas City Royals": "KC",
    "Minnesota Twins": "MIN",
    "New York Yankees": "NYY",
    "Oakland Athletics": "OAK",
    "Seattle Mariners": "SEA",
    "Tampa Bay Rays": "TB",
    "Texas Rangers": "TEX",
    "Toronto Blue Jays": "TOR",

    // National League
    "Arizona Diamondbacks": "AZ",
    "Atlanta Braves": "ATL",
    "Chicago Cubs": "CHC",
    "Cincinnati Reds": "CIN",
    "Colorado Rockies": "COL",
    "Los Angeles Dodgers": "LAD",
    "Miami Marlins": "MIA",
    "Milwaukee Brewers": "MIL",
    "New York Mets": "NYM",
    "Philadelphia Phillies": "PHI",
    "Pittsburgh Pirates": "PIT",
    "San Diego Padres": "SD",
    "San Francisco Giants": "SF",
    "St. Louis Cardinals": "STL",
    "Washington Nationals": "WSH"
  }

  // Check full team names
  if (teamMap[cleanName]) {
    return teamMap[cleanName]
  }

  // If we still haven't found a match, try to match parts of the name
  for (const [fullName, abbr] of Object.entries(teamMap)) {
    if (cleanName.toLowerCase().includes(fullName.toLowerCase())) {
      return abbr
    }
  }

  // Last resort: take first 3 characters
  return cleanName.slice(0, 3).toUpperCase()
}

export function getTeamAbbreviation(teamName: string): string {
  if (!teamName) return ""
  
  // Special cases for Athletics and White Sox
  const lowerName = teamName.toLowerCase().trim()
  if (lowerName.includes('athletics') || lowerName.includes('a\'s') || lowerName.includes('oakland')) {
    return 'Athletics'
  }
  if (lowerName.includes('white') && lowerName.includes('sox')) {
    return 'White Sox'
  }

  // Default behavior: return last word
  return teamName.split(' ').pop() || teamName
}
