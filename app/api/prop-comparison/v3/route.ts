import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { z } from "zod";
import type { 
  V3MarketData, 
  V3PlayerOdds, 
  PropComparisonV3Params, 
  PropComparisonV3Response,
  V3OddsData,
  V3LineMetrics,
  V3OddsPrice
} from "@/types/prop-comparison-v3";
import { SPORTSBOOK_ID_MAP, REVERSE_SPORTSBOOK_MAP } from "@/lib/constants/sportsbook-mappings";
import { getSportsbookById } from "@/data/sportsbooks";

// Sport mapping for Redis keys (if needed)
const SPORT_KEY_MAP: Record<string, string> = {
  'football_nfl': 'nfl',
  'americanfootball_nfl': 'nfl',
  'basketball_nba': 'nba',
  'basketball_ncaab': 'ncaab',
  'baseball_mlb': 'mlb',
  'football_ncaaf': 'ncaaf',
  'americanfootball_ncaaf': 'ncaaf',
};

// Market code mapping for OddsBlaze vendor keys
const MARKET_CODE_MAP: Record<string, string> = {
  // NFL/NCAAF Markets - map display names to vendor keys
  'passing_yards': 'passing_yards',
  'pass yards': 'passing_yards',
  'receiving_yards': 'receiving_yards', 
  'reception yards': 'receiving_yards',
  'rushing_yards': 'rushing_yards',
  'rush yards': 'rushing_yards',
  'receptions': 'receptions',
  'passing_touchdowns': 'passing_tds',
  'pass touchdowns': 'passing_tds',
  'receiving_touchdowns': 'receiving_tds', 
  'reception touchdowns': 'receiving_tds',
  'rushing_touchdowns': 'rushing_tds',
  'rush touchdowns': 'rushing_tds',
  'anytime_touchdown_scorer': 'anytime_touchdown_scorer',
  'anytime touchdown scorer': 'anytime_touchdown_scorer',
  'pass_attempts': 'pass_attempts',
  'pass attempts': 'pass_attempts',
  'pass_completions': 'pass_completions',
  'pass completions': 'pass_completions',
  'pass_intercepts': 'pass_intercepts',
  'pass intercepts': 'pass_intercepts',
  'interceptions thrown': 'pass_intercepts',
  'rush_attempts': 'rush_attempts',
  'rush attempts': 'rush_attempts',
  'targets': 'targets',
  'longest_pass_completion': 'longest_pass_completion',
  'longest pass completion': 'longest_pass_completion',
  'longest_reception': 'longest_reception',
  'longest reception': 'longest_reception',
  'longest_rush': 'longest_rush',
  'longest rush': 'longest_rush',
  '1st_quarter_pass_yards': '1st_quarter_pass_yards',
  '1st quarter pass yards': '1st_quarter_pass_yards',
  
  // Combo markets
  'pass_rush_reception_yards': 'pass_rush_reception_yards',
  'pass + rush + reception yards': 'pass_rush_reception_yards',
  'pass_rush_reception_touchdowns': 'pass_rush_reception_touchdowns', 
  'pass + rush + reception touchdowns': 'pass_rush_reception_touchdowns',
  'rush_reception_yards': 'rush_reception_yards',
  'rush + reception yards': 'rush_reception_yards',
  'rush_reception_touchdowns': 'rush_reception_touchdowns',
  'rush + reception touchdowns': 'rush_reception_touchdowns',
  
  // Kicking
  'field_goals': 'field_goals',
  'field goals': 'field_goals',
  'kicking_points': 'kicking_points',
  'kicking points': 'kicking_points',
  'points_after_touchdown': 'points_after_touchdown',
  'points after touchdown': 'points_after_touchdown',
  
  // Defense
  'defensive_interceptions': 'defensive_interceptions',
  'defensive interceptions': 'defensive_interceptions',
  'sacks': 'sacks',
  'solo_tackles': 'solo_tackles',
  'solo tackles': 'solo_tackles',
  'tackles_assists': 'tackles_assists',
  'tackles + assists': 'tackles_assists',
  
  // Special
  'assists': 'assists',
  'touchdowns': 'touchdowns',
  '1st_touchdown_scorer': '1st_touchdown_scorer',
  '1st touchdown scorer': '1st_touchdown_scorer',
  'last_touchdown_scorer': 'last_touchdown_scorer',
  'last touchdown scorer': 'last_touchdown_scorer',
};

// Helper functions for server-side processing
function isYesNoMarket(market: string): boolean {
  const m = (market || "").toLowerCase()
  return m === "anytime touchdown scorer" || m === "1st touchdown scorer" || m === "last touchdown scorer"
}

function isFootballSport(sport: string): boolean {
  const s = (sport || "").toLowerCase()
  return ["football_nfl", "americanfootball_nfl", "nfl", "football_ncaaf", "americanfootball_ncaaf", "ncaaf"].includes(s)
}

// Function to determine the active line for a player
function getActiveLine(playerData: any, globalLine?: string): string {
  // When using standard lines, use the primary_line from Redis if available
  // Otherwise, use global line if available and the player has odds for that line
  if (!globalLine && playerData.primary_line) {
    return playerData.primary_line.toString()
  }
  
  if (globalLine && playerData.lines?.[globalLine]) {
    return globalLine
  }
  
  // Fallback to first available line
  const availableLines = Object.keys(playerData.lines || {})
  return availableLines.length > 0 ? availableLines[0] : "0"
}

// Simplified function to extract best odds directly from Redis data (no fallback logic)
function extractBestOdds(
  playerData: any, 
  lastUpdated: string
): {
  bestOverOdds: V3OddsPrice | null
  bestUnderOdds: V3OddsPrice | null
  bestOverPrice: number
  bestUnderPrice: number
  bestOverBook: string
  bestUnderBook: string
  bestOverLine?: number
  bestUnderLine?: number
} {
  let bestOverOdds: V3OddsPrice | null = null
  let bestUnderOdds: V3OddsPrice | null = null
  let bestOverPrice = 0
  let bestUnderPrice = 0
  let bestOverBook = ""
  let bestUnderBook = ""
  let bestOverLine: number | undefined
  let bestUnderLine: number | undefined

  // Extract Redis best over data
  if (playerData.best?.over) {
    const bestOver = playerData.best.over
    const mappedBookId = REVERSE_SPORTSBOOK_MAP[bestOver.book.toLowerCase()] || bestOver.book.toLowerCase()
    
    bestOverPrice = bestOver.price
    bestOverBook = mappedBookId
    bestOverLine = bestOver.line
    bestOverOdds = {
      price: bestOver.price,
      link: bestOver.link || bestOver.links?.desktop,
      sid: mappedBookId,
      last_update: lastUpdated,
    }
  }

  // Extract Redis best under data
  if (playerData.best?.under) {
    const bestUnder = playerData.best.under
    const mappedBookId = REVERSE_SPORTSBOOK_MAP[bestUnder.book.toLowerCase()] || bestUnder.book.toLowerCase()
    
    bestUnderPrice = bestUnder.price
    bestUnderBook = mappedBookId
    bestUnderLine = bestUnder.line
    bestUnderOdds = {
      price: bestUnder.price,
      link: bestUnder.link || bestUnder.links?.desktop,
      sid: mappedBookId,
      last_update: lastUpdated,
    }
  }

  return {
    bestOverOdds,
    bestUnderOdds,
    bestOverPrice,
    bestUnderPrice,
    bestOverBook,
    bestUnderBook,
    bestOverLine,
    bestUnderLine,
  }
}

// Validation schema for request parameters
const RequestSchema = z.object({
  sport: z.string(),
  market: z.string(),
  scope: z.enum(['pregame', 'live']).optional().default('pregame'),
  gameId: z.string().nullable().optional(),
}).transform(data => ({
  sport: data.sport,
  market: data.market,
  scope: data.scope,
  gameId: data.gameId || undefined,
}));

export async function GET(request: Request) {
  try {
    // Parse URL parameters
    const { searchParams } = new URL(request.url);
    const params = {
      sport: searchParams.get("sport"),
      market: searchParams.get("market"),
      scope: searchParams.get("scope") as 'pregame' | 'live' | null,
      gameId: searchParams.get("gameId"),
    };

    // Validate parameters
    const validatedParams = RequestSchema.parse(params);

    // Convert sport name to Redis key format
    const sportKey = SPORT_KEY_MAP[validatedParams.sport] || validatedParams.sport;
    
    // Convert market name to market code
    const marketCode = MARKET_CODE_MAP[validatedParams.market] || validatedParams.market;

    // Construct Redis key pattern: odds:{sport}:props:{market_code}:primary:{scope}
    const redisKey = `odds:${sportKey}:props:${marketCode}:primary:${validatedParams.scope}`;

    console.log(`[/api/prop-comparison/v3] Fetching key: ${redisKey}`);

    // Get the market data from Redis
    const startTime = Date.now();
    const rawData = await redis.get<V3MarketData | string>(redisKey);
    const redisTime = Date.now() - startTime;
    
    if (!rawData) {
      console.log(`[/api/prop-comparison/v3] No data found for key: ${redisKey} (${redisTime}ms)`);
      return NextResponse.json({
        success: true,
        data: [],
        metadata: {
          total: 0,
          sport: validatedParams.sport,
          market: validatedParams.market,
          scope: validatedParams.scope,
          gameId: validatedParams.gameId,
          keysFound: 0,
          eventsFound: 0,
          playersFound: 0,
          lastUpdated: null,
        }
      } as PropComparisonV3Response);
    }

    // Parse data if it's a string and log payload sizes
    let marketData: V3MarketData;
    const parseStartTime = Date.now();
    
    // Calculate payload size for monitoring
    const rawDataSize = typeof rawData === 'string' 
      ? new Blob([rawData]).size 
      : JSON.stringify(rawData).length;
    
    if (typeof rawData === 'string') {
      try {
        marketData = JSON.parse(rawData);
      } catch (error) {
        console.error(`[/api/prop-comparison/v3] Failed to parse JSON for key: ${redisKey}`, error);
        throw new Error('Invalid JSON data in Redis');
      }
    } else {
      marketData = rawData;
    }
    
    const parseTime = Date.now() - parseStartTime;
    const eventsCount = Object.keys(marketData.events || {}).length;
    
    // Calculate total players for memory usage estimation
    let totalPlayersInRedis = 0;
    let totalBooksInRedis = 0;
    for (const eventData of Object.values(marketData.events || {})) {
      const playersInEvent = Object.keys(eventData.players || {}).length;
      totalPlayersInRedis += playersInEvent;
      
      // Count sportsbooks per player (for memory estimation)
      for (const playerData of Object.values(eventData.players || {})) {
        totalBooksInRedis += Object.keys(playerData.books || {}).length;
      }
    }

    console.log(`[/api/prop-comparison/v3] Redis payload analysis:`, {
      key: redisKey,
      redisTime: `${redisTime}ms`,
      parseTime: `${parseTime}ms`,
      rawSizeKB: Math.round(rawDataSize / 1024),
      events: eventsCount,
      players: totalPlayersInRedis,
      avgPlayersPerEvent: totalPlayersInRedis / Math.max(eventsCount, 1),
      totalSportsbookEntries: totalBooksInRedis,
      avgBooksPerPlayer: totalBooksInRedis / Math.max(totalPlayersInRedis, 1),
      gameIdFilter: validatedParams.gameId || 'none'
    });

    // **OPTIMIZATION**: Early filtering to reduce processing overhead
    let eventsToProcess: Record<string, any> = marketData.events || {};
    let filteredEventsCount = 0;
    
    // Apply gameId filter early to reduce memory allocation
    if (validatedParams.gameId) {
      const filteredEvents: Record<string, any> = {};
      if (marketData.events?.[validatedParams.gameId]) {
        filteredEvents[validatedParams.gameId] = marketData.events[validatedParams.gameId];
        filteredEventsCount = 1;
      }
      eventsToProcess = filteredEvents;
      
      console.log(`[/api/prop-comparison/v3] Applied gameId filter: ${validatedParams.gameId}, events: ${eventsCount} → ${filteredEventsCount}`);
    } else {
      filteredEventsCount = eventsCount;
    }

    // Transform the V3 data structure to match existing component expectations
    const transformedPlayers: V3PlayerOdds[] = [];
    let totalPlayersFound = 0;

    // Convert updated_at timestamp to ISO string
    const lastUpdated = marketData.updated_at ? new Date(marketData.updated_at * 1000).toISOString() : null;
    const transformStartTime = Date.now();

    // Process each event (now potentially filtered)
    for (const [eventId, eventData] of Object.entries(eventsToProcess)) {

      // Process each player in the event
      for (const [playerId, playerData] of Object.entries(eventData.players || {})) {
        totalPlayersFound++;

        // **OPTIMIZED**: Transform player data with reduced object allocations
        const lines: Record<string, Record<string, V3OddsData>> = {};
        
        // Pre-allocate shared values to reduce redundant operations
        const sharedLastUpdate = lastUpdated || undefined;
        
        // For V3, we need to organize by each sportsbook's individual line
        // This allows different sportsbooks to have different lines
        for (const [sportsbookId, bookData] of Object.entries(playerData.books || {})) {
          let sportsbookEntry: V3OddsData | null = null;
          let lineToUse: number | undefined;
          
          // Process over odds if available
          if (bookData.over && typeof bookData.over.line === 'number') {
            const overLineStr = bookData.over.line.toString();
            lineToUse = bookData.over.line;
            
            // Initialize line and sportsbook entry if needed
            if (!lines[overLineStr]) lines[overLineStr] = {};
            if (!lines[overLineStr][sportsbookId]) {
              lines[overLineStr][sportsbookId] = {
                over: null,
                under: null,
                line: lineToUse,
                last_update: sharedLastUpdate,
              };
            }
            sportsbookEntry = lines[overLineStr][sportsbookId];
            
            sportsbookEntry.over = {
              price: bookData.over.price,
              link: bookData.over.links.desktop || undefined,
              sid: sportsbookId,
              last_update: sharedLastUpdate,
              sgp: bookData.over.sgp,
            };
          }
          
          // Process under odds if available
          if (bookData.under && typeof bookData.under.line === 'number') {
            const underLineStr = bookData.under.line.toString();
            lineToUse = bookData.under.line;
            
            // Initialize line and sportsbook entry if needed
            if (!lines[underLineStr]) lines[underLineStr] = {};
            if (!lines[underLineStr][sportsbookId]) {
              lines[underLineStr][sportsbookId] = {
                over: null,
                under: null,
                line: lineToUse,
                last_update: sharedLastUpdate,
              };
            }
            sportsbookEntry = lines[underLineStr][sportsbookId];
            
            sportsbookEntry.under = {
              price: bookData.under.price,
              link: bookData.under.links.desktop || undefined,
              sid: sportsbookId,
              last_update: sharedLastUpdate,
              sgp: bookData.under.sgp,
            };
          }
          
          // Update line for the entry (avoid redundant string conversion)
          if (sportsbookEntry && lineToUse !== undefined) {
            sportsbookEntry.line = lineToUse;
          }
        }

        // Transform metrics to match existing structure
        const metrics: Record<string, { over: V3LineMetrics; under: V3LineMetrics }> = {};
        const primaryLineStr = playerData.primary_line.toString();
        metrics[primaryLineStr] = {
          over: playerData.metrics.over,
          under: playerData.metrics.under,
        };

        // Add best odds data from Redis if available
        const bestOdds = playerData.best ? {
          over: playerData.best.over ? {
            book: playerData.best.over.book,
            price: playerData.best.over.price,
            line: playerData.best.over.line,
            link: playerData.best.over.links?.desktop || undefined,
            ev_pct: playerData.best.over.ev_pct,
            value_pct: playerData.best.over.value_pct,
          } : null,
          under: playerData.best.under ? {
            book: playerData.best.under.book,
            price: playerData.best.under.price,
            line: playerData.best.under.line,
            link: playerData.best.under.links?.desktop || undefined,
            ev_pct: playerData.best.under.ev_pct,
            value_pct: playerData.best.under.value_pct,
          } : null,
        } : undefined;

        // **SERVER-SIDE PROCESSING OPTIMIZATION**
        // Pre-compute all best odds and active line data to reduce client-side memory usage
        const activeLine = getActiveLine(playerData);
        
        // Create minimal object for processing (avoid expensive spreading)
        const playerForProcessing = {
          lines,
          market: validatedParams.market,
          best: playerData.best,
          primary_line: playerData.primary_line,
        };
        
        const processedBestOdds = extractBestOdds(
          playerData,
          lastUpdated || ''
        );

        // Create transformed player object with pre-processed fields
        const transformedPlayer: V3PlayerOdds = {
          description: playerData.name,
          player_id: playerId,
          team: playerData.team,
          market: validatedParams.market,
          lines: lines,
          event_id: eventId,
          commence_time: eventData.event.start,
          home_team: eventData.event.home,
          away_team: eventData.event.away,
          primary_line: primaryLineStr,
          last_updated: lastUpdated || '',
          position: playerData.position,
          metrics: metrics,
          best: bestOdds,
          
          // Pre-processed fields (server-side optimization)
          activeLine: activeLine,
          bestOverOdds: processedBestOdds.bestOverOdds,
          bestUnderOdds: processedBestOdds.bestUnderOdds,
          bestOverPrice: processedBestOdds.bestOverPrice,
          bestUnderPrice: processedBestOdds.bestUnderPrice,
          bestOverBook: processedBestOdds.bestOverBook,
          bestUnderBook: processedBestOdds.bestUnderBook,
          bestOverLine: processedBestOdds.bestOverLine,
          bestUnderLine: processedBestOdds.bestUnderLine,
        };

        transformedPlayers.push(transformedPlayer);
      }
    }

    // Sort players by name for consistency
    const sortStartTime = Date.now();
    transformedPlayers.sort((a, b) => a.description.localeCompare(b.description));
    const sortTime = Date.now() - sortStartTime;
    
    const transformTime = Date.now() - transformStartTime;
    const totalTime = Date.now() - startTime;

    // Create response object
    const responseData = {
      success: true,
      data: transformedPlayers,
      metadata: {
        total: transformedPlayers.length,
        sport: validatedParams.sport,
        market: validatedParams.market,
        scope: validatedParams.scope,
        gameId: validatedParams.gameId,
        keysFound: 1, // We fetch one key now
        eventsFound: filteredEventsCount, // Use filtered count
        playersFound: totalPlayersFound,
        lastUpdated,
      }
    } as PropComparisonV3Response;

    // Calculate response size for monitoring
    const responseSize = JSON.stringify(responseData).length;
    const compressionRatio = rawDataSize > 0 ? (responseSize / rawDataSize * 100).toFixed(1) : 'N/A';

    console.log(`[/api/prop-comparison/v3] Processing completed:`, {
      timings: {
        redis: `${redisTime}ms`,
        parse: `${parseTime}ms`, 
        transform: `${transformTime}ms`,
        sort: `${sortTime}ms`,
        total: `${totalTime}ms`
      },
      dataFlow: {
        inputKB: Math.round(rawDataSize / 1024),
        outputKB: Math.round(responseSize / 1024),
        compressionRatio: `${compressionRatio}%`,
        playersProcessed: totalPlayersFound,
        eventsProcessed: filteredEventsCount
      }
    });

    // Create response with optimized headers (Vercel handles compression automatically)
    const response = NextResponse.json(responseData);
    
    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=300'); // Cache for 1min/5min
    
    return response;

  } catch (error) {
    console.error('[/api/prop-comparison/v3] Error fetching odds:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch odds data'
      },
      { status: 400 }
    );
  }
}
