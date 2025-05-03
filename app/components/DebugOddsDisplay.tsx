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
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { RefreshCw } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { americanToDecimal, decimalToImpliedProbability, calculateEV } from '@/lib/ev-calculator';

interface Outcome {
  name: string;
  price: number;
}

interface Market {
  key: string;
  player?: string;
  line?: number;
  outcomes: Outcome[];
}

interface Bookmaker {
  key: string;
  title: string;
  markets: Market[];
}

interface EventData {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  bookmakers: Bookmaker[];
}

export default function DebugOddsDisplay() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [markets, setMarkets] = useState<string[]>(['player_points', 'player_rebounds', 'player_assists']);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Function to format American odds
  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : odds.toString();
  };

  // Fetch data from a single NBA game
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/debug/odds');
      
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.status}`);
      }
      
      const data = await response.json();
      setEventData(data);
      setLastUpdated(new Date().toLocaleString());
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error fetching odds data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate average odds across all sportsbooks for a market/player/line/type
  const calculateAverageOdds = (
    marketKey: string,
    playerName: string,
    line: number,
    type: 'Over' | 'Under'
  ): { averageOdds: number, impliedProbability: number } => {
    if (!eventData || !eventData.bookmakers) return { averageOdds: 0, impliedProbability: 0 };
    
    let totalOdds = 0;
    let count = 0;
    
    for (const bookmaker of eventData.bookmakers) {
      // Find matching market
      const market = bookmaker.markets.find(m => 
        m.key === marketKey && 
        m.player === playerName && 
        Math.abs((m.line || 0) - line) < 0.1
      );
      
      if (!market) continue;
      
      // Find the outcome (Over/Under)
      const outcome = market.outcomes.find(o => 
        o.name.includes(type) || 
        (type === 'Over' && o.name.includes('Over')) || 
        (type === 'Under' && o.name.includes('Under'))
      );
      
      if (!outcome) continue;
      
      totalOdds += outcome.price;
      count++;
    }
    
    if (count === 0) return { averageOdds: 0, impliedProbability: 0 };
    
    const averageOdds = totalOdds / count;
    const decimalOdds = americanToDecimal(averageOdds);
    const impliedProbability = decimalToImpliedProbability(decimalOdds);
    
    return { averageOdds, impliedProbability };
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

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader className="space-y-4">
        <div className="flex flex-row items-center justify-between w-full">
          <h2 className="text-xl font-bold">Debug Odds Display</h2>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            disabled={loading}
          >
            {loading ? <Spinner size="sm" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
        
        {eventData && (
          <div>
            <h3 className="text-lg font-semibold">{eventData.home_team} vs {eventData.away_team}</h3>
            <p className="text-sm text-muted-foreground">
              Game Time: {new Date(eventData.commence_time).toLocaleString()}
            </p>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64 text-destructive">
            {error}
          </div>
        ) : !eventData ? (
          <div className="flex justify-center items-center h-64 text-muted-foreground">
            No data available.
          </div>
        ) : (
          <div className="space-y-8 p-4">
            {markets.map(marketKey => {
              const marketsData: { 
                [player: string]: { 
                  [line: string]: { 
                    books: { 
                      [book: string]: { 
                        line: number, 
                        over: number, 
                        under: number 
                      } 
                    },
                    averageOver: number,
                    overImpliedProb: number,
                    averageUnder: number,
                    underImpliedProb: number
                  } 
                } 
              } = {};
              
              // Process event data for this market
              eventData.bookmakers.forEach(bookmaker => {
                bookmaker.markets.forEach(market => {
                  if (market.key === marketKey && market.player && market.line) {
                    const lineKey = market.line.toString();
                    
                    if (!marketsData[market.player]) {
                      marketsData[market.player] = {};
                    }
                    
                    if (!marketsData[market.player][lineKey]) {
                      // Get average odds for this market/player/line
                      const { averageOdds: avgOver, impliedProbability: overProb } = 
                        calculateAverageOdds(marketKey, market.player, market.line, 'Over');
                      
                      const { averageOdds: avgUnder, impliedProbability: underProb } = 
                        calculateAverageOdds(marketKey, market.player, market.line, 'Under');
                      
                      marketsData[market.player][lineKey] = {
                        books: {},
                        averageOver: avgOver,
                        overImpliedProb: overProb,
                        averageUnder: avgUnder,
                        underImpliedProb: underProb
                      };
                    }
                    
                    const overOutcome = market.outcomes.find(o => o.name.includes('Over'));
                    const underOutcome = market.outcomes.find(o => o.name.includes('Under'));
                    
                    if (overOutcome && underOutcome) {
                      marketsData[market.player][lineKey].books[bookmaker.key] = {
                        line: market.line,
                        over: overOutcome.price,
                        under: underOutcome.price
                      };
                    }
                  }
                });
              });
              
              // Only render if we have data for this market
              if (Object.keys(marketsData).length === 0) {
                return null;
              }
              
              // Get clean market name
              const marketName = marketKey
                .replace('player_', '')
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
              
              return (
                <div key={marketKey}>
                  <h3 className="text-lg font-semibold mb-4">{marketName}</h3>
                  {Object.entries(marketsData).map(([player, lines]) => (
                    <div key={`${marketKey}-${player}`} className="mb-8">
                      <h4 className="text-md font-medium mb-2">{player}</h4>
                      {Object.entries(lines).map(([lineKey, lineData]) => {
                        const line = parseFloat(lineKey);
                        return (
                          <div key={`${marketKey}-${player}-${lineKey}`} className="mb-6 border rounded-md">
                            <div className="p-3 bg-muted text-sm font-medium">
                              Line: {line}
                              <div className="flex gap-8 mt-2">
                                <div>
                                  <div className="text-xs">Average Over: {formatOdds(lineData.averageOver)}</div>
                                  <div className="text-xs">Implied Prob: {(lineData.overImpliedProb * 100).toFixed(2)}%</div>
                                </div>
                                <div>
                                  <div className="text-xs">Average Under: {formatOdds(lineData.averageUnder)}</div>
                                  <div className="text-xs">Implied Prob: {(lineData.underImpliedProb * 100).toFixed(2)}%</div>
                                </div>
                              </div>
                            </div>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Sportsbook</TableHead>
                                  <TableHead>Over</TableHead>
                                  <TableHead>EV%</TableHead>
                                  <TableHead>Under</TableHead>
                                  <TableHead>EV%</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {Object.entries(lineData.books).map(([bookKey, odds]) => {
                                  // Calculate EV for both Over and Under bets
                                  const overDecimalOdds = americanToDecimal(odds.over);
                                  const underDecimalOdds = americanToDecimal(odds.under);
                                  
                                  const overEV = lineData.overImpliedProb > 0 
                                    ? calculateEV(lineData.overImpliedProb, overDecimalOdds) * 100
                                    : 0;
                                    
                                  const underEV = lineData.underImpliedProb > 0
                                    ? calculateEV(lineData.underImpliedProb, underDecimalOdds) * 100
                                    : 0;
                                  
                                  return (
                                    <TableRow key={bookKey}>
                                      <TableCell>{bookKey}</TableCell>
                                      <TableCell>{formatOdds(odds.over)}</TableCell>
                                      <TableCell>{formatEV(overEV)}</TableCell>
                                      <TableCell>{formatOdds(odds.under)}</TableCell>
                                      <TableCell>{formatEV(underEV)}</TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {lastUpdated ? `Last updated: ${lastUpdated}` : 'Loading...'}
        </div>
        <div className="text-sm text-muted-foreground">
          Tracking {markets.length} markets for debugging
        </div>
      </CardFooter>
    </Card>
  );
} 