import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/libs/supabase/server'
import { sportsbooks } from '@/data/sportsbooks'
import { getMarketsForSport, type SportMarket } from '@/lib/constants/markets'

// Types for the API response
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
  outcomes: Outcome[]
}

interface Bookmaker {
  key: string
  title: string
  last_update: string
  markets: Market[]
}

interface OddsResponse {
  id: string
  sport_key: string
  sport_title: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers: Bookmaker[]
}

// Type for the current odds metadata
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

// Enhanced player name matching with fuzzy logic
function normalizePlayerName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.,\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractPlayerNameVariations(playerName: string): string[] {
  const normalized = normalizePlayerName(playerName)
  const variations = [normalized]
  
  // Split by spaces to handle "First Last" cases
  const parts = normalized.split(' ')
  
  if (parts.length >= 2) {
    // Add "Last, First" format
    variations.push(`${parts[parts.length - 1]} ${parts[0]}`)
    
    // Add "F. Last" format (first initial)
    variations.push(`${parts[0][0]} ${parts[parts.length - 1]}`)
    
    // Add "First L." format (last initial)
    variations.push(`${parts[0]} ${parts[parts.length - 1][0]}`)
    
    // NOTE: Removed individual first/last name matching as it's too permissive
    // This was causing "Kyle" to match both "Kyle Schwarber" and "Kyle Stowers"
  }
  
  return variations
}

function calculateNameSimilarity(target: string, candidate: string): number {
  const targetNorm = normalizePlayerName(target)
  const candidateNorm = normalizePlayerName(candidate)
  
  // Add debug logging for specific problematic cases
  const isLourdesCase = targetNorm.includes('lourdes') || candidateNorm.includes('lourdes')
  if (isLourdesCase) {
    console.log(`🔍 REFRESH DEBUG: Comparing "${target}" vs "${candidate}"`)
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

function findPlayerInOutcomes(playerName: string, outcomes: Outcome[]): Outcome[] {
  const playerVariations = extractPlayerNameVariations(playerName)
  const candidateMatches: { outcome: Outcome; score: number }[] = []
  
  for (const outcome of outcomes) {
    if (!outcome.description) continue
    
    // Calculate similarity scores for all variations
    let bestScore = 0
    for (const variation of playerVariations) {
      const score = calculateNameSimilarity(variation, outcome.description)
      bestScore = Math.max(bestScore, score)
    }
    
    // Also try the original player name directly
    const directScore = calculateNameSimilarity(playerName, outcome.description)
    bestScore = Math.max(bestScore, directScore)
    
    // Only consider matches with a reasonable similarity score
    if (bestScore >= 0.7) { // Require at least 70% confidence
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
    
    // Only return the best match(es) if they're significantly better than others
    const bestScore = candidateMatches[0].score
    const topMatches = candidateMatches.filter(m => m.score >= bestScore - 0.1) // Within 10% of best
    
    // If we have multiple perfect matches (like different lines for same player), return all of them
    if (bestScore >= 0.9 && topMatches.length > 1) {
      console.log(`✅ Returning ${topMatches.length} high-confidence matches for line searching`)
      return topMatches.map(m => m.outcome)
    }
    // If we have one clear best match or ambiguous matches
    else if (topMatches.length === 1 || bestScore >= 0.9) {
      // Return only the best match if it's clearly the best or very confident
      return [candidateMatches[0].outcome]
    } else {
      // Return top matches if there's ambiguity
      return topMatches.map(m => m.outcome)
    }
  }
  
  console.log(`❌ No confident matches found for player "${playerName}"`)
  return []
}

function findMatchingOutcome(
  playerName: string, 
  line: number, 
  betType: string, 
  outcomes: Outcome[]
): Outcome | null {
  const playerOutcomes = findPlayerInOutcomes(playerName, outcomes)
  
  if (playerOutcomes.length === 0) {
    return null
  }
  
  console.log(`🔍 Found ${playerOutcomes.length} player outcome(s) for "${playerName}"`)
  
  // Find outcome with matching line and bet type
  const targetName = betType.toLowerCase() === 'over' ? 'Over' : 'Under'
  
  // First try exact match
  for (const outcome of playerOutcomes) {
    if (outcome.name === targetName && outcome.point === line) {
      console.log(`✅ Exact match: ${outcome.description} ${outcome.name} ${outcome.point} @ ${outcome.price}`)
      return outcome
    }
  }
  
  // Special handling for strikeouts: if we're looking for whole number (6), also try +0.5 (6.5)
  const isStrikeoutMarket = playerOutcomes.some(o => 
    o.description?.toLowerCase().includes('strikeout') || 
    o.description?.toLowerCase().includes('so') ||
    o.description?.toLowerCase().includes('k')
  )
  
  if (isStrikeoutMarket) {
    // If we have a whole number (6), try -0.5 (5.5) because "6+" means "Over 5.5"
    if (Number.isInteger(line)) {
      console.log(`🎯 Strikeout market detected - trying line conversion: ${line}+ -> Over ${line - 0.5}`)
      for (const outcome of playerOutcomes) {
        if (outcome.name === targetName && outcome.point === line - 0.5) {
          console.log(`✅ Strikeout conversion match: ${outcome.description} ${outcome.name} ${outcome.point} @ ${outcome.price}`)
          return outcome
        }
      }
    }
    // If we have a half number (5.5), try +0.5 (6) because API "Over 5.5" = sportsbook "6+"
    else if (line % 1 === 0.5) {
      console.log(`🎯 Strikeout market detected - trying line conversion: Over ${line} -> ${line + 0.5}+`)
      for (const outcome of playerOutcomes) {
        if (outcome.name === targetName && outcome.point === line + 0.5) {
          console.log(`✅ Strikeout reverse conversion match: ${outcome.description} ${outcome.name} ${outcome.point} @ ${outcome.price}`)
          return outcome
        }
      }
    }
  }
  
  // If exact line not found, try to find closest line
  const sameTypeOutcomes = playerOutcomes.filter(o => o.name === targetName)
  if (sameTypeOutcomes.length > 0) {
    // Sort by how close the line is to what we want
    sameTypeOutcomes.sort((a, b) => {
      const diffA = Math.abs((a.point || 0) - line)
      const diffB = Math.abs((b.point || 0) - line)
      return diffA - diffB
    })
    
    // For strikeouts, allow up to 1.0 difference, for others keep 0.5
    const maxDifference = isStrikeoutMarket ? 1.0 : 0.5
    const closest = sameTypeOutcomes[0]
    if (Math.abs((closest.point || 0) - line) <= maxDifference) {
      console.log(`⚠️ Close match: ${closest.description} ${closest.name} ${closest.point} @ ${closest.price} (wanted line: ${line})`)
      return closest
    }
  }
  
  console.log(`❌ No suitable match found for "${playerName}" ${betType} ${line}`)
  return null
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          message: 'You must be signed in to refresh odds'
        },
        { status: 401 }
      )
    }

    const betslipId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(betslipId)) {
      return NextResponse.json(
        { error: 'Invalid betslip ID format' },
        { status: 400 }
      )
    }

    // Fetch betslip with selections
    const { data: betslip, error: betslipError } = await supabase
      .from('scanned_betslips')
      .select(`
        *,
        scanned_betslip_selections (*)
      `)
      .eq('id', betslipId)
      .single()

    if (betslipError || !betslip) {
      return NextResponse.json(
        { error: 'Betslip not found' },
        { status: 404 }
      )
    }

    // Check ownership
    if (betslip.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const selections = betslip.scanned_betslip_selections
    if (!selections || selections.length === 0) {
      return NextResponse.json(
        { error: 'No selections found in this betslip' },
        { status: 400 }
      )
    }

    console.log(`🔄 Refreshing odds for betslip ${betslipId} with ${selections.length} selections`)

    // Get API key
    const apiKey = process.env.ODDS_API_KEY
    if (!apiKey) {
      console.warn('ODDS_API_KEY not configured')
      return NextResponse.json(
        { error: 'Odds API not configured' },
        { status: 500 }
      )
    }

    // Get active sportsbooks
    const activeSportsbooks = sportsbooks
      .filter(book => book.isActive)
      .map(book => book.id)
    
    console.log(`📚 Using ${activeSportsbooks.length} active sportsbooks: ${activeSportsbooks.join(', ')}`)

    // Fetch fresh odds for each selection
    const refreshedSelections = []

    for (const selection of selections) {
      try {
        console.log(`\n🎯 Processing selection: ${selection.player_name} - ${selection.market} ${selection.bet_type} ${selection.line}`)
        
        if (!selection.event_id) {
          console.log(`⚠️ No event_id for selection ${selection.id}, skipping odds refresh`)
          refreshedSelections.push({
            ...selection,
            current_odds: { error: 'No event ID available' },
            odds_last_updated: new Date().toISOString()
          })
          continue
        }

        if (!selection.market_api_key) {
          console.log(`⚠️ No market_api_key for selection ${selection.id}, skipping odds refresh`)
          refreshedSelections.push({
            ...selection,
            current_odds: { error: 'No market API key available' },
            odds_last_updated: new Date().toISOString()
          })
          continue
        }

        // Determine which markets to fetch (standard + alternate if available)
        const marketsToFetch = [selection.market_api_key]
        
        // Check if this market has alternates and add them  
        const marketConfig: SportMarket | undefined = getMarketsForSport(selection.sport_api_key).find(m => m.apiKey === selection.market_api_key)
        if (marketConfig?.hasAlternates && marketConfig.alternateKey) {
          marketsToFetch.push(marketConfig.alternateKey)
          console.log(`📊 Including alternate market: ${marketConfig.alternateKey}`)
        }

        // Build API URL with all active sportsbooks and markets
        const oddsUrl = `https://api.the-odds-api.com/v4/sports/${selection.sport_api_key}/events/${selection.event_id}/odds`
        const params = new URLSearchParams({
          apiKey,
          regions: 'us',
          markets: marketsToFetch.join(','), // Fetch both standard and alternate markets
          oddsFormat: 'american',
          bookmakers: activeSportsbooks.join(','),
          includeSids: 'true',
          includeLinks: 'true'
        })

        console.log(`📞 API Call: ${oddsUrl}?${params.toString()}`)
        console.log(`📊 Fetching markets: ${marketsToFetch.join(', ')}`)
        
        const oddsResponse = await fetch(`${oddsUrl}?${params.toString()}`)

        if (!oddsResponse.ok) {
          console.error(`❌ Failed to fetch odds for ${selection.event_id}: ${oddsResponse.status}`)
          refreshedSelections.push({
            ...selection,
            current_odds: { error: `API error: ${oddsResponse.status}` },
            odds_last_updated: new Date().toISOString()
          })
          continue
        }

        const oddsData: OddsResponse = await oddsResponse.json()
        console.log(`✅ Fetched odds data with ${oddsData.bookmakers?.length || 0} bookmakers`)

        if (!oddsData.bookmakers || oddsData.bookmakers.length === 0) {
          console.log(`⚠️ No bookmakers data for ${selection.player_name}`)
          refreshedSelections.push({
            ...selection,
            current_odds: { error: 'No bookmakers available' },
            odds_last_updated: new Date().toISOString()
          })
          continue
        }

        // Find odds across all sportsbooks and markets
        const allBookmakerOdds: Record<string, any> = {}
        let bestOdds: number | null = null
        let bestBook: string | null = null
        let foundMatches = 0

        for (const bookmaker of oddsData.bookmakers) {
          // Look for the player across ALL markets (standard + alternate)
          const allOutcomes: Outcome[] = []
          
          for (const marketKey of marketsToFetch) {
            const market = bookmaker.markets.find(m => m.key === marketKey)
            if (market) {
              console.log(`📊 Found market ${marketKey} for ${bookmaker.key} with ${market.outcomes?.length || 0} outcomes`)
              allOutcomes.push(...(market.outcomes || []))
            } else {
              console.log(`⚠️ Market ${marketKey} not found for ${bookmaker.key}`)
            }
          }

          if (allOutcomes.length === 0) {
            console.log(`⚠️ No markets found for ${bookmaker.key}`)
            continue
          }

          // Find the specific player + line + bet type across all outcomes
          const matchingOutcome = findMatchingOutcome(
            selection.player_name,
            selection.line,
            selection.bet_type,
            allOutcomes
          )

          if (matchingOutcome) {
            foundMatches++
            console.log(`✅ Found match for ${selection.player_name} at ${bookmaker.key}: ${matchingOutcome.name} ${matchingOutcome.point} @ ${matchingOutcome.price}`)
            
            allBookmakerOdds[bookmaker.key] = {
              price: matchingOutcome.price,
              point: matchingOutcome.point,
              link: matchingOutcome.link || null,
              sid: matchingOutcome.sid || null,
              last_update: bookmaker.last_update
            }

            // Track best odds (highest for positive, closest to 0 for negative)
            if (bestOdds === null || 
                (matchingOutcome.price > 0 && matchingOutcome.price > bestOdds) ||
                (matchingOutcome.price < 0 && bestOdds < 0 && matchingOutcome.price > bestOdds)) {
              bestOdds = matchingOutcome.price
              bestBook = bookmaker.key
            }
          } else {
            console.log(`❌ No match found for ${selection.player_name} ${selection.bet_type} ${selection.line} at ${bookmaker.key}`)
          }
        }

        // Create comprehensive odds object
        const currentOdds = {
          bookmakers: allBookmakerOdds,
          metadata: {
            matches_found: foundMatches,
            total_bookmakers: oddsData.bookmakers.length,
            best_odds: bestOdds,
            best_book: bestBook,
            player_searched: selection.player_name,
            line_searched: selection.line,
            bet_type_searched: selection.bet_type,
            market_searched: marketsToFetch.join(','), // Include all markets searched
            last_updated: new Date().toISOString()
          } as OddsMetadata
        }

        if (foundMatches === 0) {
          console.log(`⚠️ No matches found for ${selection.player_name} across any sportsbooks`)
          currentOdds.metadata.error = 'Player/line combination not found in any sportsbook'
        } else {
          console.log(`✅ Found ${foundMatches} matches for ${selection.player_name}`)
        }

        const updatedSelection = {
          ...selection,
          current_odds: currentOdds,
          odds_last_updated: new Date().toISOString()
        }

        refreshedSelections.push(updatedSelection)

      } catch (error) {
        console.error(`❌ Error refreshing odds for selection ${selection.id}:`, error)
        refreshedSelections.push({
          ...selection,
          current_odds: { 
            error: 'Error fetching odds',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          odds_last_updated: new Date().toISOString()
        })
      }
    }

    // Update the database with fresh odds
    console.log(`\n💾 Updating database with ${refreshedSelections.length} selections`)
    for (const selection of refreshedSelections) {
      await supabase
        .from('scanned_betslip_selections')
        .update({
          current_odds: selection.current_odds,
          updated_at: new Date().toISOString()
        })
        .eq('id', selection.id)
    }

    // Update the betslip's last refresh time
    await supabase
      .from('scanned_betslips')
      .update({
        last_odds_refresh: new Date().toISOString()
      })
      .eq('id', betslipId)

    console.log(`✅ Successfully refreshed odds for betslip ${betslipId}`)

    return NextResponse.json({
      success: true,
      data: {
        betslipId,
        selectionsUpdated: refreshedSelections.length,
        lastRefresh: new Date().toISOString(),
        selections: refreshedSelections,
        summary: {
          total_selections: refreshedSelections.length,
          successful_refreshes: refreshedSelections.filter(s => 
            s.current_odds.metadata?.matches_found > 0
          ).length,
          failed_refreshes: refreshedSelections.filter(s => 
            s.current_odds.error || s.current_odds.metadata?.matches_found === 0
          ).length
        }
      }
    })

  } catch (error) {
    console.error('❌ Error in POST /api/betslip-scanner/[id]/refresh:', error)
    return NextResponse.json(
      { 
        error: 'Failed to refresh odds',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 