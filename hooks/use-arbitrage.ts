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
	// Optional deep link fields for one-click bet placement
	over_link?: string
	over_sid?: string | null
	over_mobile_link?: string | null
	over_selection?: string
	under_book: string
	under_odds: number
	under_stake_pct: number
	under_link?: string
	under_sid?: string | null
	under_mobile_link?: string | null
	under_selection?: string
	game?: string
	start_time?: string
	is_live?: boolean
	found_at?: string
	last_seen?: string
	source?: string
	vendor_pointer?: string
	pointer_type?: string
	pointer_key?: string
	pointer_filters?: Record<string, any>
	pointer_ex?: Record<string, any>
	pointer?: string // Keep for backward compatibility
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
			
			// Enhanced fetch with performance tracking and ETag support
			const startTime = performance.now()
			const res = await fetch(`/api/arbitrage?${qs.toString()}`, {
				headers: {
					'Accept': 'application/json',
					'Cache-Control': 'no-cache', // Let server handle caching via ETag
				}
			})
			
			if (!res.ok) {
				throw new Error(`Failed to fetch arbitrage opportunities: ${res.status} ${res.statusText}`)
			}
			
			const data = await res.json()
			const fetchTime = performance.now() - startTime
			
			// Log slow requests for VC-level monitoring
			if (fetchTime > 1000) {
				console.warn(`[ARBITRAGE HOOK] Slow fetch: ${fetchTime.toFixed(2)}ms`)
			}
			
			return {
				...data,
				_fetchTime: Math.round(fetchTime),
				_timestamp: Date.now()
			} as { 
				count: number
				items: ArbitrageOpportunity[]
				metadata?: {
					totalItems: number
					filteredItems: number
					redisTime: number
					totalTime: number
					lastUpdated: string
				}
				_fetchTime: number
				_timestamp: number
			}
		},
		staleTime: 20_000, // More aggressive for real-time arbitrage
		gcTime: 15 * 60_000, // Longer cache retention for better UX
		refetchInterval: 30_000, // 30s for VC-level real-time performance
		refetchIntervalInBackground: true, // Continue in background
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
		retry: 3, // More retries for reliability
		retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 3000), // Faster retries
		placeholderData: (previousData) => previousData,
		// Advanced caching strategy
		select: (data) => {
			// Sort by arb percentage for consistent ordering
			const sortedItems = [...data.items].sort((a, b) => (b.arb_percentage || 0) - (a.arb_percentage || 0))
			return {
				...data,
				items: sortedItems
			}
		},
		// Network mode for better offline handling
		networkMode: 'online',
		// Meta for debugging
		meta: {
			errorMessage: 'Failed to load arbitrage opportunities'
		}
	})
}
