import { NextRequest, NextResponse } from "next/server"
import { redis } from "@/lib/redis"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport") || "mlb"
    const market = searchParams.get("market") || "hits"
    const playerIds = searchParams.get("playerIds")?.split(",") || []

    if (playerIds.length === 0) {
      return NextResponse.json({ error: "No player IDs provided" }, { status: 400 })
    }

    console.log(`[HIT RATES ODDS] Fetching hit rate data for ${playerIds.length} players, sport: ${sport}, market: ${market}`)

    // Fetch hit rate data from Redis for each player
    const hitRateData: Record<string, any> = {}
    
    for (const playerId of playerIds) {
      try {
        // Try different market variations to handle case sensitivity and variations
        const marketVariations = [
          market.charAt(0).toUpperCase() + market.slice(1).toLowerCase(), // "Hits"
          market.toLowerCase(), // "hits"
          market, // original case
          "batter_hits", // Common variation
        ]

        let playerHitRateData = null
        
        for (const marketVar of marketVariations) {
          const hitRateKey = `hit_rate:${sport}:${playerId}:${marketVar}`
          console.log(`[HIT RATES ODDS] Trying key: ${hitRateKey}`)
          
          const cachedHitRate = await redis.get(hitRateKey)
          if (cachedHitRate) {
            console.log(`[HIT RATES ODDS] Found hit rate data for player ${playerId} with key: ${hitRateKey}`)
            playerHitRateData = cachedHitRate
            break
          }
        }

        if (playerHitRateData) {
          // Extract odds from fallback_odds field
          const hitRateObj = playerHitRateData as any
          const fallbackOdds = hitRateObj.fallback_odds || {}
          const transformedOdds: Record<string, any> = {}

          // Transform fallback_odds structure to be easier to work with
          Object.entries(fallbackOdds).forEach(([line, sportsbooks]: [string, any]) => {
            if (typeof sportsbooks === 'object') {
              Object.entries(sportsbooks).forEach(([sportsbook, oddsInfo]: [string, any]) => {
                if (oddsInfo && typeof oddsInfo.odds === 'number') {
                  transformedOdds[sportsbook] = {
                    odds: oddsInfo.odds,
                    line: parseFloat(line),
                    over_link: oddsInfo.over_link,
                    sid: oddsInfo.sid
                  }
                }
              })
            }
          })

          hitRateData[playerId] = {
            ...hitRateObj,
            transformedOdds
          }
        } else {
          console.log(`[HIT RATES ODDS] No hit rate data found for player ${playerId}`)
        }
      } catch (error) {
        console.error(`[HIT RATES ODDS] Error fetching hit rate data for player ${playerId}:`, error)
      }
    }

    console.log(`[HIT RATES ODDS] Found hit rate data for ${Object.keys(hitRateData).length} out of ${playerIds.length} players`)

    return NextResponse.json({
      success: true,
      data: hitRateData,
      sport,
      market,
      totalPlayers: playerIds.length,
      foundPlayers: Object.keys(hitRateData).length
    })

  } catch (error) {
    console.error("[HIT RATES ODDS] Error fetching hit rate data:", error)
    return NextResponse.json(
      { error: "Failed to fetch hit rate data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
} 