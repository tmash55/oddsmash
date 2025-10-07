import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { redis } from '@/lib/redis'
import { 
  EVPlay, 
  EVPlaysResponse, 
  EVFilters, 
  EV_KEYS,
  SUPPORTED_SPORTS,
  SUPPORTED_SCOPES
} from '@/types/ev-types'

// Validation schema for query parameters
const EVFiltersSchema = z.object({
  sports: z.string().nullish().transform(str => str?.split(',').filter(s => SUPPORTED_SPORTS.includes(s as any))),
  scopes: z.string().nullish().transform(str => str?.split(',').filter(s => SUPPORTED_SCOPES.includes(s as any))),
  min_ev: z.string().nullish().transform(str => str ? parseFloat(str) : undefined),
  max_ev: z.string().nullish().transform(str => str ? parseFloat(str) : undefined),
  markets: z.string().nullish().transform(str => str?.split(',').filter(Boolean)),
  books: z.string().nullish().transform(str => str?.split(',').filter(Boolean)),
  limit: z.string().nullish().transform(str => str ? Math.min(parseInt(str), 200) : 50), // Max 200
  offset: z.string().nullish().transform(str => str ? parseInt(str) : 0),
  sort_by: z.enum(['ev_percentage', 'best_odds', 'start', 'timestamp']).nullish().default('ev_percentage'),
  sort_direction: z.enum(['asc', 'desc']).nullish().default('desc')
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse and validate filters
    const rawFilters = {
      sports: searchParams.get('sports'),
      scopes: searchParams.get('scopes'),
      min_ev: searchParams.get('min_ev'),
      max_ev: searchParams.get('max_ev'),
      markets: searchParams.get('markets'),
      books: searchParams.get('books'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      sort_by: searchParams.get('sort_by'),
      sort_direction: searchParams.get('sort_direction')
    }
    
    const filters = EVFiltersSchema.parse(rawFilters)
    
    // Default to all active sports if none specified
    const targetSports = filters.sports?.length ? filters.sports : ['nfl', 'nba', 'mlb']
    const targetScopes = filters.scopes?.length ? filters.scopes : ['pregame']
    
    // Generate cache key for this specific request
    const cacheKey = EV_KEYS.combined(targetSports, targetScopes) + 
      `:${filters.min_ev || 0}:${filters.limit}:${filters.sort_by}:${filters.sort_direction}`
    
    // Try cache first (30 second TTL for EV data)
    const cachedData = await redis.get<EVPlay[]>(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: parsed.slice(filters.offset, filters.offset + filters.limit),
        metadata: {
          total_count: parsed.length,
          sports: targetSports,
          last_updated: new Date().toISOString(),
          cache_hit: true
        }
      } satisfies EVPlaysResponse)
    }
    
    // Fetch from individual sport/scope keys in parallel
    const fetchPromises: Promise<EVPlay[]>[] = []
    
    for (const sport of targetSports) {
      for (const scope of targetScopes) {
        const key = EV_KEYS.sport(sport, scope)
        fetchPromises.push(
          redis.get(key).then(data => {
            if (!data) return []
            try {
              // Handle both string and object responses from Redis
              if (typeof data === 'string') {
                return JSON.parse(data) as EVPlay[]
              } else if (Array.isArray(data)) {
                return data as EVPlay[]
              } else if (typeof data === 'object') {
                // Sometimes Upstash returns objects directly
                console.log(`[EV API] Got object directly from Redis for ${key}`)
                return data as EVPlay[]
              }
              console.warn(`[EV API] Unexpected data type for ${key}:`, typeof data)
              return []
            } catch (error) {
              console.error(`[EV API] Failed to parse data for ${key}:`, error)
              return []
            }
          })
        )
      }
    }
    
    const startTime = Date.now()
    const results = await Promise.all(fetchPromises)
    const fetchTime = Date.now() - startTime
    
    // Merge all results
    let allPlays: EVPlay[] = results.flat()
    
    // Apply filters
    if (filters.min_ev !== undefined) {
      allPlays = allPlays.filter(play => play.ev_percentage >= filters.min_ev!)
    }
    
    if (filters.max_ev !== undefined) {
      allPlays = allPlays.filter(play => play.ev_percentage <= filters.max_ev!)
    }
    
    if (filters.markets?.length) {
      allPlays = allPlays.filter(play => filters.markets!.includes(play.market))
    }
    
    if (filters.books?.length) {
      allPlays = allPlays.filter(play => filters.books!.includes(play.best_book))
    }
    
    // Sort the results
    allPlays.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (filters.sort_by) {
        case 'ev_percentage':
          aValue = a.ev_percentage
          bValue = b.ev_percentage
          break
        case 'best_odds':
          aValue = a.best_odds
          bValue = b.best_odds
          break
        case 'start':
          aValue = new Date(a.start).getTime()
          bValue = new Date(b.start).getTime()
          break
        case 'timestamp':
          aValue = a.timestamp
          bValue = b.timestamp
          break
        default:
          aValue = a.ev_percentage
          bValue = b.ev_percentage
      }
      
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      return filters.sort_direction === 'desc' ? -comparison : comparison
    })
    
    // Cache the full result set (before pagination)
    await redis.setex(cacheKey, 30, JSON.stringify(allPlays))
    
    // Apply pagination
    const paginatedPlays = allPlays.slice(filters.offset, filters.offset + filters.limit)
    
    // Set performance headers
    const response = NextResponse.json({
      success: true,
      data: paginatedPlays,
      metadata: {
        total_count: allPlays.length,
        sports: targetSports,
        last_updated: new Date().toISOString(),
        cache_hit: false
      }
    } as EVPlaysResponse)
    
    response.headers.set('X-Fetch-Time', `${fetchTime}ms`)
    response.headers.set('X-Total-Keys', fetchPromises.length.toString())
    response.headers.set('Cache-Control', 'public, max-age=15, s-maxage=30')
    
    return response
    
  } catch (error) {
    console.error('[EV API] Error:', error)
    
    return NextResponse.json({
      success: false,
      data: [],
      metadata: {
        total_count: 0,
        sports: [],
        last_updated: new Date().toISOString(),
        cache_hit: false
      },
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

// GET endpoint info for development
export async function OPTIONS() {
  return NextResponse.json({
    description: 'EV Plays API',
    parameters: {
      sports: 'Comma-separated list of sports (nfl,nba,mlb)',
      scopes: 'Comma-separated list of scopes (pregame,live)',
      min_ev: 'Minimum EV percentage',
      max_ev: 'Maximum EV percentage',
      markets: 'Comma-separated list of markets',
      books: 'Comma-separated list of sportsbooks',
      limit: 'Number of results (max 200, default 50)',
      offset: 'Pagination offset',
      sort_by: 'ev_percentage|best_odds|start|timestamp',
      sort_direction: 'asc|desc'
    },
    examples: [
      '/api/ev-plays?sports=nfl&min_ev=5&limit=25',
      '/api/ev-plays?sports=nfl,nba&scopes=pregame&sort_by=ev_percentage',
      '/api/ev-plays?markets=total,spread&books=fanduel,draftkings'
    ]
  })
}
