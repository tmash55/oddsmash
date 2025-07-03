import { redis } from "@/lib/redis"

interface RedisOddsData {
  player_id: number
  description: string
  team: string
  market: string
  lines: {
    [line: string]: {
      [sportsbook: string]: {
        over?: { price: number; link?: string; sid?: string }
        under?: { price: number; link?: string; sid?: string }
      }
    }
  }
  last_updated: string
}

interface ResolvedOdds {
  over?: {
    odds: number
    sportsbook: string
    link?: string
  }
  under?: {
    odds: number
    sportsbook: string
    link?: string
  }
  source: "fresh" | "embedded" | "fallback"
  lastUpdated?: string
}

/**
 * Redis Odds Resolver - Gets fresh odds for hit rate profiles
 * 
 * This function implements the recommended approach:
 * 1. Pulls fresh odds from Redis odds:* keys
 * 2. Falls back to embedded all_odds if needed
 * 3. Keeps hit_rate:* keys clean and historical
 */
export async function resolveOddsForProfile(
  playerId: number,
  market: string,
  line: number,
  sport: string = "mlb",
  embeddedOdds?: any
): Promise<ResolvedOdds | null> {
  console.log(`[Redis Odds Resolver] Resolving odds for player ${playerId}, market ${market}, line ${line}`)
  
  // Step 1: Try fresh Redis odds first
  const oddsKey = `odds:${sport}:${playerId}:${market.toLowerCase()}`
  
  try {
    const redisData = await redis.get(oddsKey)
    
    if (redisData) {
      const parsed: RedisOddsData = typeof redisData === 'string' 
        ? JSON.parse(redisData) 
        : redisData
      
      console.log(`[Redis Odds Resolver] ✅ Found fresh Redis data for ${oddsKey}`)
      
      // Extract odds for the specific line
      const lineData = parsed.lines[line.toString()]
      
      if (lineData) {
        console.log(`[Redis Odds Resolver] ✅ Found line data for ${line}:`, Object.keys(lineData))
        
        // Find best over and under odds
        const overOdds = getBestOdds(lineData, "over")
        const underOdds = getBestOdds(lineData, "under")
        
        return {
          over: overOdds,
          under: underOdds,
          source: "fresh",
          lastUpdated: parsed.last_updated
        }
      } else {
        console.log(`[Redis Odds Resolver] ❌ No line data found for ${line}`)
      }
    } else {
      console.log(`[Redis Odds Resolver] ❌ No Redis data found for ${oddsKey}`)
    }
  } catch (error) {
    console.error(`[Redis Odds Resolver] Error fetching from Redis:`, error)
  }
  
  // Step 2: Fall back to embedded odds
  if (embeddedOdds) {
    console.log(`[Redis Odds Resolver] 📋 Falling back to embedded odds`)
    
    // Check if embedded odds has the new Redis structure
    if (embeddedOdds.lines) {
      const lineData = embeddedOdds.lines[line.toString()]
      
      if (lineData) {
        const overOdds = getBestOdds(lineData, "over")
        const underOdds = getBestOdds(lineData, "under")
        
        return {
          over: overOdds,
          under: underOdds,
          source: "embedded",
          lastUpdated: embeddedOdds.last_updated
        }
      }
    }
    
    // Fall back to old embedded format
    const lineKey = line.toString()
    if (embeddedOdds[lineKey]) {
      let bestOverOdds = -Infinity
      let bestOverBook = ""
      let bestOverLink = null
      
      Object.entries(embeddedOdds[lineKey]).forEach(([book, bookData]: [string, any]) => {
        let odds: number | undefined
        let link: string | undefined
        
        if (bookData && typeof bookData.odds === 'number') {
          odds = bookData.odds
          link = bookData.over_link || bookData.link
        } else if (typeof bookData === 'number') {
          odds = bookData
        }
        
        if (odds !== undefined && odds > bestOverOdds) {
          bestOverOdds = odds
          bestOverBook = book
          bestOverLink = link
        }
      })
      
      if (bestOverOdds !== -Infinity) {
        return {
          over: {
            odds: bestOverOdds,
            sportsbook: bestOverBook,
            link: bestOverLink
          },
          source: "fallback"
        }
      }
    }
  }
  
  console.log(`[Redis Odds Resolver] ❌ No odds found anywhere for player ${playerId}`)
  return null
}

/**
 * Get best odds from a line's sportsbook data for a specific bet type
 */
function getBestOdds(
  lineData: Record<string, any>, 
  betType: "over" | "under"
): { odds: number; sportsbook: string; link?: string } | undefined {
  let bestOdds = -Infinity
  let bestBook = ""
  let bestLink = undefined
  
  Object.entries(lineData).forEach(([sportsbook, bookData]: [string, any]) => {
    if (bookData && bookData[betType] && typeof bookData[betType].price === 'number') {
      const odds = bookData[betType].price
      const link = bookData[betType].link
      
      // Higher odds are always better for bettors
      if (odds > bestOdds) {
        bestOdds = odds
        bestBook = sportsbook
        bestLink = link
      }
    }
  })
  
  if (bestOdds === -Infinity) {
    return undefined
  }
  
  return {
    odds: bestOdds,
    sportsbook: bestBook,
    link: bestLink
  }
}

/**
 * Batch resolve odds for multiple profiles
 */
export async function resolveOddsForProfiles(
  profiles: Array<{
    player_id: number
    market: string
    line: number
    all_odds?: any
  }>,
  sport: string = "mlb"
): Promise<Record<string, ResolvedOdds | null>> {
  const results: Record<string, ResolvedOdds | null> = {}
  
  // Process in batches to avoid overwhelming Redis
  const BATCH_SIZE = 25
  for (let i = 0; i < profiles.length; i += BATCH_SIZE) {
    const batch = profiles.slice(i, i + BATCH_SIZE)
    
    await Promise.all(
      batch.map(async (profile) => {
        const key = `${profile.player_id}:${profile.market}:${profile.line}`
        const resolved = await resolveOddsForProfile(
          profile.player_id,
          profile.market,
          profile.line,
          sport,
          profile.all_odds
        )
        results[key] = resolved
      })
    )
    
    // Small delay between batches
    if (i + BATCH_SIZE < profiles.length) {
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }
  
  const foundCount = Object.values(results).filter(r => r !== null).length
  console.log(`[Redis Odds Resolver] Batch complete: ${foundCount}/${profiles.length} profiles have odds`)
  
  return results
} 