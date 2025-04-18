import { NextResponse } from "next/server";
import { storeSharedProp, type ShareablePropPayload } from "@/lib/share-utils";

// Define types for bookmaker data
interface BookmakerOutcome {
  name: string;
  price: number;
  point: number;
}

interface BookmakerMarket {
  key: string;
  outcomes: BookmakerOutcome[];
}

interface Bookmaker {
  key: string;
  title?: string;
  markets?: BookmakerMarket[];
  outcomes?: {
    over?: { price: number };
    under?: { price: number };
  };
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    const payload = await request.json();
    
    // Log the request for debugging
    console.log('Received share request:', {
      player: payload.player,
      line: payload.line,
      statType: payload.statType,
      marketKey: payload.marketKey,
      sportId: payload.sportId,
      eventId: payload.eventId,
      homeTeam: payload.homeTeam,
      awayTeam: payload.awayTeam,
      commence_time: payload.commence_time,
      hasTeams: !!(payload.homeTeam && payload.awayTeam),
      hasCommenceTime: !!payload.commence_time,
      hasEventId: !!payload.eventId,
      bookmakerCount: payload.bookmakers?.length || 0,
      betType: payload.betType || 'both',
      selectedBooksCount: payload.selectedBooks?.length || 0
    });
    
    // Validate the payload
    if (!payload.player || !payload.line || !payload.statType || !payload.marketKey) {
      console.error('Invalid share payload:', payload);
      return NextResponse.json(
        { error: "Invalid payload. Missing required fields." },
        { status: 400 }
      );
    }
    
    // Validate bookmakers
    if (!payload.bookmakers || !Array.isArray(payload.bookmakers) || payload.bookmakers.length === 0) {
      console.error('Invalid bookmakers in share payload');
      return NextResponse.json(
        { error: "Invalid payload. Bookmakers data is missing or invalid." },
        { status: 400 }
      );
    }
    
    // Process bookmakers to ensure they have markets
    const validatedBookmakers = payload.bookmakers.map((bookmaker: Bookmaker) => {
      // If no markets array exists, create one with the marketKey
      if (!bookmaker.markets || !Array.isArray(bookmaker.markets)) {
        // Try to find outcomes in the bookmaker object
        const outcomes: BookmakerOutcome[] = [];
        if (bookmaker.outcomes && typeof bookmaker.outcomes === 'object') {
          // Handle legacy format with over/under
          if (bookmaker.outcomes.over || bookmaker.outcomes.under) {
            if (bookmaker.outcomes.over) {
              outcomes.push({
                name: 'Over',
                price: bookmaker.outcomes.over.price,
                point: payload.line
              });
            }
            
            if (bookmaker.outcomes.under) {
              outcomes.push({
                name: 'Under',
                price: bookmaker.outcomes.under.price,
                point: payload.line
              });
            }
          }
        }
        
        // Create a new markets array
        return {
          key: bookmaker.key,
          title: bookmaker.title,
          markets: [{
            key: payload.marketKey,
            outcomes: outcomes
          }]
        };
      }
      
      return bookmaker;
    });
    
    // Add timestamp if not included
    const sharePayload: ShareablePropPayload = {
      player: payload.player,
      line: payload.line,
      statType: payload.statType,
      marketKey: payload.marketKey,
      bookmakers: validatedBookmakers,
      timestamp: payload.timestamp || Date.now(),
      sportId: payload.sportId || 'default',
      // Include event ID for refreshing
      eventId: payload.eventId,
      // Add team and game time information if available
      homeTeam: payload.homeTeam,
      awayTeam: payload.awayTeam,
      commence_time: payload.commence_time,
      // Include SIDs and links
      sids: payload.sids,
      links: payload.links,
      // Include bet type for consistent display
      betType: payload.betType || 'both',
      // Store selected bookmakers for refresh consistency
      selectedBooks: payload.selectedBooks || []
    };
    
    // Store in Redis and get unique ID
    const shareId = await storeSharedProp(sharePayload);
    
    // Log success
    console.log(`Created share with ID: ${shareId}`);
    
    // Return the share ID
    return NextResponse.json({ shareId });
  } catch (error) {
    console.error("Error sharing prop:", error);
    return NextResponse.json(
      { error: "Failed to share prop. Please try again." },
      { status: 500 }
    );
  }
} 