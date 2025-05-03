import { NextResponse } from 'next/server';
import { getEvents, getEventPlayerProps } from '@/lib/odds-api';
import { sportsbooks } from '@/data/sportsbooks';
import { 
  americanToDecimal, 
  decimalToImpliedProbability, 
  calculateEV,
  calculateNoVigProbabilities
} from '@/lib/ev-calculator';

interface EVCalculation {
  market: string;
  player: string;
  line: number;
  type: 'Over' | 'Under';
  sportsbook: string;
  odds: number;
  decimalOdds: number;
  baselineSource: 'pinnacle' | 'average' | 'no-vig';
  baselineOdds: number;
  baselineDecimalOdds: number;
  impliedProbability: number;
  noVigProbability?: number;
  ev: number;
  evPercentage: number;
  bookmakerCount: number;
  comparedBooks: string[];
  hasVig?: number;
}

export async function GET() {
  try {
    console.log('Hybrid EV API: Starting...');
    
    // Get all active sportsbooks
    const activeSportsbooks = sportsbooks
      .filter(book => book.isActive)
      .map(book => book.id);
    
    console.log(`Hybrid EV API: Using ${activeSportsbooks.length} active sportsbooks`);
    
    // Focus entirely on MLB
    const sport = 'baseball_mlb';
    console.log(`Hybrid EV API: Focusing on ${sport} events`);
    
    // Get events for this sport
    const events = await getEvents(sport);
    
    if (!events || events.length === 0) {
      console.log(`Hybrid EV API: No ${sport} events found`);
      return NextResponse.json(
        { error: `No ${sport} events found` },
        { status: 404 }
      );
    }
    
    console.log(`Hybrid EV API: Found ${events.length} ${sport} events`);
    
    // Take the first upcoming event
    const now = new Date();
    const upcomingEvents = events
      .filter(event => new Date(event.commence_time) > now)
      .sort((a, b) => 
        new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime()
      );
    
    if (upcomingEvents.length === 0) {
      console.log(`Hybrid EV API: No upcoming ${sport} events found`);
      return NextResponse.json(
        { error: `No upcoming ${sport} events found` },
        { status: 404 }
      );
    }
    
    console.log(`Hybrid EV API: Found ${upcomingEvents.length} upcoming ${sport} events`);
    
    // Take the first event
    const selectedEvent = upcomingEvents[0];
    console.log(`Hybrid EV API: Selected event ${selectedEvent.id} - ${selectedEvent.home_team} vs ${selectedEvent.away_team}`);
    
    // Use batter_runs_scored as it's the correct market key from the API
    const marketKey = 'batter_runs_scored';
    console.log(`Hybrid EV API: Using marketKey ${marketKey}`);
    
    // Get player props for this event
    const props = await getEventPlayerProps(
      sport,
      selectedEvent.id,
      [...activeSportsbooks, 'pinnacle'], // Explicitly add Pinnacle
      [marketKey]
    );
    
    console.log(`Hybrid EV API: Got response with ${props.bookmakers?.length || 0} bookmakers`);
    
    if (!props.bookmakers || props.bookmakers.length === 0) {
      console.log(`Hybrid EV API: No bookmakers data found for this event`);
      return NextResponse.json(
        { error: 'No bookmakers data found' },
        { status: 404 }
      );
    }
    
    // Calculate EVs with both methods
    const evCalculations: EVCalculation[] = [];
    const pinnacleBookmaker = props.bookmakers.find(bm => bm.key === 'pinnacle');
    
    if (pinnacleBookmaker) {
      console.log(`Hybrid EV API: Found Pinnacle with ${pinnacleBookmaker.markets.length} markets`);
    } else {
      console.log(`Hybrid EV API: Pinnacle bookmaker not found, will use average odds only`);
    }
    
    // Look at each bookmaker
    for (const bookmaker of props.bookmakers) {
      // Skip Pinnacle for bets, we use it as baseline only
      if (bookmaker.key === 'pinnacle') continue;
      
      console.log(`Hybrid EV API: Analyzing bookmaker ${bookmaker.key}`);
      
      for (const market of bookmaker.markets) {
        // Check if it's the right market
        if (market.key !== marketKey) continue;
        
        console.log(`Hybrid EV API: Found market ${marketKey} with ${market.outcomes?.length || 0} outcomes`);
        
        // Process each outcome
        for (const outcome of market.outcomes || []) {
          // The player name is in the description field
          const playerName = outcome.description;
          // The line is in the point field
          const line = outcome.point;
          const type = outcome.name as 'Over' | 'Under';
          
          if (!playerName || line === undefined) {
            console.log(`Hybrid EV API: Invalid outcome data for ${marketKey}, skipping`);
            continue;
          }
          
          console.log(`Hybrid EV API: ${bookmaker.key} offers ${playerName} ${marketKey} ${line} ${type} at ${outcome.price}`);
          
          // First try to find Pinnacle odds
          let pinnacleOutcome = null;
          
          if (pinnacleBookmaker) {
            const pinnacleMarket = pinnacleBookmaker.markets.find(m => m.key === marketKey);
            
            if (pinnacleMarket) {
              pinnacleOutcome = pinnacleMarket.outcomes?.find(o => 
                o.description === playerName && 
                Math.abs(o.point - line) < 0.1 &&
                o.name === type
              );
              
              if (pinnacleOutcome) {
                console.log(`Hybrid EV API: Found Pinnacle odds ${pinnacleOutcome.price} for ${playerName} ${line} ${type}`);
              }
            }
          }
          
          // If no Pinnacle odds, calculate average
          let baselineSource: 'pinnacle' | 'average' | 'no-vig' = 'average';
          let baselineOdds: number;
          let baselineDecimalOdds: number;
          let impliedProbability: number;
          let noVigProbability: number | undefined;
          let hasVig: number | undefined;
          let comparedBooks: string[] = [];
          
          if (pinnacleOutcome) {
            // Attempt to find no-vig probabilities using Pinnacle's over/under odds
            const pinnacleMarket = pinnacleBookmaker!.markets.find(m => m.key === marketKey);
            if (pinnacleMarket) {
              // Find the opposite outcome (if Over, find Under; if Under, find Over)
              const oppositeType = type === 'Over' ? 'Under' : 'Over';
              const oppositeOutcome = pinnacleMarket.outcomes?.find(o => 
                o.description === playerName && 
                Math.abs(o.point - line) < 0.1 &&
                o.name === oppositeType
              );
              
              if (oppositeOutcome) {
                // We have both sides of the market from Pinnacle, so we can calculate no-vig probabilities
                const { overProb, underProb } = calculateNoVigProbabilities(
                  type === 'Over' ? pinnacleOutcome.price : oppositeOutcome.price,
                  type === 'Under' ? pinnacleOutcome.price : oppositeOutcome.price
                );
                
                // Use the relevant no-vig probability
                noVigProbability = type === 'Over' ? overProb : underProb;
                baselineSource = 'no-vig';
                
                // Calculate the vig in the original Pinnacle market
                const pinnacleDecimal = americanToDecimal(pinnacleOutcome.price);
                const pinnacleImplied = decimalToImpliedProbability(pinnacleDecimal);
                hasVig = ((pinnacleImplied / noVigProbability) - 1) * 100; // vig as percentage
                
                console.log(`Hybrid EV API: Calculated no-vig probability: ${(noVigProbability * 100).toFixed(2)}%`);
                console.log(`Hybrid EV API: Original Pinnacle implied probability: ${(pinnacleImplied * 100).toFixed(2)}%`);
                console.log(`Hybrid EV API: Estimated vig: ${hasVig.toFixed(2)}%`);
                
                // Use the no-vig probability for EV calculation
                impliedProbability = noVigProbability;
                
                // For display purposes, convert no-vig probability to equivalent odds
                baselineDecimalOdds = 1 / noVigProbability;
                baselineOdds = baselineDecimalOdds > 2 
                  ? (baselineDecimalOdds - 1) * 100 
                  : -100 / (baselineDecimalOdds - 1);
                
                comparedBooks = ['pinnacle (no-vig)'];
              } else {
                // Fall back to regular Pinnacle odds if we can't find both sides
                baselineSource = 'pinnacle';
                baselineOdds = pinnacleOutcome.price;
                baselineDecimalOdds = americanToDecimal(baselineOdds);
                impliedProbability = decimalToImpliedProbability(baselineDecimalOdds);
                comparedBooks = ['pinnacle'];
              }
            } else {
              // Fall back to regular Pinnacle odds
              baselineSource = 'pinnacle';
              baselineOdds = pinnacleOutcome.price;
              baselineDecimalOdds = americanToDecimal(baselineOdds);
              impliedProbability = decimalToImpliedProbability(baselineDecimalOdds);
              comparedBooks = ['pinnacle'];
            }
          } else {
            // Calculate average odds across other bookmakers
            let totalProb = 0;
            let count = 0;
            
            for (const bm of props.bookmakers) {
              // Skip the current bookmaker when calculating average
              if (bm.key === bookmaker.key) continue;
              
              // Find matching market
              const m = bm.markets.find(m => m.key === marketKey);
              
              if (!m) continue;
              
              // Find the matching outcome
              const o = m.outcomes?.find(o => 
                o.description === playerName && 
                Math.abs(o.point - line) < 0.1 &&
                o.name === type
              );
              
              if (!o) continue;
              
              // Convert to decimal odds first, then to implied probability
              const otherDecimalOdds = americanToDecimal(o.price);
              const otherImpliedProb = decimalToImpliedProbability(otherDecimalOdds);
              
              console.log(`Hybrid EV API: Adding ${bm.key} odds ${o.price} (${otherDecimalOdds.toFixed(4)}) implied prob: ${(otherImpliedProb * 100).toFixed(2)}% to average calculation`);
              
              totalProb += otherImpliedProb;
              count++;
              comparedBooks.push(bm.key);
            }
            
            if (count === 0) {
              console.log(`Hybrid EV API: No other books to compare for ${playerName} ${line} ${type}, skipping`);
              continue;
            }
            
            // Average the probabilities, not the odds
            const avgImpliedProbability = totalProb / count;
            
            // For display purposes only, convert back to American odds
            // This is just to show what the equivalent American odds would be
            baselineDecimalOdds = 1 / avgImpliedProbability;
            baselineOdds = baselineDecimalOdds > 2 
              ? (baselineDecimalOdds - 1) * 100 
              : -100 / (baselineDecimalOdds - 1);
            
            impliedProbability = avgImpliedProbability;
            
            console.log(`Hybrid EV API: Average implied probability: ${(avgImpliedProbability * 100).toFixed(2)}%`);
            console.log(`Hybrid EV API: Equivalent decimal odds: ${baselineDecimalOdds.toFixed(4)}`);
            console.log(`Hybrid EV API: Equivalent American odds: ${baselineOdds.toFixed(2)}`);
          }
          
          // Calculate EV
          const decimalOdds = americanToDecimal(outcome.price);
          const ev = calculateEV(impliedProbability, decimalOdds);
          const evPercentage = ev * 100;
          
          console.log(`Hybrid EV API: ${bookmaker.key} ${playerName} ${marketKey} ${line} ${type}: EV = ${evPercentage.toFixed(2)}%`);
          console.log(`- Using ${baselineSource} as baseline`);
          console.log(`- American Odds: ${outcome.price}, Baseline American Odds: ${baselineOdds.toFixed(2)}`);
          console.log(`- Decimal Odds: ${decimalOdds.toFixed(4)}, Baseline Decimal Odds: ${baselineDecimalOdds.toFixed(4)}`);
          console.log(`- Implied Probability: ${(impliedProbability * 100).toFixed(2)}%`);
          
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
            baselineSource,
            baselineOdds,
            baselineDecimalOdds,
            impliedProbability,
            noVigProbability,
            ev,
            evPercentage,
            bookmakerCount: comparedBooks.length + 1, // Including the current book
            comparedBooks,
            hasVig
          });
        }
      }
    }
    
    // Sort by EV (highest first)
    const sortedCalculations = evCalculations.sort((a, b) => b.evPercentage - a.evPercentage);
    
    console.log(`Hybrid EV API: Completed with ${sortedCalculations.length} EV calculations`);
    
    const pinnacleAvailable = !!pinnacleBookmaker;
    const pinnacleCalculations = sortedCalculations.filter(calc => calc.baselineSource === 'pinnacle').length;
    const averageCalculations = sortedCalculations.filter(calc => calc.baselineSource === 'average').length;
    
    return NextResponse.json({
      event: {
        id: selectedEvent.id,
        home_team: selectedEvent.home_team,
        away_team: selectedEvent.away_team,
        commence_time: selectedEvent.commence_time,
        sport
      },
      marketKey,
      pinnacleAvailable,
      pinnacleCalculations,
      averageCalculations,
      calculations: sortedCalculations,
      calculationsCount: sortedCalculations.length,
      bookmakerCount: props.bookmakers.length
    });
    
  } catch (error) {
    console.error('Hybrid EV API Error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate EVs' },
      { status: 500 }
    );
  }
} 