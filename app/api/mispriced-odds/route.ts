import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { MispricedOddsResponse } from '@/types/mispriced-odds'

export async function GET() {
  try {
    // Check cache for mispriced odds
    const CACHE_KEY = 'mispriced_odds:homepage'
    const cached = await redis.get(CACHE_KEY) as any
    
    if (cached) {
      // Return cached data
      const response: MispricedOddsResponse = {
        ...cached,
        cache_hit: true
      }
      
      return NextResponse.json(response)
    }
    
    // No cached data available
    return NextResponse.json({ 
      selections: [], 
      generated_at: new Date().toISOString(),
      sports_scanned: [],
      total_selections: 0,
      cache_hit: false,
      message: "Mispriced odds data is being generated. Please try again in a few minutes."
    })
    
  } catch (error) {
    console.error('Error fetching mispriced odds:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      selections: [],
      generated_at: new Date().toISOString(),
      sports_scanned: [],
      total_selections: 0,
      cache_hit: false
    }, { status: 500 })
  }
} 