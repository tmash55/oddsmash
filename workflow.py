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

def save_hit_rate_profiles(profiles):
    """
    Insert each profile into Supabase AND push to Redis.
    Redis key: hit_rate:{sport}:{player_id}:{market}
    TTL: 24 hours (86400 seconds)
    """
    for profile in profiles:
        try:
            # 1) Insert into Supabase
            supabase.table("player_hit_rate_profiles").insert(profile).execute()
            print(f"✅ Supabase insert: {profile['player_name']} ({profile['market']})")
        except Exception as e:
            print(f"❌ Supabase insert error for {profile['player_name']}: {e}")

        # 2) Push to Redis under key: hit_rate:mlb:{player_id}:{market}
        redis_key = f"hit_rate:mlb:{profile['player_id']}:{profile['market'].strip().lower()}"
        try:
            # Create the cached data structure expected by the frontend
            cached_data = {
                "hitRateProfile": profile,
                "lastUpdated": datetime.now(timezone.utc).isoformat(),
                "fallback_odds": profile.get("fallback_odds", {})
            }
            # JSON‐serialize the cached data object
            value = json.dumps(cached_data, default=str)
            # Set with TTL = 24 hours
            redis_client.set(redis_key, value, ex=86400)
            print(f"✅ Redis set: {redis_key}")
        except Exception as e:
            print(f"❌ Redis set error for key {redis_key}: {e}") 