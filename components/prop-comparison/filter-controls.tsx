"use client";

import { useState } from "react";
import { Search, SortAsc, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getMarketsForSport } from "@/lib/constants/markets";

interface FilterControlsProps {
  sport: string;
  statType: string;
  setStatType: (value: string) => void;
  showType: "both" | "over" | "under";
  setShowType: (value: "both" | "over" | "under") => void;
  playerType: "batter" | "pitcher";
  setPlayerType: (value: "batter" | "pitcher") => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  sortBy: "name" | "best-odds";
  setSortBy: (value: "name" | "best-odds") => void;
}

export function FilterControls({
  sport,
  statType,
  setStatType,
  showType,
  setShowType,
  playerType,
  setPlayerType,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
}: FilterControlsProps) {
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  // Get available stat types for the current sport and player type
  const statTypes = getMarketsForSport(sport).filter((market) => {
    if (sport === "baseball_mlb") {
      const apiKey = market.apiKey.toLowerCase();
      const marketLabel = market.label.toLowerCase();

      if (playerType === "pitcher") {
        // Include markets that start with "pitcher_" OR contain "strikeout" for pitchers
        return (
          apiKey.startsWith("pitcher_") ||
          apiKey.includes("strikeout") ||
          marketLabel.includes("strikeout")
        );
      } else {
        // For batters, exclude pitcher-specific markets and strikeouts
        return (
          apiKey.startsWith("batter_") &&
          !apiKey.includes("strikeout") &&
          !marketLabel.includes("strikeout")
        );
      }
    }
    return true;
  });

  return (
    <div className="space-y-2">
      {/* Player Type + Market Selection (combined row) */}
      {sport === "baseball_mlb" && (
        <div className="space-y-2">
          {/* Player Type Toggle - Larger and more prominent */}
          <div className="flex rounded-md overflow-hidden border w-full">
            <Button
              type="button"
              variant={playerType === "batter" ? "default" : "outline"}
              size="sm"
              className={cn(
                "rounded-none border-0 px-4 py-2 h-10 text-sm font-medium flex-1",
                playerType === "batter"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background"
              )}
              onClick={() => {
                if (playerType !== "batter") {
                  setPlayerType("batter");
                }
              }}
            >
              Batter Props
            </Button>
            <Button
              type="button"
              variant={playerType === "pitcher" ? "default" : "outline"}
              size="sm"
              className={cn(
                "rounded-none border-0 px-4 py-2 h-10 text-sm font-medium flex-1",
                playerType === "pitcher"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background"
              )}
              onClick={() => {
                if (playerType !== "pitcher") {
                  setPlayerType("pitcher");
                }
              }}
            >
              Pitcher Props
            </Button>
          </div>

          {/* Prop Type Dropdown - Now on its own row */}
          <div className="flex gap-2 items-center">
            <Select value={statType} onValueChange={setStatType}>
              <SelectTrigger className="h-9 text-xs sm:text-sm flex-1">
                <SelectValue placeholder="Select stat" />
              </SelectTrigger>
              <SelectContent>
                {statTypes.map((stat) => (
                  <SelectItem
                    key={stat.value}
                    value={stat.value}
                    className="text-xs"
                  >
                    {stat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 flex-shrink-0"
                  >
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    Select the type of player prop to compare
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}

      {/* For non-baseball sports, just show the market selector */}
      {sport !== "baseball_mlb" && (
        <div className="flex gap-2 items-center">
          <Select value={statType} onValueChange={setStatType}>
            <SelectTrigger className="h-9 text-xs sm:text-sm flex-1">
              <SelectValue placeholder="Select stat type" />
            </SelectTrigger>
            <SelectContent>
              {statTypes.map((stat) => (
                <SelectItem
                  key={stat.value}
                  value={stat.value}
                  className="text-xs sm:text-sm"
                >
                  {stat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 flex-shrink-0"
                >
                  <Info className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  Select the type of player prop to compare
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Over/Under Toggle + Search/Sort (combined row) */}
      <div className="flex gap-2 items-center">
        {/* Over/Under Toggle - Pill Style */}
        <div className="flex rounded-full overflow-hidden border bg-muted/30 p-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-full px-3 py-0.5 h-7 text-xs",
              showType === "both"
                ? "bg-primary text-primary-foreground font-medium shadow-sm"
                : "hover:bg-background/50"
            )}
            onClick={() => setShowType("both")}
          >
            Both
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-full px-3 py-0.5 h-7 text-xs",
              showType === "over"
                ? "bg-primary text-primary-foreground font-medium shadow-sm"
                : "hover:bg-background/50"
            )}
            onClick={() => setShowType("over")}
          >
            Over
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-full px-3 py-0.5 h-7 text-xs",
              showType === "under"
                ? "bg-primary text-primary-foreground font-medium shadow-sm"
                : "hover:bg-background/50"
            )}
            onClick={() => setShowType("under")}
          >
            Under
          </Button>
        </div>

        {/* Search + Sort */}
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-xs sm:text-sm"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-9 w-9 p-0 flex-shrink-0"
          onClick={() => setSortBy(sortBy === "name" ? "best-odds" : "name")}
          title={sortBy === "name" ? "Sort by best odds" : "Sort by name"}
        >
          <SortAsc className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
