import { NextResponse } from "next/server"
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
	over_sid?: string
	under_book: string
	under_odds: number
	under_stake_pct: number
	under_link?: string
	under_sid?: string
	game?: string
	start_time?: string
	pointer?: string
	found_at?: string
	last_seen?: string
}

const KEY = "feature:arbitrage_opportunities"

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const limitParam = searchParams.get("limit")
		const minArbParam = searchParams.get("min_arb")
		const limit = limitParam ? Math.max(1, Math.min(500, Number(limitParam))) : undefined
		const minArb = minArbParam ? Number(minArbParam) : undefined

		let items: ArbitrageOpportunity[] = []

		// Prefer Redis List if present
		try {
			const list = await redis.lrange<string | ArbitrageOpportunity>(KEY, 0, -1)
			if (Array.isArray(list) && list.length > 0) {
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

		// Normalize
		const normalized: ArbitrageOpportunity[] = (items || [])
			.map((i) => ({
				...i,
				line: typeof i.line === "string" ? i.line : Number(i.line),
				arb_percentage: Number(i.arb_percentage),
				over_odds: Number(i.over_odds),
				under_odds: Number(i.under_odds),
				over_stake_pct: Number(i.over_stake_pct),
				under_stake_pct: Number(i.under_stake_pct),
				over_link: (i as any).over_link ?? (i as any).over?.link ?? (i as any).over_link_url,
				over_sid: (i as any).over_sid ?? (i as any).over?.sid,
				under_link: (i as any).under_link ?? (i as any).under?.link ?? (i as any).under_link_url,
				under_sid: (i as any).under_sid ?? (i as any).under?.sid,
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

		return NextResponse.json({ count: result.length, items: result })
	} catch (error) {
		console.error("[API] Error fetching arbitrage opportunities:", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}
