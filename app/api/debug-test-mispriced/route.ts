import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { sports } from '@/data/sports-data'
import { SPORT_REDIS_MAPPING, PRIORITY_MARKETS_BY_SPORT } from '@/types/mispriced-odds'

export async function GET() {
  try {
    console.log('🧪 Testing mispriced odds logic...')
    
    // Step 1: Check active sports
    const activeSports = sports.filter(s => s.active).map(s => s.id)
    console.log('Active sports from sports-data.ts:', activeSports)
    
    const results: any = {
      active_sports: activeSports,
      sport_mappings: {},
      redis_data: {},
      test_results: {}
    }
    
    // Step 2: Check sport mappings
    for (const sport of activeSports) {
      const redisKey = SPORT_REDIS_MAPPING[sport]
      const priorityMarkets = PRIORITY_MARKETS_BY_SPORT[redisKey] || []
      
      results.sport_mappings[sport] = {
        redis_key: redisKey,
        priority_markets: priorityMarkets,
        has_mapping: !!redisKey,
        has_markets: priorityMarkets.length > 0
      }
      
      console.log(`Sport: ${sport} -> Redis: ${redisKey}, Markets: ${priorityMarkets.length}`)
      
      // Step 3: Check Redis data for this sport
      if (redisKey) {
        for (const market of priorityMarkets.slice(0, 2)) { // Test first 2 markets
          const keyPattern = `odds:${redisKey}:*:${market.replace(/ /g, '_')}`
          console.log(`Checking pattern: ${keyPattern}`)
          
          // Use SCAN instead of KEYS
          let cursor = '0'
          const keys: string[] = []
          
          const [nextCursor, batchKeys] = await redis.scan(cursor, {
            match: keyPattern,
            count: 50
          })
          keys.push(...batchKeys)
          results.redis_data[`${sport}_${market}`] = {
            pattern: keyPattern,
            key_count: keys.length,
            sample_keys: keys.slice(0, 3)
          }
          
          // Test analyzing a sample key
          if (keys.length > 0) {
            try {
              const sampleKey = keys[0]
              const data = await redis.get(sampleKey)
              if (data) {
                const propData = JSON.parse(data as string)
                
                results.test_results[`${sport}_${market}_sample`] = {
                  key: sampleKey,
                  has_lines: !!propData.lines,
                  line_count: propData.lines ? Object.keys(propData.lines).length : 0,
                  commence_time: propData.commence_time,
                  player_name: propData.description,
                  sample_line_data: propData.lines ? Object.entries(propData.lines)[0] : null
                }
              }
            } catch (error) {
              console.error(`Error analyzing sample key ${keys[0]}:`, error)
            }
          }
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        active_sports_count: activeSports.length,
        mapped_sports: Object.keys(results.sport_mappings).filter(s => results.sport_mappings[s].has_mapping).length,
        sports_with_data: Object.keys(results.redis_data).filter(k => results.redis_data[k].key_count > 0).length
      },
      details: results
    })
    
  } catch (error) {
    console.error('Error testing mispriced odds logic:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to test mispriced odds logic',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 