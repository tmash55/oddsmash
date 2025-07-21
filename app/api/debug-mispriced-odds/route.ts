import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export async function GET() {
  try {
    console.log('🔍 Checking mispriced odds cache...')
    
    const CACHE_KEY = 'mispriced_odds:homepage'
    
    // Get the cached data
    const cachedData = await redis.get(CACHE_KEY)
    
    if (!cachedData) {
      return NextResponse.json({ 
        success: false,
        message: 'No mispriced odds data found in cache',
        cache_key: CACHE_KEY,
        suggestions: [
          'The cron job may not have run yet',
          'Check Vercel cron logs',
          'Manually trigger the cron job'
        ]
      })
    }
    
    const data = JSON.parse(cachedData as string)
    
    // Get TTL (time to live) of the key
    const ttl = await redis.ttl(CACHE_KEY)
    
    return NextResponse.json({ 
      success: true,
      cache_key: CACHE_KEY,
      data_found: true,
      total_selections: data.total_selections || 0,
      sports_scanned: data.sports_scanned || [],
      generated_at: data.generated_at,
      cache_ttl_seconds: ttl,
      cache_expires_in: ttl > 0 ? `${Math.floor(ttl / 60)} minutes ${ttl % 60} seconds` : 'Never',
      sample_selections: data.selections?.slice(0, 3).map((selection: any) => ({
        player: selection.player_name,
        sport: selection.sport_key,
        market: selection.market,
        line: selection.line,
        bet_type: selection.bet_type,
        best_odds: selection.best_odds,
        sportsbook: selection.best_sportsbook,
        percentage_diff: selection.percentage_diff,
        value_score: selection.value_score
      })) || []
    })
    
  } catch (error) {
    console.error('Error checking mispriced odds cache:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to check cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 