"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlayerPropsModal } from "./player-props-modal";

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
}

export function GameCard({
  game,
  activeSportsbook,
  onSelectMarket,
  isMarketSelected,
  formatGameTime,
  formatGameDate,
  displayOdds,
}: GameCardProps) {
  const [showPlayerProps, setShowPlayerProps] = useState(false);

  // Handle selecting a player prop
  const handleSelectProp = (prop: any) => {
    onSelectMarket(game, prop.id, prop, activeSportsbook);
  };

  // Get the spread, moneyline, and total markets
  const awaySpread = game.markets.spread?.[1] || null;
  const homeSpread = game.markets.spread?.[0] || null;
  const awayMoneyline = game.markets.moneyline?.[1] || null;
  const homeMoneyline = game.markets.moneyline?.[0] || null;
  const overTotal = game.markets.total?.[0] || null;
  const underTotal = game.markets.total?.[1] || null;

  return (
    <>
      <Card className="overflow-hidden mb-4 border-0 shadow-sm border-l-2 border-l-primary/30 bg-card/50">
        <CardContent className="p-0">
          {/* Desktop View - Improved Sportsbook Style */}
          <div className="hidden sm:block">
            <div className="p-4 bg-muted/30 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-base">
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
              {/* Away Team Row */}
              <div className="grid grid-cols-4 gap-3 items-center mb-3">
                <div className="col-span-1 flex items-center">
                  <div className="font-medium">{game.awayTeam.name}</div>
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
                  <div className="font-medium">{game.homeTeam.name}</div>
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
              <Button
                variant="ghost"
                className="w-full justify-between text-primary hover:text-primary border border-border/50 text-sm"
                onClick={() => setShowPlayerProps(true)}
              >
                <span>More wagers</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mobile View - Redesigned Compact Grid Layout */}
          <div className="sm:hidden">
            {/* Game Header */}
            <div className="p-2 bg-muted/30 border-b">
              <div className="text-xs text-muted-foreground">
                {formatGameDate(game.startTime)} •{" "}
                {formatGameTime(game.startTime)}
              </div>
            </div>

            <div className="p-2">
              {/* Away Team Row */}
              <div className="grid grid-cols-4 gap-1 items-center mb-1">
                <div className="col-span-1">
                  <div className="text-xs font-medium truncate">
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
              <div className="grid grid-cols-4 gap-1 items-center">
                <div className="col-span-1">
                  <div className="text-xs font-medium truncate">
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
            <div className="px-2 pb-2">
              <Button
                variant="ghost"
                className="w-full justify-between text-primary hover:text-primary border border-border/50 h-7 text-xs"
                onClick={() => setShowPlayerProps(true)}
              >
                <span>More wagers</span>
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Player Props Modal */}
      <PlayerPropsModal
        open={showPlayerProps}
        onOpenChange={setShowPlayerProps}
        game={game}
        sportId={game.sportId}
        activeSportsbook={activeSportsbook}
        onSelectProp={handleSelectProp}
        displayOdds={displayOdds}
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
      <Button variant="outline" className="w-full h-10" disabled>
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

  return (
    <Button
      variant={selected ? "default" : "outline"}
      className={cn(
        "w-full justify-between h-10 px-3",
        selected ? "bg-primary text-primary-foreground" : "bg-background"
      )}
      onClick={() =>
        onSelect(game, market.id, market.selection, activeSportsbook)
      }
      disabled={!hasOdds && !selected}
    >
      <div className="flex items-center">
        {market.line !== undefined && (
          <span className="text-sm">
            {market.type === "total"
              ? (market.selection === "Over" ? "O " : "U ") +
                Math.abs(market.line)
              : (market.line > 0 ? "+" : "") + market.line}
          </span>
        )}
      </div>
      <span
        className={cn(
          "text-sm font-medium",
          !selected && hasOdds
            ? odds > 0
              ? "text-green-500"
              : "text-blue-500"
            : ""
        )}
      >
        {displayOdds(odds)}
      </span>
    </Button>
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
      <div className="h-9 bg-muted/30 rounded flex items-center justify-center">
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
      <div className="h-9 bg-muted/30 rounded flex items-center justify-center opacity-50">
        <span className="text-muted-foreground text-[10px]">N/A</span>
      </div>
    );
  }

  return (
    <button
      className={cn(
        "h-9 rounded flex flex-col items-center justify-center transition-colors w-full px-1",
        selected
          ? "bg-primary text-primary-foreground"
          : "bg-muted/30 hover:bg-muted/50"
      )}
      onClick={() =>
        onSelect(game, market.id, market.selection, activeSportsbook)
      }
      disabled={!hasOdds && !selected}
    >
      <div className="flex flex-col items-center">
        {market.line !== undefined && market.type === "total" && (
          <div className="text-[10px] leading-tight">
            {prefix || (market.selection === "Over" ? "O " : "U ")}
            {Math.abs(market.line)}
          </div>
        )}
        {market.line !== undefined && market.type !== "total" && (
          <div className="text-[10px] leading-tight">
            {(market.line > 0 ? "+" : "") + market.line}
          </div>
        )}
        <div
          className={cn(
            "text-xs font-semibold",
            !selected && isPositiveOdds
              ? "text-green-500"
              : !selected && hasOdds
              ? "text-blue-500"
              : ""
          )}
        >
          {displayOdds(odds)}
        </div>
      </div>
    </button>
  );
}
