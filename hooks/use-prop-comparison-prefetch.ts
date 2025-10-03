import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import type { PropComparisonV3Params } from "@/types/prop-comparison-v3";

// Common market adjacencies for intelligent prefetching
const MARKET_ADJACENCIES: Record<string, string[]> = {
  // NFL/NCAAF - related receiving markets
  'receptions': ['receiving_yards', 'receiving_touchdowns', 'targets'],
  'receiving_yards': ['receptions', 'receiving_touchdowns', 'longest_reception'],
  'receiving_touchdowns': ['receptions', 'receiving_yards', 'anytime_touchdown_scorer'],
  
  // NFL/NCAAF - related passing markets  
  'passing_yards': ['passing_touchdowns', 'pass_completions', 'pass_attempts'],
  'passing_touchdowns': ['passing_yards', 'pass_completions', 'anytime_touchdown_scorer'],
  'pass_completions': ['passing_yards', 'pass_attempts', 'pass_intercepts'],
  
  // NFL/NCAAF - related rushing markets
  'rushing_yards': ['rushing_touchdowns', 'rush_attempts', 'longest_rush'],
  'rushing_touchdowns': ['rushing_yards', 'rush_attempts', 'anytime_touchdown_scorer'],
  'rush_attempts': ['rushing_yards', 'rushing_touchdowns'],
  
  // Common touchdown markets
  'anytime_touchdown_scorer': ['passing_touchdowns', 'receiving_touchdowns', 'rushing_touchdowns'],
  
  // Combo markets
  'pass_rush_reception_yards': ['passing_yards', 'rushing_yards', 'receiving_yards'],
  'rush_reception_yards': ['rushing_yards', 'receiving_yards'],
};

async function fetchPropComparisonV3Data(params: PropComparisonV3Params): Promise<any> {
  const searchParams = new URLSearchParams();
  searchParams.append("sport", params.sport);
  searchParams.append("market", params.market);
  if (params.scope) searchParams.append("scope", params.scope);
  if (params.gameId) searchParams.append("gameId", params.gameId);
  
  const response = await fetch(`/api/prop-comparison/v3?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch prop comparison data");
  }
  return response.json();
}

export function usePropComparisonPrefetch() {
  const queryClient = useQueryClient();
  
  // Prefetch adjacent markets based on current market
  const prefetchAdjacentMarkets = useCallback(async (
    currentParams: PropComparisonV3Params,
    priority: 'high' | 'low' = 'low'
  ) => {
    const adjacentMarkets = MARKET_ADJACENCIES[currentParams.market] || [];
    
    // Limit prefetching to prevent too many simultaneous requests
    const marketsToPrefretch = priority === 'high' 
      ? adjacentMarkets.slice(0, 2) // High priority: 2 markets
      : adjacentMarkets.slice(0, 1); // Low priority: 1 market
    
    const prefetchPromises = marketsToPrefretch.map(async (market) => {
      const prefetchParams = { ...currentParams, market };
      const queryKey = ["propComparisonV3", prefetchParams.sport, prefetchParams.market, prefetchParams.scope || 'pregame'];
      
      // Only prefetch if not already in cache
      const existingData = queryClient.getQueryData(queryKey);
      if (existingData) return;
      
      try {
        await queryClient.prefetchQuery({
          queryKey,
          queryFn: () => fetchPropComparisonV3Data(prefetchParams),
          staleTime: 60 * 1000, // 1 minute stale time
          gcTime: 2 * 60 * 1000, // 2 minutes garbage collection (shorter for prefetched data)
        });
        
        console.log(`[Prefetch] Successfully prefetched ${market} for ${prefetchParams.sport}`);
      } catch (error) {
        // Silently fail prefetching - don't interrupt user experience
        console.log(`[Prefetch] Failed to prefetch ${market}:`, error);
      }
    });
    
    await Promise.allSettled(prefetchPromises);
  }, [queryClient]);
  
  // Prefetch on idle for better user experience
  const prefetchOnIdle = useCallback((params: PropComparisonV3Params) => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        prefetchAdjacentMarkets(params, 'low');
      }, { timeout: 5000 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        prefetchAdjacentMarkets(params, 'low');
      }, 1000);
    }
  }, [prefetchAdjacentMarkets]);
  
  // Invalidate related markets when current market updates
  const invalidateRelatedMarkets = useCallback((
    currentParams: PropComparisonV3Params,
    includeCurrentMarket: boolean = true
  ) => {
    const marketsToInvalidate = includeCurrentMarket 
      ? [currentParams.market, ...(MARKET_ADJACENCIES[currentParams.market] || [])]
      : MARKET_ADJACENCIES[currentParams.market] || [];
    
    marketsToInvalidate.forEach(market => {
      const queryKey = ["propComparisonV3", currentParams.sport, market, currentParams.scope || 'pregame'];
      queryClient.invalidateQueries({ queryKey, exact: false });
    });
    
    console.log(`[Cache] Invalidated ${marketsToInvalidate.length} related markets for ${currentParams.market}`);
  }, [queryClient]);
  
  return {
    prefetchAdjacentMarkets,
    prefetchOnIdle,
    invalidateRelatedMarkets,
  };
}





