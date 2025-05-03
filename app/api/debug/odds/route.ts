import { NextResponse } from 'next/server';
import { getEvents, getEventPlayerProps } from '@/lib/odds-api';
import { sportsbooks } from '@/data/sportsbooks';
import { getCachedData, generateCacheKey } from '@/lib/redis';
import { SPORT_MARKETS } from '@/lib/constants/markets';

export async function GET() {
  try {
    // Get all active sportsbooks
    const activeSportsbooks = sportsbooks
      .filter(book => book.isActive)
      .map(book => book.id);
    
    console.log(`Debug API: Using ${activeSportsbooks.length} active sportsbooks`);
    
    // Focus entirely on MLB since it's in season
    const sport = 'baseball_mlb';
    console.log(`Debug API: Focusing on ${sport} events`);
    
    // Check if we have any events in cache
    const eventsCacheKey = generateCacheKey(["events", sport]);
    const cachedEvents = await getCachedData(eventsCacheKey);
    
    if (cachedEvents) {
      console.log(`Debug API: Found ${(cachedEvents as any[]).length} events in cache for ${sport}`);
    } else {
      console.log(`Debug API: No cached events found for ${sport}`);
    }
    
    // Get events for this sport
    const events = await getEvents(sport);
    
    if (!events || events.length === 0) {
      console.log(`Debug API: No ${sport} events found in API response`);
      return NextResponse.json(
        { error: `No ${sport} events found` },
        { status: 404 }
      );
    }
    
    console.log(`Debug API: Found ${events.length} ${sport} events from API`);
    
    // Take the first upcoming events
    const now = new Date();
    const upcomingEvents = events
      .filter(event => new Date(event.commence_time) > now)
      .sort((a, b) => 
        new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime()
      );
    
    if (upcomingEvents.length === 0) {
      console.log(`Debug API: No upcoming ${sport} events found`);
      return NextResponse.json(
        { error: `No upcoming ${sport} events found` },
        { status: 404 }
      );
    }
    
    console.log(`Debug API: Found ${upcomingEvents.length} upcoming ${sport} events`);
    
    // Get MLB-specific markets from our constants
    const mlbMarkets = SPORT_MARKETS.baseball_mlb || [];
    console.log(`Debug API: Found ${mlbMarkets.length} defined markets for ${sport}`);
    
    // Extract all API keys we want to try
    const allMlbMarketKeys = mlbMarkets.map(market => market.apiKey);
    console.log(`Debug API: Will try these market keys: ${allMlbMarketKeys.join(', ')}`);
    
    // Try first event
    const selectedEvent = upcomingEvents[0];
    console.log(`Debug API: Selecting event ${selectedEvent.id} - ${selectedEvent.home_team} vs ${selectedEvent.away_team}`);
    
    // Check if we have cached player props for this event
    const propsCacheKeys = allMlbMarketKeys.map(market => 
      generateCacheKey(["event-props", selectedEvent.id, sport, market])
    );
    
    for (const cacheKey of propsCacheKeys) {
      const cachedProps = await getCachedData(cacheKey);
      if (cachedProps) {
        console.log(`Debug API: Found cached player props with key ${cacheKey}`);
      }
    }
    
    // We'll split markets into smaller batches to avoid too many parameters
    const marketBatches = [];
    for (let i = 0; i < allMlbMarketKeys.length; i += 3) {
      marketBatches.push(allMlbMarketKeys.slice(i, i + 3));
    }
    
    // Try each batch of markets
    for (const marketBatch of marketBatches) {
      console.log(`Debug API: Trying market batch: ${marketBatch.join(', ')}`);
      
      try {
        // Get player props for this event with this batch of markets
        const props = await getEventPlayerProps(
          sport,
          selectedEvent.id,
          activeSportsbooks,
          marketBatch
        );
        
        // Log data about what we received
        console.log(`Debug API: Event has ${props.bookmakers?.length || 0} bookmakers`);
        
        if (props.bookmakers && props.bookmakers.length > 0) {
          // Count markets by type and by bookmaker
          const marketCounts: Record<string, number> = {};
          
          props.bookmakers.forEach(bookmaker => {
            console.log(`Debug API: Bookmaker ${bookmaker.key} has ${bookmaker.markets.length} markets`);
            
            bookmaker.markets.forEach(market => {
              marketCounts[market.key] = (marketCounts[market.key] || 0) + 1;
              
              // For player props, check player names
              if ('player' in market) {
                console.log(`Debug API: Found player prop: ${market.key} for ${market.player} with line ${(market as any).line}`);
              }
            });
          });
          
          console.log(`Debug API: Market counts by type: ${JSON.stringify(marketCounts)}`);
          
          // Check if this batch has any player props or useful markets
          const hasPlayerMarkets = props.bookmakers.some(bm => 
            bm.markets.some(m => 'player' in m || m.key.includes('pitcher_') || m.key.includes('batter_'))
          );
          
          if (hasPlayerMarkets) {
            console.log(`Debug API: Found player markets in this batch!`);
            return NextResponse.json({
              ...props,
              meta: {
                sport,
                markets_used: marketBatch,
                market_counts: marketCounts
              }
            });
          }
        }
      } catch (error) {
        console.error(`Debug API: Error fetching market batch ${marketBatch.join(', ')}:`, error);
      }
    }
    
    // If we get here, we couldn't find any events with player props
    console.log(`Debug API: Could not find any events with player markets for the attempted sports and markets`);
    
    return NextResponse.json(
      { 
        error: 'No player markets found in any events',
        attempted_sport: sport,
        attempted_markets: allMlbMarketKeys
      },
      { status: 404 }
    );
    
  } catch (error) {
    console.error('Debug API: Error fetching odds data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch odds data' },
      { status: 500 }
    );
  }
} 