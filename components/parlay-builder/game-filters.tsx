"use client";

import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActiveSportsbookSelector } from "./active-sportsbook-selector";
import { SportsbookSelector } from "../sportsbook-selector";
import { cn } from "@/lib/utils";

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
  return (
    <div className="mb-3">
      {/* Mobile View - Compact Controls */}
      <div className="flex flex-col space-y-3 sm:hidden px-2">
        {/* First row: Date and Odds Format */}
        <div className="grid grid-cols-2 gap-2">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full h-10 text-sm">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Date">
                {dateFilter === "today"
                  ? "Today"
                  : dateFilter === "tomorrow"
                  ? "Tomorrow"
                  : dateFilter === "week"
                  ? "This Week"
                  : dateFilter === "all"
                  ? "All Games"
                  : dateFilter}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="tomorrow">Tomorrow</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="all">All Games</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center justify-between gap-2 bg-muted/30 rounded-md px-3 h-10">
            <span className="text-sm font-medium">Odds Format:</span>
            <div className="flex items-center border rounded-md overflow-hidden">
              <button
                className={cn(
                  "h-7 px-2 text-xs font-medium transition-colors",
                  oddsFormat === "american"
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent hover:bg-muted/50 active:bg-muted/70"
                )}
                onClick={() => setOddsFormat("american")}
              >
                US
              </button>
              <button
                className={cn(
                  "h-7 px-2 text-xs font-medium transition-colors",
                  oddsFormat === "decimal"
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent hover:bg-muted/50 active:bg-muted/70"
                )}
                onClick={() => setOddsFormat("decimal")}
              >
                DEC
              </button>
            </div>
          </div>
        </div>

        {/* Second row: Sportsbook selector */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <ActiveSportsbookSelector
              selectedSportsbooks={selectedSportsbooks}
              activeSportsbook={activeSportsbook}
              onSelectSportsbook={setActiveSportsbook}
            />
          </div>
        </div>
      </div>

      {/* Desktop View - Horizontal */}
      <div className="hidden sm:flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Date">
                {dateFilter === "today"
                  ? "Today"
                  : dateFilter === "tomorrow"
                  ? "Tomorrow"
                  : dateFilter === "week"
                  ? "This Week"
                  : dateFilter === "all"
                  ? "All Games"
                  : dateFilter}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="tomorrow">Tomorrow</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="all">All Games</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center h-9 px-2 rounded-md bg-muted/20">
            <span className="text-xs mr-2 text-muted-foreground">Format:</span>
            <div className="flex items-center rounded-md overflow-hidden">
              <button
                className={cn(
                  "h-6 px-2 text-xs font-medium transition-colors",
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
                  "h-6 px-2 text-xs font-medium transition-colors",
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
