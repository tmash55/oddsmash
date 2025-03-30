"use client";

import { useState, useEffect } from "react";
import {
  sports,
  getGamesBySport,
  type Game,
  type ParlayLeg,
  sportsbooks,
} from "@/data/sports-data";
import { SportSelector } from "./sport-selector";
import { GameCard } from "./game-card";
import { BetslipButton } from "./betslip-button";
import { Betslip } from "./betslip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar, Filter, SortAsc } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Add the import for the useSportsbooks hook
import { useSportsbooks } from "@/contexts/sportsbook-context";
import { formatOdds } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function ParlayBuilder() {
  const [selectedSport, setSelectedSport] = useState("nba");
  const [games, setGames] = useState<Game[]>([]);
  const [selectedLegs, setSelectedLegs] = useState<ParlayLeg[]>([]);
  const [isBetslipOpen, setIsBetslipOpen] = useState(false);
  const [activeSportsbook, setActiveSportsbook] = useState("draftkings");
  const [dateFilter, setDateFilter] = useState("today");
  // Add a new state for odds format
  const [oddsFormat, setOddsFormat] = useState<"american" | "decimal">(
    "american"
  );

  // Inside the ParlayBuilder component, add this line after the useState declarations
  const { userSportsbooks } = useSportsbooks();

  // Load games when sport changes
  useEffect(() => {
    const sportGames = getGamesBySport(selectedSport);
    setGames(sportGames);
  }, [selectedSport]);

  // Add or remove a leg from the parlay
  const toggleLeg = (
    game: Game,
    marketId: string,
    selection: string,
    sportsbookId: string
  ) => {
    // Find the market
    let market: any; // Temporary fix for type issues
    Object.values(game.markets).forEach((marketGroup) => {
      if (Array.isArray(marketGroup)) {
        const found = marketGroup.find((m) => m.id === marketId);
        if (found) market = found;
      }
    });

    if (!market) return;

    // Check if this leg already exists
    const existingLegIndex = selectedLegs.findIndex(
      (leg) => leg.gameId === game.id && leg.marketId === marketId
    );

    if (existingLegIndex >= 0) {
      // Remove the leg
      setSelectedLegs((prev) => prev.filter((_, i) => i !== existingLegIndex));
    } else {
      // Add the leg
      const newLeg: ParlayLeg = {
        id: `${game.id}-${marketId}`,
        gameId: game.id,
        marketId: marketId,
        selection: selection,
        odds: market.odds?.[sportsbookId] ?? 0,
        sportsbookId: sportsbookId,
        type: market.type ?? 'unknown',
        description: `${game.homeTeam.abbreviation} vs ${game.awayTeam.abbreviation}: ${selection}`,
        line: market.line ?? 0,
      };

      setSelectedLegs((prev) => [...prev, newLeg]);
    }
  };

  // Check if a market is selected
  const isMarketSelected = (gameId: string, marketId: string) => {
    return selectedLegs.some(
      (leg) => leg.gameId === gameId && leg.marketId === marketId
    );
  };

  // Format date for display
  const formatGameTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  // Format date for display
  const formatGameDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Add a function to convert American odds to decimal
  const americanToDecimal = (odds: number): number => {
    if (odds > 0) {
      return Number.parseFloat((odds / 100 + 1).toFixed(2));
    } else {
      return Number.parseFloat((100 / Math.abs(odds) + 1).toFixed(2));
    }
  };

  // Add a function to format odds based on the selected format
  const displayOdds = (odds: number): string => {
    if (oddsFormat === "american") {
      return formatOdds(odds);
    } else {
      return americanToDecimal(odds).toString();
    }
  };

  return (
    <div className="relative bg-card rounded-lg border p-2 sm:p-4">
      <div className="mb-4 sm:mb-6">
        <SportSelector
          sports={sports}
          selectedSport={selectedSport}
          onSelectSport={setSelectedSport}
        />
      </div>

      {/* Main column headers - only show on desktop */}
      <div className="hidden sm:grid grid-cols-4 mb-4 px-2">
        <div className="col-span-1 font-medium text-muted-foreground">
          {dateFilter.toUpperCase()}
        </div>
        <div className="col-span-3 grid grid-cols-3">
          <div className="text-center font-medium text-muted-foreground">
            SPREAD
          </div>
          <div className="text-center font-medium text-muted-foreground">
            MONEYLINE
          </div>
          <div className="text-center font-medium text-muted-foreground">
            TOTAL
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="mb-4">
        {/* Mobile View - Stacked */}
        <div className="flex flex-col space-y-3 sm:hidden">
          <div className="flex items-center justify-between">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[130px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="tomorrow">Tomorrow</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="h-10 px-3">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-10 px-3">
                <SortAsc className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center border rounded-md overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-none h-10 px-3",
                  oddsFormat === "american" ? "bg-primary/10" : ""
                )}
                onClick={() => setOddsFormat("american")}
              >
                American
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-none h-10 px-3",
                  oddsFormat === "decimal" ? "bg-primary/10" : ""
                )}
                onClick={() => setOddsFormat("decimal")}
              >
                Decimal
              </Button>
            </div>
          </div>

          <Tabs
            defaultValue={activeSportsbook}
            onValueChange={setActiveSportsbook}
            className="w-full"
          >
            <ScrollArea className="w-full">
              <TabsList className="w-full justify-start">
                {sportsbooks
                  .filter((sportsbook) =>
                    userSportsbooks.includes(sportsbook.id)
                  )
                  .map((sportsbook) => (
                    <TabsTrigger
                      key={sportsbook.id}
                      value={sportsbook.id}
                      className="flex items-center gap-1"
                    >
                      <div className="w-4 h-4">
                        <img
                          src={sportsbook.logo || "/placeholder.svg"}
                          alt={sportsbook.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-xs">{sportsbook.name}</span>
                    </TabsTrigger>
                  ))}
              </TabsList>
            </ScrollArea>
          </Tabs>
        </div>

        {/* Desktop View - Horizontal */}
        <div className="hidden sm:flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[130px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="tomorrow">Tomorrow</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" className="h-10">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>

            <Button variant="outline" size="sm" className="h-10">
              <SortAsc className="mr-2 h-4 w-4" />
              Sort
            </Button>

            <div className="flex items-center border rounded-md overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-none h-10",
                  oddsFormat === "american" ? "bg-primary/10" : ""
                )}
                onClick={() => setOddsFormat("american")}
              >
                American
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-none h-10",
                  oddsFormat === "decimal" ? "bg-primary/10" : ""
                )}
                onClick={() => setOddsFormat("decimal")}
              >
                Decimal
              </Button>
            </div>
          </div>

          <Tabs
            defaultValue={activeSportsbook}
            onValueChange={setActiveSportsbook}
            className="w-full sm:w-auto"
          >
            <ScrollArea className="w-full">
              <TabsList className="w-full sm:w-auto justify-start">
                {sportsbooks
                  .filter((sportsbook) =>
                    userSportsbooks.includes(sportsbook.id)
                  )
                  .map((sportsbook) => (
                    <TabsTrigger
                      key={sportsbook.id}
                      value={sportsbook.id}
                      className="flex items-center gap-1"
                    >
                      <div className="w-4 h-4">
                        <img
                          src={sportsbook.logo || "/placeholder.svg"}
                          alt={sportsbook.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="hidden sm:inline">
                        {sportsbook.name}
                      </span>
                    </TabsTrigger>
                  ))}
              </TabsList>
            </ScrollArea>
          </Tabs>
        </div>
      </div>

      <div className="space-y-1 divide-y divide-border">
        {games.length === 0 ? (
          <div className="bg-card rounded-lg border p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No Games Available</h3>
            <p className="text-muted-foreground">
              There are no games available for this sport at the moment.
            </p>
          </div>
        ) : (
          games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              activeSportsbook={activeSportsbook}
              onSelectMarket={toggleLeg}
              isMarketSelected={isMarketSelected}
              formatGameTime={formatGameTime}
              formatGameDate={formatGameDate}
              displayOdds={displayOdds}
            />
          ))
        )}
      </div>

      {/* Betslip floating button */}
      {selectedLegs.length > 0 && (
        <BetslipButton
          legsCount={selectedLegs.length}
          onClick={() => setIsBetslipOpen(true)}
        />
      )}

      {/* Betslip drawer */}
      <Betslip
        open={isBetslipOpen}
        onOpenChange={setIsBetslipOpen}
        legs={selectedLegs}
        onRemoveLeg={(legId) => {
          setSelectedLegs((prev) => prev.filter((leg) => leg.id !== legId));
        }}
        games={games}
        displayOdds={displayOdds}
      />
    </div>
  );
}
