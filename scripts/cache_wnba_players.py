import os
import requests
import unicodedata
import re
import json
from datetime import datetime, timezone, timedelta
from supabase import create_client

# ENV VARS
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
ODDS_API_KEY = os.environ["ODDS_API_KEY"]
ODDS_API_BASE_URL = os.environ["ODDS_API_BASE_URL"]
UPSTASH_URL = os.environ.get("UPSTASH_REDIS_REST_URL")
UPSTASH_TOKEN = os.environ.get("UPSTASH_REDIS_REST_TOKEN")

# INIT CLIENTS
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize Redis client if available
redis_client = None
if UPSTASH_URL and UPSTASH_TOKEN:
    import redis
    redis_client = redis.Redis(
        host=UPSTASH_URL.replace("https://", "").split(":")[0],
        port=6379,
        password=UPSTASH_TOKEN,
        ssl=True
    )
    print("Redis client initialized for game mapping lookup and current odds storage")

# SETTINGS
SPORT_KEY = "basketball_wnba"
REDIS_SPORT_KEY = "wnba"
SPORTSBOOKS = "draftkings,fanduel,betmgm,williamhill_us,espnbet,fanatics,hardrockbet,betrivers,novig,ballybet,pinnacle"
MARKETS = (
    "player_points,player_points_alternate,"
    "player_rebounds,player_rebounds_alternate,"
    "player_assists,player_assists_alternate,"
    "player_threes,player_threes_alternate,"
    "player_points_rebounds_assists,player_points_rebounds_assists_alternate,"
    "player_points_rebounds,player_points_rebounds_alternate,"
    "player_points_assists,player_points_assists_alternate,"
    "player_rebounds_assists,player_rebounds_assists_alternate,"
    "player_double_double,"
    "player_triple_double,"
    "player_blocks,player_blocks_alternate,"
    "player_steals,player_steals_alternate,"
    "player_blocks_steals,"
    "player_turnovers,player_turnovers_alternate,"
    "player_first_team_basket,"
    "player_first_basket,"
    "player_points_q1,"
    "player_assists_q1,"
    "player_rebounds_q1"
).replace(" ", "")

# Map API markets to our standardized market names
MARKET_NAME_MAP = {
    "player_points": "Points",
    "player_points_alternate": "Points",
    "player_rebounds": "Rebounds",
    "player_rebounds_alternate": "Rebounds",
    "player_assists": "Assists",
    "player_assists_alternate": "Assists",
    "player_threes": "Threes",
    "player_threes_alternate": "Threes",
    "player_points_rebounds_assists": "PRA",
    "player_points_rebounds_assists_alternate": "PRA",
    "player_points_rebounds": "Points + Rebounds",
    "player_points_rebounds_alternate": "Points + Rebounds",
    "player_points_assists": "Points + Assists",
    "player_points_assists_alternate": "Points + Assists",
    "player_rebounds_assists": "Rebounds + Assists",
    "player_rebounds_assists_alternate": "Rebounds + Assists",
    "player_double_double": "Double Double",
    "player_triple_double": "Triple Double",
    "player_blocks": "Blocks",
    "player_blocks_alternate": "Blocks",
    "player_steals": "Steals",
    "player_steals_alternate": "Steals",
    "player_blocks_steals": "Blocks + Steals",
    "player_turnovers": "Turnovers",
    "player_turnovers_alternate": "Turnovers",
    "player_first_team_basket": "Team First Point",
    "player_first_basket": "First Point",
    "player_points_q1": "Points - 1st Quarter",
    "player_assists_q1": "Assists - 1st Quarter",
    "player_rebounds_q1": "Rebounds - 1st Quarter"
}

# Determine if a market is alternative based on name
ALTERNATIVE_MARKETS = {
    "player_points_alternate",
    "player_rebounds_alternate",
    "player_assists_alternate",
    "player_threes_alternate",
    "player_points_rebounds_assists_alternate",
    "player_points_rebounds_alternate",
    "player_points_assists_alternate",
    "player_rebounds_assists_alternate",
    "player_blocks_alternate",
    "player_steals_alternate",
    "player_turnovers_alternate"
}

ODDS_FORMAT = "american"

def normalize_name(name):
    """Normalize player name for consistent matching"""
    if not name:
        return ""
    name = unicodedata.normalize('NFKD', name)
    name = ''.join(c for c in name if not unicodedata.combining(c))
    name = name.encode('ascii', 'ignore').decode('ascii')
    name = name.replace(".", "").replace(" jr", "").replace(" sr", "")
    name = re.sub(r"\\s+", " ", name).lower().strip()
    return name

def build_player_lookup():
    """Build lookup for player names to player_id and team info"""
    players = (
        supabase
        .from_("wnba_players")
        .select("""
            player_id,
            player_name,
            team_abbreviation,
            team_id,
            wnba_teams!inner (
                name
            )
        """)
        .execute()
        .data
    )
    lookup = {}
    for p in players:
        name = normalize_name(p["player_name"])
        team_data = p.get("wnba_teams", {})
        lookup[name] = {
            "player_id": p["player_id"],
            "team_abbreviation": p["team_abbreviation"],
            "team_id": p["team_id"],
            "team_name": team_data.get("name")
        }
    return lookup

def match_player(name, lookup):
    """Match player name to our database record"""
    n = normalize_name(name)
    return lookup.get(n)

def fetch_wnba_events():
    """Fetch upcoming WNBA events from the odds API"""
    url = f"{ODDS_API_BASE_URL}/sports/{SPORT_KEY}/events?apiKey={ODDS_API_KEY}"
    response = requests.get(url)
    response.raise_for_status()
    return response.json()

def fetch_props_for_event(event_id):
    """Fetch prop odds for a specific event"""
    url = f"{ODDS_API_BASE_URL}/sports/{SPORT_KEY}/events/{event_id}/odds"
    params = {
        "apiKey": ODDS_API_KEY,
        "markets": MARKETS,
        "oddsFormat": ODDS_FORMAT,
        "bookmakers": SPORTSBOOKS,
        "includeSids": "true",
        "includeLinks": "true"
    }
    response = requests.get(url, params=params)
    response.raise_for_status()
    return response.json()

def determine_primary_line(lines_data, has_alternates):
    """Determine primary line from all available lines"""
    if not lines_data:
        return None
        
    line_values = [float(x) for x in lines_data.keys()]
    
    if has_alternates:
        # When we have alternates, the primary is usually the most commonly offered
        line_book_counts = {}
        for line_str, sportsbooks in lines_data.items():
            count = 0
            for book_data in sportsbooks.values():
                if book_data.get('over') or book_data.get('under'):
                    count += 1
            line_book_counts[line_str] = count
        
        # Return line with most sportsbook coverage
        if line_book_counts:
            most_common = max(line_book_counts.items(), key=lambda x: x[1])
            return most_common[0]
    else:
        # For standard markets, just pick the most common line
        line_book_counts = {}
        for line_str, sportsbooks in lines_data.items():
            count = len([book for book, data in sportsbooks.items() 
                        if data.get('over') or data.get('under')])
            line_book_counts[line_str] = count
        
        if line_book_counts:
            most_common = max(line_book_counts.items(), key=lambda x: x[1])
            return most_common[0]
    
    return str(line_values[0]) if line_values else None

def store_current_odds_in_redis(records):
    """Store current odds in Redis with player+market grouping"""
    if not redis_client:
        print("WARNING: No Redis client available, skipping current odds storage")
        return
        
    print(f"📊 Processing {len(records)} records for Redis current odds storage...")
    
    # Group records by player_id + base_market
    grouped_odds = {}
    
    for record in records:
        market_display_name = record['market']
        key = f"{record['player_id']}_{market_display_name}"
        
        if key not in grouped_odds:
            grouped_odds[key] = {
                'player_id': record['player_id'],
                'description': record['player_name'],
                'team': record['team_abbreviation'],
                'team_name': record['team_name'],
                'market': market_display_name,
                'event_id': record['vendor_event_id'],
                'home_team': record['home_team'],
                'away_team': record['away_team'],
                'commence_time': record['commence_time'],
                'lines': {},
                'has_alternates': False
            }
        
        if record['is_alternative']:
            grouped_odds[key]['has_alternates'] = True
        
        line_str = str(record['line'])
        sportsbook = record['sportsbook']
        
        if line_str not in grouped_odds[key]['lines']:
            grouped_odds[key]['lines'][line_str] = {}
            
        if sportsbook not in grouped_odds[key]['lines'][line_str]:
            grouped_odds[key]['lines'][line_str][sportsbook] = {
                'over': None,
                'under': None
            }
        
        if record['over_price']:
            grouped_odds[key]['lines'][line_str][sportsbook]['over'] = {
                'price': record['over_price'],
                'link': record['over_link'],
                'sid': record['over_sid'],
                'last_update': record['updated_at']
            }
            
        if record['under_price']:
            grouped_odds[key]['lines'][line_str][sportsbook]['under'] = {
                'price': record['under_price'],
                'link': record['under_link'], 
                'sid': record['under_sid'],
                'last_update': record['updated_at']
            }
    
    # Store each player+market group in Redis
    stored_count = 0
    for group_key, odds_data in grouped_odds.items():
        redis_key = f"odds:{REDIS_SPORT_KEY}:{odds_data['player_id']}:{odds_data['market'].lower()}"
        
        odds_data['primary_line'] = determine_primary_line(odds_data['lines'], odds_data['has_alternates'])
        odds_data['last_updated'] = datetime.now(timezone.utc).isoformat()
        
        try:
            redis_client.setex(redis_key, 10800, json.dumps(odds_data))
            stored_count += 1
            print(f"✅ Stored Redis odds: {redis_key} ({len(odds_data['lines'])} lines)")
        except Exception as e:
            print(f"❌ Redis storage error for {redis_key}: {e}")
    
    print(f"📊 Successfully stored {stored_count} player+market combinations in Redis")

def process_event_odds(event_props, player_lookup):
    """Process odds for a single event and return records for Redis storage"""
    vendor_event_id = event_props.get("id")
    home_team = event_props.get("home_team")
    away_team = event_props.get("away_team")
    commence_time = event_props.get("commence_time")
    
    print(f"PROCESSING event {vendor_event_id}: {away_team} @ {home_team}")
    
    records = []
    current_time = datetime.now(timezone.utc).isoformat()
    
    # Process each bookmaker's odds
    for bookmaker in event_props.get("bookmakers", []):
        sportsbook = bookmaker.get("title", "").lower()
        
        for market in bookmaker.get("markets", []):
            market_key = market.get("key")
            market_display_name = MARKET_NAME_MAP.get(market_key, market_key)
            is_alternative = market_key in ALTERNATIVE_MARKETS
            
            for outcome in market.get("outcomes", []):
                player_name = outcome.get("description", "")
                player_match = match_player(player_name, player_lookup)
                
                if not player_match or not player_match.get("player_id"):
                    print(f"⚠️ Skipping unmatched player: {player_name}")
                    continue
                
                player_id = player_match["player_id"]
                team_abbreviation = player_match.get("team_abbreviation")
                team_name = player_match.get("team_name")
                
                # Skip if no team info (shouldn't happen with WNBA data)
                if not team_abbreviation or not team_name:
                    print(f"⚠️ Skipping {player_name} - missing team info")
                    continue
                
                line = outcome.get("point")
                over_under = outcome.get("name", "").lower()
                price = outcome.get("price")
                link = outcome.get("link")
                sid = outcome.get("sid")
                
                if not line or not over_under or price is None:
                    continue
                
                # Find or create record for this player/market/line/sportsbook combination
                existing_record = None
                for record in records:
                    if (record["player_id"] == player_id and 
                        record["market"] == market_display_name and
                        record["line"] == float(line) and
                        record["sportsbook"] == sportsbook):
                        existing_record = record
                        break
                
                if not existing_record:
                    existing_record = {
                        "vendor_event_id": vendor_event_id,
                        "vendor_name": "the-odds-api",
                        "player_id": player_id,
                        "player_name": player_name,
                        "market": market_display_name,
                        "line": float(line),
                        "sportsbook": sportsbook,
                        "over_price": None,
                        "under_price": None,
                        "over_link": None,
                        "under_link": None,
                        "over_sid": None,
                        "under_sid": None,
                        "is_alternative": is_alternative,
                        "home_team": home_team,
                        "away_team": away_team,
                        "team_abbreviation": team_abbreviation,
                        "team_name": team_name,
                        "commence_time": commence_time,
                        "sport_key": SPORT_KEY,
                        "created_at": current_time,
                        "updated_at": current_time
                    }
                    records.append(existing_record)
                
                # Update the record with over/under data
                if over_under == "over":
                    existing_record["over_price"] = price
                    existing_record["over_link"] = link
                    existing_record["over_sid"] = sid
                elif over_under == "under":
                    existing_record["under_price"] = price
                    existing_record["under_link"] = link
                    existing_record["under_sid"] = sid
    
    print(f"SUCCESS: Processed {len(records)} odds records for event {vendor_event_id}")
    return records

def main():
    print("STARTING WNBA odds import...")
    
    # Build player lookup table
    player_lookup = build_player_lookup()
    print(f"Loaded {len(player_lookup)} WNBA players")
    
    # Fetch upcoming events from odds API
    events = fetch_wnba_events()
    now = datetime.now(timezone.utc)
    future_events = [
        e for e in events
        if now <= datetime.fromisoformat(e["commence_time"].replace("Z", "+00:00")) <= now + timedelta(hours=36)
    ]
    
    print(f"TARGET: Processing {len(future_events)} upcoming events")
    
    all_records = []
    success_count = 0
    
    for i, event in enumerate(future_events, 1):
        try:
            print(f"[{i}/{len(future_events)}] Processing event {event['id']}...")
            
            # Fetch props for this event
            event_odds = fetch_props_for_event(event["id"])
            
            # Process into records for Redis
            records = process_event_odds(event_odds, player_lookup)
            
            # Add to collection
            all_records.extend(records)
            success_count += 1
            
        except Exception as e:
            print(f"WARNING: Failed to process event {event['id']}: {e}")
    
    # Store current odds in Redis
    if all_records:
        store_current_odds_in_redis(all_records)
        print(f"SUCCESS: Processed current odds for Redis storage")
    else:
        print("WARNING: No odds records to store")
    
    print(f"COMPLETED! Processed {success_count}/{len(future_events)} events")

if __name__ == "__main__":
    main() 