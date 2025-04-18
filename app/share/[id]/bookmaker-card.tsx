"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Zap, Award } from "lucide-react";
import { sportsbooks } from "@/data/sportsbooks";
import { cn } from "@/lib/utils";
import { formatAmericanOdds } from "@/lib/odds-api";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Component for handling deeplinks with state parameters
export function DeeplinkButton({
  bookmakerKey,
  betLink,
  price,
  isBest,
}: {
  bookmakerKey: string;
  betLink: string;
  price: number;
  isBest: boolean;
}) {
  const [processedLink, setProcessedLink] = useState(betLink);
  const [userState, setUserState] = useState("NJ"); // Default to NJ

  useEffect(() => {
    // Get user state from local storage using the correct key
    const storedState = localStorage.getItem("oddsmash-user-state") || "NJ";
    setUserState(storedState);

    // Process the link based on bookmaker requirements
    const sportsbook = sportsbooks.find((sb) => sb.id === bookmakerKey);
    if (!sportsbook || !sportsbook.requiresState) {
      setProcessedLink(betLink);
      return;
    }

    // Handle specific sportsbooks that need state in URL
    let formattedLink = betLink;

    if (bookmakerKey === "betmgm") {
      // Replace {state} in the URL with the user's state
      formattedLink = betLink.replace(/{state}/g, storedState.toLowerCase());
    } else if (bookmakerKey === "betrivers") {
      // Check if the link uses our STATECODE placeholder
      if (formattedLink.includes("STATECODE")) {
        // Replace STATECODE with the actual state code
        formattedLink = formattedLink.replace(
          /STATECODE/g,
          storedState.toLowerCase()
        );
      } else {
        // For BetRivers, the base URL includes the state code
        formattedLink = `https://${storedState.toLowerCase()}.betrivers.com/?page=sportsbook`;

        // Extract event ID and other parameters if they exist in the link
        const eventIdMatch = betLink.match(/#event\/(\d+)/);
        const couponMatch = betLink.match(/\?coupon=([^|]+)\|([^|]+)\|([^&]+)/);

        // Add any event parameters if available
        if (eventIdMatch && eventIdMatch[1]) {
          formattedLink += `#event/${eventIdMatch[1]}`;
        }

        // Add coupon parameters if available
        if (couponMatch) {
          formattedLink += `?coupon=${couponMatch[1]}|${couponMatch[2]}|${couponMatch[3]}`;
        }
      }
    } else if (bookmakerKey === "williamhill_us") {
      // Check if the link uses our STATECODE placeholder
      if (formattedLink.includes("STATECODE")) {
        // Replace STATECODE with the actual state code
        formattedLink = formattedLink.replace(
          /STATECODE/g,
          storedState.toLowerCase()
        );
      } else {
        // For Caesars (William Hill), include the state in the URL
        formattedLink = `https://sportsbook.caesars.com/us/${storedState.toLowerCase()}/bet/betslip`;

        // If the original link has selection IDs, preserve them
        const selectionIdsMatch = betLink.match(/selectionIds=([^&]+)/);
        if (selectionIdsMatch && selectionIdsMatch[1]) {
          formattedLink += `?selectionIds=${selectionIdsMatch[1]}`;
        }
      }
    } else if (bookmakerKey === "hardrockbet") {
      // Handle Hard Rock Bet that might need state information
      formattedLink = betLink.replace(/{state}/g, storedState.toLowerCase());
    }

    setProcessedLink(formattedLink);
  }, [bookmakerKey, betLink]);

  return (
    <a
      href={processedLink}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "text-base font-bold hover:underline flex items-center transition-colors group",
        isBest ? "text-primary" : "text-foreground"
      )}
    >
      {formatAmericanOdds(price)}
      <div className="flex items-center ml-1.5 transition-transform group-hover:translate-x-0.5">
        <ExternalLink className="h-3.5 w-3.5" />
      </div>
    </a>
  );
}

// Updated bookmaker card component for the share page
export function BookmakerCard({
  bookmaker,
  sportsbook,
  betType,
  betLink,
  price,
  isBest,
}: {
  bookmaker: any;
  sportsbook: any;
  betType: "Over" | "Under";
  betLink?: string;
  price: number;
  isBest: boolean;
}) {
  return (
    <div
      className={cn(
        "p-2.5 rounded-md flex items-center justify-between transition-all hover:shadow-md",
        isBest
          ? betType === "Over"
            ? "bg-primary/5 hover:bg-primary/10"
            : "bg-destructive/5 hover:bg-destructive/10"
          : "hover:bg-muted"
      )}
    >
      <div className="flex items-center gap-2.5">
        {sportsbook && (
          <div className="w-6 h-6 relative flex-shrink-0 bg-background rounded-md flex items-center justify-center overflow-hidden shadow-sm">
            <img
              src={sportsbook.logo || "/placeholder.svg"}
              alt={sportsbook.name}
              className="w-full h-full object-contain p-0.5"
            />
          </div>
        )}
        <div className="flex flex-col">
          <span className="font-medium text-sm">
            {sportsbook?.name || bookmaker.title || bookmaker.key}
          </span>
          {isBest && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs py-0 h-4 mt-0.5 px-1.5 flex items-center gap-0.5",
                      betType === "Over"
                        ? "text-primary border-primary/30 bg-primary/5"
                        : "text-destructive border-destructive/30 bg-destructive/5"
                    )}
                  >
                    <Award className="h-3 w-3 mr-0.5" />
                    Best Odds
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Best available odds for this bet</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <div className="flex items-center">
        {betLink ? (
          <div className="flex items-center">
            <DeeplinkButton
              bookmakerKey={bookmaker.key}
              betLink={betLink}
              price={price}
              isBest={isBest}
            />
            <Zap
              className={cn(
                "h-3.5 w-3.5 ml-1.5",
                isBest ? "text-primary" : "text-muted-foreground"
              )}
            />
          </div>
        ) : (
          <span
            className={cn(
              "text-base font-bold",
              isBest
                ? betType === "Over"
                  ? "text-primary"
                  : "text-destructive"
                : "text-foreground"
            )}
          >
            {formatAmericanOdds(price)}
          </span>
        )}
      </div>
    </div>
  );
}
