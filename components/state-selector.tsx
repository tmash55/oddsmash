"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import {
  useSportsbookPreferences,
  STATE_CODES,
  LEGAL_BETTING_STATES,
} from "@/hooks/use-sportsbook-preferences";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

export function StateSelector() {
  const { userState, setUserState } = useSportsbookPreferences();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Group states by legal status
  const legalStates = Object.entries(STATE_CODES)
    .filter(([_, code]) => LEGAL_BETTING_STATES.includes(code))
    .sort((a, b) => a[0].localeCompare(b[0]));

  const otherStates = Object.entries(STATE_CODES)
    .filter(([_, code]) => !LEGAL_BETTING_STATES.includes(code))
    .sort((a, b) => a[0].localeCompare(b[0]));

  const handleStateChange = (stateCode: string) => {
    // Only refresh if the state is actually changing
    if (stateCode !== userState) {
      // Set the new state
      setUserState(stateCode);

      // Close the dropdown
      setOpen(false);

      // Show a toast notification
      toast({
        title: "Location Updated",
        description: `Your location has been updated to ${stateCode}. Refreshing page...`,
        duration: 2000,
      });

      // Add a small delay before refreshing to allow the toast to be seen
      setTimeout(() => {
        // Force a page refresh
        window.location.reload();
      }, 1000);
    } else {
      // Just close the dropdown if the state hasn't changed
      setOpen(false);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 min-w-[3rem] border-border/60 bg-background/80 hover:bg-background/90 hover:border-primary/30 transition-all duration-200"
        >
          {userState}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[220px]">
        <div className="py-1.5 px-2 text-xs font-semibold text-muted-foreground">
          Legal Betting States
        </div>
        <ScrollArea className="h-[200px]">
          {legalStates.map(([stateName, stateCode]) => (
            <DropdownMenuItem
              key={stateCode}
              className={cn(
                "cursor-pointer capitalize",
                userState === stateCode &&
                  "bg-primary/10 text-primary font-medium"
              )}
              onClick={() => handleStateChange(stateCode)}
            >
              <span className="w-8 text-xs font-mono">{stateCode}</span>
              <span>{stateName}</span>
            </DropdownMenuItem>
          ))}

          <div className="py-1.5 px-2 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
            Other States
          </div>

          {otherStates.map(([stateName, stateCode]) => (
            <DropdownMenuItem
              key={stateCode}
              className={cn(
                "cursor-pointer capitalize",
                userState === stateCode &&
                  "bg-primary/10 text-primary font-medium"
              )}
              onClick={() => handleStateChange(stateCode)}
            >
              <span className="w-8 text-xs font-mono">{stateCode}</span>
              <span>{stateName}</span>
            </DropdownMenuItem>
          ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
