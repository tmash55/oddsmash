import { createClient } from "@/libs/supabase/server"
import { NextResponse } from "next/server"

// Helper function to normalize player names for fuzzy matching
function normalizePlayerName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

// Helper function to remove common suffixes
function removeSuffixes(name: string): string {
  const suffixes = ['jr', 'sr', 'ii', 'iii', 'iv', 'v']
  const words = name.split(' ')
  
  // Remove suffix if it's the last word and matches our list
  if (words.length >= 2 && suffixes.includes(words[words.length - 1].toLowerCase())) {
    return words.slice(0, -1).join(' ')
  }
  
  return name
}

// Helper function to calculate string similarity (Levenshtein-based)
function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length
  
  if (len1 === 0) return len2 === 0 ? 1 : 0
  if (len2 === 0) return 0
  
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(null))
  
  for (let i = 0; i <= len1; i++) matrix[i][0] = i
  for (let j = 0; j <= len2; j++) matrix[0][j] = j
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // deletion
        matrix[i][j - 1] + 1,     // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }
  
  const maxLen = Math.max(len1, len2)
  return (maxLen - matrix[len1][len2]) / maxLen
}

// Helper function to create name variations for fuzzy matching
function createNameVariations(playerName: string): string[] {
  const variations = new Set<string>()
  
  // Original name
  variations.add(playerName)
  
  // Normalized version
  const normalized = normalizePlayerName(playerName)
  variations.add(normalized)
  
  // Without suffixes
  const withoutSuffix = removeSuffixes(normalized)
  if (withoutSuffix !== normalized) {
    variations.add(withoutSuffix)
  }
  
  // First and last name only (for names with middle names/initials)
  const words = normalized.split(' ')
  if (words.length > 2) {
    variations.add(`${words[0]} ${words[words.length - 1]}`)
  }
  
  // Remove middle initials (e.g., "John A. Smith" -> "John Smith")
  const withoutInitials = normalized.replace(/\s+[a-z]\s+/g, ' ').replace(/\s+/g, ' ')
  if (withoutInitials !== normalized) {
    variations.add(withoutInitials)
  }
  
  return Array.from(variations)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport")?.toLowerCase() || "mlb"
    const market = searchParams.get("market") || "hits"
    const playerName = searchParams.get("playerName")

    if (!playerName) {
      return NextResponse.json(
        { error: "Player name is required" },
        { status: 400 }
      )
    }

    console.log(`[PLAYER HIT RATE API] Request received - Sport: ${sport}, Market: "${market}", Player: "${playerName}"`)

    const supabase = createClient()

    // First try exact match (case-insensitive)
    console.log(`[FUZZY MATCH] Trying exact match for: "${playerName}"`)
    let { data, error } = await supabase
      .from("player_hit_rate_profiles")
      .select("*")
      .eq("league_id", 1) // MLB
      .ilike("player_name", playerName.trim())
      .ilike("market", market.trim())
      .maybeSingle()

    if (error) {
      console.error("[PLAYER HIT RATE API] Database error:", error)
      return NextResponse.json(
        { error: "Database error: " + error.message },
        { status: 500 }
      )
    }

    if (data) {
      console.log(`[FUZZY MATCH] ✅ Exact match found: ${data.player_name}`)
      return NextResponse.json({ profile: data })
    }

    // If no exact match, try fuzzy matching
    console.log(`[FUZZY MATCH] No exact match, trying fuzzy matching...`)
    
    // Get all players for the market to perform fuzzy matching
    const { data: allPlayers, error: allPlayersError } = await supabase
      .from("player_hit_rate_profiles")
      .select("*")
      .eq("league_id", 1)
      .ilike("market", market.trim())

    if (allPlayersError) {
      console.error("[PLAYER HIT RATE API] Error fetching all players:", allPlayersError)
      return NextResponse.json(
        { error: "Database error: " + allPlayersError.message },
        { status: 500 }
      )
    }

    if (!allPlayers || allPlayers.length === 0) {
      console.log(`[FUZZY MATCH] No players found for market: "${market}"`)
      return NextResponse.json(
        { error: "No players found for this market" },
        { status: 404 }
      )
    }

    console.log(`[FUZZY MATCH] Found ${allPlayers.length} players in database for market "${market}"`)

    // Create variations of the search name
    const searchVariations = createNameVariations(playerName)
    console.log(`[FUZZY MATCH] Search variations: ${searchVariations.join(', ')}`)

    let bestMatch = null
    let bestScore = 0
    const minSimilarity = 0.7 // Minimum similarity threshold

    // Try fuzzy matching against all players
    for (const player of allPlayers) {
      const dbPlayerVariations = createNameVariations(player.player_name)
      
      // Compare each search variation against each database variation
      for (const searchVar of searchVariations) {
        for (const dbVar of dbPlayerVariations) {
          const similarity = calculateSimilarity(searchVar, dbVar)
          
          if (similarity > bestScore && similarity >= minSimilarity) {
            bestScore = similarity
            bestMatch = player
            console.log(`[FUZZY MATCH] New best match: "${player.player_name}" (${(similarity * 100).toFixed(1)}%) - "${searchVar}" vs "${dbVar}"`)
          }
        }
      }
    }

    if (bestMatch) {
      console.log(`[FUZZY MATCH] ✅ Fuzzy match found: "${bestMatch.player_name}" with ${(bestScore * 100).toFixed(1)}% similarity`)
      return NextResponse.json({ profile: bestMatch })
    }

    console.log(`[FUZZY MATCH] ❌ No confident matches found for player "${playerName}" (best score: ${(bestScore * 100).toFixed(1)}%)`)
    return NextResponse.json(
      { error: "Player not found" },
      { status: 404 }
    )

  } catch (error) {
    console.error("[PLAYER HIT RATE API] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}