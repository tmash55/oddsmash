import { getTeamLogoFilename } from './team-mappings'

// Helper function to normalize sport names
function getNormalizedSport(sport: string): string {
  const sportMap: Record<string, string> = {
    mlb: "baseball_mlb",
    nfl: "football_nfl",
    wnba: "basketball_wnba",
    nba: "basketball_nba"
  }
  return sportMap[sport.toLowerCase()] || sport
}

interface SportAssetConfig {
  playerHeadshotUrl: (playerId: string) => string
  teamLogoPath: string
  defaultPlayerImage: string
}

const sportAssetConfig: Record<string, SportAssetConfig> = {
  baseball_mlb: {
    playerHeadshotUrl: (playerId: string) => 
      `https://img.mlbstatic.com/mlb-photos/image/upload/w_240,q_auto:good,f_auto/v1/people/${playerId}/headshot/67/current`,
    teamLogoPath: 'mlb-teams',
    defaultPlayerImage: '/placeholder.svg'
  },
  football_nfl: {
    playerHeadshotUrl: (playerId: string) => 
      `https://static.www.nfl.com/image/private/t_player_profile_landscape/f_auto/league/${playerId}`,
    teamLogoPath: 'nfl-teams',
    defaultPlayerImage: '/placeholder.svg'
  },
  basketball_wnba: {
    playerHeadshotUrl: () => '/placeholder.svg', // WNBA headshots not available yet
    teamLogoPath: 'team-logos/wnba',
    defaultPlayerImage: '/placeholder.svg'
  }
}

export function getPlayerHeadshotUrl(playerId: string, sport: string): string {
  const normalizedSport = getNormalizedSport(sport)
  const config = sportAssetConfig[normalizedSport]
  if (!config) return '/placeholder.svg'
  return config.playerHeadshotUrl(playerId)
}

export function getTeamLogoUrl(teamAbbr: string, sport: string): string {
  const normalizedSport = getNormalizedSport(sport)
  const config = sportAssetConfig[normalizedSport]
  if (!config) return '/placeholder.svg'
  return `/images/${config.teamLogoPath}/${getTeamLogoFilename(teamAbbr, normalizedSport)}.svg`
}

export function getDefaultPlayerImage(sport: string): string {
  const normalizedSport = getNormalizedSport(sport)
  const config = sportAssetConfig[normalizedSport]
  if (!config) return '/placeholder.svg'
  return config.defaultPlayerImage
} 