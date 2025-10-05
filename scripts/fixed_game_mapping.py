#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import requests
import redis
from datetime import datetime, timezone
from difflib import SequenceMatcher
from supabase import create_client

# ENV VARS
ODDS_API_KEY = os.environ["ODDS_API_KEY"]
ODDS_API_BASE_URL = os.environ["ODDS_API_BASE_URL"]
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
UPSTASH_URL = os.environ["UPSTASH_REDIS_REST_URL"]
UPSTASH_TOKEN = os.environ["UPSTASH_REDIS_REST_TOKEN"]

# SETUP
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
TEAM_LOOKUP = {
    t["team_id"]: t["abbreviation"]
    for t in supabase.table("mlb_teams").select("team_id, abbreviation").execute().data
}

if not UPSTASH_URL or not UPSTASH_TOKEN:
    raise ValueError("Missing Upstash Redis credentials.")

redis_client = redis.Redis(
    host=UPSTASH_URL.replace("https://", "").split(":")[0],
    port=6379,
    password=UPSTASH_TOKEN,
    ssl=True
)

SPORT_KEY = "baseball_mlb"

# HELPERS
def normalize(name):
    return name.lower().replace("é", "e").replace("socks", "sox").replace(" ", "")

def similar(a, b):
    return SequenceMatcher(None, normalize(a), normalize(b)).ratio()

def fetch_vendor_events():
    url = f"{ODDS_API_BASE_URL}/sports/{SPORT_KEY}/events?apiKey={ODDS_API_KEY}"
    return requests.get(url).json()

def fetch_mlb_schedule():
    today = datetime.today().strftime("%Y-%m-%d")
    url = f"https://statsapi.mlb.com/api/v1/schedule?sportId=1&date={today}"
    return requests.get(url).json()

def get_mlb_games_from_db():
    """Get games from your mlb_games table to find the correct game_id"""
    today = datetime.today()
    # Get games for today and next few days
    games = (
        supabase
        .from_("mlb_games")
        .select("game_id, game_datetime, home_name, away_name")
        .gte("game_datetime", today.strftime("%Y-%m-%d"))
        .execute()
        .data
    )
    return games

def find_best_mlb_match(vendor_event, mlb_games, db_games):
    """Match vendor event to MLB StatsAPI game, then to database game"""
    event_home = vendor_event["home_team"]
    event_away = vendor_event["away_team"]
    event_time = datetime.fromisoformat(vendor_event["commence_time"].replace("Z", "+00:00"))

    # First, find the best match in MLB StatsAPI
    candidates = []
    for game in mlb_games:
        g_home = game["teams"]["home"]["team"]["name"]
        g_away = game["teams"]["away"]["team"]["name"]
        g_time = datetime.fromisoformat(game["gameDate"])
        name_score = (similar(event_home, g_home) + similar(event_away, g_away)) / 2
        time_diff = abs((event_time - g_time).total_seconds()) / 60

        if name_score > 0.7 and time_diff < 90:
            candidates.append((name_score, -time_diff, game))

    if not candidates:
        return None, None
        
    # Get the best MLB game match
    candidates.sort(reverse=True)
    mlb_game = candidates[0][2]
    mlb_game_pk = mlb_game["gamePk"]
    
    # Now find the corresponding game in our database
    mlb_home = mlb_game["teams"]["home"]["team"]["name"]
    mlb_away = mlb_game["teams"]["away"]["team"]["name"]
    mlb_time = datetime.fromisoformat(mlb_game["gameDate"])
    
    # Match to database game by team names and time
    for db_game in db_games:
        db_home = db_game.get("home_name", "")
        db_away = db_game.get("away_name", "")
        db_time = datetime.fromisoformat(db_game["game_datetime"].replace("Z", "+00:00"))
        
        # Check similarity between MLB game and database game
        home_match = similar(mlb_home, db_home) > 0.7 or similar(event_home, db_home) > 0.7
        away_match = similar(mlb_away, db_away) > 0.7 or similar(event_away, db_away) > 0.7
        time_match = abs((mlb_time - db_time).total_seconds()) < 3 * 3600  # 3 hours tolerance
        
        if home_match and away_match and time_match:
            print(f"✅ Found database match: {db_away} @ {db_home} -> game_id {db_game['game_id']}")
            return mlb_game, db_game
    
    print(f"⚠️ MLB game found but no database game match for {mlb_away} @ {mlb_home}")
    return mlb_game, None

def main():
    vendor_events = fetch_vendor_events()
    mlb_data = fetch_mlb_schedule()
    mlb_games = [g for d in mlb_data["dates"] for g in d["games"]]
    db_games = get_mlb_games_from_db()
    today_str = datetime.today().strftime("%Y-%m-%d")

    print(f"\n📦 Fetched {len(vendor_events)} vendor events")
    print(f"📅 Fetched {len(mlb_games)} MLB scheduled games from StatsAPI")
    print(f"🗃️ Fetched {len(db_games)} games from mlb_games table")

    final_games = {}
    unmatched = []

    for event in vendor_events:
        event_id = event["id"]
        event_time = datetime.fromisoformat(event["commence_time"].replace("Z", "+00:00"))

        mlb_game, db_game = find_best_mlb_match(event, mlb_games, db_games)
        
        if not mlb_game or not db_game:
            unmatched.append(event)
            continue

        # Use the database game_id instead of MLB gamePk
        home_team_id = mlb_game["teams"]["home"]["team"]["id"]
        away_team_id = mlb_game["teams"]["away"]["team"]["id"]
        mlb_game_pk = mlb_game["gamePk"]  # Keep for reference
        db_game_id = db_game["game_id"]   # Use this for foreign key
        
        mlb_time = datetime.fromisoformat(mlb_game["gameDate"])
        time_diff = abs((event_time - mlb_time).total_seconds()) / 60

        merged = {
            "sport_key": SPORT_KEY,
            "event_id": event_id,
            "commence_time": event["commence_time"],
            "home_team": {
                "name": event["home_team"],
                "abbreviation": TEAM_LOOKUP.get(home_team_id, "UNK")
            },
            "away_team": {
                "name": event["away_team"],
                "abbreviation": TEAM_LOOKUP.get(away_team_id, "UNK")
            },
            "mlb_game_id": str(db_game_id),  # Use database game_id, not MLB gamePk
            "mlb_game_pk": str(mlb_game_pk),  # Keep MLB gamePk for reference
            "status": "scheduled",
            "doubleheader": mlb_game.get("doubleHeader", "N"),
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "venue": mlb_game.get("venue", "NA")
        }

        redis_client.set(f"odds:mlb:{event_id}", json.dumps(merged))
        final_games[event_id] = merged
        print(f"✅ Mapped: {event['home_team']} vs {event['away_team']} → db_game_id {db_game_id} (MLB gamePk {mlb_game_pk})")

    redis_client.set(f"games:mlb:{today_str}", json.dumps(final_games))
    print(f"\n💾 Stored {len(final_games)} merged games in Redis")

    if unmatched:
        print(f"\n⚠️ {len(unmatched)} vendor events could not be matched:")
        for u in unmatched:
            print(f"  • {u['home_team']} vs {u['away_team']} at {u['commence_time']} (event_id={u['id']})")

if __name__ == "__main__":
    main() 