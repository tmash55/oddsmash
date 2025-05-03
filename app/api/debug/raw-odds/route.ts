import { NextRequest, NextResponse } from 'next/server';
import { getEvents, getEventPlayerProps } from '@/lib/odds-api';
import { sportsbooks } from '@/data/sportsbooks';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const player = searchParams.get('player');
    const line = searchParams.get('line');
    const type = searchParams.get('type');
    const eventId = searchParams.get('eventId');
    const marketKey = searchParams.get('marketKey') || 'batter_runs_scored';
    
    if (!player || !line || !type) {
      return NextResponse.json(
        { error: 'Missing required parameters: player, line, type' },
        { status: 400 }
      );
    }
    
    console.log(`Raw Odds API: Fetching odds for ${player} ${line} ${type} in market ${marketKey}`);
    
    // Get all active sportsbooks
    const activeSportsbooks = sportsbooks
      .filter(book => book.isActive)
      .map(book => book.id);
    
    // Add Pinnacle explicitly
    const allSportsbooks = [...activeSportsbooks, 'pinnacle'];
    console.log(`Raw Odds API: Using ${allSportsbooks.length} sportsbooks`);
    
    // Default to baseball_mlb
    const sport = 'baseball_mlb';
    
    let selectedEventId = eventId;
    
    // If no event ID was provided, get the first upcoming event
    if (!selectedEventId) {
      const events = await getEvents(sport);
      
      if (!events || events.length === 0) {
        return NextResponse.json(
          { error: `No ${sport} events found` },
          { status: 404 }
        );
      }
      
      // Take the first upcoming event
      const now = new Date();
      const upcomingEvents = events
        .filter(event => new Date(event.commence_time) > now)
        .sort((a, b) => 
          new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime()
        );
      
      if (upcomingEvents.length === 0) {
        return NextResponse.json(
          { error: `No upcoming ${sport} events found` },
          { status: 404 }
        );
      }
      
      selectedEventId = upcomingEvents[0].id;
      console.log(`Raw Odds API: Using event ${selectedEventId}`);
    }
    
    // Get props for the selected event
    const props = await getEventPlayerProps(
      sport,
      selectedEventId,
      allSportsbooks,
      [marketKey]
    );
    
    if (!props.bookmakers || props.bookmakers.length === 0) {
      return NextResponse.json(
        { error: 'No bookmakers data found' },
        { status: 404 }
      );
    }
    
    // Find all odds for the selected player/line/type
    const rawOdds = [];
    const lineValue = parseFloat(line);
    
    for (const bookmaker of props.bookmakers) {
      const market = bookmaker.markets.find(m => m.key === marketKey);
      
      if (!market) continue;
      
      // Find matching outcome
      const outcome = market.outcomes?.find(o => 
        o.description === player && 
        Math.abs(o.point - lineValue) < 0.1 &&
        o.name === type
      );
      
      if (outcome) {
        rawOdds.push({
          sportsbook: bookmaker.key,
          sportsbookTitle: bookmaker.title,
          odds: outcome.price,
          line: outcome.point
        });
      }
    }
    
    if (rawOdds.length === 0) {
      return NextResponse.json(
        { error: 'No matching odds found for the specified player/line/type' },
        { status: 404 }
      );
    }
    
    // Sort by sportsbook name
    rawOdds.sort((a, b) => a.sportsbook.localeCompare(b.sportsbook));
    
    return NextResponse.json({
      player,
      line: lineValue,
      type,
      marketKey,
      eventId: selectedEventId,
      odds: rawOdds,
      bookmakerCount: rawOdds.length
    });
    
  } catch (error) {
    console.error('Raw Odds API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch raw odds data' },
      { status: 500 }
    );
  }
} 