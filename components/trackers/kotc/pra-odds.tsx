"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { sportsbooks } from "@/data/sportsbooks";
import { API_SPORT_IDS } from "@/data/sport-mappings";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

// Custom pagination components


interface Player {
  id: string;
  name: string;
  position: string;
  team: {
    id: string;
    name: string;
    abbreviation: string;
  };
}

interface Odd {
  id: string;
  market: string;
  name: string;
  price: string;
  points: number;
  selection: string;
  players: Player[];
}

interface Game {
  id: string;
  teams: {
    away: { name: string; abbreviation: string };
    home: { name: string; abbreviation: string };
  };
  start: string;
  sportsbooks: Array<{
    id: string;
    name: string;
    odds: Odd[];
  }>;
}

interface Event {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
}

interface ApiResponse {
  games: Game[];
}

interface PlayerPRA {
  id: string;
  name: string;
  gameName: string;
  gameTime: string;
  points: number;
  price: string;
  bookmaker: string;
}

const DEFAULT_BOOKMAKER = "draftkings";
const PAGE_SIZE = 50;

export default function PRAOdds() {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBookmaker, setSelectedBookmaker] = useState(DEFAULT_BOOKMAKER);
  const { toast } = useToast();

  // Filter active sportsbooks
  const activeSportsbooks = useMemo(() => {
    return sportsbooks.filter(book => book.isActive !== false);
  }, []);

  useEffect(() => {
    fetchPRAData();
  }, [selectedBookmaker]);

  const fetchPRAData = async () => {
    setIsLoading(true);
    try {
      // Step 1: Get today's NBA games
      const todayGames = await fetchTodayGames();
      if (!todayGames.length) {
        setGames([]);
        setIsLoading(false);
        return;
      }

      // Step 2: Fetch PRA props for each game
      const formattedGames = await fetchPropsForGames(todayGames);
      setGames(formattedGames);
      
      // Calculate total pages
      const allPlayerPRAs = getAllPlayerPRAs(formattedGames);
      setTotalPages(Math.max(1, Math.ceil(allPlayerPRAs.length / PAGE_SIZE)));
    } catch (err) {
      console.error("Error fetching PRA data:", err);
      toast({
        title: "Error",
        description: "Failed to load odds data. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTodayGames = async (): Promise<Event[]> => {
    const response = await fetch(`/api/events?sport=${API_SPORT_IDS.NBA}`, {
      cache: "no-store",
    });
    
    if (!response.ok) {
      throw new Error("Failed to fetch events");
    }
    
    const events: Event[] = await response.json();
    
    // Filter events for today
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    
    return events.filter(event => {
      const eventTime = new Date(event.commence_time);
      return eventTime >= todayStart && eventTime <= todayEnd;
    });
  };

  const fetchPropsForGames = async (events: Event[]): Promise<Game[]> => {
    const gamePromises = events.map(async (event) => {
      try {
        const response = await fetch(
          `/api/events/${event.id}/props?sport=${API_SPORT_IDS.NBA}&markets=player_points_rebounds_assists&bookmakers=${selectedBookmaker}`,
          { cache: "no-store" }
        );
        
        if (!response.ok) {
          console.error(`Failed to fetch props for event ${event.id}`);
          return null;
        }
        
        const propsData = await response.json();
        
        // Format the data to match our Game interface
        return {
          id: propsData.id,
          teams: {
            away: { 
              name: propsData.away_team, 
              abbreviation: propsData.away_team.substring(0, 3).toUpperCase() 
            },
            home: { 
              name: propsData.home_team, 
              abbreviation: propsData.home_team.substring(0, 3).toUpperCase() 
            },
          },
          start: propsData.commence_time,
          sportsbooks: propsData.bookmakers.map((bookmaker: any) => {
            // Find the player_points_rebounds_assists market
            const praMarket = bookmaker.markets.find(
              (market: any) => market.key === "player_points_rebounds_assists"
            );
            
            if (!praMarket) return { id: bookmaker.key, name: bookmaker.title, odds: [] };
            
            // Format the odds
            return {
              id: bookmaker.key,
              name: bookmaker.title,
              odds: praMarket.outcomes.map((outcome: any) => {
                // Extract the clean player name and selection type (over/under)
                const isOver = outcome.name.toLowerCase().includes("over");
                
                // Extract the player name from the description field if available
                // This is how prop-table.tsx handles it
                const playerName = outcome.description || 
                  outcome.name.replace(/ over/i, "").replace(/ under/i, "").trim();
                
                return {
                  id: `${propsData.id}-${bookmaker.key}-${outcome.name}`,
                  market: "Player Points + Rebounds + Assists",
                  name: outcome.name,
                  price: outcome.price.toString(),
                  points: outcome.point,
                  selection: isOver ? "Over" : "Under",
                  players: [
                    {
                      id: playerName,
                      name: playerName,
                      position: "",
                      team: {
                        id: "",
                        name: "",
                        abbreviation: "",
                      },
                    },
                  ],
                };
              }),
            };
          }),
        };
      } catch (error) {
        console.error(`Error fetching props for event ${event.id}:`, error);
        return null;
      }
    });
    
    const results = await Promise.all(gamePromises);
    return results.filter(Boolean) as Game[];
  };

  const getAllPlayerPRAs = (games: Game[]): PlayerPRA[] => {
    return games.flatMap((game) => {
      // Find the selected sportsbook
      const sportsbook = game.sportsbooks.find(sb => sb.id === selectedBookmaker);
      if (!sportsbook) return [];

      return sportsbook.odds
        .filter(odd => odd.selection === "Over")
        .map((odd) => ({
          id: odd.id,
          name: odd.players[0]?.name || "Unknown Player",
          gameName: `${game.teams.away.name} @ ${game.teams.home.name}`,
          gameTime: new Date(game.start).toLocaleString(),
          points: odd.points,
          price: odd.price,
          bookmaker: sportsbook.name
        }));
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleBookmakerChange = (value: string) => {
    setSelectedBookmaker(value);
    setCurrentPage(1); // Reset to first page when changing bookmaker
  };

  const playerPRAData = useMemo(() => {
    return games.flatMap((game) => {
      // Find the selected sportsbook
      const sportsbook = game.sportsbooks.find(sb => sb.id === selectedBookmaker);
      if (!sportsbook) return [];

      // Only display "Over" odds
      return sportsbook.odds
        .filter(odd => odd.selection === "Over")
        .map((odd) => ({
          id: odd.id,
          name: odd.players[0]?.name || "Unknown Player",
          gameName: `${game.teams.away.name} @ ${game.teams.home.name}`,
          gameTime: new Date(game.start).toLocaleString(),
          points: odd.points,
          price: odd.price,
          bookmaker: sportsbook.name
        }));
    });
  }, [games, selectedBookmaker]);

  const sortedPlayerPRAData = useMemo(() => {
    // Sort by PRA points (descending)
    const sorted = [...playerPRAData].sort((a, b) => b.points - a.points);
    
    // Apply pagination
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    return sorted.slice(startIndex, endIndex);
  }, [playerPRAData, currentPage]);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                handlePageChange(currentPage - 1);
              }}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} 
            />
          </PaginationItem>
          {[...Array(totalPages)].map((_, i) => {
            const pageNum = i + 1;
            // Only show current page, first, last and a few around current
            if (
              pageNum === 1 ||
              pageNum === totalPages ||
              (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
            ) {
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.preventDefault();
                      handlePageChange(pageNum);
                    }}
                    isActive={pageNum === currentPage}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            } else if (
              (pageNum === 2 && currentPage > 3) ||
              (pageNum === totalPages - 1 && currentPage < totalPages - 2)
            ) {
              return (
                <PaginationItem key={pageNum}>
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }
            return null;
          })}
          <PaginationItem>
            <PaginationNext
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                handlePageChange(currentPage + 1);
              }}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Player PRA Leaderboard</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Sportsbook:</span>
          <Select value={selectedBookmaker} onValueChange={handleBookmakerChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select sportsbook" />
            </SelectTrigger>
            <SelectContent>
              {activeSportsbooks.map((book) => (
                <SelectItem key={book.id} value={book.id}>
                  {book.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead>Game</TableHead>
              <TableHead>PRA Over/Under</TableHead>
              <TableHead>Odds</TableHead>
              <TableHead>Sportsbook</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPlayerPRAData.length > 0 ? (
              sortedPlayerPRAData.map((player, index) => (
                <TableRow
                  key={player.id}
                  className={index % 2 === 0 ? "bg-background" : "bg-muted/50"}
                >
                  <TableCell>{player.name}</TableCell>
                  <TableCell>{player.gameName}</TableCell>
                  <TableCell>{player.points}</TableCell>
                  <TableCell>{player.price}</TableCell>
                  <TableCell>{player.bookmaker}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No PRA data available for today&apos;s games
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {renderPagination()}
    </div>
  );
}
