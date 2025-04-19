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
