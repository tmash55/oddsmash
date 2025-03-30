import { NextResponse } from 'next/server'
import { getEvents } from '@/lib/odds-api'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport')

  if (!sport) {
    return NextResponse.json(
      { error: 'Sport parameter is required' },
      { status: 400 }
    )
  }

  try {
    const events = await getEvents(sport)
    
    return NextResponse.json(events, {
      headers: {
        'x-last-updated': new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error in events API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
} 