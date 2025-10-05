import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"

export const dynamic = "force-dynamic"

type BookSide = {
  price?: number
  link?: string
  sid?: string
}

type LineSportsbooks = Record<string, { over?: BookSide; under?: BookSide }>

function toDecimal(american: number | undefined | null): number | null {
  if (american === undefined || american === null || Number.isNaN(american)) return null
  const a = Number(american)
  if (!Number.isFinite(a)) return null
  return a >= 100 ? 1 + a / 100 : a <= -100 ? 1 + 100 / Math.abs(a) : null
}

function impliedProbFromAmerican(american: number | undefined | null): number | null {
  if (american === undefined || american === null) return null
  const a = Number(american)
  if (!Number.isFinite(a)) return null
  return a > 0 ? 100 / (a + 100) : Math.abs(a) / (Math.abs(a) + 100)
}

function pickBestByDecimal<T extends { price?: number }>(items: Record<string, T | undefined>): { book: string; price: number } | null {
  let best: { book: string; price: number; dec: number } | null = null
  for (const [book, obj] of Object.entries(items)) {
    const price = obj?.price
    if (typeof price !== "number") continue
    const dec = toDecimal(price)
    if (dec == null) continue
    if (!best || dec > best.dec) {
      best = { book, price, dec }
    }
  }
  if (!best) return null
  return { book: best.book, price: best.price }
}

function averageDecimal(items: Array<number | null | undefined>): number | null {
  const decs: number[] = []
  for (const price of items) {
    if (typeof price !== "number") continue
    const d = toDecimal(price)
    if (d != null) decs.push(d)
  }
  if (decs.length === 0) return null
  return decs.reduce((a, b) => a + b, 0) / decs.length
}

function computeNoVigFair(overAmerican: number | null, underAmerican: number | null): { pOver: number | null; pUnder: number | null } {
  const dOver = overAmerican != null ? toDecimal(overAmerican) : null
  const dUnder = underAmerican != null ? toDecimal(underAmerican) : null
  if (dOver == null || dUnder == null) return { pOver: null, pUnder: null }
  const qOver = 1 / dOver
  const qUnder = 1 / dUnder
  const s = qOver + qUnder
  if (s <= 0) return { pOver: null, pUnder: null }
  return { pOver: qOver / s, pUnder: qUnder / s }
}

function evPercent(decimalOdds: number | null, winProb: number | null): number | null {
  if (decimalOdds == null || winProb == null) return null
  return (decimalOdds * winProb - 1) * 100
}

function normalizeLeague(raw?: string | null): string | null {
  if (!raw) return null
  const v = raw.toLowerCase().trim()
  if (["mlb", "baseball", "baseball_mlb"].includes(v)) return "mlb"
  if (["nfl", "football", "football_nfl"].includes(v)) return "nfl"
  return v
}

function normalizeMarket(raw?: string | null): string | null {
  if (!raw) return null
  // Keep simple for now; expect exact match key segment
  return raw.toLowerCase().trim()
}

async function resolvePlayerId(league: string, playerName: string): Promise<{ id: string; full_name?: string } | null> {
  // Prefer provided playercache:<league>:v1 if available
  const cacheKey = `playercache:${league}:v1`
  let data = await redis.get<Record<string, { player_id: string; full_name?: string }>>(cacheKey)
  const searchName = playerName.toLowerCase().trim()
  if (data && typeof data === "object") {
    // direct
    if (data[searchName]?.player_id) {
      return { id: String(data[searchName].player_id), full_name: data[searchName].full_name }
    }
    // fuzzy contains
    const entry = Object.entries(data).find(([k]) => k.includes(searchName))?.[1]
    if (entry?.player_id) return { id: String(entry.player_id), full_name: entry.full_name }
  }
  // Fallback to generic name_to_id mapping used elsewhere
  const fallbackKey = `player:${league}:name_to_id`
  const alt = await redis.get<Record<string, { full_name: string; player_id: number | string }>>(fallbackKey)
  if (alt) {
    const found = Object.values(alt).find((p) => p.full_name?.toLowerCase() === searchName)
    if (found?.player_id != null) return { id: String(found.player_id), full_name: found.full_name }
  }
  return null
}

async function getLatestKeyForPlayer(league: string, playerId: string, market: string): Promise<string | null> {
  // Try to find any event key for this player + market
  // Pattern: odds:<league>:*:<playerId>:<market>
  let cursor = "0"
  const match = `odds:${league}:*:${playerId}:${market}`
  let latestKey: string | null = null
  do {
    const [nextCursor, keys] = await (redis as any).scan(cursor, { match, count: 50 })
    cursor = nextCursor
    if (Array.isArray(keys) && keys.length) {
      // Heuristic: pick lexicographically last; later we could fetch and compare commence_time
      keys.sort()
      latestKey = keys[keys.length - 1]
      break
    }
  } while (cursor !== "0")
  return latestKey
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const league = normalizeLeague(url.searchParams.get("league"))
    const player = (url.searchParams.get("player") || "").trim()
    const market = normalizeMarket(url.searchParams.get("market"))
    const eventId = url.searchParams.get("event_id") || undefined
    const includeBooks = (url.searchParams.get("books") || "").split(",").map((s) => s.trim()).filter(Boolean)

    if (!league || !player || !market) {
      return NextResponse.json({ error: "Missing required params: league, player, market" }, { status: 400 })
    }

    // Resolve player id
    const playerResolved = await resolvePlayerId(league, player)
    if (!playerResolved) {
      return NextResponse.json({ error: "Player not found", player }, { status: 404 })
    }
    const playerId = playerResolved.id

    // Build key
    let key: string | null = null
    if (eventId) {
      key = `odds:${league}:${eventId}:${playerId}:${market}`
    } else {
      key = await getLatestKeyForPlayer(league, playerId, market)
    }
    if (!key) {
      return NextResponse.json({ error: "No odds key found for player/market", player_id: playerId, market }, { status: 404 })
    }

    // Fetch odds blob
    const raw = await redis.get<any>(key)
    if (!raw) return NextResponse.json({ error: "No odds data found", key }, { status: 404 })
    const data = typeof raw === "string" ? JSON.parse(raw) : raw

    // Support both shapes: { lines: { [line]: { sportsbooks: {...} } } } or directly { [line]: { sportsbooks } }
    const linesRoot: Record<string, any> = data?.lines && typeof data.lines === "object" ? data.lines : data
    if (!linesRoot || typeof linesRoot !== "object") {
      return NextResponse.json({ error: "Unsupported odds format", key }, { status: 422 })
    }

    const result: any[] = []
    const contributingBooksSet = new Set<string>()

    for (const [line, lineObj] of Object.entries(linesRoot)) {
      // Support both shapes per line: { sportsbooks: {...} } or directly { <book>: { over/under } }
      const maybeSb =
        lineObj && typeof lineObj === "object" && (lineObj as any).sportsbooks && typeof (lineObj as any).sportsbooks === "object"
          ? (lineObj as any).sportsbooks
          : (lineObj as any)

      const sportsbooks = maybeSb as LineSportsbooks | undefined
      if (!sportsbooks || typeof sportsbooks !== "object") continue

      const filteredEntries = includeBooks.length
        ? Object.fromEntries(Object.entries(sportsbooks).filter(([book]) => includeBooks.includes(book)))
        : sportsbooks

      const overMap: Record<string, { price?: number }> = {}
      const underMap: Record<string, { price?: number }> = {}
      const booksOut: Record<string, any> = {}
      for (const [book, sides] of Object.entries(filteredEntries)) {
        const over = (sides as any)?.over
        const under = (sides as any)?.under
        if (over?.price != null) overMap[book] = { price: over.price }
        if (under?.price != null) underMap[book] = { price: under.price }
        contributingBooksSet.add(book)
        booksOut[book] = {
          over: over
            ? {
                price: over.price,
                decimal: toDecimal(over.price),
                implied: impliedProbFromAmerican(over.price),
                link: over.link ?? null,
                sid: over.sid ?? null,
                last_update: over.last_update ?? null,
              }
            : null,
          under: under
            ? {
                price: under.price,
                decimal: toDecimal(under.price),
                implied: impliedProbFromAmerican(under.price),
                link: under.link ?? null,
                sid: under.sid ?? null,
                last_update: under.last_update ?? null,
              }
            : null,
        }
      }

      const bestOver = pickBestByDecimal(overMap)
      const bestUnder = pickBestByDecimal(underMap)

      const avgOverDec = averageDecimal(Object.values(overMap).map((o) => o.price))
      const avgUnderDec = averageDecimal(Object.values(underMap).map((u) => u.price))

      const bestOverDec = bestOver ? toDecimal(bestOver.price) : null
      const bestUnderDec = bestUnder ? toDecimal(bestUnder.price) : null

      const impliedOver = bestOver ? impliedProbFromAmerican(bestOver.price) : null
      const impliedUnder = bestUnder ? impliedProbFromAmerican(bestUnder.price) : null

      const noVig = computeNoVigFair(bestOver?.price ?? null, bestUnder?.price ?? null)
      const evOver = evPercent(bestOverDec, noVig.pOver)
      const evUnder = evPercent(bestUnderDec, noVig.pUnder)

      result.push({
        line,
        books: booksOut,
        best_over: bestOver ? { book: bestOver.book, price: bestOver.price, decimal: bestOverDec } : null,
        best_under: bestUnder ? { book: bestUnder.book, price: bestUnder.price, decimal: bestUnderDec } : null,
        avg_over_decimal: avgOverDec,
        avg_under_decimal: avgUnderDec,
        implied_over: impliedOver,
        implied_under: impliedUnder,
        no_vig_prob_over: noVig.pOver,
        no_vig_prob_under: noVig.pUnder,
        ev_over_pct: evOver,
        ev_under_pct: evUnder,
      })
    }

    result.sort((a, b) => parseFloat(a.line) - parseFloat(b.line))

    return NextResponse.json({
      key,
      league,
      player: { id: playerId, name: playerResolved.full_name || player },
      market,
      lines: result,
      contributing_books: Array.from(contributingBooksSet),
      step: (() => {
        const nums = result.map((r) => parseFloat(r.line)).filter((n) => Number.isFinite(n))
        nums.sort((a, b) => a - b)
        let minStep: number | null = null
        for (let i = 1; i < nums.length; i++) {
          const d = +(nums[i] - nums[i - 1]).toFixed(3)
          if (d > 0 && (minStep == null || d < minStep)) minStep = d
        }
        return minStep
      })(),
      last_updated: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error("/api/ladder error", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}


