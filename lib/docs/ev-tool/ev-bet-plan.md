📊 EV Tool Setup Guide
This markdown file provides an overview and implementation guide for building an Expected Value (EV) scanning tool using sportsbook data. The goal is to scan odds from multiple sportsbooks and compare them against Pinnacle (as the sharp line) to identify +EV betting opportunities.

📁 Important Files
These are the core files this agent or developer should reference and work with:


File	Purpose
lib/constants/markets.ts	Defines all market types supported (e.g., Points, Rebounds, Assists, etc.)
lib/redis.ts	Provides Redis caching logic (to avoid redundant API calls)
lib/odds-api.ts	Responsible for calling the odds API and formatting responses
data/sportsbooks.ts	List of supported sportsbooks, their internal IDs, and affiliate link info
data/sports-data.ts	Additional sports mappings and league-level identifiers
app/api/events/route.ts	Fetches all upcoming events and matchups (used to generate EV scan targets)
app/api/events/[eventId]/props/route.ts	Retrieves player prop odds per market for a given game/event
🏀 Step 1: Filter by Sport (Start with Basketball)
Start by scanning basketball markets (nba, ncaab, wnba), using identifiers in sports-data.ts. Later we can add nfl, mlb, etc.

🔁 Step 2: Loop Through Markets
Loop through each entry in markets.ts. For each market:

Use the event API route (/api/events) to get all upcoming basketball events.

For each event, hit /api/events/[eventId]/props for every market.

Collect odds from all sportsbooks listed in sportsbooks.ts.

🧮 Step 3: Calculate Expected Value (EV%)
The formula to compute Expected Value:

EV%
=
(
True Probability
×
(
Decimal Odds
−
1
)
)
−
(
1
−
True Probability
)
EV%=(True Probability×(Decimal Odds−1))−(1−True Probability)
Definitions:
True Probability is derived from Pinnacle's line:

If Pinnacle odds are +121, the implied probability is:

100
121
+
100
=
0.4525
121+100
100
​
 =0.4525
If odds are negative (e.g., -130), it's:

130
130
+
100
=
0.5652
130+100
130
​
 =0.5652
Decimal Odds is:

For positive American odds: (odds / 100) + 1

For negative American odds: (100 / abs(odds)) + 1

📊 Step 4: Display Format
Display data in a sortable, searchable table view with the following columns:


Column	Description
EV %	Expected value percentage (sorted highest to lowest)
Market	e.g., Points, Rebounds, etc.
Player Line	e.g., Jalen Brunson o/u 27.5
Sportsbook	Book with the most favorable odds
Odds	Odds being offered at the value sportsbook
True Line	Pinnacle's odds
Win Probability	Based on Pinnacle's line
Game / Matchup	e.g., Knicks vs 76ers
SID Link	Direct link to place the bet on that sportsbook
All Books View	Expandable row with a list of other sportsbooks and their odds for that same line
Average Line	Average odds across all books (used for context)
🔓 Optional Features
✅ Filter by min EV % threshold (e.g., only show EV > 3%)

🔍 Filter by sportsbook(s)

⚠️ Warning if value line is too far off average (risk of stale/inaccurate data)

💾 Cache results with Redis (use TTL of 2–5 min)

📩 Add webhook or cron job to run scans on a timer and push updates to Redis

