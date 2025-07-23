import os
import json
from datetime import datetime, timezone, timedelta
import csv
from typing import Dict, List, Tuple
import redis

# ── Config ────────────────────────────────────────────────────────────────────
UPSTASH_URL = os.environ["UPSTASH_REDIS_REST_URL"]
UPSTASH_TOKEN = os.environ["UPSTASH_REDIS_REST_TOKEN"]
TTL_SECONDS = 3 * 3600  # 3 hours
MIN_ARB_PCT = 0.5  # minimum arbitrage percentage to track

# ── Init Redis ────────────────────────────────────────────────────────────────
redis_client = redis.Redis(
    host=UPSTASH_URL.replace("https://", "").split(":")[0],
    port=6379,
    password=UPSTASH_TOKEN,
    ssl=True,
    decode_responses=True,
)

def save_to_redis(opportunity: Dict) -> str:
    """
    Save a single arbitrage opportunity to Redis.
    Returns the Redis key used to store the opportunity.
    """
    # Create a unique key for this arbitrage opportunity
    key_parts = [
        "arb",
        opportunity['sport'].lower(),
        opportunity['player'].lower().replace(" ", "_"),
        opportunity['market'].lower().replace(" ", "_"),
        opportunity['line'],
        datetime.now().strftime('%Y%m%d_%H%M%S')
    ]
    key = ":".join(key_parts)
    
    try:
        # Save to Redis with TTL
        redis_client.setex(
            key,
            TTL_SECONDS,
            json.dumps(opportunity)
        )
        return key
    except Exception as e:
        print(f"Error saving opportunity to Redis: {e}")
        return None

def calculate_arb(over_odds: float, under_odds: float) -> Tuple[float, float, float]:
    """Calculate arbitrage percentage and optimal bet distribution."""
    # Convert to decimal odds
    def to_decimal(odds: float) -> float:
        if odds > 0:
            return (odds / 100) + 1
        return (100 / abs(odds)) + 1
    
    over_decimal = to_decimal(over_odds)
    under_decimal = to_decimal(under_odds)
    
    # Calculate implied probabilities
    over_prob = 1 / over_decimal
    under_prob = 1 / under_decimal
    
    total_prob = over_prob + under_prob
    
    # If total probability < 1, arbitrage exists
    if total_prob < 1:
        profit_pct = ((1 - total_prob) / total_prob) * 100
        # Calculate optimal bet distribution
        over_pct = (1 / over_decimal) / total_prob * 100
        under_pct = (1 / under_decimal) / total_prob * 100
        return profit_pct, over_pct, under_pct
    
    return 0, 0, 0

def find_arb_opportunities() -> List[Dict]:
    """Find arbitrage opportunities in MLB and WNBA odds."""
    opportunities = []
    saved_keys = []
    
    # Get all MLB and WNBA odds keys
    cursor = 0
    odds_keys = []
    while True:
        cursor, keys = redis_client.scan(cursor, match="odds:*", count=1000)
        # Filter for MLB and WNBA keys
        for key in keys:
            if ":mlb:" in key or ":wnba:" in key:
                odds_keys.append(key)
        if cursor == 0:
            break
    
    print(f"Found {len(odds_keys)} MLB/WNBA odds keys to analyze...")
    
    for key in odds_keys:
        try:
            data = json.loads(redis_client.get(key))
            sport = "MLB" if ":mlb:" in key else "WNBA"
            
            # Check each line for arbitrage
            for line, books in data.get('lines', {}).items():
                best_over = {'odds': float('-inf'), 'book': None}
                best_under = {'odds': float('-inf'), 'book': None}
                
                # Find best odds for each side
                for book, odds in books.items():
                    if odds.get('over', {}).get('price'):
                        if odds['over']['price'] > best_over['odds']:
                            best_over = {
                                'odds': odds['over']['price'],
                                'book': book,
                                'link': odds['over'].get('link')
                            }
                    
                    if odds.get('under', {}).get('price'):
                        if odds['under'].get('price') > best_under['odds']:
                            best_under = {
                                'odds': odds['under']['price'],
                                'book': book,
                                'link': odds['under'].get('link')
                            }
                
                # Skip if we don't have both sides
                if best_over['odds'] == float('-inf') or best_under['odds'] == float('-inf'):
                    continue
                
                # Calculate arbitrage
                arb_pct, over_pct, under_pct = calculate_arb(best_over['odds'], best_under['odds'])
                
                # If profitable arbitrage exists (>MIN_ARB_PCT)
                if arb_pct >= MIN_ARB_PCT:
                    opportunity = {
                        'timestamp': datetime.now(timezone.utc).isoformat(),
                        'sport': sport,
                        'player': data['description'],
                        'market': data['market'],
                        'line': line,
                        'arb_percentage': round(arb_pct, 2),
                        'over': {
                            'odds': best_over['odds'],
                            'book': best_over['book'],
                            'stake_percentage': round(over_pct, 2),
                            'link': best_over['link']
                        },
                        'under': {
                            'odds': best_under['odds'],
                            'book': best_under['book'],
                            'stake_percentage': round(under_pct, 2),
                            'link': best_under['link']
                        },
                        'game': f"{data['away_team']} @ {data['home_team']}",
                        'start_time': data['commence_time']
                    }
                    
                    # Save to Redis and track the key
                    redis_key = save_to_redis(opportunity)
                    if redis_key:
                        saved_keys.append(redis_key)
                        opportunities.append(opportunity)
        
        except Exception as e:
            print(f"Error processing key {key}: {e}")
    
    # Save list of current arb keys
    if saved_keys:
        try:
            redis_client.setex(
                "arb:current_keys",
                TTL_SECONDS,
                json.dumps(saved_keys)
            )
        except Exception as e:
            print(f"Error saving current keys list: {e}")
    
    return opportunities

def save_opportunities(opportunities: List[Dict]):
    """Save arbitrage opportunities to CSV."""
    if not opportunities:
        print("No arbitrage opportunities found.")
        return
    
    # Sort by arbitrage percentage
    opportunities.sort(key=lambda x: x['arb_percentage'], reverse=True)
    
    # Save to CSV
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'arb_opportunities_{timestamp}.csv'
    
    with open(filename, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([
            'Sport',
            'Player',
            'Market',
            'Line',
            'Arb %',
            'Over Odds',
            'Over Book',
            'Over Stake %',
            'Under Odds',
            'Under Book',
            'Under Stake %',
            'Game',
            'Start Time',
            'Over Link',
            'Under Link'
        ])
        
        for opp in opportunities:
            writer.writerow([
                opp['sport'],
                opp['player'],
                opp['market'],
                opp['line'],
                opp['arb_percentage'],
                opp['over']['odds'],
                opp['over']['book'],
                opp['over']['stake_percentage'],
                opp['under']['odds'],
                opp['under']['book'],
                opp['under']['stake_percentage'],
                opp['game'],
                opp['start_time'],
                opp['over'].get('link', ''),
                opp['under'].get('link', '')
            ])
    
    print(f"\nFound {len(opportunities)} arbitrage opportunities!")
    print(f"Results saved to {filename}")
    
    # Print top opportunities to console
    print("\nTop 5 opportunities:")
    print("=" * 80)
    
    for opp in opportunities[:5]:
        print(f"\n{opp['sport']} - {opp['player']} - {opp['market']} (Line: {opp['line']})")
        print(f"Game: {opp['game']}")
        print(f"Arb: {opp['arb_percentage']}%")
        print(f"OVER: {opp['over']['odds']} ({opp['over']['book']}) - Stake: {opp['over']['stake_percentage']}%")
        print(f"UNDER: {opp['under']['odds']} ({opp['under']['book']}) - Stake: {opp['under']['stake_percentage']}%")
        print("-" * 80)

def main():
    try:
        # Test Redis connection
        redis_client.ping()
        print("✅ Connected to Redis")
        
        opportunities = find_arb_opportunities()
        save_opportunities(opportunities)
        
    except redis.ConnectionError:
        print("❌ Failed to connect to Redis - check your environment variables:")
        print(f"UPSTASH_URL: {UPSTASH_URL}")
        print("UPSTASH_TOKEN: [hidden]")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main() 