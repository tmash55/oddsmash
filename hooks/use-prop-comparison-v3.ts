import { useQuery } from "@tanstack/react-query";
import type { PropComparisonV3Params, PropComparisonV3Response } from "@/types/prop-comparison-v3";

async function fetchPropComparisonV3Data(params: PropComparisonV3Params): Promise<PropComparisonV3Response> {
  const searchParams = new URLSearchParams();
  
  // Add required parameters
  searchParams.append("sport", params.sport);
  searchParams.append("market", params.market);
  
  // Add optional parameters
  if (params.scope) searchParams.append("scope", params.scope);
  if (params.gameId) searchParams.append("gameId", params.gameId);
  
  const response = await fetch(`/api/prop-comparison/v3?${searchParams.toString()}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "An error occurred" }));
    throw new Error(error.message || "Failed to fetch prop comparison data");
  }
  
  return response.json();
}

export function usePropComparisonV3(params: PropComparisonV3Params) {
  // Include essential params in the query key to minimize refetches
  const queryKey = ["propComparisonV3", params.sport, params.market, params.scope || 'pregame'];
  
  const query = useQuery({
    queryKey,
    queryFn: () => fetchPropComparisonV3Data(params),
    staleTime: 90 * 1000, // Data becomes stale after 90 seconds (slightly longer than API cache)
    gcTime: 10 * 60 * 1000, // Keep unused data in cache for 10 minutes (longer retention)
    refetchInterval: false, // Disable aggressive polling - use background updates instead
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch when connection restored
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    placeholderData: (previousData) => previousData,
    select: (data) => {
      // **OPTIMIZATION**: Only transform data if it has changed to prevent unnecessary re-renders
      if (!data?.data) return data;
      
      // Check if data is already sorted to avoid unnecessary operations
      const isAlreadySorted = data.data.length <= 1 || 
        data.data.every((item, index, arr) => 
          index === 0 || arr[index - 1].description.localeCompare(item.description) <= 0
        );
      
      if (isAlreadySorted) {
        return data; // Return original reference to prevent re-renders
      }
      
      // Only sort if needed and create minimal object spread
      return {
        ...data,
        data: [...data.data].sort((a, b) => a.description.localeCompare(b.description))
      };
    }
  });

  return query;
}
