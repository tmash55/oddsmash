# 📊 EV Bet Finder Tool — Build Plan & Documentation

## 🎯 Goal
Create a new page in the Oddsmash app that displays Expected Value (EV) bets across multiple sportsbooks for upcoming games. This tool helps bettors find +EV opportunities by comparing sportsbook lines against the market consensus.

---

## ✅ Features
- Displays EV bets sorted by highest value.
- Focused on games that have not started (`commence_time` > now).
- Supports H2H, Spread, Totals, and select Player Prop markets.
- Uses Redis (Upstash) to cache event/odds data.
- Includes a manual refresh button (can be expanded into cron/refetch logic).
- Identifies the best line per outcome and calculates EV% using implied probabilities.

---

## 🧮 EV Calculation Methodology

### Formula:
```
EV = (Implied Probability of Best Odds - Market Average Probability) * 100
```

### Implied Probability:
- Positive Odds: `100 / (odds + 100)`
- Negative Odds: `-odds / (-odds + 100)`

### Process:
1. For each event + market (e.g., Yankees ML, Over 8.5 Runs):
   - Get all available odds from different sportsbooks.
   - Find the best (highest value) odds.
   - Calculate implied probability for each book.
   - Average those probabilities (market consensus).
   - Compare average to best odds → calculate EV%.
2. Include if EV > threshold (e.g. 2% or 3%).

---

## 🧱 Folder & File Structure

```bash
/app
  /ev-bets
    page.tsx               # Renders EV table and refresh UI
    components/
      EVTable.tsx          # Displays EV bets in a sortable table
      EVRefreshButton.tsx  # Optional button to trigger refetch

/lib
  /ev
    calculateEV.ts         # Contains pure logic for calculating EV
    getEVBets.ts           # Fetches event + odds data and processes EV

/api
  /ev
    route.ts               # API route to expose EV bets to frontend

/lib
  redis.ts                 # Redis client setup (already exists)
```

---

## 🔁 Data Flow

```text
User clicks "Refresh EV Bets"
 → /api/ev route is called
   → Calls getEVBets.ts
     → Fetches cached events
     → Filters by commence_time > now
     → Fetches markets for each event (H2H, Totals, Spreads, or Props)
     → Compares odds across books
     → Calculates EV% for each possible outcome
   → Returns sorted list of EV bets
 → Frontend renders with EVTable
```

---

## 🛑 Filters & Constraints
- **Exclude events** where `commence_time < Date.now()`
- **Require minimum odds coverage** (3+ books preferred)
- **Ignore markets** with no significant line variance
- **Only show EV% > threshold** (configurable, default 2-3%)

---

## 📋 Display Table Columns
| Game | Market | Outcome | Best Book | Best Odds | Market Avg | EV% |
|------|--------|---------|-----------|-----------|------------|-----|

---

Other Files that can help that we already have created:

odds-api.ts
redis.ts
sportsbooks.ts
sports-data.ts
markets.ts
api routes


We will be adding more sportsbooks in the future and want an easy way to update the calculation or add more books into the calculation. Or even use weights for a certain sport. 