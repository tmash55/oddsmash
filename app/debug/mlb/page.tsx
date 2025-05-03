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
import { SPORT_MARKETS } from '@/lib/constants/markets';
import Link from 'next/link';

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

interface APIResponse {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  bookmakers: Bookmaker[];
  meta?: {
    sport: string;
    markets_used: string[];
    market_counts: Record<string, number>;
  };
}

export default function MLBDebugPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<APIResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [availableMarkets, setAvailableMarkets] = useState<string[]>([]);

  // Function to format American odds
  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : odds.toString();
  };

  // Fetch odds data
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/debug/odds');
      
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.status}`);
      }
      
      const data = await response.json();
      setData(data);
      
      // Extract unique market keys
      if (data.bookmakers) {
        const marketKeys = new Set<string>();
        data.bookmakers.forEach((bookmaker: Bookmaker) => {
          bookmaker.markets.forEach(market => {
            marketKeys.add(market.key);
          });
        });
        setAvailableMarkets(Array.from(marketKeys));
      }
      
      setLastUpdated(new Date().toLocaleString());
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error fetching MLB data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Get all available MLB markets from our constants
  const getAllMlbMarkets = () => {
    const mlbMarkets = SPORT_MARKETS.baseball_mlb || [];
    return mlbMarkets.map(market => ({
      value: market.value,
      label: market.label,
      apiKey: market.apiKey,
      alternate: market.alternateKey
    }));
  };

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">MLB Debug Page</h1>
      
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
      </div>
      
      <Card className="w-full mb-8">
        <CardHeader className="space-y-4">
          <div className="flex flex-row items-center justify-between w-full">
            <h2 className="text-xl font-bold">MLB Odds Data</h2>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchData}
              disabled={loading}
            >
              {loading ? <Spinner size="sm" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
          
          {data && (
            <div>
              <h3 className="text-lg font-semibold">{data.home_team} vs {data.away_team}</h3>
              <p className="text-sm text-muted-foreground">
                Game Time: {new Date(data.commence_time).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Bookmakers: {data.bookmakers?.length || 0}
              </p>
              {data.meta && (
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>Sport: {data.meta.sport}</p>
                  <p>Markets used: {data.meta.markets_used.join(', ')}</p>
                  <p>Market counts: {JSON.stringify(data.meta.market_counts)}</p>
                </div>
              )}
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
          ) : !data ? (
            <div className="flex justify-center items-center h-64 text-muted-foreground">
              No data available.
            </div>
          ) : (
            <div className="space-y-8 p-4">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Available Markets</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableMarkets.map(marketKey => (
                    <div key={marketKey} className="p-3 border rounded-md">
                      <p className="font-medium">{marketKey}</p>
                      <p className="text-sm text-muted-foreground">
                        Count: {data.meta?.market_counts[marketKey] || 0}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              
              {availableMarkets.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold mb-4">Player Markets</h3>
                  {data.bookmakers.map(bookmaker => (
                    <div key={bookmaker.key} className="mb-8 border rounded-md">
                      <div className="p-3 bg-muted">
                        <h4 className="font-medium">{bookmaker.title} ({bookmaker.key})</h4>
                      </div>
                      <div className="p-3">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Market</TableHead>
                              <TableHead>Player</TableHead>
                              <TableHead>Line</TableHead>
                              <TableHead>Over</TableHead>
                              <TableHead>Under</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bookmaker.markets
                              .filter(market => 'player' in market || market.key.includes('pitcher_') || market.key.includes('batter_'))
                              .map((market, index) => {
                                const overOutcome = market.outcomes.find(o => o.name.includes('Over') || o.name.includes('over'));
                                const underOutcome = market.outcomes.find(o => o.name.includes('Under') || o.name.includes('under'));
                                
                                return (
                                  <TableRow key={`${bookmaker.key}-${market.key}-${index}`}>
                                    <TableCell>{market.key}</TableCell>
                                    <TableCell>{market.player || '—'}</TableCell>
                                    <TableCell>{market.line || '—'}</TableCell>
                                    <TableCell>
                                      {overOutcome 
                                        ? formatOdds(overOutcome.price) 
                                        : '—'}
                                    </TableCell>
                                    <TableCell>
                                      {underOutcome 
                                        ? formatOdds(underOutcome.price) 
                                        : '—'}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">All Defined MLB Markets</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Label</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>API Key</TableHead>
                      <TableHead>Alternate Key</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getAllMlbMarkets().map(market => (
                      <TableRow key={market.value}>
                        <TableCell>{market.label}</TableCell>
                        <TableCell>{market.value}</TableCell>
                        <TableCell>{market.apiKey}</TableCell>
                        <TableCell>{market.alternate || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {lastUpdated ? `Last updated: ${lastUpdated}` : 'Loading...'}
          </div>
          <div className="text-sm text-muted-foreground">
            API key errors? Check your API key and subscription level
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 