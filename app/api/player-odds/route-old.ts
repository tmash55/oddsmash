import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { fetchPlayerPropOddsForPlayers } from '@/services/player-prop-odds'

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
    const market = searchParams.get('market')?.toLowerCase()

    if (!playerIds || !market) {
      return NextResponse.json({ error: 'Missing playerIds or market parameter' }, { status: 400 })
    }

    console.log(`[/api/player-odds] Fetching odds for ${playerIds.length} players, market: ${market}`)

    const results: Record<string, PlayerPropOdds | null> = {}
    
    // Try Redis first for each player
    for (const playerId of playerIds) {
      const redisKey = `odds:${sport}:${playerId}:${market}`
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
            const key = `${playerId}:${market}:${bestOdds?.line || 0}`
            results[key] = bestOdds
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