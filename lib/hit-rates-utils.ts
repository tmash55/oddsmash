// Shared utility for fetching hit rate data
export interface BetslipSelection {
  id?: string
  player_name?: string
  market_key?: string     // API key (e.g., "batter_home_runs")
  market?: string         // Market value (e.g., "Home_Runs") 
  market_display?: string // Display name (e.g., "Home Runs")
}

export async function fetchHitRatesForSelections(selections: BetslipSelection[]): Promise<Record<string, any>> {
  try {
    const hitRatesData: Record<string, any> = {}
    
    // Define game-level markets that don't need hit rate lookups
    const gameLevelMarkets = ['Moneyline', 'Spread', 'Total']
    
    // Filter out game-level markets to skip hit rate lookups
    const playerPropSelections = selections.filter(selection => 
      selection.player_name && !gameLevelMarkets.includes(selection.market || '')
    )
    
    console.log(`📊 Filtering selections: ${selections.length} total, ${playerPropSelections.length} player props`)
    
    for (const selection of playerPropSelections) {
      try {
        if (!selection.player_name) continue

        // Create market variations to try (prioritize the market value)
        const marketVariations = [
          selection.market,        // Market value (e.g., "Home_Runs") - prioritize this
          selection.market_display, // Display name (e.g., "Home Runs")
          selection.market_key,    // API key (e.g., "batter_home_runs") - fallback
        ].filter(Boolean)

        // Remove duplicates
        const uniqueMarkets = Array.from(new Set(marketVariations))
        
        console.log(`🔍 Hit rate lookup for "${selection.player_name}":`)
        console.log(`   Market variations: ${uniqueMarkets.join(', ')}`)
        
        let hitRateData = null
        
        // Try each market variation until we find a match
        for (const marketVariation of uniqueMarkets) {
          console.log(`   Trying market: "${marketVariation}"...`)
          const baseUrl = typeof window !== 'undefined' 
            ? window.location.origin 
            : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
            
          const response = await fetch(
            `${baseUrl}/api/player-hit-rate?playerName=${encodeURIComponent(selection.player_name)}&market=${encodeURIComponent(marketVariation)}`
          )
          
          if (response.ok) {
            const responseData = await response.json()
            if (responseData.profile) {
              hitRateData = responseData.profile
              console.log(`✅ Hit rate found for "${selection.player_name}" with market "${marketVariation}"`)
              break
            }
          }
        }
        
        if (hitRateData) {
          hitRatesData[selection.player_name] = hitRateData
        } else {
          console.log(`⚠️ No hit rate data found for ${selection.player_name} with any market variation`)
        }
        
      } catch (error) {
        console.error(`❌ Error fetching hit rate for ${selection.player_name}:`, error)
        continue
      }
    }
    
    console.log(`📊 Hit rate data fetched for ${Object.keys(hitRatesData).length}/${playerPropSelections.length} player props`)
    return hitRatesData
  } catch (error) {
    console.error('❌ Error in fetchHitRatesForSelections:', error)
    return {}
  }
} 