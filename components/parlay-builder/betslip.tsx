"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Trash2,
  Calculator,
  ExternalLink,
  AlertCircle,
  Sparkles,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { type ParlayLeg, type Game, formatOdds } from "@/data/sports-data";
import { sportsbooks } from "@/data/sportsbooks";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useSportsbooks } from "@/contexts/sportsbook-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { getMarketsForSport } from "@/lib/constants/markets";

// Add custom utility classes for glow effects
const glowStyles = `
  .border-glow {
    box-shadow: 0 0 5px rgba(var(--primary), 0.3), 
                0 0 10px rgba(var(--primary), 0.1);
  }
  .glow-sm::after {
    box-shadow: 0 0 5px 1px rgba(var(--primary), 0.2);
  }
  .shadow-glow {
    box-shadow: 0 0 15px rgba(var(--primary), 0.4);
  }
`;

interface BetslipProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  legs: ParlayLeg[];
  onRemoveLeg: (legId: string) => void;
  onClearAll?: () => void;
  games: Game[];
  displayOdds?: (odds: number) => string;
  playerPropsData?: Record<string, any>;
}

export function Betslip({
  open,
  onOpenChange,
  legs,
  onRemoveLeg,
  onClearAll,
  games,
  displayOdds = formatOdds,
  playerPropsData = {},
}: BetslipProps) {
  const [wagerAmount, setWagerAmount] = useState("10");
  const [selectedSportsbook, setSelectedSportsbook] = useState<string | null>(
    null
  );
  const { userSportsbooks } = useSportsbooks();
  const [animatePayouts, setAnimatePayouts] = useState(false);
  const [expandedGames, setExpandedGames] = useState<Record<string, boolean>>(
    {}
  );

  // Add logging for debugging
  useEffect(() => {
    if (open) {
      console.log("Betslip - User's selected sportsbooks:", userSportsbooks);
      console.log("Betslip - Selected legs:", legs);
      console.log("Betslip - Player props data:", playerPropsData);
    }
  }, [open, userSportsbooks, legs, playerPropsData]);

  // Trigger payout animation when wager amount changes
  useEffect(() => {
    setAnimatePayouts(true);
    const timer = setTimeout(() => setAnimatePayouts(false), 500);
    return () => clearTimeout(timer);
  }, [wagerAmount]);

  // Update the getPlayerPropOdds function to search across both standard and alternate markets
  const getPlayerPropOdds = (
    leg: ParlayLeg,
    sportsbook: string
  ): number | undefined => {
    if (!leg.propData) return undefined;

    const { gameId, propData } = leg;
    const cacheKey = `${gameId}-${propData.market}`;

    // Check if we have data for this prop
    if (!playerPropsData[cacheKey]) {
      // Try alternate market cache key if standard market not found
      const baseMarket = propData.market.replace("_alternate", "");
      const alternateMarket = propData.market.endsWith("_alternate")
        ? baseMarket
        : `${baseMarket}_alternate`;
      const alternateCacheKey = `${gameId}-${alternateMarket}`;

      // If neither standard nor alternate market data is available, return undefined
      if (!playerPropsData[alternateCacheKey]) {
        return undefined;
      }

      // Use the alternate market data if available
      const data = playerPropsData[alternateCacheKey];

      // Find the bookmaker
      const bookmaker = data.bookmakers.find((b: any) => b.key === sportsbook);
      if (!bookmaker) return undefined;

      // Search through all markets for this bookmaker
      for (const market of bookmaker.markets) {
        // Find the outcome with EXACT line match regardless of market key
        const outcome = market.outcomes.find((o: any) => {
          return (
            o.description === propData.player &&
            o.name === propData.betType &&
            o.point === propData.line
          );
        });

        // If we found a matching outcome, return its price
        if (outcome) return outcome.price;
      }

      return undefined;
    }

    const data = playerPropsData[cacheKey];

    // Find the bookmaker
    const bookmaker = data.bookmakers.find((b: any) => b.key === sportsbook);
    if (!bookmaker) return undefined;

    // Search through all markets for this bookmaker
    for (const market of bookmaker.markets) {
      // Find the outcome with EXACT line match
      const outcome = market.outcomes.find((o: any) => {
        return (
          o.description === propData.player &&
          o.name === propData.betType &&
          o.point === propData.line
        );
      });

      // If we found a matching outcome, return its price
      if (outcome) return outcome.price;
    }

    return undefined;
  };

  // Helper function to get market display name from the markets file
  const getMarketDisplayName = (marketKey: string): string => {
    // Remove _alternate suffix for display purposes
    const baseMarketKey = marketKey.replace("_alternate", "");

    // Check all sports for this market
    const allSports = [
      "basketball_nba",
      "basketball_ncaab",
      "baseball_mlb",
      "icehockey_nhl",
      "americanfootball_nfl",
    ];

    for (const sport of allSports) {
      const markets = getMarketsForSport(sport);
      const market = markets.find(
        (m) => m.apiKey === baseMarketKey || m.value === baseMarketKey
      );
      if (market) {
        return market.label;
      }
    }

    // Fallback to a simple mapping if not found in markets file
    const marketNames: { [key: string]: string } = {
      player_points: "Points",
      player_rebounds: "Rebounds",
      player_assists: "Assists",
      player_threes: "Three Pointers",
      player_blocks: "Blocks",
      player_steals: "Steals",
      player_turnovers: "Turnovers",
      player_points_rebounds_assists: "Pts+Reb+Ast",
      batter_hits: "Hits",
      batter_runs: "Runs",
      batter_rbis: "RBIs",
      batter_home_runs: "Home Runs",
      player_goals: "Goals",
      player_shots_on_goal: "Shots",
      player_saves: "Saves",
      player_pass_yards: "Pass Yards",
      player_rush_yards: "Rush Yards",
      player_reception_yards: "Rec Yards",
      player_receptions: "Receptions",
      player_touchdowns: "Touchdowns",
    };

    return marketNames[baseMarketKey] || baseMarketKey;
  };

  // Check if a sportsbook has all the legs with exact line matches
  const checkSportsbookHasAllLegs = (sportsbook: string) => {
    // For each leg, check if this sportsbook has it
    return legs.every((leg) => {
      // For player props
      if (leg.type === "player-prop" && leg.propData) {
        const odds = getPlayerPropOdds(leg, sportsbook);
        return odds !== undefined;
      }

      // For standard markets
      const game = games.find((g) => g.id === leg.gameId);
      if (!game) return false;

      let market: any;
      Object.values(game.markets).forEach((marketGroup) => {
        if (Array.isArray(marketGroup)) {
          const found = marketGroup.find((m) => m.id === leg.marketId);
          if (found) market = found;
        }
      });

      if (!market) return false;

      // Check if this sportsbook has odds for this market
      return market.odds?.[sportsbook] !== undefined;
    });
  };

  // Calculate parlay odds for all sportsbooks
  const calculateOddsForAllSportsbooks = () => {
    const parlayOdds: { [key: string]: number | null } = {};

    // Skip if no legs
    if (legs.length === 0) {
      return parlayOdds;
    }

    // Initialize all user sportsbooks with null (indicating not available)
    userSportsbooks.forEach((sportsbook) => {
      parlayOdds[sportsbook] = null;
    });

    // For each sportsbook, calculate the parlay odds if all legs are available
    userSportsbooks.forEach((sportsbook) => {
      // Check if this sportsbook has all legs
      if (!checkSportsbookHasAllLegs(sportsbook)) {
        // If not, leave as null
        return;
      }

      // For each leg, get the odds for this sportsbook
      const legOdds = legs.map((leg) => {
        // If this is a player prop, get odds from player props data
        if (leg.type === "player-prop" && leg.propData) {
          return getPlayerPropOdds(leg, sportsbook) || 0;
        }

        // Otherwise, find the game and market
        const game = games.find((g) => g.id === leg.gameId);
        if (!game) return 0;

        let market: any;
        Object.values(game.markets).forEach((marketGroup) => {
          if (Array.isArray(marketGroup)) {
            const found = marketGroup.find((m) => m.id === leg.marketId);
            if (found) market = found;
          }
        });

        if (!market) return 0;

        // Get the odds for this sportsbook
        return market.odds?.[sportsbook] || 0;
      });

      // Only calculate if we have odds for all legs
      if (legOdds.every((odds) => odds !== 0)) {
        // Convert to decimal odds for multiplication
        const decimalOdds = legOdds.map((odds) => {
          if (odds > 0) {
            return odds / 100 + 1;
          } else {
            return 100 / Math.abs(odds) + 1;
          }
        });

        // Multiply all decimal odds
        const totalDecimalOdds = decimalOdds.reduce(
          (acc, odds) => acc * odds,
          1
        );

        // Convert back to American odds
        let americanOdds;
        if (totalDecimalOdds >= 2) {
          americanOdds = Math.round((totalDecimalOdds - 1) * 100);
        } else {
          americanOdds = Math.round(-100 / (totalDecimalOdds - 1));
        }

        parlayOdds[sportsbook] = americanOdds;
      }
    });

    return parlayOdds;
  };

  const parlayOdds = calculateOddsForAllSportsbooks();

  // Find the best odds among available sportsbooks
  const findBestOdds = () => {
    let bestSportsbook = "";
    let bestOddsValue = Number.NEGATIVE_INFINITY;

    Object.entries(parlayOdds).forEach(([sportsbook, odds]) => {
      if (odds !== null && odds > bestOddsValue) {
        bestOddsValue = odds;
        bestSportsbook = sportsbook;
      }
    });

    return {
      sportsbook: bestSportsbook,
      odds: bestOddsValue,
    };
  };

  const bestOdds = findBestOdds();

  // Always select the sportsbook with the best odds when betslip opens or legs change
  useEffect(() => {
    if (open && legs.length > 0 && bestOdds.sportsbook) {
      // Always select the best odds sportsbook when betslip is opened
      setSelectedSportsbook(bestOdds.sportsbook);
      console.log(
        "Betslip - Auto-selecting best sportsbook:",
        bestOdds.sportsbook
      );
    }
  }, [open, legs, bestOdds.sportsbook]);

  // Calculate potential payout
  const calculatePayout = (odds: number | null, wager: number) => {
    if (odds === null) return 0;

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

  // Generate deep link to sportsbook using the URLs from sportsbooks.ts
  const getSportsbookLink = (sportsbookId: string) => {
    const sportsbookInfo = sportsbooks.find((sb) => sb.id === sportsbookId);
    return sportsbookInfo?.url || "#";
  };

  // Handle placing bet
  const handlePlaceBet = () => {
    if (!selectedSportsbook) return;

    // Track that user clicked the place bet button
    console.log(
      `User placing bet with ${selectedSportsbook} - Odds: ${parlayOdds[selectedSportsbook]}`
    );

    // Open the sportsbook in a new tab
    window.open(getSportsbookLink(selectedSportsbook), "_blank");
  };

  // Get market type display name for standard markets
  const getStandardMarketName = (type: string): string => {
    const marketTypes: { [key: string]: string } = {
      spread: "Spread",
      moneyline: "Moneyline",
      total: "Total",
      "player-prop": "Player Prop",
    };
    return marketTypes[type] || type;
  };

  // Handle clearing all legs
  const handleClearAll = () => {
    if (onClearAll) {
      onClearAll();
    }
  };

  // Format the market display for a leg
  const formatMarketDisplay = (leg: ParlayLeg) => {
    // For player props
    if (leg.type === "player-prop" && leg.propData) {
      const marketName = getMarketDisplayName(leg.propData.market);
      return marketName;
    }

    // For standard markets
    if (leg.type === "moneyline") {
      return "Moneyline";
    }

    if (leg.type === "spread") {
      return `Spread ${(leg.line > 0 ? "+" : "") + leg.line}`;
    }

    if (leg.type === "total") {
      return `${leg.selection} ${Math.abs(leg.line)}`;
    }

    return leg.type;
  };

  // Get the team abbreviations for a game
  const getGameTeams = (gameId: string) => {
    const game = getGameInfo(gameId);
    if (!game) return "";
    return `${game.awayTeam.name} @ ${game.homeTeam.name}`;
  };

  // Group legs by game for better organization
  const groupedLegs = legs.reduce((acc, leg) => {
    const gameId = leg.gameId;
    if (!acc[gameId]) {
      acc[gameId] = [];
    }
    acc[gameId].push(leg);
    return acc;
  }, {} as Record<string, ParlayLeg[]>);

  useEffect(() => {
    // Initialize all games as expanded by default
    const newExpandedState: Record<string, boolean> = {};
    Object.keys(groupedLegs).forEach((gameId) => {
      newExpandedState[gameId] = true;
    });
    setExpandedGames(newExpandedState);
  }, [legs]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <style jsx global>
        {glowStyles}
      </style>
      <SheetContent
        className="sm:max-w-md w-full p-0 flex flex-col h-[100vh] sm:h-full"
        side="right"
      >
        <SheetHeader className="p-6 border-b relative">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <span className="flex items-center">
                Parlay Legs
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="ml-2 inline-flex"
                >
                  <Badge className="bg-primary text-primary-foreground flex items-center justify-center">
                    {legs.length}
                  </Badge>
                </motion.div>
              </span>
            </SheetTitle>
            {legs.length > 0 && (
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearAll}
                  className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                  title="Clear all legs"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
            <SheetClose className="rounded-full h-8 w-8 flex items-center justify-center hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </SheetClose>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              {legs.length === 0 ? (
                <motion.div
                  className="text-center py-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex justify-center mb-4">
                    <motion.div
                      animate={{
                        y: [0, -10, 0],
                        opacity: [1, 0.8, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                      }}
                    >
                      <Sparkles className="h-12 w-12 text-primary/50" />
                    </motion.div>
                  </div>
                  <p className="text-gray-400 mb-3">Your betslip is empty</p>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => onOpenChange(false)}
                  >
                    Add Selections
                  </Button>
                </motion.div>
              ) : (
                <>
                  {/* Parlay Legs - Grouped by Game */}
                  <div className="space-y-4">
                    <AnimatePresence>
                      {Object.entries(groupedLegs).map(([gameId, gameLegs]) => {
                        const isExpanded = expandedGames[gameId] !== false;
                        const toggleExpanded = () => {
                          setExpandedGames((prev) => ({
                            ...prev,
                            [gameId]: !isExpanded,
                          }));
                        };

                        const isSGP = gameLegs.length > 1;

                        return (
                          <motion.div
                            key={gameId}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="border rounded-md overflow-hidden"
                          >
                            <div
                              className="flex items-center justify-between cursor-pointer p-3 hover:bg-muted/30 transition-colors"
                              onClick={toggleExpanded}
                            >
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 mr-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpanded();
                                  }}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                                <div className="text-sm font-medium">
                                  {getGameTeams(gameId)}
                                </div>
                                {isSGP && (
                                  <Badge
                                    variant="outline"
                                    className="bg-primary/10 text-primary text-xs"
                                  >
                                    SGP
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {gameLegs.length}{" "}
                                {gameLegs.length === 1 ? "leg" : "legs"}
                              </div>
                            </div>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-3 pt-0 space-y-2">
                                    {gameLegs.map((leg) => (
                                      <motion.div
                                        key={leg.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        <div className="flex items-start justify-between p-3 mt-2 rounded-md border hover:border-border/80 hover:bg-muted/20 transition-colors">
                                          <div className="space-y-1 flex-1">
                                            <div className="flex items-center justify-between">
                                              <div className="text-base font-medium">
                                                {leg.selection}
                                              </div>
                                              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                                {formatMarketDisplay(leg)}
                                              </span>
                                            </div>

                                            <div className="flex items-center mt-2">
                                              <span
                                                className={cn(
                                                  "text-sm font-medium",
                                                  leg.odds > 0
                                                    ? "text-green-500"
                                                    : "text-blue-500"
                                                )}
                                              >
                                                {displayOdds(leg.odds)} (
                                                {leg.sportsbookId})
                                              </span>
                                            </div>
                                          </div>

                                          <motion.div
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                          >
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() =>
                                                onRemoveLeg(leg.id)
                                              }
                                              className="h-10 w-10 ml-2 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                            >
                                              <Trash2 className="h-5 w-5" />
                                            </Button>
                                          </motion.div>
                                        </div>
                                      </motion.div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  {/* Wager Amount */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="wager">Wager Amount</Label>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calculator className="h-3 w-3 mr-1" />
                        <span>For calculation only</span>
                      </div>
                    </div>
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
                    <p className="text-xs text-muted-foreground mt-1">
                      This is for visualization purposes only. Actual wager
                      amount will be set at the sportsbook.
                    </p>
                  </div>

                  {/* Odds Comparison */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Odds Comparison
                      </h3>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <span>Based on ${wagerAmount} wager</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {userSportsbooks
                        .slice()
                        .sort((a, b) => {
                          const oddsA = parlayOdds[a];
                          const oddsB = parlayOdds[b];

                          // Handle null values (place them at the end)
                          if (oddsA === null && oddsB === null) return 0;
                          if (oddsA === null) return 1;
                          if (oddsB === null) return -1;

                          // Sort by highest odds (best value) first
                          return oddsB - oddsA;
                        })
                        .map((sportsbook) => {
                          const odds = parlayOdds[sportsbook];
                          const isBest =
                            odds !== null && bestOdds.sportsbook === sportsbook;
                          const isSelected = sportsbook === selectedSportsbook;
                          const payout = calculatePayout(
                            odds,
                            Number.parseFloat(wagerAmount) || 0
                          );
                          const sportsbookInfo = sportsbooks.find(
                            (sb) => sb.id === sportsbook
                          );
                          const isAvailable = odds !== null;

                          return (
                            <TooltipProvider key={sportsbook}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <motion.div
                                    whileHover={
                                      isAvailable
                                        ? {
                                            scale: 1.01,
                                            y: -1,
                                            boxShadow:
                                              "0 10px 30px -10px rgba(0, 0, 0, 0.2)",
                                          }
                                        : {}
                                    }
                                    whileTap={
                                      isAvailable ? { scale: 0.99 } : {}
                                    }
                                    layout
                                  >
                                    <button
                                      onClick={() =>
                                        isAvailable &&
                                        setSelectedSportsbook(sportsbook)
                                      }
                                      className={cn(
                                        "w-full flex items-center justify-between p-4 rounded-md border transition-all duration-200 relative",
                                        "backdrop-blur-sm bg-white/5",
                                        isSelected
                                          ? "border-primary bg-primary/10 shadow-md shadow-primary/20"
                                          : "shadow-sm hover:shadow-md",
                                        isBest && !isSelected
                                          ? "border-primary/30 bg-primary/5"
                                          : "",
                                        !isAvailable
                                          ? "opacity-60 cursor-not-allowed"
                                          : "hover:border-primary/50 hover:border-glow",
                                        "after:absolute after:inset-0 after:rounded-md after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-300 after:pointer-events-none after:border after:border-primary/30 after:glow-sm"
                                      )}
                                      disabled={!isAvailable}
                                    >
                                      <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 mb-1 relative">
                                          <img
                                            src={
                                              sportsbookInfo?.logo ||
                                              "/placeholder.svg?height=32&width=32" ||
                                              "/placeholder.svg" ||
                                              "/placeholder.svg" ||
                                              "/placeholder.svg" ||
                                              "/placeholder.svg" ||
                                              "/placeholder.svg"
                                            }
                                            alt={
                                              sportsbookInfo?.name || sportsbook
                                            }
                                            className="w-full h-full object-contain"
                                          />
                                        </div>
                                        <div className="text-sm font-medium text-center">
                                          {sportsbookInfo?.name || sportsbook}
                                        </div>
                                        <div
                                          className={cn(
                                            "text-sm font-medium mt-1",
                                            isAvailable
                                              ? odds! > 0
                                                ? "text-green-500"
                                                : "text-blue-500"
                                              : "text-gray-500"
                                          )}
                                        >
                                          {isAvailable
                                            ? displayOdds(odds!)
                                            : "N/A"}
                                        </div>
                                      </div>

                                      <div className="text-right">
                                        {isAvailable ? (
                                          <>
                                            <motion.div
                                              className="text-lg font-bold"
                                              animate={
                                                animatePayouts
                                                  ? {
                                                      scale: [1, 1.1, 1],
                                                    }
                                                  : {}
                                              }
                                              transition={{ duration: 0.5 }}
                                            >
                                              ${payout.toFixed(2)}
                                            </motion.div>
                                            <div className="text-xs text-gray-400">
                                              Potential Payout
                                            </div>
                                          </>
                                        ) : (
                                          <div className="flex items-center text-gray-500">
                                            <AlertCircle className="h-4 w-4 mr-1" />
                                            <span className="text-xs">
                                              Different lines
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      {isBest && (
                                        <motion.div
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          transition={{
                                            type: "spring",
                                            stiffness: 500,
                                            damping: 15,
                                            delay: 0.1,
                                          }}
                                        >
                                          <Badge className="absolute top-1 right-1 bg-primary text-primary-foreground text-[10px] sm:text-xs px-1.5 py-0 whitespace-nowrap">
                                            Best Odds
                                          </Badge>
                                        </motion.div>
                                      )}
                                    </button>
                                  </motion.div>
                                </TooltipTrigger>
                                {!isAvailable && (
                                  <TooltipContent side="top">
                                    <p className="text-sm">
                                      This sportsbook has different lines for
                                      one or more of your selections.
                                    </p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </div>

        {legs.length > 0 &&
          selectedSportsbook &&
          parlayOdds[selectedSportsbook] !== null && (
            <SheetFooter className="p-6 border-t">
              <motion.div
                className="w-full"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                animate={
                  selectedSportsbook === bestOdds.sportsbook
                    ? {
                        boxShadow: [
                          "0 0 0 rgba(var(--primary), 0.3)",
                          "0 0 20px rgba(var(--primary), 0.5)",
                          "0 0 0 rgba(var(--primary), 0.3)",
                        ],
                      }
                    : {}
                }
                transition={
                  selectedSportsbook === bestOdds.sportsbook
                    ? {
                        scale: { type: "spring", stiffness: 400, damping: 17 },
                        boxShadow: {
                          repeat: Infinity,
                          duration: 2,
                        },
                      }
                    : { type: "spring", stiffness: 400, damping: 17 }
                }
              >
                <Button
                  className={cn(
                    "w-full h-14 text-base",
                    selectedSportsbook === bestOdds.sportsbook
                      ? "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary border border-primary/30 shadow-glow"
                      : "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                  )}
                  size="lg"
                  onClick={handlePlaceBet}
                >
                  <span>
                    {selectedSportsbook === bestOdds.sportsbook
                      ? `Place Bet with Best Odds (${
                          sportsbooks.find((sb) => sb.id === selectedSportsbook)
                            ?.name || selectedSportsbook
                        })`
                      : `Place Bet on ${
                          sportsbooks.find((sb) => sb.id === selectedSportsbook)
                            ?.name || selectedSportsbook
                        }`}
                  </span>
                  <ExternalLink className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </SheetFooter>
          )}
      </SheetContent>
    </Sheet>
  );
}
