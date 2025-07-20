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
SPORT_KEY = "baseball_mlb"
REDIS_SPORT_KEY = "mlb"  # Use shorter key for Redis consistency with hit_rate keys
SPORTSBOOKS = "draftkings,fanduel,betmgm,williamhill_us,espnbet,fanatics,hardrockbet,betrivers,novig,ballybet,pinnacle"
MARKETS = (
    "batter_home_runs,batter_home_runs_alternate,"
    "pitcher_record_a_win,pitcher_hits_allowed,pitcher_hits_allowed_alternate,"
    "pitcher_walks,pitcher_walks_alternate,pitcher_earned_runs,pitcher_outs,"
    "batter_strikeouts,batter_total_bases,batter_total_bases_alternate,"
    "batter_singles,batter_doubles,"
    "batter_triples,batter_triples_alternate,batter_walks,"
    "batter_rbis,batter_rbis_alternate,"
    "batter_runs_scored,"
    "batter_hits_runs_rbis,"
    "batter_hits,batter_hits_alternate,"
    "pitcher_strikeouts,pitcher_strikeouts_alternate"
).replace(" ", "")

# Map API markets to our standardized market names
MARKET_NAME_MAP = {
    "batter_hits": "Hits",
    "batter_hits_alternate": "Hits",
    "batter_home_runs": "Home Runs", 
    "batter_home_runs_alternate": "Home Runs",
    "batter_total_bases": "Total Bases",
    "batter_total_bases_alternate": "Total Bases",
    "batter_rbis": "RBIs",
    "batter_rbis_alternate": "RBIs",
    "batter_runs_scored": "Runs",
    "batter_strikeouts": "Batting Strikeouts",
    "batter_walks": "Batting Walks",
    "batter_singles": "Singles",
    "batter_doubles": "Doubles", 
    "batter_triples": "Triples",
    "batter_triples_alternate": "Triples",
    "batter_hits_runs_rbis": "Hits + Runs + RBIs",
    "pitcher_strikeouts": "Strikeouts",
    "pitcher_strikeouts_alternate": "Strikeouts",
    "pitcher_hits_allowed": "Hits Allowed",
    "pitcher_hits_allowed_alternate": "Hits Allowed",
    "pitcher_walks": "Walks",
    "pitcher_walks_alternate": "Walks",
    "pitcher_earned_runs": "Earned Runs",
    "pitcher_outs": "Outs",
    "pitcher_record_a_win": "Pitcher Win"
}

# Determine if a market is alternative based on name
ALTERNATIVE_MARKETS = {
    "batter_hits_alternate", "batter_home_runs_alternate", "batter_total_bases_alternate",
    "batter_rbis_alternate", "pitcher_hits_allowed_alternate", "pitcher_walks_alternate", 
    "pitcher_strikeouts_alternate"
}

ODDS_FORMAT = "american"
BATCH_SIZE = 500  # Database batch insert size

HARDCODED_PLAYER_ID_OVERRIDES = {
    "bobby witt": 677951,
    "brandon nimmo": 607043,
    "cj abrams": 682928,
    "david peterson": 656849,
    "drew waters": 671221,
    "dylan crews": 686611,
    "francisco alvarez": 682626,
    "francisco lindor": 596019,
    "hunter renfroe": 592669,
    "jacob young": 696285,
    "james wood": 695578,
    "jonathan india": 663697,
    "josh bell": 605137,
    "juan soto": 665742,
    "keibert ruiz": 660688,
    "kyle isbel": 664728,
    "luisangel acuna": 682668,
    "mackenzie gore": 669022,
    "maikel garcia": 672580,
    "mark vientos": 668901,
    "michael lorenzen": 547179,
    "michael massey": 686681,
    "nathaniel lowe": 663993,
    "pete alonso": 624413,
    "salvador perez": 521692,
    "starling marte": 516782,
    "tanner bibee": 676440,
    "tyrone taylor": 621438,
    "vinnie pasquantino": 686469,
    "mitchell parker": 680730,
    "brad lord": 695418,
    "michael wacha": 608379,
    "shohei ohtani": 660271,
    "andy pages": 681624,
    "steven kwan": 680757,
    "yainer diaz": 673237,
    "zach dezenzo": 701305,
    "jake meyers": 676694,
    "nolan jones": 666134,
    "alex call": 669743,
    "santiago espinal": 669289,
    "kyle manzardo": 700932,
    "mookie betts": 605141,
    "noelvi marte": 682622,
    "jake irvin": 663623,
    "hayden wesneski": 669713,
    "chris taylor": 621035,
    "brendan rodgers": 663898,
    "luis garcia": 677651,
    "tony gonsolin": 664062,
    "freddie freeman": 518692,
    "jhonkensy noel": 678877,
    "christian walker": 572233,
    "freddy fermin": 666023,
    "riley adams": 656180,
    "seth lugo": 607625,
    "tj friedl": 670770,
    "jose altuve": 514888,
    "isaac paredes": 670623,
    "blake dunn": 694362,
    "will smith": 669257,
    "michael conforto": 624424,
    "jose ramirez": 608070,
}

def normalize_name(name):
    if not name:
        return ""
    name = unicodedata.normalize('NFKD', name)
    name = ''.join(c for c in name if not unicodedata.combining(c))
    name = name.encode('ascii', 'ignore').decode('ascii')
    name = name.replace(".", "").replace(" jr", "").replace(" sr", "")
    name = re.sub(r"\\s+", " ", name).lower().strip()
    return name

def build_player_lookup():
    """Build lookup for player names to player_id and team"""
    players = (
        supabase
        .from_("mlb_players")
        .select("player_id, full_name, mlb_teams(abbreviation)")
        .execute()
        .data
    )
    lookup = {}
    for p in players:
        name = normalize_name(p["full_name"])
        team_data = p.get("mlb_teams") or {}
        lookup[name] = {
            "player_id": p["player_id"],  # Use player_id as the foreign key
            "team_abbreviation": team_data.get("abbreviation")
        }
    return lookup

def match_player(name, lookup):
    """Match player name to our database record"""
    n = normalize_name(name)
    if n in HARDCODED_PLAYER_ID_OVERRIDES:
        # For hardcoded overrides, we need to find the player_id
        player_id = HARDCODED_PLAYER_ID_OVERRIDES[n]
        # Look up the team for this player_id
        for player_data in lookup.values():
            if player_data["player_id"] == player_id:
                return player_data
        # If not found in lookup, create a basic entry
        return {
            "player_id": player_id,
            "team_abbreviation": None
        }
    return lookup.get(n)

def fetch_mlb_events():
    """Fetch upcoming MLB events from the odds API"""
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

class DatabaseBatch:
    """Efficient database batch operations"""
    
    def __init__(self, supabase_client, batch_size=BATCH_SIZE):
        self.supabase = supabase_client
        self.batch_size = batch_size
        self.records = []
    
    def add_record(self, record):
        """Add a record to the batch"""
        self.records.append(record)
        
        if len(self.records) >= self.batch_size:
            self.flush()
    
    def flush(self):
        """Insert all pending records"""
        if not self.records:
            return
            
        try:
            # Use upsert to handle duplicates
            result = (
                self.supabase
                .from_("player_odds_history")
                .upsert(self.records, on_conflict="vendor_event_id,player_id,market,line,sportsbook,created_at")
                .execute()
            )
            
            print(f"✅ Inserted {len(self.records)} odds records")
            self.records.clear()
            
        except Exception as e:
            print(f"❌ Database insert error: {e}")
            # Log the problematic records for debugging
            print(f"Sample record: {self.records[0] if self.records else 'None'}")
            self.records.clear()
            raise
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.flush()

def get_game_mapping_from_redis(event_id):
    """Get mlb_game_id for a vendor event_id from Redis cache"""
    if not redis_client:
        print("WARNING: No Redis client available, cannot get game mapping")
        return None
    
    try:
        # Check if we have this specific event mapping
        redis_key = f"odds:mlb:{event_id}"
        cached_data = redis_client.get(redis_key)
        
        if cached_data:
            game_data = json.loads(cached_data)
            mlb_game_id = game_data.get("mlb_game_id")
            if mlb_game_id:
                print(f"Found Redis mapping: event {event_id} -> mlb_game_id {mlb_game_id}")
                return {
                    "mlb_game_id": int(mlb_game_id),
                    "home_team": game_data.get("home_team", {}).get("name", ""),
                    "away_team": game_data.get("away_team", {}).get("name", ""),
                    "home_team_abbr": game_data.get("home_team", {}).get("abbreviation", ""),
                    "away_team_abbr": game_data.get("away_team", {}).get("abbreviation", ""),
                    "commence_time": game_data.get("commence_time", "")
                }
        
        print(f"No Redis mapping found for event {event_id}")
        return None
        
    except Exception as e:
        print(f"Error getting Redis mapping for event {event_id}: {e}")
        return None

def get_game_mapping_fallback(event_id, db_games):
    """Fallback: try to match directly to mlb_games table (original logic)"""
    print(f"Attempting fallback matching for event {event_id}")
    # We can keep the original matching logic as fallback if needed
    # For now, just return None to skip unmatched events
    return None

def get_base_market_api_key(market_display_name, is_alternative):
    """Get the base API key (without _alternate suffix) for grouping"""
    # Find the API key that maps to this display name
    for api_key, mapped_name in MARKET_NAME_MAP.items():
        if mapped_name == market_display_name:
            # Remove _alternate suffix to get base key
            if api_key.endswith('_alternate'):
                return api_key.replace('_alternate', '')
            else:
                return api_key
    
    # Fallback
    return market_display_name.lower().replace(' ', '_')

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
    """Group records by player+market (combining standard and alternate) and store in Redis"""
    if not redis_client:
        print("WARNING: No Redis client available, skipping current odds storage")
        return
        
    print(f"📊 Processing {len(records)} records for Redis current odds storage...")
    
    # Group records by player_id + base_market (without _alternate suffix)
    grouped_odds = {}
    
    for record in records:
        # Use the display name directly (this is already the standardized display name)
        market_display_name = record['market']
        
        key = f"{record['player_id']}_{market_display_name}"
        
        if key not in grouped_odds:
            grouped_odds[key] = {
                'player_id': record['player_id'],
                'description': record['player_name'],
                'team': record['team'],
                'market': market_display_name,  # Use display name (like "Outs", "Total Bases")
                'event_id': record['vendor_event_id'],
                'home_team': record['home_team'],
                'away_team': record['away_team'],
                'commence_time': record['commence_time'],
                'lines': {},
                'has_alternates': False
            }
        
        # Track if we've seen alternate lines
        if record['is_alternative']:
            grouped_odds[key]['has_alternates'] = True
        
        line_str = str(record['line'])
        sportsbook = record['sportsbook']
        
        # Initialize line if not exists
        if line_str not in grouped_odds[key]['lines']:
            grouped_odds[key]['lines'][line_str] = {}
            
        # Initialize sportsbook if not exists
        if sportsbook not in grouped_odds[key]['lines'][line_str]:
            grouped_odds[key]['lines'][line_str][sportsbook] = {
                'over': None,
                'under': None
            }
        
        # Add over/under prices
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
        # Convert market to lowercase to match hit_rate keys exactly
        redis_key = f"odds:{REDIS_SPORT_KEY}:{odds_data['player_id']}:{odds_data['market'].lower()}"
        
        # Add primary line detection (considering all lines together)
        odds_data['primary_line'] = determine_primary_line(odds_data['lines'], odds_data['has_alternates'])
        odds_data['last_updated'] = datetime.now(timezone.utc).isoformat()
        
        # Store with 1.5 hour TTL (5400 seconds)
        try:
            redis_client.setex(redis_key, 10800 , json.dumps(odds_data))
            stored_count += 1
            print(f"✅ Stored Redis odds: {redis_key} ({len(odds_data['lines'])} lines)")
        except Exception as e:
            print(f"❌ Redis storage error for {redis_key}: {e}")
    
    print(f"📊 Successfully stored {stored_count} player+market combinations in Redis")

def process_event_odds(event_props, player_lookup):
    """Process odds for a single event and return database records"""
    vendor_event_id = event_props.get("id")
    
    print(f"PROCESSING event {vendor_event_id}")
    
    # Try to get game mapping from Redis first
    game_match = get_game_mapping_from_redis(vendor_event_id)
    
    if not game_match:
        print(f"WARNING: No matching game found for vendor event {vendor_event_id}")
        return []
    
    mlb_game_id = game_match["mlb_game_id"]
    home_team = game_match["home_team"]
    away_team = game_match["away_team"]
    home_team_abbr = game_match["home_team_abbr"]
    away_team_abbr = game_match["away_team_abbr"]
    commence_time = game_match["commence_time"]
    
    print(f"SUCCESS: Matched to mlb_game_id {mlb_game_id}: {away_team} @ {home_team}")
    print(f"Team abbreviations: {away_team_abbr} @ {home_team_abbr}")
    
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
                    continue  # Skip if we can't match the player
                
                player_id = player_match["player_id"]
                team_abbr = player_match.get("team_abbreviation")
                
                # Skip players without team abbreviation (database constraint)
                if not team_abbr:
                    print(f"⚠️ Skipping {player_name} (player_id: {player_id}) - no team abbreviation")
                    continue
                
                # Fix is_home logic to compare abbreviations correctly
                is_home = None
                if team_abbr:
                    is_home = team_abbr == home_team_abbr
                
                line = outcome.get("point")
                over_under = outcome.get("name", "").lower()
                price = outcome.get("price")
                link = outcome.get("link")
                sid = outcome.get("sid")
                
                if not line or not over_under or price is None:
                    continue
                
                # Find existing record for this player/market/line/sportsbook combination
                existing_record = None
                for record in records:
                    if (record["player_id"] == player_id and 
                        record["market"] == market_display_name and
                        record["line"] == float(line) and
                        record["sportsbook"] == sportsbook):
                        existing_record = record
                        break
                
                # Create new record if doesn't exist
                if not existing_record:
                    existing_record = {
                        "vendor_event_id": vendor_event_id,
                        "vendor_name": "the-odds-api",
                        "player_id": player_id,
                        "player_name": player_name,
                        "mlb_game_id": mlb_game_id,
                        "market": market_display_name,
                        "line": float(line),
                        "team": team_abbr,
                        "is_home": is_home,
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
    print("STARTING database odds import...")
    
    # Build player lookup table
    player_lookup = build_player_lookup()
    print(f"Loaded {len(player_lookup)} players")
    
    # Fetch upcoming events from odds API
    events = fetch_mlb_events()
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
            
            # Process into database records (now uses Redis for game mapping)
            records = process_event_odds(event_odds, player_lookup)
            
            # Add to collection
            all_records.extend(records)
            success_count += 1
            
        except Exception as e:
            print(f"WARNING: Failed to process event {event['id']}: {e}")
    
    # Store all records in database
    if all_records:
        with DatabaseBatch(supabase) as batch:
            for record in all_records:
                batch.add_record(record)
        print(f"SUCCESS: Successfully stored {len(all_records)} odds records in database")
        
        # NEW: Store current odds in Redis
        store_current_odds_in_redis(all_records)
        print(f"SUCCESS: Processed current odds for Redis storage")
    else:
        print("WARNING: No odds records to store")
    
    print(f"COMPLETED! Processed {success_count}/{len(future_events)} events")

if __name__ == "__main__":
    main()