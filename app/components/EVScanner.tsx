'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { SportMarket, getMarketsForSport } from '@/lib/constants/markets';
import { sportsbooks } from '@/data/sportsbooks';
import { EVBet } from '@/lib/ev-calculator';
import { ChevronDown, Search, RefreshCw, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EVScannerProps {
  defaultSport?: string;
  defaultMinEV?: number;
}

export default function EVScanner({ 
  defaultSport = 'baseball_mlb',
  defaultMinEV = 0 // Temporarily set to 0% to see all positive EV bets
}: EVScannerProps) {
  // State
  const [sport, setSport] = useState(defaultSport);
  const [minEV, setMinEV] = useState(defaultMinEV);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [selectedSportsbooks, setSelectedSportsbooks] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EVBet[]>([]);
  const [filteredData, setFilteredData] = useState<EVBet[]>([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Default to MLB only and hide sport selection since we're focusing on MLB
  const sportOptions = [
    { key: 'baseball_mlb', label: 'MLB' }
  ];

  // Market options for MLB
  const getMarketOptions = () => {
    switch (sport) {
      case 'baseball_mlb':
        return [
          { key: 'player_total_runs_batted_in', label: 'Player RBIs' },
          { key: 'player_total_hits', label: 'Player Hits' },
          { key: 'player_total_home_runs', label: 'Player Home Runs' },
          { key: 'player_total_bases', label: 'Player Total Bases' },
          { key: 'player_total_strikeouts', label: 'Player Strikeouts' }
        ];
      default:
        return [];
    }
  };

  // Market options based on selected sport
  const markets = getMarketsForSport(sport);

  // Active sportsbooks
  const activeSportsbooks = sportsbooks.filter(book => book.isActive);

  // Load data
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build URL with query parameters
      const url = new URL('/api/ev-scanner', window.location.origin);
      
      // Add params
      url.searchParams.append('sport', sport);
      url.searchParams.append('minEV', minEV.toString());
      
      if (selectedMarkets.length > 0) {
        url.searchParams.append('markets', selectedMarkets.join(','));
      }
      
      if (selectedSportsbooks.length > 0) {
        url.searchParams.append('bookmakers', selectedSportsbooks.join(','));
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error fetching EV data: ${response.status}`);
      }
      
      const jsonData = await response.json();
      setData(jsonData);
      setLastUpdated(new Date().toLocaleString());
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error fetching EV data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on search query
  useEffect(() => {
    if (data.length === 0) {
      setFilteredData([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    
    if (!query) {
      setFilteredData(data);
      return;
    }

    const filtered = data.filter(bet => 
      bet.player.toLowerCase().includes(query) ||
      bet.market.toLowerCase().includes(query) ||
      bet.matchup.toLowerCase().includes(query) ||
      bet.sportsbook.toLowerCase().includes(query)
    );

    setFilteredData(filtered);
  }, [data, searchQuery]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [sport, minEV, selectedMarkets, selectedSportsbooks]);

  // Pagination
  const pages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Format odds for display
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

  // Format time for display
  const formatTime = (isoTime: string) => {
    const date = new Date(isoTime);
    return date.toLocaleString();
  };

  // Toggle market selection
  const toggleMarket = (marketKey: string) => {
    if (selectedMarkets.includes(marketKey)) {
      setSelectedMarkets(selectedMarkets.filter(m => m !== marketKey));
    } else {
      setSelectedMarkets([...selectedMarkets, marketKey]);
    }
  };

  // Toggle sportsbook selection
  const toggleSportsbook = (bookId: string) => {
    if (selectedSportsbooks.includes(bookId)) {
      setSelectedSportsbooks(selectedSportsbooks.filter(b => b !== bookId));
    } else {
      setSelectedSportsbooks([...selectedSportsbooks, bookId]);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-4">
        <div className="flex flex-row items-center justify-between w-full">
          <h2 className="text-xl font-bold">EV Betting Scanner</h2>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            disabled={loading}
          >
            {loading ? <Spinner size="sm" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 w-full">
          {/* Sport Selection */}
          <Select 
            value={sport} 
            onValueChange={setSport}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Sport" />
            </SelectTrigger>
            <SelectContent>
              {sportOptions.map((option) => (
                <SelectItem key={option.key} value={option.key}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Min EV Threshold */}
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              placeholder="Min EV%"
              value={minEV.toString()}
              onChange={(e: ChangeEvent<HTMLInputElement>) => 
                setMinEV(Number(e.target.value))
              }
              className="w-full"
              min={0}
              step={0.5}
            />
          </div>

          {/* Market Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {selectedMarkets.length ? `${selectedMarkets.length} Markets` : 'All Markets'}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 max-h-[300px] overflow-y-auto">
              {getMarketOptions().map((market) => (
                <DropdownMenuCheckboxItem
                  key={market.key}
                  checked={selectedMarkets.includes(market.key)}
                  onCheckedChange={() => toggleMarket(market.key)}
                >
                  {market.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sportsbook Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {selectedSportsbooks.length ? `${selectedSportsbooks.length} Books` : 'All Sportsbooks'}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 max-h-[300px] overflow-y-auto">
              {activeSportsbooks.filter(book => book.id !== 'pinnacle').map((book) => (
                <DropdownMenuCheckboxItem
                  key={book.id}
                  checked={selectedSportsbooks.includes(book.id)}
                  onCheckedChange={() => toggleSportsbook(book.id)}
                >
                  {book.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search Box */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by player, market, match-up..."
            value={searchQuery}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
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
        ) : paginatedData.length === 0 ? (
          <div className="flex justify-center items-center h-64 text-muted-foreground">
            No EV betting opportunities found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>EV %</TableHead>
                <TableHead>Market</TableHead>
                <TableHead>Player Line</TableHead>
                <TableHead>Sportsbook</TableHead>
                <TableHead>Odds</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    Average Odds
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The arithmetic mean of odds offered across all tracked sportsbooks (excluding Pinnacle). Used as the baseline for EV calculations.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableHead>
                <TableHead>True Prob %</TableHead>
                <TableHead>Game / Matchup</TableHead>
                <TableHead>Game Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((bet, index) => (
                <TableRow key={`${bet.player}-${bet.market}-${bet.line}-${bet.sportsbook}-${index}`}>
                  <TableCell>{formatEV(bet.ev)}</TableCell>
                  <TableCell>{bet.market}</TableCell>
                  <TableCell>{`${bet.player} ${bet.type} ${bet.line}`}</TableCell>
                  <TableCell>{bet.sportsbookName}</TableCell>
                  <TableCell>{formatOdds(bet.odds)}</TableCell>
                  <TableCell>
                    {formatOdds(bet.averageOdds)}
                  </TableCell>
                  <TableCell>{(bet.trueProbability * 100).toFixed(2)}%</TableCell>
                  <TableCell>{bet.matchup}</TableCell>
                  <TableCell>{formatTime(bet.gameTime)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        
        {pages > 1 && (
          <div className="flex justify-center py-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  {page > 1 ? (
                    <PaginationPrevious 
                      onClick={() => setPage(page => Math.max(1, page - 1))}
                    />
                  ) : (
                    <span className="flex h-9 items-center gap-1 px-4 opacity-50">
                      <ChevronDown className="h-4 w-4 rotate-90" />
                      Previous
                    </span>
                  )}
                </PaginationItem>
                <PaginationItem>
                  <span className="mx-4 flex items-center text-sm">
                    Page {page} of {pages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  {page < pages ? (
                    <PaginationNext 
                      onClick={() => setPage(page => Math.min(pages, page + 1))}
                    />
                  ) : (
                    <span className="flex h-9 items-center gap-1 px-4 opacity-50">
                      Next
                      <ChevronDown className="h-4 w-4 -rotate-90" />
                    </span>
                  )}
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {lastUpdated ? `Last updated: ${lastUpdated}` : 'Loading...'}
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {filteredData.length} opportunities
        </div>
      </CardFooter>
    </Card>
  );
} 