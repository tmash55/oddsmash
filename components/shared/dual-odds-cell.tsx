import { useState, useEffect, memo } from "react"
import OddsCell from "./odds-cell"
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

interface DualOddsCellProps {
  // Shared props
  market?: string
  line?: number
  customTier: number | null
  fallback_odds: Record<string, Record<string, any>> | null
  compact?: boolean
  playerName?: string
  playerId?: number
  teamName?: string
  gameId?: string
  eventTime?: string
  awayTeam?: string
  homeTeam?: string
  // Loading coordination
  showLoadingUntilReady?: boolean // New prop for coordinated loading
}

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

// Helper function to find best odds for a specific bet type from current odds API
const findBestOddsFromCurrentData = (
  currentOdds: CurrentOddsResponse | null,
  targetLine: number,
  betType: 'over' | 'under'
): { odds: number; sportsbook: string; link?: string } | null => {
  if (!currentOdds?.lines) {
    return null;
  }

  const matchingLine = findMatchingLine(currentOdds.lines, targetLine);

  if (!matchingLine?.sportsbooks) {
    return null;
  }

  let bestOdds = -Infinity; // Always start with worst possible odds
  let bestSportsbook: string | null = null;
  let bestLink: string | undefined;

  Object.entries(matchingLine.sportsbooks).forEach(([book, data]) => {
    const betData = data[betType];
    if (!betData) {
      return;
    }

    const price = betData.price;
    const link = betData.link;

    if (price !== undefined && price !== null && !isNaN(Number(price))) {
      const numPrice = Number(price);
      
      // For both over and under, we want the highest value odds (most favorable to bettor)
      // Positive odds: higher is better (+200 > +100)
      // Negative odds: closer to zero is better (-110 > -200)
      const isBetter = numPrice > bestOdds;
        
      if (isBetter) {
        bestOdds = numPrice;
        bestSportsbook = book;
        bestLink = link;
      }
    }
  });

  if (bestSportsbook) {
    return {
      odds: bestOdds,
      sportsbook: bestSportsbook,
      link: bestLink
    };
  }

  return null;
};

// Helper function to find best odds for a specific bet type from fallback data
const findBestOddsFromFallback = (
  sportsbooksData: Record<string, any>,
  betType: 'over' | 'under'
): { odds: number; sportsbook: string; link?: string } | null => {
  if (!sportsbooksData) {
    return null;
  }

  let bestOdds = -Infinity; // Always start with worst possible odds
  let bestSportsbook: string | null = null;
  let bestLink: string | undefined;

  Object.entries(sportsbooksData).forEach(([book, data]) => {
    // Handle new over/under format
    let price: number | undefined;
    let link: string | undefined;
    
    if (data && typeof data === 'object' && data[betType]) {
      price = data[betType].price;
      link = data[betType].link;
    }
    // Handle old format for fallback
    else if ((data as any)?.price && betType === 'over') {
      price = (data as any).price;
      link = (data as any).link || (data as any).over_link;
    }

    // Only consider sportsbooks with valid data
    if (price !== undefined && price !== null && !isNaN(Number(price))) {
      const numPrice = Number(price);
      
      // For both over and under, we want the highest value odds (most favorable to bettor)
      // Positive odds: higher is better (+200 > +100)
      // Negative odds: closer to zero is better (-110 > -200)
      const isBetter = numPrice > bestOdds;
        
      if (isBetter) {
        bestOdds = numPrice;
        bestSportsbook = book;
        bestLink = link;
      }
    }
  });

  if (bestSportsbook) {
    return {
      odds: bestOdds,
      sportsbook: bestSportsbook,
      link: bestLink
    };
  }

  return null;
};

function DualOddsCell({
  market = "Hits",
  line,
  customTier,
  fallback_odds,
  compact = false,
  playerName,
  playerId,
  teamName,
  gameId,
  eventTime,
  awayTeam,
  homeTeam,
  showLoadingUntilReady = false,
}: DualOddsCellProps) {
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
  
  // Find best odds for both over and under
  const targetLine = customTier || line || 0.5;
  
  let bestOverOdds = null;
  let bestUnderOdds = null;
  
  // Try current odds first, then fallback
  if (currentOdds) {
    bestOverOdds = findBestOddsFromCurrentData(currentOdds, targetLine, 'over');
    bestUnderOdds = findBestOddsFromCurrentData(currentOdds, targetLine, 'under');
  } else if (fallback_odds) {
    bestOverOdds = findBestOddsFromFallback(fallback_odds, 'over');
    bestUnderOdds = findBestOddsFromFallback(fallback_odds, 'under');
  }

  // Show loading state based on coordination preference
  const shouldShowLoading = showLoadingUntilReady 
    ? oddsLoading && !bestOverOdds && !bestUnderOdds
    : oddsLoading && !fallback_odds;

  if (shouldShowLoading) {
    return (
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="text-xs text-muted-foreground mb-1 text-center font-medium">Over</div>
          <div className="flex items-center justify-center gap-2 py-2">
            <LoadingSpinner size="sm" />
            <div className="h-4 w-12 bg-muted/30 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex-1">
          <div className="text-xs text-muted-foreground mb-1 text-center font-medium">Under</div>
          <div className="flex items-center justify-center gap-2 py-2">
            <LoadingSpinner size="sm" />
            <div className="h-4 w-12 bg-muted/30 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-4">
      {/* Over Column */}
      <div className="flex-1">
        <div className="text-xs text-muted-foreground mb-1 text-center font-medium">Over</div>
        {bestOverOdds ? (
          <OddsCell
            odds={bestOverOdds.odds}
            sportsbook={bestOverOdds.sportsbook}
            market={market}
            line={line}
            customTier={customTier}
            fallback_odds={fallback_odds}
            directLink={bestOverOdds.link}
            compact={compact}
            playerName={playerName}
            playerId={playerId}
            teamName={teamName}
            gameId={gameId}
            eventTime={eventTime}
            awayTeam={awayTeam}
            homeTeam={homeTeam}
            betType="over"
          />
        ) : (
          <div className="text-sm text-muted-foreground text-center">-</div>
        )}
      </div>

      {/* Under Column */}
      <div className="flex-1">
        <div className="text-xs text-muted-foreground mb-1 text-center font-medium">Under</div>
        {bestUnderOdds ? (
          <OddsCell
            odds={bestUnderOdds.odds}
            sportsbook={bestUnderOdds.sportsbook}
            market={market}
            line={line}
            customTier={customTier}
            fallback_odds={fallback_odds}
            directLink={bestUnderOdds.link}
            compact={compact}
            playerName={playerName}
            playerId={playerId}
            teamName={teamName}
            gameId={gameId}
            eventTime={eventTime}
            awayTeam={awayTeam}
            homeTeam={homeTeam}
            betType="under"
          />
        ) : (
          <div className="text-sm text-muted-foreground text-center">-</div>
        )}
      </div>
    </div>
  )
}

// Memoize component to prevent unnecessary re-renders
export default memo(DualOddsCell) 