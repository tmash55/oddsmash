import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/libs/supabase/server'
import { sportsbooks } from '@/data/sportsbooks'
import { getMarketsForSport } from '@/lib/constants/markets'
import { createBetslipSelection } from '@/lib/betslip-utils'

// Types for Odds API response
interface Outcome {
  name: string
  price: number
  point?: number
  description?: string
  sid?: string
  link?: string
}

interface Market {
  key: string
  outcomes?: Outcome[]
}

interface Bookmaker {
  key: string
  title: string
  last_update: string
  markets?: Market[]
  sid?: string
  link?: string
}

interface OddsResponse {
  id: string
  sport_key: string
  sport_title: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers?: Bookmaker[]
}

interface OddsMetadata {
  matches_found: number
  total_bookmakers: number
  best_odds: number | null
  best_book: string | null
  player_searched: string
  line_searched: number
  bet_type_searched: string
  market_searched: string
  last_updated: string
  error?: string
}

interface UnifiedOddsResponse {
  metadata: OddsMetadata
  bookmakers: Record<string, {
    price: number
    point: number
    link?: string
    sid?: string
    last_update: string
  }>
  hit_rate_data?: {
    last_5_hit_rate: number
    last_10_hit_rate: number
    last_20_hit_rate: number
    season_hit_rate: number
    avg_stat_per_game: number
  }
}

interface BetslipSelection {
  id: string
  event_id: string
  sport_key: string
  market_key: string
  market?: string
  market_display?: string
  selection: string
  player_name?: string
  player_team?: string
  line?: number
  commence_time: string
  home_team: string
  away_team: string
  odds_data: Record<string, any>
  bet_type: string
  market_type?: string
}

// Helper functions for fuzzy player name matching (using proven logic from lookup-odds route)
function normalizePlayerName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')
    .trim()
}

function removeSuffixesFromName(name: string): string {
  const suffixes = ['jr', 'jr.', 'sr', 'sr.', 'ii', 'iii', 'iv', 'v']
  const words = name.split(' ')
  
  // Remove suffix if it's the last word and matches our list (allow 2+ words for better matching)
  if (words.length >= 2 && suffixes.includes(words[words.length - 1])) {
    return words.slice(0, -1).join(' ')
  }
  
  return name
}

function calculateNameSimilarity(target: string, candidate: string): number {
  const targetNorm = normalizePlayerName(target)
  const candidateNorm = normalizePlayerName(candidate)
  
  // Exact match gets highest score
  if (targetNorm === candidateNorm) {
    return 1.0
  }
  
  // Try matching with suffixes removed from both sides
  const targetNoSuffix = removeSuffixesFromName(targetNorm)
  const candidateNoSuffix = removeSuffixesFromName(candidateNorm)
  
  // Check if they match after removing suffixes from both
  if (targetNoSuffix === candidateNoSuffix) {
    return 0.95 // Very high confidence for match with suffix difference
  }
  
  // Check if target (without suffix) matches candidate (with suffix)
  // e.g., "Lourdes Gurriel" vs "Lourdes Gurriel Jr."
  if (targetNoSuffix === candidateNorm || targetNorm === candidateNoSuffix) {
    return 0.95 // Very high confidence for one-way suffix match
  }
  
  // Check if all words in target are in candidate (and vice versa)
  const targetWords = targetNoSuffix.split(' ')
  const candidateWords = candidateNoSuffix.split(' ')
  
  // For player names, we want both first and last name to match reasonably well
  if (targetWords.length >= 2 && candidateWords.length >= 2) {
    // Both names should have matching first and last names
    const firstNameMatch = targetWords[0] === candidateWords[0] || 
                          targetWords[0].startsWith(candidateWords[0][0]) ||
                          candidateWords[0].startsWith(targetWords[0][0])
    
    const lastNameMatch = targetWords[targetWords.length - 1] === candidateWords[candidateWords.length - 1]
    
    if (firstNameMatch && lastNameMatch) {
      return 0.9 // High confidence for first+last match
    }
    
    if (lastNameMatch && targetWords[0][0] === candidateWords[0][0]) {
      return 0.8 // Good confidence for last name + first initial
    }
  }
  
  // Check if one name contains the other (less preferred)
  if (targetNorm.includes(candidateNorm) || candidateNorm.includes(targetNorm)) {
    return 0.6 // Lower confidence for partial matches
  }
  
  return 0.0 // No match
}

function extractPlayerNameVariations(playerName: string): string[] {
  const normalized = normalizePlayerName(playerName)
  const variations = [normalized]
  
  // Add version without suffix
  const withoutSuffix = removeSuffixesFromName(normalized)
  if (withoutSuffix !== normalized) {
    variations.push(withoutSuffix)
  }
  
  // Add common suffix variations if the name doesn't already have one
  const commonSuffixes = ['jr', 'sr', 'ii', 'iii']
  
  // Check if name has existing suffix (handle periods)
  const normalizedLower = normalized.toLowerCase()
  const hasExistingSuffix = commonSuffixes.some(suffix => 
    normalizedLower.endsWith(` ${suffix}`) || normalizedLower.endsWith(` ${suffix}.`)
  )
  
  if (!hasExistingSuffix) {
    // Add Jr. variation for names without suffixes
    variations.push(`${normalized} jr`)
    variations.push(`${normalized} jr.`)
    variations.push(`${normalized} sr`)
    variations.push(`${normalized} sr.`)
  }
  
  // Split by spaces to handle "First Last" cases
  const parts = normalized.split(' ')
  
  if (parts.length >= 2) {
    // Add "Last, First" format
    variations.push(`${parts[parts.length - 1]} ${parts[0]}`)
    
    // Add "F. Last" format (first initial)
    variations.push(`${parts[0][0]} ${parts[parts.length - 1]}`)
    
    // Add "First L." format (last initial)
    variations.push(`${parts[0]} ${parts[parts.length - 1][0]}`)
  }
  
  // Remove duplicates and return
  return Array.from(new Set(variations))
}

function findPlayerInOutcomes(playerName: string, outcomes: Outcome[]): Outcome[] {
  const normalizedPlayerName = normalizePlayerName(playerName)
  const playerVariations = extractPlayerNameVariations(playerName)
  const candidateMatches: { outcome: Outcome; score: number }[] = []
  
  console.log(`🔍 Searching for player "${playerName}" (normalized: "${normalizedPlayerName}")`)
  console.log(`📝 Name variations: ${playerVariations.join(', ')}`)
  console.log(`📋 Available outcomes: ${outcomes.map(o => o.description).join(', ')}`)
  
  for (const outcome of outcomes) {
    if (!outcome.description) continue
    
    // Calculate similarity scores for all variations
    let bestScore = 0
    let bestVariation = ''
    for (const variation of playerVariations) {
      const score = calculateNameSimilarity(variation, outcome.description)
      if (score > bestScore) {
        bestScore = score
        bestVariation = variation
      }
    }
    
    // Also try the original player name directly
    const directScore = calculateNameSimilarity(playerName, outcome.description)
    if (directScore > bestScore) {
      bestScore = directScore
      bestVariation = playerName + ' (original)'
    }
    
    // Log detailed matching for debugging
    if (bestScore > 0.5) { // Show matches above 50% for debugging
      console.log(`  🎯 "${outcome.description}" scored ${(bestScore * 100).toFixed(1)}% (best variation: "${bestVariation}")`)
    }
    
    // Only consider matches with a reasonable similarity score - using 0.7 like lookup-odds
    if (bestScore >= 0.7) {
      candidateMatches.push({ outcome, score: bestScore })
    }
  }
  
  // Sort by confidence score (highest first) and return outcomes
  candidateMatches.sort((a, b) => b.score - a.score)
  
  // Log the matching process for debugging
  if (candidateMatches.length > 0) {
    console.log(`🎯 Player "${playerName}" matches:`)
    candidateMatches.forEach((match, i) => {
      console.log(`  ${i + 1}. "${match.outcome.description}" (confidence: ${(match.score * 100).toFixed(1)}%)`)
    })
    
    // Return all high-confidence matches (for line searching)
    const bestScore = candidateMatches[0].score
    const topMatches = candidateMatches.filter(m => m.score >= bestScore - 0.1) // Within 10% of best
    
    console.log(`✅ Returning ${topMatches.length} high-confidence matches for line searching`)
    return topMatches.map(m => m.outcome)
  }
  
  console.log(`❌ No confident matches found for player "${playerName}"`)
  return []
}

// Enhanced function using lookup-odds logic for strict line matching
function findMatchingOutcomeWithMarket(
  playerName: string, 
  line: number, 
  betType: string, 
  outcomes: Outcome[],
  marketKeys: string[]
): Outcome | null {
  console.log(`\n🔧 === FINDMATCHINGOUTCOMEWITHMARKET DEBUG ===`)
  console.log(`🎯 Searching for: Player="${playerName}", Line=${line}, BetType="${betType}"`)
  console.log(`📊 Market keys: ${marketKeys.join(', ')}`)
  console.log(`📋 Total outcomes to search: ${outcomes.length}`)
  
  // Debug: Show ALL raw outcomes received
  console.log(`🔍 Raw outcomes received:`)
  outcomes.forEach((outcome: any, i: number) => {
    if (outcome.description) {
      console.log(`  RAW[${i + 1}]: ${outcome.description} ${outcome.name} ${outcome.point} @ ${outcome.price}`)
    } else {
      console.log(`  RAW[${i + 1}]: ${outcome.name} ${outcome.point} @ ${outcome.price}`)
    }
  })
  
  const playerOutcomes = findPlayerInOutcomes(playerName, outcomes)
  
  if (playerOutcomes.length === 0) {
    console.log(`❌ No player outcomes found for "${playerName}"`)
    return null
  }
  
  console.log(`🔍 Found ${playerOutcomes.length} player outcome(s) for "${playerName}"`)
  console.log(`🎯 Looking for: ${betType} ${line}`)
  console.log(`📋 Available outcomes: ${playerOutcomes.map(o => `${o.description} ${o.name} ${o.point}`).join(', ')}`)
  
  // Find outcome with matching line and bet type - STRICT MATCHING ONLY (like lookup-odds)
  const targetName = betType.toLowerCase() === 'over' ? 'Over' : 'Under'
  console.log(`🎯 Target name: "${targetName}"`)
  
  // Use strict line matching like lookup-odds route
  console.log(`🔍 Trying exact match: ${targetName} ${line}`)
  for (const outcome of playerOutcomes) {
    console.log(`  Checking: ${outcome.name} ${outcome.point} (${outcome.name === targetName && outcome.point === line ? 'MATCH' : 'NO MATCH'})`)
    if (outcome.name === targetName && outcome.point === line) {
      console.log(`✅ Exact match found: ${outcome.description} ${outcome.name} ${outcome.point} @ ${outcome.price}`)
      return outcome
    }
  }
  
  // STRICT MATCHING ONLY: If exact line not found, do NOT use fuzzy matching
  // This prevents comparing different lines (e.g., 2+ vs 2.5+ vs 3+ total bases)
  console.log(`❌ No exact match found for "${playerName}" ${betType} ${line} - excluding this sportsbook from comparison`)
  console.log(`📋 Available lines for this player: ${playerOutcomes.map(o => `${o.name} ${o.point}`).join(', ')}`)
  console.log(`🔧 === END FINDMATCHINGOUTCOMEWITHMARKET DEBUG ===\n`)
  return null
}

// Test function to debug the Dylan Cease 3.5 strikeouts issue
function testDylanCeaseMatching() {
  console.log('\n🧪 === TESTING DYLAN CEASE 3.5 STRIKEOUTS ===')
  
  // Exact outcomes from your API response
  const draftKingsOutcomes = [
    // From the actual API response - pitcher_strikeouts_alternate market
    { name: "Over", description: "Dylan Cease", price: -1000, point: 3.5, link: "https://sportsbook.draftkings.com/...", sid: "0QA262904966#286184397..." },
    { name: "Over", description: "Dylan Cease", price: -380, point: 4.5, link: "https://sportsbook.draftkings.com/...", sid: "0QA262904966#286184411..." },
    { name: "Over", description: "Dylan Cease", price: -170, point: 5.5, link: "https://sportsbook.draftkings.com/...", sid: "0QA262904966#286184419..." },
    { name: "Over", description: "Dylan Cease", price: 120, point: 6.5, link: "https://sportsbook.draftkings.com/...", sid: "0QA262904966#286184434..." }
  ]
  
  const betMGMOutcomes = [
    // From actual API response - note that BetMGM data might be truncated in your response
    { name: "Over", description: "Dylan Cease", price: -800, point: 3.5 },
    { name: "Over", description: "Dylan Cease", price: -325, point: 4.5 },
    { name: "Over", description: "Dylan Cease", price: -160, point: 5.5 },
    { name: "Over", description: "Dylan Cease", price: 120, point: 6.5 }
  ]
  
  const espnOutcomes = [
    // ESPN BET doesn't have 3.5 in the alternate market, only in pitcher_strikeouts (non-alternate)
    { name: "Over", description: "Dylan Cease", price: -400, point: 4.5 },
    { name: "Over", description: "Dylan Cease", price: -155, point: 5.5 },
    { name: "Over", description: "Dylan Cease", price: 130, point: 6.5 }
  ]
  
  // Test parameters from your betslip (when adding alternate 3.5 line)
  const playerName = "Dylan Cease"
  const line = 3.5  // This is what gets stored in betslip_selections
  const betType = "over"
  const marketKeys = ["pitcher_strikeouts", "pitcher_strikeouts_alternate"]
  
  console.log(`🎯 Testing: ${playerName} ${betType} ${line} (type: ${typeof line})`)
  console.log(`📊 Market keys: ${marketKeys.join(', ')}`)
  
  // Test DraftKings - should find match
  console.log('\n📚 === TESTING DRAFTKINGS ===')
  console.log('Available outcomes:', draftKingsOutcomes.map(o => `${o.description} ${o.name} ${o.point} (type: ${typeof o.point}) @ ${o.price}`))
  const dkResult = findMatchingOutcomeWithMarket(playerName, line, betType, draftKingsOutcomes, marketKeys)
  console.log(`✅ DraftKings result: ${dkResult ? `${dkResult.price} @ ${dkResult.point}` : 'NOT FOUND'}`)
  
  // Test BetMGM - should find match
  console.log('\n📚 === TESTING BETMGM ===')
  console.log('Available outcomes:', betMGMOutcomes.map(o => `${o.description} ${o.name} ${o.point} (type: ${typeof o.point}) @ ${o.price}`))
  const bmgResult = findMatchingOutcomeWithMarket(playerName, line, betType, betMGMOutcomes, marketKeys)
  console.log(`✅ BetMGM result: ${bmgResult ? `${bmgResult.price} @ ${bmgResult.point}` : 'NOT FOUND'}`)
  
  // Test ESPN BET - should NOT find match (no 3.5 line)
  console.log('\n📚 === TESTING ESPN BET ===')
  console.log('Available outcomes:', espnOutcomes.map(o => `${o.description} ${o.name} ${o.point} (type: ${typeof o.point}) @ ${o.price}`))
  const espnResult = findMatchingOutcomeWithMarket(playerName, line, betType, espnOutcomes, marketKeys)
  console.log(`✅ ESPN result: ${espnResult ? `${espnResult.price} @ ${espnResult.point}` : 'NOT FOUND (expected - no 3.5 line)'}`)
  
  // Test exact comparison logic
  console.log('\n🔬 === TESTING EXACT COMPARISON ===')
  const testOutcome = draftKingsOutcomes[0] // Over 3.5 at -1000
  console.log(`Test outcome: ${testOutcome.name} ${testOutcome.point} (${typeof testOutcome.point})`)
  console.log(`Target: over ${line} (${typeof line})`)
  console.log(`Name match: ${testOutcome.name.toLowerCase() === 'over'} (${testOutcome.name} === 'Over')`)
  console.log(`Point match: ${testOutcome.point === line} (${testOutcome.point} === ${line})`)
  console.log(`Both match: ${testOutcome.name === 'Over' && testOutcome.point === line}`)
  
  console.log('\n🧪 === END TEST ===')
}

// Get all active bookmaker IDs for the API call (using same logic as lookup-odds)
const getActiveBookmakers = () => {
  // Use the same established sportsbook IDs from lookup-odds route
  const activeSportsbooks = ['draftkings', 'fanduel', 'betmgm', 'williamhill_us', 'betrivers', 'novig', 'ballybet', 'espnbet', 'fanatics', 'hardrockbet', 'pinnacle']
  return activeSportsbooks.join(',')
}



export async function POST(request: NextRequest) {
  try {
    // Run test for debugging Dylan Cease issue
    // testDylanCeaseMatching() // Re-disabled after updating logic
    
    const { betslipId } = await request.json()

    if (!betslipId) {
      return NextResponse.json({ error: 'Betslip ID is required' }, { status: 400 })
    }

    const supabase = createClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Get the original betslip and its selections
    const { data: betslip, error: betslipError } = await supabase
      .from('betslips')
      .select(`
        *,
        betslip_selections (*)
      `)
      .eq('id', betslipId)
      .eq('user_id', user.id)
      .single()

    if (betslipError || !betslip) {
      return NextResponse.json({ error: 'Betslip not found' }, { status: 404 })
    }

    if (!betslip.betslip_selections || betslip.betslip_selections.length === 0) {
      return NextResponse.json({ error: 'No selections found in betslip' }, { status: 400 })
    }

    // 2. Create finalized betslip
    // Determine primary sportsbook from the first selection's odds data
    const firstSelection = betslip.betslip_selections[0]
    const primarySportsbook = firstSelection?.odds_data ? Object.keys(firstSelection.odds_data)[0] : 'Multiple'
    
    const { data: finalizedBetslip, error: finalizedBetslipError } = await supabase
      .from('finalized_betslips')
      .insert({
        user_id: user.id,
        original_betslip_id: betslipId,
        title: betslip.title,
        notes: betslip.notes,
        total_selections: betslip.betslip_selections.length,
        sportsbook: primarySportsbook,
        status: 'active',
        is_public: true // Default to public for finalized betslips
      })
      .select()
      .single()

    if (finalizedBetslipError) {
      console.error('Error creating finalized betslip:', finalizedBetslipError)
      return NextResponse.json({ error: 'Failed to create finalized betslip' }, { status: 500 })
    }

    // 3. Get unique events and their specific markets for odds fetching
    const eventMarketsMap = new Map()
    
    for (const selection of betslip.betslip_selections) {
      const eventId = selection.event_id
      const marketKey = selection.market_key
      
      if (!eventMarketsMap.has(eventId)) {
        eventMarketsMap.set(eventId, {
          sport_key: selection.sport_key,
          markets: new Set()
        })
      }
      
      // Handle comma-separated market keys (like "batter_home_runs,batter_home_runs_alternate")
      const markets = marketKey.split(',').map((m: string) => m.trim())
      markets.forEach((market: string) => {
        eventMarketsMap.get(eventId).markets.add(market)
      })
    }

    // 4. Fetch fresh odds for all unique events with their specific markets
    const freshOddsMap = new Map()
    
    for (const [eventId, eventInfo] of Array.from(eventMarketsMap.entries())) {
      try {
        const { sport_key, markets } = eventInfo
        const marketsList = Array.from(markets).join(',')
        
        // Build the correct API URL format with specific markets and all active bookmakers
        const activeBookmakers = getActiveBookmakers()
        const apiUrl = `https://api.the-odds-api.com/v4/sports/${sport_key}/events/${eventId}/odds?apiKey=${process.env.ODDS_API_KEY}&regions=us&markets=${marketsList}&oddsFormat=american&bookmakers=${activeBookmakers}&includeSids=true&includeLinks=true`
        
        console.log(`🔄 Fetching fresh odds for event ${eventId}`)
        console.log(`   Markets: ${marketsList}`)
        console.log(`   Bookmakers: ${activeBookmakers}`)
        console.log(`   URL: ${apiUrl.replace(process.env.ODDS_API_KEY || '', 'HIDDEN_API_KEY')}`)
        
        const oddsResponse = await fetch(apiUrl)
        
        if (oddsResponse.ok) {
          const oddsData = await oddsResponse.json()
          if (oddsData && oddsData.bookmakers) {
            freshOddsMap.set(eventId, oddsData)
            console.log(`✅ Fresh odds fetched for event ${eventId}: ${oddsData.bookmakers?.length || 0} bookmakers`)
          } else {
            console.log(`⚠️ No bookmakers data in response for event ${eventId}`)
          }
        } else {
          const errorText = await oddsResponse.text()
          console.log(`❌ Failed to fetch odds for event ${eventId}: ${oddsResponse.status} - ${errorText}`)
        }
      } catch (error) {
        console.error(`Error fetching odds for event ${eventId}:`, error)
        // Continue with other events even if one fails
      }
    }

    // 5. Process selections in parallel
    console.log(`\n🎯 Starting parallel processing for ${betslip.betslip_selections.length} selections`)
    
    // Process odds (removed hit rates fetching from here)
    const oddsPromises = betslip.betslip_selections.map(async (selection: BetslipSelection) => {
      try {
        console.log(`\n🔄 Processing selection: ${selection.player_name || selection.market_key} ${selection.selection} ${selection.line}`)
        
        const freshEvent = freshOddsMap.get(selection.event_id)
        let finalizedOddsData = selection.odds_data // fallback to original
        
        if (freshEvent) {
          // Create odds structure matching scanned betslip format with metadata + bookmakers
          const bookmakers: Record<string, any> = {}
          let foundBookmakers = 0
          let bestOdds: number = 0
          let bestBook: string = ''
          
          console.log(`🔍 Processing ${selection.player_name || selection.market_key} ${selection.selection} ${selection.line} across ${freshEvent.bookmakers?.length || 0} bookmakers`)
          
          // Debug: Show which bookmakers are available in the API response
          console.log(`📊 Available bookmakers in API response: ${freshEvent.bookmakers?.map((b: any) => b.key).join(', ') || 'none'}`)
          
          // Debug: Show which bookmakers we requested
          const requestedBookmakers = getActiveBookmakers().split(',')
          console.log(`📊 Requested bookmakers: ${requestedBookmakers.join(', ')}`)
          
          // Debug: Show which are missing
          const availableKeys = freshEvent.bookmakers?.map((b: any) => b.key) || []
          const missingBookmakers = requestedBookmakers.filter((b: string) => !availableKeys.includes(b))
          if (missingBookmakers.length > 0) {
            console.log(`⚠️ Missing bookmakers: ${missingBookmakers.join(', ')}`)
          }
          
          // Iterate through all bookmakers in the fresh event
          for (const bookmaker of freshEvent.bookmakers || []) {
            console.log(`\n📚 === PROCESSING BOOKMAKER: ${bookmaker.key} (${bookmaker.title}) ===`)
            
            // Handle comma-separated market keys (like "batter_home_runs,batter_home_runs_alternate") 
            const marketKeys = selection.market_key.split(',').map((m: string) => m.trim())
            console.log(`📊 Looking for markets: ${marketKeys.join(', ')}`)
            
            let allOutcomes: any[] = []
            let foundMarkets: string[] = []
            let matchingOutcome = null
            
            // Check ALL markets and collect outcomes from each (don't break on first find)
            for (const marketKey of marketKeys) {
              const market = bookmaker.markets?.find((market: any) => market.key === marketKey)
              if (market && market.outcomes) {
                console.log(`✅ Found market: ${marketKey} with ${market.outcomes.length} outcomes`)
                
                // Debug: Show outcomes from THIS specific market
                market.outcomes.forEach((outcome: any, i: number) => {
                  if (outcome.description) {
                    console.log(`    [${marketKey}] ${i + 1}. ${outcome.description} ${outcome.name} ${outcome.point} @ ${outcome.price}`)
                  } else {
                    console.log(`    [${marketKey}] ${i + 1}. ${outcome.name} ${outcome.point} @ ${outcome.price}`)
                  }
                })
                
                allOutcomes = allOutcomes.concat(market.outcomes)
                foundMarkets.push(marketKey)
              } else {
                console.log(`❌ Market not found: ${marketKey}`)
              }
            }
            
            if (allOutcomes.length > 0) {
              console.log(`📋 Combined outcomes from ${foundMarkets.join(' + ')} markets at ${bookmaker.key}: ${allOutcomes.length}`)
              console.log(`🔍 Verification - All outcomes after combining:`)
              allOutcomes.forEach((outcome: any, i: number) => {
                if (outcome.description) {
                  console.log(`  ${i + 1}. ${outcome.description} ${outcome.name} ${outcome.point} @ ${outcome.price}`)
                } else {
                  console.log(`  ${i + 1}. ${outcome.name} ${outcome.point} @ ${outcome.price}`)
                }
              })
              
              // Check if this is a player prop (has a player_name) vs game-level market (no player_name)
              if (selection.player_name && selection.player_name.trim() !== '') {
                console.log(`🎯 Player prop matching at ${bookmaker.key}: "${selection.player_name}" ${selection.selection.toLowerCase()} ${selection.line}`)
                matchingOutcome = findMatchingOutcomeWithMarket(
                  selection.player_name,
                  selection.line,
                  selection.selection.toLowerCase(), // Convert "Over"/"Under" to "over"/"under"
                  allOutcomes, // Use combined outcomes from ALL markets
                  marketKeys
                )
                console.log(`🔍 Match result at ${bookmaker.key}: ${matchingOutcome ? 'FOUND' : 'NOT FOUND'}`)
              } else {
                // For regular markets (h2h, spreads, totals)
                console.log(`🎮 Game-level matching at ${bookmaker.key}: ${selection.selection}`)
                matchingOutcome = allOutcomes.find((outcome: any) => 
                  outcome.name === selection.selection
                )
                console.log(`🔍 Game-level match result at ${bookmaker.key}: ${matchingOutcome ? 'FOUND' : 'NOT FOUND'}`)
              }
              
              if (matchingOutcome) {
                // Use standardized bookmaker key (e.g. "draftkings", "fanduel")
                const bookmakerKey = bookmaker.key.toLowerCase()
                
                console.log(`✅ MATCH FOUND at ${bookmaker.key}: ${matchingOutcome.description || matchingOutcome.name} ${matchingOutcome.point} @ ${matchingOutcome.price}`)
                
                // Create bookmaker odds entry matching scanned betslip format (using "price" not "odds")
                bookmakers[bookmakerKey] = {
                  sid: matchingOutcome.sid || null,
                  link: matchingOutcome.link || null,
                  point: matchingOutcome.point || selection.line,
                  price: matchingOutcome.price  // Use "price" to match scanned format
                }
                
                foundBookmakers++
                console.log(`📈 Total bookmakers found so far: ${foundBookmakers}`)
                
                // Track best odds for metadata
                if (matchingOutcome.price > bestOdds) {
                  bestOdds = matchingOutcome.price
                  bestBook = bookmakerKey
                  console.log(`🏆 New best odds: ${bestOdds} at ${bestBook}`)
                }
              } else {
                console.log(`❌ No matching outcome found at ${bookmaker.key}`)
              }
            } else {
              console.log(`❌ No matching market found at ${bookmaker.key} for markets: ${marketKeys.join(', ')}`)
              console.log(`📋 Available markets at ${bookmaker.key}: ${bookmaker.markets?.map((m: any) => m.key).join(', ') || 'none'}`)
            }
            
            console.log(`📊 Bookmaker ${bookmaker.key} processing complete. Current bookmakers object:`, Object.keys(bookmakers))
          }
          
          // Create the complete odds structure with metadata (matching scanned betslip format)
          if (foundBookmakers > 0) {
            finalizedOddsData = {
              metadata: {
                best_book: bestBook as string | null,
                best_odds: bestOdds as number | null,
                last_updated: new Date().toISOString(),
                line_searched: selection.line,
                matches_found: foundBookmakers,
                market_searched: selection.market_key,
                player_searched: selection.player_name || '',
                total_bookmakers: freshEvent.bookmakers?.length || 0,
                bet_type_searched: selection.selection.toLowerCase()
              } as OddsMetadata,
              bookmakers: bookmakers
            }
            console.log(`🎉 SUCCESS: Found fresh odds from ${foundBookmakers}/${freshEvent.bookmakers?.length || 0} bookmakers for ${selection.player_name || selection.market_key} ${selection.selection}`)
            console.log(`💰 Best odds: ${bestOdds} at ${bestBook}`)
            console.log(`📊 Final bookmakers data:`, JSON.stringify(bookmakers, null, 2))
          } else {
            console.log(`⚠️ FAILED: No matching fresh odds found for ${selection.player_name || selection.market_key} ${selection.selection}`)
            console.log(`🔍 Event had ${freshEvent.bookmakers?.length || 0} bookmakers but none matched our criteria`)
          }
        }

        // Calculate running total odds (use the best available odds for parlay calculation)
        let bestOdds = null
        if (typeof finalizedOddsData === 'object' && finalizedOddsData !== null) {
          // Check if it has the new metadata structure
          if ('metadata' in finalizedOddsData && 'bookmakers' in finalizedOddsData) {
            // Use the best_odds from metadata for efficiency
            bestOdds = finalizedOddsData.metadata?.best_odds || null
          } else {
            // Fallback for old structure - find the best odds across all bookmakers
            for (const [bookmaker, bookData] of Object.entries(finalizedOddsData)) {
              if (typeof bookData === 'object' && bookData !== null) {
                // Check for both "price" (scanned format) and "odds" (old finalized format)
                const oddsValue = (bookData as any).price || (bookData as any).odds
                
                if (typeof oddsValue === 'number') {
                  if (bestOdds === null || oddsValue > bestOdds) {
                    bestOdds = oddsValue
                  }
                }
              }
            }
          }
        }

        // Extract sport and market display names using proper market config lookup
        const sportDisplayName = selection.sport_key.replace(/_/g, ' ').toUpperCase()
        
        // Use proper market lookup to get the correct market value and display name
        const markets = getMarketsForSport(selection.sport_key)
        
        // Handle comma-separated market keys by taking the first part (base market)
        const baseMarketKey = selection.market_key.split(',')[0].trim()
        
        // Find market config using the base market key
        const marketConfig = markets.find(m => m.apiKey === baseMarketKey)
        
        console.log(`🔍 Market lookup debug:`)
        console.log(`   Original market_key: "${selection.market_key}"`)
        console.log(`   Base market key: "${baseMarketKey}"`)
        console.log(`   Market config found: ${marketConfig ? 'YES' : 'NO'}`)
        if (marketConfig) {
          console.log(`   Config: value="${marketConfig.value}", label="${marketConfig.label}", apiKey="${marketConfig.apiKey}"`)
        }
        
        // Use the market value for hit rate lookups, display name for UI
        const marketValue = marketConfig?.value || baseMarketKey
        const marketDisplayName = marketConfig?.label || baseMarketKey.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())

        console.log(`📋 Final mapping: "${selection.market_key}" → value:"${marketValue}" label:"${marketDisplayName}"`)

        return {
          finalized_betslip_id: finalizedBetslip.id,
          event_id: selection.event_id,
          sport_key: selection.sport_key,
          sport: sportDisplayName,
          commence_time: selection.commence_time,
          home_team: selection.home_team,
          away_team: selection.away_team,
          bet_type: selection.bet_type,
          market_type: selection.market_type,
          market_key: selection.market_key,
          market: marketValue,  // Use market value for hit rate matching
          selection: selection.selection,
          player_name: selection.player_name,
          player_team: selection.player_team,
          line: selection.line,
          original_odds: JSON.stringify(selection.odds_data),
          current_odds: finalizedOddsData,
          status: 'active'
        }
             } catch (error) {
         console.error(`Error processing selection:`, error)
         
         // Extract sport and market display names for error case too
         const sportDisplayName = selection.sport_key.replace(/_/g, ' ').toUpperCase()
         const markets = getMarketsForSport(selection.sport_key)
         
         // Handle comma-separated market keys by taking the first part
         const baseMarketKey = selection.market_key.split(',')[0].trim()
         const marketConfig = markets.find(m => m.apiKey === baseMarketKey)
         const marketValue = marketConfig?.value || baseMarketKey
         const marketDisplayName = marketConfig?.label || baseMarketKey.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
         
         return {
           finalized_betslip_id: finalizedBetslip.id,
           event_id: selection.event_id,
           sport_key: selection.sport_key,
           sport: sportDisplayName,
           commence_time: selection.commence_time,
           home_team: selection.home_team,
           away_team: selection.away_team,
           bet_type: selection.bet_type,
           market_type: selection.market_type,
           market_key: selection.market_key,
                       market: marketValue,  // Use market value for hit rate matching
           selection: selection.selection,
           player_name: selection.player_name,
           player_team: selection.player_team,
           line: selection.line,
           original_odds: JSON.stringify(selection.odds_data),
           current_odds: {
             error: error instanceof Error ? error.message : 'Unknown error',
             metadata: {
               matches_found: 0,
               total_bookmakers: 0,
               best_odds: null as number | null,
               best_book: null as string | null,
               player_searched: selection.player_name || '',
               line_searched: selection.line || 0,
               bet_type_searched: selection.selection.toLowerCase(),
               market_searched: selection.market_key,
               last_updated: new Date().toISOString(),
               error: error instanceof Error ? error.message : 'Unknown error'
             } as OddsMetadata
           },
           status: 'active'
         }
      }
    })

    // Execute odds processing (hit rates will be fetched dynamically at page level)
    const finalizedSelections = await Promise.all(oddsPromises)

    console.log(`\n🚀 Odds processing complete!`)
    console.log(`✅ Odds processed for ${finalizedSelections.length} selections`)

    // Calculate total odds
    const totalOdds = finalizedSelections.reduce((total, selection) => {
      // Extract best odds from current_odds metadata
      let bestOdds = null
      if (typeof selection.current_odds === 'object' && selection.current_odds !== null) {
        if ('metadata' in selection.current_odds && selection.current_odds.metadata) {
          bestOdds = selection.current_odds.metadata.best_odds
        }
      }
      
      if (bestOdds === null) return total
      
      // Convert American odds to decimal for multiplication
      const decimalOdds = bestOdds > 0 
        ? (bestOdds / 100) + 1 
        : (100 / Math.abs(bestOdds)) + 1
      
      return total * decimalOdds
    }, 1)

    // 6. Insert finalized selections
    const { data: insertedSelections, error: selectionsError } = await supabase
      .from('finalized_betslip_selections')
      .insert(finalizedSelections)
      .select()

    if (selectionsError) {
      console.error('Error creating finalized selections:', selectionsError)
      return NextResponse.json({ error: 'Failed to create finalized selections' }, { status: 500 })
    }

    // 7. Update finalized betslip with total odds, hit rates, and refresh timestamp
    const { error: updateError } = await supabase
      .from('finalized_betslips')
      .update({
        snapshot_total_odds: totalOdds,
        // hit_rates_data: hitRatesData, // Removed hit rates update
        last_odds_refresh: new Date().toISOString()
      })
      .eq('id', finalizedBetslip.id)

    if (updateError) {
      console.error('Error updating finalized betslip:', updateError)
    }

    // 8. Return the finalized betslip data
    const { data: finalBetslipWithSelections, error: fetchError } = await supabase
      .from('finalized_betslips')
      .select(`
        *,
        finalized_betslip_selections (*)
      `)
      .eq('id', finalizedBetslip.id)
      .single()

    if (fetchError) {
      console.error('Error fetching finalized betslip:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch finalized betslip' }, { status: 500 })
    }

    // Calculate total unique markets used
    const totalMarkets = Array.from(eventMarketsMap.values())
      .reduce((total, eventInfo) => total + eventInfo.markets.size, 0)

    // Summary logging
    const selectionsWithFreshOdds = finalizedSelections.filter(s => 
      s.current_odds && typeof s.current_odds === 'object' && 'metadata' in s.current_odds && s.current_odds.metadata?.matches_found > 0
    ).length
    
    console.log(`\n📊 COMPARE ODDS SUMMARY:`)
    console.log(`   ✅ Selections with fresh odds: ${selectionsWithFreshOdds}/${betslip.betslip_selections.length}`)
    console.log(`   🔄 Events processed: ${freshOddsMap.size}`)
    console.log(`   🎲 Final parlay odds: ${totalOdds.toFixed(2)}`)
    console.log(`   💾 Finalized betslip ID: ${finalizedBetslip.id}`)
    // console.log(`   📈 Hit rates found: ${Object.keys(hitRatesData).length}/${betslip.betslip_selections.length}`) // Removed hit rates logging

    return NextResponse.json({
        success: true,
        data: {
          finalizedBetslip: finalBetslipWithSelections,
          originalBetslipId: betslipId,
          totalSelections: betslip.betslip_selections.length,
          eventsRefreshed: freshOddsMap.size,
          totalEvents: eventMarketsMap.size,
          totalMarkets: totalMarkets,
          selectionsWithFreshOdds: selectionsWithFreshOdds
        }
    })

  } catch (error) {
    console.error('Compare odds error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 