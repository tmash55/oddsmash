import { NextResponse } from 'next/server';
import { getEvents, getEventPlayerProps } from '@/lib/odds-api';
import { findEVBets } from '@/lib/ev-calculator';
import { getMarketsForSport } from '@/lib/constants/markets';
import { setCachedData, generateCacheKey } from '@/lib/redis';
import { sportsbooks } from '@/data/sportsbooks';

// Validate cron secret to ensure only authorized systems can trigger this endpoint
function validateCronSecret(request: Request): boolean {
  const cronSecret = request.headers.get('x-cron-secret');
  return cronSecret === process.env.CRON_SECRET;
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
  // Validate the secret
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sport = searchParams.get('sport') || 'basketball_nba';
  
  try {
    // Get all markets for the sport
    const sportMarkets = getMarketsForSport(sport);
    let marketsToScan = sportMarkets.map(market => market.apiKey);
    
    // Validate markets to avoid API errors
    marketsToScan = validateMarkets(marketsToScan);
    
    // Get all events for the sport
    const events = await getEvents(sport);
    
    if (!events || events.length === 0) {
      return NextResponse.json({ message: 'No events found for the sport' }, { status: 200 });
    }
    
    console.log(`Cron: Found ${events.length} events for ${sport}`);
    
    // Log a few example events
    if (events.length > 0) {
      const sampleEvents = events.slice(0, 2);
      sampleEvents.forEach(event => {
        console.log(`Event sample: ${event.id} - ${event.home_team} vs ${event.away_team} (${new Date(event.commence_time).toLocaleString()})`);
      });
    }
    
    // Get all active sportsbooks
    const activeSportsbooks = sportsbooks
      .filter(book => book.isActive)
      .map(book => book.id);
    
    console.log(`Cron: Using ${activeSportsbooks.length} active sportsbooks for scanning`);
    console.log(`Active sportsbooks: ${activeSportsbooks.join(', ')}`);
    console.log(`Cron: Using market average odds as baseline for EV calculations`);
    
    // Process events one by one to avoid rate limiting
    let totalOpportunities = 0;
    let eventsWithBets = 0;
    let totalMarketsChecked = 0;
    
    for (const event of events) {
      try {
        // Get player props for this event
        console.log(`\nCron: Processing event ${event.id} - ${event.home_team} vs ${event.away_team}`);
        const props = await getEventPlayerProps(
          sport,
          event.id,
          activeSportsbooks,
          marketsToScan
        );
        
        // Log which bookmakers were returned
        console.log(`Cron: Event ${event.id} has ${props.bookmakers?.length || 0} bookmakers`);
        
        if (props.bookmakers && props.bookmakers.length > 0) {
          const bookmakerNames = props.bookmakers.map(bm => bm.key).join(', ');
          console.log(`Cron: Bookmakers: ${bookmakerNames}`);
          
          // Count total player markets for this event
          let playerMarketCount = 0;
          for (const bookmaker of props.bookmakers) {
            const playerMarkets = bookmaker.markets.filter(m => 'player' in m);
            playerMarketCount += playerMarkets.length;
          }
          console.log(`Cron: Total player markets for this event: ${playerMarketCount}`);
          totalMarketsChecked += playerMarketCount;
        } else {
          console.log(`Cron: No bookmakers returned for this event`);
          continue;
        }
        
        // Calculate EV bets with different thresholds
        const evBets3Percent = findEVBets(props, 0.03, activeSportsbooks);
        const evBets5Percent = findEVBets(props, 0.05, activeSportsbooks);
        const evBets8Percent = findEVBets(props, 0.08, activeSportsbooks);
        const evBetsAll = findEVBets(props, 0, activeSportsbooks);
        
        // Log after calculating EV bets
        console.log(`Cron: Found ${evBetsAll.length} total bets with positive EV`);
        console.log(`Cron: Found ${evBets3Percent.length} bets with 3%+ EV, ${evBets5Percent.length} with 5%+ EV, and ${evBets8Percent.length} with 8%+ EV`);
        
        // If any bets were found, increment counter
        if (evBetsAll.length > 0) {
          eventsWithBets++;
        }
        
        // Store in Redis with appropriate keys and expiration
        if (evBets3Percent.length > 0) {
          const key3Percent = generateCacheKey(['ev-3percent', sport, event.id]);
          await setCachedData(key3Percent, evBets3Percent, 30 * 60); // 30 minutes
          totalOpportunities += evBets3Percent.length;
        }
        
        if (evBets5Percent.length > 0) {
          const key5Percent = generateCacheKey(['ev-5percent', sport, event.id]);
          await setCachedData(key5Percent, evBets5Percent, 30 * 60);
        }
        
        if (evBets8Percent.length > 0) {
          const key8Percent = generateCacheKey(['ev-8percent', sport, event.id]);
          await setCachedData(key8Percent, evBets8Percent, 30 * 60);
        }
        
        // Store all EV bets (including negative)
        const keyAll = generateCacheKey(['ev-all', sport, event.id]);
        await setCachedData(keyAll, evBetsAll, 30 * 60);
        
        // Short delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Cron: Error processing event ${event.id}:`, error);
      }
    }
    
    // Store a summary of all EV bets for quick access
    const timestamp = new Date().toISOString();
    const summary = {
      sport,
      scannedAt: timestamp,
      eventsScanned: events.length,
      eventsWithBets,
      opportunitiesFound: totalOpportunities,
      marketsChecked: totalMarketsChecked
    };
    
    const summaryKey = generateCacheKey(['ev-summary', sport]);
    await setCachedData(summaryKey, summary, 35 * 60); // 35 minutes
    
    return NextResponse.json({
      message: 'EV scan completed successfully',
      timestamp,
      sport,
      eventsScanned: events.length,
      eventsWithBets,
      opportunitiesFound: totalOpportunities,
      marketsChecked: totalMarketsChecked
    });
  } catch (error) {
    console.error('Cron: Error in EV scanner:', error);
    return NextResponse.json(
      { error: 'Failed to scan for EV bets' },
      { status: 500 }
    );
  }
} 