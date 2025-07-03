export interface PlayerNameLookup {
  id: string
  odds_name: string
  matched_name: string | null
  player_id: number | null
  confidence_score: number
  match_status: 'pending' | 'matched' | 'no_match' | 'manual_review'
  sport: string
  team_name: string | null
  position: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  last_matched_at: string | null
}

export interface PlayerNameLookupCreate {
  odds_name: string
  matched_name?: string | null
  player_id?: number | null
  confidence_score?: number
  match_status?: 'pending' | 'matched' | 'no_match' | 'manual_review'
  sport?: string
  team_name?: string | null
  position?: string | null
}

export interface PlayerNameLookupUpdate {
  matched_name?: string | null
  player_id?: number | null
  confidence_score?: number
  match_status?: 'pending' | 'matched' | 'no_match' | 'manual_review'
  team_name?: string | null
  position?: string | null
}

export interface PlayerMatchResult {
  odds_name: string
  matched_name: string | null
  player_id: number | null
  confidence_score: number
  match_found: boolean
  source: 'lookup_table' | 'fuzzy_match' | 'manual'
}

export interface PlayerNameMatchingFilters {
  sport?: string
  match_status?: 'pending' | 'matched' | 'no_match' | 'manual_review'
  min_confidence?: number
  max_confidence?: number
  team_name?: string
  needs_review?: boolean
}

// Utility function to calculate name similarity
export function calculateNameSimilarity(name1: string, name2: string): number {
  // Simple Levenshtein distance-based similarity
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z\s]/g, '').trim()
  
  const a = normalize(name1)
  const b = normalize(name2)
  
  if (a === b) return 100
  
  const matrix = []
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  const maxLen = Math.max(a.length, b.length)
  const distance = matrix[b.length][a.length]
  return Math.round(((maxLen - distance) / maxLen) * 100)
}

// Common name variations to check
export function generateNameVariations(name: string): string[] {
  const variations = [name]
  const normalized = name.toLowerCase().trim()
  
  // Remove suffixes like Jr., Sr., III, etc.
  const withoutSuffix = normalized.replace(/\s+(jr\.?|sr\.?|iii|iv|v)$/i, '')
  if (withoutSuffix !== normalized) {
    variations.push(withoutSuffix)
  }
  
  // Add suffix if not present
  if (!normalized.includes(' jr') && !normalized.includes(' sr')) {
    variations.push(normalized + ' jr')
    variations.push(normalized + ' jr.')
  }
  
  // Handle nickname variations (this could be expanded)
  const nicknames: Record<string, string[]> = {
    'william': ['bill', 'will'],
    'robert': ['bob', 'rob'],
    'michael': ['mike'],
    'christopher': ['chris'],
    'anthony': ['tony'],
    'francisco': ['frankie'],
    'alexander': ['alex'],
    'benjamin': ['ben'],
    'jonathan': ['jon'],
    'matthew': ['matt']
  }
  
  const parts = normalized.split(' ')
  for (const [fullName, nicks] of Object.entries(nicknames)) {
    if (parts.includes(fullName)) {
      nicks.forEach(nick => {
        const variation = normalized.replace(fullName, nick)
        variations.push(variation)
      })
    }
    nicks.forEach(nick => {
      if (parts.includes(nick)) {
        const variation = normalized.replace(nick, fullName)
        variations.push(variation)
      }
    })
  }
  
  return Array.from(new Set(variations))
} 