import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { sports } from '@/data/sports-data'
import { 
  MispricedSelection, 
  MispricedOddsCache,
  SPORT_REDIS_MAPPING, 
  PRIORITY_MARKETS_BY_SPORT 
} from '@/types/mispriced-odds'

function calculateValueScore(bestOdds: number, avgOdds: number, sportsbookCount: number): number {
  const percentDiff = Math.abs((bestOdds - avgOdds) / avgOdds * 100)
  const liquidityScore = Math.min(sportsbookCount / 5, 1) // More books = better
  const oddsScore = Math.abs(bestOdds) < 200 ? 1.2 : 1.0 // Favor shorter odds slightly
  
  return percentDiff * liquidityScore * oddsScore
}

function analyzeLineForMispricing(
  lineData: any, 
  propData: any, 
  line: string, 
  sport: string, 
  market: string
): MispricedSelection | null {
  const sportsbooks = Object.keys(lineData)
  if (sportsbooks.length < 3) return null // Need at least 3 books
  
  // Collect all over/under odds
  const overOdds: number[] = []
  const underOdds: number[] = []
  let bestOverBook = '', bestUnderBook = ''
  let bestOverOdds = -Infinity, bestUnderOdds = Infinity
  
  for (const [book, bookData] of Object.entries(lineData as Record<string, any>)) {
    if (bookData?.over?.price) {
      overOdds.push(bookData.over.price)
      if (bookData.over.price > bestOverOdds) {
        bestOverOdds = bookData.over.price
        bestOverBook = book
      }
    }
    if (bookData?.under?.price) {
      underOdds.push(bookData.under.price)
      if (bookData.under.price < bestUnderOdds) {
        bestUnderOdds = bookData.under.price
        bestUnderBook = book
      }
    }
  }
  
  if (overOdds.length === 0 && underOdds.length === 0) return null
  
  // Calculate averages and find best value
  const avgOverOdds = overOdds.length > 0 ? overOdds.reduce((a, b) => a + b) / overOdds.length : 0
  const avgUnderOdds = underOdds.length > 0 ? underOdds.reduce((a, b) => a + b) / underOdds.length : 0
  
  // Determine which side has better value (10% threshold)
  const overDiff = avgOverOdds > 0 ? Math.abs((bestOverOdds - avgOverOdds) / avgOverOdds * 100) : 0
  const underDiff = avgUnderOdds < 0 ? Math.abs((bestUnderOdds - avgUnderOdds) / avgUnderOdds * 100) : 0
  
  const useBestOver = overDiff > underDiff && overDiff >= 10
  const useBestUnder = underDiff > overDiff && underDiff >= 10
  
  if (!useBestOver && !useBestUnder) return null
  
  const selection: MispricedSelection = {
    player_id: propData.player_id,
    player_name: propData.description,
    sport_key: sport,
    market: market,
    line: parseFloat(line),
    bet_type: useBestOver ? 'over' : 'under',
    
    event_id: propData.event_id,
    home_team: propData.home_team,
    away_team: propData.away_team,
    commence_time: propData.commence_time,
    
    best_sportsbook: useBestOver ? bestOverBook : bestUnderBook,
    best_odds: useBestOver ? bestOverOdds : bestUnderOdds,
    average_odds: useBestOver ? avgOverOdds : avgUnderOdds,
    percentage_diff: useBestOver ? overDiff : underDiff,
    sportsbooks_count: sportsbooks.length,
    
    value_score: calculateValueScore(
      useBestOver ? bestOverOdds : bestUnderOdds,
      useBestOver ? avgOverOdds : avgUnderOdds,
      sportsbooks.length
    ),
    last_updated: propData.last_updated
  }
  
  return selection
}

async function analyzeMarketKeys(
  keys: string[], 
  sport: string, 
  market: string
): Promise<MispricedSelection[]> {
  const selections: MispricedSelection[] = []
  const now = new Date()
  const fiveDaysFromNow = new Date(now.getTime() + (5 * 24 * 60 * 60 * 1000))
  
  for (const key of keys) {
    try {
      const data = await redis.get(key) as string | null
      if (!data) continue
      
      const propData = JSON.parse(data)
      
      // Filter: Only upcoming games within 5 days
      const gameTime = new Date(propData.commence_time)
      if (gameTime <= now || gameTime > fiveDaysFromNow) continue
      
      // Analyze each line (0.5, 1.5, etc.)
      for (const [line, lineData] of Object.entries(propData.lines || {})) {
        const analysis = analyzeLineForMispricing(lineData, propData, line, sport, market)
        if (analysis && analysis.percentage_diff >= 10) { // 10% threshold
          selections.push(analysis)
        }
      }
    } catch (error) {
      console.error(`Error analyzing key ${key}:`, error)
      continue
    }
  }
  
  // Return sorted by value score (best first)
  return selections.sort((a, b) => b.value_score - a.value_score)
}

async function scanSportForMispricedOdds(sport: string): Promise<MispricedSelection[]> {
  const redisKey = SPORT_REDIS_MAPPING[sport]
  if (!redisKey) return []
  
  const markets = PRIORITY_MARKETS_BY_SPORT[redisKey] || []
  const selections: MispricedSelection[] = []
  const usedMarkets = new Set<string>()
  
  // Scan each priority market until we find good selections
  for (const market of markets) {
    if (usedMarkets.has(market)) continue
    
    try {
      const keyPattern = `odds:${redisKey}:*:${market}`
      const keys = await redis.keys(keyPattern)
      
      if (keys.length === 0) continue
      
      const marketSelections = await analyzeMarketKeys(keys, sport, market)
      
      // Take the best selection from this market
      if (marketSelections.length > 0) {
        selections.push(marketSelections[0]) // Best by value score
        usedMarkets.add(market)
      }
      
      // Stop if we have enough selections for this sport (max 2-3 per sport)
      if (selections.length >= 2) break
      
    } catch (error) {
      console.error(`Error scanning market ${market} for sport ${sport}:`, error)
      continue
    }
  }
  
  return selections
}

async function generateMispricedOdds(): Promise<MispricedOddsCache> {
  // Upstash Redis is always connected, no need to manage connections
  
  const activeSports = sports.filter(s => s.active).map(s => s.id)
  const allSelections: MispricedSelection[] = []
  
  console.log(`Scanning ${activeSports.length} active sports for mispriced odds...`)
  
  // Scan each active sport
  for (const sport of activeSports) {
    try {
      console.log(`Scanning sport: ${sport}`)
      const sportSelections = await scanSportForMispricedOdds(sport)
      allSelections.push(...sportSelections)
      console.log(`Found ${sportSelections.length} selections for ${sport}`)
    } catch (error) {
      console.error(`Error scanning sport ${sport}:`, error)
    }
  }
  
  // Sort all selections by value score and take top 8-12
  const topSelections = allSelections
    .sort((a, b) => b.value_score - a.value_score)
    .slice(0, 12)
  
  console.log(`Generated ${topSelections.length} total mispriced selections`)
  
  return {
    selections: topSelections,
    generated_at: new Date().toISOString(),
    sports_scanned: activeSports,
    total_selections: topSelections.length
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (optional security)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('Starting mispriced odds generation...')
    
    const result = await generateMispricedOdds()
    
    // Cache the results in Redis (15 minute TTL)
    const CACHE_KEY = 'mispriced_odds:homepage'
    const CACHE_TTL = 15 * 60 // 15 minutes
    
    await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(result))
    
    console.log(`Cached ${result.total_selections} mispriced odds selections`)
    
    return NextResponse.json({ 
      success: true,
      cached_selections: result.total_selections,
      sports_scanned: result.sports_scanned.length,
      generated_at: result.generated_at
    })
    
  } catch (error) {
    console.error('Error generating mispriced odds:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    // Upstash Redis connections are managed automatically
  }
} 