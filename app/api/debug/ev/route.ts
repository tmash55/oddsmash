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
}

export async function GET() {
  try {
    // Get all active sportsbooks
    const activeSportsbooks = sportsbooks
      .filter(book => book.isActive)
      .map(book => book.id);
    
    console.log(`Debug EV API: Using ${activeSportsbooks.length} active sportsbooks`);
    
    // Try multiple markets
    const allMarketsToTry = [
      // Standard markets
      [
        'player_points',
        'player_rebounds',
        'player_assists'
      ],
      // Alternative markets
      [
        'player_points_rebounds_assists',
        'player_threes',
        'player_blocks',
        'player_steals'
      ],
      // Alternative formats
      [
        'player_points_alternate',
        'player_rebounds_alternate',
        'player_assists_alternate'
      ]
    ];
    
    // Try both NBA and NCAAB 
    const sports = ['basketball_nba', 'basketball_ncaab', 'baseball_mlb'];
    
    // MLB-specific markets
    const mlbMarketsToTry = [
      [
        'batter_home_runs',
        'batter_hits',
        'batter_total_bases',
        'batter_runs_batted_in',
        'batter_runs_scored',
        'batter_singles',
        'batter_doubles',
        'batter_triples',
        'batter_stolen_bases',
        'batter_walks'
      ],
      [
        'pitcher_strikeouts',
        'pitcher_hits_allowed',
        'pitcher_walks',
        'pitcher_earned_runs',
        'pitcher_outs'
      ]
    ];
    
    let eventWithPlayerMarkets = null;
    let marketTypeUsed = null;
    
    // First, find an event with player markets
    outerLoop:
    for (const sport of sports) {
      console.log(`Debug EV API: Checking ${sport} events`);
      
      // Get events for this sport
      const events = await getEvents(sport);
      
      if (!events || events.length === 0) {
        console.log(`Debug EV API: No ${sport} events found`);
        continue;
      }
      
      console.log(`Debug EV API: Found ${events.length} ${sport} events`);
      
      // Take upcoming events
      const now = new Date();
      const upcomingEvents = events
        .filter(event => new Date(event.commence_time) > now)
        .sort((a, b) => 
          new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime()
        );
      
      if (upcomingEvents.length === 0) {
        console.log(`Debug EV API: No upcoming ${sport} events found`);
        continue;
      }
      
      console.log(`Debug EV API: Found ${upcomingEvents.length} upcoming ${sport} events`);
      
      // Try first 3 events
      const eventsToTry = upcomingEvents.slice(0, 3);
      
      for (const selectedEvent of eventsToTry) {
        console.log(`Debug EV API: Trying event ${selectedEvent.id} - ${selectedEvent.home_team} vs ${selectedEvent.away_team}`);
        
        // Try each market type
        for (const marketsToScan of sport === 'baseball_mlb' ? mlbMarketsToTry : allMarketsToTry) {
          console.log(`Debug EV API: Trying markets: ${marketsToScan.join(', ')}`);
          
          // Get player props for this event
          const props = await getEventPlayerProps(
            sport,
            selectedEvent.id,
            activeSportsbooks,
            marketsToScan
          );
          
          if (!props.bookmakers || props.bookmakers.length === 0) {
            console.log(`Debug EV API: No bookmakers data found for this event`);
            continue;
          }
          
          // Count player markets
          let totalPlayerMarkets = 0;
          props.bookmakers.forEach(bookmaker => {
            const playerMarkets = bookmaker.markets.filter(m => 'player' in m);
            console.log(`Debug EV API: ${bookmaker.key} has ${playerMarkets.length} player markets`);
            totalPlayerMarkets += playerMarkets.length;
          });
          
          if (totalPlayerMarkets > 0) {
            console.log(`Debug EV API: Found event with ${totalPlayerMarkets} player markets!`);
            eventWithPlayerMarkets = {
              event: selectedEvent,
              props: props,
              sport: sport
            };
            marketTypeUsed = marketsToScan;
            break outerLoop; // Exit all loops once we find a valid event
          }
        }
      }
    }
    
    if (!eventWithPlayerMarkets) {
      return NextResponse.json(
        { error: 'No events with player markets found' },
        { status: 404 }
      );
    }
    
    const selectedEvent = eventWithPlayerMarkets.event;
    const props = eventWithPlayerMarkets.props;
    
    console.log(`Debug EV API: Selected event ${selectedEvent.id} with markets: ${marketTypeUsed?.join(', ')}`);
    console.log(`Debug EV API: Beginning EV calculations`);
    
    // Calculate EVs manually with detailed steps
    const evCalculations: DebugEVCalculation[] = [];
    
    // Look at each bookmaker
    for (const bookmaker of props.bookmakers) {
      // Skip Pinnacle since we're using average as baseline
      if (bookmaker.key === 'pinnacle') continue;
      
      for (const market of bookmaker.markets) {
        // Check if it's a player prop market
        if (!('player' in market) || !market.player || !('line' in market) || !market.line) {
          continue;
        }
        
        const marketKey = market.key;
        const playerName = market.player as string;
        const line = market.line as number;
        
        // Check both Over and Under
        for (const type of ['Over', 'Under'] as const) {
          // Find the outcome
          const outcome = market.outcomes.find(o => 
            o.name.includes(type) || 
            (type === 'Over' && o.name.includes('Over')) || 
            (type === 'Under' && o.name.includes('Under'))
          );
          
          if (!outcome) continue;
          
          // Calculate average odds across all bookmakers for this market/player/line/type
          let totalOdds = 0;
          let count = 0;
          
          for (const bm of props.bookmakers) {
            // Skip the current bookmaker when calculating average
            if (bm.key === bookmaker.key) continue;
            
            // Find matching market
            const m = bm.markets.find(m => 
              m.key === marketKey && 
              'player' in m && 
              m.player === playerName && 
              'line' in m && 
              Math.abs(((m.line as number) || 0) - line) < 0.1
            );
            
            if (!m) continue;
            
            // Find the outcome
            const o = m.outcomes.find(o => 
              o.name.includes(type) || 
              (type === 'Over' && o.name.includes('Over')) || 
              (type === 'Under' && o.name.includes('Under'))
            );
            
            if (!o) continue;
            
            totalOdds += o.price;
            count++;
          }
          
          if (count === 0) continue; // Skip if we can't calculate average
          
          // Calculate average odds
          const averageOdds = totalOdds / count;
          const averageDecimalOdds = americanToDecimal(averageOdds);
          const impliedProbability = decimalToImpliedProbability(averageDecimalOdds);
          
          // Calculate EV
          const decimalOdds = americanToDecimal(outcome.price);
          const ev = calculateEV(impliedProbability, decimalOdds);
          const evPercentage = ev * 100;
          
          console.log(`Debug EV API: ${bookmaker.key} ${playerName} ${marketKey} ${line} ${type}: EV = ${evPercentage.toFixed(2)}%`);
          console.log(`- American Odds: ${outcome.price}, Avg American Odds: ${averageOdds.toFixed(2)}`);
          console.log(`- Decimal Odds: ${decimalOdds.toFixed(4)}, Avg Decimal Odds: ${averageDecimalOdds.toFixed(4)}`);
          console.log(`- Implied Probability: ${(impliedProbability * 100).toFixed(2)}%`);
          
          // Add to calculations
          evCalculations.push({
            market: marketKey
              .replace('player_', '')
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
            evPercentage
          });
        }
      }
    }
    
    // Sort by EV (highest first)
    const sortedCalculations = evCalculations.sort((a, b) => b.evPercentage - a.evPercentage);
    
    return NextResponse.json({
      event: {
        id: selectedEvent.id,
        home_team: selectedEvent.home_team,
        away_team: selectedEvent.away_team,
        commence_time: selectedEvent.commence_time,
        sport: eventWithPlayerMarkets.sport,
        markets_used: marketTypeUsed
      },
      calculations: sortedCalculations,
      calculationsCount: sortedCalculations.length,
      bookmakerCount: props.bookmakers.length
    });
    
  } catch (error) {
    console.error('Debug EV API: Error calculating EVs:', error);
    return NextResponse.json(
      { error: 'Failed to calculate EVs' },
      { status: 500 }
    );
  }
} 