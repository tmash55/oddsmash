# Redis Caching Configuration for Vercel

This project uses Upstash Redis for caching NBA API data to resolve timeout issues on Vercel Edge Functions.

## Setup Instructions

1. Go to [Upstash](https://upstash.com/) and create a free Redis database
2. After creating your database, copy the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` values
3. Add these environment variables to your Vercel project:

```bash
UPSTASH_REDIS_REST_URL=<your-redis-url>
UPSTASH_REDIS_REST_TOKEN=<your-redis-token>
```

4. Deploy your project to Vercel with these environment variables

## Background Data Fetching with Upstash

To avoid timeout issues when calling the NBA API directly from the frontend, this project uses Upstash QStash to run background jobs that fetch and cache data periodically.

### Setup Steps

#### Option 1: Using the Upstash Console (Easiest)

1. Sign up/login to [Upstash Console](https://console.upstash.com/)
2. Navigate to "QStash" in the sidebar
3. Click "Create New" and then "Schedule"
4. Fill in the form:
   - URL: `https://your-domain.com/api/kotp/cron/update-cache?secret=your-secure-secret-here`
   - Method: GET
   - Cron: `*/5 * * * *` (every 5 minutes)
5. Click "Create"

#### Option 2: Using the Script (More Automated)

1. Install dependencies:
   ```bash
   npm install @upstash/qstash dotenv
   ```

2. Create a secure random string for your CRON_SECRET:
   ```bash
   # Example using openssl
   openssl rand -hex 16
   ```

3. Get your QStash token from the [Upstash Console](https://console.upstash.com/) → QStash → Settings

4. Configure environment variables in `.env.local`:
   ```
   CRON_SECRET="your-generated-random-string"
   QSTASH_TOKEN="your-qstash-token"
   ```

5. Run the setup script:
   ```bash
   node scripts/setup-upstash-schedule.js https://your-deployed-app.com
   ```

### How It Works

1. QStash calls your `/api/kotp/cron/update-cache` endpoint every 5 minutes
2. This endpoint fetches data from the NBA API and stores it in Redis
3. The main leaderboard endpoint (`/api/kotp/leaderboard`) reads from the cache
4. If the cache is empty or stale, a fallback mechanism attempts to fetch fresh data

This approach ensures the app remains responsive even when the NBA API is slow or returning empty data (such as before the playoffs start).

## How It Works

The application implements a multi-level caching strategy:

1. **Redis Cache**: API responses are cached in Redis with a 5-minute TTL
2. **Stale-While-Revalidate**: If cache is expired, stale data is returned while fetching fresh data
3. **Fallback Mechanism**: Even during errors, stale cache data is used when available
4. **Browser Cache**: HTTP cache headers are set for browser-side caching
5. **Visual Indicators**: The UI shows cache status (fresh, cached, or stale)

This approach ensures:

- Fast response times (under 10 seconds for Vercel Edge Functions)
- Reduced load on the NBA API
- Graceful handling of NBA API timeouts or errors
- Consistent user experience even during API issues

## Cache Keys

The application uses these Redis cache keys:

- `kotp_playoff_game_logs`: Playoff game data (5 min TTL)
- `kotp_leaderboard`: Full leaderboard data (5 min TTL)
- `kotp_scoreboard`: Live game data (1 min TTL)
- `nba_playoff_game_logs`: Raw NBA API data (5 min TTL)

