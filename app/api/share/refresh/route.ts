import { NextResponse } from "next/server";
import { getSharedProp, storeSharedProp, ShareablePropPayload } from "@/lib/share-utils";
import { getEventPlayerProps } from "@/lib/odds-api";
import { generateCacheKey, getCachedData } from "@/lib/redis";

// Define interfaces for bookmaker data
interface Outcome {
  name: string;
  price: number;
  point?: number;
  description?: string;
  sid?: string;
  link?: string;
}

interface Market {
  key: string;
  last_update?: string;
  outcomes: Outcome[];
}

interface Bookmaker {
  key: string;
  title: string;
  last_update: string;
  markets?: Market[];
}

interface BookmakerOutcome {
  name: string;
  price: number;
  point?: number;
  description?: string;
  sid?: string;
  link?: string;
}

interface GameData {
  bookmakers: Bookmaker[];
  home_team?: string;
  away_team?: string;
  commence_time?: string;
  [key: string]: any;
}

// Default bookmakers to use if none specified
const defaultBookmakers = [
  "draftkings",
  "fanduel",
  "betmgm",
  "caesars",
  "pointsbet",
  "barstool",
  "unibet_us",
  "betrivers"
];

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { shareId } = body;

    if (!shareId) {
      console.error("No share ID provided for refresh");
      return NextResponse.json(
        { error: "Share ID is required" },
        { status: 400 }
      );
    }

    console.log(`Refreshing share with ID: ${shareId}`);

    // Get the shared prop data from Redis
    const sharedProp = await getSharedProp(shareId);

    if (!sharedProp) {
      console.error(`Share with ID ${shareId} not found`);
      return NextResponse.json(
        { error: "Share not found" },
        { status: 404 }
      );
    }

    console.log(`Found shared prop for player: ${sharedProp.player}, statType: ${sharedProp.statType}, line: ${sharedProp.line}`);
    
    // Get the event ID from the shared prop or try to identify it
    const eventId = sharedProp.eventId || 
                   (sharedProp.event && 'id' in sharedProp.event ? (sharedProp.event as any).id : null);

    if (!eventId) {
      console.error("No event ID available for refresh");
      return NextResponse.json(
        { error: "Event ID not available for refresh" },
        { status: 400 }
      );
    }

    // Log key information for debugging
    console.log(`Using eventId: ${eventId}, sportId: ${sharedProp.sportId}`);
    
    // Check for fresh cached data first using the same key format as in odds-api.ts getEventPlayerProps
    const cacheKey = generateCacheKey([
      "player-props",
      sharedProp.sportId,
      eventId,
      sharedProp.statType
    ]);
    
    // Try to get the data from cache first
    const cachedData = await getCachedData<GameData>(cacheKey);
    let freshData: GameData;
    
    if (cachedData) {
      console.log("Found fresh data in cache");
      freshData = cachedData;
    } else {
      console.log("No fresh data in cache, fetching from API");
      // Determine which markets to request based on the statType
      const marketToFetch = sharedProp.marketKey || `player_${sharedProp.statType.toLowerCase()}`;
      
      // Fetch fresh data
      freshData = await getEventPlayerProps(
        sharedProp.sportId,
        eventId,
        sharedProp.selectedBooks || defaultBookmakers,
        [marketToFetch]
      ) as GameData;
    }

    if (!freshData) {
        console.error("API returned no data for event:", eventId);
        return NextResponse.json(
          { error: 'Failed to fetch fresh data from API' },
          { status: 500 }
        );
      }
      
      if (!freshData.bookmakers || freshData.bookmakers.length === 0) {
        console.error("API returned no bookmakers for event:", eventId);
        return NextResponse.json(
          { error: 'No bookmaker data available for this event' },
          { status: 500 }
        );
      }

      console.log(`Found ${freshData.bookmakers.length} bookmakers in fresh data`);

      // Process the bookmakers to extract relevant SIDs and links for deeplink preservation
      const extractSidsAndLinks = (bookmakers: any[], betType: "over" | "under" | "both") => {
        const extractedSids: Record<string, string> = {};
        const extractedLinks: Record<string, string> = {};
        
        bookmakers.forEach(bookmaker => {
          // If the bookmaker has markets, look for SIDs in outcomes
          if (bookmaker.markets) {
            const market = bookmaker.markets.find((m: any) => m.key === sharedProp.marketKey);
            if (market && market.outcomes) {
              // Find Over/Under outcomes for this line based on bet type
              if (betType === "both" || betType === "over") {
                const overOutcome = market.outcomes.find((o: any) => 
                  o.name === "Over" && Math.abs(o.point - sharedProp.line) < 0.5
                );
                if (overOutcome) {
                  if (overOutcome.sid) {
                    extractedSids[`${bookmaker.key}_over`] = overOutcome.sid;
                  }
                  if (overOutcome.link) {
                    // Ensure we're storing links with appropriate state placeholders
                    let link = overOutcome.link;
                    
                    // Handle specific sportsbooks that need state parameters
                    if (bookmaker.key === "betmgm") {
                      // Ensure BetMGM links use the state placeholder
                      if (!link.includes('{state}')) {
                        // Extract the state code if it exists in the link
                        const stateMatch = link.match(/https:\/\/sports\.([a-z]{2})\.betmgm\.com/);
                        if (stateMatch && stateMatch[1]) {
                          // Replace the specific state with the placeholder
                          link = link.replace(`https://sports.${stateMatch[1]}.betmgm.com`, 'https://sports.{state}.betmgm.com');
                        }
                      }
                    } else if (bookmaker.key === "betrivers") {
                      // For BetRivers, we'll extract the event ID and selection ID for the front-end to use
                      const eventIdMatch = link.match(/#event\/(\d+)/);
                      const couponMatch = link.match(/\?coupon=([^|]+)\|([^|]+)\|([^&]+)/);
                      
                      // Store the base URL for BetRivers, front-end will handle state
                      if (eventIdMatch && eventIdMatch[1]) {
                        // Extract just the essential parts for the front-end to reconstruct
                        link = `https://STATECODE.betrivers.com/?page=sportsbook#event/${eventIdMatch[1]}`;
                        if (couponMatch) {
                          link += `?coupon=${couponMatch[1]}|${couponMatch[2]}|${couponMatch[3]}`;
                        }
                      }
                    } else if (bookmaker.key === "williamhill_us") {
                      // For Caesars (William Hill), ensure we have selection IDs
                      const selectionIdsMatch = link.match(/selectionIds=([^&]+)/);
                      if (selectionIdsMatch && selectionIdsMatch[1]) {
                        // Store just the selection IDs, front-end will handle the base URL with state
                        link = `https://sportsbook.caesars.com/us/STATECODE/bet/betslip?selectionIds=${selectionIdsMatch[1]}`;
                      }
                    }
                    
                    extractedLinks[`${bookmaker.key}_over`] = link;
                  }
                }
              }
              
              if (betType === "both" || betType === "under") {
                const underOutcome = market.outcomes.find((o: any) => 
                  o.name === "Under" && Math.abs(o.point - sharedProp.line) < 0.5
                );
                if (underOutcome) {
                  if (underOutcome.sid) {
                    extractedSids[`${bookmaker.key}_under`] = underOutcome.sid;
                  }
                  if (underOutcome.link) {
                    // Ensure we're storing links with appropriate state placeholders 
                    let link = underOutcome.link;
                    
                    // Handle specific sportsbooks that need state parameters
                    if (bookmaker.key === "betmgm") {
                      // Ensure BetMGM links use the state placeholder
                      if (!link.includes('{state}')) {
                        // Extract the state code if it exists in the link
                        const stateMatch = link.match(/https:\/\/sports\.([a-z]{2})\.betmgm\.com/);
                        if (stateMatch && stateMatch[1]) {
                          // Replace the specific state with the placeholder
                          link = link.replace(`https://sports.${stateMatch[1]}.betmgm.com`, 'https://sports.{state}.betmgm.com');
                        }
                      }
                    } else if (bookmaker.key === "betrivers") {
                      // For BetRivers, we'll extract the event ID and selection ID for the front-end to use
                      const eventIdMatch = link.match(/#event\/(\d+)/);
                      const couponMatch = link.match(/\?coupon=([^|]+)\|([^|]+)\|([^&]+)/);
                      
                      // Store the base URL for BetRivers, front-end will handle state
                      if (eventIdMatch && eventIdMatch[1]) {
                        // Extract just the essential parts for the front-end to reconstruct
                        link = `https://STATECODE.betrivers.com/?page=sportsbook#event/${eventIdMatch[1]}`;
                        if (couponMatch) {
                          link += `?coupon=${couponMatch[1]}|${couponMatch[2]}|${couponMatch[3]}`;
                        }
                      }
                    } else if (bookmaker.key === "williamhill_us") {
                      // For Caesars (William Hill), ensure we have selection IDs
                      const selectionIdsMatch = link.match(/selectionIds=([^&]+)/);
                      if (selectionIdsMatch && selectionIdsMatch[1]) {
                        // Store just the selection IDs, front-end will handle the base URL with state
                        link = `https://sportsbook.caesars.com/us/STATECODE/bet/betslip?selectionIds=${selectionIdsMatch[1]}`;
                      }
                    }
                    
                    extractedLinks[`${bookmaker.key}_under`] = link;
                  }
                }
              }
            }
          }
        });
        
        return { sids: extractedSids, links: extractedLinks };
      };

      // Process the fresh data to find matching player props
      const bookmakers = freshData.bookmakers || [];
      let matchingOutcome: BookmakerOutcome | null = null;
      let matchingBookmaker: Bookmaker | null = null;
      let matchingLine: number | null = null;

      // Find the first matching outcome in any bookmaker
      let matchFound = false;
      
      // Use an exact match strategy for player name
      const normalizedPlayerName = sharedProp.player.toLowerCase().trim();
      
      for (const bookmaker of bookmakers) {
        if (!bookmaker.markets) continue;
        
        for (const market of bookmaker.markets) {
          if (market.key !== sharedProp.marketKey) continue;
          
          for (const outcome of market.outcomes || []) {
            // Exact player matching - use normalized strings for comparison
            const playerDescription = typeof outcome.description === 'string' 
              ? outcome.description.toLowerCase().trim() 
              : '';
              
            // Check for exact player match first
            const isExactPlayerMatch = playerDescription === normalizedPlayerName;
            
            // If not exact, check if it contains the player name (as a fallback)
            const containsPlayerName = !isExactPlayerMatch && 
              playerDescription.includes(normalizedPlayerName);
            
            // Use exact match first, then fallback to contains
            const playerMatches = isExactPlayerMatch || containsPlayerName;
            
            if (playerMatches && typeof outcome.point === 'number') {
              // Look for the exact same line first
              if (outcome.point === sharedProp.line) {
                matchingOutcome = outcome;
                matchingBookmaker = bookmaker;
                matchingLine = outcome.point;
                matchFound = true;
                console.log(`Found EXACT match for ${sharedProp.player} with line ${matchingLine}`);
                break;
              } 
              // If exact line not found, look for close match (within 0.5)
              else if (!matchingOutcome && Math.abs(outcome.point - sharedProp.line) < 0.5) {
                matchingOutcome = outcome;
                matchingBookmaker = bookmaker;
                matchingLine = outcome.point;
                // Don't break here - continue looking for exact match
                console.log(`Found close match for ${sharedProp.player} with line ${matchingLine}`);
              }
            }
          }
          
          if (matchFound) break;
        }
        
        if (matchFound) break;
      }

      // If we can't find a matching outcome, keep the original line
      if (!matchingOutcome || matchingLine === null) {
        console.log(`No matching prop found for ${sharedProp.player} with line ~${sharedProp.line}, keeping original line`);
        matchingLine = sharedProp.line;
      }

      // Make sure we have all bookmakers enabled
      // Check if we need to limit to specific bookmakers from the original request
      const selectedBooks = Array.isArray(sharedProp.selectedBooks) && sharedProp.selectedBooks.length > 0 ? 
        sharedProp.selectedBooks : 
        defaultBookmakers;

      console.log(`Using selected bookmakers: ${selectedBooks.join(', ')}`);

      // CRITICAL: Ensure the exact same betType is preserved - do not default to 'both'
      const preservedBetType = sharedProp.betType || "both";
      console.log(`Preserving bet type: ${preservedBetType}`);

      // Extract deep linking information from the fresh data
      const { sids: freshSids, links: freshLinks } = extractSidsAndLinks(bookmakers, preservedBetType);

      // Create updated shared prop data
      const updatedProp: ShareablePropPayload = {
        ...sharedProp,
        line: matchingLine,
        // Use ALL bookmakers from fresh data
        bookmakers: bookmakers,
        // Store selected books for future reference 
        selectedBooks: selectedBooks,
        // Update timestamp
        timestamp: Date.now(),
        // Keep the original eventId to make future refreshing possible
        eventId: sharedProp.eventId || eventId,
        // Preserve game info from original or from fresh data
        homeTeam: sharedProp.homeTeam || freshData.home_team,
        awayTeam: sharedProp.awayTeam || freshData.away_team,
        commence_time: sharedProp.commence_time || freshData.commence_time,
        // STRICTLY preserve betType
        betType: preservedBetType,
        // Update SIDs and links with fresh ones but preserve old ones if they exist and don't have a fresh match
        sids: { ...sharedProp.sids, ...freshSids },
        links: { ...sharedProp.links, ...freshLinks }
      };

      // Store the updated prop
      const newShareId = await storeSharedProp(updatedProp);

      // Return the success response
      return NextResponse.json({
        success: true,
        message: "Share refreshed successfully",
        shareId: newShareId
      });
    } catch (error) {
      console.error("Error refreshing shared prop:", error);
      return NextResponse.json(
        { error: `Failed to refresh shared prop: ${error instanceof Error ? error.message : String(error)}` },
        { status: 500 }
      );
    }
} 