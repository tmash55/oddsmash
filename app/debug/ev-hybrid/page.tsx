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
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { sportsbooks } from '@/data/sportsbooks';
import Image from 'next/image';

interface EVCalculation {
  market: string;
  player: string;
  line: number;
  type: 'Over' | 'Under';
  sportsbook: string;
  odds: number;
  decimalOdds: number;
  baselineSource: 'pinnacle' | 'average' | 'no-vig';
  baselineOdds: number;
  baselineDecimalOdds: number;
  impliedProbability: number;
  noVigProbability?: number;
  ev: number;
  evPercentage: number;
  bookmakerCount: number;
  comparedBooks: string[];
  hasVig?: number;
}

interface HybridEVResponse {
  event: {
    id: string;
    home_team: string;
    away_team: string;
    commence_time: string;
    sport: string;
  };
  marketKey: string;
  pinnacleAvailable: boolean;
  pinnacleCalculations: number;
  averageCalculations: number;
  calculations: EVCalculation[];
  calculationsCount: number;
  bookmakerCount: number;
}

interface RawOdd {
  sportsbook: string;
  sportsbookTitle: string;
  odds: number;
  line: number;
}

interface RawOddsResponse {
  player: string;
  line: number;
  type: string;
  marketKey: string;
  eventId: string;
  odds: RawOdd[];
  bookmakerCount: number;
}

export default function HybridEVDebug() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HybridEVResponse | null>(null);
  const [filter, setFilter] = useState('');
  const [evThreshold, setEvThreshold] = useState(0);
  const [maxOdds, setMaxOdds] = useState<number | null>(200);
  const [baselineFilter, setBaselineFilter] = useState<'all' | 'pinnacle' | 'average' | 'no-vig'>('all');
  const [sportsbookFilter, setSportsbookFilter] = useState<string>('all');
  const [marketFilter, setMarketFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<keyof EVCalculation>('evPercentage');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [rawOddsData, setRawOddsData] = useState<Record<string, RawOddsResponse>>({});
  const [loadingRawOdds, setLoadingRawOdds] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Format odds for display
  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : odds.toString();
  };
  
  // Function to fetch the API data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/debug/ev-hybrid');
      
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
  
  // Group calculations by player and line to find highest EV per player/line
  const getHighestEVBets = (calculations: EVCalculation[]) => {
    // First filter by max odds if set
    const oddsFiltered = maxOdds 
      ? calculations.filter(calc => calc.odds <= maxOdds)
      : calculations;
      
    // Group by player + line + type
    const groupedByPlayer: Record<string, EVCalculation[]> = {};
    
    oddsFiltered.forEach(calc => {
      const key = `${calc.player}|${calc.line}|${calc.type}`;
      if (!groupedByPlayer[key]) {
        groupedByPlayer[key] = [];
      }
      groupedByPlayer[key].push(calc);
    });
    
    // For each group, get highest EV calculations
    const highestEVPerPlayer: EVCalculation[] = [];
    
    Object.values(groupedByPlayer).forEach(group => {
      // Sort by EV (highest first)
      const sortedGroup = [...group].sort((a, b) => b.evPercentage - a.evPercentage);
      
      // Get highest EV
      const highestEV = sortedGroup[0].evPercentage;
      
      // Get all bets with this EV (could be multiple sportsbooks with same highest EV)
      const highestEVBets = sortedGroup.filter(calc => 
        Math.abs(calc.evPercentage - highestEV) < 0.01 // Allow for tiny float differences
      );
      
      // Add to result
      highestEVPerPlayer.push(...highestEVBets);
    });
    
    return highestEVPerPlayer;
  };

  // Get all available markets from the data
  const uniqueMarkets = data?.calculations 
    ? ['all', ...Array.from(new Set(data.calculations.map(calc => calc.market)))]
    : ['all'];

  // Get highest EV bets and handle pagination
  const paginatedCalculations = () => {
    const filtered = data?.calculations
      ? getHighestEVBets(data.calculations.filter(calc => 
          calc.evPercentage >= evThreshold &&
          (filter === '' || 
            calc.player.toLowerCase().includes(filter.toLowerCase()) ||
            calc.sportsbook.toLowerCase().includes(filter.toLowerCase())) &&
          (baselineFilter === 'all' || calc.baselineSource === baselineFilter) &&
          (sportsbookFilter === 'all' || calc.sportsbook === sportsbookFilter) &&
          (marketFilter === 'all' || calc.market === marketFilter)
        ))
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
        })
      : [];
      
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return {
      items: filtered.slice(startIndex, endIndex),
      totalItems: filtered.length,
      totalPages: Math.ceil(filtered.length / itemsPerPage)
    };
  };
  
  // Get unique sportsbooks from the data
  const uniqueSportsbooks = data?.calculations 
    ? ['all', ...Array.from(new Set(data.calculations.map(calc => calc.sportsbook)))]
    : ['all'];
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, evThreshold, maxOdds, baselineFilter, sportsbookFilter, marketFilter, sortBy, sortOrder]);
  
  const { items: filteredCalculations, totalItems, totalPages } = paginatedCalculations();
  
  // Toggle sort order
  const toggleSort = (column: keyof EVCalculation) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };
  
  // Toggle row expansion
  const toggleRowExpansion = (rowId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  };
  
  // Function to fetch raw odds
  const fetchRawOdds = async (player: string, line: number, type: string, rowId: string) => {
    if (rawOddsData[rowId]) {
      // Toggle visibility if already fetched
      setRawOddsData(prev => {
        const newData = {...prev};
        delete newData[rowId];
        return newData;
      });
      return;
    }
    
    setLoadingRawOdds(prev => ({
      ...prev,
      [rowId]: true
    }));
    
    try {
      const eventId = data?.event?.id;
      const marketKey = data?.marketKey;
      
      const url = `/api/debug/raw-odds?player=${encodeURIComponent(player)}&line=${line}&type=${type}` + 
                  (eventId ? `&eventId=${eventId}` : '') +
                  (marketKey ? `&marketKey=${marketKey}` : '');
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error fetching raw odds: ${response.status}`);
      }
      
      const jsonData = await response.json();
      
      setRawOddsData(prev => ({
        ...prev,
        [rowId]: jsonData
      }));
      
    } catch (err) {
      console.error('Error fetching raw odds:', err);
    } finally {
      setLoadingRawOdds(prev => ({
        ...prev,
        [rowId]: false
      }));
    }
  };
  
  // Get sportsbook logo/icon
  const getSportsbookLogo = (bookId: string) => {
    const sportsbookData = sportsbooks.find(book => book.id.toLowerCase() === bookId.toLowerCase());
    return sportsbookData?.logo || "/images/sports-books/default.png";
  };
  
  // Get sportsbook name
  const getSportsbookName = (bookId: string) => {
    const sportsbookData = sportsbooks.find(book => book.id.toLowerCase() === bookId.toLowerCase());
    return sportsbookData?.name || bookId;
  };
  
  return (
    <div className="container mx-auto py-8">
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">EV Scanner</h2>
              <Button onClick={fetchData} disabled={loading}>
                {loading ? <Spinner className="mr-2" size="sm" /> : null}
                Refresh Data
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="w-full md:w-auto flex-1">
                <Input
                  placeholder="Filter by player or sportsbook..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="w-full md:w-auto">
                <Select
                  value={baselineFilter}
                  onValueChange={(value) => setBaselineFilter(value as any)}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Baseline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Baselines</SelectItem>
                    <SelectItem value="pinnacle">Pinnacle</SelectItem>
                    <SelectItem value="average">Average</SelectItem>
                    <SelectItem value="no-vig">No-Vig</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full md:w-auto">
                <Select
                  value={sportsbookFilter}
                  onValueChange={(value) => setSportsbookFilter(value)}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Sportsbook" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueSportsbooks.map(book => (
                      <SelectItem key={book} value={book}>
                        {book === 'all' ? 'All Sportsbooks' : getSportsbookName(book)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full md:w-auto">
                <Select
                  value={marketFilter}
                  onValueChange={(value) => setMarketFilter(value)}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Market Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueMarkets.map(market => (
                      <SelectItem key={market} value={market}>
                        {market === 'all' ? 'All Markets' : market}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full md:w-auto flex flex-col">
                <Input
                  type="number"
                  placeholder="Min EV %"
                  value={evThreshold}
                  onChange={(e) => setEvThreshold(parseFloat(e.target.value) || 0)}
                  className="w-full md:w-[120px]"
                />
              </div>
              
              <div className="w-full md:w-auto flex flex-col">
                <Input
                  type="number"
                  placeholder="Max American Odds"
                  value={maxOdds !== null ? maxOdds : ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? null : parseFloat(e.target.value);
                    setMaxOdds(value);
                  }}
                  className="w-full md:w-[150px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        
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
                    <TableHead className="cursor-pointer w-[80px]" onClick={() => toggleSort('evPercentage')}>
                      +EV% {sortBy === 'evPercentage' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="cursor-pointer">
                      EVENT
                    </TableHead>
                    <TableHead className="cursor-pointer">
                      MARKET
                    </TableHead>
                    <TableHead className="cursor-pointer">
                      BOOKS
                    </TableHead>
                    <TableHead className="cursor-pointer w-[80px]">
                      1-CLICK BET
                    </TableHead>
                    <TableHead className="cursor-pointer w-[100px]">
                      PROBABILITY
                    </TableHead>
                    <TableHead className="cursor-pointer w-[80px]">
                      BET SIZE
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCalculations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        No calculations found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCalculations.map((calc, index) => {
                      const rowId = `${calc.player}-${calc.sportsbook}-${calc.type}-${index}`;
                      const isExpanded = expandedRows[rowId] || false;
                      
                      return (
                        <>
                          <TableRow 
                            key={rowId}
                            className={`${isExpanded ? "border-b-0" : ""} cursor-pointer hover:bg-muted/50`}
                            onClick={() => toggleRowExpansion(rowId)}
                          >
                            <TableCell className="font-bold text-green-600">
                              {calc.evPercentage.toFixed(2)}%
                            </TableCell>
                            <TableCell>
                              {data.event && 
                                <div>
                                  <div className="font-semibold">{data.event.home_team} vs {data.event.away_team}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(data.event.commence_time).toLocaleString(undefined, {
                                      weekday: 'short',
                                      month: 'short', 
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                              }
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold">
                                {calc.player} {calc.type} {calc.line}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {calc.market}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Image 
                                  src={getSportsbookLogo(calc.sportsbook)}
                                  alt={calc.sportsbook}
                                  width={24}
                                  height={24}
                                  className="rounded-sm"
                                />
                                <span className="sr-only">{getSportsbookName(calc.sportsbook)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-green-600 hover:bg-green-700">
                                {formatOdds(calc.odds)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {(calc.impliedProbability * 100).toFixed(1)}%
                            </TableCell>
                            <TableCell>
                              $10
                            </TableCell>
                          </TableRow>
                          
                          {isExpanded && (
                            <TableRow key={`${rowId}-expanded`}>
                              <TableCell colSpan={7} className="bg-muted/20 p-4">
                                <div className="space-y-4">
                                  <div>
                                    <h3 className="text-sm font-medium mb-2">Odds Comparison</h3>
                                    <div className="flex flex-wrap gap-3">
                                      {rawOddsData[rowId] ? (
                                        // Display raw odds data if available
                                        rawOddsData[rowId].odds.map((odd, i) => (
                                          <div 
                                            key={`${rowId}-book-${i}`}
                                            className="flex flex-col items-center p-2 border rounded min-w-[80px]"
                                          >
                                            <Image 
                                              src={getSportsbookLogo(odd.sportsbook)}
                                              alt={odd.sportsbook}
                                              width={32}
                                              height={32}
                                              className="rounded-sm mb-1"
                                            />
                                            <div className="text-xs font-medium">{getSportsbookName(odd.sportsbook)}</div>
                                            <div className={`text-sm mt-1 ${odd.sportsbook === calc.sportsbook ? "font-bold" : ""}`}>
                                              {formatOdds(odd.odds)}
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        // If raw odds aren't fetched yet
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            fetchRawOdds(calc.player, calc.line, calc.type, rowId);
                                          }}
                                          disabled={loadingRawOdds[rowId]}
                                        >
                                          {loadingRawOdds[rowId] ? <Spinner size="sm" /> : 'Load all sportsbook odds'}
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="space-y-1">
                                      <p className="text-xs font-medium">Best Odds ({calc.sportsbook})</p>
                                      <div className="text-xs flex justify-between">
                                        <span>American:</span>
                                        <span className="font-medium">{formatOdds(calc.odds)}</span>
                                      </div>
                                      <div className="text-xs flex justify-between">
                                        <span>Decimal:</span>
                                        <span className="font-medium">{calc.decimalOdds.toFixed(3)}</span>
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-1">
                                      <p className="text-xs font-medium">Baseline ({calc.baselineSource})</p>
                                      <div className="text-xs flex justify-between">
                                        <span>American:</span>
                                        <span className="font-medium">{formatOdds(calc.baselineOdds)}</span>
                                      </div>
                                      <div className="text-xs flex justify-between">
                                        <span>Decimal:</span>
                                        <span className="font-medium">{calc.baselineDecimalOdds.toFixed(3)}</span>
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-1">
                                      <p className="text-xs font-medium">Probability</p>
                                      <div className="text-xs flex justify-between">
                                        <span>Implied:</span>
                                        <span className="font-medium">{(calc.impliedProbability * 100).toFixed(2)}%</span>
                                      </div>
                                      {calc.noVigProbability && (
                                        <div className="text-xs flex justify-between">
                                          <span>No-Vig:</span>
                                          <span className="font-medium">{(calc.noVigProbability * 100).toFixed(2)}%</span>
                                        </div>
                                      )}
                                      {calc.hasVig !== undefined && (
                                        <div className="text-xs flex justify-between">
                                          <span>Vig:</span>
                                          <span className="font-medium">{calc.hasVig.toFixed(2)}%</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="space-y-1">
                                      <p className="text-xs font-medium">EV Details</p>
                                      <div className="text-xs flex justify-between">
                                        <span>EV%:</span>
                                        <span className="font-medium text-green-600">{calc.evPercentage.toFixed(2)}%</span>
                                      </div>
                                      <div className="text-xs flex justify-between">
                                        <span>Books Compared:</span>
                                        <span className="font-medium">{calc.bookmakerCount}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Optional link to sportsbook */}
                                  <div className="flex justify-end">
                                    <Button 
                                      variant="default" 
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <span className="flex items-center">
                                        <Image 
                                          src={getSportsbookLogo(calc.sportsbook)}
                                          alt={calc.sportsbook}
                                          width={16}
                                          height={16}
                                          className="mr-1 rounded-sm"
                                        />
                                        Bet Now <ExternalLink className="ml-1 h-3 w-3" />
                                      </span>
                                    </Button>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="py-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      
                      {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                        // Logic to show current page and surrounding pages
                        let pageNum;
                        if (totalPages <= 5) {
                          // Show all pages if 5 or fewer
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          // At the beginning
                          if (i < 4) {
                            pageNum = i + 1;
                          } else {
                            return (
                              <PaginationItem key={i}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                        } else if (currentPage >= totalPages - 2) {
                          // At the end
                          if (i === 0) {
                            pageNum = 1;
                          } else if (i === 1) {
                            return (
                              <PaginationItem key={i}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          } else {
                            pageNum = totalPages - (4 - i);
                          }
                        } else {
                          // In the middle
                          if (i === 0) {
                            pageNum = 1;
                          } else if (i === 1) {
                            return (
                              <PaginationItem key={i}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          } else if (i === 3) {
                            return (
                              <PaginationItem key={i}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          } else if (i === 4) {
                            pageNum = totalPages;
                          } else {
                            pageNum = currentPage;
                          }
                        }
                        
                        return (
                          <PaginationItem key={i}>
                            <PaginationLink
                              isActive={currentPage === pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between text-sm text-muted-foreground">
          <div>
            {data && totalItems > 0
              ? `Showing ${filteredCalculations.length} of ${totalItems} best EV bets (page ${currentPage} of ${totalPages})` 
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