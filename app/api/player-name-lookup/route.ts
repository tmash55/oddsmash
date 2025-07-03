import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/libs/supabase/server"
import { 
  PlayerNameLookup, 
  PlayerNameLookupCreate, 
  PlayerMatchResult,
  calculateNameSimilarity,
  generateNameVariations 
} from "@/types/player-lookup"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const oddsName = searchParams.get("odds_name")
    const sport = searchParams.get("sport") || "mlb"
    const status = searchParams.get("status")
    const needsReview = searchParams.get("needs_review") === "true"
    
    if (oddsName) {
      // Look up a specific player name
      const result = await lookupPlayerName(oddsName, sport)
      return NextResponse.json(result)
    }
    
    // Get all lookups with optional filters
    let query = supabase
      .from("player_name_lookup")
      .select("*")
      .eq("sport", sport)
      .order("created_at", { ascending: false })
    
    if (status) {
      query = query.eq("match_status", status)
    }
    
    if (needsReview) {
      query = query.in("match_status", ["pending", "manual_review"])
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error("Error fetching player name lookups:", error)
      return NextResponse.json({ error: "Failed to fetch lookups" }, { status: 500 })
    }
    
    return NextResponse.json({ data })
    
  } catch (error) {
    console.error("Error in player name lookup API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body: PlayerNameLookupCreate = await request.json()
    
    const { data, error } = await supabase
      .from("player_name_lookup")
      .insert([{
        odds_name: body.odds_name,
        matched_name: body.matched_name || null,
        player_id: body.player_id || null,
        confidence_score: body.confidence_score || 0,
        match_status: body.match_status || 'pending',
        sport: body.sport || 'mlb',
        team_name: body.team_name || null,
        position: body.position || null
      }])
      .select()
      .single()
    
    if (error) {
      console.error("Error creating player name lookup:", error)
      return NextResponse.json({ error: "Failed to create lookup" }, { status: 500 })
    }
    
    return NextResponse.json({ data })
    
  } catch (error) {
    console.error("Error in player name lookup POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 })
    }
    
    const body = await request.json()
    
    const { data, error } = await supabase
      .from("player_name_lookup")
      .update({
        ...body,
        last_matched_at: body.match_status === 'matched' ? new Date().toISOString() : undefined
      })
      .eq("id", id)
      .select()
      .single()
    
    if (error) {
      console.error("Error updating player name lookup:", error)
      return NextResponse.json({ error: "Failed to update lookup" }, { status: 500 })
    }
    
    return NextResponse.json({ data })
    
  } catch (error) {
    console.error("Error in player name lookup PUT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Main function to lookup a player name
async function lookupPlayerName(oddsName: string, sport: string = "mlb"): Promise<PlayerMatchResult> {
  const supabase = createClient()
  
  try {
    // First, check if we already have this name in our lookup table
    const { data: existingLookup, error: lookupError } = await supabase
      .from("player_name_lookup")
      .select("*")
      .eq("odds_name", oddsName)
      .eq("sport", sport)
      .single()
    
    if (!lookupError && existingLookup) {
      console.log(`✅ Found existing lookup for "${oddsName}"`)
      return {
        odds_name: oddsName,
        matched_name: existingLookup.matched_name,
        player_id: existingLookup.player_id,
        confidence_score: existingLookup.confidence_score,
        match_found: existingLookup.match_status === 'matched',
        source: 'lookup_table'
      }
    }
    
    console.log(`🔍 No existing lookup for "${oddsName}", attempting fuzzy match...`)
    
    // If not found, try fuzzy matching against our hit rate database
    const fuzzyMatch = await attemptFuzzyMatch(oddsName, sport)
    
    if (fuzzyMatch.match_found) {
      // Save the successful match to our lookup table
      await supabase
        .from("player_name_lookup")
        .insert([{
          odds_name: oddsName,
          matched_name: fuzzyMatch.matched_name,
          player_id: fuzzyMatch.player_id,
          confidence_score: fuzzyMatch.confidence_score,
          match_status: fuzzyMatch.confidence_score >= 85 ? 'matched' : 'manual_review',
          sport: sport
        }])
      
      console.log(`✅ Created new lookup entry for "${oddsName}" -> "${fuzzyMatch.matched_name}"`)
    } else {
      // Save as unmatched for manual review
      await supabase
        .from("player_name_lookup")
        .insert([{
          odds_name: oddsName,
          matched_name: null,
          player_id: null,
          confidence_score: 0,
          match_status: 'manual_review',
          sport: sport
        }])
      
      console.log(`❌ No match found for "${oddsName}", saved for manual review`)
    }
    
    return fuzzyMatch
    
  } catch (error) {
    console.error(`Error looking up player name "${oddsName}":`, error)
    return {
      odds_name: oddsName,
      matched_name: null,
      player_id: null,
      confidence_score: 0,
      match_found: false,
      source: 'fuzzy_match'
    }
  }
}

// Attempt fuzzy matching against hit rate database
async function attemptFuzzyMatch(oddsName: string, sport: string): Promise<PlayerMatchResult> {
  const supabase = createClient()
  
  try {
    // Get all player names from hit rate profiles
    const { data: players, error } = await supabase
      .from("player_hit_rate_profiles")
      .select("player_id, player_name")
      .limit(1000) // Reasonable limit for fuzzy matching
    
    if (error || !players) {
      console.error("Error fetching players for fuzzy match:", error)
      return {
        odds_name: oddsName,
        matched_name: null,
        player_id: null,
        confidence_score: 0,
        match_found: false,
        source: 'fuzzy_match'
      }
    }
    
    // Generate variations of the odds name
    const nameVariations = generateNameVariations(oddsName)
    
    let bestMatch: { player_id: number; player_name: string; score: number } | null = null
    
    // Check each variation against each player
    for (const variation of nameVariations) {
      for (const player of players) {
        const score = calculateNameSimilarity(variation, player.player_name)
        
        if (score > (bestMatch?.score || 0)) {
          bestMatch = {
            player_id: player.player_id,
            player_name: player.player_name,
            score
          }
        }
      }
    }
    
    // Consider it a match if confidence is high enough
    const isMatch = bestMatch && bestMatch.score >= 75
    
    return {
      odds_name: oddsName,
      matched_name: bestMatch?.player_name || null,
      player_id: bestMatch?.player_id || null,
      confidence_score: bestMatch?.score || 0,
      match_found: isMatch || false,
      source: 'fuzzy_match'
    }
    
  } catch (error) {
    console.error("Error in fuzzy matching:", error)
    return {
      odds_name: oddsName,
      matched_name: null,
      player_id: null,
      confidence_score: 0,
      match_found: false,
      source: 'fuzzy_match'
    }
  }
} 