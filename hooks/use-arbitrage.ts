import { useQuery } from "@tanstack/react-query"

export interface ArbitrageOpportunity {
	sport: string
	event_id: string
	description: string
	market_key: string
	line: string | number
	arb_percentage: number
	over_book: string
	over_odds: number
	over_stake_pct: number
	under_book: string
	under_odds: number
	under_stake_pct: number
	game?: string
	start_time?: string
	pointer?: string
	found_at?: string
	last_seen?: string
}

interface Params {
	minArb?: number
	limit?: number
}

export function useArbitrage(params: Params = {}) {
	const { minArb, limit } = params
	return useQuery({
		queryKey: ["arbitrage", { minArb, limit }],
		queryFn: async () => {
			const qs = new URLSearchParams()
			if (typeof minArb === "number") qs.set("min_arb", String(minArb))
			if (typeof limit === "number") qs.set("limit", String(limit))
			const res = await fetch(`/api/arbitrage?${qs.toString()}`)
			if (!res.ok) throw new Error("Failed to fetch arbitrage opportunities")
			const data = await res.json()
			return data as { count: number; items: ArbitrageOpportunity[] }
		},
		staleTime: 30_000,
		refetchInterval: 60_000,
	})
}
