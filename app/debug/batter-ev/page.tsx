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
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  bookmakerCount: number;
  comparedBooks: string[];
}

interface BatterEVResponse {
  event: {
    id: string;
    home_team: string;
    away_team: string;
    commence_time: string;
    sport: string;
  };
  marketKey: string;
  calculations: EVCalculation[];
  calculationsCount: number;
  bookmakerCount: number;
}

export default function BatterEVDebug() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BatterEVResponse | null>(null);
  const [filter, setFilter] = useState('');
  const [evThreshold, setEvThreshold] = useState(0);
  const [sortBy, setSortBy] = useState<keyof EVCalculation>('evPercentage');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Format odds for display
  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : odds.toString();
  };
  
  // Function to fetch the API data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/debug/batter-ev');
      
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
  
  // Filter and sort calculations
  const filteredCalculations = data?.calculations
    .filter(calc => 
      calc.evPercentage >= evThreshold &&
      (filter === '' || 
        calc.player.toLowerCase().includes(filter.toLowerCase()) ||
        calc.sportsbook.toLowerCase().includes(filter.toLowerCase()))
    )
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    }) || [];
  
  // Toggle sort order
  const toggleSort = (column: keyof EVCalculation) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Batter Runs Scored EV Debug</h1>
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
              Market: {data.marketKey} | Bookmakers: {data.bookmakerCount} | Total EV Calculations: {data.calculationsCount}
            </p>
          </div>
        )}
        
        <div className="p-4 flex flex-wrap gap-4">
          <div className="w-full md:w-64">
            <Input
              placeholder="Filter by player or sportsbook"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <Select
              value={evThreshold.toString()}
              onValueChange={(value) => setEvThreshold(parseFloat(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Min EV%" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All</SelectItem>
                <SelectItem value="1">1%+</SelectItem>
                <SelectItem value="2">2%+</SelectItem>
                <SelectItem value="3">3%+</SelectItem>
                <SelectItem value="5">5%+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
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
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('player')}>
                      Player {sortBy === 'player' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('line')}>
                      Line {sortBy === 'line' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('type')}>
                      Type {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('sportsbook')}>
                      Sportsbook {sortBy === 'sportsbook' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('odds')}>
                      Odds {sortBy === 'odds' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('averageOdds')}>
                      Avg Odds {sortBy === 'averageOdds' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('evPercentage')}>
                      EV% {sortBy === 'evPercentage' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead>Books Compared</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCalculations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        No calculations found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCalculations.map((calc, index) => (
                      <TableRow key={`${calc.player}-${calc.sportsbook}-${calc.type}-${index}`}>
                        <TableCell>{calc.player}</TableCell>
                        <TableCell>{calc.line}</TableCell>
                        <TableCell>
                          <Badge variant={calc.type === 'Over' ? 'default' : 'secondary'}>
                            {calc.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{calc.sportsbook}</TableCell>
                        <TableCell>{formatOdds(calc.odds)}</TableCell>
                        <TableCell>{formatOdds(calc.averageOdds)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              calc.evPercentage >= 5 ? 'default' : 
                              calc.evPercentage >= 3 ? 'secondary' : 
                              calc.evPercentage >= 1 ? 'outline' : 
                              'outline'
                            }
                          >
                            {calc.evPercentage.toFixed(2)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {calc.comparedBooks.join(', ')}
                        </TableCell>
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
            {data && filteredCalculations.length > 0
              ? `Showing ${filteredCalculations.length} of ${data.calculationsCount} calculations` 
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