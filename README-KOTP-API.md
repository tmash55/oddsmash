# KOTP API Architecture

This document outlines the architecture of the King of the Playoffs (KOTP) API, designed to handle NBA playoff data efficiently.

## Overview

The KOTP API has been redesigned to use separate Nodejs runtime endpoints instead of Edge Functions, with staggered intervals for different tasks. This approach resolves timeout issues when fetching data from the NBA Stats API.

## API Endpoints

The system is divided into three main endpoints, each with a specific responsibility:

### 1. Fetch Game Logs (`/api/kotp/fetch-game-logs`)
- **Schedule**: Every 5 minutes
- **Purpose**: Fetches historical game logs from the NBA Stats API
- **Runtime**: Nodejs (longer timeout)
- **Cache**: Stores data in Redis with `GAMELOG_CACHE_KEY`

### 2. Fetch Scoreboard (`/api/kotp/fetch-scoreboard`)
- **Schedule**: Every 1 minute
- **Purpose**: Fetches today's scoreboard data, including live games
- **Runtime**: Nodejs
- **Cache**: Stores data in Redis with `SCOREBOARD_CACHE_KEY`

### 3. Build Leaderboard (`/api/kotp/build-leaderboard`)
- **Schedule**: Every 2 minutes
- **Purpose**: Combines game logs and scoreboard data to build the leaderboard
- **Runtime**: Nodejs
- **Cache**: Stores the final leaderboard in Redis with `LEADERBOARD_CACHE_KEY`

## Data Flow

1. Game logs are fetched from the NBA Stats API every 5 minutes
2. Scoreboard data is fetched from the NBA CDN every minute for live updates
3. The leaderboard builder combines these two data sources every 2 minutes
4. The client-facing API (`/api/kotp/leaderboard`) reads from this cached data

## Benefits

- **Resilience**: Each operation is isolated, so a failure in one doesn't affect the others
- **Performance**: No single endpoint has to perform all heavy operations
- **Reliability**: Using Nodejs runtime instead of Edge Functions allows longer execution time
- **Up-to-date**: Live game data is updated every minute, while less frequent updates happen at appropriate intervals

## Setup

The system uses Upstash QStash to schedule the API calls according to the defined intervals. Configuration is in `upstash.json`:

```json
{
  "qstash": {
    "jobs": [
      {
        "name": "Fetch NBA Game Logs",
        "url": "${VERCEL_URL}/api/kotp/fetch-game-logs?secret=${CRON_SECRET}",
        "cron": "*/5 * * * *"
      },
      {
        "name": "Fetch NBA Scoreboard",
        "url": "${VERCEL_URL}/api/kotp/fetch-scoreboard?secret=${CRON_SECRET}",
        "cron": "* * * * *"
      },
      {
        "name": "Build KOTP Leaderboard",
        "url": "${VERCEL_URL}/api/kotp/build-leaderboard?secret=${CRON_SECRET}",
        "cron": "*/2 * * * *"
      }
    ]
  }
}
```

## Error Handling

Each endpoint handles errors gracefully:

1. If fetch operations fail, the system falls back to cached data when available
2. Detailed error logging helps troubleshoot issues
3. Each endpoint returns appropriate status codes and error messages 