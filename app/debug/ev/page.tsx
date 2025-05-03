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
import Link from 'next/link';

interface DebugEVCalculation {
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

interface DebugEVData {
  event: {
    id: string;
    home_team: string;
    away_team: string;
    commence_time: string;
  };
  calculations: DebugEVCalculation[];
  calculationsCount: number;
  bookmakerCount: number;
}

export default function DebugEVPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DebugEVData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

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

  // Fetch EV calculation data
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/debug/ev');
      
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.status}`);
      }
      
      const data = await response.json();
      setData(data);
      setLastUpdated(new Date().toLocaleString());
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error fetching EV data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">EV Calculation Debug</h1>

      <div className="flex mb-6 gap-4">
        <Link href="/debug">
          <Button variant="outline">Raw Odds Display</Button>
        </Link>
        <Link href="/debug/ev">
          <Button variant="outline">EV Calculation Debug</Button>
        </Link>
      </div>

      <Card className="w-full mb-8">
        <CardHeader className="space-y-4">
          <div className="flex flex-row items-center justify-between w-full">
            <h2 className="text-xl font-bold">EV Calculation Breakdown</h2>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchData}
              disabled={loading}
            >
              {loading ? <Spinner size="sm" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
          
          {data?.event && (
            <div>
              <h3 className="text-lg font-semibold">{data.event.home_team} vs {data.event.away_team}</h3>
              <p className="text-sm text-muted-foreground">
                Game Time: {new Date(data.event.commence_time).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Bookmakers: {data.bookmakerCount}, Calculations: {data.calculationsCount}
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
          ) : !data || data.calculations.length === 0 ? (
            <div className="flex justify-center items-center h-64 text-muted-foreground">
              No EV calculations available.
            </div>
          ) : (
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
                {data.calculations.map((calc, index) => (
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
          )}
        </CardContent>

        <CardFooter className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {lastUpdated ? `Last updated: ${lastUpdated}` : 'Loading...'}
          </div>
          <div className="text-sm text-muted-foreground">
            EV Formula: (trueProbability * (decimalOdds - 1)) - (1 - trueProbability)
          </div>
        </CardFooter>
      </Card>
      
      <div className="space-y-4 p-4 border rounded-md mb-8">
        <h3 className="text-lg font-semibold">How EV Is Calculated</h3>
        <div className="space-y-2">
          <p><strong>1. Convert American odds to decimal odds</strong></p>
          <pre className="p-2 bg-muted rounded-md">
            {`function americanToDecimal(americanOdds) {
  if (americanOdds > 0) {
    return (americanOdds / 100) + 1;
  } else {
    return (100 / Math.abs(americanOdds)) + 1;
  }
}`}
          </pre>
          
          <p><strong>2. Convert decimal odds to implied probability</strong></p>
          <pre className="p-2 bg-muted rounded-md">
            {`function decimalToImpliedProbability(decimalOdds) {
  return 1 / decimalOdds;
}`}
          </pre>
          
          <p><strong>3. Calculate EV% using implied probability and decimal odds</strong></p>
          <pre className="p-2 bg-muted rounded-md">
            {`function calculateEV(trueProbability, decimalOdds) {
  return (trueProbability * (decimalOdds - 1)) - (1 - trueProbability);
}`}
          </pre>
          
          <p className="text-muted-foreground">
            For our EV calculation, we use the average odds across all sportsbooks as the &quot;true probability&quot; 
            baseline. This allows us to identify when a particular sportsbook is offering better odds than the 
            market average, which represents a potential +EV opportunity.
          </p>
        </div>
      </div>
    </div>
  );
} 