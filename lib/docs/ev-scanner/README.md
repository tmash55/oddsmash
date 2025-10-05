# EV Scanner - Finding Value Betting Opportunities

The EV (Expected Value) Scanner is a tool that helps identify profitable betting opportunities by comparing odds from multiple sportsbooks against Pinnacle's sharp lines.

## How It Works

1. The scanner fetches odds from multiple sportsbooks for upcoming games
2. It compares these odds against Pinnacle, which is considered to have the sharpest lines
3. It calculates the Expected Value (EV%) for each betting opportunity
4. It presents the results sorted by highest EV% first

## How to Use

1. **Select Sport** - Choose which sport you want to scan (NBA, NCAAB, NFL, MLB)
2. **Min EV%** - Set the minimum EV% threshold (default is 3%)
3. **Select Markets** - Filter by specific markets (like Points, Rebounds, Assists)
4. **Select Sportsbooks** - Filter by specific sportsbooks
5. **Search** - Use the search box to find specific players or matchups

## Understanding EV%

Expected Value (EV%) tells you the long-term profitability of a bet:

- **Positive EV%** means the bet is profitable in the long run
- Higher EV% indicates more value
- General guidelines:
  - 3-5% EV: Good value
  - 5-8% EV: Very good value
  - 8%+ EV: Excellent value

The formula used is:
```
EV% = (True Probability × (Decimal Odds - 1)) - (1 - True Probability)
```

### Baseline Odds
The scanner uses the following approach to determine "true probability":

1. **Pinnacle Odds (Preferred)**: When available, Pinnacle's lines are used as the baseline since they're considered the sharpest in the market
2. **Market Average (Fallback)**: When Pinnacle doesn't offer a particular market or line, we calculate the average odds across all other sportsbooks as the baseline

When using market average as the baseline, we apply a slightly higher EV% threshold to account for the increased uncertainty compared to Pinnacle's sharp lines.

## Automatic Updates

The scanner data is automatically refreshed every 5 minutes via a cron job. You can manually refresh the data using the refresh button in the top-right corner of the scanner.

## API Access

Developers can access the EV scanning data via our API:

```
GET /api/ev-scanner
```

Query parameters:
- `sport` - Sport key (e.g., basketball_nba)
- `minEV` - Minimum EV percentage threshold
- `markets` - Comma-separated list of markets
- `bookmakers` - Comma-separated list of bookmaker IDs
- `noCache` - Set to "true" to bypass cache

Example:
```
/api/ev-scanner?sport=basketball_nba&minEV=3&markets=player_points,player_rebounds
``` 