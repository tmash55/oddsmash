import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { EVPlay } from '@/types/ev-types'

export async function POST() {
  const sampleEVData: EVPlay[] = [
    {
      "id": "64105a3e-2b4e-57c0-a377-7058ecadd2d4:total:40:under",
      "sport": "nfl",
      "scope": "pregame",
      "event_id": "64105a3e-2b4e-57c0-a377-7058ecadd2d4",
      "market": "total",
      "side": "under",
      "line": 40,
      "ev_percentage": 12.3,
      "best_book": "draftkings",
      "best_odds": 280,
      "fair_odds": 245,
      "timestamp": Date.now(),
      "market_key": "odds:nfl:props:total:game:alts:event:64105a3e-2b4e-57c0-a377-7058ecadd2d4:pregame",
      "home": "BUF",
      "away": "NE",
      "start": "2025-10-06T00:20:00.000Z"
    } as EVPlay,
    {
      "id": "e96239a0-293e-52d1-b66e-612b1c843bcc:rush_attempts:00-0036158:15.5:over",
      "sport": "nfl",
      "scope": "pregame",
      "event_id": "e96239a0-293e-52d1-b66e-612b1c843bcc",
      "market": "rush_attempts",
      "side": "over",
      "player_id": "00-0036158",
      "player_name": "J.K. Dobbins",
      "team": "DEN",
      "position": "RB",
      "line": 15.5,
      "ev_percentage": 12.5,
      "best_book": "fanatics",
      "best_odds": 130,
      "fair_odds": 110,
      "timestamp": Date.now(),
      "market_key": "odds:nfl:props:rush_attempts:alts:event:e96239a0-293e-52d1-b66e-612b1c843bcc:pregame",
      "home": "DEN",
      "away": "CIN",
      "start": "2025-09-30T00:15:00.000Z"
    } as EVPlay,
    {
      "id": "f12345a0-293e-52d1-b66e-612b1c843bcc:passing_yards:00-0023459:249.5:over",
      "sport": "nfl",
      "scope": "pregame",
      "event_id": "f12345a0-293e-52d1-b66e-612b1c843bcc",
      "market": "passing_yards",
      "side": "over",
      "player_id": "00-0023459",
      "player_name": "Aaron Rodgers",
      "team": "NYJ",
      "position": "QB",
      "line": 249.5,
      "ev_percentage": 7.3,
      "best_book": "draftkings",
      "best_odds": 115,
      "fair_odds": 105,
      "timestamp": Date.now(),
      "market_key": "odds:nfl:props:passing_yards:alts:event:f12345a0-293e-52d1-b66e-612b1c843bcc:pregame",
      "home": "NYJ",
      "away": "MIA",
      "start": "2025-09-29T20:00:00.000Z"
    } as EVPlay,
    {
      "id": "g67890a0-293e-52d1-b66e-612b1c843bcc:spread:-3.5:under",
      "sport": "nfl",
      "scope": "pregame",
      "event_id": "g67890a0-293e-52d1-b66e-612b1c843bcc",
      "market": "spread",
      "side": "under",
      "line": -3.5,
      "ev_percentage": 5.8,
      "best_book": "betmgm",
      "best_odds": 108,
      "fair_odds": 100,
      "timestamp": Date.now(),
      "market_key": "odds:nfl:props:spread:game:alts:event:g67890a0-293e-52d1-b66e-612b1c843bcc:pregame",
      "home": "KC",
      "away": "BUF",
      "start": "2025-09-30T17:00:00.000Z"
    } as EVPlay,
    {
      "id": "e96239a0-293e-52d1-b66e-612b1c843bcc:1h_total:14.5:under",
      "sport": "nfl",
      "scope": "pregame",
      "event_id": "e96239a0-293e-52d1-b66e-612b1c843bcc",
      "market": "1h_total",
      "side": "under",
      "line": 14.5,
      "ev_percentage": 8.3,
      "best_book": "draftkings",
      "best_odds": 112,
      "fair_odds": 105,
      "timestamp": Date.now(),
      "market_key": "odds:nfl:props:1h_total:game:alts:event:e96239a0-293e-52d1-b66e-612b1c843bcc:pregame",
      "home": "DEN",
      "away": "CIN",
      "start": "2025-09-30T00:15:00.000Z"
    } as EVPlay,
    {
      "id": "h11111a0-293e-52d1-b66e-612b1c843bcc:receiving_yards:00-0034857:87.5:over",
      "sport": "nfl",
      "scope": "pregame",
      "event_id": "h11111a0-293e-52d1-b66e-612b1c843bcc",
      "market": "receiving_yards",
      "side": "over", 
      "player_id": "00-0034857",
      "player_name": "Travis Kelce",
      "team": "KC",
      "position": "TE",
      "line": 87.5,
      "ev_percentage": 15.2,
      "best_book": "caesars",
      "best_odds": 125,
      "fair_odds": 105,
      "timestamp": Date.now(),
      "market_key": "odds:nfl:props:receiving_yards:alts:event:h11111a0-293e-52d1-b66e-612b1c843bcc:pregame",
      "home": "KC",
      "away": "BUF",
      "start": "2025-09-30T17:00:00.000Z"
    } as EVPlay
  ]

  try {
    // Store sample data for 10 minutes
    await redis.setex('ev:nfl:pregame', 600, JSON.stringify(sampleEVData))
    
    return NextResponse.json({
      success: true,
      message: 'Sample EV data created',
      data: {
        key: 'ev:nfl:pregame',
        records: sampleEVData.length,
        ttl: 600
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create sample data'
    }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    await redis.del('ev:nfl:pregame')
    
    return NextResponse.json({
      success: true,
      message: 'Sample EV data deleted'
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete sample data'
    }, { status: 500 })
  }
}
