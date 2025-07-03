import { NextResponse } from 'next/server'
import { createClient } from '@/libs/supabase/server'
import { SPORT_MARKETS } from '@/lib/constants/markets'

// Helper function to convert API key back to database market value
const getMarketValueFromApiKey = (apiKey: string): string => {
  // Search through all sports for the matching API key
  for (const sport in SPORT_MARKETS) {
    const markets = SPORT_MARKETS[sport]
    for (const market of markets) {
      // Check both main API key and alternate key
      if (market.apiKey === apiKey || market.alternateKey === apiKey) {
        return market.value
      }
    }
  }
  // If no match found, return the original key
  return apiKey
}

interface DatabaseOddsRecord {
  vendor_event_id: string
  player_id: number
  player_name: string
  mlb_game_id: number
  market: string
  line: number
  team: string
  is_home: boolean
  sportsbook: string
  over_price: number | null
  under_price: number | null
  over_link: string | null
  under_link: string | null
  over_sid: string | null
  under_sid: string | null
  is_alternative: boolean
  created_at: string
  updated_at: string
}

interface OddsResponse {
  lines: Array<{
    line: number;
    sportsbooks: Record<string, {
      over?: {
        price: number;
        link?: string;
        sid?: string;
        last_update?: string;
      };
      under?: {
        price: number;
        link?: string;
        sid?: string;
        last_update?: string;
      };
    }>;
  }>;
  description?: string;
  market?: string;
  last_updated?: string;
}

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    
    const { searchParams } = new URL(request.url)
    
    // Parse the Redis-style key format: odds:mlb:{event_id}:{player_id}:{market}
    const key = searchParams.get('key')
    const playerId = searchParams.get('playerId')
    const market = searchParams.get('market')
    const eventId = searchParams.get('eventId')
    
    let targetPlayerId: number | null = null
    let targetMarket: string | null = null
    let targetEventId: string | null = null
    
    // Handle Redis-style key format
    if (key) {
      const keyParts = key.split(':')
      // Format: odds:mlb:{event_id}:{player_id}:{market}
      if (keyParts.length >= 5 && keyParts[0] === 'odds' && keyParts[1] === 'mlb') {
        targetEventId = keyParts[2]
        targetPlayerId = parseInt(keyParts[3])
        targetMarket = keyParts[4]
      }
    }
    
    // Handle direct parameters (fallback or explicit)
    if (!targetPlayerId && playerId) {
      targetPlayerId = parseInt(playerId)
    }
    if (!targetMarket && market) {
      targetMarket = market
    }
    if (!targetEventId && eventId) {
      targetEventId = eventId
    }
    
    if (!targetPlayerId || !targetMarket) {
      return NextResponse.json({ 
        error: 'Missing required parameters: playerId and market' 
      }, { status: 400 })
    }
    
    // Convert API market key to database market value
    const databaseMarket = getMarketValueFromApiKey(targetMarket)
    
    // Build query conditions
    let query = supabase
      .from('player_odds_history')
      .select('*')
      .eq('player_id', targetPlayerId)
      .eq('market', databaseMarket)
      .order('updated_at', { ascending: false })
    
    // If we have event_id, filter by it, otherwise get latest odds
    if (targetEventId) {
      query = query.eq('vendor_event_id', targetEventId)
    }
    
    const { data: records, error } = await query
    
    if (error) {
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
    }
    
    if (!records || records.length === 0) {
      return NextResponse.json({ error: 'No odds found' }, { status: 404 })
    }
    
    // Group records by line to match Redis format
    const lineGroups: Record<number, Record<string, any>> = {}
    let playerName = ''
    let lastUpdated = ''
    
    records.forEach((record: DatabaseOddsRecord) => {
      const line = record.line
      playerName = record.player_name
      lastUpdated = record.updated_at
      
      if (!lineGroups[line]) {
        lineGroups[line] = {}
      }
      
      // Add this sportsbook's odds for this line
      lineGroups[line][record.sportsbook] = {}
      
      // Add over odds if available
      if (record.over_price !== null) {
        lineGroups[line][record.sportsbook].over = {
          price: record.over_price,
          link: record.over_link || undefined,
          sid: record.over_sid || undefined,
          last_update: record.updated_at
        }
      }
      
      // Add under odds if available
      if (record.under_price !== null) {
        lineGroups[line][record.sportsbook].under = {
          price: record.under_price,
          link: record.under_link || undefined,
          sid: record.under_sid || undefined,
          last_update: record.updated_at
        }
      }
    })
    
    // Convert to API response format
    const response: OddsResponse = {
      description: playerName,
      market: targetMarket,
      lines: Object.entries(lineGroups).map(([line, sportsbooks]) => ({
        line: parseFloat(line),
        sportsbooks
      })),
      last_updated: lastUpdated
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 