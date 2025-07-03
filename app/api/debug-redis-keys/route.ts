import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport")?.toLowerCase() || "mlb"
    const market = searchParams.get("market") || "Doubles"
    
    // Try both patterns that the main API uses
    const patterns = [
      `hit_rate:${sport}:*:doubles`, // underscore/lowercase version
      `hit_rate:${sport}:*:${market.toLowerCase()}` // space version
    ]
    
    const results: Record<string, string[]> = {}
    
    for (const pattern of patterns) {
      console.log(`Scanning for pattern: ${pattern}`)
      let cursor = '0'
      const keys: string[] = []
      
      do {
        const [nextCursor, batchKeys] = await redis.scan(cursor, {
          match: pattern,
          count: 100
        })
        cursor = nextCursor
        keys.push(...batchKeys)
      } while (cursor !== '0')
      
      results[pattern] = keys
    }
    
    return NextResponse.json({
      sport,
      market,
      patterns: results,
      summary: {
        pattern1_count: results[patterns[0]].length,
        pattern2_count: results[patterns[1]].length,
        pattern1_keys: results[patterns[0]].slice(0, 5), // First 5 keys
        pattern2_keys: results[patterns[1]].slice(0, 5), // First 5 keys
      }
    })
    
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({ error: 'Failed to scan Redis keys' }, { status: 500 })
  }
} 