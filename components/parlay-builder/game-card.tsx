"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlayerPropsModal } from "./player-props-modal";
import { motion } from "framer-motion";

interface GameCardProps {
  game: any;
  activeSportsbook: string;
  onSelectMarket: (
    game: any,
    marketId: string,
    selection: string,
    sportsbookId: string
  ) => void;
  isMarketSelected: (gameId: string, marketId: string) => boolean;
  formatGameTime: (dateString: string) => string;
  formatGameDate: (dateString: string) => string;
  displayOdds: (odds: number | undefined | null) => string;
  onSelectSportsbook: (id: string) => void;
  selectedSportsbooks: string[];
}

export function GameCard({
  game,
  activeSportsbook,
  onSelectMarket,
  isMarketSelected,
  formatGameTime,
  formatGameDate,
  displayOdds,
  onSelectSportsbook,
  selectedSportsbooks,
}: GameCardProps) {
  const [showPlayerProps, setShowPlayerProps] = useState(false);

  // Handle selecting a player prop
  const handleSelectProp = (prop: any) => {
    onSelectMarket(game, prop.id, prop, activeSportsbook);
  };

  // Get the spread, moneyline, and total markets
  const spreads = game.markets.spread || [];

  // Add detailed logging for debugging
  console.log(
    `Game: ${game.awayTeam.name} @ ${game.homeTeam.name} (ID: ${game.id})`
  );
  console.log(`Sport ID: ${game.sportId}`);
  console.log(`Raw spreads data:`, spreads);

  // For baseball, we need special handling for spreads
  let awaySpread = null;
  let homeSpread = null;

  if (game.sportId?.includes("baseball")) {
    console.log(
      `Baseball game detected: ${game.awayTeam.name} @ ${game.homeTeam.name}`
    );

    // Log all spread outcomes for debugging
    spreads.forEach((spread: any, index: number) => {
      console.log(`Spread ${index + 1}:`, {
        team: spread.team,
        selection: spread.selection,
        name: spread.name,
        line: spread.line,
        point: spread.point,
        odds: spread.odds?.[activeSportsbook],
      });
    });

    // For baseball, try to match by team name first
    const awaySpreadByName = spreads.find((s: any) => {
      const matchesAwayTeam =
        (s.team && s.team.includes(game.awayTeam.name)) ||
        (s.selection && s.selection.includes(game.awayTeam.name)) ||
        (s.name && s.name.includes(game.awayTeam.name));

      if (matchesAwayTeam) {
        console.log(
          `Found away spread by name match for ${game.awayTeam.name}:`,
          s
        );
      }
      return matchesAwayTeam;
    });

    const homeSpreadByName = spreads.find((s: any) => {
      const matchesHomeTeam =
        (s.team && s.team.includes(game.homeTeam.name)) ||
        (s.selection && s.selection.includes(game.homeTeam.name)) ||
        (s.name && s.name.includes(game.homeTeam.name));

      if (matchesHomeTeam) {
        console.log(
          `Found home spread by name match for ${game.homeTeam.name}:`,
          s
        );
      }
      return matchesHomeTeam;
    });

    // If we found matches by name, use them
    if (awaySpreadByName) {
      awaySpread = awaySpreadByName;
      console.log(
        `Using name-matched away spread for ${game.awayTeam.name}:`,
        awaySpread
      );
    }

    if (homeSpreadByName) {
      homeSpread = homeSpreadByName;
      console.log(
        `Using name-matched home spread for ${game.homeTeam.name}:`,
        homeSpread
      );
    }

    // If we still don't have both spreads and we have exactly 2 spreads, try to match by point value
    if ((!awaySpread || !homeSpread) && spreads.length === 2) {
      console.log(
        `Attempting to match spreads by point value for ${game.awayTeam.name} @ ${game.homeTeam.name}`
      );

      // In baseball, check both line and point properties
      const negativeSpread = spreads.find((s: any) => {
        const isNegative = (s.line && s.line < 0) || (s.point && s.point < 0);
        if (isNegative) {
          console.log(`Found negative spread:`, s);
        }
        return isNegative;
      });

      const positiveSpread = spreads.find((s: any) => {
        const isPositive = (s.line && s.line > 0) || (s.point && s.point > 0);
        if (isPositive) {
          console.log(`Found positive spread:`, s);
        }
        return isPositive;
      });

      // In baseball, away teams typically get -1.5
      if (!awaySpread && negativeSpread) {
        awaySpread = negativeSpread;
        console.log(
          `Assigned negative spread to away team ${game.awayTeam.name}:`,
          awaySpread
        );
      }

      // Home teams typically get +1.5
      if (!homeSpread && positiveSpread) {
        homeSpread = positiveSpread;
        console.log(
          `Assigned positive spread to home team ${game.homeTeam.name}:`,
          homeSpread
        );
      }
    }
  } else {
    // For other sports, use the original logic
    awaySpread =
      spreads.find(
        (s: any) => s.team?.toLowerCase() === game.awayTeam.name.toLowerCase()
      ) || null;
    homeSpread =
      spreads.find(
        (s: any) => s.team?.toLowerCase() === game.homeTeam.name.toLowerCase()
      ) || null;

    console.log(
      `Non-baseball game: ${game.awayTeam.name} @ ${game.homeTeam.name}`
    );
    console.log(`Away spread:`, awaySpread);
    console.log(`Home spread:`, homeSpread);
  }

  // Log the final spread assignments
  console.log(`Final away spread for ${game.awayTeam.name}:`, awaySpread);
  console.log(`Final home spread for ${game.homeTeam.name}:`, homeSpread);

  const awayMoneyline = game.markets.moneyline?.[1] || null;
  const homeMoneyline = game.markets.moneyline?.[0] || null;
  const overTotal = game.markets.total?.[0] || null;
  const underTotal = game.markets.total?.[1] || null;

  // Add this function to handle prop selection from the modal
  const handleSelectPropWrapper = (prop: any) => {
    handleSelectProp(prop);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="overflow-hidden mb-3 border-0 shadow-md rounded-xl bg-gradient-to-br from-background to-card/50 hover:shadow-lg transition-all duration-200 mx-1">
          <CardContent className="p-0">
            {/* Desktop View - Improved Sportsbook Style */}
            <div className="hidden sm:block">
              <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-b hover:from-primary/10 hover:to-primary/15 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-base flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-[hsl(var(--emerald-green))]"></span>
                      {game.awayTeam.name} @ {game.homeTeam.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatGameDate(game.startTime)} •{" "}
                      {formatGameTime(game.startTime)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4">
                {/* Add market type labels in the desktop view */}
                <div className="grid grid-cols-4 gap-3 mb-2 px-1">
                  <div className="col-span-1"></div>
                  <div className="col-span-1 text-center">
                    <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground bg-accent/30 px-2 py-0.5 rounded-full">
                      Spread
                    </span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground bg-accent/30 px-2 py-0.5 rounded-full">
                      Moneyline
                    </span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground bg-accent/30 px-2 py-0.5 rounded-full">
                      Total
                    </span>
                  </div>
                </div>

                {/* Away Team Row */}
                <div className="grid grid-cols-4 gap-3 items-center mb-3">
                  <div className="col-span-1 flex items-center">
                    <div className="font-bold text-lg flex items-center gap-2">
                      <div className="w-1 h-5 bg-primary rounded-full"></div>
                      {game.awayTeam.name}
                    </div>
                  </div>
                  <div className="col-span-1">
                    <MarketButton
                      market={awaySpread}
                      gameId={game.id}
                      activeSportsbook={activeSportsbook}
                      onSelect={onSelectMarket}
                      isSelected={isMarketSelected}
                      game={game}
                      displayOdds={displayOdds}
                    />
                  </div>
                  <div className="col-span-1">
                    <MarketButton
                      market={awayMoneyline}
                      gameId={game.id}
                      activeSportsbook={activeSportsbook}
                      onSelect={onSelectMarket}
                      isSelected={isMarketSelected}
                      game={game}
                      displayOdds={displayOdds}
                    />
                  </div>
                  <div className="col-span-1">
                    <MarketButton
                      market={overTotal}
                      gameId={game.id}
                      activeSportsbook={activeSportsbook}
                      onSelect={onSelectMarket}
                      isSelected={isMarketSelected}
                      game={game}
                      displayOdds={displayOdds}
                    />
                  </div>
                </div>

                {/* Home Team Row */}
                <div className="grid grid-cols-4 gap-3 items-center">
                  <div className="col-span-1 flex items-center">
                    <div className="font-bold text-lg flex items-center gap-2">
                      <div className="w-1 h-5 bg-primary rounded-full"></div>
                      {game.homeTeam.name}
                    </div>
                  </div>
                  <div className="col-span-1">
                    <MarketButton
                      market={homeSpread}
                      gameId={game.id}
                      activeSportsbook={activeSportsbook}
                      onSelect={onSelectMarket}
                      isSelected={isMarketSelected}
                      game={game}
                      displayOdds={displayOdds}
                    />
                  </div>
                  <div className="col-span-1">
                    <MarketButton
                      market={homeMoneyline}
                      gameId={game.id}
                      activeSportsbook={activeSportsbook}
                      onSelect={onSelectMarket}
                      isSelected={isMarketSelected}
                      game={game}
                      displayOdds={displayOdds}
                    />
                  </div>
                  <div className="col-span-1">
                    <MarketButton
                      market={underTotal}
                      gameId={game.id}
                      activeSportsbook={activeSportsbook}
                      onSelect={onSelectMarket}
                      isSelected={isMarketSelected}
                      game={game}
                      displayOdds={displayOdds}
                    />
                  </div>
                </div>
              </div>

              {/* More Wagers Button */}
              <div className="px-4 pb-4">
                <motion.div whileHover={{ x: 5 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="ghost"
                    className="w-full justify-between text-primary hover:text-primary hover:bg-secondary/10 border border-primary/20 text-sm transition-all duration-200 group rounded-lg"
                    onClick={() => setShowPlayerProps(true)}
                  >
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 bg-secondary rounded-full"></span>
                      More wagers
                    </span>
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Mobile View - Redesigned Compact Grid Layout */}
            <div className="sm:hidden">
              {/* Game Header */}
              <div className="p-2 bg-gradient-to-r from-primary/5 to-accent/10 border-b">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[hsl(var(--emerald-green))]"></span>
                  {formatGameDate(game.startTime)} •{" "}
                  {formatGameTime(game.startTime)}
                </div>
              </div>

              <div className="p-1.5">
                {/* Away Team Row */}
                <div className="grid grid-cols-4 gap-0.5 items-center mb-1">
                  <div className="col-span-1">
                    <div className="text-xs font-bold truncate flex items-center gap-1">
                      <div className="w-0.5 h-3 bg-primary rounded-full"></div>
                      {game.awayTeam.name}
                    </div>
                  </div>
                  <div className="col-span-1">
                    <MobileMarketButton
                      market={awaySpread}
                      gameId={game.id}
                      activeSportsbook={activeSportsbook}
                      onSelect={onSelectMarket}
                      isSelected={isMarketSelected}
                      game={game}
                      displayOdds={displayOdds}
                    />
                  </div>
                  <div className="col-span-1">
                    <MobileMarketButton
                      market={awayMoneyline}
                      gameId={game.id}
                      activeSportsbook={activeSportsbook}
                      onSelect={onSelectMarket}
                      isSelected={isMarketSelected}
                      game={game}
                      displayOdds={displayOdds}
                    />
                  </div>
                  <div className="col-span-1">
                    <MobileMarketButton
                      market={overTotal}
                      gameId={game.id}
                      activeSportsbook={activeSportsbook}
                      onSelect={onSelectMarket}
                      isSelected={isMarketSelected}
                      game={game}
                      displayOdds={displayOdds}
                      prefix="O"
                    />
                  </div>
                </div>

                {/* Home Team Row */}
                <div className="grid grid-cols-4 gap-0.5 items-center">
                  <div className="col-span-1">
                    <div className="text-xs font-bold truncate flex items-center gap-1">
                      <div className="w-0.5 h-3 bg-primary rounded-full"></div>
                      {game.homeTeam.name}
                    </div>
                  </div>
                  <div className="col-span-1">
                    <MobileMarketButton
                      market={homeSpread}
                      gameId={game.id}
                      activeSportsbook={activeSportsbook}
                      onSelect={onSelectMarket}
                      isSelected={isMarketSelected}
                      game={game}
                      displayOdds={displayOdds}
                    />
                  </div>
                  <div className="col-span-1">
                    <MobileMarketButton
                      market={homeMoneyline}
                      gameId={game.id}
                      activeSportsbook={activeSportsbook}
                      onSelect={onSelectMarket}
                      isSelected={isMarketSelected}
                      game={game}
                      displayOdds={displayOdds}
                    />
                  </div>
                  <div className="col-span-1">
                    <MobileMarketButton
                      market={underTotal}
                      gameId={game.id}
                      activeSportsbook={activeSportsbook}
                      onSelect={onSelectMarket}
                      isSelected={isMarketSelected}
                      game={game}
                      displayOdds={displayOdds}
                      prefix="U"
                    />
                  </div>
                </div>
              </div>

              {/* More Wagers Button */}
              <div className="px-1.5 pb-1.5">
                <motion.div whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="ghost"
                    className="w-full justify-between text-primary hover:text-primary hover:bg-secondary/10 border border-primary/20 h-6 text-xs transition-all duration-200 group rounded-md"
                    onClick={() => setShowPlayerProps(true)}
                  >
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 bg-secondary rounded-full"></span>
                      More wagers
                    </span>
                    <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Player Props Modal */}
      <PlayerPropsModal
        open={showPlayerProps}
        onOpenChange={setShowPlayerProps}
        game={game}
        sportId={game.sportId}
        activeSportsbook={activeSportsbook}
        onSelectProp={handleSelectPropWrapper}
        displayOdds={displayOdds}
        isMarketSelected={isMarketSelected}
        onSelectSportsbook={onSelectSportsbook}
        selectedSportsbooks={selectedSportsbooks}
      />
    </>
  );
}

// Standard Market Button Component (for desktop)
function MarketButton({
  market,
  gameId,
  activeSportsbook,
  onSelect,
  isSelected,
  game,
  displayOdds,
}: {
  market: any;
  gameId: string;
  activeSportsbook: string;
  onSelect: (
    game: any,
    marketId: string,
    selection: string,
    sportsbookId: string
  ) => void;
  isSelected: (gameId: string, marketId: string) => boolean;
  game: any;
  displayOdds: (odds: number | undefined | null) => string;
}) {
  if (!market) {
    return (
      <Button variant="outline" className="w-full h-10 opacity-50" disabled>
        <span className="text-muted-foreground">N/A</span>
      </Button>
    );
  }

  const odds =
    market.odds?.[activeSportsbook] !== undefined
      ? market.odds[activeSportsbook]
      : null;
  const selected = isSelected(gameId, market.id);
  const hasOdds = odds !== null && odds !== undefined;

  // Add logging for the market button
  console.log(
    `Market Button for ${market.team || market.selection || "unknown team"}:`,
    {
      marketId: market.id,
      type: market.type,
      line: market.line,
      point: market.point,
      odds: odds,
      selected: selected,
      hasOdds: hasOdds,
    }
  );

  return (
    <motion.div whileTap={{ scale: 0.97 }}>
      <Button
        variant={selected ? "default" : "outline"}
        className={cn(
          "w-full justify-between h-10 px-3 transition-all duration-200 rounded-lg",
          selected
            ? "bg-gradient-to-br from-primary to-secondary/80 text-primary-foreground shadow-md shadow-primary/20"
            : "bg-background hover:border-primary/50"
        )}
        onClick={() =>
          onSelect(game, market.id, market.selection, activeSportsbook)
        }
        disabled={!hasOdds && !selected}
      >
        <div className="flex items-center">
          {market.line !== undefined && (
            <span
              className={cn(
                "text-sm font-medium",
                selected ? "" : "text-muted-foreground"
              )}
            >
              {market.type === "total"
                ? (market.selection === "Over" ? "O " : "U ") +
                  Math.abs(market.line)
                : (market.line > 0 ? "+" : "") + market.line}
            </span>
          )}
        </div>
        <span
          className={cn(
            "text-sm font-mono tracking-tight",
            !selected && hasOdds
              ? odds > 0
                ? "text-[hsl(var(--emerald-green))] font-bold"
                : "text-[hsl(var(--dark-pastel-red))] font-bold"
              : ""
          )}
        >
          {displayOdds(odds)}
        </span>
      </Button>
    </motion.div>
  );
}

// Compact Mobile Market Button Component
function MobileMarketButton({
  market,
  gameId,
  activeSportsbook,
  onSelect,
  isSelected,
  game,
  displayOdds,
  prefix = "",
}: {
  market: any;
  gameId: string;
  activeSportsbook: string;
  onSelect: (
    game: any,
    marketId: string,
    selection: string,
    sportsbookId: string
  ) => void;
  isSelected: (gameId: string, marketId: string) => boolean;
  game: any;
  displayOdds: (odds: number | undefined | null) => string;
  prefix?: string;
}) {
  if (!market) {
    return (
      <div className="h-8 bg-muted/20 rounded-md flex items-center justify-center">
        <span className="text-muted-foreground text-[10px]">N/A</span>
      </div>
    );
  }

  const odds =
    market.odds?.[activeSportsbook] !== undefined
      ? market.odds[activeSportsbook]
      : null;
  const selected = isSelected(gameId, market.id);
  const hasOdds = odds !== null && odds !== undefined;
  const isPositiveOdds = hasOdds && odds > 0;

  if (!hasOdds && !selected) {
    return (
      <div className="h-8 bg-muted/20 rounded-md flex items-center justify-center opacity-50">
        <span className="text-muted-foreground text-[10px]">N/A</span>
      </div>
    );
  }

  return (
    <motion.div whileTap={{ scale: 0.95 }}>
      <button
        className={cn(
          "h-8 rounded-md flex flex-col items-center justify-center transition-all duration-200 w-full px-0.5",
          selected
            ? "bg-gradient-to-br from-primary to-secondary/80 text-primary-foreground shadow-sm shadow-primary/20"
            : "bg-card/50 hover:bg-card/70"
        )}
        onClick={() =>
          onSelect(game, market.id, market.selection, activeSportsbook)
        }
        disabled={!hasOdds && !selected}
      >
        <div className="flex flex-col items-center">
          {market.line !== undefined && market.type === "total" && (
            <div className="text-[9px] uppercase font-medium leading-tight">
              {prefix || (market.selection === "Over" ? "O " : "U ")}
              {Math.abs(market.line)}
            </div>
          )}
          {market.line !== undefined && market.type !== "total" && (
            <div className="text-[9px] font-medium leading-tight">
              {(market.line > 0 ? "+" : "") + market.line}
            </div>
          )}
          <div
            className={cn(
              "text-[10px] font-mono tracking-tight",
              !selected && isPositiveOdds
                ? "text-[hsl(var(--emerald-green))] font-bold"
                : !selected && hasOdds
                ? "text-[hsl(var(--dark-pastel-red))] font-bold"
                : ""
            )}
          >
            {displayOdds(odds)}
          </div>
        </div>
      </button>
    </motion.div>
  );
}
