import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { fetchPlayerPropOddsForPlayers } from '@/services/player-prop-odds'

// Market name mapping - matches the Python script's MARKET_NAME_MAP
const DISPLAY_TO_API_MARKET_MAP: Record<string, string> = {
  "hits": "batter_hits",
  "home runs": "batter_home_runs", 
  "total bases": "batter_total_bases",
  "rbis": "batter_rbis",
  "runs": "batter_runs_scored",
  "strikeouts": "batter_strikeouts",
  "walks": "batter_walks",
  "singles": "batter_singles",
  "doubles": "batter_doubles", 
  "triples": "batter_triples",
  "hits+runs+rbis": "batter_hits_runs_rbis",
  "pitcher strikeouts": "pitcher_strikeouts",
  "hits allowed": "pitcher_hits_allowed",
  "pitcher walks": "pitcher_walks",
  "earned runs": "pitcher_earned_runs",
  "outs": "pitcher_outs",
  "pitcher win": "pitcher_record_a_win"
}

interface RedisOddsData {
  player_id: number
  description: string
  team: string
  market: string
  event_id: string
  home_team: string
  away_team: string
  commence_time: string
  lines: Record<string, Record<string, {
    over?: { price: number; link?: string; sid?: string; last_update: string }
    under?: { price: number; link?: string; sid?: string; last_update: string }
  }>>
  primary_line?: string
  has_alternates: boolean
  last_updated: string
}

interface PlayerPropOdds {
  id?: number
  player_id: number
  player_name: string
  team_name?: string
  market: string
  line: number
  over_odds: number | null
  over_sid?: string | null
  over_link?: string | null
  sportsbook: string
  fetched_at: string
}

// Convert display market name to API market key for Redis lookup
function getApiMarketKey(displayMarket: string): string {
  const normalized = displayMarket.toLowerCase()
  return DISPLAY_TO_API_MARKET_MAP[normalized] || normalized.replace(/\s+/g, '_')
}

// Convert Redis odds format to PlayerPropOdds format for backward compatibility
function convertRedisToPlayerPropOdds(redisData: RedisOddsData): PlayerPropOdds[] {
  const results: PlayerPropOdds[] = []
  
  // Iterate through each line and sportsbook combination
  Object.entries(redisData.lines).forEach(([lineStr, sportsbooks]) => {
    const line = parseFloat(lineStr)
    
    Object.entries(sportsbooks).forEach(([sportsbook, odds]) => {
      if (odds.over?.price) {
        results.push({
          player_id: redisData.player_id,
          player_name: redisData.description,
          team_name: redisData.team,
          market: redisData.market,
          line: line,
          over_odds: odds.over.price,
          over_link: odds.over.link || null,
          over_sid: odds.over.sid || null,
          sportsbook: sportsbook,
          fetched_at: redisData.last_updated
        })
      }
    })
  })
  
  return results
}

// Get best odds for a player from multiple sportsbooks
function getBestOdds(playerOdds: PlayerPropOdds[], targetLine?: number): PlayerPropOdds | null {
  if (!playerOdds.length) return null
  
  // If a specific line is requested, filter to that line
  let filteredOdds = playerOdds
  if (targetLine !== undefined) {
    filteredOdds = playerOdds.filter(odds => Math.abs(odds.line - targetLine) < 0.1)
  }
  
  if (!filteredOdds.length) {
    // If no exact line match, use the most common line
    const lineCounts = playerOdds.reduce((acc, odds) => {
      acc[odds.line] = (acc[odds.line] || 0) + 1
      return acc
    }, {} as Record<number, number>)
    
    const mostCommonLine = Object.entries(lineCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0]
    
    if (mostCommonLine) {
      filteredOdds = playerOdds.filter(odds => Math.abs(odds.line - parseFloat(mostCommonLine)) < 0.1)
    }
  }
  
  if (!filteredOdds.length) return null
  
  // Return the best odds (highest positive, least negative)
  return filteredOdds.reduce((best, current) => {
    if (!best) return current
    
    const currentOdds = current.over_odds || 0
    const bestOdds = best.over_odds || 0
    
    // Prefer positive odds (higher is better) or less negative odds
    if (currentOdds > 0 && bestOdds > 0) {
      return currentOdds > bestOdds ? current : best
    } else if (currentOdds < 0 && bestOdds < 0) {
      return currentOdds > bestOdds ? current : best
    } else if (currentOdds > 0 && bestOdds < 0) {
      return current
    } else {
      return best
    }
  })
}

export async function GET(request: Request) {
  try {
    // Check Redis connection
    try {
      await redis.ping()
    } catch (error: any) {
      console.error('[/api/player-odds] Redis connection error:', error?.message || error)
      return NextResponse.json({ error: 'Redis connection failed' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const playerIds = searchParams.get('playerIds')?.split(',').map(Number)
    const sport = searchParams.get('sport')?.toLowerCase() || 'mlb'
    const displayMarket = searchParams.get('market')

    if (!playerIds || !displayMarket) {
      return NextResponse.json({ error: 'Missing playerIds or market parameter' }, { status: 400 })
    }

    // Convert display market to API market key for Redis lookup
    const apiMarket = getApiMarketKey(displayMarket)
    console.log(`[/api/player-odds] Fetching odds for ${playerIds.length} players, display market: ${displayMarket}, API market: ${apiMarket}`)

    const results: Record<string, PlayerPropOdds | null> = {}
    
    // Try Redis first for each player
    for (const playerId of playerIds) {
      const redisKey = `odds:${sport}:${playerId}:${apiMarket}`
      console.log(`[/api/player-odds] Checking Redis key: ${redisKey}`)
      
      try {
        const redisData = await redis.get(redisKey)
        
        if (redisData) {
          const parsed: RedisOddsData = typeof redisData === 'string' 
            ? JSON.parse(redisData) 
            : redisData
          
          console.log(`[/api/player-odds] ✅ Found Redis data for player ${playerId}`)
          
          // Convert to PlayerPropOdds format
          const playerOdds = convertRedisToPlayerPropOdds(parsed)
          
          if (playerOdds.length > 0) {
            // Get best odds for this player
            const bestOdds = getBestOdds(playerOdds)
            if (bestOdds) {
              const key = `${playerId}:${displayMarket}:${bestOdds.line || 0}`
              results[key] = bestOdds
            }
          }
        } else {
          console.log(`[/api/player-odds] No Redis data for player ${playerId}`)
        }
      } catch (error) {
        console.error(`[/api/player-odds] Error fetching Redis data for player ${playerId}:`, error)
      }
    }

    // For players without Redis data, try database fallback
    const playersWithoutOdds = playerIds.filter(id => 
      !Object.keys(results).some(key => key.startsWith(`${id}:`))
    )

    if (playersWithoutOdds.length > 0) {
      console.log(`[/api/player-odds] Falling back to database for ${playersWithoutOdds.length} players`)
      
      try {
        const dbOdds = await fetchPlayerPropOddsForPlayers(playersWithoutOdds)
        
        // Convert database results to expected format
        Object.entries(dbOdds).forEach(([key, oddsArray]) => {
          if (oddsArray && oddsArray.length > 0) {
            const bestOdds = getBestOdds(oddsArray)
            if (bestOdds) {
              results[key] = bestOdds
            }
          }
        })
        
        console.log(`[/api/player-odds] Database fallback found odds for ${Object.keys(dbOdds).length} combinations`)
      } catch (error) {
        console.error('[/api/player-odds] Database fallback error:', error)
      }
    }

    console.log(`[/api/player-odds] Final results: ${Object.keys(results).length} odds combinations`)
    return NextResponse.json(results)

  } catch (error) {
    console.error('[/api/player-odds] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
