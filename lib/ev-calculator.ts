// EV calculator for comparing odds between sportsbooks and Pinnacle
import { Bookmaker, Market, Outcome } from './odds-api';

// Type for EV betting opportunity
export interface EVBet {
  ev: number; // Expected value percentage
  market: string; // e.g., Points, Rebounds
  player: string;
  position?: string;
  line: number; // e.g., 27.5
  type: 'Over' | 'Under'; // Over or Under
  odds: number; // American odds for this opportunity
  decimalOdds: number; // Decimal version of odds
  trueProbability: number; // Derived from Pinnacle's line
  pinnacleOdds: number; // Original Pinnacle odds
  pinnacleDecimalOdds: number; // Decimal version of Pinnacle odds
  averageOdds: number; // Average odds across all books (excluding Pinnacle)
  sportsbook: string; // Sportsbook ID
  sportsbookName: string; // Display name
  eventId: string;
  matchup: string; // e.g., Knicks vs 76ers
  gameTime: string; // ISO timestamp
  averageLine: number; // Average line across all books
  discrepancy: number; // How far from average line (for risk assessment)
  bookmakerCount: number; // How many books offer this market
}

// Extended market interface to include player prop fields
export interface PlayerPropMarket extends Market {
  player: string;
  line: number;
}

// Function to convert American odds to decimal
export function americanToDecimal(americanOdds: number): number {
  if (americanOdds > 0) {
    return (americanOdds / 100) + 1;
  } else {
    return (100 / Math.abs(americanOdds)) + 1;
  }
}

// Function to convert decimal odds to implied probability
export function decimalToImpliedProbability(decimalOdds: number): number {
  return 1 / decimalOdds;
}

// Function to convert American odds to implied probability
export function americanToImpliedProbability(americanOdds: number): number {
  const decimalOdds = americanToDecimal(americanOdds);
  return decimalToImpliedProbability(decimalOdds);
}

// Calculate EV% given true probability (from Pinnacle) and book odds
export function calculateEV(trueProbability: number, decimalOdds: number): number {
  // EV% = (True Win Probability * Decimal Odds) - 1
  return (trueProbability * decimalOdds) - 1;
}

// Find Pinnacle's odds and implied probability for a given market/player/line
export function findPinnacleOdds(
  bookmakers: Bookmaker[],
  marketKey: string,
  playerName: string,
  line: number,
  type: 'Over' | 'Under'
): { odds: number; impliedProbability: number; decimalOdds: number } | null {
  const pinnacleBookmaker = bookmakers.find(bm => bm.key === 'pinnacle');
  
  if (!pinnacleBookmaker) {
    return null;
  }
  
  // Find the relevant market
  const market = pinnacleBookmaker.markets.find(m => 
    m.key === marketKey && 
    'player' in m && 
    (m as PlayerPropMarket).player === playerName && 
    'line' in m && 
    Math.abs((m as PlayerPropMarket).line - line) < 0.1
  );
  
  if (!market) {
    return null;
  }
  
  // Find the outcome (Over/Under)
  const outcome = market.outcomes.find(o => 
    o.name.includes(type) || 
    (type === 'Over' && o.name.includes('Over')) || 
    (type === 'Under' && o.name.includes('Under'))
  );
  
  if (!outcome) {
    return null;
  }
  
  const decimalOdds = americanToDecimal(outcome.price);
  
  return {
    odds: outcome.price,
    decimalOdds,
    impliedProbability: decimalToImpliedProbability(decimalOdds)
  };
}

// Calculate average line across all sportsbooks
export function calculateAverageLine(
  bookmakers: Bookmaker[],
  marketKey: string,
  playerName: string
): number {
  let totalLine = 0;
  let count = 0;
  
  for (const bookmaker of bookmakers) {
    for (const market of bookmaker.markets) {
      if (
        market.key === marketKey && 
        'player' in market && 
        (market as PlayerPropMarket).player === playerName &&
        'line' in market
      ) {
        totalLine += (market as PlayerPropMarket).line;
        count++;
        break; // Only count one market per bookmaker
      }
    }
  }
  
  return count > 0 ? totalLine / count : 0;
}

// Interface for event data
export interface EventData {
  id: string;
  bookmakers: Bookmaker[];
  home_team: string;
  away_team: string;
  commence_time: string;
}

// Function to calculate average odds for a market/player/line
export function calculateAverageOdds(
  bookmakers: Bookmaker[],
  marketKey: string,
  playerName: string,
  line: number,
  type: 'Over' | 'Under'
): { odds: number; impliedProbability: number; decimalOdds: number } | null {
  let totalOdds = 0;
  let count = 0;
  
  for (const bookmaker of bookmakers) {
    // Skip Pinnacle as we want to compare against the average of other books
    if (bookmaker.key === 'pinnacle') continue;

    // Find matching market
    const market = bookmaker.markets.find(m => 
      m.key === marketKey && 
      'player' in m && 
      (m as PlayerPropMarket).player === playerName && 
      'line' in m && 
      Math.abs((m as PlayerPropMarket).line - line) < 0.1
    );
    
    if (!market) continue;
    
    // Find the outcome (Over/Under)
    const outcome = market.outcomes.find(o => 
      o.name.includes(type) || 
      (type === 'Over' && o.name.includes('Over')) || 
      (type === 'Under' && o.name.includes('Under'))
    );
    
    if (!outcome) continue;
    
    totalOdds += outcome.price;
    count++;
  }
  
  if (count === 0) return null;
  
  const averageOdds = totalOdds / count;
  const decimalOdds = americanToDecimal(averageOdds);
  
  return {
    odds: averageOdds,
    decimalOdds,
    impliedProbability: decimalToImpliedProbability(decimalOdds)
  };
}

// Modified findEVBets function to always use average odds as baseline
export function findEVBets(
  eventData: EventData,
  minEVThreshold: number = 0,
  allowedSportsbooks: string[] = []
): EVBet[] {
  console.log(`EV analysis start for event ${eventData.id}`);
  console.log(`Minimum EV threshold: ${minEVThreshold * 100}%`);
  console.log(`Total bookmakers: ${eventData.bookmakers?.length || 0}`);

  const evBets: EVBet[] = [];
  const bookmakers = eventData.bookmakers || [];
  
  // Filter allowed sportsbooks if specified
  const filteredBookmakers = allowedSportsbooks.length > 0
    ? bookmakers.filter((bm: Bookmaker) => allowedSportsbooks.includes(bm.key))
    : bookmakers;
  
  console.log(`EV calculation - Using average odds as baseline for all comparisons`);
  console.log(`EV calculation - Total bookmakers: ${bookmakers.length}`);
  console.log(`EV calculation - Filtered bookmakers to check: ${filteredBookmakers.length}`);
  
  // Group markets by type to calculate proper averages
  const marketGroups = new Map<string, { key: string; player: string }[]>();
  
  // Debug all markets to make sure player props exist
  let totalPlayerMarkets = 0;
  for (const bookmaker of bookmakers) {
    const playerMarkets = bookmaker.markets.filter(m => 'player' in m);
    totalPlayerMarkets += playerMarkets.length;
  }
  console.log(`Total player markets across all bookmakers: ${totalPlayerMarkets}`);
  
  for (const bookmaker of bookmakers) {
    for (const market of bookmaker.markets) {
      if ('player' in market) {
        const key = `${market.key}-${(market as PlayerPropMarket).player}`;
        if (!marketGroups.has(key)) {
          marketGroups.set(key, []);
        }
        marketGroups.get(key)?.push({
          key: market.key,
          player: (market as PlayerPropMarket).player
        });
      }
    }
  }
  
  // Add counter variables to track what's happening
  let totalMarketsChecked = 0;
  let marketsWithoutComparison = 0;
  let betsWithNegativeEV = 0;
  let betsWithLowEV = 0;
  let betsWithHighEV = 0;
  
  // After the marketGroups loop, add this:
  console.log(`Found ${marketGroups.size} unique player market groups to check`);
  
  // Then in the main loop where we check markets, add logging:
  for (const [groupKey, marketInfo] of Array.from(marketGroups.entries())) {
    if (marketInfo.length === 0) continue;
    
    const { key: marketKey, player: playerName } = marketInfo[0];
    console.log(`\nChecking market: ${marketKey} for player: ${playerName}`);
    
    // Calculate average line for this market/player
    const averageLine = calculateAverageLine(bookmakers, marketKey, playerName);
    console.log(`Average line: ${averageLine}`);
    
    // Loop through each bookmaker (excluding the baseline bookmaker)
    for (const bookmaker of filteredBookmakers) {
      // Skip Pinnacle since we're only interested in sportsbooks where we can bet
      if (bookmaker.key === 'pinnacle') continue;
      
      // Find markets for this player
      const markets = bookmaker.markets.filter((m: Market) => 
        m.key === marketKey && 
        'player' in m && 
        (m as PlayerPropMarket).player === playerName
      );
      
      if (markets.length === 0) {
        console.log(`No matching markets for ${playerName} on ${bookmaker.key}`);
        continue;
      }
      
      for (const market of markets) {
        const playerMarket = market as PlayerPropMarket;
        const line = playerMarket.line;
        totalMarketsChecked++;
        
        // Check both Over and Under
        for (const type of ['Over', 'Under'] as const) {
          const outcome = market.outcomes.find((o: Outcome) => 
            o.name.includes(type) || 
            (type === 'Over' && o.name.includes('Over')) || 
            (type === 'Under' && o.name.includes('Under'))
          );
          
          if (!outcome) {
            console.log(`No ${type} outcome found for ${playerName} ${marketKey} on ${bookmaker.key}`);
            continue;
          }
          
          // Always use average odds as the baseline
          const baseline = calculateAverageOdds(bookmakers, marketKey, playerName, line, type);
          
          if (!baseline) {
            console.log(`No baseline comparison odds for ${playerName} ${marketKey} ${line} ${type}`);
            marketsWithoutComparison++;
            continue;
          }
          
          // Calculate EV
          const decimalOdds = americanToDecimal(outcome.price);
          const ev = calculateEV(baseline.impliedProbability, decimalOdds);
          console.log(`${bookmaker.key} ${playerName} ${marketKey} ${line} ${type}: EV = ${(ev * 100).toFixed(2)}% (Odds: ${outcome.price}, Avg Baseline: ${baseline.odds})`);
          
          // Track EV values
          if (ev < 0) {
            betsWithNegativeEV++;
          } else if (ev < minEVThreshold) {
            betsWithLowEV++;
          } else {
            betsWithHighEV++;
          }
          
          // Only include if EV meets threshold
          if (ev >= minEVThreshold) {
            console.log(`✅ FOUND EV BET: ${bookmaker.key} ${playerName} ${marketKey} ${line} ${type}: EV = ${(ev * 100).toFixed(2)}%`);
            
            // Find sportsbook name
            const sportsbookName = bookmaker.title || bookmaker.key;
            
            // Line discrepancy (risk assessment)
            const discrepancy = Math.abs(line - averageLine);
            
            // Count how many bookmakers offer this market
            const bookmakerCount = bookmakers.filter((bm: Bookmaker) => 
              bm.markets.some((m: Market) => 
                m.key === marketKey && 
                'player' in m && 
                (m as PlayerPropMarket).player === playerName
              )
            ).length;
            
            evBets.push({
              ev: ev * 100, // Convert to percentage
              market: marketKey
                .replace('player_', '')
                .replace('_alternate', '')
                .split('_')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' '),
              player: playerName,
              line,
              type,
              odds: outcome.price,
              decimalOdds,
              trueProbability: baseline.impliedProbability,
              pinnacleOdds: baseline.odds, // Using average odds instead of Pinnacle
              pinnacleDecimalOdds: baseline.decimalOdds,
              averageOdds: baseline.odds,
              sportsbook: bookmaker.key,
              sportsbookName,
              eventId: eventData.id,
              matchup: `${eventData.home_team} vs ${eventData.away_team}`,
              gameTime: eventData.commence_time,
              averageLine,
              discrepancy,
              bookmakerCount
            });
          }
        }
      }
    }
  }
  
  // Add summary at the end
  console.log(`\nEV Analysis Summary for event ${eventData.id}:`);
  console.log(`Total markets checked: ${totalMarketsChecked}`);
  console.log(`Markets with no comparison data: ${marketsWithoutComparison}`);
  console.log(`Negative EV bets: ${betsWithNegativeEV}`);
  console.log(`Low EV bets (< ${minEVThreshold * 100}%): ${betsWithLowEV}`);
  console.log(`High EV bets found: ${betsWithHighEV}`);
  console.log(`EV bets returned: ${evBets.length}`);
  
  // Sort by EV (highest first)
  return evBets.sort((a, b) => b.ev - a.ev);
}

// Calculate no-vig (fair) probabilities from a set of odds
export function calculateNoVigProbabilities(overOdds: number, underOdds: number): { overProb: number; underProb: number } {
  // Convert to decimal
  const overDecimal = americanToDecimal(overOdds);
  const underDecimal = americanToDecimal(underOdds);
  
  // Calculate implied probabilities with vig
  const overImpliedProb = 1 / overDecimal;
  const underImpliedProb = 1 / underDecimal;
  
  // Calculate the vig
  const vig = overImpliedProb + underImpliedProb - 1;
  
  // Remove the vig proportionally
  const overNoVigProb = overImpliedProb / (overImpliedProb + underImpliedProb);
  const underNoVigProb = underImpliedProb / (overImpliedProb + underImpliedProb);
  
  return { overProb: overNoVigProb, underProb: underNoVigProb };
} 