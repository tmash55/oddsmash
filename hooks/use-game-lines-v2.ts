import { useQuery } from "@tanstack/react-query"
import type { GameOdds } from "@/types/game-lines"

export interface UseGameLinesParams {
  sport: string
  market: string
  gameId?: string
  sportsbook?: string | null
  line?: string | null
  period?: string | null
}

export interface UseGameLinesResult {
  data:
    | {
        games: GameOdds[]
        metadata: { globalLastUpdated: string | null }
      }
    | undefined
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

async function fetchGameLinesData(sport: string, market: string): Promise<GameOdds[]> {
  const res = await fetch(`/api/odds/${sport}/${market}`)
  if (!res.ok) {
    const errorText = await res.text().catch(() => "")
    throw new Error(errorText || "Failed to fetch game lines")
  }
  return res.json()
}

export function useGameLinesV2(params: UseGameLinesParams): UseGameLinesResult {
  // Normalize MLB run_line/puck_line to spreads for caching consistency
  const normalizedMarketForKey =
    params.market === "run_line" || params.market === "puck_line" ? "spread" : params.market
  const queryKey = ["gameLinesV2", params.sport, normalizedMarketForKey]

  const query = useQuery({
    queryKey,
    queryFn: () => fetchGameLinesData(params.sport, params.market),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 3,
    placeholderData: (prev) => prev,
    select: (raw: GameOdds[]) => {
      const games = params.gameId ? raw.filter((g) => g.event_id === params.gameId) : raw

      // Compute a global last updated timestamp across games and bookmakers
      const timestamps: string[] = []
      for (const g of games) {
        if (g.last_update) timestamps.push(g.last_update)
        for (const b of g.bookmakers) if (b.last_update) timestamps.push(b.last_update)
      }
      const globalLastUpdated =
        timestamps.length > 0
          ? new Date(Math.max(...timestamps.map((t) => new Date(t).getTime()))).toISOString()
          : null

      return { games, metadata: { globalLastUpdated } }
    },
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: !!query.error,
    refetch: () => query.refetch(),
  }
}

export async function prefetchGameLines(
  queryClient: import("@tanstack/react-query").QueryClient,
  sport: string,
  market: string,
) {
  return queryClient.prefetchQuery({
    queryKey: ["gameLinesV2", sport, market],
    queryFn: () => fetch(`/api/odds/${sport}/${market}`).then((r) => r.json()),
    staleTime: 30 * 60 * 1000,
  })
}


