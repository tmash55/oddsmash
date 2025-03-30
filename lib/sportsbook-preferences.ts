import { redis } from './redis'

const MAX_SPORTSBOOKS = 8

export interface Sportsbook {
  key: string
  name: string
  logo?: string
  active: boolean
}

// Available sportsbooks
export const AVAILABLE_SPORTSBOOKS: Sportsbook[] = [
  { key: 'draftkings', name: 'DraftKings', active: true },
  { key: 'fanduel', name: 'FanDuel', active: true },
  { key: 'betmgm', name: 'BetMGM', active: true },
  { key: 'caesars', name: 'Caesars', active: true },
  { key: 'pointsbet', name: 'PointsBet', active: true },
  { key: 'barstool', name: 'Barstool', active: true },
  { key: 'wynn', name: 'WynnBET', active: true },
  { key: 'betrivers', name: 'BetRivers', active: true },
  { key: 'unibet', name: 'Unibet', active: true },
  { key: 'foxbet', name: 'FOX Bet', active: true },
]

// Get user's selected sportsbooks
export async function getUserSportsbooks(userId: string): Promise<string[]> {
  const key = `user:${userId}:sportsbooks`
  const sportsbooks = await redis.get<string[]>(key)
  
  // If no preferences are set, return default sportsbooks (first 8)
  if (!sportsbooks) {
    const defaultSportsbooks = AVAILABLE_SPORTSBOOKS
      .filter(sb => sb.active)
      .slice(0, MAX_SPORTSBOOKS)
      .map(sb => sb.key)
    
    await setUserSportsbooks(userId, defaultSportsbooks)
    return defaultSportsbooks
  }
  
  return sportsbooks
}

// Update user's selected sportsbooks
export async function setUserSportsbooks(
  userId: string,
  selectedSportsbooks: string[]
): Promise<void> {
  // Validate sportsbooks exist and are active
  const validSportsbooks = selectedSportsbooks.filter(key => 
    AVAILABLE_SPORTSBOOKS.some(sb => sb.key === key && sb.active)
  )

  // Enforce maximum limit
  const limitedSportsbooks = validSportsbooks.slice(0, MAX_SPORTSBOOKS)
  
  const key = `user:${userId}:sportsbooks`
  await redis.set(key, limitedSportsbooks)
}

// Add a sportsbook to user's selection
export async function addUserSportsbook(
  userId: string,
  sportsbookKey: string
): Promise<boolean> {
  const current = await getUserSportsbooks(userId)
  
  // Check if already selected
  if (current.includes(sportsbookKey)) {
    return false
  }
  
  // Check if sportsbook exists and is active
  const sportsbook = AVAILABLE_SPORTSBOOKS.find(
    sb => sb.key === sportsbookKey && sb.active
  )
  if (!sportsbook) {
    return false
  }
  
  // Check if at maximum limit
  if (current.length >= MAX_SPORTSBOOKS) {
    return false
  }
  
  await setUserSportsbooks(userId, [...current, sportsbookKey])
  return true
}

// Remove a sportsbook from user's selection
export async function removeUserSportsbook(
  userId: string,
  sportsbookKey: string
): Promise<boolean> {
  const current = await getUserSportsbooks(userId)
  
  // Check if exists in current selection
  if (!current.includes(sportsbookKey)) {
    return false
  }
  
  const updated = current.filter(key => key !== sportsbookKey)
  await setUserSportsbooks(userId, updated)
  return true
}

// Get all available sportsbooks with user selection status
export async function getAvailableSportsbooks(
  userId: string
): Promise<(Sportsbook & { selected: boolean })[]> {
  const userSportsbooks = await getUserSportsbooks(userId)
  
  return AVAILABLE_SPORTSBOOKS.map(sportsbook => ({
    ...sportsbook,
    selected: userSportsbooks.includes(sportsbook.key)
  }))
} 