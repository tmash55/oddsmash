# Redis Cache Structure Documentation

## Overview
This document outlines the Redis cache structure used in our sports betting application, currently focused on MLB data with plans for expansion to other sports.

## Key Patterns

### Hit Rate Profiles
```
hit_rate:{sport}:{player_id}:{market}
```
- Example: `hit_rate:mlb:455117:hits`
- TTL: 24 hours (86400 seconds)
- Structure:
```json
{
  "hitRateProfile": {
    "player_id": number,
    "player_name": string,
    "market": string,
    "last_5_hit_rate": number,
    "last_10_hit_rate": number,
    "last_20_hit_rate": number,
    // ... other profile data
  },
  "fallback_odds": {
    "sportsbook_id": {
      "price": number,
      "link": string,
      "sid": string
    }
  },
  "lastUpdated": string // ISO timestamp
}
```
Example:
```json
{
  "league_id": 1,
  "player_id": 455117,
  "player_name": "Martin Maldonado",
  "position_abbreviation": "C",
  "team_abbreviation": "SD",
  "market": "Doubles",
  "line": 0.5,
  "last_5_hit_rate": 0,
  "last_10_hit_rate": 0,
  "last_20_hit_rate": 5,
  "avg_stat_per_game": 0.05,
  "points_histogram": {
    "last_5": {
      "0": 5
    },
    "last_10": {
      "0": 10
    },
    "last_20": {
      "0": 19,
      "1": 1
    }
  },
  "line_streaks": {
    "0": 17,
    "1": 1,
    "2": 0,
    "3": 0,
    "4": 0,
    "5": 0
  },
  "updated_at": "2025-06-06T20:33:12.642162+00:00",
  "season_games_count": 33,
  "season_hit_rate": 3.03,
  "recent_games": [
    {
      "game_id": 777633,
      "date": "2025-06-05",
      "opponent_abbr": "SF",
      "is_home": false,
      "value": 0
    },
    ...more games,
  ],
  "fallback_odds": {
    "0.5": {
      "FanDuel": {
        "odds": 800,
        "over_link": "https://sportsbook.fanduel.com/addToBetslip?marketId=42.508818408&selectionId=11597007",
        "sid": "11597007"
      },
      "BetMGM": {
        "odds": 950,
        "over_link": "https://sports.{state}.betmgm.com/en/sports?options=17571143-1312755715--572869586&type=Single",
        "sid": "-572869586"
      },
      "DraftKings": {
        "odds": 850,
        "over_link": "https://sportsbook.draftkings.com/event/32385286?outcomes=0QA254546668%23256167265_13L84240Q11641027504Q20",
        "sid": "0QA254546668#256167265_13L84240Q11641027504Q20"
      },
      "Fanatics": {
        "odds": 700,
        "over_link": null,
        "sid": "746679896"
      },
      "Hard Rock Bet": {
        "odds": 1100,
        "over_link": "https://app.hardrock.bet/?deep_link_value=betslip/7633691097706529027",
        "sid": "7633691097706529027"
      }
    }
  },
  "odds_event_id": "10c72149fe69b8b50338e12014d2a9c9",
  "commence_time": "2025-06-07T00:11:00+00:00",
  "home_team": "Milwaukee Brewers",
  "away_team": "San Diego Padres"
}
```

### Game Level Odds
```
odds:{sport}:{event_id}
```
- Example: `odds:mlb:12345`
- TTL: 3 hours (10800 seconds)
- Updated every 2 hours via workflow
- Structure:
```json
{
  "event_id": string,
  "home_team": string,
  "away_team": string,
  "start_time": string,
  "odds_data": {
    // Game level markets and odds
  },
  "lastUpdated": string
}
```
Example:
```json
{
  "808f7fd2a0256352e8abb74cd798a481": {
    "sport_key": "baseball_mlb",
    "event_id": "808f7fd2a0256352e8abb74cd798a481",
    "commence_time": "2025-06-07T17:11:00Z",
    "home_team": {
      "name": "Detroit Tigers",
      "abbreviation": "DET"
    },
    "away_team": {
      "name": "Chicago Cubs",
      "abbreviation": "CHC"
    },
    "mlb_game_id": "777609",
    "status": "scheduled",
    "doubleheader": "N",
    "last_updated": "2025-06-07T09:30:57.802129+00:00",
    "venue": {
      "id": 2394,
      "name": "Comerica Park",
      "link": "/api/v1/venues/2394"
    }
  },
``` 


### Player Level Odds
```
odds:{sport}:{event_id}:{player_id}:{market}
```
- Example: `odds:mlb:12345:455117:hits`
- TTL: 3 hours (10800 seconds)
- Updated every 2 hours via workflow
- Structure:
```json
{
  "player_id": number,
  "market": string,
  "line": number,
  "odds_data": {
    "draftkings": {
      "price": number,
      "link": string,
      "sid": string
    },
    // ... other sportsbooks
  },
  "lastUpdated": string
}
```
Example: 
```json
{
  "description": "Gleyber Torres",
  "market": "batter_total_bases",
  "lines": [
    {
      "line": 3.5,
      "sportsbooks": {
        "fanduel": {
          "price": 470,
          "link": "https://sportsbook.fanduel.com/addToBetslip?marketId=42.509008806&selectionId=17813530",
          "sid": "17813530",
          "last_update": "2025-06-07T10:49:58.444580+00:00"
        },
        "fanatics": {
          "price": 380,
          "link": null,
          "sid": "748164358",
          "last_update": "2025-06-07T10:49:58.444580+00:00"
        },
        "draftkings": {
          "price": 500,
          "link": "https://sportsbook.draftkings.com/event/32389208?outcomes=0QA254735339%23256882417_13L84240Q1-1379044839Q20",
          "sid": "0QA254735339#256882417_13L84240Q1-1379044839Q20",
          "last_update": "2025-06-07T10:49:58.444580+00:00"
        }
      }
    },
```

### Games Cache
```
games:{sport}:{date}
```
- Example: `games:mlb:2024-03-20`
- TTL: 24 hours (86400 seconds)
- Structure:
```json
{
  "games": [
    {
      "event_id": string,
      "home_team": string,
      "away_team": string,
      "start_time": string,
      // ... other game data
    }
  ],
  "lastUpdated": string,
  "venue":
}
```

Example:
```json
{
  "808f7fd2a0256352e8abb74cd798a481": {
    "sport_key": "baseball_mlb",
    "event_id": "808f7fd2a0256352e8abb74cd798a481",
    "commence_time": "2025-06-07T17:11:00Z",
    "home_team": {
      "name": "Detroit Tigers",
      "abbreviation": "DET"
    },
    "away_team": {
      "name": "Chicago Cubs",
      "abbreviation": "CHC"
    },
    "mlb_game_id": "777609",
    "status": "scheduled",
    "doubleheader": "N",
    "last_updated": "2025-06-07T09:30:57.802129+00:00",
    "venue": {
      "id": 2394,
      "name": "Comerica Park",
      "link": "/api/v1/venues/2394"
    }
  },
```

## Fallback Hierarchy

1. Real-time Odds Cache
   - Primary source for current odds
   - `odds:{sport}:{event_id}:{player_id}:{market}`
   - Most frequently updated (every 2 hours)

2. Hit Rate Profile Fallback
   - Secondary source for odds
   - `hit_rate:{sport}:{player_id}:{market}`
   - Contains fallback odds from last profile update

3. Database Fallback
   - Final fallback if cache misses
   - Stores historical data and base profiles

## Cache Management

### TTL Strategy
- Hit Rate Profiles: 24 hours
- Odds Data: 3 hours
- Games Data: 24 hours

### Update Cycles
- Odds Workflow: Runs every 2 hours
- Hit Rate Profiles: Updated daily
- Games Data: Updated daily

### Key Features
- Sport-specific namespacing for multi-sport support
- Consistent key patterns for easy pattern matching
- Batch operations for efficiency
- Fallback mechanism for reliability

## Implementation Notes

### Market Normalization
- Markets are stored in lowercase
- Alternate markets (e.g., `batter_hits_alternate`) share cache with base markets
- Example: `batter_hits` and `batter_hits_alternate` use same cache key

### Error Handling
- Redis operations wrapped in try/catch
- Graceful fallback to database
- Logging for cache hits/misses
- Invalid data format handling

### Performance Considerations
- Uses SCAN instead of KEYS for large datasets
- Batch operations for multiple gets/sets
- Efficient key pattern matching
- Optimized TTLs based on data freshness requirements 