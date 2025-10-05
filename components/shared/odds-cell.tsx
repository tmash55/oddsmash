import { useState, useEffect, useMemo, memo } from "react"
import Image from "next/image"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { sportsbooks } from "@/data/sportsbooks"
import OddsComparison from "./odds-comparison"
import { BetActions } from "@/components/betting/bet-actions"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowUpRight } from "lucide-react"
import type { BetslipSelection } from "@/types/betslip"
import { getStandardizedSportsbookId } from "@/lib/sportsbook-utils"
import { SPORT_MARKETS } from "@/lib/constants/markets"
import { usePlayerOdds } from "@/hooks/use-player-odds"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface OddsLine {
  line: number;
  sportsbooks: Record<string, {
    over?: {
      price: number;
      link?: string;
      sid?: string;
      last_update?: string;
    };
    under?: {
      price: number;
      link?: string;
      sid?: string;
      last_update?: string;
    };
  }>;
}

interface CurrentOddsResponse {
  description?: string;
  market?: string;
  lines: OddsLine[];
  last_updated?: string;
}

interface OddsData {
  [sportsbook: string]: {
    odds: number;
    over_link?: string;
    link?: string;
  };
}

// Transform sportsbook data to match OddsData format (supports both old and new formats)
const transformSportsbookData = (
  sportsbooks: Record<string, any> | null | undefined,
  betType: 'over' | 'under' = 'over'
): OddsData => {
  if (!sportsbooks) return {};
  
  return Object.entries(sportsbooks).reduce((acc, [book, data]) => {
    let price: number | undefined;
    let link: string | undefined;
    
    // Handle new over/under format
    if (data.over || data.under) {
      const betData = data[betType];
      if (betData) {
        price = betData.price;
        link = betData.link;
      }
    }
    // Handle old format (fallback)
    else if ('price' in data) {
      price = data.price;
      link = data.link || data.over_link;
    }
    // Handle legacy format
    else if (data.odds) {
      price = data.odds;
      link = data.over_link;
    }
    
    if (price !== undefined) {
      acc[book] = {
        odds: price,
        link: link,
      };
    }
    
    return acc;
  }, {} as OddsData);
};

// Get the API market key for a display market
const getMarketApiKey = (market: string): string => {
  const mlbMarkets = SPORT_MARKETS.baseball_mlb
  // Try to match by label first (for display names like "Total Bases"), then by value
  let marketConfig = mlbMarkets.find(m => m.label === market)
  if (!marketConfig) {
    marketConfig = mlbMarkets.find(m => m.value === market)
  }
  return marketConfig?.apiKey || market.toLowerCase()
}

// Find the matching line from odds data
const findMatchingLine = (lines: OddsLine[], targetLine: number) => {
  return lines?.find(line => line.line === targetLine)
}

interface OddsCellProps {
  odds: number
  sportsbook: string
  market?: string
  line?: number
  customTier: number | null
  fallback_odds: Record<string, Record<string, any>> | null
  directLink?: string
  compact?: boolean
  playerName?: string
  playerId?: number
  teamName?: string
  gameId?: string
  eventTime?: string
  awayTeam?: string
  homeTeam?: string
  betType?: 'over' | 'under'
}

// Format American odds for display
const formatOdds = (odds: number): string => {
  if (odds === undefined || odds === null || isNaN(odds)) {
    return "-"
  }
  return odds > 0 ? `+${odds}` : odds.toString()
}

function OddsCell({
  odds,
  sportsbook,
  market = "Hits",
  line,
  customTier,
  fallback_odds,
  directLink,
  compact = false,
  playerName,
  playerId,
  teamName,
  gameId,
  eventTime,
  awayTeam,
  homeTeam,
  betType = 'over',
}: OddsCellProps) {
  const [hasValidOdds, setHasValidOdds] = useState(false)
  const [oddsData, setOddsData] = useState<BetslipSelection['odds_data']>({})

  // Use TanStack Query hook for odds fetching with caching
  const apiMarket = getMarketApiKey(market)
  const { 
    data: currentOdds, 
    isLoading: oddsLoading, 
    error: oddsError 
  } = usePlayerOdds({
    playerId: playerId || 0,
    market: apiMarket,
    eventId: gameId,
    enabled: false // Disabled - using fallback_odds instead
  });

  // Process odds data when currentOdds or fallback_odds change
  useEffect(() => {
    const newOddsData: BetslipSelection['odds_data'] = {};
    const targetLine = customTier || line || 0;

    if (currentOdds?.lines) {
      // Find the matching line from current odds
      const matchingLine = findMatchingLine(currentOdds.lines, targetLine);

      if (matchingLine?.sportsbooks) {
      // Process odds for each sportsbook
        Object.entries(matchingLine.sportsbooks).forEach(([book, data]: [string, any]) => {
          const bookKey = getStandardizedSportsbookId(book)
          
          // Extract odds for the specific bet type (over/under)
          const betData = data[betType];
          if (!betData) {
            return;
          }
          
          // Skip entries with invalid data
          if (!betData.sid && !betData.price) {
            return;
          }

          newOddsData[bookKey] = {
            odds: betData.price,
            line: targetLine,
            link: betData.link || null,
            last_update: betData.last_update || currentOdds.last_updated || new Date().toISOString()
          }
        });
      }
    } else if (fallback_odds) {
      // Process fallback odds
      Object.entries(fallback_odds).forEach(([book, data]: [string, any]) => {
        // Skip entries with no sid or no odds data
        if (!data.sid || data.price === undefined || data.price === null) {
          return;
        }

        // Only include odds that match the target line
        if (data.line !== targetLine) {
          return;
        }

        const bookKey = getStandardizedSportsbookId(book)
        newOddsData[bookKey] = {
          odds: data.price,
          line: targetLine,
          link: data.link || null,
          last_update: data.last_update || new Date().toISOString()
        }
      });
    }

    // Check if we have valid odds for this sportsbook
    const standardizedId = getStandardizedSportsbookId(sportsbook)
    const hasValidOddsForBook = !!newOddsData[standardizedId]
    setHasValidOdds(hasValidOddsForBook)
    setOddsData(newOddsData)
  }, [currentOdds, fallback_odds, sportsbook, customTier, line]);

  // Create betslip selection object
  const betslipSelection: Omit<BetslipSelection, "id" | "betslip_id" | "created_at" | "updated_at"> = useMemo(() => ({
    event_id: gameId || "",
    sport_key: "baseball_mlb",
    commence_time: eventTime || new Date().toISOString(),
    home_team: homeTeam || "",
    away_team: awayTeam || "",
    bet_type: "player_prop",
    market_type: "player_prop",
    market_key: getMarketApiKey(market),
    selection: betType === 'over' ? "Over" : "Under",
    player_name: playerName || "",
    player_id: playerId,
    player_team: teamName || "",
    line: customTier || line || 0,
    odds_data: oddsData
  }), [
    gameId,
    eventTime,
    homeTeam,
    awayTeam,
    market,
    playerName,
    playerId,
    teamName,
    customTier,
    line,
    oddsData,
    betType
  ]);

  // Show loading state if no fallback odds available
  if (oddsLoading && !fallback_odds && !hasValidOdds) {
    return (
      <div className="flex items-center gap-2">
        <LoadingSpinner size="sm" />
        <div className="text-xs text-muted-foreground">Loading odds...</div>
      </div>
    )
  }

  // Find the sportsbook in our data using the standardized ID
  const standardizedId = getStandardizedSportsbookId(sportsbook)
  const bookData = sportsbooks.find((book) => book.id === standardizedId)

  // Handle click on sportsbook logo
  const handleClick = () => {
    if (directLink) {
      window.open(directLink, "_blank")
    }
  }

  // Get the matching line for the odds comparison
  const getMatchingLineForComparison = () => {
    if (currentOdds?.lines) {
      const targetLine = customTier || line || 0;
      const matchingLine = findMatchingLine(currentOdds.lines, targetLine);
      return matchingLine?.sportsbooks;
    }
    return fallback_odds;
  };

  // Find the sportsbook with the best odds (highest positive value for both over and under)
  const getBestOdds = () => {
    const sportsbooksData = getMatchingLineForComparison();
    if (!sportsbooksData) return null;

    let bestOdds = -Infinity;
    let bestSportsbook: string | null = null;
    let bestData: { price: number; link?: string; sid?: string } | null = null;

    Object.entries(sportsbooksData).forEach(([book, data]) => {
      // Handle new over/under format
      let price: number | undefined;
      let link: string | undefined;
      let sid: string | undefined;
      
      if (data[betType]) {
        price = data[betType].price;
        link = data[betType].link;
        sid = data[betType].sid;
      }
      // Handle old format for fallback
      else if ((data as any)?.price) {
        price = (data as any).price;
        link = (data as any).link || (data as any).over_link;
        sid = (data as any).sid;
      }

      // Only consider sportsbooks with valid data and links
      if ((sid || link) && price !== undefined && price !== null) {
        // For both over and under, higher odds are better for the bettor
        if (price > bestOdds) {
          bestOdds = price;
          bestSportsbook = book;
          bestData = { price, link, sid };
        }
      }
    });

    if (bestSportsbook && bestData) {
      const standardizedId = getStandardizedSportsbookId(bestSportsbook);
      const bookData = sportsbooks.find((book) => book.id === standardizedId);
      
      return {
        sportsbook: bestSportsbook,
        standardizedId,
        bookData,
        odds: bestData.price,
        link: bestData.link,
        sid: bestData.sid
      };
    }

    return null;
  };

  const bestOddsInfo = getBestOdds();

  return (
    <div className="flex items-center gap-1">
      {/* Best odds indicator - now the main display */}
      {bestOddsInfo ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className="flex items-center gap-1 px-1.5 py-1 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors min-w-0"
                onClick={() => {
                  if (bestOddsInfo.link) {
                    window.open(bestOddsInfo.link, "_blank");
                  }
                }}
              >
                <span className="text-xs font-semibold text-green-700 dark:text-green-400 whitespace-nowrap">
                  {formatOdds(bestOddsInfo.odds)}
                </span>
                <div className="flex-shrink-0 w-3 h-3 flex items-center justify-center">
                  <Image
                    src={bestOddsInfo.bookData?.logo || `/images/sports-books/${bestOddsInfo.standardizedId.toLowerCase()}.png`}
                    alt={bestOddsInfo.bookData?.name || bestOddsInfo.sportsbook}
                    width={12}
                    height={12}
                    className="rounded-sm object-contain max-w-full max-h-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/images/sportsbooks/default.png";
                    }}
                  />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Best odds: {bestOddsInfo.bookData?.name || bestOddsInfo.sportsbook} {formatOdds(bestOddsInfo.odds)}</p>
              <p className="text-xs text-muted-foreground">Click to place bet</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : hasValidOdds ? (
        // Fallback display when no best odds available but we have valid odds
        <div className="flex items-center gap-1 px-1.5 py-1 bg-gray-50 dark:bg-gray-900/20 rounded border border-gray-200 dark:border-gray-800 min-w-0">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-400 whitespace-nowrap">
            {formatOdds(odds)}
          </span>
          <div className="flex-shrink-0 w-3 h-3 flex items-center justify-center">
            <Image
              src={bookData?.logo || `/images/sportsbooks/${standardizedId.toLowerCase()}.png`}
          alt={bookData?.name || sportsbook}
              width={12}
              height={12}
              className="rounded-sm object-contain max-w-full max-h-full"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/images/sportsbooks/default.png";
          }}
            />
          </div>
      </div>
      ) : (
        // No valid odds
        <div className="text-xs text-muted-foreground">-</div>
      )}
      
      {/* Compare button - moved to right and made smaller */}
      <div className="flex-shrink-0">
      <OddsComparison 
          allOdds={transformSportsbookData(getMatchingLineForComparison(), betType)}
        customTier={customTier}
        line={line}
        market={market}
          compact={true}
          betType={betType}
      />
      </div>

      {/* Bet Actions - made smaller */}
      {hasValidOdds && (
        <div className="flex-shrink-0">
      <BetActions
        selection={betslipSelection}
      />
        </div>
      )}
    </div>
  )
} 

export default memo(OddsCell) 