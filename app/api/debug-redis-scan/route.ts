import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export async function GET() {
  try {
    console.log('🔍 Scanning Redis for odds keys...')
    
    // Check different key patterns
    const patterns = [
      'odds:mlb:*',
      'odds:wnba:*', 
      'odds:nfl:*',
      'odds:nba:*',
      'odds:nhl:*'
    ]
    
    const results: Record<string, any> = {}
    
    for (const pattern of patterns) {
      console.log(`Scanning pattern: ${pattern}`)
      
      // Use SCAN instead of KEYS for large datasets
      let cursor = '0'
      const keys: string[] = []
      const markets = new Set<string>()
      let scannedCount = 0
      
      do {
        const [nextCursor, batchKeys] = await redis.scan(cursor, {
          match: pattern,
          count: 100
        })
        cursor = nextCursor
        keys.push(...batchKeys)
        
        // Extract markets from this batch
        batchKeys.forEach(key => {
          const parts = key.split(':')
          if (parts[3]) markets.add(parts[3])
        })
        
        scannedCount++
        // Limit to prevent too much data
        if (scannedCount >= 50 || keys.length >= 500) break
        
      } while (cursor !== '0')
      
      results[pattern] = {
        count: keys.length,
        scanned_batches: scannedCount,
        sample_keys: keys.slice(0, 5), // First 5 keys as examples
        markets: Array.from(markets).slice(0, 10) // First 10 unique markets
      }
    }
    
    // Also scan for any odds keys in general
    console.log('Scanning all odds keys...')
    let cursor = '0'
    const allOddsKeys: string[] = []
    const uniqueSports = new Set<string>()
    let totalScanned = 0
    
    do {
      const [nextCursor, batchKeys] = await redis.scan(cursor, {
        match: 'odds:*',
        count: 100
      })
      cursor = nextCursor
      allOddsKeys.push(...batchKeys)
      
      // Extract sports from this batch
      batchKeys.forEach(key => {
        const parts = key.split(':')
        if (parts[1]) uniqueSports.add(parts[1])
      })
      
      totalScanned++
      // Limit to prevent too much data
      if (totalScanned >= 50 || allOddsKeys.length >= 1000) break
      
    } while (cursor !== '0')
    
    results['total_odds_keys'] = {
      count: allOddsKeys.length,
      scanned_batches: totalScanned,
      sample_keys: allOddsKeys.slice(0, 10),
      unique_sports: Array.from(uniqueSports)
    }
    
    // Check for other key patterns that might exist
    const otherPatterns = [
      'mispriced_odds:*',
      'hit_rate_market:*',
      'game_lines:*'
    ]
    
    for (const pattern of otherPatterns) {
      // Use SCAN for other patterns too
      let cursor = '0'
      const keys: string[] = []
      
      const [nextCursor, batchKeys] = await redis.scan(cursor, {
        match: pattern,
        count: 50
      })
      keys.push(...batchKeys)
      
      if (keys.length > 0) {
        results[`other_${pattern}`] = {
          count: keys.length,
          sample_keys: keys.slice(0, 5)
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    })
    
  } catch (error) {
    console.error('Error scanning Redis:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to scan Redis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 