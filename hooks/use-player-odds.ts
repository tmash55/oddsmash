import { useQuery, useQueryClient } from '@tanstack/react-query'

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

interface PlayerOddsResponse {
  description?: string;
  market?: string;
  lines: OddsLine[];
  last_updated?: string;
}

interface UsePlayerOddsParams {
  playerId: number;
  market: string;
  eventId?: string;
  enabled?: boolean;
}

/**
 * Custom hook for fetching and caching player odds data
 * Optimized for fast loading with aggressive prefetching strategy
 */
export function usePlayerOdds({
  playerId,
  market,
  eventId,
  enabled = true
}: UsePlayerOddsParams) {
  return useQuery<PlayerOddsResponse, Error>({
    queryKey: ['player-odds', playerId, market, eventId] as const,
    queryFn: async () => {
      const oddsKey = `odds:mlb:${eventId}:${playerId}:${market}`;
      
      // Try database first with Redis fallback
      const response = await fetch(`/api/player-odds-db?key=${oddsKey}`);
      
      if (response.ok) {
        return response.json();
      }
      
      // Fallback to Redis
      const redisResponse = await fetch(`/api/player-odds?key=${oddsKey}`);
      
      if (redisResponse.ok) {
        return redisResponse.json();
      }
      
      throw new Error('No odds data found');
    },
    enabled: enabled && !!playerId && !!market,
    staleTime: 2 * 60 * 1000, // Fresh for 2 minutes (faster updates for live odds)
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 1, // Single retry for faster failure handling
    retryDelay: 300, // Even quicker retry
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnReconnect: true, // Only refetch when reconnecting
    // Background refetching for fresh odds
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes in background
    refetchIntervalInBackground: true, // Continue refreshing when tab not focused
  });
}

/**
 * Hook for prefetching odds data - aggressive prefetching for better UX
 */
export function usePrefetchPlayerOdds() {
  const queryClient = useQueryClient();
  
  return (params: UsePlayerOddsParams) => {
    queryClient.prefetchQuery({
      queryKey: ['player-odds', params.playerId, params.market, params.eventId] as const,
      queryFn: async () => {
        const oddsKey = `odds:mlb:${params.eventId}:${params.playerId}:${params.market}`;
        const response = await fetch(`/api/player-odds-db?key=${oddsKey}`);
        
        if (response.ok) {
          return response.json();
        }
        
        const redisResponse = await fetch(`/api/player-odds?key=${oddsKey}`);
        if (redisResponse.ok) {
          return redisResponse.json();
        }
        
        throw new Error('No odds data found');
      },
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    });
  };
}

/**
 * Hook for bulk prefetching multiple players' odds - optimized batch processing
 */
export function useBulkPrefetchPlayerOdds() {
  const queryClient = useQueryClient();
  
  return (requests: UsePlayerOddsParams[]) => {
    // Batch size for optimal performance
    const BATCH_SIZE = 10;
    
    // Split requests into batches to avoid overwhelming the API
    const batches = [];
    for (let i = 0; i < requests.length; i += BATCH_SIZE) {
      batches.push(requests.slice(i, i + BATCH_SIZE));
    }
    
    // Process batches with small delays between them
    const prefetchPromises = batches.map((batch, batchIndex) => 
      new Promise(resolve => {
        // Stagger batch starts by 50ms to avoid API rate limits
        setTimeout(() => {
          const batchPromises = batch.map(params => 
            queryClient.prefetchQuery({
              queryKey: ['player-odds', params.playerId, params.market, params.eventId] as const,
              queryFn: async () => {
                const oddsKey = `odds:mlb:${params.eventId}:${params.playerId}:${params.market}`;
                const response = await fetch(`/api/player-odds-db?key=${oddsKey}`);
                
                if (response.ok) {
                  return response.json();
                }
                
                const redisResponse = await fetch(`/api/player-odds?key=${oddsKey}`);
                if (redisResponse.ok) {
                  return redisResponse.json();
                }
                
                throw new Error('No odds data found');
              },
              staleTime: 2 * 60 * 1000,
              gcTime: 30 * 60 * 1000,
            })
          );
          
          Promise.allSettled(batchPromises).then(resolve);
        }, batchIndex * 50);
      })
    );
    
    return Promise.allSettled(prefetchPromises);
  };
} 