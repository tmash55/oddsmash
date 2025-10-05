import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { SupportedSport, SportMarket } from '@/types/sports'
import { fetchHitRatesData } from './use-hit-rates'

interface UsePerformanceOptimizationProps {
  sport: SupportedSport
  currentMarket: SportMarket
  currentPage: number
  sortField: string
  sortDirection: "asc" | "desc"
  selectedGames: string[] | null
  totalPages?: number
}

export function usePerformanceOptimization({
  sport,
  currentMarket,
  currentPage,
  sortField,
  sortDirection,
  selectedGames,
  totalPages
}: UsePerformanceOptimizationProps) {
  const queryClient = useQueryClient()

  useEffect(() => {
    // 🚀 Aggressive prefetching for instant UI
    const prefetchTasks: Promise<void>[] = []

    // 1. Prefetch common markets (most important for UX)
    const commonMarkets: SportMarket[] = ['Hits', 'Home Runs', 'Total Bases', 'RBIs', 'Strikeouts']
    commonMarkets.forEach(market => {
      if (market !== currentMarket) {
        prefetchTasks.push(
          queryClient.prefetchQuery({
            queryKey: ['hitRates', sport, market, 1, 25, 'L10', 'desc', null],
            queryFn: () => fetchHitRatesData({ 
              sport, 
              market, 
              page: 1, 
              limit: 25, 
              sortField: 'L10', 
              sortDirection: 'desc',
              selectedGames: null
            }),
            staleTime: 60000, // 1 minute
          })
        )
      }
    })

    // 2. Prefetch next 2-3 pages for smooth pagination
    if (totalPages) {
      for (let nextPage = currentPage + 1; nextPage <= Math.min(currentPage + 3, totalPages); nextPage++) {
        prefetchTasks.push(
          queryClient.prefetchQuery({
            queryKey: ['hitRates', sport, currentMarket, nextPage, 25, sortField, sortDirection, selectedGames],
            queryFn: () => fetchHitRatesData({ 
              sport, 
              market: currentMarket, 
              page: nextPage, 
              limit: 25, 
              sortField, 
              sortDirection,
              selectedGames
            }),
            staleTime: 30000,
          })
        )
      }
    }

    // 3. Prefetch common sort orders
    const commonSortFields = ['L5', 'L10', 'L20', 'seasonHitRate', 'name', 'line', 'average']
    commonSortFields.forEach(field => {
      if (field !== sortField) {
        // Current direction
        prefetchTasks.push(
          queryClient.prefetchQuery({
            queryKey: ['hitRates', sport, currentMarket, 1, 25, field, sortDirection, selectedGames],
            queryFn: () => fetchHitRatesData({ 
              sport, 
              market: currentMarket, 
              page: 1, 
              limit: 25, 
              sortField: field, 
              sortDirection,
              selectedGames
            }),
            staleTime: 30000,
          })
        )

        // Opposite direction for performance metrics
        if (['L5', 'L10', 'L20', 'seasonHitRate', 'average'].includes(field)) {
          const oppositeDirection = sortDirection === 'asc' ? 'desc' : 'asc'
          prefetchTasks.push(
            queryClient.prefetchQuery({
              queryKey: ['hitRates', sport, currentMarket, 1, 25, field, oppositeDirection, selectedGames],
              queryFn: () => fetchHitRatesData({ 
                sport, 
                market: currentMarket, 
                page: 1, 
                limit: 25, 
                sortField: field, 
                sortDirection: oppositeDirection,
                selectedGames
              }),
              staleTime: 30000,
            })
          )
        }
      }
    })

    // 4. Execute prefetching in background (non-blocking)
    Promise.all(prefetchTasks).then(() => {
      console.log(`[Performance] ⚡ Prefetched ${prefetchTasks.length} queries for instant UX`)
    }).catch(error => {
      console.warn('[Performance] Prefetch error (non-critical):', error)
    })

  }, [sport, currentMarket, currentPage, sortField, sortDirection, selectedGames, totalPages, queryClient])

  // 5. Preload aggregated data for other markets in background
  useEffect(() => {
    const preloadOtherMarkets = async () => {
      const marketsToPreload = ['Hits', 'Home Runs', 'Total Bases', 'RBIs']
      
      for (const market of marketsToPreload) {
        if (market !== currentMarket) {
          try {
            // Trigger aggregation in background
            fetch(`/api/hit-rates-aggregated?sport=${sport}&market=${market}&page=1&limit=1`, {
              method: 'GET',
              cache: 'no-store' // Don't cache the request itself, just trigger the aggregation
            }).catch(() => {
              // Ignore errors - this is background preloading
            })
          } catch {
            // Ignore errors
          }
        }
      }
    }

    // Delay preloading to not interfere with main request
    const timer = setTimeout(preloadOtherMarkets, 2000)
    return () => clearTimeout(timer)
  }, [sport, currentMarket])
} 