import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"

interface HighEvBet {
	sport: string
	player_id: number
	description: string
	team: string
	market: string
	line: string | number
	side: "over" | "under" | string
	ev_pct: number
	fair_odds?: number
	best_book?: string
	best_price?: number
	event_id?: string
	commence_time?: string
	pointer?: string
	found_at?: string
	last_seen?: string
	// New optional fields for richer UI
	home_team?: string
	away_team?: string
	link?: string
	sid?: string
}

const KEY = "feature:high_ev_pct"

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const limitParam = searchParams.get("limit")
		const minEvParam = searchParams.get("min_ev")
		const limit = limitParam ? Math.max(1, Math.min(500, Number(limitParam))) : undefined
		const minEv = minEvParam ? Number(minEvParam) : undefined

		let items: HighEvBet[] = []

		// 1) Prefer Redis List if present
		try {
			const list = await redis.lrange<string | HighEvBet>(KEY, 0, -1)
			if (Array.isArray(list) && list.length > 0) {
				items = list
					.map((entry) => {
						if (typeof entry === "string") {
							try {
								return JSON.parse(entry) as HighEvBet
							} catch {
								return null
							}
						}
						return entry as HighEvBet
					})
					.filter(Boolean) as HighEvBet[]
			}
		} catch (e) {
			// Ignore and fall back to GET
		}

		// 2) If not a list, try simple GET (stringified JSON or JSON value)
		if (items.length === 0) {
			const raw = await redis.get<string | HighEvBet[] | Record<string, any>>(KEY)
			if (raw) {
				let parsed: any = raw
				if (typeof raw === "string") {
					try {
						parsed = JSON.parse(raw)
					} catch {
						parsed = raw
					}
				}

				if (Array.isArray(parsed)) {
					items = parsed as HighEvBet[]
				} else if (parsed && typeof parsed === "object" && Array.isArray((parsed as any).items)) {
					items = (parsed as any).items as HighEvBet[]
				} else if (parsed && typeof parsed === "object") {
					// Some writers store as an object keyed by pointer or id
					items = Object.values(parsed) as HighEvBet[]
				}
			}
		}

		// Normalize and filter
		const normalized: HighEvBet[] = (items || [])
			.map((i) => ({
				...i,
				player_id: Number(i.player_id),
				line: typeof i.line === "string" ? i.line : Number(i.line),
				ev_pct: Number(i.ev_pct),
				best_price: i.best_price !== undefined ? Number(i.best_price) : undefined,
				fair_odds: i.fair_odds !== undefined ? Number(i.fair_odds) : undefined,
				// Ensure new fields exist and are well-typed if present
				home_team: i.home_team ?? undefined,
				away_team: i.away_team ?? undefined,
				link: i.link ?? undefined,
				sid: i.sid ?? undefined,
			}))
			.filter((i) => !Number.isNaN(i.ev_pct))

		// Optional min EV filter
		const filtered = typeof minEv === "number" ? normalized.filter((i) => i.ev_pct >= minEv) : normalized

		// Sort by EV desc, then by last_seen desc if present
		filtered.sort((a, b) => {
			if (b.ev_pct !== a.ev_pct) return b.ev_pct - a.ev_pct
			const at = a.last_seen ? Date.parse(a.last_seen) : 0
			const bt = b.last_seen ? Date.parse(b.last_seen) : 0
			return bt - at
		})

		const result = typeof limit === "number" ? filtered.slice(0, limit) : filtered

		return NextResponse.json({
			count: result.length,
			items: result,
		})
	} catch (error) {
		console.error("[API] Error fetching high EV bets:", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}


