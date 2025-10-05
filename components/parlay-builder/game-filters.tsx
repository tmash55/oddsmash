"use client";

import { useState } from "react";
import { Settings, ChevronDown, Cog } from "lucide-react";
import { DateSelector } from "../date-selector";
import { ActiveSportsbookSelector } from "./active-sportsbook-selector";
import { SportsbookSelector } from "../sportsbook-selector";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Update the type definition to use a union type for dateFilter
interface GameFiltersProps {
  dateFilter: "today" | "tomorrow" | "week" | "all";
  setDateFilter: (value: "today" | "tomorrow" | "week" | "all") => void;
  oddsFormat: "american" | "decimal";
  setOddsFormat: (format: "american" | "decimal") => void;
  selectedSportsbooks: string[];
  activeSportsbook: string;
  setActiveSportsbook: (sportsbook: string) => void;
}

export function GameFilters({
  dateFilter,
  setDateFilter,
  oddsFormat,
  setOddsFormat,
  selectedSportsbooks,
  activeSportsbook,
  setActiveSportsbook,
}: GameFiltersProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="mb-4">
      {/* Mobile View - Streamlined Controls */}
      <div className="sm:hidden px-2">
        <div className="flex items-center gap-2 mb-2">
          {/* Date Filter and Sportsbook on same line with equal widths */}
          <div className="flex-1">
            <DateSelector
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              className="w-full"
            />
          </div>

          {/* Active Sportsbook Selector - Same height as date filter */}
          <div className="flex-1">
            <ActiveSportsbookSelector
              selectedSportsbooks={selectedSportsbooks}
              activeSportsbook={activeSportsbook}
              onSelectSportsbook={setActiveSportsbook}
              className="h-10 w-full"
            />
          </div>

          {/* Settings Button for Odds Format */}
          <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 border-border/60 bg-background/80 hover:bg-background/90 hover:border-primary/30"
              >
                <Cog className="h-4 w-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="end">
              <div className="space-y-3">
                <div className="py-1.5 px-2 text-xs font-medium text-muted-foreground border-b mb-1">
                  Settings
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs text-muted-foreground">
                    Odds Format
                  </div>
                  <div className="flex items-center border rounded-md overflow-hidden">
                    <button
                      className={cn(
                        "flex-1 h-8 px-2 text-xs font-medium transition-colors",
                        oddsFormat === "american"
                          ? "bg-primary text-primary-foreground"
                          : "bg-transparent hover:bg-muted/50 active:bg-muted/70"
                      )}
                      onClick={() => setOddsFormat("american")}
                    >
                      American
                    </button>
                    <button
                      className={cn(
                        "flex-1 h-8 px-2 text-xs font-medium transition-colors",
                        oddsFormat === "decimal"
                          ? "bg-primary text-primary-foreground"
                          : "bg-transparent hover:bg-muted/50 active:bg-muted/70"
                      )}
                      onClick={() => setOddsFormat("decimal")}
                    >
                      Decimal
                    </button>
                  </div>
                </div>
                <div className="pt-1">
                  <SportsbookSelector />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Desktop View - Horizontal Layout */}
      <div className="hidden sm:flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <DateSelector
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            className="w-[140px]"
          />

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1 border-border/60 bg-background/80 hover:bg-background/90 hover:border-primary/30"
              >
                <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm">
                  {oddsFormat === "american" ? "American Odds" : "Decimal Odds"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="start">
              <div className="space-y-3">
                <div className="text-sm font-medium">Odds Format</div>
                <div className="flex items-center border rounded-md overflow-hidden">
                  <button
                    className={cn(
                      "flex-1 h-8 px-2 text-xs font-medium transition-colors",
                      oddsFormat === "american"
                        ? "bg-primary text-primary-foreground"
                        : "bg-transparent hover:bg-muted/50"
                    )}
                    onClick={() => setOddsFormat("american")}
                  >
                    American
                  </button>
                  <button
                    className={cn(
                      "flex-1 h-8 px-2 text-xs font-medium transition-colors",
                      oddsFormat === "decimal"
                        ? "bg-primary text-primary-foreground"
                        : "bg-transparent hover:bg-muted/50"
                    )}
                    onClick={() => setOddsFormat("decimal")}
                  >
                    Decimal
                  </button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-2">
          <ActiveSportsbookSelector
            selectedSportsbooks={selectedSportsbooks}
            activeSportsbook={activeSportsbook}
            onSelectSportsbook={setActiveSportsbook}
          />
          <SportsbookSelector />
        </div>
      </div>
    </div>
  );
}
