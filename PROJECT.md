# OddsMash Project Overview

## Project Description
OddsMash is a Next.js application that helps users analyze and compare sports betting odds across different platforms.

## Tech Stack
- **Framework**: Next.js with TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **Database**: MongoDB
- **State Management**: React Context
- **API Integration**: Sports Data API

## Project Structure
```
oddsmash/
├── app/                    # Next.js app directory (pages and layouts)
├── components/            # Reusable UI components
├── contexts/             # React Context providers
├── data/                 # Data fetching and API integration
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and shared logic
├── libs/                 # Third-party library integrations
├── public/              # Static assets
└── types/               # TypeScript type definitions
```

## Key Features
1. User Authentication
2. Sports Betting Odds Comparison
3. Historical Data Analysis
4. User Preferences Management
5. Real-time Odds Updates

## Environment Variables
Required environment variables:
- `MONGODB_URI`: MongoDB connection string
- `NEXTAUTH_SECRET`: NextAuth.js secret key
- `NEXTAUTH_URL`: Application URL
- `SPORTS_DATA_API_KEY`: API key for sports data

## API Integration
### Odds API Documentation
- **Base URL**: https://api.the-odds-api.com/v4/sports
- **Authentication**: API key required in headers
- **Rate Limits**: 
  - Free tier: 500 requests/month
  - Pro tier: 1000 requests/month
  - Enterprise: Custom limits

### Available Endpoints
1. **Get Sports**
   - Endpoint: `GET /sports`
   - Description: List all available sports
   - Parameters:
     - `apiKey`: Your API key
     - `all`: Boolean (optional) - Include inactive sports

2. **Get Odds**
   - Endpoint: `GET /sports/{sport}/odds`
   - Description: Get odds for a specific sport
   - Parameters:
     - `apiKey`: Your API key
     - `regions`: String (optional) - Comma-separated list of regions (e.g., "us,eu")
     - `markets`: String (optional) - Comma-separated list of markets (e.g., "h2h,spreads")
     - `oddsFormat`: String (optional) - Format of odds (american, decimal, fractional)

3. **Get Scores**
   - Endpoint: `GET /sports/{sport}/scores`
   - Description: Get scores for a specific sport
   - Parameters:
     - `apiKey`: Your API key
     - `daysFrom`: Integer (optional) - Number of days from today

### Data Structures
```typescript
interface Sport {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
  has_outrights: boolean;
}

interface Game {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

interface Bookmaker {
  key: string;
  title: string;
  markets: Market[];
}

interface Market {
  key: string;
  outcomes: Outcome[];
}

interface Outcome {
  name: string;
  price: number;
}
```

### Implementation Notes
1. API calls should be made server-side to protect API key
2. Implement caching to respect rate limits
3. Use TypeScript interfaces for type safety
4. Handle API errors gracefully
5. Implement retry logic for failed requests

## Development Guidelines
1. Follow TypeScript best practices
2. Use Tailwind CSS for styling
3. Implement responsive design
4. Write clean, documented code
5. Follow the existing project structure

## Getting Started
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run development server: `npm run dev`

## Deployment
The application is deployed on Vercel.

## Contributing
1. Create feature branches
2. Follow the existing code style
3. Submit pull requests for review

## Support
For support, please contact the development team. 