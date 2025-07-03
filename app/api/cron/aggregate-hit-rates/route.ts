import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"
import { PlayerHitRateProfile } from "@/types/hit-rates"

// Only allow authorized requests
const CRON_SECRET = process.env.CRON_SECRET || ""

// Markets to pre-aggregate
const MARKETS_TO_AGGREGATE = [
  'hits', 'home_runs', 'total_bases', 'rbis', 'runs_scored', 
  'strikeouts', 'walks', 'singles', 'doubles', 'triples',
  'hits_runs_rbis', 'pitcher_strikeouts', 'hits_allowed',
  'pitcher_walks', 'earned_runs', 'outs', 'record_a_win'
]

interface CachedHitRateData {
  hitRateProfile: PlayerHitRateProfile
  fallback_odds?: Record<string, any>
  lastUpdated: string
}

export async function GET(request: Request) {
  try {
    // Verify the request is authorized
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    
    if (secret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sport = 'mlb' // Focus on MLB for now
    let totalAggregated = 0
    let totalMarkets = 0

    console.log(`[CRON] Starting hit rate aggregation for ${MARKETS_TO_AGGREGATE.length} markets`)

    for (const market of MARKETS_TO_AGGREGATE) {
      try {
        console.log(`[CRON] Aggregating market: ${market}`)
        
        // Get all profiles for this market
        const pattern = `hit_rate:${sport}:*:${market}`
        let allProfiles: PlayerHitRateProfile[] = []
        let cursor = '0'
        let totalKeys = 0
        
        // Collect all keys first
        const allKeys: string[] = []
        do {
          const [nextCursor, keys] = await redis.scan(cursor, {
            match: pattern,
            count: 500 // Large batch size for efficiency
          })
          
          cursor = nextCursor
          allKeys.push(...keys)
          totalKeys += keys.length
        } while (cursor !== '0')

        if (allKeys.length === 0) {
          console.log(`[CRON] No keys found for market: ${market}`)
          continue
        }

        console.log(`[CRON] Found ${allKeys.length} keys for market: ${market}`)

        // Fetch all profiles in batches using pipeline
        const batchSize = 100
        for (let i = 0; i < allKeys.length; i += batchSize) {
          const batch = allKeys.slice(i, i + batchSize)
          
          try {
            const batchData = await redis.mget<CachedHitRateData[]>(...batch)
            
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
                  console.error(`[CRON] Error parsing profile:`, e)
                  return null
                }
              })
              .filter(Boolean) as PlayerHitRateProfile[]
            
            allProfiles.push(...validProfiles)
            
            // Small delay to avoid overwhelming Redis
            if (i + batchSize < allKeys.length) {
              await new Promise(resolve => setTimeout(resolve, 10))
            }
          } catch (batchError) {
            console.error(`[CRON] Error fetching batch for market ${market}:`, batchError)
          }
        }

        if (allProfiles.length > 0) {
          // Filter out players whose games have already started
          const now = new Date()
          const upcomingProfiles = allProfiles.filter(profile => {
            if (!profile.commence_time) return true
            const gameTime = new Date(profile.commence_time)
            return gameTime > now
          })

          // Store aggregated data with 10 minute TTL
          const aggregatedKey = `hit_rate_market:${sport}:${market}`
          
          try {
            await redis.setex(aggregatedKey, 600, JSON.stringify(upcomingProfiles))
            console.log(`[CRON] ✅ Aggregated ${upcomingProfiles.length} profiles for market: ${market}`)
            totalAggregated += upcomingProfiles.length
          } catch (storeError) {
            console.error(`[CRON] Error storing aggregated data for market ${market}:`, storeError)
          }
        } else {
          console.log(`[CRON] No valid profiles found for market: ${market}`)
        }

        totalMarkets++
        
        // Delay between markets to avoid overwhelming Redis
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (marketError) {
        console.error(`[CRON] Error processing market ${market}:`, marketError)
      }
    }

    // Store aggregation metadata
    const metadata = {
      lastAggregated: new Date().toISOString(),
      marketsProcessed: totalMarkets,
      totalProfiles: totalAggregated,
      sport
    }

    await redis.setex('hit_rate_aggregation_metadata', 3600, JSON.stringify(metadata))

    console.log(`[CRON] ✅ Aggregation complete: ${totalMarkets} markets, ${totalAggregated} total profiles`)

    return NextResponse.json({
      success: true,
      marketsProcessed: totalMarkets,
      totalProfiles: totalAggregated,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[CRON] Hit rate aggregation error:', error)
    return NextResponse.json({ error: 'Aggregation failed' }, { status: 500 })
  }
}

// Also allow POST for manual triggering
export async function POST(request: Request) {
  return GET(request)
} 