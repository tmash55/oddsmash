#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import requests
import json
from datetime import datetime, timezone, timedelta
import redis

# ENV VARS
ODDS_API_KEY = os.environ["ODDS_API_KEY"]
ODDS_API_BASE_URL = os.environ["ODDS_API_BASE_URL"]
UPSTASH_URL = os.environ.get("UPSTASH_REDIS_REST_URL")
UPSTASH_TOKEN = os.environ.get("UPSTASH_REDIS_REST_TOKEN")

# Sportsbook name standardization
SPORTSBOOK_NAME_MAP = {
    "draftkings": "draftkings",
    "fanduel": "fanduel",
    "betmgm": "betmgm",
    "williamhill_us": "caesars",
    "espnbet": "espn bet",
    "fanatics": "fanatics",
    "hardrockbet": "hard rock bet",
    "betrivers": "betrivers",
    "novig": "novig",
    "ballybet": "bally bet",
    "pinnacle": "pinnacle"
}

# SETTINGS
SPORT_KEY = "baseball_mlb"
REDIS_SPORT_KEY = "mlb"  # Use shorter key for Redis consistency
SPORTSBOOKS = "draftkings,fanduel,betmgm,williamhill_us,espnbet,fanatics,hardrockbet,betrivers,novig,ballybet,pinnacle"
ODDS_FORMAT = "american"
REDIS_TTL = 21600  # 6 hours in seconds

# Initialize Redis client if available
redis_client = None
if UPSTASH_URL and UPSTASH_TOKEN:
    redis_client = redis.Redis(
        host=UPSTASH_URL.replace("https://", "").split(":")[0],
        port=6379,
        password=UPSTASH_TOKEN,
        ssl=True
    )
    print("Redis client initialized for game lines storage")

# Game market configuration based on game-markets.ts
GAME_MARKETS = {
    # Regular game lines
    "h2h": {
        "label": "Moneyline",
        "description": "Pick the winner of the game",
        "market_type": "2_way",
        "has_alternates": False
    },
    "spreads": {
        "label": "Run Line",
        "description": "Bet with a run spread (typically ±1.5)",
        "market_type": "spread",
        "has_alternates": True,
        "alternate_key": "alternate_spreads"
    },
    "totals": {
        "label": "Total Runs",
        "description": "Combined runs scored by both teams",
        "market_type": "total",
        "has_alternates": True,
        "alternate_key": "alternate_totals"
    },
    # 1st Inning Markets
    "h2h_1st_1_innings": {
        "label": "1st Inning ML",
        "description": "Moneyline for first inning",
        "market_type": "2_way",
        "has_alternates": False
    },
    "spreads_1st_1_innings": {
        "label": "1st Inning Spread",
        "description": "Run spread for first inning",
        "market_type": "spread",
        "has_alternates": True,
        "alternate_key": "alternate_spreads_1st_1_innings"
    },
    "totals_1st_1_innings": {
        "label": "1st Inning Total",
        "description": "Total runs in first inning",
        "market_type": "total",
        "has_alternates": True,
        "alternate_key": "alternate_totals_1st_1_innings"
    }
}

# Create a list of all markets including alternates
MARKETS = []
for market_key, market_info in GAME_MARKETS.items():
    MARKETS.append(market_key)
    if market_info.get("has_alternates"):
        MARKETS.append(market_info["alternate_key"])
MARKETS = ",".join(MARKETS)

TARGET_MARKETS = [
    "Hits",
    "Strikeouts",
    "Total Bases",
    "RBIs",
    "Singles",
    "Doubles",
    "Triples",
    "Hits + Runs + RBIs",
    "Earned Runs",
    "Pitcher Win",
    "Home Runs",
    "Batting Strikeouts",
    "Batting Walks",
    "Walks",
    "Outs",
    "Runs",           # New market
    "Stolen Bases"    # New market
]

MARKET_TO_STAT_KEY = {
    "hits": "hits",
    "strikeouts": "pitching_strike_outs",
    "total bases": "total_bases",
    "rbis": "rbi",
    "singles": "singles",            # computed in SQL RPC
    "hits + runs + rbis": "hrr",     # computed in SQL RPC
    "triples": "triples",
    "doubles": "doubles",
    "home runs": "home_runs",
    "earned runs": "earned_runs",
    "pitcher win": "wins",
    "batting strikeouts": "strikeouts",
    "batting walks": "base_on_balls",
    "walks": "pitching_base_on_balls",
    "outs": "outs",
    "runs": "runs",                  # New mapping
    "stolen bases": "stolen_bases"   # New mapping
}

def get_base_market_key(market_key):
    """Get the base market key without alternate prefix"""
    if market_key.startswith("alternate_"):
        # Extract base market key (e.g., alternate_spreads -> spreads)
        return market_key.replace("alternate_", "")
    return market_key

def determine_primary_line(lines_data, has_alternates):
    """Determine primary line from all available lines"""
    if not lines_data:
        return None
        
    # Filter out 'standard' key used for moneyline markets
    numeric_lines = {k: v for k, v in lines_data.items() if k != 'standard'}
    
    if not numeric_lines:
        return 'standard' if 'standard' in lines_data else None
    
    line_values = [float(x) for x in numeric_lines.keys()]
    
    if has_alternates:
        # When we have alternates, the primary is usually the most commonly offered
        line_book_counts = {}
        for line_str, line_data in numeric_lines.items():
            count = len(line_data["sportsbooks"])
            line_book_counts[line_str] = count
        
        # Return line with most sportsbook coverage
        if line_book_counts:
            most_common = max(line_book_counts.items(), key=lambda x: x[1])
            return most_common[0]
    else:
        # For standard markets, just pick the most common line
        if line_values:
            return str(line_values[0])
    
    return None

def process_market_odds(market_data, market_info):
    """Process odds for a specific market type"""
    market_type = market_info["market_type"]
    odds_data = {
        "market_key": market_data["key"],
        "market_label": market_info["label"],
        "market_type": market_type,
        "description": market_info["description"],
        "has_alternates": market_info.get("has_alternates", False),
        "lines": {}
    }
    
    # Determine if this is an alternate market
    is_alternate = market_data["key"].startswith("alternate_")
    
    for outcome in market_data.get("outcomes", []):
        # Map the raw sportsbook name to our standardized name
        raw_sportsbook = market_data["bookmaker"].lower()
        sportsbook = SPORTSBOOK_NAME_MAP.get(raw_sportsbook, raw_sportsbook)
        
        # Get the point value for totals/spreads
        point = outcome.get("point")
        if point is None and market_type in ["spread", "total"]:
            # Try to get point from handicap
            point = outcome.get("handicap")
        
        # Format the line key based on the point value
        line_key = str(point) if point is not None else "0"
        
        # Initialize the line if it doesn't exist
        if line_key not in odds_data["lines"]:
            odds_data["lines"][line_key] = {
                "point": point,
                "sportsbooks": {}
            }
        
        # Get or create the sportsbook entry for this line
        if sportsbook not in odds_data["lines"][line_key]["sportsbooks"]:
            odds_data["lines"][line_key]["sportsbooks"][sportsbook] = {
                "is_standard": not is_alternate  # Mark as standard if not from alternate market
            }
        
        # Add the outcome data
        if market_type == "total":
            # For totals, we need to organize by over/under
            side = outcome.get("name", "").lower()
            if side in ["over", "under"]:
                odds_data["lines"][line_key]["sportsbooks"][sportsbook][side] = {
                    "price": outcome.get("price"),
                    "link": outcome.get("link"),
                    "sid": outcome.get("id")
                }
        else:
            # For other market types (like moneyline)
            odds_data["lines"][line_key]["sportsbooks"][sportsbook] = {
                "price": outcome.get("price"),
                "link": outcome.get("link"),
                "sid": outcome.get("id"),
                "is_standard": not is_alternate  # Mark as standard if not from alternate market
            }
    
    return odds_data

def fetch_mlb_events():
    """Fetch upcoming MLB events from the odds API"""
    url = f"{ODDS_API_BASE_URL}/sports/{SPORT_KEY}/events?apiKey={ODDS_API_KEY}"
    response = requests.get(url)
    response.raise_for_status()
    return response.json()

def fetch_odds_for_event(event_id):
    """Fetch odds for a specific event"""
    url = f"{ODDS_API_BASE_URL}/sports/{SPORT_KEY}/events/{event_id}/odds"
    params = {
        "apiKey": ODDS_API_KEY,
        "markets": MARKETS,
        "oddsFormat": ODDS_FORMAT,
        "bookmakers": SPORTSBOOKS,
        "includeLinks": "true",  # Add this to get link values
        "includeSids": "true"    # Add this to get selection IDs
    }
    response = requests.get(url, params=params)
    response.raise_for_status()
    return response.json()

def process_event_odds(event_odds):
    """Process all markets for an event"""
    vendor_event_id = event_odds.get("id")
    home_team = event_odds.get("home_team")
    away_team = event_odds.get("away_team")
    commence_time = event_odds.get("commence_time")
    
    print(f"Processing event {vendor_event_id}: {away_team} @ {home_team}")
    
    processed_markets = {}
    
    for bookmaker in event_odds.get("bookmakers", []):
        sportsbook = bookmaker.get("title", "").lower()
        
        for market in bookmaker.get("markets", []):
            market_key = market.get("key")
            base_market_key = get_base_market_key(market_key)
            
            # Skip if not in our defined markets
            if base_market_key not in GAME_MARKETS:
                continue
            
            market_info = GAME_MARKETS[base_market_key]
            
            # Add bookmaker info to market data for processing
            market["bookmaker"] = sportsbook
            
            if base_market_key not in processed_markets:
                processed_markets[base_market_key] = process_market_odds(market, market_info)
            else:
                # Merge the lines data
                market_odds = process_market_odds(market, market_info)
                for line_key, line_data in market_odds["lines"].items():
                    if line_key not in processed_markets[base_market_key]["lines"]:
                        processed_markets[base_market_key]["lines"][line_key] = line_data
                    else:
                        # Merge sportsbook data for existing lines
                        processed_markets[base_market_key]["lines"][line_key]["sportsbooks"].update(
                            line_data["sportsbooks"]
                        )
    
    # Add primary line detection for each market
    for market_key, market_data in processed_markets.items():
        market_data["primary_line"] = determine_primary_line(
            market_data["lines"],
            market_data["has_alternates"]
        )
    
    return {
        "event_id": vendor_event_id,
        "sport_key": SPORT_KEY,
        "home_team": home_team,
        "away_team": away_team,
        "commence_time": commence_time,
        "last_update": datetime.now(timezone.utc).isoformat(),
        "markets": processed_markets
    }

def store_odds_in_redis(event_data):
    """Store processed odds in Redis with TTL"""
    if not redis_client:
        print("WARNING: No Redis client available, skipping storage")
        return
        
    event_id = event_data["event_id"]
    
    # Store each market separately
    for market_key, market_data in event_data["markets"].items():
        redis_key = f"odds:{REDIS_SPORT_KEY}:{event_id}:{market_key}"
        
        # Add event metadata to market data
        market_data.update({
            "event_id": event_id,
            "sport_key": event_data["sport_key"],
            "home_team": event_data["home_team"],
            "away_team": event_data["away_team"],
            "commence_time": event_data["commence_time"],
            "last_update": event_data["last_update"]
        })
        
        try:
            redis_client.setex(
                redis_key,
                REDIS_TTL,
                json.dumps(market_data)
            )
            print(f"✅ Stored Redis odds: {redis_key}")
        except Exception as e:
            print(f"❌ Redis storage error for {redis_key}: {e}")

# ── FETCH TODAY'S STANDARD PROPS ──────────────────────────────────────────────
def fetch_today_standard_props():
    """
    Fetch props from player_odds_history table (non‐alt lines plus Home Runs alt line).
    Includes player position and team abbreviation via joins.
    Since we delete/refresh this table with current data, no date filtering needed.
    """
    standard_markets = [m for m in TARGET_MARKETS if m.lower() != "home runs"]

    select_fields = (
        "player_id, player_name, market, line, vendor_event_id, commence_time, home_team, away_team,"
        "mlb_players(position_abbreviation, team_id, mlb_teams(abbreviation))"
    )

    print("🔍 Fetching standard props (non-alt lines, no date filter)...")
    
    # 1) Fetch non-alt lines
    std_resp = (
        supabase
        .table("player_odds_history")
        .select(select_fields)
        .eq("sportsbook", "draftkings")
        .eq("is_alternative", False)
        .in_("market", standard_markets)
        .execute()
    )
    standard = std_resp.data or []
    print(f"✅ Found {len(standard)} standard props from DraftKings")

    # 2) Fetch Home Runs alt line (line=0.5) for ALL sportsbooks
    print("🔍 Fetching Home Runs alt lines (0.5) from all sportsbooks...")
    hr_resp = (
        supabase
        .table("player_odds_history")
        .select(select_fields)
        .eq("market", "Home Runs")
        .eq("line", 0.5)
        .execute()
    )
    home_runs = hr_resp.data or []
    print(f"⚾ Found {len(home_runs)} home run props across all sportsbooks")

    # Combine standard props with home run props
    props = standard + home_runs
    print(f"📊 Total props before deduplication: {len(props)}")
    
    # Log unique games and their details
    unique_games = {}
    for prop in props:
        event_id = prop.get("vendor_event_id")
        if event_id and event_id not in unique_games:
            unique_games[event_id] = {
                "home_team": prop.get("home_team"),
                "away_team": prop.get("away_team"), 
                "commence_time": prop.get("commence_time"),
                "player_count": 0
            }
        if event_id:
            unique_games[event_id]["player_count"] += 1
    
    print(f"🎮 Found {len(unique_games)} unique games:")
    for event_id, game_info in unique_games.items():
        print(f"  📅 {game_info['home_team']} vs {game_info['away_team']}")
        print(f"     🕐 {game_info['commence_time']} | 👥 {game_info['player_count']} players | 🆔 {event_id}")
    
    if not props:
        raise Exception("No props found in player_odds_history table.")
    return props

def main():
    print("STARTING game lines import...")
    
    # Fetch upcoming events
    events = fetch_mlb_events()
    now = datetime.now(timezone.utc)
    future_events = [
        e for e in events
        if now <= datetime.fromisoformat(e["commence_time"].replace("Z", "+00:00")) <= now + timedelta(hours=36)
    ]
    
    print(f"TARGET: Processing {len(future_events)} upcoming events")
    
    success_count = 0
    
    for i, event in enumerate(future_events, 1):
        try:
            print(f"[{i}/{len(future_events)}] Processing event {event['id']}...")
            
            # Fetch odds for this event
            event_odds = fetch_odds_for_event(event["id"])
            
            # Process odds data
            processed_data = process_event_odds(event_odds)
            
            # Store in Redis
            store_odds_in_redis(processed_data)
            
            success_count += 1
            
        except Exception as e:
            print(f"WARNING: Failed to process event {event['id']}: {e}")
    
    print(f"COMPLETED! Processed {success_count}/{len(future_events)} events")

if __name__ == "__main__":
    main() 