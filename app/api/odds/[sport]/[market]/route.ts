import { NextResponse } from "next/server"
import { redis, generateOddsCacheKey } from "@/lib/redis"
import { SPORTSBOOK_ID_MAP, REVERSE_SPORTSBOOK_MAP } from "@/lib/constants/sportsbook-mappings"
import { sportsbooks as SPORTSBOOKS_LIST, type Sportsbook } from "@/data/sportsbooks"
import { getMarketApiKey } from "@/lib/constants/game-markets"

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
  'basketball_ncaab': 'ncaab'
}

// MLB Team name to abbreviation mapping
const MLB_TEAM_MAP: Record<string, string> = {
  // American League
  "Los Angeles Angels": "LAA",
  "Baltimore Orioles": "BAL",
  "Boston Red Sox": "BOS",
  "Chicago White Sox": "CWS",
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
  "Arizona Diamondbacks": "ARI",
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

// Function to transform sportsbooks data
function transformSportsbooks(data: any, sport: string, market: string) {
  console.log('[API] Raw sportsbooks data:', {
    market_key: data.market_key,
    market_type: data.market_type,
    lines: Object.keys(data.lines)
  })
  
  const bookmakers: Bookmaker[] = []
  
  // Process each line
  for (const [lineKey, lineData] of Object.entries<any>(data.lines)) {
    const lineSportsbooks = lineData.sportsbooks || {}
    
    // Process each sportsbook for this line
    for (const [book, bookData] of Object.entries<any>(lineSportsbooks)) {
      // First normalize the sportsbook name using our mapping
      const normalizedName = SPORTSBOOK_ID_MAP[book.toLowerCase()] || book.toLowerCase()
      const logoId = REVERSE_SPORTSBOOK_MAP[normalizedName]
      
      if (!logoId) {
        console.warn(`[API] No logo ID mapping found for sportsbook: ${book}`)
        continue
      }
      
      // Find or create bookmaker entry
      let bookmaker = bookmakers.find(b => b.key === logoId)
      if (!bookmaker) {
        const sportsbookData = SPORTSBOOKS_LIST.find((sb: Sportsbook) => sb.id === logoId)
        if (!sportsbookData) {
          console.warn(`[API] No sportsbook data found for logoId: ${logoId}`)
          continue
        }
        
        bookmaker = {
          key: logoId,
          title: sportsbookData.name,
          last_update: data.last_update,
          markets: []
        }
        bookmakers.push(bookmaker)
      }
      
      // Create market entry for this line
      const outcomes = []
      for (const [team, odds] of Object.entries<any>(bookData)) {
        outcomes.push({
          name: team.charAt(0).toUpperCase() + team.slice(1),
          price: odds.price,
          point: lineData.point,
          link: odds.link,
          sid: odds.sid
        })
      }
      
      // Get the correct market key using getMarketApiKey
      const marketKey = getMarketApiKey(sport, market)
      
      bookmaker.markets.push({
        key: marketKey,
        line: lineData.point,
        outcomes
      })
    }
  }
  
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

    const transformed = {
      ...data,
      event_id: data.event_id || `${data.home_team}_${data.away_team}`,
      sport_key: sport,
      commence_time: data.commence_time || new Date().toISOString(),
      home_team: {
        name: homeTeam,
        abbreviation: MLB_TEAM_MAP[homeTeam] || homeTeam
      },
      away_team: {
        name: awayTeam,
        abbreviation: MLB_TEAM_MAP[awayTeam] || awayTeam
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

    // Convert sport name to Redis key format
    const sportKey = SPORT_KEY_MAP[sport] || sport

    // Get the correct market key for Redis
    const marketKey = getMarketApiKey(sport === 'mlb' ? 'baseball_mlb' : sport, market)
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