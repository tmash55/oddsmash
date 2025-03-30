"use client";

import type { Sport } from "@/data/sports-data";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SportSelectorProps {
  sports: Sport[];
  selectedSport: string;
  onSelectSport: (sportId: string) => void;
}

export function SportSelector({
  sports,
  selectedSport,
  onSelectSport,
}: SportSelectorProps) {
  return (
    <ScrollArea className="w-full" orientation="horizontal">
      <div className="flex space-x-2 pb-2">
        {sports.map((sport) => (
          <button
            key={sport.id}
            onClick={() => onSelectSport(sport.id)}
            className={cn(
              "flex flex-col items-center justify-center px-3 sm:px-4 py-3 rounded-lg border transition-colors min-w-[70px] sm:min-w-[80px]",
              selectedSport === sport.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card hover:bg-accent/50 border-border"
            )}
          >
            <div className="w-6 h-6 mb-1">
              <img
                src={sport.icon || "/placeholder.svg"}
                alt={sport.name}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xs sm:text-sm font-medium">{sport.name}</span>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
