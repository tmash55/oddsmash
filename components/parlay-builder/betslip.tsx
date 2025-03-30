"use client";

import type React from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Calculator, ExternalLink } from "lucide-react";
import {
  type ParlayLeg,
  type Game,
  formatOdds,
  calculateParlayOdds,
  findBestParlayOdds,
  sportsbooks,
} from "@/data/sports-data";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useSportsbooks } from "@/contexts/sportsbook-context";

interface BetslipProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  legs: ParlayLeg[];
  onRemoveLeg: (legId: string) => void;
  games: Game[];
  displayOdds?: (odds: number) => string;
}

export function Betslip({
  open,
  onOpenChange,
  legs,
  onRemoveLeg,
  games,
  displayOdds = formatOdds,
}: BetslipProps) {
  const [wagerAmount, setWagerAmount] = useState("10");
  const [selectedSportsbook, setSelectedSportsbook] = useState<string | null>(
    null
  );
  const { userSportsbooks } = useSportsbooks();

  // Calculate parlay odds
  const parlayOdds = calculateParlayOdds(legs);
  const bestOdds = findBestParlayOdds(parlayOdds);

  // Set the best odds sportsbook as selected by default
  useEffect(() => {
    if (legs.length > 0 && !selectedSportsbook) {
      setSelectedSportsbook(bestOdds.sportsbook);
    }
  }, [legs.length, bestOdds.sportsbook, selectedSportsbook]);

  // Calculate potential payout
  const calculatePayout = (odds: number, wager: number) => {
    if (odds > 0) {
      return wager + (wager * odds) / 100;
    } else {
      return wager + (wager * 100) / Math.abs(odds);
    }
  };

  // Get game info for a leg
  const getGameInfo = (gameId: string) => {
    return games.find((game) => game.id === gameId);
  };

  // Generate deep link to sportsbook
  const getSportsbookLink = (sportsbookId: string) => {
    // This is a placeholder - in a real app, you would generate actual deep links
    // to the specific bet slip in each sportsbook app or website
    const links = {
      draftkings: "https://sportsbook.draftkings.com/",
      fanduel: "https://sportsbook.fanduel.com/",
      betmgm: "https://sports.betmgm.com/",
      caesars: "https://www.caesars.com/sportsbook-and-casino",
      pointsbet: "https://pointsbet.com/",
    };

    return links[sportsbookId as keyof typeof links] || "#";
  };

  // Handle placing bet
  const handlePlaceBet = () => {
    if (!selectedSportsbook) return;

    // Open the sportsbook in a new tab
    window.open(getSportsbookLink(selectedSportsbook), "_blank");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md w-full p-0 flex flex-col h-[85vh] sm:h-full">
        <SheetHeader className="p-6 border-b">
          <SheetTitle className="flex items-center">
            <span>Betslip</span>
            <Badge className="ml-2 bg-primary text-primary-foreground">
              {legs.length}
            </Badge>
          </SheetTitle>
          <SheetDescription>
            Build your parlay and compare odds across sportsbooks
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              {legs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Your betslip is empty</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => onOpenChange(false)}
                  >
                    Add Selections
                  </Button>
                </div>
              ) : (
                <>
                  {/* Parlay Legs */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Parlay Legs
                    </h3>

                    {legs.map((leg) => {
                      const game = getGameInfo(leg.gameId);

                      return (
                        <div
                          key={leg.id}
                          className="flex items-start justify-between p-4 rounded-md border"
                        >
                          <div className="space-y-1 flex-1">
                            <div className="text-sm font-medium">
                              {leg.selection}
                            </div>
                            {game && (
                              <div className="text-xs text-muted-foreground">
                                {game.awayTeam.abbreviation} @{" "}
                                {game.homeTeam.abbreviation}
                              </div>
                            )}
                            <div className="flex items-center mt-1">
                              <div className="w-4 h-4 mr-1">
                                <img
                                  src={`/${leg.sportsbookId}-logo.svg`}
                                  alt={leg.sportsbookId}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <span
                                className={cn(
                                  "text-xs font-medium",
                                  leg.odds > 0
                                    ? "text-green-500"
                                    : "text-blue-500"
                                )}
                              >
                                {displayOdds(leg.odds)}
                              </span>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRemoveLeg(leg.id)}
                            className="h-10 w-10 ml-2"
                          >
                            <Trash2 className="h-5 w-5 text-muted-foreground" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Wager Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="wager">Wager Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        id="wager"
                        type="number"
                        value={wagerAmount}
                        onChange={(e) => setWagerAmount(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>

                  {/* Odds Comparison */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Odds Comparison
                      </h3>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calculator className="h-3 w-3 mr-1" />
                        <span>Based on ${wagerAmount} wager</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {Object.entries(parlayOdds)
                        .filter(([sportsbook]) =>
                          userSportsbooks.includes(sportsbook)
                        )
                        .map(([sportsbook, odds]) => {
                          const isBest = sportsbook === bestOdds.sportsbook;
                          const isSelected = sportsbook === selectedSportsbook;
                          const payout = calculatePayout(
                            odds,
                            Number.parseFloat(wagerAmount) || 0
                          );
                          const sportsbookInfo = sportsbooks.find(
                            (sb) => sb.id === sportsbook
                          );

                          return (
                            <button
                              key={sportsbook}
                              onClick={() => setSelectedSportsbook(sportsbook)}
                              className={cn(
                                "w-full flex items-center justify-between p-4 rounded-md border transition-colors relative",
                                isSelected
                                  ? "border-primary bg-primary/10"
                                  : "",
                                isBest && !isSelected ? "border-primary/50" : ""
                              )}
                            >
                              <div className="flex items-center">
                                <div className="w-8 h-8 mr-3">
                                  <img
                                    src={
                                      sportsbookInfo?.logo || "/placeholder.svg"
                                    }
                                    alt={sportsbookInfo?.name || sportsbook}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                <div>
                                  <div className="text-sm font-medium">
                                    {sportsbookInfo?.name || sportsbook}
                                  </div>
                                  <div
                                    className={cn(
                                      "text-xs font-medium",
                                      odds > 0
                                        ? "text-green-500"
                                        : "text-blue-500"
                                    )}
                                  >
                                    {displayOdds(odds)}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-sm font-medium">
                                  ${payout.toFixed(2)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Potential Payout
                                </div>
                              </div>

                              {isBest && (
                                <Badge className="absolute top-1 right-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
                                  Best Odds
                                </Badge>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </div>

        {legs.length > 0 && selectedSportsbook && (
          <SheetFooter className="p-6 border-t">
            <Button
              className="w-full h-14 text-base"
              size="lg"
              onClick={handlePlaceBet}
            >
              <span>
                Place Bet on{" "}
                {sportsbooks.find((sb) => sb.id === selectedSportsbook)?.name ||
                  selectedSportsbook}
              </span>
              <ExternalLink className="ml-2 h-5 w-5" />
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

// Badge component for the betslip count
function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        className
      )}
    >
      {children}
    </span>
  );
}
