'use client'

import { useState, useEffect } from 'react'
import { Event } from '@/lib/odds-api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

interface GameSelectorProps {
  onGameSelect: (eventId: string) => void
  sport?: string
}

export function GameSelector({ onGameSelect, sport = 'basketball_nba' }: GameSelectorProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  // Reset selection when sport changes
  useEffect(() => {
    setSelectedEventId(null)
    onGameSelect('')
    setError(null)
  }, [sport, onGameSelect])

  useEffect(() => {
    const fetchEvents = async () => {
      if (loading === false) setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/events?sport=${sport}`)
        if (!response.ok) {
          throw new Error('Failed to fetch events')
        }
        
        const data = await response.json()
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format')
        }

        // Sort events by commence time
        const sortedEvents = data.sort((a: Event, b: Event) => 
          new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime()
        )
        setEvents(sortedEvents)

        // Auto-select first game if none selected
        if (sortedEvents.length > 0 && !selectedEventId) {
          const firstEvent = sortedEvents[0]
          setSelectedEventId(firstEvent.id)
          onGameSelect(firstEvent.id)
        }
      } catch (err) {
        console.error('Error fetching events:', err)
        setError(err instanceof Error ? err.message : 'Failed to load events')
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [sport, onGameSelect])

  const handleGameSelect = (eventId: string) => {
    setSelectedEventId(eventId)
    onGameSelect(eventId)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading games...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive">
        <span>Error: {error}</span>
        <button 
          onClick={() => {
            setError(null)
            setLoading(true)
          }} 
          className="text-sm underline hover:text-destructive/80"
        >
          Try again
        </button>
      </div>
    )
  }

  if (events.length === 0) {
    return <div className="text-muted-foreground">No games available</div>
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedEventId || ''} onValueChange={handleGameSelect}>
        <SelectTrigger className="w-[300px]">
          <SelectValue placeholder="Select a game" />
        </SelectTrigger>
        <SelectContent>
          {events.map((event) => (
            <SelectItem key={event.id} value={event.id}>
              {event.away_team} @ {event.home_team} - {new Date(event.commence_time).toLocaleString()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
} 