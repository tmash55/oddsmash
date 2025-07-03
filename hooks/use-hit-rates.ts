import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SupportedSport, SportMarket } from '@/types/sports';
import { PlayerHitRateProfile } from '@/types/hit-rates';
import { PlayerPropOdds } from '@/services/player-prop-odds';
import React from 'react';

export interface HitRatesResponse {
  profiles: PlayerHitRateProfile[];
  totalPages: number;
  totalProfiles: number;
}

interface UseHitRatesParams {
  sport: SupportedSport;
  market: SportMarket;
  page: number;
  limit?: number;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  selectedGames?: string[] | null;
}

// Function to fetch hit rates data - Redis-first for maximum speed
export const fetchHitRatesData = async ({ sport, market, page, limit = 25, sortField, sortDirection, selectedGames }: UseHitRatesParams): Promise<HitRatesResponse> => {
  const params = new URLSearchParams({
    sport,
    market,
    page: page.toString(),
    limit: limit.toString(),
  });

  // Add sort parameters if provided
  if (sortField) {
    params.append('sortField', sortField);
  }
  if (sortDirection) {
    params.append('sortDirection', sortDirection);
  }
  
  // Add game filter if provided
  if (selectedGames && selectedGames.length > 0) {
    params.append('selectedGames', selectedGames.join(','));
  }

  // Try Redis-first API for maximum speed
  try {
    const response = await fetch(`/api/hit-rates-redis?${params}`);
    if (response.ok) {
      const data = await response.json();
      console.log(`[useHitRates] ✅ Redis-first API returned ${data.profiles?.length || 0} profiles`);
      return data;
    }
    console.log(`[useHitRates] Redis-first API failed, falling back to database API`);
  } catch (error) {
    console.error(`[useHitRates] Redis-first API error, falling back:`, error);
  }

  // Fallback to database API
  const response = await fetch(`/api/hit-rates?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch hit rates');
  }
  const data = await response.json();
  console.log(`[useHitRates] Database fallback returned ${data.profiles?.length || 0} profiles`);
  return data;
};

// Function to fetch individual player hit rate
export const fetchPlayerHitRate = async (playerName: string, market: string, sport: SupportedSport = 'mlb'): Promise<PlayerHitRateProfile | null> => {
  const params = new URLSearchParams({
    sport,
    market,
    page: '1',
    limit: '1',
    playerName: playerName.trim()
  });

  const response = await fetch(`/api/player-hit-rate?${params}`);
  if (!response.ok) {
    if (response.status === 404) {
      return null; // Player not found
    }
    throw new Error('Failed to fetch player hit rate');
  }
  
  const data = await response.json();
  return data.profile || null;
};

export function useHitRates({ sport, market, page, limit = 25, sortField, sortDirection, selectedGames }: UseHitRatesParams) {
  const queryClient = useQueryClient();
  
  // Generate a consistent query key that includes sort and filter parameters
  const queryKey = ['hitRates', sport, market, page, limit, sortField, sortDirection, selectedGames] as const;
  
  // Set up the main query
  const query = useQuery<HitRatesResponse, Error>({
    queryKey,
    queryFn: () => fetchHitRatesData({ sport, market, page, limit, sortField, sortDirection, selectedGames }),
    gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Prefetch next page
  React.useEffect(() => {
    if (query.data?.totalPages && page < query.data.totalPages) {
      const nextPage = page + 1;
      queryClient.prefetchQuery({
        queryKey: ['hitRates', sport, market, nextPage, limit, sortField, sortDirection, selectedGames] as const,
        queryFn: () => fetchHitRatesData({ sport, market, page: nextPage, limit, sortField, sortDirection, selectedGames }),
        staleTime: 30000,
      });
    }
  }, [page, query.data?.totalPages, queryClient, sport, market, limit, sortField, sortDirection, selectedGames]);

  return query;
}

// Hook for individual player hit rate lookup
export function usePlayerHitRate(playerName: string, market: string, sport: SupportedSport = 'mlb') {
  return useQuery<PlayerHitRateProfile | null, Error>({
    queryKey: ['playerHitRate', sport, market, playerName.trim()] as const,
    queryFn: () => fetchPlayerHitRate(playerName, market, sport),
    enabled: !!playerName && !!market, // Only run if we have player name and market
    gcTime: 24 * 60 * 60 * 1000, // Keep unused data in cache for 24 hours (hit rates don't change often)
    staleTime: 60 * 60 * 1000, // Consider data fresh for 1 hour
    retry: 1, // Only retry once if it fails
  });
}

// Hook for fetching multiple player hit rates (for betslip scanning)
export function usePlayerHitRates(players: Array<{name: string, market: string}>, sport: SupportedSport = 'mlb') {
  return useQuery<Record<string, PlayerHitRateProfile | null>, Error>({
    queryKey: ['playerHitRates', sport, players] as const,
    queryFn: async () => {
      const results: Record<string, PlayerHitRateProfile | null> = {};
      
      // Fetch all players in parallel
      const promises = players.map(async (player) => {
        const key = `${player.name}-${player.market}`;
        try {
          const profile = await fetchPlayerHitRate(player.name, player.market, sport);
          results[key] = profile;
        } catch (error) {
          console.warn(`Failed to fetch hit rate for ${player.name} (${player.market}):`, error);
          results[key] = null;
        }
      });
      
      await Promise.all(promises);
      return results;
    },
    enabled: players.length > 0,
    gcTime: 24 * 60 * 60 * 1000, // Keep unused data in cache for 24 hours
    staleTime: 60 * 60 * 1000, // Consider data fresh for 1 hour
    retry: 1,
  });
}

// Hook for fetching player odds
export function usePlayerOdds({ 
  playerIds, 
  sport, 
  market 
}: { 
  playerIds: number[],
  sport: SupportedSport,
  market: SportMarket
}) {
  return useQuery<Record<string, PlayerPropOdds>, Error>({
    queryKey: ['playerOdds', sport, market, playerIds] as const,
    queryFn: async () => {
      // Convert the request to use query parameters
      const params = new URLSearchParams({
        sport: sport,
        market: market,
        playerIds: playerIds.join(',')
      });

      const response = await fetch(`/api/player-odds?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch player odds');
      }
      
      return response.json();
    },
    enabled: playerIds.length > 0,
    gcTime: 5 * 60 * 60 * 1000, // Keep unused data in cache for 5 minutes
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
} 