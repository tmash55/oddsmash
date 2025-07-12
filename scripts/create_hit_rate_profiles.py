from datetime import datetime, timedelta, timezone

def fetch_today_standard_props():
    """
    Fetch props for today from player_odds_history table (non‐alt lines plus Home Runs alt line).
    Includes player position and team abbreviation via joins.
    """
    standard_markets = [m for m in TARGET_MARKETS if m.lower() != "home runs"]

    select_fields = (
        "player_id, player_name, market, line, vendor_event_id, commence_time, home_team, away_team,"
        "mlb_players(position_abbreviation, team_id, mlb_teams(abbreviation))"
    )

    # 1) Fetch non-alt lines (DraftKings only)
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
    print(f"📊 Found {len(standard)} standard props from DraftKings")

    # 2) First get DraftKings Home Runs for base props
    hr_resp_dk = (
        supabase
        .table("player_odds_history")
        .select(select_fields)
        .eq("sportsbook", "draftkings")
        .eq("market", "Home Runs")
        .eq("line", 0.5)
        .execute()
    )
    home_runs = hr_resp_dk.data or []
    print(f"⚾ Found {len(home_runs)} home run props from DraftKings")

    # 3) Then get ALL sportsbooks' odds for these home run props
    if home_runs:
        player_ids = [prop["player_id"] for prop in home_runs]
        print(f"🔍 Looking up odds for {len(player_ids)} players with home run props")
        
        hr_all_odds = (
            supabase
            .table("player_odds_history")
            .select("player_id, line, sportsbook, over_price, over_link, over_sid")
            .in_("player_id", player_ids)
            .eq("market", "Home Runs")
            .eq("line", 0.5)
            .execute()
        ).data or []
        print(f"💰 Found {len(hr_all_odds)} total home run odds entries across all sportsbooks")

        # Log odds distribution by sportsbook
        sportsbook_counts = {}
        for odds in hr_all_odds:
            sportsbook = odds["sportsbook"].lower()
            sportsbook_counts[sportsbook] = sportsbook_counts.get(sportsbook, 0) + 1
        print("📈 Odds distribution by sportsbook:", sportsbook_counts)

        # Create odds lookup by player_id
        odds_by_player = {}
        for odds in hr_all_odds:
            player_id = odds["player_id"]
            if player_id not in odds_by_player:
                odds_by_player[player_id] = {}
            
            # Make sure to lowercase sportsbook name
            sportsbook = odds["sportsbook"].lower()
            odds_by_player[player_id][sportsbook] = {
                "odds": odds["over_price"],
                "over_link": odds["over_link"],
                "sid": odds["over_sid"]
            }

        # Add all sportsbooks' odds to the home run props
        for prop in home_runs:
            player_id = prop["player_id"]
            prop["all_odds"] = {"0.5": odds_by_player.get(player_id, {})}
            
            # Log if we're missing odds for any players
            if player_id not in odds_by_player:
                print(f"⚠️ No odds found for player {prop['player_name']} (ID: {player_id})")
            else:
                print(f"✅ Found odds from {len(odds_by_player[player_id])} sportsbooks for {prop['player_name']}")

    props = standard + home_runs
    if not props:
        raise Exception("No props found for today.")
    
    # Log final props summary
    hr_props_with_odds = sum(1 for p in home_runs if p.get("all_odds", {}).get("0.5", {}))
    print(f"📊 Final props summary:")
    print(f"  - {len(standard)} standard props")
    print(f"  - {len(home_runs)} home run props")
    print(f"  - {hr_props_with_odds} home run props with odds")
    
    return props