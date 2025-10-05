import { NextRequest, NextResponse } from "next/server"
import { createHash } from 'crypto'
import { redis } from "@/lib/redis"

interface ArbitrageOpportunity {
	sport: string
	event_id: string
	description: string
	market_key: string
	line: string | number
	arb_percentage: number
	over_book: string
	over_odds: number
	over_stake_pct: number
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

const KEY = "feature:arbitrage_opportunities_oddsblaze"

export async function GET(request: NextRequest) {
	try {
		const startTime = performance.now()
		const { searchParams } = new URL(request.url)
		const limitParam = searchParams.get("limit")
		const minArbParam = searchParams.get("min_arb")
		const limit = limitParam ? Math.max(1, Math.min(500, Number(limitParam))) : undefined
		const minArb = minArbParam ? Number(minArbParam) : undefined

		let items: ArbitrageOpportunity[] = []
		let rawData: any = null

		// Optimized Redis fetching with performance tracking
		const redisStartTime = performance.now()
		
		// Prefer Redis List if present
		try {
			const list = await redis.lrange<string | ArbitrageOpportunity>(KEY, 0, -1)
			if (Array.isArray(list) && list.length > 0) {
				rawData = list
				items = list
					.map((entry) => {
						if (typeof entry === "string") {
							try {
								return JSON.parse(entry) as ArbitrageOpportunity
							} catch {
								return null
							}
						}
						return entry as ArbitrageOpportunity
					})
					.filter(Boolean) as ArbitrageOpportunity[]
			}
		} catch (e) {
			// If list lookup fails, fall back to GET below
		}

		// Fallback: GET arbitrary JSON structure
		if (items.length === 0) {
			const raw = await redis.get<string | ArbitrageOpportunity[] | Record<string, any>>(KEY)
			if (raw) {
				rawData = raw
				let parsed: any = raw
				if (typeof raw === "string") {
					try {
						parsed = JSON.parse(raw)
					} catch {
						parsed = raw
					}
				}
				if (Array.isArray(parsed)) items = parsed as ArbitrageOpportunity[]
				else if (parsed && typeof parsed === "object" && Array.isArray((parsed as any).items)) items = (parsed as any).items
				else if (parsed && typeof parsed === "object") items = Object.values(parsed) as ArbitrageOpportunity[]
			}
		}

		const redisTime = performance.now() - redisStartTime

		// Generate ETag for conditional GET support
		const rawPayload = typeof rawData === 'string' ? rawData : JSON.stringify(rawData || [])
		const etag = `W/"${createHash('sha1').update(rawPayload).digest('hex')}"`

		// Handle conditional GET requests
		const ifNoneMatch = request.headers.get('if-none-match') || request.headers.get('If-None-Match')
		if (ifNoneMatch && ifNoneMatch === etag) {
			const notModified = new NextResponse(null, { status: 304 })
			notModified.headers.set('ETag', etag)
			notModified.headers.set('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=120')
			return notModified
		}

		// Normalize - new oddsblaze format already has the right structure
		const normalized: ArbitrageOpportunity[] = (items || [])
			.map((i) => ({
				...i,
				line: typeof i.line === "string" ? i.line : Number(i.line),
				arb_percentage: Number(i.arb_percentage),
				over_odds: Number(i.over_odds),
				under_odds: Number(i.under_odds),
				over_stake_pct: Number(i.over_stake_pct),
				under_stake_pct: Number(i.under_stake_pct),
				// New format already has these fields, fallback to old nested structure for compatibility
				over_link: (i as any).over_link ?? (i as any).over?.link ?? (i as any).over_link_url,
				over_sid: (i as any).over_sid ?? (i as any).over?.sid,
				over_mobile_link: (i as any).over_mobile_link,
				over_selection: (i as any).over_selection,
				under_link: (i as any).under_link ?? (i as any).under?.link ?? (i as any).under_link_url,
				under_sid: (i as any).under_sid ?? (i as any).under?.sid,
				under_mobile_link: (i as any).under_mobile_link,
				under_selection: (i as any).under_selection,
				is_live: (i as any).is_live ?? false,
				source: (i as any).source,
				vendor_pointer: (i as any).vendor_pointer,
				pointer_type: (i as any).pointer_type,
				pointer_key: (i as any).pointer_key,
				pointer_filters: (i as any).pointer_filters,
				pointer_ex: (i as any).pointer_ex,
			}))
			.filter((i) => !Number.isNaN(i.arb_percentage))

		// Optional min arb filter
		const filtered = typeof minArb === "number" ? normalized.filter((i) => i.arb_percentage >= minArb) : normalized

		// Sort by arb desc, then by last_seen/start_time desc
		filtered.sort((a, b) => {
			if (b.arb_percentage !== a.arb_percentage) return b.arb_percentage - a.arb_percentage
			const at = a.last_seen ? Date.parse(a.last_seen) : a.start_time ? Date.parse(a.start_time) : 0
			const bt = b.last_seen ? Date.parse(b.last_seen) : b.start_time ? Date.parse(b.start_time) : 0
			return bt - at
		})

		const result = typeof limit === "number" ? filtered.slice(0, limit) : filtered

		const totalTime = performance.now() - startTime
		
		// Performance logging for VC-level monitoring
		if (totalTime > 500) {
			console.warn(`[ARBITRAGE API] Slow response: ${totalTime.toFixed(2)}ms (Redis: ${redisTime.toFixed(2)}ms)`)
		}

		const response = NextResponse.json({ 
			count: result.length, 
			items: result,
			metadata: {
				totalItems: items.length,
				filteredItems: result.length,
				redisTime: Math.round(redisTime),
				totalTime: Math.round(totalTime),
				lastUpdated: new Date().toISOString()
			}
		})

		// Set performance headers
		response.headers.set('ETag', etag)
		response.headers.set('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=120')
		response.headers.set('X-Response-Time', `${totalTime.toFixed(2)}ms`)
		response.headers.set('X-Redis-Time', `${redisTime.toFixed(2)}ms`)

		return response
	} catch (error) {
		console.error("[ARBITRAGE API] Error fetching opportunities:", error)
		return NextResponse.json({ 
			error: "Internal server error",
			timestamp: new Date().toISOString()
		}, { status: 500 })
	}
}
