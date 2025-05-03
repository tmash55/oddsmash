import { NextResponse } from 'next/server';
import { getEvents, getEventPlayerProps } from '@/lib/odds-api';
import { sportsbooks } from '@/data/sportsbooks';

interface PlayerLine {
  player: string;
  line: number;
  type: 'Over' | 'Under';
  odds: number;
  sportsbook: string;
}

export async function GET() {
  try {
    console.log('Debug Batter Runs API: Starting...');
    
    // Get all active sportsbooks
    const activeSportsbooks = sportsbooks
      .filter(book => book.isActive)
      .map(book => book.id);
    
    console.log(`Debug Batter Runs API: Using ${activeSportsbooks.length} active sportsbooks`);
    
    // Focus entirely on MLB
    const sport = 'baseball_mlb';
    console.log(`Debug Batter Runs API: Focusing on ${sport} events`);
    
    // Get events for this sport
    const events = await getEvents(sport);
    
    if (!events || events.length === 0) {
      console.log(`Debug Batter Runs API: No ${sport} events found`);
      return NextResponse.json(
        { error: `No ${sport} events found` },
        { status: 404 }
      );
    }
    
    console.log(`Debug Batter Runs API: Found ${events.length} ${sport} events`);
    
    // Take the first upcoming event
    const now = new Date();
    const upcomingEvents = events
      .filter(event => new Date(event.commence_time) > now)
      .sort((a, b) => 
        new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime()
      );
    
    if (upcomingEvents.length === 0) {
      console.log(`Debug Batter Runs API: No upcoming ${sport} events found`);
      return NextResponse.json(
        { error: `No upcoming ${sport} events found` },
        { status: 404 }
      );
    }
    
    console.log(`Debug Batter Runs API: Found ${upcomingEvents.length} upcoming ${sport} events`);
    
    // Take the first event
    const selectedEvent = upcomingEvents[0];
    console.log(`Debug Batter Runs API: Selected event ${selectedEvent.id} - ${selectedEvent.home_team} vs ${selectedEvent.away_team}`);
    
    // Use 'batter_runs_scored' as this is the correct market key from the API
    const marketKey = 'batter_runs_scored';
    console.log(`Debug Batter Runs API: Using marketKey ${marketKey}`);
    
    // Get player props for this event
    const props = await getEventPlayerProps(
      sport,
      selectedEvent.id,
      activeSportsbooks,
      [marketKey]
    );
    
    console.log(`Debug Batter Runs API: Got response with ${props.bookmakers?.length || 0} bookmakers`);
    
    if (!props.bookmakers || props.bookmakers.length === 0) {
      console.log(`Debug Batter Runs API: No bookmakers data found for this event`);
      return NextResponse.json(
        { error: 'No bookmakers data found' },
        { status: 404 }
      );
    }
    
    // Collect all player lines from all bookmakers
    const playerLines: Record<string, PlayerLine[]> = {};
    
    // First, collect all players and their lines
    for (const bookmaker of props.bookmakers) {
      console.log(`Debug Batter Runs API: Processing bookmaker ${bookmaker.key} with ${bookmaker.markets.length} markets`);
      
      for (const market of bookmaker.markets) {
        if (market.key !== marketKey) continue;
        
        console.log(`Debug Batter Runs API: Found ${marketKey} market with ${market.outcomes?.length || 0} outcomes`);
        
        // Process each outcome
        for (const outcome of market.outcomes || []) {
          // The player name is in the description field
          const playerName = outcome.description;
          // The line is in the point field
          const line = outcome.point;
          const type = outcome.name as 'Over' | 'Under';
          
          if (!playerName || line === undefined) {
            console.log(`Debug Batter Runs API: Invalid outcome data for ${marketKey}, skipping`);
            continue;
          }
          
          console.log(`Debug Batter Runs API: Found ${marketKey} market for player ${playerName} with line ${line} (${type})`);
          
          const playerLine: PlayerLine = {
            player: playerName,
            line,
            type,
            odds: outcome.price,
            sportsbook: bookmaker.key
          };
          
          if (!playerLines[playerName]) {
            playerLines[playerName] = [];
          }
          
          playerLines[playerName].push(playerLine);
          
          console.log(`Debug Batter Runs API: ${bookmaker.key} offers ${playerName} ${type} ${line} at ${outcome.price}`);
        }
      }
    }
    
    // Organize by player for easy viewing
    const result = {
      event: {
        id: selectedEvent.id,
        home_team: selectedEvent.home_team,
        away_team: selectedEvent.away_team,
        commence_time: selectedEvent.commence_time
      },
      marketKey: marketKey,
      bookmakerCount: props.bookmakers.length,
      playerCount: Object.keys(playerLines).length,
      playerData: playerLines
    };
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Debug Batter Runs API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
} 