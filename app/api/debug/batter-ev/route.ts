import { NextResponse } from 'next/server';
import { getEvents, getEventPlayerProps } from '@/lib/odds-api';
import { sportsbooks } from '@/data/sportsbooks';
import { 
  americanToDecimal, 
  decimalToImpliedProbability, 
  calculateEV 
} from '@/lib/ev-calculator';

interface DebugEVCalculation {
  market: string;
  player: string;
  line: number;
  type: 'Over' | 'Under';
  sportsbook: string;
  odds: number;
  decimalOdds: number;
  averageOdds: number;
  averageDecimalOdds: number;
  impliedProbability: number;
  ev: number;
  evPercentage: number;
  bookmakerCount: number;
  comparedBooks: string[];
}

export async function GET() {
  try {
    console.log('Debug Batter EV API: Starting...');
    
    // Get all active sportsbooks
    const activeSportsbooks = sportsbooks
      .filter(book => book.isActive)
      .map(book => book.id);
    
    console.log(`Debug Batter EV API: Using ${activeSportsbooks.length} active sportsbooks`);
    
    // Focus entirely on MLB
    const sport = 'baseball_mlb';
    console.log(`Debug Batter EV API: Focusing on ${sport} events`);
    
    // Get events for this sport
    const events = await getEvents(sport);
    
    if (!events || events.length === 0) {
      console.log(`Debug Batter EV API: No ${sport} events found`);
      return NextResponse.json(
        { error: `No ${sport} events found` },
        { status: 404 }
      );
    }
    
    console.log(`Debug Batter EV API: Found ${events.length} ${sport} events`);
    
    // Take the first upcoming event
    const now = new Date();
    const upcomingEvents = events
      .filter(event => new Date(event.commence_time) > now)
      .sort((a, b) => 
        new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime()
      );
    
    if (upcomingEvents.length === 0) {
      console.log(`Debug Batter EV API: No upcoming ${sport} events found`);
      return NextResponse.json(
        { error: `No upcoming ${sport} events found` },
        { status: 404 }
      );
    }
    
    console.log(`Debug Batter EV API: Found ${upcomingEvents.length} upcoming ${sport} events`);
    
    // Take the first event
    const selectedEvent = upcomingEvents[0];
    console.log(`Debug Batter EV API: Selected event ${selectedEvent.id} - ${selectedEvent.home_team} vs ${selectedEvent.away_team}`);
    
    // Use batter_runs_scored as it's the correct market key from the API
    const marketKey = 'batter_runs_scored';
    console.log(`Debug Batter EV API: Using marketKey ${marketKey}`);
    
    // Get player props for this event
    const props = await getEventPlayerProps(
      sport,
      selectedEvent.id,
      activeSportsbooks,
      [marketKey]
    );
    
    console.log(`Debug Batter EV API: Got response with ${props.bookmakers?.length || 0} bookmakers`);
    
    if (!props.bookmakers || props.bookmakers.length === 0) {
      console.log(`Debug Batter EV API: No bookmakers data found for this event`);
      return NextResponse.json(
        { error: 'No bookmakers data found' },
        { status: 404 }
      );
    }
    
    // Calculate EVs manually with detailed steps
    const evCalculations: DebugEVCalculation[] = [];
    
    // Look at each bookmaker
    for (const bookmaker of props.bookmakers) {
      console.log(`Debug Batter EV API: Analyzing bookmaker ${bookmaker.key}`);
      
      for (const market of bookmaker.markets) {
        // Check if it's the right market
        if (market.key !== marketKey) continue;
        
        console.log(`Debug Batter EV API: Found market ${marketKey} with ${market.outcomes?.length || 0} outcomes`);
        
        // Process each outcome
        for (const outcome of market.outcomes || []) {
          // The player name is in the description field
          const playerName = outcome.description;
          // The line is in the point field
          const line = outcome.point;
          const type = outcome.name as 'Over' | 'Under';
          
          if (!playerName || line === undefined) {
            console.log(`Debug Batter EV API: Invalid outcome data for ${marketKey}, skipping`);
            continue;
          }
          
          console.log(`Debug Batter EV API: ${bookmaker.key} offers ${playerName} ${marketKey} ${line} ${type} at ${outcome.price}`);
          
          // Calculate average odds across all bookmakers for this market/player/line/type
          let totalOdds = 0;
          let count = 0;
          const comparedBooks: string[] = [];
          
          for (const bm of props.bookmakers) {
            // Skip the current bookmaker when calculating average
            if (bm.key === bookmaker.key) continue;
            
            // Find matching market
            const m = bm.markets.find(m => m.key === marketKey);
            
            if (!m) {
              console.log(`Debug Batter EV API: ${bm.key} has no ${marketKey} market`);
              continue;
            }
            
            // Find the matching outcome for the same player/line/type
            const o = m.outcomes?.find(o => 
              o.description === playerName && 
              Math.abs(o.point - line) < 0.1 &&
              o.name === type
            );
            
            if (!o) {
              console.log(`Debug Batter EV API: ${bm.key} has no ${type} outcome for ${playerName} ${line}`);
              continue;
            }
            
            console.log(`Debug Batter EV API: Adding ${bm.key} odds ${o.price} to average calculation`);
            totalOdds += o.price;
            count++;
            comparedBooks.push(bm.key);
          }
          
          if (count === 0) {
            console.log(`Debug Batter EV API: No other books to compare for ${playerName} ${line} ${type}, skipping`);
            continue;
          }
          
          // Calculate average odds
          const averageOdds = totalOdds / count;
          const averageDecimalOdds = americanToDecimal(averageOdds);
          const impliedProbability = decimalToImpliedProbability(averageDecimalOdds);
          
          // Calculate EV
          const decimalOdds = americanToDecimal(outcome.price);
          const ev = calculateEV(impliedProbability, decimalOdds);
          const evPercentage = ev * 100;
          
          console.log(`Debug Batter EV API: ${bookmaker.key} ${playerName} ${marketKey} ${line} ${type}: EV = ${evPercentage.toFixed(2)}%`);
          console.log(`- American Odds: ${outcome.price}, Avg American Odds: ${averageOdds.toFixed(2)}`);
          console.log(`- Decimal Odds: ${decimalOdds.toFixed(4)}, Avg Decimal Odds: ${averageDecimalOdds.toFixed(4)}`);
          console.log(`- Implied Probability: ${(impliedProbability * 100).toFixed(2)}%`);
          console.log(`- Compared with ${count} other books: ${comparedBooks.join(', ')}`);
          
          // Add to calculations
          evCalculations.push({
            market: marketKey
              .replace('player_', '')
              .replace('batter_', '')
              .replace('_alternate', '')
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' '),
            player: playerName,
            line,
            type,
            sportsbook: bookmaker.key,
            odds: outcome.price,
            decimalOdds,
            averageOdds,
            averageDecimalOdds,
            impliedProbability,
            ev,
            evPercentage,
            bookmakerCount: count + 1, // Including the current book
            comparedBooks
          });
        }
      }
    }
    
    // Sort by EV (highest first)
    const sortedCalculations = evCalculations.sort((a, b) => b.evPercentage - a.evPercentage);
    
    console.log(`Debug Batter EV API: Completed with ${sortedCalculations.length} EV calculations`);
    
    return NextResponse.json({
      event: {
        id: selectedEvent.id,
        home_team: selectedEvent.home_team,
        away_team: selectedEvent.away_team,
        commence_time: selectedEvent.commence_time,
        sport
      },
      marketKey,
      calculations: sortedCalculations,
      calculationsCount: sortedCalculations.length,
      bookmakerCount: props.bookmakers.length
    });
    
  } catch (error) {
    console.error('Debug Batter EV API Error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate EVs' },
      { status: 500 }
    );
  }
} 