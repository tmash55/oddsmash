# Player Name Lookup System Implementation

## Overview

This document outlines the implementation of a player name lookup table system to improve performance and accuracy when matching player names between the odds API and hit rate database.

## Problem Statement

Currently, the system performs expensive fuzzy matching operations every time it needs to match a player name from the odds API to our hit rate database. This involves:

1. Multiple API calls with different name variations
2. Trying different market name formats
3. Repeating the same matching logic for the same players
4. No learning from previous successful matches

## Solution: Lookup Table Approach

### Database Schema

```sql
-- Player name lookup table
CREATE TABLE player_name_lookup (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Source information
    odds_name TEXT NOT NULL, -- Name as it appears in odds API
    matched_name TEXT, -- Name as it appears in our hit rate database
    player_id INTEGER, -- Our internal player ID (if matched)
    
    -- Matching metadata
    confidence_score INTEGER NOT NULL DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
    match_status TEXT NOT NULL DEFAULT 'pending' CHECK (match_status IN ('pending', 'matched', 'no_match', 'manual_review')),
    
    -- Additional context
    sport TEXT NOT NULL DEFAULT 'mlb',
    team_name TEXT,
    position TEXT,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    last_matched_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(odds_name, sport)
);
```

### Key Features

1. **Fast Lookups**: O(1) lookup time using indexed odds_name
2. **Confidence Scoring**: 0-100 confidence score for match quality
3. **Status Tracking**: Track pending, matched, no_match, and manual_review states
4. **Audit Trail**: Track when matches were created and last updated
5. **Sport-Specific**: Support for multiple sports
6. **Manual Review**: Flag low-confidence matches for human review

## Implementation Components

### 1. TypeScript Types (`types/player-lookup.ts`)

```typescript
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

export interface PlayerMatchResult {
  odds_name: string
  matched_name: string | null
  player_id: number | null
  confidence_score: number
  match_found: boolean
  source: 'lookup_table' | 'fuzzy_match' | 'manual'
}
```

### 2. API Endpoints (`app/api/player-name-lookup/route.ts`)

- **GET**: Retrieve lookups with filtering options
- **POST**: Create new lookup entries
- **PUT**: Update existing lookup entries

### 3. Service Layer (`services/player-name-matching.ts`)

```typescript
export class PlayerNameMatchingService {
  async matchPlayerName(oddsName: string, sport: string): Promise<PlayerMatchResult>
  async batchMatchPlayerNames(oddsNames: string[], sport: string): Promise<Record<string, PlayerMatchResult>>
  async getUnmatchedNames(sport: string): Promise<PlayerNameLookup[]>
  async createManualMapping(oddsName: string, matchedName: string, playerId: number, sport: string): Promise<boolean>
}
```

### 4. Admin Interface (`app/admin/player-matching/page.tsx`)

- View all lookup entries with filtering
- Manually review and approve/reject matches
- Edit match details
- Bulk operations for managing entries

## Integration Points

### 1. Betslip Scanner Enhancement

The betslip scanner now follows this flow:

1. **Check Lookup Table**: First check if we already have a mapping for the player name
2. **Fast Path**: If found, use the mapped player_id directly
3. **Fallback**: If not found, use original fuzzy matching logic
4. **Learn**: Save successful matches to the lookup table for future use

### 2. Hit Rate Data Fetching

Enhanced to use player IDs when available:

```typescript
// Before: Multiple API calls with name variations
const hitRateData = await tryMultipleNameVariations(playerName, market)

// After: Single lookup + direct API call
const match = await matchPlayerName(playerName)
if (match.match_found) {
  const hitRateData = await fetchHitRateByPlayerId(match.player_id, market)
}
```

## Performance Benefits

### Before (Current System)
- **Per Player**: 5-20 API calls trying different name/market variations
- **No Caching**: Same matching logic repeated for same players
- **High Latency**: Multiple sequential API calls
- **Resource Intensive**: Heavy database queries for each match attempt

### After (Lookup System)
- **Per Player**: 1 lookup query + 1 hit rate API call (if matched)
- **Intelligent Caching**: In-memory cache for frequently accessed players
- **Low Latency**: Single indexed database lookup
- **Learning System**: Builds knowledge base over time

## Expected Performance Improvements

- **90% reduction** in API calls for known players
- **80% faster** betslip scanning for repeat players
- **95% accuracy** for manually reviewed matches
- **Scalable**: Performance improves as lookup table grows

## Manual Review Workflow

1. **Automatic Detection**: Low confidence matches (< 85%) flagged for review
2. **Admin Interface**: Review pending matches in admin panel
3. **Manual Mapping**: Create high-confidence mappings for edge cases
4. **Continuous Learning**: System gets smarter over time

## Common Use Cases

### 1. Suffix Handling
- **Odds API**: "Ronald Acuna"
- **Database**: "Ronald Acuna Jr."
- **Solution**: Manual mapping with 100% confidence

### 2. Nickname Variations
- **Odds API**: "Mike Trout"
- **Database**: "Michael Trout"
- **Solution**: Automatic fuzzy match + lookup table entry

### 3. Spelling Variations
- **Odds API**: "Freddie Freeman"
- **Database**: "Freddy Freeman"
- **Solution**: Manual review + correction

## Migration Strategy

1. **Phase 1**: Deploy lookup table and API endpoints
2. **Phase 2**: Update betslip scanner to use lookup system
3. **Phase 3**: Populate initial mappings from successful historical matches
4. **Phase 4**: Enable admin interface for manual review
5. **Phase 5**: Monitor and optimize based on usage patterns

## Monitoring & Metrics

Track these metrics to measure success:

- **Lookup Hit Rate**: % of players found in lookup table
- **Match Confidence**: Average confidence score of matches
- **Manual Review Queue**: Number of entries needing human review
- **Performance Gains**: Reduction in API call volume
- **Accuracy**: False positive/negative rates

## Future Enhancements

1. **Machine Learning**: Use ML to improve fuzzy matching algorithms
2. **Team Context**: Use team information to improve matching accuracy
3. **Cross-Sport**: Extend to NBA, NFL, NHL player matching
4. **Bulk Import**: Tools to import mappings from external sources
5. **API Integration**: Direct integration with odds provider player databases

## Getting Started

1. **Run Migration**: Apply the database migration
2. **Start Matching**: Use the lookup system in your existing code
3. **Review Matches**: Use admin interface to review pending matches
4. **Monitor Performance**: Track metrics and optimize as needed

This system provides a scalable, maintainable solution for player name matching that will improve performance and accuracy over time while reducing operational overhead. 