import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { redis } from '@/lib/redis'
import { EVExpansionData, EVPlay } from '@/types/ev-types'

// Validation schema for expansion request
const ExpansionRequestSchema = z.object({
  sport: z.string().min(1),
  event_id: z.string().min(1),
  market: z.string().min(1),
  market_key: z.string().min(1),
  player_id: z.string().nullish(), // Can be null for game props
  side: z.enum(['over', 'under']),
  line: z.string().transform(str => parseFloat(str))
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const rawParams = {
      sport: searchParams.get('sport'),
      event_id: searchParams.get('event_id'),
      market: searchParams.get('market'),
      market_key: searchParams.get('market_key'),
      player_id: searchParams.get('player_id'),
      side: searchParams.get('side'),
      line: searchParams.get('line')
    }
    
    const params = ExpansionRequestSchema.parse(rawParams)
    
    // Generate cache key for this expansion request
    const cacheKey = `ev:expansion:${params.sport}:${params.event_id}:${params.market}${params.player_id ? `:${params.player_id}` : ''}:${params.side}:${params.line}`
    
    // Try cache first (5 minute TTL for expansion data)
    const cachedData = await redis.get(cacheKey)
    if (typeof cachedData === 'string') {
        try{
            const data = JSON.parse(cachedData)
            return NextResponse.json({
                success: true,
                data,
                cached: true
            })
        }
        catch{void 0;}
      
    }
    
    // For demo purposes, create mock expansion data based on the EV play
    // In production, this would fetch from the actual market_key
    const startTime = Date.now()
    
    // For player props, we need to use the pointer field from the EV data
    // First, try to get the EV play data to find the pointer
    let oddsKey = params.market_key
    
    // If this is a player prop (has player_id), we need to find the pointer
    if (params.player_id) {
      // Try to find the EV play data to get the pointer
      const evKeys = [
        `ev:${params.sport}:pregame`,
        `ev:${params.sport}:live`
      ]
      
      let pointer = null
      for (const evKey of evKeys) {
        const evData = await redis.get(evKey)
        if (evData) {
          let parsedEvData
          try {
            parsedEvData = typeof evData === 'string' ? JSON.parse(evData) : evData
          } catch (e) {
            continue
          }
          
          // Look for the matching EV play
          const plays = Array.isArray(parsedEvData) ? parsedEvData : parsedEvData.data || []
          const matchingPlay = plays.find((play: any) => 
            play.event_id === params.event_id &&
            play.market === params.market &&
            play.player_id === params.player_id &&
            play.line === params.line &&
            play.side === params.side
          )
          
          if (matchingPlay && matchingPlay.pointer) {
            pointer = matchingPlay.pointer
            break
          }
        }
      }
      
      if (pointer) {
        oddsKey = pointer
        console.log(`[EV Expansion] Using pointer for player prop: ${pointer}`)
      } else {
        console.log(`[EV Expansion] No pointer found, using market_key: ${params.market_key}`)
      }
    }
    
    // Try to fetch real odds data
    const oddsData = await redis.get(oddsKey)
    
    if (!oddsData) {
      // Create mock expansion data for demo
      console.log(`[EV Expansion] Creating mock data for ${params.market_key}`)
      const mockExpansionData = createMockExpansionData(params)
      
      const response = NextResponse.json({
        success: true,
        data: mockExpansionData,
        cached: false,
        note: 'Mock data for demo - will use real odds data when available'
      })
      
      response.headers.set('X-Fetch-Time', `${Date.now() - startTime}ms`)
      response.headers.set('X-Mock-Data', 'true')
      
      return response
    }
    
    // Handle real odds data
    let parsedOddsData
    try {
      if (typeof oddsData === 'string') {
        parsedOddsData = JSON.parse(oddsData)
      } else {
        parsedOddsData = oddsData
      }
    } catch (error) {
      console.error('[EV Expansion] Failed to parse odds data:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to parse market data'
      }, { status: 500 })
    }
    
    // Extract the specific data for this expansion using the actual data structure
    const expansionData = extractExpansionDataFromActualStructure(
      parsedOddsData,
      params
    )
    
    // Cache the expansion data
    await redis.setex(cacheKey, 300, JSON.stringify(expansionData)) // 5 minute cache
    
    const fetchTime = Date.now() - startTime
    
    const response = NextResponse.json({
      success: true,
      data: expansionData,
      cached: false
    })
    
    response.headers.set('X-Fetch-Time', `${fetchTime}ms`)
    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=300')
    
    return response
    
  } catch (error) {
    console.error('[EV Expansion API] Error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

// Helper function to extract player prop expansion data
function extractPlayerExpansionData(
  oddsData: any,
  eventId: string,
  playerId: string,
  side: 'over' | 'under',
  line: number
): EVExpansionData {
  const eventData = oddsData.events?.[eventId]
  if (!eventData) {
    throw new Error(`Event ${eventId} not found in odds data`)
  }
  
  const playerData = eventData.players?.[playerId]
  if (!playerData) {
    throw new Error(`Player ${playerId} not found in event ${eventId}`)
  }
  
  // Find the specific line in player's lines
  const lineKey = line.toString()
  const lineData = playerData.lines?.[lineKey]
  if (!lineData) {
    throw new Error(`Line ${line} not found for player ${playerId}`)
  }
  
  // Extract all books for this line
  const allBooks: any[] = []
  let bestOdds = side === 'over' ? -Infinity : -Infinity
  let worstOdds = side === 'over' ? Infinity : Infinity
  let totalOdds = 0
  let bookCount = 0
  
  Object.entries(lineData).forEach(([bookId, bookData]: [string, any]) => {
    const sideData = bookData[side]
    if (sideData && typeof sideData.price === 'number') {
      allBooks.push({
        book: bookId,
        odds: sideData.price,
        line: sideData.line || line,
        side: side,
        link: sideData.links?.desktop || sideData.links?.mobile,
        last_updated: Date.now() // Would be actual timestamp in real data
      })
      
      bestOdds = Math.max(bestOdds, sideData.price)
      worstOdds = Math.min(worstOdds, sideData.price)
      totalOdds += sideData.price
      bookCount++
    }
  })
  
  // Sort books by odds (best first)
  allBooks.sort((a, b) => b.odds - a.odds)
  
  return {
    play: {
      id: `${eventId}:${playerId}:${line}:${side}`,
      sport: 'nfl', // Would be dynamic
      scope: 'pregame', // Would be dynamic
      event_id: eventId,
      market: 'unknown', // Would need to be passed or derived
      side: side,
      line: line,
      ev_percentage: 0, // Would be calculated
      best_book: allBooks[0]?.book || '',
      best_odds: bestOdds,
      fair_odds: 0, // Would be calculated
      timestamp: Date.now(),
      market_key: '', // Would be actual market key
      home: eventData.event?.home || '',
      away: eventData.event?.away || '',
      start: eventData.event?.start || '',
      player_id: playerId,
      player_name: playerData.name || '',
      team: playerData.team || '',
      position: playerData.position || ''
    } as EVPlay,
    all_books: allBooks,
    market_stats: {
      total_books: bookCount,
      best_odds: bestOdds,
      worst_odds: worstOdds,
      odds_spread: bestOdds - worstOdds,
      avg_odds: bookCount > 0 ? Math.round(totalOdds / bookCount) : 0
    }
  }
}

// Helper function to extract game prop expansion data
function extractGameExpansionData(
  oddsData: any,
  eventId: string,
  side: 'over' | 'under',
  line: number
): EVExpansionData {
  const eventData = oddsData.events?.[eventId]
  if (!eventData) {
    throw new Error(`Event ${eventId} not found in odds data`)
  }
  
  // For game props, books are directly on the event
  const books = eventData.books || {}
  
  const allBooks: any[] = []
  let bestOdds = -Infinity
  let worstOdds = Infinity
  let totalOdds = 0
  let bookCount = 0
  
  Object.entries(books).forEach(([bookId, bookData]: [string, any]) => {
    const sideData = bookData[side]
    if (sideData && typeof sideData.price === 'number') {
      allBooks.push({
        book: bookId,
        odds: sideData.price,
        line: sideData.line || line,
        side: side,
        link: sideData.links?.desktop || sideData.links?.mobile,
        last_updated: Date.now()
      })
      
      bestOdds = Math.max(bestOdds, sideData.price)
      worstOdds = Math.min(worstOdds, sideData.price)
      totalOdds += sideData.price
      bookCount++
    }
  })
  
  // Sort books by odds (best first)
  allBooks.sort((a, b) => b.odds - a.odds)
  
  return {
    play: {
      id: `${eventId}:game:${line}:${side}`,
      sport: 'nfl',
      scope: 'pregame',
      event_id: eventId,
      market: 'total', // Would be dynamic
      side: side,
      line: line,
      ev_percentage: 0,
      best_book: allBooks[0]?.book || '',
      best_odds: bestOdds,
      fair_odds: 0,
      timestamp: Date.now(),
      market_key: '',
      home: eventData.event?.home || '',
      away: eventData.event?.away || '',
      start: eventData.event?.start || ''
    } as EVPlay,
    all_books: allBooks,
    market_stats: {
      total_books: bookCount,
      best_odds: bestOdds,
      worst_odds: worstOdds,
      odds_spread: bestOdds - worstOdds,
      avg_odds: bookCount > 0 ? Math.round(totalOdds / bookCount) : 0
    }
  }
}

// Extract expansion data from actual Redis structure
function extractExpansionDataFromActualStructure(oddsData: any, params: any): EVExpansionData {
  console.log(`[EV Expansion] Processing actual data for line ${params.line}, side ${params.side}`)
  console.log(`[EV Expansion] Data structure:`, Object.keys(oddsData))
  console.log(`[EV Expansion] Has player_id:`, !!params.player_id)
  console.log(`[EV Expansion] Has lines property:`, !!oddsData.lines)
  console.log(`[EV Expansion] Has event property:`, !!oddsData.event)
  
  // Check if this looks like player prop structure by looking for numeric keys at the top level
  const topLevelKeys = Object.keys(oddsData)
  const hasNumericKeys = topLevelKeys.some(key => !isNaN(parseFloat(key)))
  console.log(`[EV Expansion] Top level keys:`, topLevelKeys)
  console.log(`[EV Expansion] Has numeric keys (player prop indicator):`, hasNumericKeys)
  
  // Handle player prop structure (from pointer): { "21.5": { "betmgm": { "over": {...}, "under": {...} } } }
  if (params.player_id && hasNumericKeys && !oddsData.lines && !oddsData.event) {
    const lineKey = params.line.toString()
    const lineData = oddsData[lineKey]
    
    if (!lineData) {
      throw new Error(`Line ${params.line} not found in odds data. Available lines: ${Object.keys(oddsData).join(', ')}`)
    }
    
    const allBooks: any[] = []
    let bestOdds = -Infinity
    let worstOdds = Infinity
    let totalOdds = 0
    let bookCount = 0
    
    // Extract odds for the specific side from all books
    Object.entries(lineData).forEach(([bookId, bookData]: [string, any]) => {
      const sideData = bookData[params.side]
      if (sideData && typeof sideData.price === 'number') {
        allBooks.push({
          book: bookId,
          odds: sideData.price,
          line: params.line,
          side: params.side,
          link: sideData.link,
          last_updated: sideData.last_update || Date.now()
        })
        
        bestOdds = Math.max(bestOdds, sideData.price)
        worstOdds = Math.min(worstOdds, sideData.price)
        totalOdds += sideData.price
        bookCount++
      }
    })
    
    if (bookCount === 0) {
      throw new Error(`No odds found for ${params.side} on line ${params.line}`)
    }
    
    // Sort books by odds (best first for positive odds, worst first for negative odds)
    allBooks.sort((a, b) => b.odds - a.odds)
    
    // Create the play object
    const play: EVPlay = {
      id: `${params.event_id}:${params.market}:${params.line}:${params.side}`,
      sport: params.sport,
      scope: 'pregame',
      event_id: params.event_id,
      market: params.market,
      side: params.side,
      line: params.line,
      ev_percentage: 8.5, // Would be calculated from fair odds
      best_book: allBooks[0].book,
      best_odds: bestOdds,
      fair_odds: Math.round(bestOdds * 0.9), // Mock fair odds calculation
      timestamp: Date.now(),
      market_key: params.market_key,
      home: 'HOME', // Would need to be extracted from EV data
      away: 'AWAY', // Would need to be extracted from EV data
      start: new Date().toISOString(), // Would need to be extracted from EV data
      player_id: params.player_id,
      player_name: 'Player Name', // Would need to be extracted from EV data
      team: 'TEAM',
      position: 'POS'
    } as EVPlay
    
    return {
      play,
      all_books: allBooks,
      market_stats: {
        total_books: bookCount,
        best_odds: bestOdds,
        worst_odds: worstOdds,
        odds_spread: Math.abs(bestOdds - worstOdds),
        avg_odds: Math.round(totalOdds / bookCount)
      }
    }
  }
  
  // If we reach here, try to handle as either game prop structure or direct line structure
  console.log(`[EV Expansion] Attempting to handle as game prop or fallback structure`)
  
  // First, try game prop structure: { event: {...}, lines: { "40": { line: 40, books: { "bookId": { over: {...}, under: {...} } } } }
  if (oddsData.lines) {
    const lineKey = params.line.toString()
    const lineData = oddsData.lines[lineKey]
    
    if (!lineData) {
      throw new Error(`Line ${params.line} not found in game prop lines. Available lines: ${Object.keys(oddsData.lines).join(', ')}`)
    }
    
    return handleGamePropStructure(oddsData, lineData, params)
  }
  
  // Fallback: try direct line structure (player props that weren't caught above)
  const lineKey = params.line.toString()
  if (oddsData[lineKey]) {
    console.log(`[EV Expansion] Using fallback direct line structure for line ${lineKey}`)
    return handleDirectLineStructure(oddsData, lineKey, params)
  }
  
  // If nothing works, throw a comprehensive error
  throw new Error(`Unable to parse odds data structure. Line ${params.line} not found. Available top-level keys: ${Object.keys(oddsData).join(', ')}. Has lines property: ${!!oddsData.lines}. Has event property: ${!!oddsData.event}`)
}

// Helper function to handle game prop structure
function handleGamePropStructure(oddsData: any, lineData: any, params: any): EVExpansionData {
  const books = lineData.books || {}
  const allBooks: any[] = []
  let bestOdds = -Infinity
  let worstOdds = Infinity
  let totalOdds = 0
  let bookCount = 0
  
  // Extract odds for the specific side from all books
  Object.entries(books).forEach(([bookId, bookData]: [string, any]) => {
    const sideData = bookData[params.side]
    if (sideData && typeof sideData.price === 'number') {
      allBooks.push({
        book: bookId,
        odds: sideData.price,
        line: lineData.line || params.line,
        side: params.side,
        link: sideData.links?.desktop || sideData.links?.mobile,
        last_updated: Date.now()
      })
      
      bestOdds = Math.max(bestOdds, sideData.price)
      worstOdds = Math.min(worstOdds, sideData.price)
      totalOdds += sideData.price
      bookCount++
    }
  })
  
  if (bookCount === 0) {
    throw new Error(`No odds found for ${params.side} on line ${params.line}`)
  }
  
  allBooks.sort((a, b) => b.odds - a.odds)
  
  const play: EVPlay = {
    id: `${params.event_id}:${params.market}:${params.line}:${params.side}`,
    sport: params.sport,
    scope: 'pregame',
    event_id: params.event_id,
    market: params.market,
    side: params.side,
    line: params.line,
    ev_percentage: 8.5,
    best_book: allBooks[0].book,
    best_odds: bestOdds,
    fair_odds: Math.round(bestOdds * 0.9),
    timestamp: oddsData.updated_at * 1000 || Date.now(),
    market_key: params.market_key,
    home: oddsData.event?.home || 'HOME',
    away: oddsData.event?.away || 'AWAY',
    start: oddsData.event?.start || new Date().toISOString()
  }
  
  if (params.player_id) {
    (play as any).player_id = params.player_id
    ;(play as any).player_name = 'Player Name'
    ;(play as any).team = 'TEAM'
    ;(play as any).position = 'POS'
  }
  
  return {
    play,
    all_books: allBooks,
    market_stats: {
      total_books: bookCount,
      best_odds: bestOdds,
      worst_odds: worstOdds,
      odds_spread: Math.abs(bestOdds - worstOdds),
      avg_odds: Math.round(totalOdds / bookCount)
    }
  }
}

// Helper function to handle direct line structure (player props)
function handleDirectLineStructure(oddsData: any, lineKey: string, params: any): EVExpansionData {
  const lineData = oddsData[lineKey]
  const allBooks: any[] = []
  let bestOdds = -Infinity
  let worstOdds = Infinity
  let totalOdds = 0
  let bookCount = 0
  
  // Extract odds for the specific side from all books
  Object.entries(lineData).forEach(([bookId, bookData]: [string, any]) => {
    const sideData = bookData[params.side]
    if (sideData && typeof sideData.price === 'number') {
      allBooks.push({
        book: bookId,
        odds: sideData.price,
        line: params.line,
        side: params.side,
        link: sideData.link,
        last_updated: sideData.last_update || Date.now()
      })
      
      bestOdds = Math.max(bestOdds, sideData.price)
      worstOdds = Math.min(worstOdds, sideData.price)
      totalOdds += sideData.price
      bookCount++
    }
  })
  
  if (bookCount === 0) {
    throw new Error(`No odds found for ${params.side} on line ${params.line}`)
  }
  
  allBooks.sort((a, b) => b.odds - a.odds)
  
  const play: EVPlay = {
    id: `${params.event_id}:${params.market}:${params.line}:${params.side}`,
    sport: params.sport,
    scope: 'pregame',
    event_id: params.event_id,
    market: params.market,
    side: params.side,
    line: params.line,
    ev_percentage: 8.5,
    best_book: allBooks[0].book,
    best_odds: bestOdds,
    fair_odds: Math.round(bestOdds * 0.9),
    timestamp: Date.now(),
    market_key: params.market_key,
    home: 'HOME',
    away: 'AWAY',
    start: new Date().toISOString(),
    player_id: params.player_id,
    player_name: 'Player Name',
    team: 'TEAM',
    position: 'POS'
  } as EVPlay
  
  return {
    play,
    all_books: allBooks,
    market_stats: {
      total_books: bookCount,
      best_odds: bestOdds,
      worst_odds: worstOdds,
      odds_spread: Math.abs(bestOdds - worstOdds),
      avg_odds: Math.round(totalOdds / bookCount)
    }
  }
}

// Create mock expansion data for demo purposes
function createMockExpansionData(params: any): EVExpansionData {
  // Generate realistic sportsbook odds around the best odds
  const baseOdds = 110 // Default base odds
  const sportsbooks = [
    'draftkings', 'fanduel', 'betmgm', 'caesars', 'betrivers', 
    'espn', 'fanatics', 'hard-rock', 'betparx', 'bwin'
  ]
  
  const allBooks: any[] = []
  let bestOdds = -Infinity
  let worstOdds = Infinity
  let totalOdds = 0
  
  // Generate odds for each sportsbook with some variation
  sportsbooks.forEach((book, index) => {
    // Create realistic odds spread around base odds
    const variation = (Math.random() - 0.5) * 40 // ±20 odds variation
    const odds = Math.round(baseOdds + variation)
    
    allBooks.push({
      book: book,
      odds: odds,
      line: params.line,
      side: params.side,
      link: `https://${book}.com/bet/${params.event_id}`,
      last_updated: Date.now() - (index * 60000) // Stagger update times
    })
    
    bestOdds = Math.max(bestOdds, odds)
    worstOdds = Math.min(worstOdds, odds)
    totalOdds += odds
  })
  
  // Sort by odds (best first)
  allBooks.sort((a, b) => b.odds - a.odds)
  
  // Create the play object
  const play: EVPlay = {
    id: `${params.event_id}:${params.market}:${params.line}:${params.side}`,
    sport: params.sport,
    scope: 'pregame',
    event_id: params.event_id,
    market: params.market,
    side: params.side,
    line: params.line,
    ev_percentage: 8.5, // Mock EV
    best_book: allBooks[0].book,
    best_odds: bestOdds,
    fair_odds: Math.round(bestOdds * 0.9), // Mock fair odds
    timestamp: Date.now(),
    market_key: params.market_key,
    home: 'HOME',
    away: 'AWAY',
    start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
  }
  
  // Add player info if it's a player prop
  if (params.player_id) {
    (play as any).player_id = params.player_id
    ;(play as any).player_name = 'Mock Player'
    ;(play as any).team = 'TEAM'
    ;(play as any).position = 'POS'
  }
  
  return {
    play,
    all_books: allBooks,
    market_stats: {
      total_books: allBooks.length,
      best_odds: bestOdds,
      worst_odds: worstOdds,
      odds_spread: bestOdds - worstOdds,
      avg_odds: Math.round(totalOdds / allBooks.length)
    }
  }
}
