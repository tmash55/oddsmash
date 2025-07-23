import os
import json
from datetime import timedelta
import redis

# ── Config ────────────────────────────────────────────────────────────────────
UPSTASH_URL    = os.environ["UPSTASH_REDIS_REST_URL"]
UPSTASH_TOKEN  = os.environ["UPSTASH_REDIS_REST_TOKEN"]
LANDING_KEY    = "landing:top_ev"
TTL_SECONDS    = 3 * 3600     # 3 hours
MAX_PER_MARKET = 1
MAX_TOTAL      = 12

# ── Init Redis ────────────────────────────────────────────────────────────────
redis_client = redis.Redis(
    host=UPSTASH_URL.replace("https://", "").split(":")[0],
    port=6379,
    password=UPSTASH_TOKEN,
    ssl=True,
    decode_responses=True,
)

# ── Helpers ───────────────────────────────────────────────────────────────────
def scan_keys(pattern):
    return list(redis_client.scan_iter(match=pattern, count=1000))

def american_to_prob(odds: float) -> float:
    """Convert American odds to implied win probability."""
    return (100.0 / (odds + 100.0)) if odds > 0 else (-odds / (-odds + 100.0))

def compute_ev(avg_odds: float) -> float:
    """Compute true EV% from average American odds."""
    p = american_to_prob(avg_odds)
    profit = (avg_odds / 100.0) if avg_odds > 0 else (100.0 / -avg_odds)
    return (p * profit - (1 - p)) * 100.0

def am_to_dec(odds: float) -> float:
    """Convert American odds to decimal odds."""
    return (1 + odds / 100.0) if odds > 0 else (1 + 100.0 / -odds)

# ── Main Builder ──────────────────────────────────────────────────────────────
def build_landing():
    all_recs = []

    for pattern in ("odds:mlb:*", "odds:wnba:*"):
        for key in scan_keys(pattern):
            raw = redis_client.get(key)
            if not raw:
                continue

            try:
                obj = json.loads(raw)
            except json.JSONDecodeError:
                continue

            primary = obj.get("primary_line")
            if not primary:
                continue
                
            lines = obj.get("lines", {})
            line_data = lines.get(primary, {})
            if not line_data:
                continue

            for side in ("over", "under"):
                prices = []
                sources = {}
                
                for book, pair in line_data.items():
                    if not isinstance(pair, dict):
                        continue
                        
                    side_data = pair.get(side)
                    if not side_data or not isinstance(side_data, dict):
                        continue
                        
                    price = side_data.get("price")
                    if price is not None:
                        prices.append(price)
                        sources[book] = {
                            "sid": side_data.get("sid"),
                            "link": side_data.get("link"),
                            "price": price
                        }

                # require at least 5 sportsbooks
                if len(prices) < 5:
                    continue

                # true EV calculation uses average American odds
                avg_odds = sum(prices) / len(prices)
                ev = compute_ev(avg_odds)

                # decimal‑based value% calculation
                decimals = [am_to_dec(p) for p in prices]
                avg_decimal = sum(decimals) / len(decimals)

                # find best book & price
                if not sources:
                    continue
                    
                best_book, best_info = max(sources.items(), key=lambda kv: kv[1]["price"])
                best_price = best_info["price"]
                best_decimal = am_to_dec(best_price)

                # value vs. market
                value_pct = (best_decimal / avg_decimal - 1) * 100.0

                sport = key.split(":", 2)[1]
                rec = {
                    "sport": sport,
                    "player_id": obj.get("player_id"),
                    "description": obj.get("description"),
                    "team": obj.get("team"),
                    "market": obj.get("market"),
                    "side": side,
                    "line": primary,
                    "avg_odds": avg_odds,
                    "ev": ev,
                    "avg_decimal": avg_decimal,
                    "value_pct": value_pct,
                    "best_book": best_book,
                    "best_price": best_price,
                    "event_id": obj.get("event_id"),
                    "commence_time": obj.get("commence_time"),
                    "sources": sources,
                }
                all_recs.append(rec)

    # sort by value_pct descending, enforce caps
    all_recs.sort(key=lambda r: r["value_pct"], reverse=True)
    output, counts = [], {}
    for r in all_recs:
        m = r["market"]
        if counts.get(m, 0) < MAX_PER_MARKET:
            output.append(r)
            counts[m] = counts.get(m, 0) + 1
        if len(output) >= MAX_TOTAL:
            break

    # write to Redis with TTL
    redis_client.set(LANDING_KEY, json.dumps(output), ex=TTL_SECONDS)
    print(f"Wrote {len(output)} records to {LANDING_KEY}")

# ── Entrypoint ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    build_landing() 