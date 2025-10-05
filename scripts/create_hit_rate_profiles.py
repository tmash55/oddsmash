from datetime import datetime, timedelta, timezone

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