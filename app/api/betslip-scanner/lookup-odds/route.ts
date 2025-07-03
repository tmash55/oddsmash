import { NextRequest, NextResponse } from 'next/server'
import { calculateParlayOdds, americanToDecimal, decimalToAmerican, formatOdds } from '@/lib/odds-utils'
import { generateSportsbookUrl, SportsbookLinkParams } from '@/lib/sportsbook-links'

interface BetSelection {
  id: string
  player?: string
  market: string
  line?: number
  betType: 'over' | 'under' | 'moneyline' | 'spread'
  sport: string
  metadata?: {
    odds?: string
    awayTeam?: string
    homeTeam?: string
    playerTeam?: string
    gameTime?: string
  }
}

interface GameData {
  sport_key: string
  event_id: string
  commence_time: string
  home_team: {
    name: string
    abbreviation: string
  }
  away_team: {
    name: string
    abbreviation: string
  }
  mlb_game_id?: string
  status: string
}

interface OddsLookupRequest {
  selections: BetSelection[]
  sport: string
  date?: string // Format: YYYY-MM-DD
  includeSids?: boolean
  includeLinks?: boolean
}

interface EnrichedSelection extends BetSelection {
  gameId?: string
  currentOdds?: any
  matchConfidence?: number
}

// Helper function to normalize team names for matching
function normalizeTeamName(teamName: string): string {
  return teamName
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    // Handle common variations
    .replace('new york mets', 'mets')
    .replace('texas rangers', 'rangers')
    .replace('chicago cubs', 'cubs')
    .replace('houston astros', 'astros')
    .replace('washington nationals', 'nationals')
    .replace('minnesota twins', 'twins')
    .replace('pittsburgh pirates', 'pirates')
    .replace('chicago white sox', 'white sox')
}

// Find matching game for a selection based on team names
function findMatchingGame(selection: BetSelection, games: Record<string, GameData>): { gameId: string, confidence: number } | null {
  if (!selection.metadata?.awayTeam && !selection.metadata?.homeTeam) {
    return null
  }

  let bestMatch: { gameId: string, confidence: number } | null = null
  let highestConfidence = 0

  for (const [gameId, game] of Object.entries(games)) {
    let confidence = 0
    
    // Normalize team names from selection
    const selectionAway = selection.metadata.awayTeam ? normalizeTeamName(selection.metadata.awayTeam) : ''
    const selectionHome = selection.metadata.homeTeam ? normalizeTeamName(selection.metadata.homeTeam) : ''
    
    // Normalize team names from game data
    const gameAway = normalizeTeamName(game.away_team.name)
    const gameHome = normalizeTeamName(game.home_team.name)
    
    // Check for exact matches
    if (selectionAway && gameAway.includes(selectionAway)) confidence += 0.5
    if (selectionHome && gameHome.includes(selectionHome)) confidence += 0.5
    
    // Check for partial matches
    if (selectionAway && selectionAway.split(' ').some(word => gameAway.includes(word))) confidence += 0.2
    if (selectionHome && selectionHome.split(' ').some(word => gameHome.includes(word))) confidence += 0.2
    
    // Boost confidence if both teams match
    if (confidence >= 1.0) confidence = 1.0
    
    if (confidence > highestConfidence && confidence > 0.3) {
      highestConfidence = confidence
      bestMatch = { gameId, confidence }
    }
  }

  return bestMatch
}

// Helper function to normalize player names for matching
function normalizePlayerName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')
    .trim()
}

// Helper function to calculate name similarity with suffix handling
function calculateNameSimilarity(target: string, candidate: string): number {
  const targetNorm = normalizePlayerName(target)
  const candidateNorm = normalizePlayerName(candidate)
  
  // Add debug logging for specific problematic cases
  const isLourdesCase = targetNorm.includes('lourdes') || candidateNorm.includes('lourdes')
  if (isLourdesCase) {
    console.log(`🔍 DEBUG: Comparing "${target}" vs "${candidate}"`)
    console.log(`   Normalized: "${targetNorm}" vs "${candidateNorm}"`)
  }
  
  // Exact match gets highest score
  if (targetNorm === candidateNorm) {
    if (isLourdesCase) console.log(`   ✅ Exact match: 1.0`)
    return 1.0
  }
  
  // Helper function to remove common suffixes
  function removeSuffixes(name: string): string {
    const suffixes = ['jr', 'sr', 'ii', 'iii', 'iv', 'v']
    const words = name.split(' ')
    
    // Remove suffix if it's the last word and matches our list (allow 2+ words for better matching)
    if (words.length >= 2 && suffixes.includes(words[words.length - 1])) {
      return words.slice(0, -1).join(' ')
    }
    
    return name
  }
  
  // Try matching with suffixes removed from both sides
  const targetNoSuffix = removeSuffixes(targetNorm)
  const candidateNoSuffix = removeSuffixes(candidateNorm)
  
  if (isLourdesCase) {
    console.log(`   No suffix: "${targetNoSuffix}" vs "${candidateNoSuffix}"`)
  }
  
  // Check if they match after removing suffixes from both
  if (targetNoSuffix === candidateNoSuffix) {
    if (isLourdesCase) console.log(`   ✅ Match after suffix removal: 0.95`)
    return 0.95 // Very high confidence for match with suffix difference
  }
  
  // Check if target (without suffix) matches candidate (with suffix)
  // e.g., "Lourdes Gurriel" vs "Lourdes Gurriel Jr."
  if (targetNoSuffix === candidateNorm || targetNorm === candidateNoSuffix) {
    if (isLourdesCase) console.log(`   ✅ One-way suffix match: 0.95`)
    return 0.95 // Very high confidence for one-way suffix match
  }
  
  // Check if all words in target are in candidate (and vice versa)
  const targetWords = targetNoSuffix.split(' ')
  const candidateWords = candidateNoSuffix.split(' ')
  
  if (isLourdesCase) {
    console.log(`   Target words: [${targetWords.join(', ')}]`)
    console.log(`   Candidate words: [${candidateWords.join(', ')}]`)
  }
  
  // For player names, we want both first and last name to match reasonably well
  if (targetWords.length >= 2 && candidateWords.length >= 2) {
    // Both names should have matching first and last names
    const firstNameMatch = targetWords[0] === candidateWords[0] || 
                          targetWords[0].startsWith(candidateWords[0][0]) ||
                          candidateWords[0].startsWith(targetWords[0][0])
    
    const lastNameMatch = targetWords[targetWords.length - 1] === candidateWords[candidateWords.length - 1]
    
    if (isLourdesCase) {
      console.log(`   First name match: ${firstNameMatch} (${targetWords[0]} vs ${candidateWords[0]})`)
      console.log(`   Last name match: ${lastNameMatch} (${targetWords[targetWords.length - 1]} vs ${candidateWords[candidateWords.length - 1]})`)
    }
    
    if (firstNameMatch && lastNameMatch) {
      if (isLourdesCase) console.log(`   ✅ First+last match: 0.9`)
      return 0.9 // High confidence for first+last match
    }
    
    if (lastNameMatch && targetWords[0][0] === candidateWords[0][0]) {
      if (isLourdesCase) console.log(`   ✅ Last name + first initial match: 0.8`)
      return 0.8 // Good confidence for last name + first initial
    }
  }
  
  // Check if one name contains the other (less preferred)
  if (targetNorm.includes(candidateNorm) || candidateNorm.includes(targetNorm)) {
    if (isLourdesCase) console.log(`   ⚠️ Partial contains match: 0.6`)
    return 0.6 // Lower confidence for partial matches
  }
  
  if (isLourdesCase) console.log(`   ❌ No match: 0.0`)
  return 0.0 // No match
}

// Helper function to extract player odds from API response
function extractPlayerOdds(apiResponse: any, playerName: string, market: string, targetLine?: number, includeSids = false, includeLinks = false): any {
  if (!apiResponse?.bookmakers || !Array.isArray(apiResponse.bookmakers)) {
    console.log(`❌ No bookmakers data in API response`)
    return null
  }

  const normalizedPlayerName = normalizePlayerName(playerName)
  console.log(`🔍 Looking for player: "${playerName}" (normalized: "${normalizedPlayerName}"), market: "${market}", line: ${targetLine}`)

  const playerOdds: Record<string, any> = {}
  let foundAnyMatch = false

  for (const bookmaker of apiResponse.bookmakers) {
    console.log(`📚 Checking ${bookmaker.title} (${bookmaker.key})`)
    
    if (!bookmaker.markets || !Array.isArray(bookmaker.markets)) {
      console.log(`   ❌ No markets for ${bookmaker.title}`)
      continue
    }

    for (const marketData of bookmaker.markets) {
      console.log(`   📊 Market: ${marketData.key}`)
      
      if (!marketData.outcomes || !Array.isArray(marketData.outcomes)) {
        console.log(`   ❌ No outcomes for market ${marketData.key}`)
        continue
      }

      // Look for our player in the outcomes
      for (const outcome of marketData.outcomes) {
        if (outcome.name === 'Over' && outcome.description) {
          const normalizedDescription = normalizePlayerName(outcome.description)
          
          // Check if this outcome matches our player - UPDATED WITH SUFFIX HANDLING
          const similarity = calculateNameSimilarity(normalizedPlayerName, normalizedDescription)
          const isPlayerMatch = similarity >= 0.5 // Temporarily lowered from 0.7 to 0.5 for debugging
          
          // Add debug logging for any Lourdes-related comparisons
          if (normalizedPlayerName.includes('lourdes') || normalizedDescription.includes('lourdes')) {
            console.log(`🔍 LOURDES DEBUG: "${playerName}" (${normalizedPlayerName}) vs "${outcome.description}" (${normalizedDescription}) = ${similarity}`)
          }
          
          // Check if this is the right line - STRICT MATCHING ONLY
          const isCorrectLine = targetLine === undefined || targetLine === null || outcome.point === targetLine
          
          if (isPlayerMatch && isCorrectLine) {
            console.log(`   ✅ Found ${playerName} in ${bookmaker.title}: ${outcome.price} (line: ${outcome.point})`)
            
            const oddsData: any = {
              price: outcome.price,
              point: outcome.point,
              sportsbook: bookmaker.title,
              market: marketData.key,
              lastUpdate: marketData.last_update
            }
            
            // Add outcome-level SID and link (these are the individual selection IDs)
            if (includeSids && outcome.sid) {
              oddsData.sid = outcome.sid
              console.log(`   📎 Selection SID: ${outcome.sid}`)
            }
            
            if (includeLinks && outcome.link) {
              oddsData.link = outcome.link
              console.log(`   🔗 Selection link: ${outcome.link}`)
            }
            
            // Add bookmaker-level event SID and link (for event context)
            if (includeSids && bookmaker.sid) {
              oddsData.eventSid = bookmaker.sid
              console.log(`   📎 Event SID: ${bookmaker.sid}`)
            }
            
            if (includeLinks && bookmaker.link) {
              oddsData.eventLink = bookmaker.link
              console.log(`   🔗 Event link: ${bookmaker.link}`)
            }
            
            playerOdds[bookmaker.key] = oddsData
            foundAnyMatch = true
          } else if (isPlayerMatch) {
            console.log(`   ⚠️ Found ${playerName} in ${bookmaker.title} but wrong line: ${outcome.point} (wanted: ${targetLine}) - EXCLUDING from comparison`)
          }
        }
      }
    }
  }

  if (!foundAnyMatch) {
    console.log(`❌ No odds found for ${playerName}`)
    // Log available players for debugging with similarity scores
    const availablePlayers = new Set<string>()
    const similarityScores: Array<{player: string, score: number}> = []
    
    apiResponse.bookmakers.forEach((bookmaker: any) => {
      bookmaker.markets?.forEach((market: any) => {
        market.outcomes?.forEach((outcome: any) => {
          if (outcome.description) {
            availablePlayers.add(outcome.description)
            const score = calculateNameSimilarity(normalizedPlayerName, normalizePlayerName(outcome.description))
            if (score > 0.3) { // Only log players with some similarity
              similarityScores.push({player: outcome.description, score})
            }
          }
        })
      })
    })
    
    console.log(`📋 Available players in API response:`, Array.from(availablePlayers))
    console.log(`🎯 Similarity scores for "${playerName}":`, similarityScores.sort((a, b) => b.score - a.score))
    return null
  }

  return playerOdds
}

// Fetch current odds from The Odds API
async function fetchCurrentOdds(gameId: string, market: string, includeSids = false, includeLinks = false): Promise<any> {
  try {
    const apiKey = process.env.ODDS_API_KEY
    if (!apiKey) {
      console.warn('ODDS_API_KEY not configured')
      return null
    }
    
    // Map our market names to The Odds API market names using the established mapping
    const marketMapping: Record<string, string[]> = {
      'Home Runs': ['batter_home_runs', 'batter_home_runs_alternate'],
      'Hits': ['batter_hits', 'batter_hits_alternate'], 
      'RBIs': ['batter_rbis', 'batter_rbis_alternate'],
      'Strikeouts': ['pitcher_strikeouts', 'pitcher_strikeouts_alternate'],
      'Total Bases': ['batter_total_bases', 'batter_total_bases_alternate'],
      'Runs': ['batter_runs'],
      'Stolen Bases': ['batter_stolen_bases']
    }
    
    const apiMarkets = marketMapping[market] || ['batter_home_runs']
    const marketsParam = apiMarkets.join(',')
    
    // Use established sportsbook IDs from sportsbooks.ts
    const activeSportsbooks = ['draftkings', 'fanduel', 'betmgm', 'williamhill_us', 'betrivers', 'novig']
    const sportsbooksParam = activeSportsbooks.join(',')
    
    // Build URL with optional parameters
    let url = `https://api.the-odds-api.com/v4/sports/baseball_mlb/events/${gameId}/odds?apiKey=${apiKey}&markets=${marketsParam}&oddsFormat=american&bookmakers=${sportsbooksParam}`
    
    if (includeSids) {
      url += '&includeSids=true'
    }
    
    if (includeLinks) {
      url += '&includeLinks=true'
    }
    
    console.log(`🎯 Fetching odds for ${market} (${apiMarkets.join(' + ')}) in game ${gameId}`)
    console.log(`📞 API Call: ${url}`)
    
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`❌ Odds API error for game ${gameId}: ${response.status} ${response.statusText}`)
      
      // Log response body for debugging 422 errors
      try {
        const errorBody = await response.text()
        console.error(`❌ Error response body:`, errorBody)
      } catch (e) {
        console.error('Could not read error response body')
      }
      return null
    }
    
    const data = await response.json()
    console.log(`✅ Successfully fetched odds for game ${gameId}, market ${apiMarkets.join(' + ')}`)
    console.log(`📊 Response structure:`, {
      hasBookmakers: !!data.bookmakers,
      numBookmakers: data.bookmakers?.length || 0,
      bookmakerKeys: data.bookmakers?.map((b: any) => b.key) || [],
      hasSids: includeSids && data.bookmakers?.some((b: any) => b.sid),
      hasLinks: includeLinks && data.bookmakers?.some((b: any) => b.link)
    })
    
    return data
  } catch (error) {
    console.error(`💥 Error fetching odds for game ${gameId}:`, error)
    return null
  }
}

// Fetch today's games directly from The Odds API
async function fetchTodaysGames(sport: string, date: string): Promise<Record<string, GameData>> {
  try {
    const apiKey = process.env.ODDS_API_KEY
    if (!apiKey) {
      console.warn('ODDS_API_KEY not configured')
      return {}
    }
    
    // Map sport to The Odds API format
    const apiSport = sport === 'baseball_mlb' || sport === 'mlb' ? 'baseball_mlb' : sport
    
    // Get games for the date (extend to next day to catch evening games in US timezones)
    const startTime = `${date}T00:00:00Z`
    const endTime = `${date}T23:59:59Z`
    
    // Also include early hours of next day to catch late games
    const nextDay = new Date(date)
    nextDay.setDate(nextDay.getDate() + 1)
    const nextDayStr = nextDay.toISOString().split('T')[0]
    const extendedEndTime = `${nextDayStr}T06:00:00Z` // Include games up to 6 AM next day UTC
    
    const url = `https://api.the-odds-api.com/v4/sports/${apiSport}/events?apiKey=${apiKey}&dateFormat=iso&commenceTimeFrom=${startTime}&commenceTimeTo=${extendedEndTime}`
    
    console.log(`Fetching games from Odds API: ${url}`)
    
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Odds API error: ${response.status} ${response.statusText}`)
      return {}
    }
    
    const events = await response.json()
    console.log(`Odds API returned ${events.length} games for ${date}`)
    
    // Convert to our GameData format and index by event_id
    const games: Record<string, GameData> = {}
    events.forEach((event: any) => {
      games[event.id] = {
        sport_key: event.sport_key,
        event_id: event.id,
        commence_time: event.commence_time,
        home_team: {
          name: event.home_team,
          abbreviation: event.home_team // API doesn't provide abbreviations in events endpoint
        },
        away_team: {
          name: event.away_team,
          abbreviation: event.away_team
        },
        status: 'scheduled' // Default status
      }
    })
    
    return games
  } catch (error) {
    console.error('Error fetching games from Odds API:', error)
    return {}
  }
}

// Calculate parlay odds across all sportsbooks
function calculateParlayComparison(enrichedSelections: EnrichedSelection[]): any {
  console.log('\n🎯 === CALCULATING PARLAY COMPARISON ===')
  
  // Get all selections that have current odds
  const selectionsWithOdds = enrichedSelections.filter(s => s.currentOdds && Object.keys(s.currentOdds).length > 0)
  
  if (selectionsWithOdds.length === 0) {
    console.log('❌ No selections have odds data for parlay calculation')
    return null
  }
  
  console.log(`📊 Calculating parlay for ${selectionsWithOdds.length} selections with odds`)
  
  // Get all unique sportsbooks that have odds for at least one selection
  const allSportsbooks = new Set<string>()
  selectionsWithOdds.forEach(selection => {
    Object.keys(selection.currentOdds || {}).forEach(book => allSportsbooks.add(book))
  })
  
  console.log(`📚 Found odds from sportsbooks: ${Array.from(allSportsbooks).join(', ')}`)
  
  // Calculate parlay odds for each sportsbook
  const parlayResults: Record<string, any> = {}
  
  for (const sportsbook of Array.from(allSportsbooks)) {
    console.log(`\n🧮 Calculating ${sportsbook} parlay:`)
    
    // Check if this sportsbook has odds for ALL selections
    const oddsForThisBook: number[] = []
    let hasAllSelections = true
    
    for (const selection of selectionsWithOdds) {
      const bookOdds = selection.currentOdds?.[sportsbook]
      
      if (bookOdds && typeof bookOdds.price === 'number') {
        oddsForThisBook.push(bookOdds.price)
        console.log(`   ✅ ${selection.player}: ${formatOdds(bookOdds.price)}`)
      } else {
        console.log(`   ❌ ${selection.player}: No odds available`)
        hasAllSelections = false
        break
      }
    }
    
    if (hasAllSelections && oddsForThisBook.length === selectionsWithOdds.length) {
      // Calculate parlay odds using the utility function
      const parlayOdds = calculateParlayOdds(oddsForThisBook)
      
      console.log(`   🎯 ${sportsbook} parlay odds: ${formatOdds(parlayOdds)}`)
      
      parlayResults[sportsbook] = {
        parlayOdds,
        individualOdds: oddsForThisBook,
        hasAllSelections: true,
        numSelections: oddsForThisBook.length
      }
    } else {
      console.log(`   ⚠️ ${sportsbook} missing odds for some selections`)
      parlayResults[sportsbook] = {
        parlayOdds: null,
        individualOdds: oddsForThisBook,
        hasAllSelections: false,
        numSelections: oddsForThisBook.length
      }
    }
  }
  
  // Find the best parlay odds
  let bestSportsbook = ''
  let bestOdds = Number.NEGATIVE_INFINITY
  
  Object.entries(parlayResults).forEach(([sportsbook, result]) => {
    if (result.hasAllSelections && result.parlayOdds !== null) {
      if (result.parlayOdds > bestOdds) {
        bestOdds = result.parlayOdds
        bestSportsbook = sportsbook
      }
    }
  })
  
  console.log(`\n🏆 Best parlay odds: ${bestSportsbook} at ${formatOdds(bestOdds)}`)
  
  return {
    parlayResults,
    bestSportsbook,
    bestOdds: bestOdds !== Number.NEGATIVE_INFINITY ? bestOdds : null,
    numSelectionsWithOdds: selectionsWithOdds.length,
    totalSelections: enrichedSelections.length
  }
}

// Generate parlay links for sportsbooks that support deep linking
function generateParlayLinks(enrichedSelections: EnrichedSelection[], includeLinks: boolean): Record<string, string | null> {
  if (!includeLinks) return {}
  
  const parlayLinks: Record<string, string | null> = {}
  const selectionsWithOdds = enrichedSelections.filter(s => s.currentOdds && Object.keys(s.currentOdds).length > 0)
  
  if (selectionsWithOdds.length === 0) return {}
  
  // Get all sportsbooks that have odds for at least one selection
  const allSportsbooks = new Set<string>()
  selectionsWithOdds.forEach(selection => {
    Object.keys(selection.currentOdds || {}).forEach(book => allSportsbooks.add(book))
  })
  
  for (const sportsbook of Array.from(allSportsbooks)) {
    console.log(`\n🔗 Generating ${sportsbook} parlay link:`)
    
    // Check if this sportsbook has odds for ALL selections
    const legs = []
    let hasAllSelections = true
    
    for (const selection of selectionsWithOdds) {
      const bookOdds = selection.currentOdds?.[sportsbook]
      
      if (bookOdds) {
        // Log available data for debugging
        console.log(`   📊 ${selection.player} data:`, {
          sid: bookOdds.sid,
          link: bookOdds.link,
          eventSid: bookOdds.eventSid,
          eventLink: bookOdds.eventLink,
          market: bookOdds.market
        })
        
        if (bookOdds.sid || bookOdds.link) {
          legs.push({
            eventId: selection.gameId,
            sid: bookOdds.sid,
            link: bookOdds.link,
            eventSid: bookOdds.eventSid,
            eventLink: bookOdds.eventLink,
            marketId: bookOdds.market,
            selectionId: bookOdds.sid // Some books use sid as selectionId
          })
          console.log(`   ✅ Added ${selection.player} to parlay`)
        } else {
          console.log(`   ❌ ${selection.player}: No SID or link available`)
          hasAllSelections = false
          break
        }
      } else {
        console.log(`   ❌ ${selection.player}: No odds available`)
        hasAllSelections = false
        break
      }
    }
    
    if (hasAllSelections && legs.length > 0) {
      try {
        const linkParams: SportsbookLinkParams = {
          legs,
          state: 'nj' // Default state, could be parameterized
        }
        
        const parlayUrl = generateSportsbookUrl(sportsbook, linkParams)
        parlayLinks[sportsbook] = parlayUrl
        console.log(`   🎯 Generated parlay link: ${parlayUrl}`)
      } catch (error) {
        console.error(`   ❌ Error generating ${sportsbook} parlay link:`, error)
        parlayLinks[sportsbook] = null
      }
    } else {
      console.log(`   ⚠️ Cannot generate parlay link - missing data for some selections`)
      parlayLinks[sportsbook] = null
    }
  }
  
  return parlayLinks
}

export async function POST(request: NextRequest) {
  try {
    const body: OddsLookupRequest = await request.json()
    const { selections, sport, date = new Date().toISOString().split('T')[0], includeSids = false, includeLinks = false } = body

    console.log(`\n🎯 === ODDS LOOKUP REQUEST ===`)
    console.log(`📅 Date: ${date}`)
    console.log(`🏈 Sport: ${sport}`)
    console.log(`📊 Selections received:`)
    selections.forEach((selection, index) => {
      console.log(`  ${index + 1}. Player: "${selection.player}" | Market: ${selection.market} | Line: ${selection.line} | Type: ${selection.betType}`)
    })
    console.log(`📎 Include SIDs: ${includeSids}`)
    console.log(`🔗 Include Links: ${includeLinks}`)
    console.log(`=================================\n`)

    if (!selections || selections.length === 0) {
      return NextResponse.json({ error: 'No selections provided' }, { status: 400 })
    }
    
    // Get current date if not provided
    const lookupDate = date || new Date().toISOString().split('T')[0]
    
    console.log(`Looking up games for ${sport} on ${lookupDate}`)
    
    // Get games directly from The Odds API instead of Redis
    const games = await fetchTodaysGames(sport, lookupDate)
    
    if (!games || Object.keys(games).length === 0) {
      console.log(`No games found for ${sport} on ${lookupDate}`)
      return NextResponse.json({ 
        enrichedSelections: selections.map(s => ({ ...s, matchConfidence: 0 })),
        message: 'No games found for the specified date'
      })
    }
    
    console.log(`Found ${Object.keys(games).length} games for matching`)
    
    // Enrich selections with game matches and current odds
    const enrichedSelections: EnrichedSelection[] = []
    
    for (const selection of selections) {
      const enriched: EnrichedSelection = { ...selection }
      
      // Find matching game
      const match = findMatchingGame(selection, games)
      if (match) {
        enriched.gameId = match.gameId
        enriched.matchConfidence = match.confidence
        
        console.log(`Matched ${selection.player} to game ${match.gameId} with confidence ${match.confidence}`)
        
        // Fetch current odds for this game and market
        if (selection.market && selection.player) {
          const apiResponse = await fetchCurrentOdds(match.gameId, selection.market, includeSids, includeLinks)
          if (apiResponse) {
            // Extract player-specific odds from the API response
            const playerOdds = extractPlayerOdds(apiResponse, selection.player, selection.market, selection.line, includeSids, includeLinks)
            enriched.currentOdds = playerOdds
            
            // Log summary of found odds
            if (playerOdds) {
              const sportsbooksWithOdds = Object.keys(playerOdds)
              console.log(`🎯 Found odds for ${selection.player} at ${sportsbooksWithOdds.length} sportsbooks: ${sportsbooksWithOdds.join(', ')}`)
            }
          }
        }
      } else {
        enriched.matchConfidence = 0
        console.log(`No game match found for ${selection.player}`)
      }
      
      enrichedSelections.push(enriched)
    }
    
    // Calculate parlay odds across all sportsbooks
    const parlayComparison = calculateParlayComparison(enrichedSelections)
    
    // Generate parlay links for sportsbooks that support deep linking
    const parlayLinks = generateParlayLinks(enrichedSelections, includeLinks)
    
    return NextResponse.json({
      enrichedSelections,
      gamesFound: Object.keys(games).length,
      matchedSelections: enrichedSelections.filter(s => s.gameId).length,
      parlayComparison,
      parlayLinks
    })
    
  } catch (error) {
    console.error('Error in odds lookup:', error)
    return NextResponse.json(
      { error: 'Failed to lookup odds' },
      { status: 500 }
    )
  }
} 