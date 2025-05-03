'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { 
  americanToDecimal, 
  decimalToImpliedProbability, 
  calculateEV 
} from '@/lib/ev-calculator';
import { Badge } from "@/components/ui/badge";

interface Event {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  sport_key: string;
}

interface Market {
  key: string;
  outcomes: Outcome[];
  player?: string;
  line?: number;
}

interface Outcome {
  name: string;
  price: number;
  point?: number;
}

interface Bookmaker {
  key: string;
  title: string;
  markets: Market[];
}

interface EventProps {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  sport_key?: string;
  bookmakers: Bookmaker[];
  [key: string]: any;
}

interface EVCalculation {
  market: string;
  player: string;
  line: number;
  type: 'Over' | 'Under';
  sportsbook: string;
  odds: number;
  decimalOdds: number;
  averageOdds: number;
  averageDecimalOdds: number;
  impliedProbability: number;
  ev: number;
  evPercentage: number;
}

export default function ExistingAPIDebugPage() {
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [propsLoading, setPropsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [eventData, setEventData] = useState<EventProps | null>(null);
  const [selectedSport, setSelectedSport] = useState<string>('basketball_nba');
  const [marketType, setMarketType] = useState<string>('player_points');
  const [evCalculations, setEVCalculations] = useState<EVCalculation[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const sports = [
    { key: 'basketball_nba', name: 'NBA Basketball' },
    { key: 'basketball_ncaab', name: 'NCAAB Basketball' },
    { key: 'baseball_mlb', name: 'MLB Baseball' }
  ];

  const markets = {
    basketball_nba: [
      { key: 'player_points', name: 'Points' },
      { key: 'player_rebounds', name: 'Rebounds' },
      { key: 'player_assists', name: 'Assists' },
      { key: 'player_points_rebounds_assists', name: 'PRA' },
      { key: 'player_threes', name: 'Threes Made' }
    ],
    basketball_ncaab: [
      { key: 'player_points', name: 'Points' },
      { key: 'player_rebounds', name: 'Rebounds' },
      { key: 'player_assists', name: 'Assists' },
      { key: 'player_points_rebounds_assists', name: 'PRA' }
    ],
    baseball_mlb: [
      { key: 'batter_hits', name: 'Hits' },
      { key: 'batter_home_runs', name: 'Home Runs' },
      { key: 'batter_total_bases', name: 'Total Bases' },
      { key: 'pitcher_strikeouts', name: 'Pitcher Strikeouts' }
    ]
  };

  // Function to format American odds
  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : odds.toString();
  };

  // Format EV% for display with color coding
  const formatEV = (ev: number) => {
    let variant = 'default';
    
    if (ev >= 8) {
      variant = 'success';
    } else if (ev >= 5) {
      variant = 'primary';
    } else if (ev >= 3) {
      variant = 'secondary';
    } else if (ev < 0) {
      variant = 'destructive';
    }
    
    return (
      <Badge variant={variant as any}>
        {ev.toFixed(2)}%
      </Badge>
    );
  };

  // Fetch events for the selected sport
  const fetchEvents = async () => {
    if (!selectedSport) return;
    
    setEventsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events?sport=${selectedSport}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching events: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Filter to upcoming events and sort by start time
      const now = new Date();
      const upcomingEvents = data
        .filter((event: Event) => new Date(event.commence_time) > now)
        .sort((a: Event, b: Event) => 
          new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime()
        );
      
      setEvents(upcomingEvents);
      
      // Auto-select the first event if available
      if (upcomingEvents.length > 0 && !selectedEvent) {
        setSelectedEvent(upcomingEvents[0].id);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error fetching events:', err);
    } finally {
      setEventsLoading(false);
    }
  };

  // Fetch props for the selected event
  const fetchEventProps = async () => {
    if (!selectedEvent || !selectedSport || !marketType) return;
    
    setPropsLoading(true);
    setError(null);

    try {
      // Get all active sportsbooks
      const response = await fetch(`/api/events/${selectedEvent}/props?sport=${selectedSport}&markets=${marketType}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching props: ${response.status}`);
      }
      
      const data = await response.json();
      setEventData(data);
      
      // Calculate EV
      calculateEVValues(data);
      
      setLastUpdated(new Date().toLocaleString());
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error fetching event props:', err);
      setEventData(null);
    } finally {
      setPropsLoading(false);
    }
  };

  // Calculate EV values
  const calculateEVValues = (data: EventProps) => {
    if (!data.bookmakers || data.bookmakers.length === 0) {
      setEVCalculations([]);
      return;
    }
    
    const calculations: EVCalculation[] = [];
    
    // Look at each bookmaker
    for (const bookmaker of data.bookmakers) {
      // Skip Pinnacle since we're using average as baseline
      if (bookmaker.key === 'pinnacle') continue;
      
      for (const market of bookmaker.markets) {
        // Check if it's a player prop market
        if (!('player' in market) || !market.player || !('line' in market) || !market.line) {
          continue;
        }
        
        const marketKey = market.key;
        const playerName = market.player as string;
        const line = market.line as number;
        
        // Check both Over and Under
        for (const type of ['Over', 'Under'] as const) {
          // Find the outcome
          const outcome = market.outcomes.find(o => 
            o.name.includes(type) || 
            (type === 'Over' && o.name.includes('Over')) || 
            (type === 'Under' && o.name.includes('Under'))
          );
          
          if (!outcome) continue;
          
          // Calculate average odds across all bookmakers for this market/player/line/type
          let totalOdds = 0;
          let count = 0;
          
          for (const bm of data.bookmakers) {
            // Skip the current bookmaker when calculating average
            if (bm.key === bookmaker.key) continue;
            
            // Find matching market
            const m = bm.markets.find(m => 
              m.key === marketKey && 
              'player' in m && 
              m.player === playerName && 
              'line' in m && 
              Math.abs(((m.line as number) || 0) - line) < 0.1
            );
            
            if (!m) continue;
            
            // Find the outcome
            const o = m.outcomes.find(o => 
              o.name.includes(type) || 
              (type === 'Over' && o.name.includes('Over')) || 
              (type === 'Under' && o.name.includes('Under'))
            );
            
            if (!o) continue;
            
            totalOdds += o.price;
            count++;
          }
          
          if (count === 0) continue; // Skip if we can't calculate average
          
          // Calculate average odds
          const averageOdds = totalOdds / count;
          const averageDecimalOdds = americanToDecimal(averageOdds);
          const impliedProbability = decimalToImpliedProbability(averageDecimalOdds);
          
          // Calculate EV
          const decimalOdds = americanToDecimal(outcome.price);
          const ev = calculateEV(impliedProbability, decimalOdds);
          const evPercentage = ev * 100;
          
          // Add to calculations
          calculations.push({
            market: marketKey
              .replace('player_', '')
              .replace('batter_', '')
              .replace('pitcher_', '')
              .replace('_alternate', '')
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' '),
            player: playerName,
            line,
            type,
            sportsbook: bookmaker.key,
            odds: outcome.price,
            decimalOdds,
            averageOdds,
            averageDecimalOdds,
            impliedProbability,
            ev,
            evPercentage
          });
        }
      }
    }
    
    // Sort by EV (highest first)
    const sortedCalculations = calculations.sort((a, b) => b.evPercentage - a.evPercentage);
    setEVCalculations(sortedCalculations);
  };

  // Initial events fetch when sport changes
  useEffect(() => {
    setSelectedEvent(null);
    setEventData(null);
    setEVCalculations([]);
    fetchEvents();
  }, [selectedSport]);

  // Fetch props when event selection changes
  useEffect(() => {
    if (selectedEvent) {
      fetchEventProps();
    } else {
      setEventData(null);
      setEVCalculations([]);
    }
  }, [selectedEvent, marketType]);

  // Handle sport change
  const handleSportChange = (value: string) => {
    setSelectedSport(value);
    setMarketType(markets[value as keyof typeof markets][0].key);
  };

  // Full refresh
  const handleRefresh = () => {
    fetchEvents();
    if (selectedEvent) {
      fetchEventProps();
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Debug Using Existing API Routes</h1>
      
      <div className="flex mb-6 gap-4">
        <Link href="/debug">
          <Button variant="outline">Raw Odds Display</Button>
        </Link>
        <Link href="/debug/ev">
          <Button variant="outline">EV Calculation Debug</Button>
        </Link>
        <Link href="/debug/mlb">
          <Button variant="outline">MLB Debug</Button>
        </Link>
        <Link href="/debug/existing-api">
          <Button variant="outline">Existing API Debug</Button>
        </Link>
      </div>
      
      <Card className="w-full mb-8">
        <CardHeader>
          <div className="flex flex-row items-center justify-between w-full">
            <h2 className="text-xl font-bold">Select Event</h2>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={eventsLoading || propsLoading}
            >
              {eventsLoading || propsLoading ? <Spinner size="sm" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Sport</label>
                <Select
                  value={selectedSport}
                  onValueChange={handleSportChange}
                  disabled={eventsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Sport" />
                  </SelectTrigger>
                  <SelectContent>
                    {sports.map(sport => (
                      <SelectItem key={sport.key} value={sport.key}>{sport.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Market Type</label>
                <Select
                  value={marketType}
                  onValueChange={setMarketType}
                  disabled={!selectedSport || eventsLoading || propsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Market" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedSport && markets[selectedSport as keyof typeof markets]?.map(market => (
                      <SelectItem key={market.key} value={market.key}>{market.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Event</label>
              <Select
                value={selectedEvent || ''}
                onValueChange={setSelectedEvent}
                disabled={eventsLoading || events.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={events.length === 0 ? "No events available" : "Select Event"} />
                </SelectTrigger>
                <SelectContent>
                  {events.map(event => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.home_team} vs {event.away_team} ({new Date(event.commence_time).toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {propsLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-64 text-destructive p-4">
              {error}
            </div>
          ) : !eventData ? (
            <div className="flex justify-center items-center h-64 text-muted-foreground">
              {events.length === 0 ? "No events available" : "Select an event to view data"}
            </div>
          ) : (
            <div className="space-y-8 p-4">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">{eventData.home_team} vs {eventData.away_team}</h3>
                <div className="text-sm text-muted-foreground mb-2">
                  Game Time: {new Date(eventData.commence_time).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Bookmakers: {eventData.bookmakers?.length || 0}
                </div>
              </div>
              
              {evCalculations.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">EV Calculations ({evCalculations.length})</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Player</TableHead>
                        <TableHead>Market</TableHead>
                        <TableHead>Line</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Sportsbook</TableHead>
                        <TableHead>Book Odds</TableHead>
                        <TableHead>Avg Odds</TableHead>
                        <TableHead>Impl. Prob</TableHead>
                        <TableHead>EV%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {evCalculations.map((calc, index) => (
                        <TableRow key={index} className={calc.evPercentage >= 3 ? "bg-muted/50" : ""}>
                          <TableCell>{calc.player}</TableCell>
                          <TableCell>{calc.market}</TableCell>
                          <TableCell>{calc.line}</TableCell>
                          <TableCell>{calc.type}</TableCell>
                          <TableCell>{calc.sportsbook}</TableCell>
                          <TableCell>
                            {formatOdds(calc.odds)} 
                            <span className="text-xs text-muted-foreground ml-1">
                              ({calc.decimalOdds.toFixed(2)})
                            </span>
                          </TableCell>
                          <TableCell>
                            {formatOdds(calc.averageOdds)} 
                            <span className="text-xs text-muted-foreground ml-1">
                              ({calc.averageDecimalOdds.toFixed(2)})
                            </span>
                          </TableCell>
                          <TableCell>{(calc.impliedProbability * 100).toFixed(2)}%</TableCell>
                          <TableCell>{formatEV(calc.evPercentage)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex justify-center items-center h-32 text-muted-foreground">
                  No EV calculations available for this event/market combination.
                </div>
              )}
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Available Markets</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {eventData.bookmakers && eventData.bookmakers.flatMap(bm => 
                    bm.markets.map(m => m.key)
                  ).filter((value, index, self) => self.indexOf(value) === index)
                    .map(marketKey => (
                      <div key={marketKey} className="p-3 border rounded-md">
                        <p className="font-medium">{marketKey}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {lastUpdated ? `Last updated: ${lastUpdated}` : 'No data loaded yet'}
          </div>
          <div className="text-sm text-muted-foreground">
            Using existing API routes: /api/events and /api/events/{selectedEvent}/props
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 