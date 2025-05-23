/**
 * Team Abbreviation Checker
 * 
 * This script helps manage team abbreviation variations in the MLB logos.
 * It provides mappings between non-standard abbreviations and standard ones.
 */

// Standard MLB team abbreviations
const standardAbbreviations = [
  'ARI', 'ATL', 'BAL', 'BOS', 'CHC', 'CHW', 'CIN', 'CLE', 'COL', 'DET',
  'HOU', 'KC', 'LAA', 'LAD', 'MIA', 'MIL', 'MIN', 'NYM', 'NYY', 'OAK',
  'PHI', 'PIT', 'SD', 'SEA', 'SF', 'STL', 'TB', 'TEX', 'TOR', 'WSH'
];

// Map of non-standard abbreviations to standard ones
const abbreviationMap = {
  // Arizona Diamondbacks variations
  'AZ': 'ARI',
  'ARZ': 'ARI',
  'ARIZ': 'ARI',
  'ARIZONA': 'ARI',
  'DIAMONDBACKS': 'ARI',
  
  // Common variations for other teams
  'CHI': 'CHC', // Assuming Chicago Cubs as default
  'CWS': 'CHW', // Chicago White Sox
  'KCR': 'KC',  // Kansas City Royals
  'LAD': 'LAD', // Los Angeles Dodgers
  'LAA': 'LAA', // Los Angeles Angels
  'SDP': 'SD',  // San Diego Padres
  'SFG': 'SF',  // San Francisco Giants
  'TBR': 'TB',  // Tampa Bay Rays
  'TEX': 'TEX', // Texas Rangers
  'TOR': 'TOR', // Toronto Blue Jays
  'WSH': 'WSH', // Washington Nationals
  'WAS': 'WSH', // Washington Nationals
  'AT': 'OAK',  // Oakland Athletics
};

/**
 * Get the standard abbreviation for a team
 * @param {string} abbr - The abbreviation to standardize
 * @return {string} The standard abbreviation
 */
function getStandardAbbreviation(abbr) {
  const uppercase = abbr.toUpperCase();
  
  // If it's already a standard abbreviation, return it
  if (standardAbbreviations.includes(uppercase)) {
    return uppercase;
  }
  
  // If it's in our mapping, return the standard version
  if (abbreviationMap[uppercase]) {
    return abbreviationMap[uppercase];
  }
  
  // Otherwise, return the original
  return abbr;
}

// Example usage
console.log(getStandardAbbreviation('AZ')); // Should return 'ARI'
console.log(getStandardAbbreviation('NYY')); // Should return 'NYY'

module.exports = {
  getStandardAbbreviation,
  standardAbbreviations,
  abbreviationMap
}; 