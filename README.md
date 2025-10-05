# OddsMash - Sports Betting Analytics Platform

## Project Overview
OddsMash is a modern sports betting analytics platform that helps users make informed betting decisions through advanced statistics, odds comparison, and community features.

## 🔥 Core Features Roadmap

### Phase 1: Core Betting Experience
1. **Universal Betslip System**
   - Persistent betslip overlay accessible across all pages
   - Context-based state management
   - Multi-leg parlay support
   - Best odds comparison for each selection
   - Direct sportsbook links
   
2. **User Bets Management**
   - Supabase Integration
     ```sql
     Table: user_bets
     - user_id: string (foreign key)
     - bet_id: string (primary key)
     - selections: jsonb
     - created_at: timestamp
     - shared_id: string (nullable)
     - settings: jsonb
     - notes: text
     ```
   - Shareable betslip URLs (/share/betslip/[id])
   - Toggle-able analytics display
   - Authentication-gated features

### Phase 2: Personalization
3. **User Preferences System**
   - Supabase Integration
     ```sql
     Table: user_preferences
     - user_id: string (primary key)
     - preferred_sportsbooks: string[]
     - theme: string
     - default_view: string
     - created_at: timestamp
     - updated_at: timestamp
     ```
   - Onboarding flow for new users
   - Sportsbook preference management
   - Customizable odds display
   - Filtered odds comparison based on preferences

### Phase 3: Social & Community
4. **Enhanced Sharing Features**
   - Social share card generation
   - Multi-platform sharing support
     - Twitter/X
     - Discord
     - Threads
     - SMS
     - Direct links
   - Analytics integration in shares
   - Trending plays section

5. **Community Odds Comparison**
   - Screenshot upload support
   - Shared link parsing
   - Cross-book odds comparison
   - Future: Social media integration
     - Twitter/Discord scraping
     - OCR for bet parsing
     - Automated odds comparison

## 🏗 Technical Architecture

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Context API for state management
- Redis for caching

### Backend
- Supabase
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions
- Edge Functions for API routes
- Upstash Redis for caching

### Data Flow
1. Odds data cached in Redis (6-hour TTL)
2. User preferences stored in Supabase
3. Betslip state managed in Context
4. Shared betslips stored in Supabase

## 🔒 Authentication & Security
- Supabase authentication
- Protected API routes
- Rate limiting on share generation
- Secure sportsbook deep linking

## 📱 Responsive Design
- Mobile-first approach
- Persistent betslip overlay
- Touch-friendly interface
- Adaptive layouts

## 🚀 Performance Optimization
- Static page generation where possible
- Dynamic imports for heavy components
- Redis caching for odds data
- Image optimization
- Lazy loading for off-screen content

## 🧪 Testing Strategy
- Jest for unit tests
- Cypress for E2E testing
- API route testing
- Component testing with React Testing Library

## 📈 Analytics & Monitoring
- User engagement tracking
- Performance monitoring
- Error tracking
- Conversion analytics

## 🔄 Development Workflow
1. Feature branches
2. PR reviews
3. Staging deployment
4. Production deployment

## 📦 Dependencies
```json
{
  "dependencies": {
    "@supabase/supabase-js": "latest",
    "@upstash/redis": "latest",
    "next": "14.x",
    "react": "18.x",
    "tailwindcss": "latest",
    "@radix-ui/react-*": "latest",
    "framer-motion": "latest"
  }
}
```

## 🎯 Getting Started
1. Clone the repository
2. Install dependencies
3. Set up environment variables
4. Run development server

## 🤝 Contributing
Guidelines for contributing to the project...

## 📄 License
MIT License

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

