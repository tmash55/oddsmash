"use client";
import { Check, ChevronDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { sportsbooks } from "@/data/sportsbooks";

interface SportsbookSelectorProps {
  selectedSportsbooks: string[];
  activeSportsbook: string;
  onSelectSportsbook: (id: string) => void;
}

export function SportsbookSelector({
  selectedSportsbooks,
  activeSportsbook,
  onSelectSportsbook,
}: SportsbookSelectorProps) {
  // Find the active sportsbook details
  const activeSportsbookDetails = sportsbooks.find(
    (sb) => sb.id === activeSportsbook
  );

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center gap-2 h-9 px-3"
          >
            <div className="w-5 h-5 relative">
              <img
                src={
                  activeSportsbookDetails?.logo ||
                  `/placeholder.svg?height=20&width=20`
                }
                alt={activeSportsbookDetails?.name || "Sportsbook"}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-sm font-medium truncate max-w-[100px]">
              {activeSportsbookDetails?.name || "Select Sportsbook"}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[200px]">
          {selectedSportsbooks.map((sbId) => {
            const sb = sportsbooks.find((s) => s.id === sbId);
            if (!sb) return null;

            return (
              <DropdownMenuItem
                key={sb.id}
                className={cn(
                  "flex items-center gap-2 cursor-pointer",
                  activeSportsbook === sb.id && "bg-primary/10"
                )}
                onClick={() => onSelectSportsbook(sb.id)}
              >
                <div className="w-5 h-5 relative">
                  <img
                    src={sb.logo || `/placeholder.svg?height=20&width=20`}
                    alt={sb.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="flex-1 truncate">{sb.name}</span>
                {activeSportsbook === sb.id && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <HelpCircle className="h-4 w-4" />
              <span className="sr-only">Help</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-[250px]">
            <p>
              Select which sportsbook to display odds from. You can change your
              preferred sportsbooks in settings.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
