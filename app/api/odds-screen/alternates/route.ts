import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { redis } from '@/lib/redis'

const AlternatesRequestSchema = z.object({
  sport: z.string().min(1, 'Sport is required'),
  type: z.enum(['player', 'game'], {
    errorMap: () => ({ message: 'Type must be either "player" or "game"' })
  }),
  market: z.string().min(1, 'Market is required'),
  scope: z.enum(['pregame', 'live'], {
    errorMap: () => ({ message: 'Scope must be either "pregame" or "live"' })
  }),
  eventId: z.string().min(1, 'eventId is required'),
})

interface AlternatesResponse {
  success: boolean
  metadata: {
    sport: string
    type: 'player' | 'game'
    market: string
    scope: string
    eventId: string
    lastUpdated: string
    rawBytes: number
  }
  data: unknown
  error?: string
}

function buildAlternatesKey(params: {
  sport: string
  type: 'player' | 'game'
  market: string
  scope: string
  eventId: string
}): string {
  const { sport, type, market, scope, eventId } = params
  const marketSegment = type === 'game' ? `${market}:game` : market
  return `odds:${sport}:props:${marketSegment}:alts:event:${eventId}:${scope}`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rawParams = {
      sport: searchParams.get('sport'),
      type: searchParams.get('type'),
      market: searchParams.get('market'),
      scope: searchParams.get('scope'),
      eventId: searchParams.get('eventId'),
    }

    const validatedParams = AlternatesRequestSchema.parse(rawParams)

    const normalizedParams = {
      sport: validatedParams.sport.toLowerCase(),
      type: validatedParams.type,
      market: validatedParams.market.toLowerCase(),
      scope: validatedParams.scope.toLowerCase() as 'pregame' | 'live',
      eventId: validatedParams.eventId.trim(),
    }

    const redisKey = buildAlternatesKey(normalizedParams)
    const startTime = Date.now()
    const rawData = await redis.get(redisKey)
    const fetchTime = Date.now() - startTime

    if (!rawData) {
      return NextResponse.json({
        success: true,
        metadata: {
          sport: normalizedParams.sport,
          type: normalizedParams.type,
          market: normalizedParams.market,
          scope: normalizedParams.scope,
          eventId: normalizedParams.eventId,
          lastUpdated: new Date().toISOString(),
          rawBytes: 0,
        },
        data: [],
      } as AlternatesResponse)
    }

    const parsedData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData
    const rawBytes = typeof rawData === 'string' ? rawData.length : JSON.stringify(rawData).length

    const response = NextResponse.json({
      success: true,
      metadata: {
        sport: normalizedParams.sport,
        type: normalizedParams.type,
        market: normalizedParams.market,
        scope: normalizedParams.scope,
        eventId: normalizedParams.eventId,
        lastUpdated: new Date().toISOString(),
        rawBytes,
      },
      data: parsedData,
    } as AlternatesResponse)

    response.headers.set('X-Redis-Fetch-Time', `${fetchTime}ms`)
    response.headers.set('Cache-Control', 'public, max-age=15, stale-while-revalidate=30')
    return response
  } catch (error) {
    console.error('[/api/odds-screen/alternates] Error:', error)
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return NextResponse.json({
      success: false,
      error: message,
    } as AlternatesResponse, { status: 500 })
  }
}
