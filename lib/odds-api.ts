import { getCachedData, setCachedData, generateCacheKey } from './redis'

// API Types
export interface Sport {
  key: string
  group: string
  title: string
  description: string
  active: boolean
  has_outrights: boolean
}

export interface Event {
  id: string
  sport_key: string
  sport_title: string
  commence_time: string
  home_team: string
  away_team: string
}

export interface OddsResponse {
  success: boolean
  data: GameOdds[]
}

export interface GameOdds {
  id: string
  sport_key: string
  sport_title: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers: Bookmaker[]
}

export interface Bookmaker {
  key: string
  title: string
  last_update: string
  sid?: string
  markets: Market[]
}

export interface Market {
  key: string
  last_update?: string
  sid?: string | null
  outcomes: Outcome[]
}

export interface Outcome {
  name: string
  price: number
  point?: number
  description?: string
  sid?: string
}

export interface PlayerPropMarket extends Market {
  player: string
  statType: string
  line: number
}

export interface PlayerProp {
  id?: string;
  player: string;
  team?: string;
  statType: string;
  line: number;
  bookmakers: Bookmaker[];
}

// API Configuration
const API_BASE_URL = 'https://api.the-odds-api.com/v4'
const API_KEY = process.env.ODDS_API_KEY

// Error class for API errors
export class OddsAPIError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'OddsAPIError'
  }
}

// Helper function to make API requests
async function makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const queryParams = new URLSearchParams({
    apiKey: API_KEY!,
    ...params,
  })

  const response = await fetch(`${API_BASE_URL}${endpoint}?${queryParams}`)
  
  if (!response.ok) {
    throw new OddsAPIError('API request failed', response.status)
  }

  return response.json()
}

// Function to get available events for a sport
export async function getEvents(sportKey: string): Promise<Event[]> {
  const cacheKey = generateCacheKey(['events', sportKey])
  
  // Try to get from cache first
  const cachedData = await getCachedData<Event[]>(cacheKey)
  if (cachedData) {
    return cachedData
  }

  // If not in cache, fetch from API
  try {
    const response = await makeRequest<Event[]>(`/sports/${sportKey}/events`)
    await setCachedData(cacheKey, response)
    return response
  } catch (error) {
    console.error('Error fetching events:', error)
    throw error
  }
}

// Function to fetch player props for a specific event with caching
export async function getEventPlayerProps(
  sportKey: string,
  eventId: string,
  selectedBookmakers: string[],
  markets: string[] = ['player_points', 'player_rebounds', 'player_assists']
): Promise<GameOdds> {
  const cacheKey = generateCacheKey(['event-props', eventId, ...selectedBookmakers, ...markets])
  
  // Try to get from cache first
  const cachedData = await getCachedData<GameOdds>(cacheKey)
  if (cachedData) {
    return cachedData
  }

  // If not in cache, fetch from API
  try {
    const response = await makeRequest<GameOdds>(`/sports/${sportKey}/events/${eventId}/odds`, {
      markets: markets.join(','),
      bookmakers: selectedBookmakers.join(','),
      oddsFormat: 'american',
      includeSids: 'true'
    })

    // Filter out bookmakers that weren't requested
    const filteredData = {
      ...response,
      bookmakers: response.bookmakers.filter(b => selectedBookmakers.includes(b.key))
    }

    // Cache the filtered data
    await setCachedData(cacheKey, filteredData)
    
    return filteredData
  } catch (error) {
    console.error('Error fetching event player props:', error)
    throw error
  }
}

// Function to get available sports
export async function getAvailableSports(): Promise<Sport[]> {
  const cacheKey = 'available-sports'
  
  const cachedData = await getCachedData<Sport[]>(cacheKey)
  if (cachedData) {
    return cachedData
  }

  const response = await makeRequest<Sport[]>('/sports')
  await setCachedData(cacheKey, response)
  
  return response
}

// Function to format odds
export function formatAmericanOdds(odds: number): string {
  if (odds >= 0) {
    return `+${odds}`
  }
  return odds.toString()
}

// Function to find best odds
export function findBestOdds(
  prop: PlayerProp,
  marketKey: string,
  outcomeType: 'Over' | 'Under'
): { bookmaker: string; odds: number; line: number } | null {
  let bestOdds = null;
  let bestBookmaker = null;
  let bestLine = null;

  for (const bookmaker of prop.bookmakers) {
    const market = bookmaker.markets.find(m => m.key === marketKey);
    if (!market) continue;

    const outcome = market.outcomes.find(o => o.name === outcomeType);
    if (!outcome) continue;

    if (bestOdds === null || outcome.price > bestOdds) {
      bestOdds = outcome.price;
      bestBookmaker = bookmaker.key;
      bestLine = outcome.point;
    }
  }

  return bestOdds !== null 
    ? { bookmaker: bestBookmaker!, odds: bestOdds, line: bestLine! } 
    : null;
} 