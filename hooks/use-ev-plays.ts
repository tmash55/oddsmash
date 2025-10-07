import { useQuery, useQueryClient } from '@tanstack/react-query'
import { EVPlaysResponse, EVFilters, EVExpansionData, EVPlay } from '@/types/ev-types'

export function useEVPlays(filters: EVFilters = {}) {
  return useQuery({
    queryKey: ['ev-plays', filters],
    queryFn: async (): Promise<EVPlaysResponse> => {
      const params = new URLSearchParams()
      
      // Add filters to query params
      if (filters.sports?.length) params.set('sports', filters.sports.join(','))
      if (filters.scope?.length) params.set('scope', filters.scope.join(','))
      if (filters.min_ev !== undefined) params.set('min_ev', filters.min_ev.toString())
      if (filters.max_ev !== undefined) params.set('max_ev', filters.max_ev.toString())
      if (filters.markets?.length) params.set('markets', filters.markets.join(','))
      if (filters.books?.length) params.set('books', filters.books.join(','))
      if (filters.limit !== undefined) params.set('limit', filters.limit.toString())
      if (filters.offset !== undefined) params.set('offset', filters.offset.toString())
      if (filters.sort_by) params.set('sort_by', filters.sort_by)
      if (filters.sort_direction) params.set('sort_direction', filters.sort_direction)
      
      const response = await fetch(`/api/ev-plays?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch EV plays: ${response.statusText}`)
      }
      
      return response.json()
    },
    staleTime: 15_000, // Data is fresh for 15 seconds
    gcTime: 5 * 60_000, // Keep in cache for 5 minutes
    refetchInterval: 30_000, // Refetch every 30 seconds
    refetchIntervalInBackground: true, // Continue updates when tab not focused
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    placeholderData: (previousData) => previousData, // Prevent loading states on refetch
  })
}

export function useEVExpansion(play: EVPlay | null) {
  const queryClient = useQueryClient()
  
  return useQuery({
    queryKey: ['ev-expansion', play?.id],
    queryFn: async (): Promise<EVExpansionData> => {
      if (!play) throw new Error('No play provided for expansion')
      
      const params = new URLSearchParams({
        sport: play.sport,
        event_id: play.event_id,
        market: play.market,
        market_key: play.market_key,
        side: play.side,
        line: play.line.toString()
      })
      
      // Add player_id for player props
      if ('player_id' in play && play.player_id) {
        params.set('player_id', play.player_id)
      }
      
      const response = await fetch(`/api/ev-expansion?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch expansion data: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch expansion data')
      }
      
      return result.data
    },
    enabled: !!play, // Only run query when play is provided
    staleTime: 2 * 60_000, // Expansion data is fresh for 2 minutes
    gcTime: 10 * 60_000, // Keep in cache for 10 minutes
    retry: 2,
    retryDelay: 1000,
  })
}

// Hook for prefetching expansion data (for better UX)
export function usePrefetchEVExpansion() {
  const queryClient = useQueryClient()
  
  return (play: EVPlay) => {
    queryClient.prefetchQuery({
      queryKey: ['ev-expansion', play.id],
      queryFn: async () => {
        const params = new URLSearchParams({
          sport: play.sport,
          event_id: play.event_id,
          market: play.market,
          market_key: play.market_key,
          side: play.side,
          line: play.line.toString()
        })
        
        if ('player_id' in play && play.player_id) {
          params.set('player_id', play.player_id)
        }
        
        const response = await fetch(`/api/ev-expansion?${params.toString()}`)
        const result = await response.json()
        
        if (!result.success) throw new Error(result.error)
        return result.data
      },
      staleTime: 2 * 60_000,
    })
  }
}

// Hook for managing multiple expanded rows
export function useEVExpansions() {
  const queryClient = useQueryClient()
  
  const getExpansionData = (playId: string): EVExpansionData | undefined => {
    return queryClient.getQueryData(['ev-expansion', playId])
  }
  
  const prefetchExpansion = (play: EVPlay) => {
    queryClient.prefetchQuery({
      queryKey: ['ev-expansion', play.id],
      queryFn: async () => {
        const params = new URLSearchParams({
          sport: play.sport,
          event_id: play.event_id,
          market: play.market,
          market_key: play.market_key,
          side: play.side,
          line: play.line.toString()
        })
        
        if ('player_id' in play && play.player_id) {
          params.set('player_id', play.player_id)
        }
        
        const response = await fetch(`/api/ev-expansion?${params.toString()}`)
        const result = await response.json()
        
        if (!result.success) throw new Error(result.error)
        return result.data
      }
    })
  }
  
  const invalidateExpansion = (playId: string) => {
    queryClient.invalidateQueries({ queryKey: ['ev-expansion', playId] })
  }
  
  return {
    getExpansionData,
    prefetchExpansion,
    invalidateExpansion
  }
}


