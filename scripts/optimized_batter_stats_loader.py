import sys
import os
import requests
from datetime import datetime, timezone, timedelta
import unicodedata
import re
from supabase import create_client
import concurrent.futures
from typing import List, Dict, Any
import time

# Use Pipedream environment variables
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
ODDS_API_KEY = os.environ["ODDS_API_KEY"]
ODDS_API_BASE_URL = os.environ["ODDS_API_BASE_URL"]

# Initialize a single client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ============= OPTIMIZED DATABASE OPERATIONS =============

def batch_upsert(table: str, data: List[Dict], batch_size: int = 1000):
    """Batch upsert rows into Supabase table for better performance."""
    if not data:
        return []
    
    results = []
    total_batches = (len(data) + batch_size - 1) // batch_size
    
    for i in range(0, len(data), batch_size):
        batch = data[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        
        try:
            print(f"  📦 Upserting batch {batch_num}/{total_batches} ({len(batch)} records)")
            response = supabase.table(table).upsert(
                batch,
                on_conflict="league_id,player_id,market,line,sportsbook,odds_event_id"
            ).execute()
            
            if response.data:
                results.extend(response.data)
                
        except Exception as e:
            print(f"  ❌ Error in batch {batch_num}: {e}")
            # Try individual inserts as fallback
            for record in batch:
                try:
                    response = supabase.table(table).upsert([record]).execute()
                    if response.data:
                        results.extend(response.data)
                except Exception as individual_error:
                    print(f"    ❌ Failed individual record: {individual_error}")
    
    return results

def fetch_players_cached():
    """Fetch players with basic caching logic."""
    cache_file = "/tmp/mlb_players_cache.txt" if os.path.exists("/tmp") else "mlb_players_cache.txt"
    cache_duration = 3600  # 1 hour
    
    # Check if cache exists and is fresh
    if os.path.exists(cache_file):
        cache_age = time.time() - os.path.getmtime(cache_file)
        if cache_age < cache_duration:
            print("📋 Using cached player data")
            try:
                import json
                with open(cache_file, 'r') as f:
                    return json.load(f)
            except:
                pass  # Fall through to fresh fetch
    
    # Fetch fresh data
    print("🔄 Fetching fresh player data from database")
    response = supabase.table("mlb_players").select("player_id, full_name").execute()
    players = response.data
    
    if not players:
        raise Exception("No players fetched from mlb_players table.")
    
    # Cache the data
    try:
        import json
        with open(cache_file, 'w') as f:
            json.dump(players, f)
    except:
        pass  # Cache write failed, but continue
    
    print(f"✅ Fetched {len(players)} players from database")
    return players

# ============= PLAYER MATCHING =============

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
    "josé ramírez": 608070,
}

def normalize_name(name):
    """Fully normalize player names."""
    if not name:
        return ""
    name = unicodedata.normalize('NFKD', name)
    name = ''.join(c for c in name if not unicodedata.combining(c))
    name = name.encode('ascii', 'ignore').decode('ascii')
    name = name.replace("\u200b", "").replace("\xa0", " ")
    name = name.lower().replace(".", "").replace(" jr", "").replace(" sr", "")
    name = re.sub(r"\s+", " ", name).strip()
    return name

def build_player_lookup(players):
    """Build a normalized name-to-id lookup dictionary."""
    lookup = {}
    for player in players:
        name = normalize_name(player["full_name"])
        lookup[name] = player["player_id"]
    print(f"🔗 Built player lookup with {len(lookup)} entries")
    return lookup

def match_player_id(player_name, lookup):
    """Match player name to ID with fallback logic."""
    if not player_name:
        return None

    normalized_name = normalize_name(player_name)

    # Check overrides first
    if normalized_name in HARDCODED_PLAYER_ID_OVERRIDES:
        return HARDCODED_PLAYER_ID_OVERRIDES[normalized_name]

    # Normal lookup
    player_id = lookup.get(normalized_name)
    if player_id:
        return player_id

    # Partial fallback (for debugging - can be removed in production)
    for key in lookup.keys():
        if normalized_name in key or key in normalized_name:
            print(f"🔍 Partial match: {player_name} --> {key}")
            return lookup[key]

    # No match
    print(f"❌ No match for {player_name} (normalized: {normalized_name})")
    return None

# ============= API SETTINGS =============

SPORT_KEY = "baseball_mlb"
SPORTSBOOKS = "draftkings,fanduel,betmgm,williamhill_us,espnbet,fanatics,hardrockbet,betrivers"
MARKETS = (
    "batter_singles,batter_doubles,"
    "batter_triples,batter_walks,batter_strikeouts,"
    "batter_rbis,batter_rbis_alternate"
)

MARKET_NAME_MAP = {
    "batter_singles": "Singles",
    "batter_doubles": "Doubles",
    "batter_triples": "Triples",
    "batter_walks": "Batter Walks",
    "batter_strikeouts": "Batter Strikeouts",
    "batter_rbis": "RBIs",
    "batter_rbis_alternate": "RBIs",
}

ODDS_FORMAT = "american"

# ============= CONCURRENT API CALLS =============

def fetch_mlb_events():
    """Fetch today's MLB games."""
    url = f"{ODDS_API_BASE_URL}/sports/{SPORT_KEY}/events?apiKey={ODDS_API_KEY}"
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    events = response.json()
    print(f"⚾ Fetched {len(events)} MLB events")
    return events

def fetch_props_for_event(event_id):
    """Fetch batter stats props for a single event."""
    url = f"{ODDS_API_BASE_URL}/sports/{SPORT_KEY}/events/{event_id}/odds"
    params = {
        "apiKey": ODDS_API_KEY,
        "markets": MARKETS,
        "oddsFormat": ODDS_FORMAT,
        "bookmakers": SPORTSBOOKS,
        "includeSids": "true",
        "includeLinks": "true"
    }
    
    try:
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        return event_id, response.json()
    except Exception as e:
        print(f"❌ Failed to fetch props for event {event_id}: {e}")
        return event_id, None

def fetch_all_props_concurrent(event_ids: List[str], max_workers: int = 5):
    """Fetch props for multiple events concurrently."""
    print(f"🚀 Fetching batter stats props for {len(event_ids)} events with {max_workers} workers")
    
    results = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all requests
        future_to_event = {
            executor.submit(fetch_props_for_event, event_id): event_id 
            for event_id in event_ids
        }
        
        # Collect results as they complete
        for future in concurrent.futures.as_completed(future_to_event):
            event_id = future_to_event[future]
            try:
                event_id_result, event_props = future.result()
                if event_props:
                    results[event_id_result] = event_props
                    print(f"  ✅ Fetched props for event {event_id_result}")
                else:
                    print(f"  ❌ No props for event {event_id}")
            except Exception as e:
                print(f"  ❌ Exception for event {event_id}: {e}")
    
    print(f"📊 Successfully fetched props for {len(results)}/{len(event_ids)} events")
    return results

# ============= OPTIMIZED DATA PROCESSING =============

def parse_all_props(all_event_props: Dict[str, Any], player_lookup: Dict[str, int]):
    """Parse batter stats props from all events and collect into a single batch."""
    all_props = []
    league_id = 1  # MLB
    fetched_at = datetime.now(timezone.utc).isoformat()
    
    total_unmatched_players = set()
    
    for event_id, event_props in all_event_props.items():
        if not event_props:
            continue
            
        commence_time = event_props.get("commence_time")
        home_team = event_props.get("home_team")
        away_team = event_props.get("away_team")
        
        print(f"🏟️  Processing {away_team} @ {home_team}")
        
        # Track props for this event
        event_player_props = {}
        unmatched_players_this_event = set()
        
        for bookmaker in event_props.get("bookmakers", []):
            sportsbook = bookmaker["title"]
            
            for market in bookmaker.get("markets", []):
                market_key = market["key"]
                market_name = MARKET_NAME_MAP.get(market_key, market_key)
                
                for outcome in market.get("outcomes", []):
                    player_name = outcome.get("description")
                    line = outcome.get("point")
                    price = outcome.get("price")
                    over_under = outcome.get("name")
                    sid = outcome.get("sid")
                    link = outcome.get("link")
                    
                    pid = match_player_id(player_name, player_lookup)
                    if not pid:
                        unmatched_players_this_event.add(player_name)
                        total_unmatched_players.add(player_name)
                        continue
                    
                    # Group by (player, market, line, sportsbook)
                    key = (pid, market_name, line, sportsbook)
                    if key not in event_player_props:
                        event_player_props[key] = {
                            "league_id": league_id,
                            "player_id": pid,
                            "player_name": player_name,
                            "market": market_name,
                            "line": line,
                            "sportsbook": sportsbook,
                            "is_alternate": market_key.endswith("_alternate"),
                            "fetched_at": fetched_at,
                            "commence_time": commence_time,
                            "odds_event_id": event_id,
                            "home_team": home_team,
                            "away_team": away_team,
                            "over_odds": None, "over_sid": None, "over_link": None,
                            "under_odds": None, "under_sid": None, "under_link": None,
                        }
                    
                    entry = event_player_props[key]
                    if over_under == "Over":
                        entry.update({"over_odds": price, "over_sid": sid, "over_link": link})
                    else:  # Under
                        entry.update({"under_odds": price, "under_sid": sid, "under_link": link})
        
        # Add this event's props to the total
        all_props.extend(event_player_props.values())
        
        # Summary for this event
        matched_props = len(event_player_props)
        unmatched_count = len(unmatched_players_this_event)
        print(f"  📊 Processed {matched_props} props, {unmatched_count} unmatched players")
        
        if unmatched_players_this_event and len(unmatched_players_this_event) <= 5:
            print(f"  🔍 Unmatched: {', '.join(list(unmatched_players_this_event)[:5])}")
    
    # Final summary
    print(f"\n🎯 TOTALS:")
    print(f"  📦 Props to upsert: {len(all_props)}")
    print(f"  ❌ Total unmatched players: {len(total_unmatched_players)}")
    
    if total_unmatched_players and len(total_unmatched_players) <= 10:
        print(f"  🔍 Sample unmatched: {', '.join(list(total_unmatched_players)[:10])}")
    
    return all_props

# ============= MAIN EXECUTION =============

def main():
    start_time = time.time()
    print("🚀 Starting optimized MLB batter stats loader...")
    print(f"📋 Target markets: {', '.join(MARKET_NAME_MAP.values())}")
    
    # 1. Fetch players (with caching)
    players = fetch_players_cached()
    player_lookup = build_player_lookup(players)
    
    # 2. Fetch events
    events = fetch_mlb_events()
    
    # 3. Filter future events
    now = datetime.now(timezone.utc)
    window_hours = 36
    latest = now + timedelta(hours=window_hours)
    
    future_events = []
    for event in events:
        commence_time = datetime.fromisoformat(event["commence_time"].replace("Z", "+00:00"))
        if now <= commence_time <= latest:
            future_events.append(event)
    
    print(f"🎯 Found {len(future_events)} upcoming events in next {window_hours} hours")
    
    if not future_events:
        print("❌ No future MLB events found to process.")
        return
    
    # 4. Fetch all props concurrently
    event_ids = [event["id"] for event in future_events]
    all_event_props = fetch_all_props_concurrent(event_ids, max_workers=5)
    
    if not all_event_props:
        print("❌ No event props fetched successfully.")
        return
    
    # 5. Parse all props into a single batch
    all_props = parse_all_props(all_event_props, player_lookup)
    
    if not all_props:
        print("❌ No props parsed from events.")
        return
    
    # 6. Batch upsert to database
    print(f"\n💾 Starting batch upsert of {len(all_props)} batter stats props...")
    results = batch_upsert("player_prop_odds", all_props, batch_size=500)
    
    # 7. Summary
    end_time = time.time()
    duration = end_time - start_time
    
    print(f"\n✅ COMPLETED in {duration:.2f} seconds!")
    print(f"📊 Successfully processed {len(results)} props from {len(all_event_props)} events")
    print(f"⚡ Average: {len(results)/duration:.1f} props/second")
    print(f"🎯 Markets processed: {', '.join(MARKET_NAME_MAP.values())}")

if __name__ == "__main__":
    main() 