import redis
import json
from datetime import datetime, timezone
import math

# Initialize Redis client
redis_client = redis.Redis(
    host='your-redis-host',
    port=6379,
    db=0,
    decode_responses=True
)

def calculate_arbitrage(over_odds: float, under_odds: float) -> tuple[float, float, float]:
    """
    Calculate arbitrage opportunity from American odds.
    Returns (arbitrage_exists, over_percentage, under_percentage)
    where percentages represent optimal bet allocation.
    """
    # Convert American odds to decimal
    def american_to_decimal(odds: float) -> float:
        if odds > 0:
            return (odds / 100) + 1
        return (100 / abs(odds)) + 1
    
    # Convert to decimal odds
    over_decimal = american_to_decimal(over_odds)
    under_decimal = american_to_decimal(under_odds)
    
    # Calculate implied probabilities
    over_prob = 1 / over_decimal
    under_prob = 1 / under_decimal
    
    # Calculate total probability
    total_prob = over_prob + under_prob
    
    # If total probability < 1, arbitrage exists
    arbitrage_exists = total_prob < 1
    
    # Calculate optimal bet allocation
    if arbitrage_exists:
        profit_percentage = ((1 - total_prob) / total_prob) * 100
        # Optimal stake distribution
        over_percentage = (1 / over_decimal) / total_prob * 100
        under_percentage = (1 / under_decimal) / total_prob * 100
        return profit_percentage, over_percentage, under_percentage
    
    return 0, 0, 0

def find_arbitrage_opportunities(min_profit_percentage: float = 1.0):
    """
    Scan Redis for arbitrage opportunities.
    min_profit_percentage: minimum profit percentage to report (e.g., 1.0 for 1%)
    """
    # Get all odds keys
    cursor = 0
    odds_keys = []
    
    while True:
        cursor, keys = redis_client.scan(cursor, match="odds:*", count=1000)
        odds_keys.extend(keys)
        if cursor == 0:
            break
    
    print(f"Found {len(odds_keys)} odds keys to analyze...")
    opportunities = []
    
    for key in odds_keys:
        try:
            data = json.loads(redis_client.get(key))
            
            # Skip if no lines data
            if not data.get('lines'):
                continue
            
            # Check each line for arbitrage
            for line, books in data['lines'].items():
                best_over = float('-inf')
                best_over_book = None
                best_under = float('-inf')
                best_under_book = None
                
                # Find best odds for each side
                for book, odds in books.items():
                    if odds.get('over') and odds['over'].get('price'):
                        if odds['over']['price'] > best_over:
                            best_over = odds['over']['price']
                            best_over_book = book
                    
                    if odds.get('under') and odds['under'].get('price'):
                        if odds['under'].get('price') > best_under:
                            best_under = odds['under']['price']
                            best_under_book = book
                
                # Skip if we don't have both sides
                if best_over == float('-inf') or best_under == float('-inf'):
                    continue
                
                # Calculate arbitrage
                profit_pct, over_pct, under_pct = calculate_arbitrage(best_over, best_under)
                
                # If profitable arbitrage exists
                if profit_pct >= min_profit_percentage:
                    opportunity = {
                        'player': data['description'],
                        'market': data['market'],
                        'line': line,
                        'event_id': data['event_id'],
                        'commence_time': data['commence_time'],
                        'over': {
                            'odds': best_over,
                            'book': best_over_book,
                            'stake_percentage': round(over_pct, 2)
                        },
                        'under': {
                            'odds': best_under,
                            'book': best_under_book,
                            'stake_percentage': round(under_pct, 2)
                        },
                        'profit_percentage': round(profit_pct, 2),
                        'home_team': data['home_team'],
                        'away_team': data['away_team']
                    }
                    
                    # Add links if available
                    if books[best_over_book]['over'].get('link'):
                        opportunity['over']['link'] = books[best_over_book]['over']['link']
                    if books[best_under_book]['under'].get('link'):
                        opportunity['under']['link'] = books[best_under_book]['under']['link']
                    
                    opportunities.append(opportunity)
        
        except Exception as e:
            print(f"Error processing key {key}: {e}")
    
    # Sort by profit percentage
    opportunities.sort(key=lambda x: x['profit_percentage'], reverse=True)
    
    return opportunities

def main():
    # Find opportunities with at least 0.5% profit
    opportunities = find_arbitrage_opportunities(min_profit_percentage=0.5)
    
    if not opportunities:
        print("No arbitrage opportunities found.")
        return
    
    print(f"\nFound {len(opportunities)} arbitrage opportunities!")
    print("\nTop opportunities:")
    print("=" * 80)
    
    for opp in opportunities:
        print(f"\n{opp['player']} - {opp['market']} (Line: {opp['line']})")
        print(f"Game: {opp['away_team']} @ {opp['home_team']}")
        print(f"Start time: {datetime.fromisoformat(opp['commence_time']).strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Profit: {opp['profit_percentage']}%")
        print("\nBet distribution:")
        print(f"OVER {opp['line']}: {opp['over']['odds']} ({opp['over']['book']}) - Stake: {opp['over']['stake_percentage']}%")
        print(f"UNDER {opp['line']}: {opp['under']['odds']} ({opp['under']['book']}) - Stake: {opp['under']['stake_percentage']}%")
        if opp['over'].get('link'):
            print(f"Over link: {opp['over']['link']}")
        if opp['under'].get('link'):
            print(f"Under link: {opp['under']['link']}")
        print("-" * 80)

if __name__ == "__main__":
    main() 