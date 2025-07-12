import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 60 * 1000, // 30 minutes
      gcTime: 60 * 60 * 1000, // 1 hour
      refetchOnWindowFocus: false,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
})

// Helper to prefetch prop comparison data
export async function prefetchPropComparison(sport: string, market: string) {
  await queryClient.prefetchQuery({
    queryKey: ["propComparisonV2", sport, market],
    queryFn: () => fetch(
      `/api/prop-comparison/v2?sport=${sport}&market=${market}`
    ).then(res => res.json()),
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
} 