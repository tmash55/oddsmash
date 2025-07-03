import { createClient } from '@/libs/supabase/server'
import type { 
  PlayerNameLookup, 
  PlayerNameLookupCreate, 
  PlayerNameLookupUpdate,
  PlayerMatchResult,
  NameSimilarity 
} from '@/types/player-lookup'

/**
 * Enhanced player name matching service that uses lookup table for performance
 */
export class PlayerNameMatchingService {
  private static instance: PlayerNameMatchingService
  private cache: Map<string, PlayerMatchResult> = new Map()
  
  static getInstance(): PlayerNameMatchingService {
    if (!PlayerNameMatchingService.instance) {
      PlayerNameMatchingService.instance = new PlayerNameMatchingService()
    }
    return PlayerNameMatchingService.instance
  }
  
  private supabase = createClient()

  /**
   * Main method to match a player name from odds API to our database
   */
  async matchPlayerName(oddsName: string, sport: string = "mlb"): Promise<PlayerMatchResult> {
    const cacheKey = `${sport}:${oddsName.toLowerCase()}`
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }
    
    try {
      const response = await fetch(`/api/player-name-lookup?odds_name=${encodeURIComponent(oddsName)}&sport=${sport}`)
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }
      
      const result: PlayerMatchResult = await response.json()
      
      // Cache successful matches
      if (result.match_found) {
        this.cache.set(cacheKey, result)
      }
      
      return result
      
    } catch (error) {
      console.error(`Error matching player name "${oddsName}":`, error)
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
  
  /**
   * Batch match multiple player names for efficiency
   */
  async batchMatchPlayerNames(oddsNames: string[], sport: string = "mlb"): Promise<Record<string, PlayerMatchResult>> {
    const results: Record<string, PlayerMatchResult> = {}
    
    // Process in parallel but with some rate limiting
    const batchSize = 10
    for (let i = 0; i < oddsNames.length; i += batchSize) {
      const batch = oddsNames.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (name) => {
        const result = await this.matchPlayerName(name, sport)
        results[name] = result
        return result
      })
      
      await Promise.all(batchPromises)
      
      // Small delay between batches to avoid overwhelming the API
      if (i + batchSize < oddsNames.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    return results
  }
  
  /**
   * Get all unmatched names that need manual review
   */
  async getUnmatchedNames(sport: string = "mlb"): Promise<PlayerNameLookup[]> {
    try {
      const response = await fetch(`/api/player-name-lookup?needs_review=true&sport=${sport}`)
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }
      
      const { data } = await response.json()
      return data || []
      
    } catch (error) {
      console.error("Error fetching unmatched names:", error)
      return []
    }
  }
  
  /**
   * Manually create or update a player name mapping
   */
  async createManualMapping(
    oddsName: string, 
    matchedName: string, 
    playerId: number, 
    sport: string = "mlb"
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/player-name-lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          odds_name: oddsName,
          matched_name: matchedName,
          player_id: playerId,
          confidence_score: 100, // Manual matches get 100% confidence
          match_status: 'matched',
          sport: sport
        })
      })
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }
      
      // Update cache
      const cacheKey = `${sport}:${oddsName.toLowerCase()}`
      this.cache.set(cacheKey, {
        odds_name: oddsName,
        matched_name: matchedName,
        player_id: playerId,
        confidence_score: 100,
        match_found: true,
        source: 'manual'
      })
      
      return true
      
    } catch (error) {
      console.error("Error creating manual mapping:", error)
      return false
    }
  }
  
  /**
   * Clear the cache (useful after manual updates)
   */
  clearCache(): void {
    this.cache.clear()
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }

  /**
   * Find a player match using the lookup table first, then fallback to fuzzy matching
   */
  async findPlayerMatch(
    oddsName: string, 
    sport: string = 'mlb',
    teamName?: string
  ): Promise<PlayerMatchResult> {
    // Step 1: Check if we already have this player in our lookup table
    const existingLookup = await this.getLookupByOddsName(oddsName, sport)
    
    if (existingLookup) {
      if (existingLookup.match_status === 'matched' && existingLookup.player_id) {
        return {
          found: true,
          lookup: existingLookup,
          confidence: existingLookup.confidence_score,
          matched_player_id: existingLookup.player_id,
          matched_name: existingLookup.matched_name || undefined
        }
      }
      
      if (existingLookup.match_status === 'no_match') {
        return {
          found: false,
          lookup: existingLookup,
          confidence: 0
        }
      }
    }

    // Step 2: If not in lookup table, try to find a fuzzy match
    const fuzzyMatch = await this.findFuzzyMatch(oddsName, sport, teamName)
    
    if (fuzzyMatch) {
      // Step 3: Create or update lookup table entry with the match
      const lookupData: PlayerNameLookupCreate = {
        odds_name: oddsName,
        matched_name: fuzzyMatch.matched_name,
        player_id: fuzzyMatch.matched_player_id,
        confidence_score: fuzzyMatch.confidence,
        match_status: fuzzyMatch.confidence >= 80 ? 'matched' : 'manual_review',
        sport,
        team_name: teamName
      }

      const lookup = await this.createOrUpdateLookup(lookupData)
      
      return {
        found: fuzzyMatch.confidence >= 80,
        lookup,
        confidence: fuzzyMatch.confidence,
        matched_player_id: fuzzyMatch.matched_player_id,
        matched_name: fuzzyMatch.matched_name
      }
    }

    // Step 4: No match found, create pending entry for manual review
    const lookupData: PlayerNameLookupCreate = {
      odds_name: oddsName,
      confidence_score: 0,
      match_status: 'pending',
      sport,
      team_name: teamName
    }

    const lookup = await this.createOrUpdateLookup(lookupData)

    return {
      found: false,
      lookup,
      confidence: 0
    }
  }

  /**
   * Get lookup entry by odds name
   */
  async getLookupByOddsName(oddsName: string, sport: string): Promise<PlayerNameLookup | null> {
    const { data, error } = await this.supabase
      .from('player_name_lookup')
      .select('*')
      .eq('odds_name', oddsName)
      .eq('sport', sport)
      .single()

    if (error) {
      console.log(`No existing lookup found for "${oddsName}"`)
      return null
    }

    return data
  }

  /**
   * Create or update lookup entry
   */
  async createOrUpdateLookup(lookupData: PlayerNameLookupCreate): Promise<PlayerNameLookup> {
    const existing = await this.getLookupByOddsName(lookupData.odds_name, lookupData.sport || 'mlb')
    
    if (existing) {
      // Update existing entry
      const updateData: PlayerNameLookupUpdate = {
        matched_name: lookupData.matched_name,
        player_id: lookupData.player_id,
        confidence_score: lookupData.confidence_score,
        match_status: lookupData.match_status,
        team_name: lookupData.team_name
      }

      const { data, error } = await this.supabase
        .from('player_name_lookup')
        .update({
          ...updateData,
          last_matched_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // Create new entry
      const { data, error } = await this.supabase
        .from('player_name_lookup')
        .insert(lookupData)
        .select()
        .single()

      if (error) throw error
      return data
    }
  }

  /**
   * Find fuzzy match by searching hit rate profiles
   */
  async findFuzzyMatch(
    oddsName: string, 
    sport: string, 
    teamName?: string
  ): Promise<PlayerMatchResult | null> {
    // Get all player names from hit rate profiles
    const { data: players, error } = await this.supabase
      .from('player_hit_rate_profiles')
      .select('player_id, player_name, team_abbreviation')
      .eq('league_id', sport === 'mlb' ? 1 : 2) // Assuming 1 = MLB, 2 = NBA, etc.

    if (error || !players) {
      console.error('Error fetching players for fuzzy matching:', error)
      return null
    }

    const similarities = players.map(player => ({
      player,
      similarity: this.calculateSimilarity(oddsName, player.player_name)
    }))

    // Sort by similarity score (highest first)
    similarities.sort((a, b) => b.similarity.score - a.similarity.score)

    const bestMatch = similarities[0]
    
    if (bestMatch && bestMatch.similarity.score >= 70) {
      return {
        found: true,
        confidence: bestMatch.similarity.score,
        matched_player_id: bestMatch.player.player_id,
        matched_name: bestMatch.player.player_name
      }
    }

    return null
  }

  /**
   * Calculate similarity between two names using multiple algorithms
   */
  calculateSimilarity(name1: string, name2: string): NameSimilarity {
    const clean1 = this.cleanName(name1)
    const clean2 = this.cleanName(name2)

    // Exact match
    if (clean1 === clean2) {
      return { original: name1, candidate: name2, score: 100, method: 'exact' }
    }

    // Try removing common suffixes/prefixes
    const variations1 = this.getNameVariations(clean1)
    const variations2 = this.getNameVariations(clean2)

    for (const var1 of variations1) {
      for (const var2 of variations2) {
        if (var1 === var2) {
          return { original: name1, candidate: name2, score: 95, method: 'substring' }
        }
      }
    }

    // Levenshtein distance
    const levenshteinScore = this.levenshteinSimilarity(clean1, clean2)
    
    // Jaro-Winkler similarity (better for names)
    const jaroWinklerScore = this.jaroWinklerSimilarity(clean1, clean2)

    // Take the best score
    const bestScore = Math.max(levenshteinScore, jaroWinklerScore)

    return { 
      original: name1, 
      candidate: name2, 
      score: Math.round(bestScore), 
      method: 'fuzzy' 
    }
  }

  /**
   * Clean and normalize name for comparison
   */
  private cleanName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[.\-']/g, ' ') // Replace dots, hyphens, apostrophes with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }

  /**
   * Generate name variations by removing common suffixes/prefixes
   */
  private getNameVariations(name: string): string[] {
    const variations = [name]
    
    // Remove common suffixes
    const suffixes = [' jr', ' sr', ' ii', ' iii', ' iv', ' v']
    suffixes.forEach(suffix => {
      if (name.endsWith(suffix)) {
        variations.push(name.slice(0, -suffix.length).trim())
      }
    })

    // Remove middle names/initials
    const parts = name.split(' ')
    if (parts.length > 2) {
      variations.push(`${parts[0]} ${parts[parts.length - 1]}`) // First + Last only
    }

    return [...new Set(variations)] // Remove duplicates
  }

  /**
   * Calculate Levenshtein distance similarity
   */
  private levenshteinSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1, str2)
    const maxLength = Math.max(str1.length, str2.length)
    return maxLength === 0 ? 100 : ((maxLength - distance) / maxLength) * 100
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        )
      }
    }

    return matrix[str2.length][str1.length]
  }

  /**
   * Calculate Jaro-Winkler similarity (better for names)
   */
  private jaroWinklerSimilarity(str1: string, str2: string): number {
    const jaroScore = this.jaroSimilarity(str1, str2)
    
    if (jaroScore < 0.7) return jaroScore * 100

    // Calculate common prefix length (up to 4 characters)
    let prefixLength = 0
    const maxPrefix = Math.min(4, Math.min(str1.length, str2.length))
    
    for (let i = 0; i < maxPrefix; i++) {
      if (str1[i] === str2[i]) {
        prefixLength++
      } else {
        break
      }
    }

    return (jaroScore + (0.1 * prefixLength * (1 - jaroScore))) * 100
  }

  /**
   * Calculate Jaro similarity
   */
  private jaroSimilarity(str1: string, str2: string): number {
    const len1 = str1.length
    const len2 = str2.length

    if (len1 === 0 && len2 === 0) return 1
    if (len1 === 0 || len2 === 0) return 0

    const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1
    if (matchWindow < 0) return 0

    const str1Matches = new Array(len1).fill(false)
    const str2Matches = new Array(len2).fill(false)

    let matches = 0
    let transpositions = 0

    // Identify matches
    for (let i = 0; i < len1; i++) {
      const start = Math.max(0, i - matchWindow)
      const end = Math.min(i + matchWindow + 1, len2)

      for (let j = start; j < end; j++) {
        if (str2Matches[j] || str1[i] !== str2[j]) continue
        str1Matches[i] = true
        str2Matches[j] = true
        matches++
        break
      }
    }

    if (matches === 0) return 0

    // Count transpositions
    let k = 0
    for (let i = 0; i < len1; i++) {
      if (!str1Matches[i]) continue
      while (!str2Matches[k]) k++
      if (str1[i] !== str2[k]) transpositions++
      k++
    }

    return (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3
  }

  /**
   * Get all pending matches for manual review
   */
  async getPendingMatches(sport: string = 'mlb'): Promise<PlayerNameLookup[]> {
    const { data, error } = await this.supabase
      .from('player_name_lookup')
      .select('*')
      .eq('sport', sport)
      .in('match_status', ['pending', 'manual_review'])
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Manually approve a match
   */
  async approveMatch(
    lookupId: string, 
    playerId: number, 
    matchedName: string, 
    confidence: number = 100
  ): Promise<PlayerNameLookup> {
    const { data, error } = await this.supabase
      .from('player_name_lookup')
      .update({
        player_id: playerId,
        matched_name: matchedName,
        confidence_score: confidence,
        match_status: 'matched',
        last_matched_at: new Date().toISOString()
      })
      .eq('id', lookupId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Mark as no match
   */
  async markAsNoMatch(lookupId: string): Promise<PlayerNameLookup> {
    const { data, error } = await this.supabase
      .from('player_name_lookup')
      .update({
        match_status: 'no_match',
        confidence_score: 0,
        last_matched_at: new Date().toISOString()
      })
      .eq('id', lookupId)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// Export a singleton instance
export const playerNameMatcher = PlayerNameMatchingService.getInstance()

/**
 * Convenience function for simple player name matching
 */
export async function matchPlayerName(oddsName: string, sport: string = "mlb"): Promise<PlayerMatchResult> {
  return playerNameMatcher.matchPlayerName(oddsName, sport)
}

/**
 * Enhanced version of your existing player matching logic
 * This replaces the multiple API calls with a single lookup
 */
export async function getPlayerHitRateWithLookup(
  playerName: string, 
  market: string, 
  sport: string = "mlb"
): Promise<any | null> {
  try {
    // First, try to match the player name
    const matchResult = await matchPlayerName(playerName, sport)
    
    if (!matchResult.match_found || !matchResult.player_id) {
      console.log(`No match found for player: ${playerName}`)
      return null
    }
    
    console.log(`✅ Matched "${playerName}" to "${matchResult.matched_name}" (ID: ${matchResult.player_id})`)
    
    // Now fetch hit rate data using the matched player ID
    const response = await fetch(`/api/player-hit-rate?playerId=${matchResult.player_id}&market=${encodeURIComponent(market)}&sport=${sport}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error('Failed to fetch player hit rate')
    }
    
    const data = await response.json()
    return data.profile || null
    
  } catch (error) {
    console.error(`Error fetching hit rate for ${playerName}:`, error)
    return null
  }
} 