#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import requests
from datetime import datetime, timezone, timedelta
from supabase import create_client

# ENV VARS
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
ODDS_API_KEY = os.environ["ODDS_API_KEY"]
ODDS_API_BASE_URL = os.environ["ODDS_API_BASE_URL"]

# INIT CLIENT
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

SPORT_KEY = "baseball_mlb"

def fetch_mlb_events():
    """Fetch upcoming MLB events from the odds API"""
    url = f"{ODDS_API_BASE_URL}/sports/{SPORT_KEY}/events?apiKey={ODDS_API_KEY}"
    response = requests.get(url)
    response.raise_for_status()
    return response.json()

def get_db_team_names():
    """Get team names from mlb_games table"""
    now = datetime.now(timezone.utc)
    future_cutoff = now + timedelta(hours=48)
    
    games = (
        supabase
        .from_("mlb_games")
        .select("game_id, game_datetime, home_name, away_name")
        .gte("game_datetime", now.isoformat())
        .lte("game_datetime", future_cutoff.isoformat())
        .execute()
        .data
    )
    
    return games

def main():
    print("=== DEBUGGING TEAM NAME MISMATCH ===\n")
    
    # Get team names from database
    print("1. TEAM NAMES IN DATABASE:")
    db_games = get_db_team_names()
    
    if not db_games:
        print("No upcoming games found in mlb_games table!")
        return
    
    db_teams = set()
    for game in db_games[:5]:  # Show first 5 games
        home = game.get("home_name", "")
        away = game.get("away_name", "")
        date = game.get("game_datetime", "")
        print(f"  {away} @ {home} on {date}")
        if home: db_teams.add(home)
        if away: db_teams.add(away)
    
    print(f"\nUnique team names in database: {sorted(db_teams)}\n")
    
    # Get team names from odds API
    print("2. TEAM NAMES FROM ODDS API:")
    try:
        events = fetch_mlb_events()
        now = datetime.now(timezone.utc)
        future_events = [
            e for e in events
            if now <= datetime.fromisoformat(e["commence_time"].replace("Z", "+00:00")) <= now + timedelta(hours=36)
        ]
        
        api_teams = set()
        for event in future_events[:5]:  # Show first 5 events
            home = event.get("home_team", "")
            away = event.get("away_team", "")
            date = event.get("commence_time", "")
            print(f"  {away} @ {home} on {date}")
            if home: api_teams.add(home)
            if away: api_teams.add(away)
        
        print(f"\nUnique team names from API: {sorted(api_teams)}\n")
        
        # Check for any matches
        print("3. TEAM NAME COMPARISON:")
        matches = db_teams.intersection(api_teams)
        if matches:
            print(f"MATCHES FOUND: {sorted(matches)}")
        else:
            print("NO EXACT MATCHES FOUND!")
            print("\nDB teams sample:", list(db_teams)[:10])
            print("API teams sample:", list(api_teams)[:10])
        
    except Exception as e:
        print(f"Error fetching from odds API: {e}")

if __name__ == "__main__":
    main() 