"use client";

import { useState, useEffect } from "react";
import type { Event } from "@/lib/odds-api";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Calendar, Clock, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, isToday, isTomorrow } from "date-fns";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

interface GameSelectorProps {
  onGameSelect: (eventId: string) => void;
  sport?: string;
  isLoading?: boolean;
  initialEventId?: string | null;
}

export function GameSelector({
  onGameSelect,
  sport = "basketball_nba",
  isLoading = false,
  initialEventId = null,
}: GameSelectorProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(initialEventId);
  const isMobile = useMediaQuery("(max-width: 640px)");

  // Helper function to get shortened ID (last 5 digits)
  const getShortenedId = (id: string): string => {
    return id.slice(-5);
  };

  // Helper function to find full ID from shortened ID
  const getFullIdFromShortened = (shortId: string): string | null => {
    const event = events.find(e => e.id.endsWith(shortId));
    return event ? event.id : null;
  };

  // Update when initialEventId changes (for URL-based navigation)
  useEffect(() => {
    if (initialEventId !== selectedEventId) {
      setSelectedEventId(initialEventId);
    }
  }, [initialEventId]);

  // Only reset selection when sport changes, not for prop type changes
  useEffect(() => {
    // If we have an initial event ID, use it
    if (initialEventId) {
      setSelectedEventId(initialEventId);
      onGameSelect(initialEventId);
    } else {
      // Only reset the selection if changing sports
      setSelectedEventId(null);
      onGameSelect("");
    }
    setError(null);
  }, [sport, onGameSelect, initialEventId]);

  useEffect(() => {
    const fetchEvents = async () => {
      if (loading === false) setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/events?sport=${sport}`);
        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("Invalid response format");
        }

        // Sort events by commence time
        const sortedEvents = data.sort(
          (a: Event, b: Event) =>
            new Date(a.commence_time).getTime() -
            new Date(b.commence_time).getTime()
        );
        setEvents(sortedEvents);

        // If we have an initial event ID, check if it exists in the fetched events
        if (initialEventId) {
          const eventExists = sortedEvents.some(e => e.id === initialEventId);
          if (eventExists) {
            setSelectedEventId(initialEventId);
            onGameSelect(initialEventId);
          } else {
            // If the event doesn't exist (maybe it's from a different sport),
            // select the first event instead
            if (sortedEvents.length > 0) {
              const firstEvent = sortedEvents[0];
              setSelectedEventId(firstEvent.id);
              onGameSelect(firstEvent.id);
            }
          }
        }
        // Otherwise auto-select first game if none selected
        else if (sortedEvents.length > 0 && !selectedEventId) {
          const firstEvent = sortedEvents[0];
          setSelectedEventId(firstEvent.id);
          onGameSelect(firstEvent.id);
        }
      } catch (err) {
        console.error("Error fetching events:", err);
        setError(err instanceof Error ? err.message : "Failed to load events");
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [sport, onGameSelect, initialEventId, selectedEventId]);

  const handleGameSelect = (eventId: string) => {
    // We're passing the full ID to the parent component
    setSelectedEventId(eventId);
    onGameSelect(eventId);
  };

  // Group events by date
  const groupedEvents = events.reduce((groups, event) => {
    const date = new Date(event.commence_time).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {} as Record<string, Event[]>);

  // Format date for display
  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEEE, MMMM d");
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 rounded-md px-3 py-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading games...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive bg-destructive/10 rounded-md px-3 py-2">
        <AlertCircle className="h-4 w-4" />
        <span className="flex-1">{error}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setError(null);
            setLoading(true);
          }}
          className="h-7 gap-1"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </Button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-muted-foreground bg-muted/30 rounded-md px-3 py-2 flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        <span>No games available for this sport</span>
      </div>
    );
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div className="flex flex-col gap-2 w-full">
      <Select
        value={selectedEventId || ""}
        onValueChange={handleGameSelect}
        disabled={isLoading || loading}
      >
        <SelectTrigger className={cn("w-full", isLoading && "opacity-70")}>
          <SelectValue
            placeholder={isLoading ? "Loading games..." : "Select a game"}
          >
            {selectedEvent && !isLoading && (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1">
                  <span className="font-medium">{selectedEvent.away_team}</span>
                  <span className="text-muted-foreground">@</span>
                  <span className="font-medium">{selectedEvent.home_team}</span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 ml-4">
                  <Clock className="h-3 w-3" />
                  {format(
                    new Date(selectedEvent.commence_time),
                    "MMM d, h:mm a"
                  )}
                  <span className="ml-1 opacity-50">#{getShortenedId(selectedEvent.id)}</span>
                </div>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[60vh]">
          {Object.entries(groupedEvents).map(([date, dateEvents]) => (
            <SelectGroup key={date}>
              <SelectLabel className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide py-1.5">
                <Calendar className="h-3 w-3" />
                {formatDateLabel(date)}
              </SelectLabel>
              {dateEvents.map((event) => {
                const gameTime = new Date(event.commence_time);
                const isUpcoming = gameTime > new Date();

                return (
                  <SelectItem
                    key={event.id}
                    value={event.id}
                    className={cn(
                      "py-3 px-2",
                      isMobile ? "flex flex-col items-start gap-1" : ""
                    )}
                  >
                    <div
                      className={cn(
                        "flex w-full",
                        isMobile
                          ? "flex-col gap-1"
                          : "items-center justify-between"
                      )}
                    >
                      <div className="flex flex-col">
                        <div className="font-medium">{event.away_team}</div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">
                            @
                          </span>
                          <span className="font-medium">{event.home_team}</span>
                        </div>
                      </div>

                      <div
                        className={cn(
                          "text-sm text-muted-foreground",
                          isMobile ? "mt-1" : "ml-8 text-right"
                        )}
                      >
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{format(gameTime, "h:mm a")}</span>
                        </div>
                        <div className="text-xs flex items-center gap-1">
                          <span>{format(gameTime, "MMM d, yyyy")}</span>
                          <span className="opacity-50">#{getShortenedId(event.id)}</span>
                        </div>
                        {isUpcoming && !isMobile && (
                          <div className="mt-1">
                            <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded-full text-[10px]">
                              Upcoming
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {isUpcoming && isMobile && (
                      <div className="mt-1">
                        <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded-full text-[10px]">
                          Upcoming
                        </span>
                      </div>
                    )}
                  </SelectItem>
                );
              })}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
