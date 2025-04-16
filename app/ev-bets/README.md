# EV Bet Finder

The EV Bet Finder feature helps users identify betting opportunities with positive expected value (EV) across multiple sportsbooks. It compares the best available odds against the market consensus to find potentially profitable bets.

## How It Works

1. The system fetches upcoming events and their odds from multiple sportsbooks.
2. For each betting market (Moneyline, Spread, Total), it:
   - Calculates the implied probability from each sportsbook's odds
   - Determines the average implied probability (market consensus)
   - Identifies the best odds available
   - Calculates the EV percentage by comparing the best odds to the market average
3. Bets with EV above the threshold (default 2%) are displayed in a sortable table.

## Features

- **Automated EV Calculation**: Compares best odds to market consensus to find value bets
- **Redis Caching**: Stores event and odds data to minimize API calls
- **Manual Refresh**: Users can refresh the data on demand
- **Sortable Results**: Sort by EV%, odds value, or game time
- **Multiple Sports Support**: Works with NBA, MLB, NFL, NHL, and others

## Technical Implementation

- **Backend**:
  - Pure calculation logic in `lib/ev/calculateEV.ts`
  - Data fetching and processing in `lib/ev/getEVBets.ts`
  - API endpoint at `app/api/ev/route.ts`
  - Redis caching for efficient data retrieval

- **Frontend**:
  - Main page component in `app/ev-bets/page.tsx`
  - Sortable results table in `app/ev-bets/components/EVTable.tsx`
  - Refresh button in `app/ev-bets/components/EVRefreshButton.tsx`

## EV Calculation

Expected Value (EV) represents the percentage advantage a bet offers compared to the market's average implied probability.

```
EV% = (Market Average Probability - Best Odds Implied Probability) * 100
```

Where:
- Implied Probability for positive odds: `100 / (odds + 100)`
- Implied Probability for negative odds: `-odds / (-odds + 100)`

Only bets with EV% above the defined threshold (default 2%) are shown, and we require at least 3 sportsbooks to establish a reliable market average.

## Future Enhancements

- Add filters for specific sports, market types, or minimum EV thresholds
- Support more market types (player props, alternative lines)
- Add notifications for high-value EV bets
- Implement weighted market averages based on sportsbook reliability
- Automatic refresh on a schedule 