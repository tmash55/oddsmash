import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"
import { PlayerHitRateProfile } from "@/types/hit-rates"

// Market name mapping
const DISPLAY_TO_REDIS_MARKET_MAP: Record<string, string> = {
  "hits": "hits",
  "home runs": "home_runs", 
  "total bases": "total_bases",
  "rbis": "rbis",
  "runs": "runs_scored",
  "strikeouts": "strikeouts",
  "walks": "walks",
  "singles": "singles",
  "doubles": "doubles", 
  "triples": "triples",
  "hits+runs+rbis": "hits_runs_rbis",
  "pitcher strikeouts": "pitcher_strikeouts",
  "hits allowed": "hits_allowed",
  "pitcher walks": "pitcher_walks",
  "earned runs": "earned_runs",
  "outs": "outs",
  "pitcher win": "record_a_win"
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
    
    const baseField = sortField.endsWith("_custom") ? sortField.replace("_custom", "") : sortField
    
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
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport")?.toLowerCase() || "mlb"
    const displayMarket = searchParams.get("market") || "Hits"
    const timeWindow = searchParams.get("timeWindow") || "10_games"
    const minHitRate = searchParams.get("minHitRate") ? parseFloat(searchParams.get("minHitRate")!) : 0.5
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 25
    const sortField = searchParams.get("sortField") || "L10"
    const sortDirection = searchParams.get("sortDirection") as "asc" | "desc" || "desc"
    const selectedGamesParam = searchParams.get("selectedGames")
    const selectedGames = selectedGamesParam ? selectedGamesParam.split(',') : null

    const redisMarket = getRedisMarketKey(displayMarket)
    
    // Try to get pre-aggregated market data first
    const aggregatedKey = `hit_rate_market:${sport}:${redisMarket}`
    console.log(`[/api/hit-rates-aggregated] Checking aggregated key: ${aggregatedKey}`)
    
    let aggregatedData = await redis.get(aggregatedKey)
    
    // If no aggregated data found, try with space version of market name
    if (!aggregatedData) {
      const spaceAggregatedKey = `hit_rate_market:${sport}:${displayMarket.toLowerCase()}`
      console.log(`[/api/hit-rates-aggregated] Trying space version: ${spaceAggregatedKey}`)
      aggregatedData = await redis.get(spaceAggregatedKey)
    }

    if (aggregatedData) {
      console.log(`[/api/hit-rates-aggregated] ✅ Found aggregated data`)
      
      let profiles: PlayerHitRateProfile[]
      
      // Handle different data formats
      if (typeof aggregatedData === 'string') {
        profiles = JSON.parse(aggregatedData)
      } else if (Array.isArray(aggregatedData)) {
        profiles = aggregatedData
      } else if (aggregatedData && typeof aggregatedData === 'object' && 'profiles' in aggregatedData) {
        profiles = (aggregatedData as any).profiles
      } else {
        console.log(`[/api/hit-rates-aggregated] Invalid aggregated data format`)
        throw new Error('Invalid aggregated data format')
      }

      console.log(`[/api/hit-rates-aggregated] Processing ${profiles.length} aggregated profiles`)

      // Apply hit rate filter
      const hitRateField = timeWindow === "5_games" 
        ? "last_5_hit_rate" 
        : timeWindow === "10_games" 
          ? "last_10_hit_rate" 
          : "last_20_hit_rate"

      let filteredProfiles = profiles.filter(profile => {
        const hitRate = profile[hitRateField as keyof PlayerHitRateProfile] as number
        return hitRate >= minHitRate * 100
      })

      // Apply game filtering if specified
      if (selectedGames && selectedGames.length > 0) {
        filteredProfiles = filteredProfiles.filter(profile => 
          profile.odds_event_id && selectedGames.includes(profile.odds_event_id)
        )
      }

      // Filter out players whose games have already started
      const now = new Date()
      const upcomingProfiles = filteredProfiles.filter(profile => {
        if (!profile.commence_time) return true
        const gameTime = new Date(profile.commence_time)
        return gameTime > now
      })

      // Apply server-side sorting
      const sortedProfiles = sortProfiles(upcomingProfiles, sortField, sortDirection)

      // Calculate pagination
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedProfiles = sortedProfiles.slice(startIndex, endIndex)
      const totalPages = Math.ceil(sortedProfiles.length / limit)

      console.log(`[/api/hit-rates-aggregated] ⚡ Fast response: ${paginatedProfiles.length} profiles (page ${page}/${totalPages})`)

      return NextResponse.json({
        profiles: paginatedProfiles,
        totalPages,
        totalProfiles: sortedProfiles.length,
        source: 'aggregated-redis'
      })
    }

    // Fallback to individual key scanning (slower)
    console.log(`[/api/hit-rates-aggregated] No aggregated data, falling back to individual keys`)
    
    // Try both underscore and space versions
    const patterns = [
      `hit_rate:${sport}:*:${redisMarket}`, // Underscore version (e.g., total_bases)
      `hit_rate:${sport}:*:${displayMarket.toLowerCase()}` // Space version (e.g., total bases)
    ]
    
    let allProfiles: PlayerHitRateProfile[] = []
    const keys: string[] = []
    
    // Scan for both patterns
    for (const pattern of patterns) {
      console.log(`[/api/hit-rates-aggregated] Scanning pattern: ${pattern}`)
      let cursor = '0'
      
      do {
        const [nextCursor, batchKeys] = await redis.scan(cursor, {
          match: pattern,
          count: 200 // Larger batch size
        })
        
        cursor = nextCursor
        keys.push(...batchKeys)
      } while (cursor !== '0')
    }

    if (keys.length === 0) {
      return NextResponse.json({
        profiles: [],
        totalPages: 0,
        totalProfiles: 0,
        source: 'redis-empty'
      })
    }

    console.log(`[/api/hit-rates-aggregated] Found ${keys.length} keys, fetching in batches`)

    // Fetch all data using pipeline for better performance
    const batchSize = 100
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize)
      const batchData = await redis.mget(...batch)
      
      const validProfiles = batchData
        .filter(Boolean)
        .map(item => {
          try {
            if (item && typeof item === 'object') {
              if ('hitRateProfile' in item) {
                return item.hitRateProfile
              }
              if ('player_id' in item && 'market' in item) {
                return item as PlayerHitRateProfile
              }
            }
            return null
          } catch (e) {
            return null
          }
        })
        .filter(Boolean) as PlayerHitRateProfile[]
      
      allProfiles.push(...validProfiles)
    }

    // Store aggregated data for next time (5 minute TTL)
    if (allProfiles.length > 0) {
      try {
        await redis.setex(aggregatedKey, 300, JSON.stringify(allProfiles))
        console.log(`[/api/hit-rates-aggregated] Cached ${allProfiles.length} profiles for future requests`)
      } catch (cacheError) {
        console.error(`[/api/hit-rates-aggregated] Failed to cache aggregated data:`, cacheError)
      }
    }

    // Apply same filtering and sorting logic
    const hitRateField = timeWindow === "5_games" 
      ? "last_5_hit_rate" 
      : timeWindow === "10_games" 
        ? "last_10_hit_rate" 
        : "last_20_hit_rate"

    let filteredProfiles = allProfiles.filter(profile => {
      const hitRate = profile[hitRateField as keyof PlayerHitRateProfile] as number
      return hitRate >= minHitRate * 100
    })

    if (selectedGames && selectedGames.length > 0) {
      filteredProfiles = filteredProfiles.filter(profile => 
        profile.odds_event_id && selectedGames.includes(profile.odds_event_id)
      )
    }

    const now = new Date()
    const upcomingProfiles = filteredProfiles.filter(profile => {
      if (!profile.commence_time) return true
      const gameTime = new Date(profile.commence_time)
      return gameTime > now
    })

    const sortedProfiles = sortProfiles(upcomingProfiles, sortField, sortDirection)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedProfiles = sortedProfiles.slice(startIndex, endIndex)
    const totalPages = Math.ceil(sortedProfiles.length / limit)

    return NextResponse.json({
      profiles: paginatedProfiles,
      totalPages,
      totalProfiles: sortedProfiles.length,
      source: 'redis-fallback'
    })

  } catch (error) {
    console.error('[/api/hit-rates-aggregated] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 