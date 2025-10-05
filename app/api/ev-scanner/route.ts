import { NextResponse } from 'next/server';
import { getEvents, getEventPlayerProps, GameOdds, Event } from '@/lib/odds-api';
import { findEVBets, EVBet } from '@/lib/ev-calculator';
import { getMarketsForSport } from '@/lib/constants/markets';
import { generateCacheKey, getCachedData, setCachedData, CACHE_TTL } from '@/lib/redis';
import { sportsbooks } from '@/data/sportsbooks';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// Define the maximum concurrency for API calls
const MAX_CONCURRENCY = 5;

// Helper function to process a batch of events
async function processBatch(
  batch: Event[],
  sport: string,
  marketsToScan: string[],
  allBookmakers: string[],
  bookmakers: string[],
  minEV: number
): Promise<EVBet[][]> {
  return Promise.all(
    batch.map(async (event) => {
      try {
        // Get player props for this event
        const props = await getEventPlayerProps(
          sport,
          event.id,
          allBookmakers,
          marketsToScan
        );
        
        // Debug: Check for Pinnacle data
        const hasPinnacle = props.bookmakers?.some(bm => bm.key === 'pinnacle');
        console.log(`Event ${event.id}: Has Pinnacle data: ${hasPinnacle}`);
        console.log(`Event ${event.id}: Total bookmakers: ${props.bookmakers?.length || 0}`);
        
        if (hasPinnacle) {
          const pinnacleBookmaker = props.bookmakers.find(bm => bm.key === 'pinnacle');
          const pinnacleMarkets = pinnacleBookmaker?.markets.length || 0;
          console.log(`Event ${event.id}: Pinnacle markets: ${pinnacleMarkets}`);
          
          // Log the first few markets from Pinnacle for debugging
          if (pinnacleMarkets > 0) {
            const sampleMarkets = pinnacleBookmaker?.markets.slice(0, 3).map(m => {
              // Check if it's a player prop market
              const isPlayerProp = 'player' in m;
              const marketInfo = isPlayerProp 
                ? `${(m as any).player} ${m.key} ${(m as any).line}`
                : m.key;
              return marketInfo;
            });
            console.log(`Pinnacle sample markets: ${sampleMarkets?.join(', ')}`);
            
            // Log the market keys to see what's available
            const marketKeys = Array.from(new Set(pinnacleBookmaker?.markets.map(m => m.key)));
            console.log(`Pinnacle market types: ${marketKeys.join(', ')}`);
          }
        }
        
        // Calculate EV bets
        const evBets = findEVBets(props, minEV, bookmakers.length ? bookmakers : 
          // If no specific bookmakers were requested, use all except Pinnacle
          sportsbooks
            .filter(book => book.isActive && book.id !== 'pinnacle')
            .map(book => book.id)
        );
        
        console.log(`Event ${event.id}: Found ${evBets.length} EV bets`);
        
        return evBets;
      } catch (error) {
        // Check if this is an invalid market error
        if (error instanceof Error && error.message.includes('Invalid markets')) {
          console.warn(`Skipping invalid market in event ${event.id}:`, error.message);
          return []; // Return empty array instead of failing the whole batch
        }
        
        console.error(`Error processing event ${event.id}:`, error);
        return [];
      }
    })
  );
}

// Add this function to validate markets
function validateMarkets(markets: string[]): string[] {
  // Known valid market prefixes
  const validPrefixes = [
    // Basketball markets
    'player_points',
    'player_rebounds',
    'player_assists',
    'player_threes',
    'player_blocks',
    'player_steals',
    'player_turnovers',
    'player_points_rebounds_assists',
    'player_points_rebounds',
    'player_points_assists',
    'player_rebounds_assists',
    'player_blocks_steals',
    'player_double_double',
    'player_triple_double',
    'player_first_basket',
    'player_first_team_basket',
    
    // Baseball markets
    'batter_home_runs',
    'batter_hits',
    'batter_total_bases',
    'batter_rbis',
    'batter_runs',
    'batter_walks',
    'batter_singles',
    'batter_doubles',
    'batter_triples',
    'pitcher_strikeouts',
    'pitcher_hits_allowed',
    'pitcher_walks',
    
    // Hockey markets
    'player_shots_on_goal',
    'player_goals',
    'player_power_play_points',
    'player_blocked_shots',
    'player_total_saves',
    
    // Include alternate versions
    'player_points_alternate',
    'player_rebounds_alternate',
    'player_assists_alternate',
    'player_threes_alternate',
    'batter_home_runs_alternate',
    'batter_hits_alternate',
    'batter_total_bases_alternate',
    'pitcher_strikeouts_alternate'
  ];
  
  // Filter out potentially invalid markets
  return markets.filter(market => {
    // Check if this market starts with any of the valid prefixes
    const isValid = validPrefixes.some(prefix => market.startsWith(prefix));
    if (!isValid) {
      console.warn(`Filtering out potentially invalid market: ${market}`);
    }
    return isValid;
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Get parameters from request
  const sport = searchParams.get('sport') || 'basketball_nba';
  const minEVParam = searchParams.get('minEV');
  const minEV = minEVParam ? parseFloat(minEVParam) / 100 : 0; // Convert percentage to decimal
  const marketsParam = searchParams.get('markets');
  const bookmakers = searchParams.get('bookmakers')?.split(',') || [];
  const noCache = searchParams.get('noCache') === 'true';
  
  // Define which markets to scan
  let marketsToScan: string[] = [];
  if (marketsParam) {
    marketsToScan = marketsParam.split(',');
  } else {
    // Default: get all markets for the sport from our constants
    const sportMarkets = getMarketsForSport(sport);
    marketsToScan = sportMarkets.map(market => market.apiKey);
  }
  
  // Validate markets to avoid API errors
  marketsToScan = validateMarkets(marketsToScan);
  
  try {
    // Generate cache key for this request
    const cacheKeyParts = [
      'ev-scanner',
      sport,
      minEV.toString(),
      marketsToScan.sort().join('-'),
    ];
    
    // Add bookmakers to cache key if specified
    if (bookmakers.length > 0) {
      cacheKeyParts.push(bookmakers.sort().join('-'));
    }
    
    const cacheKey = generateCacheKey(cacheKeyParts);
    
    // Try to get from cache first
    if (!noCache) {
      const cachedData = await getCachedData<EVBet[]>(cacheKey);
      if (cachedData) {
        console.log('Cache hit for EV scanner:', cacheKey);
        
        const response = NextResponse.json(cachedData);
        response.headers.set('x-cache', 'HIT');
        response.headers.set('x-cache-key', cacheKey);
        return response;
      }
    }
    
    console.log('Cache miss for EV scanner:', cacheKey);
    
    // Step 1: Get all upcoming events for the sport
    const events = await getEvents(sport);
    
    if (!events || events.length === 0) {
      return NextResponse.json({ error: 'No events found for the sport' }, { status: 404 });
    }
    
    console.log(`Found ${events.length} events for ${sport}`);
    
    // Step 2: Process events with concurrency control
    const results: EVBet[] = [];
    const allBookmakers = [...bookmakers, 'pinnacle']; // Always include Pinnacle for comparison
    
    // Process events in batches to control concurrency
    const batchSize = MAX_CONCURRENCY;
    const batches = [];
    
    for (let i = 0; i < events.length; i += batchSize) {
      batches.push(events.slice(i, i + batchSize));
    }
    
    for (const batch of batches) {
      const batchResults = await processBatch(
        batch, 
        sport, 
        marketsToScan, 
        allBookmakers, 
        bookmakers, 
        minEV
      );
      for (const evBets of batchResults) {
        results.push(...evBets);
      }
    }
    
    // Sort by EV percentage (highest first)
    const sortedResults = results.sort((a, b) => b.ev - a.ev);
    
    // Cache the results
    await setCachedData(cacheKey, sortedResults, 5 * 60); // 5 minute cache
    
    // Return response
    const response = NextResponse.json(sortedResults);
    response.headers.set('x-cache', 'MISS');
    response.headers.set('x-cache-key', cacheKey);
    response.headers.set('x-events-scanned', events.length.toString());
    response.headers.set('x-opportunities-found', sortedResults.length.toString());
    
    return response;
  } catch (error) {
    console.error('Error in EV scanner:', error);
    return NextResponse.json(
      { error: 'Failed to scan for EV bets' },
      { status: 500 }
    );
  }
} 