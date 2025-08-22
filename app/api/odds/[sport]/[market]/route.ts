import { NextResponse } from "next/server"
import { redis, generateOddsCacheKey } from "@/lib/redis"
import { SPORTSBOOK_ID_MAP, REVERSE_SPORTSBOOK_MAP } from "@/lib/constants/sportsbook-mappings"
import { sportsbooks as SPORTSBOOKS_LIST, type Sportsbook } from "@/data/sportsbooks"
import { getMarketApiKey } from "@/lib/constants/game-markets"
import { getStandardAbbreviation } from "@/lib/constants/team-mappings"

interface Bookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: Array<{
    key: string;
    line?: string | number;
    outcomes: Array<{
      name: string;
      price: number;
      point?: number;
      link?: string;
      sid?: string;
    }>;
  }>;
}

// Sport mapping for Redis keys
const SPORT_KEY_MAP: Record<string, string> = {
  'baseball_mlb': 'mlb',
  'mlb': 'mlb',  // Add direct mapping
  'basketball_nba': 'nba',
  'basketball_wnba': 'wnba',
  'wnba': 'wnba',
  'basketball_ncaab': 'ncaab',
  // Football mappings
  'football_nfl': 'nfl',
  'americanfootball_nfl': 'nfl',
  'football_ncaaf': 'ncaaf',
  'americanfootball_ncaaf': 'ncaaf'
}

// Normalize sport for team abbreviation lookups
function normalizeSportForAbbr(sport: string): string {
  const lower = sport.toLowerCase()
  if (lower === 'mlb' || lower === 'baseball_mlb') return 'baseball_mlb'
  if (lower === 'nfl' || lower === 'football_nfl' || lower === 'americanfootball_nfl') return 'football_nfl'
  if (lower === 'wnba' || lower === 'basketball_wnba') return 'basketball_wnba'
  return sport
}

// Normalize sport for market key lookups
function normalizeSportForMarkets(sport: string): string {
  const lower = sport.toLowerCase()
  if (lower === 'mlb' || lower === 'baseball_mlb') return 'baseball_mlb'
  if (lower === 'nba' || lower === 'basketball_nba') return 'basketball_nba'
  if (lower === 'wnba' || lower === 'basketball_wnba') return 'basketball_wnba'
  if (lower === 'nhl' || lower === 'icehockey_nhl') return 'icehockey_nhl'
  if (lower === 'nfl' || lower === 'football_nfl' || lower === 'americanfootball_nfl') return 'football_nfl'
  if (lower === 'ncaaf' || lower === 'football_ncaaf' || lower === 'americanfootball_ncaaf') return 'football_ncaaf'
  return sport
}

function normalizeMarketValue(m: string): string {
  const v = (m || '').toLowerCase()
  if (v === 'h2h' || v === 'moneyline' || v === 'ml') return 'moneyline'
  if (v === 'spread' || v === 'spreads') return 'spread'
  if (v === 'total' || v === 'totals') return 'total'
  if (v === 'runline' || v === 'run_line') return 'run_line'
  if (v === 'puckline' || v === 'puck_line') return 'puck_line'
  return v
}

// Function to transform sportsbooks data
function transformSportsbooks(data: any, sport: string, market: string) {
  console.log('[API] Raw sportsbooks data:', {
    market_key: data.market_key,
    market_type: data.market_type,
    lines: Object.keys(data.lines)
  })

  // Ensure we key the market with the normalized sport + market value
  const marketKey = getMarketApiKey(normalizeSportForMarkets(sport), normalizeMarketValue(market))

  // Build a map of bookmaker -> entry with a single market containing the full lines map
  const bookmakerMap = new Map<string, Bookmaker>()

  // Normalize sportsbook keys inside lines to our logoId mapping for consistent client lookups
  const normalizedLines: Record<string, any> = {}
  for (const [lineKey, lineData] of Object.entries<any>(data.lines || {})) {
    const sb: Record<string, any> = {}
    for (const [rawKey, sbData] of Object.entries<any>(lineData.sportsbooks || {})) {
      const normalizedName = SPORTSBOOK_ID_MAP[rawKey.toLowerCase()] || rawKey.toLowerCase()
      const logoId = REVERSE_SPORTSBOOK_MAP[normalizedName] || normalizedName
      sb[logoId] = sbData
    }
    normalizedLines[lineKey] = { ...lineData, sportsbooks: sb }
  }

  // Discover all sportsbooks present across all lines
  for (const [, lineData] of Object.entries<any>(normalizedLines)) {
    const lineSportsbooks = lineData.sportsbooks || {}
    for (const [book, _bookData] of Object.entries<any>(lineSportsbooks)) {
      const logoId = String(book)
      if (!logoId) continue

      if (!bookmakerMap.has(logoId)) {
        const sportsbookData = SPORTSBOOKS_LIST.find((sb: Sportsbook) => sb.id === logoId)
        if (!sportsbookData) continue
        bookmakerMap.set(logoId, {
          key: logoId,
          title: sportsbookData.name,
          last_update: data.last_update,
          markets: [
            {
              key: marketKey,
              line: data.primary_line ?? undefined,
              outcomes: [],
              // Attach the entire lines map so the client can resolve standard/selected per book
              lines: normalizedLines,
            } as any,
          ],
        })
      }
    }
  }

  // For h2h, also populate outcomes per bookmaker from their standard line
  if (marketKey === 'h2h') {
    bookmakerMap.forEach((bookmaker, logoId) => {
      const marketEntry = bookmaker.markets.find((m: any) => m.key === 'h2h') as any
      if (!marketEntry) return

      // Find the standard line for this bookmaker or fall back to primary_line or '0'
      let selectedLineKey: string | undefined
      for (const [lk, ld] of Object.entries<any>(normalizedLines)) {
        if (ld?.sportsbooks?.[logoId]?.is_standard) {
          selectedLineKey = lk
          break
        }
      }
      if (!selectedLineKey) selectedLineKey = data.primary_line || '0'

      const sbRecord = (normalizedLines?.[selectedLineKey]?.sportsbooks || {}) as Record<string, any>
      const sbData = sbRecord[logoId]
      if (!sbData) return

      const outcomes: any[] = []
      if (sbData?.away_team?.price !== undefined) {
        outcomes.push({
          name: data.away_team,
          price: sbData.away_team.price,
          point: null,
          link: sbData.away_team.link ?? undefined,
          sid: sbData.away_team.sid ?? undefined,
        })
      }
      if (sbData?.home_team?.price !== undefined) {
        outcomes.push({
          name: data.home_team,
          price: sbData.home_team.price,
          point: null,
          link: sbData.home_team.link ?? undefined,
          sid: sbData.home_team.sid ?? undefined,
        })
      }
      marketEntry.outcomes = outcomes
    })
  }

  const bookmakers = Array.from(bookmakerMap.values())
  console.log('[API] Final transformed bookmakers:', {
    count: bookmakers.length,
    bookmakerKeys: bookmakers.map(b => b.key)
  })

  return bookmakers
}

// Function to transform game data to include abbreviations
function transformGameData(data: any, sport: string, market: string) {
  if (!data || typeof data !== 'object') return null;

  try {
    // Ensure required fields exist
    if (!data.home_team || !data.away_team || !data.lines) {
      console.error('Missing required fields in game data:', data);
      return null;
    }

    // Capitalize team names
    const capitalizeTeamName = (name: string) => {
      return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const homeTeam = capitalizeTeamName(data.home_team);
    const awayTeam = capitalizeTeamName(data.away_team);

    const normalizedSport = normalizeSportForAbbr(sport)

    const transformed = {
      ...data,
      event_id: data.event_id || `${data.home_team}_${data.away_team}`,
      sport_key: sport,
      commence_time: data.commence_time || new Date().toISOString(),
      home_team: {
        name: homeTeam,
        abbreviation: getStandardAbbreviation(homeTeam, normalizedSport)
      },
      away_team: {
        name: awayTeam,
        abbreviation: getStandardAbbreviation(awayTeam, normalizedSport)
      },
      bookmakers: transformSportsbooks(data, sport, market),
      primary_line: data.primary_line
    };

    return transformed;
  } catch (error) {
    console.error('Error transforming game data:', error);
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: { sport: string; market: string } },
) {
  try {
    const { sport, market } = params

    const normalizeSportForMarkets = (s: string): string => {
      const lower = s.toLowerCase()
      if (lower === 'mlb' || lower === 'baseball_mlb') return 'baseball_mlb'
      if (lower === 'nba' || lower === 'basketball_nba') return 'basketball_nba'
      if (lower === 'wnba' || lower === 'basketball_wnba') return 'basketball_wnba'
      if (lower === 'nhl' || lower === 'icehockey_nhl') return 'icehockey_nhl'
      if (lower === 'nfl' || lower === 'football_nfl' || lower === 'americanfootball_nfl') return 'football_nfl'
      if (lower === 'ncaaf' || lower === 'football_ncaaf' || lower === 'americanfootball_ncaaf') return 'football_ncaaf'
      return s
    }

    const normalizeMarketValue = (m: string): string => {
      const v = (m || '').toLowerCase()
      if (v === 'h2h' || v === 'moneyline' || v === 'ml') return 'moneyline'
      // Keep sport-specific values so getMarketApiKey can map correctly
      if (v === 'spread' || v === 'spreads') return 'spread'
      if (v === 'runline' || v === 'run_line') return 'run_line'
      if (v === 'puckline' || v === 'puck_line') return 'puck_line'
      if (v === 'total' || v === 'totals') return 'total'
      return v
    }

    // Convert sport name to Redis key format
    const sportKey = SPORT_KEY_MAP[sport] || sport

    // Get the correct market key for Redis
    const marketKey = getMarketApiKey(normalizeSportForMarkets(sport), normalizeMarketValue(market))
    console.log('Market mapping:', { sport, market, marketKey })

    // For game lines, we want to get all games for the sport
    const keyPattern = `odds:${sportKey}:*:${marketKey}`
    console.log('Searching with pattern:', keyPattern)

    // Use SCAN to get all matching keys
    let cursor = '0'
    const allKeys: string[] = []
    
    do {
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: keyPattern,
        count: 50
      })
      cursor = nextCursor
      allKeys.push(...keys)
    } while (cursor !== '0')

    console.log('Found keys:', allKeys)

    // Get all games data
    const gamesData = await Promise.all(
      allKeys.map(async (key) => {
        const data = await redis.get(key)
        if (!data) return null
        try {
          const parsedData = typeof data === 'string' ? JSON.parse(data) : data
          return transformGameData(parsedData, sport, market)
        } catch (error) {
          console.error(`Error parsing data for key ${key}:`, error)
          return null
        }
      })
    )

    // Filter out any null values and sort by commence time
    const validGames = gamesData.filter(Boolean).sort((a, b) => {
      const aTime = new Date(a.commence_time).getTime()
      const bTime = new Date(b.commence_time).getTime()
      return aTime - bTime
    })

    return NextResponse.json(validGames)
  } catch (error) {
    console.error('Error fetching odds:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 