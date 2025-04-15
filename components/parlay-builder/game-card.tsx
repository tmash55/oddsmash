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
  // Get the spread, moneyline, and total markets
  const spreads = game.markets.spread || [];

  // console.log(`Sport ID: ${game.sportId}`);  // console.log(`Raw spreads data:`, spreads);
  // Always use team name to match spreads
  const awaySpread = spreads.find((s: any) => s.team === game.awayTeam.name);
  const homeSpread = spreads.find((s: any) => s.team === game.homeTeam.name);

  // Log warning if a spread is missing
  if (!awaySpread || !homeSpread) {
    console.warn("Warning: Could not match all spreads by team name", {
      awaySpreadFound: !!awaySpread,
      homeSpreadFound: !!homeSpread,
      spreads,
    });
  }

  // Find moneyline markets by matching team names
  const moneylineMarkets = game.markets.moneyline || [];
  const awayMoneyline =
    moneylineMarkets.find((m: any) => m.team === game.awayTeam.name) || null;
  const homeMoneyline =
    moneylineMarkets.find((m: any) => m.team === game.homeTeam.name) || null;

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
        <Card className="overflow-hidden mb-3 border border-border/10 shadow-md rounded-xl bg-gradient-to-br from-background to-card/30 hover:shadow-lg transition-all duration-300 mx-1 hover:border-primary/20">
          <CardContent className="p-0">
            {/* Desktop View - Improved Sportsbook Style */}
            <div className="hidden sm:block">
              <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-b hover:from-primary/10 hover:to-primary/15 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-base flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-[hsl(var(--primary))]"></span>
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
                    <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground bg-secondary/40 px-2 py-0.5 rounded-full">
                      Spread
                    </span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground bg-secondary/40 px-2 py-0.5 rounded-full">
                      Moneyline
                    </span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground bg-secondary/40 px-2 py-0.5 rounded-full">
                      Total
                    </span>
                  </div>
                </div>

                {/* Away Team Row */}
                <div className="grid grid-cols-4 gap-3 items-center mb-3">
                  <div className="col-span-1 flex items-center">
                    <div className="font-bold text-lg flex items-center gap-2">
                      <div className="w-1 h-5 bg-[hsl(var(--primary))] rounded-full"></div>
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
                      <div className="w-1 h-5 bg-[hsl(var(--primary))] rounded-full"></div>
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
                    className="w-full justify-between text-primary hover:text-primary hover:bg-secondary/20 border border-primary/20 text-sm transition-all duration-300 group rounded-lg"
                    onClick={() => setShowPlayerProps(true)}
                  >
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 bg-[hsl(var(--primary))/40] rounded-full"></span>
                      More wagers
                    </span>
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Mobile View - Redesigned Compact Grid Layout */}
            <div className="sm:hidden">
              {/* Game Header */}
              <div className="p-2 bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))]"></span>
                  {formatGameDate(game.startTime)} •{" "}
                  {formatGameTime(game.startTime)}
                </div>
              </div>

              <div className="p-1.5">
                {/* Away Team Row */}
                <div className="grid grid-cols-4 gap-0.5 items-center mb-1">
                  <div className="col-span-1">
                    <div className="text-xs font-bold truncate flex items-center gap-1">
                      <div className="w-0.5 h-3 bg-[hsl(var(--primary))] rounded-full"></div>
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
                      <div className="w-0.5 h-3 bg-[hsl(var(--primary))] rounded-full"></div>
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
                    className="w-full justify-between text-primary hover:text-primary hover:bg-secondary/20 border border-primary/20 h-6 text-xs transition-all duration-300 group rounded-md"
                    onClick={() => setShowPlayerProps(true)}
                  >
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 bg-[hsl(var(--primary))/40] rounded-full"></span>
                      More wagers
                    </span>
                    <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-300" />
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

  return (
    <motion.div whileTap={{ scale: 0.97 }}>
      <Button
        variant={selected ? "default" : "outline"}
        className={cn(
          "w-full justify-between h-10 px-3 transition-all duration-300 rounded-lg",
          selected
            ? "bg-[hsl(var(--primary))] border-[hsl(var(--primary))] shadow-md shadow-[hsl(var(--primary))/20]"
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
                selected ? "text-white" : "text-foreground"
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
            selected
              ? "text-white font-bold"
              : hasOdds
              ? "text-blue-500 font-bold"
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
          "h-8 rounded-md flex flex-col items-center justify-center transition-all duration-300 w-full px-0.5",
          selected
            ? "bg-[hsl(var(--primary))] border border-[hsl(var(--primary))] shadow-sm shadow-[hsl(var(--primary))/20]"
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
              selected
                ? "text-white font-bold"
                : hasOdds
                ? "text-blue-500 font-bold"
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
