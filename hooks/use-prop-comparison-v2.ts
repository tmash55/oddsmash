import { useQuery } from "@tanstack/react-query";
import type { PropComparisonParams, PropComparisonResponse } from "@/types/prop-comparison";

async function fetchPropComparisonData(params: PropComparisonParams): Promise<PropComparisonResponse> {
  const searchParams = new URLSearchParams();
  
  // Add required parameters
  searchParams.append("sport", params.sport);
  
  // Add optional parameters
  if (params.market) searchParams.append("market", params.market);
  if (params.gameId) searchParams.append("gameId", params.gameId);
  if (params.sportsbook) searchParams.append("sportsbook", params.sportsbook);
  if (params.line) searchParams.append("line", params.line);
  
  const response = await fetch(`/api/prop-comparison/v2?${searchParams.toString()}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "An error occurred" }));
    throw new Error(error.message || "Failed to fetch prop comparison data");
  }
  
  return response.json();
}

export function usePropComparisonV2(params: PropComparisonParams) {
  // Only include essential params in the query key to minimize refetches
  const queryKey = ["propComparisonV2", params.sport, params.market];
  
  const query = useQuery({
    queryKey,
    queryFn: () => fetchPropComparisonData({
      sport: params.sport,
      market: params.market,
      // Remove gameId from API call since we'll filter client-side
      sportsbook: params.sportsbook,
      line: params.line,
    }),
    staleTime: 30 * 60 * 1000, // Data becomes stale after 30 minutes
    gcTime: 60 * 60 * 1000, // Keep unused data in cache for 1 hour
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    placeholderData: (previousData) => previousData,
    select: (data) => {
      // Sort players by description for consistent ordering
      const sortedData = {
        ...data,
        data: [...data.data].sort((a, b) => a.description.localeCompare(b.description))
      };

      // Apply game filtering client-side if a game is selected
      if (params.gameId) {
        return {
          ...sortedData,
          data: sortedData.data.filter(item => item.event_id === params.gameId),
          filtered: true, // Add flag to indicate data was filtered
        };
      }

      return {
        ...sortedData,
        filtered: false,
      };
    }
  });

  return query;
} 