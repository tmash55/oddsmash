import os
import requests
import redis
import unicodedata
import re
import json
from datetime import datetime, timezone, timedelta
from supabase import create_client

# ── ENV VARS ────────────────────────────────────────────────────
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
ODDS_API_KEY = os.environ["ODDS_API_KEY"]
ODDS_API_BASE_URL = os.environ["ODDS_API_BASE_URL"]
UPSTASH_TOKEN = os.environ["UPSTASH_REDIS_REST_TOKEN"]

# ── INIT CLIENTS ─────────────────────────────────────────
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
redis_client = redis.Redis(
    host='finer-basilisk-19142.upstash.io',
    port=6379,
    password=UPSTASH_TOKEN,
    ssl=True
)

# ── SETTINGS ──────────────────────────────
SPORT_KEY = "baseball_mlb"
SPORTSBOOKS = "draftkings,fanduel,betmgm,williamhill_us,espnbet,fanatics,hardrockbet,betrivers"
MARKETS = (
    "batter_home_runs,batter_home_runs_alternate,"
    "pitcher_record_a_win,pitcher_hits_allowed,pitcher_hits_allowed_alternate,"
    "pitcher_walks,pitcher_walks_alternate,pitcher_earned_runs,pitcher_outs,"
    "batter_strikeouts,batter_total_bases,batter_total_bases_alternate,"
    "batter_singles,batter_doubles,"
    "batter_triples,batter_walks,"
    "batter_rbis,batter_rbis_alternate,"
    "batter_runs_scored,"
    "batter_hits_runs_rbis,"
    "batter_hits,batter_hits_alternate,"
    "pitcher_strikeouts,pitcher_strikeouts_alternate"
).replace(" ", "")

# Map alternate markets to their base market for consolidated storage
MARKET_CONSOLIDATION_MAP = {
    "batter_hits_alternate": "batter_hits",
    "batter_home_runs_alternate": "batter_home_runs", 
    "batter_total_bases_alternate": "batter_total_bases",
    "batter_rbis_alternate": "batter_rbis",
    "pitcher_hits_allowed_alternate": "pitcher_hits_allowed",
    "pitcher_walks_alternate": "pitcher_walks",
    "pitcher_strikeouts_alternate": "pitcher_strikeouts"
}

def get_consolidated_market_key(market_key):
    """Get the base market key for consolidated storage"""
    return MARKET_CONSOLIDATION_MAP.get(market_key, market_key)

ODDS_FORMAT = "american"

# Cache TTL settings (in seconds)
PLAYER_ODDS_TTL = 48 * 3600  # 48 hours for player odds
EVENT_ODDS_TTL = 48 * 3600   # 48 hours for event odds
BATCH_SIZE = 50              # Redis pipeline batch size

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
    "brad lord":695418,
    "michael wacha":608379,
    "shohei ohtani":660271,
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
    "luis garcia": 677651,         # Normalized from "Luis Garcia Jr."
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
    "josé ramírez":608070,

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
            "player_id": p["player_id"],
            "team_abbreviation": team_data.get("abbreviation")
        }
    return lookup

def match_player(name, lookup):
    n = normalize_name(name)
    if n in HARDCODED_PLAYER_ID_OVERRIDES:
        return {
            "player_id": HARDCODED_PLAYER_ID_OVERRIDES[n],
            "team_abbreviation": None
        }
    return lookup.get(n)

def fetch_mlb_events():
    url = f"{ODDS_API_BASE_URL}/sports/{SPORT_KEY}/events?apiKey={ODDS_API_KEY}"
    return requests.get(url).json()

def fetch_props_for_event(event_id):
    url = f"{ODDS_API_BASE_URL}/sports/{SPORT_KEY}/events/{event_id}/odds"
    params = {
        "apiKey": ODDS_API_KEY,
        "markets": MARKETS,
        "oddsFormat": ODDS_FORMAT,
        "bookmakers": SPORTSBOOKS,
        "includeSids": "true",
        "includeLinks": "true"
    }
    return requests.get(url, params=params).json()

def json_dumps(data):
    return json.dumps(data, default=str, separators=(",", ":"))

def json_loads(data):
    """Safely load JSON data"""
    if isinstance(data, bytes):
        data = data.decode('utf-8')
    return json.loads(data) if data else None

class RedisBatch:
    """Efficient Redis batch operations with pipeline"""
    
    def __init__(self, redis_client, batch_size=BATCH_SIZE):
        self.redis_client = redis_client
        self.batch_size = batch_size
        self.operations = []
    
    def set_with_ttl(self, key, data, ttl_seconds):
        """Add a set operation with TTL to the batch"""
        self.operations.append(('setex', key, ttl_seconds, json_dumps(data)))
        
        if len(self.operations) >= self.batch_size:
            self.flush()
    
    def get_batch(self, keys):
        """Get multiple keys efficiently"""
        if not keys:
            return {}
            
        pipe = self.redis_client.pipeline()
        for key in keys:
            pipe.get(key)
        
        results = pipe.execute()
        return {key: json_loads(result) for key, result in zip(keys, results) if result}
    
    def flush(self):
        """Execute all pending operations"""
        if not self.operations:
            return
            
        pipe = self.redis_client.pipeline()
        for op in self.operations:
            command, *args = op
            getattr(pipe, command)(*args)
        
        pipe.execute()
        print(f"✅ Flushed {len(self.operations)} Redis operations")
        self.operations.clear()
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.flush()

def get_existing_player_data(player_keys, redis_batch):
    """Efficiently fetch existing player data"""
    return redis_batch.get_batch(player_keys)

def cache_props(event_props, player_lookup):
    event_id = event_props.get("id")
    home_team = event_props.get("home_team")
    away_team = event_props.get("away_team")
    commence_time = event_props.get("commence_time")
    last_updated = datetime.now(timezone.utc).isoformat()
    
    print(f"📊 Processing event {event_id}: {away_team} @ {home_team}")

    event_cache = {
        "event_id": event_id,
        "sport_key": SPORT_KEY,
        "commence_time": commence_time,
        "home_team": home_team,
        "away_team": away_team,
        "markets": {},
        "last_updated": last_updated
    }

    # Collect all player keys that we'll need to check
    player_keys_to_check = set()
    player_data_map = {}
    consolidation_stats = {}
    
    # First pass: collect all player keys and build data map
    for bookmaker in event_props.get("bookmakers", []):
        book = bookmaker.get("title", "").lower()
        for market in bookmaker.get("markets", []):
            market_key = market.get("key")
            # Get the consolidated market key (combines regular + alternate)
            consolidated_market_key = get_consolidated_market_key(market_key)
            
            # Track consolidation stats
            if consolidated_market_key != market_key:
                if consolidated_market_key not in consolidation_stats:
                    consolidation_stats[consolidated_market_key] = []
                consolidation_stats[consolidated_market_key].append(market_key)
            
            for outcome in market.get("outcomes", []):
                name = outcome.get("description")
                player_match = match_player(name, player_lookup)
                if not player_match:
                    continue
                
                player_id = player_match["player_id"]
                # Use consolidated market key for storage
                player_key = f"odds:mlb:{event_id}:{player_id}:{consolidated_market_key}"
                player_keys_to_check.add(player_key)
                
                # Store outcome data for processing
                if player_key not in player_data_map:
                    player_data_map[player_key] = {
                        "player_id": player_id,
                        "name": name,
                        "market_key": consolidated_market_key,  # Use consolidated key
                        "original_market_key": market_key,      # Keep original for tracking
                        "team_abbr": player_match["team_abbreviation"],
                        "outcomes": []
                    }
                
                player_data_map[player_key]["outcomes"].append({
                    "book": book,
                    "line": outcome.get("point"),
                    "over_under": outcome.get("name"),
                    "sid": outcome.get("sid"),
                    "link": outcome.get("link"),
                    "price": outcome.get("price"),
                    "original_market": market_key  # Track which market this came from
                })

    # Use batch operations for efficiency
    with RedisBatch(redis_client) as batch:
        # Fetch existing player data efficiently
        existing_data = get_existing_player_data(list(player_keys_to_check), batch)
        
        # Process each player's data
        for player_key, player_info in player_data_map.items():
            player_id = player_info["player_id"]
            name = player_info["name"]
            market_key = player_info["market_key"]
            team_abbr = player_info["team_abbr"]
            is_home = team_abbr == home_team
            
            # Get existing entry or create new one
            entry = existing_data.get(player_key)
            if entry:
                entry["last_updated"] = last_updated
            else:
                entry = {
                    "description": name,
                    "market": market_key,  # Use the consolidated base market key
                    "player_id": player_id,
                    "lines": [],
                    "event_id": event_id,
                    "team": team_abbr,
                    "is_home": is_home,
                    "last_updated": last_updated
                }
            
            # Process outcomes for this player
            for outcome in player_info["outcomes"]:
                book = outcome["book"]
                line = outcome["line"]
                over_under = outcome["over_under"]
                sid = outcome["sid"]
                link = outcome["link"]
                price = outcome["price"]
                
                # Find or create line entry
                line_entry = next((l for l in entry["lines"] if l["line"] == line), None)
                if not line_entry:
                    line_entry = {"line": line, "sportsbooks": {}}
                    entry["lines"].append(line_entry)
                
                # Initialize sportsbook entry
                line_entry["sportsbooks"].setdefault(book, {})
                
                # Add over/under data
                if over_under and over_under.lower() in ["over", "under"]:
                    line_entry["sportsbooks"][book][over_under.lower()] = {
                        "price": price,
                        "link": link,
                        "sid": sid,
                        "last_update": last_updated
                    }
                
                # Add to event-level cache
                if market_key not in event_cache["markets"]:
                    event_cache["markets"][market_key] = {"players": []}
                
                player_event_entry = next(
                    (p for p in event_cache["markets"][market_key]["players"] if p["player_id"] == player_id), None
                )
                if not player_event_entry:
                    player_event_entry = {
                        "player_id": player_id,
                        "name": name,
                        "team": team_abbr,
                        "is_home": is_home,
                        "lines": []
                    }
                    event_cache["markets"][market_key]["players"].append(player_event_entry)
                
                line_event_entry = next((l for l in player_event_entry["lines"] if l["line"] == line), None)
                if not line_event_entry:
                    line_event_entry = {"line": line, "sportsbooks": {}}
                    player_event_entry["lines"].append(line_event_entry)
                
                line_event_entry["sportsbooks"].setdefault(book, {})
                if over_under and over_under.lower() in ["over", "under"]:
                    line_event_entry["sportsbooks"][book][over_under.lower()] = {
                        "price": price,
                        "link": link,
                        "sid": sid,
                        "last_update": last_updated
                    }
            
            # Add player entry to batch with TTL
            batch.set_with_ttl(player_key, entry, PLAYER_ODDS_TTL)
        
        # Add event cache to batch with TTL
        event_key = f"odds:mlb:{event_id}:player_props"
        batch.set_with_ttl(event_key, event_cache, EVENT_ODDS_TTL)
    
    # Log consolidation stats
    if consolidation_stats:
        print(f"🔄 Market consolidations for event {event_id}:")
        for base_market, alternate_markets in consolidation_stats.items():
            print(f"   {base_market} ← {', '.join(alternate_markets)}")
    
    print(f"✅ Cached odds for event {event_id} ({len(player_data_map)} consolidated player keys)")

def cleanup_expired_keys():
    """Optional: Clean up any keys that might have expired but not been removed"""
    try:
        # Get all odds keys
        pattern = "odds:mlb:*"
        keys = redis_client.keys(pattern)
        
        if keys:
            # Check which ones exist (non-expired)
            pipe = redis_client.pipeline()
            for key in keys:
                pipe.ttl(key)
            ttls = pipe.execute()
            
            expired_keys = [key for key, ttl in zip(keys, ttls) if ttl == -2]  # -2 means expired
            if expired_keys:
                redis_client.delete(*expired_keys)
                print(f"🧹 Cleaned up {len(expired_keys)} expired keys")
    except Exception as e:
        print(f"⚠️ Cleanup error: {e}")

def main():
    print("🚀 Starting optimized odds caching...")
    
    # Optional cleanup
    cleanup_expired_keys()
    
    player_lookup = build_player_lookup()
    print(f"📝 Loaded {len(player_lookup)} players")
    
    events = fetch_mlb_events()
    now = datetime.now(timezone.utc)
    future_events = [
        e for e in events
        if now <= datetime.fromisoformat(e["commence_time"].replace("Z", "+00:00")) <= now + timedelta(hours=36)
    ]
    
    print(f"🎯 Processing {len(future_events)} upcoming events")
    
    success_count = 0
    for i, e in enumerate(future_events, 1):
        try:
            print(f"[{i}/{len(future_events)}] Processing event {e['id']}...")
            props = fetch_props_for_event(e["id"])
            cache_props(props, player_lookup)
            success_count += 1
        except Exception as err:
            print(f"⚠️ Failed for event {e['id']}: {err}")
    
    print(f"✅ Completed! Successfully cached {success_count}/{len(future_events)} events")
    print(f"📊 Cache TTL: {PLAYER_ODDS_TTL/3600}h for player odds, {EVENT_ODDS_TTL/3600}h for events")

if __name__ == "__main__":
    main() 