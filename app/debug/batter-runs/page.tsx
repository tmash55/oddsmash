'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";

interface PlayerLine {
  player: string;
  line: number;
  type: 'Over' | 'Under';
  odds: number;
  sportsbook: string;
}

interface BatterRunsResponse {
  event: {
    id: string;
    home_team: string;
    away_team: string;
    commence_time: string;
  };
  marketKey: string;
  bookmakerCount: number;
  playerCount: number;
  playerData: Record<string, PlayerLine[]>;
}

export default function BatterRunsDebug() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BatterRunsResponse | null>(null);
  
  // Format odds for display
  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : odds.toString();
  };
  
  // Function to fetch the API data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/debug/batter-runs');
      
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.status}`);
      }
      
      const jsonData = await response.json();
      setData(jsonData);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error fetching debug data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);
  
  return (
    <div className="container mx-auto py-8">
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Batter Runs Scored Debug</h1>
            <Button onClick={fetchData} disabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        
        {data?.event && (
          <div className="px-6 py-2 bg-muted/50">
            <h2 className="text-lg font-medium">
              {data.event.home_team} vs {data.event.away_team}
            </h2>
            <p className="text-sm text-muted-foreground">
              Game Time: {new Date(data.event.commence_time).toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">
              Market: {data.marketKey} | Bookmakers: {data.bookmakerCount} | Players: {data.playerCount}
            </p>
          </div>
        )}
        
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-64 text-destructive p-4">
              {error}
            </div>
          ) : !data ? (
            <div className="flex justify-center items-center h-64 text-muted-foreground p-4">
              No data available
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Line</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Sportsbook</TableHead>
                    <TableHead>Odds</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(data.playerData).map(([player, lines]) => 
                    lines.map((line, index) => (
                      <TableRow key={`${player}-${line.sportsbook}-${line.type}-${index}`}>
                        <TableCell>{player}</TableCell>
                        <TableCell>{line.line}</TableCell>
                        <TableCell>
                          <Badge variant={line.type === 'Over' ? 'default' : 'secondary'}>
                            {line.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{line.sportsbook}</TableCell>
                        <TableCell>{formatOdds(line.odds)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between text-sm text-muted-foreground">
          <div>
            {data 
              ? `Showing ${Object.keys(data.playerData).length} players from ${data.bookmakerCount} bookmakers` 
              : 'No data loaded'}
          </div>
          <div>
            {data ? `Last update: ${new Date().toLocaleString()}` : ''}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 