import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"
import { PlayerHitRateProfile } from "@/types/hit-rates"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// Market name mapping - matches the display names to Redis keys
const DISPLAY_TO_REDIS_MARKET_MAP: Record<string, string> = {
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

interface CachedHitRateData {
  hitRateProfile: PlayerHitRateProfile
  fallback_odds?: Record<string, any>
  lastUpdated: string
}

// Convert display market name to Redis market key
function getRedisMarketKey(displayMarket: string): string {
  const normalized = displayMarket.toLowerCase()
  return DISPLAY_TO_REDIS_MARKET_MAP[normalized] || normalized.replace(/\s+/g, '_')
}

// Server-side sorting function
function sortProfiles(profiles: PlayerHitRateProfile[], sortField: string, sortDirection: "asc" | "desc") {
  return profiles.sort((a, b) => {
    let aValue: any
    let bValue: any
    
    // Handle custom tier sorting
    const isCustomSort = sortField.endsWith("_custom")
    const baseField = isCustomSort ? sortField.replace("_custom", "") : sortField
    
    switch (baseField) {
      case "name":
        aValue = a.player_name
        bValue = b.player_name
        break
      case "line":
        aValue = a.line
        bValue = b.line
        break
      case "average":
        aValue = a.avg_stat_per_game
        bValue = b.avg_stat_per_game
        break
      case "L5":
        aValue = a.last_5_hit_rate
        bValue = b.last_5_hit_rate
        break
      case "L10":
        aValue = a.last_10_hit_rate
        bValue = b.last_10_hit_rate
        break
      case "L20":
        aValue = a.last_20_hit_rate
        bValue = b.last_20_hit_rate
        break
      case "seasonHitRate":
        aValue = a.season_hit_rate || 0
        bValue = b.season_hit_rate || 0
        break
      default:
        aValue = a.last_10_hit_rate
        bValue = b.last_10_hit_rate
    }
    
    if (typeof aValue === "string") {
      return sortDirection === "asc" 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    } else {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue
    }
  })
}

export async function GET(request: Request) {
  try {
    // Check Redis connection first
    try {
      await redis.ping()
    } catch (error: any) {
      console.error('[/api/hit-rates-redis] Redis connection error:', error?.message || error)
      return NextResponse.json({ error: 'Redis connection failed' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport")?.toLowerCase() || "mlb"
    const displayMarket = searchParams.get("market") || "Hits"
    const timeWindow = searchParams.get("timeWindow") || "10_games"
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 25
    const sortField = searchParams.get("sortField") || "L10"
    const sortDirection = searchParams.get("sortDirection") as "asc" | "desc" || "desc"
    const selectedGamesParam = searchParams.get("selectedGames")
    const selectedGames = selectedGamesParam ? selectedGamesParam.split(',') : null

    // Use market-appropriate default hit rate thresholds
    const getDefaultMinHitRate = (market: string): number => {
      const lowerMarket = market.toLowerCase()
      // Rare events should have lower thresholds
      if (lowerMarket.includes('doubles') || lowerMarket.includes('triples') || 
          lowerMarket.includes('home runs') || lowerMarket.includes('total bases') ||
          lowerMarket.includes('stolen')) {
        return 0.2 // 20% for rare events
      }
      // Common events can have higher thresholds  
      return 0.5 // 50% for common events like hits
    }
    
    const defaultMinHitRate = getDefaultMinHitRate(displayMarket)
    const minHitRate = searchParams.get("minHitRate") ? parseFloat(searchParams.get("minHitRate")!) : defaultMinHitRate

    // Convert display market to Redis market key
    const redisMarket = getRedisMarketKey(displayMarket)
    console.log(`[/api/hit-rates-redis] Fetching hit rates from Redis - Sport: ${sport}, Display Market: ${displayMarket}, Redis Market: ${redisMarket}`)

    // Try both underscore and space versions since data might be stored in either format
    const redisMarketLower = redisMarket.toLowerCase()
    const displayMarketLower = displayMarket.toLowerCase()
    
    // Create unique patterns to avoid duplicates
    const marketPatterns = []
    marketPatterns.push(`hit_rate:${sport}:*:${redisMarketLower}`)
    
    // Only add the second pattern if it's different from the first
    if (redisMarketLower !== displayMarketLower) {
      marketPatterns.push(`hit_rate:${sport}:*:${displayMarketLower}`)
    }
    
    console.log(`[/api/hit-rates-redis] Using Redis patterns:`, marketPatterns)

    let allProfiles: PlayerHitRateProfile[] = []
    
    // Try each pattern
    for (const pattern of marketPatterns) {
      console.log(`[/api/hit-rates-redis] Searching with pattern: ${pattern}`)
      let cursor = '0'
      
      do {
        // Use SCAN to get keys matching the pattern
        const [nextCursor, keys] = await redis.scan(cursor, {
          match: pattern,
          count: 100 // Process in batches
        })
        
        cursor = nextCursor
        
        if (keys.length > 0) {
          console.log(`[/api/hit-rates-redis] Found ${keys.length} keys in this batch for pattern: ${pattern}`)
          
          // Fetch all profiles in this batch
          const batchData = await redis.mget<CachedHitRateData[]>(...keys)
          
          // Process each item
          const validProfiles = batchData
            .filter(Boolean)
            .map(item => {
              try {
                // Handle different data formats
                if (item && typeof item === 'object') {
                  // If it's wrapped in CachedHitRateData format
                  if ('hitRateProfile' in item) {
                    return item.hitRateProfile
                  }
                  // If it's a direct PlayerHitRateProfile
                  if ('player_id' in item && 'market' in item) {
                    return item as PlayerHitRateProfile
                  }
                }
                return null
              } catch (e) {
                console.error('[/api/hit-rates-redis] Error parsing profile:', e)
                return null
              }
            })
            .filter(Boolean) as PlayerHitRateProfile[]
          
          allProfiles.push(...validProfiles)
        }
      } while (cursor !== '0')
    }

    console.log(`[/api/hit-rates-redis] Retrieved ${allProfiles.length} profiles from Redis`)

    if (allProfiles.length === 0) {
      return NextResponse.json({
        profiles: [],
        totalPages: 0,
        totalProfiles: 0,
        source: 'redis-empty'
      })
    }

    // Remove duplicates based on player_id (keep the first occurrence)
    const uniqueProfiles = allProfiles.filter((profile, index, arr) => 
      arr.findIndex(p => p.player_id === profile.player_id) === index
    )
    
    console.log(`[/api/hit-rates-redis] After deduplication: ${uniqueProfiles.length} unique profiles (removed ${allProfiles.length - uniqueProfiles.length} duplicates)`)

    // Apply server-side sorting
    const sortedProfiles = sortProfiles(uniqueProfiles, sortField, sortDirection)

    // Return all profiles in a single response
    return NextResponse.json({
      profiles: sortedProfiles,
      totalPages: 1, // Since we're returning all profiles at once
      totalProfiles: sortedProfiles.length,
      source: 'redis'
    })

  } catch (error) {
    console.error('[/api/hit-rates-redis] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 