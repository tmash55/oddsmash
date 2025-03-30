"use client";

import { useState } from "react";
import type { Game } from "@/data/sports-data";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { formatOdds } from "@/data/sports-data";

interface GameCardProps {
  game: Game;
  activeSportsbook: string;
  onSelectMarket: (
    game: Game,
    marketId: string,
    selection: string,
    sportsbookId: string
  ) => void;
  isMarketSelected: (gameId: string, marketId: string) => boolean;
  formatGameTime: (dateString: string) => string;
  formatGameDate: (dateString: string) => string;
  displayOdds?: (odds: number) => string;
}

export function GameCard({
  game,
  activeSportsbook,
  onSelectMarket,
  isMarketSelected,
  formatGameTime,
  displayOdds = formatOdds,
}: GameCardProps) {
  const [isPropsOpen, setIsPropsOpen] = useState(false);

  // Helper function to determine text color based on odds
  const getOddsColor = (odds: number) => {
    return odds > 0 ? "text-green-500" : "text-blue-500";
  };

  return (
    <div className="mb-4 pt-2">
      {/* Game Header */}
      <div className="flex items-center mb-2 px-2">
        <div className="flex items-center gap-2">
          <div className="bg-primary/90 text-primary-foreground text-xs font-bold px-2 py-1 rounded">
            SGP
          </div>
          <span className="text-sm text-muted-foreground">
            {formatGameTime(game.startTime)}
          </span>
        </div>
      </div>

      {/* Teams and Markets - Mobile First Layout */}
      <div className="grid grid-cols-4 gap-1">
        {/* Teams Column */}
        <div className="col-span-1 space-y-4 pr-2">
          {/* Away Team */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex-shrink-0 bg-muted/30 rounded-md overflow-hidden">
              <img
                src={game.awayTeam.logo || "/placeholder.svg"}
                alt={game.awayTeam.name}
                className="w-full h-full object-contain p-1"
              />
            </div>
            <div>
              <div className="font-bold text-sm sm:text-base">
                {game.awayTeam.abbreviation}
              </div>
              <div className="text-xs text-muted-foreground">
                {game.awayTeam.record}
              </div>
            </div>
          </div>

          {/* Home Team */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex-shrink-0 bg-muted/30 rounded-md overflow-hidden">
              <img
                src={game.homeTeam.logo || "/placeholder.svg"}
                alt={game.homeTeam.name}
                className="w-full h-full object-contain p-1"
              />
            </div>
            <div>
              <div className="font-bold text-sm sm:text-base">
                {game.homeTeam.abbreviation}
              </div>
              <div className="text-xs text-muted-foreground">
                {game.homeTeam.record}
              </div>
            </div>
          </div>
        </div>

        {/* Betting Markets */}
        <div className="col-span-3 grid grid-cols-3 gap-1">
          {/* Spread Column */}
          <div className="space-y-4">
            {/* Away Team Spread */}
            <button
              onClick={() =>
                onSelectMarket(
                  game,
                  game.markets.spread[1].id,
                  game.markets.spread[1].selection,
                  activeSportsbook
                )
              }
              className={cn(
                "w-full h-14 sm:h-16 flex flex-col items-center justify-center rounded border transition-colors",
                isMarketSelected(game.id, game.markets.spread[1].id)
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:bg-accent/50"
              )}
            >
              <span className="font-medium text-sm">
                {game.markets.spread[1].line > 0 ? "+" : ""}
                {game.markets.spread[1].line}
              </span>
              <span
                className={cn(
                  "font-medium text-sm",
                  getOddsColor(game.markets.spread[1].odds[activeSportsbook])
                )}
              >
                {displayOdds(game.markets.spread[1].odds[activeSportsbook])}
              </span>
            </button>

            {/* Home Team Spread */}
            <button
              onClick={() =>
                onSelectMarket(
                  game,
                  game.markets.spread[0].id,
                  game.markets.spread[0].selection,
                  activeSportsbook
                )
              }
              className={cn(
                "w-full h-14 sm:h-16 flex flex-col items-center justify-center rounded border transition-colors",
                isMarketSelected(game.id, game.markets.spread[0].id)
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:bg-accent/50"
              )}
            >
              <span className="font-medium text-sm">
                {game.markets.spread[0].line > 0 ? "+" : ""}
                {game.markets.spread[0].line}
              </span>
              <span
                className={cn(
                  "font-medium text-sm",
                  getOddsColor(game.markets.spread[0].odds[activeSportsbook])
                )}
              >
                {displayOdds(game.markets.spread[0].odds[activeSportsbook])}
              </span>
            </button>
          </div>

          {/* Moneyline Column */}
          <div className="space-y-4">
            {/* Away Team Moneyline */}
            <button
              onClick={() =>
                onSelectMarket(
                  game,
                  game.markets.moneyline[1].id,
                  game.markets.moneyline[1].selection,
                  activeSportsbook
                )
              }
              className={cn(
                "w-full h-14 sm:h-16 flex flex-col items-center justify-center rounded border transition-colors",
                isMarketSelected(game.id, game.markets.moneyline[1].id)
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:bg-accent/50"
              )}
            >
              <span
                className={cn(
                  "font-medium text-sm",
                  getOddsColor(game.markets.moneyline[1].odds[activeSportsbook])
                )}
              >
                {displayOdds(game.markets.moneyline[1].odds[activeSportsbook])}
              </span>
            </button>

            {/* Home Team Moneyline */}
            <button
              onClick={() =>
                onSelectMarket(
                  game,
                  game.markets.moneyline[0].id,
                  game.markets.moneyline[0].selection,
                  activeSportsbook
                )
              }
              className={cn(
                "w-full h-14 sm:h-16 flex flex-col items-center justify-center rounded border transition-colors",
                isMarketSelected(game.id, game.markets.moneyline[0].id)
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:bg-accent/50"
              )}
            >
              <span
                className={cn(
                  "font-medium text-sm",
                  getOddsColor(game.markets.moneyline[0].odds[activeSportsbook])
                )}
              >
                {displayOdds(game.markets.moneyline[0].odds[activeSportsbook])}
              </span>
            </button>
          </div>

          {/* Total Column */}
          <div className="space-y-4">
            {/* Over */}
            <button
              onClick={() =>
                onSelectMarket(
                  game,
                  game.markets.total[0].id,
                  game.markets.total[0].selection,
                  activeSportsbook
                )
              }
              className={cn(
                "w-full h-14 sm:h-16 flex flex-col items-center justify-center rounded border transition-colors",
                isMarketSelected(game.id, game.markets.total[0].id)
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:bg-accent/50"
              )}
            >
              <span className="font-medium text-sm">
                O {game.markets.total[0].line}
              </span>
              <span
                className={cn(
                  "font-medium text-sm",
                  getOddsColor(game.markets.total[0].odds[activeSportsbook])
                )}
              >
                {displayOdds(game.markets.total[0].odds[activeSportsbook])}
              </span>
            </button>

            {/* Under */}
            <button
              onClick={() =>
                onSelectMarket(
                  game,
                  game.markets.total[1].id,
                  game.markets.total[1].selection,
                  activeSportsbook
                )
              }
              className={cn(
                "w-full h-14 sm:h-16 flex flex-col items-center justify-center rounded border transition-colors",
                isMarketSelected(game.id, game.markets.total[1].id)
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:bg-accent/50"
              )}
            >
              <span className="font-medium text-sm">
                U {game.markets.total[1].line}
              </span>
              <span
                className={cn(
                  "font-medium text-sm",
                  getOddsColor(game.markets.total[1].odds[activeSportsbook])
                )}
              >
                {displayOdds(game.markets.total[1].odds[activeSportsbook])}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* More Props Section */}
      <Collapsible open={isPropsOpen} onOpenChange={setIsPropsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-center py-2 mt-2 text-muted-foreground hover:text-foreground"
          >
            {isPropsOpen ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                <span>Hide Props</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                <span>More wagers</span>
              </>
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
            {/* Player Props Section */}
            {game.markets.playerProps &&
              game.markets.playerProps.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">Player Props</h4>
                  <div className="space-y-2">
                    {game.markets.playerProps.map((market) => (
                      <button
                        key={market.id}
                        onClick={() =>
                          onSelectMarket(
                            game,
                            market.id,
                            market.selection,
                            activeSportsbook
                          )
                        }
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded border transition-colors",
                          isMarketSelected(game.id, market.id)
                            ? "border-primary bg-primary/10"
                            : "border-border bg-card hover:bg-accent/50"
                        )}
                      >
                        <div className="text-left">
                          <div className="text-sm font-medium">
                            {market.selection}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {market.name}
                          </div>
                        </div>
                        <span
                          className={cn(
                            "font-medium text-sm",
                            getOddsColor(market.odds[activeSportsbook])
                          )}
                        >
                          {displayOdds(market.odds[activeSportsbook])}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            {/* Game Props Section */}
            {game.markets.gameProps && game.markets.gameProps.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3">Game Props</h4>
                <div className="space-y-2">
                  {game.markets.gameProps.map((market) => (
                    <button
                      key={market.id}
                      onClick={() =>
                        onSelectMarket(
                          game,
                          market.id,
                          market.selection,
                          activeSportsbook
                        )
                      }
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded border transition-colors",
                        isMarketSelected(game.id, market.id)
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:bg-accent/50"
                      )}
                    >
                      <div className="text-left">
                        <div className="text-sm font-medium">
                          {market.selection}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {market.name}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "font-medium text-sm",
                          getOddsColor(market.odds[activeSportsbook])
                        )}
                      >
                        {displayOdds(market.odds[activeSportsbook])}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
