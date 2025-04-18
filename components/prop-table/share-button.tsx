"use client";

import { useState, useEffect } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";

interface ShareButtonProps {
  player: string;
  line: number;
  statType: string;
  marketKey: string;
  selectedBooks: string[];
  odds: any[]; // Bookmakers data
  sportId?: string; // Optional sport ID
  // Add event ID for refreshing odds
  eventId?: string;
  // Add props for teams and game time
  homeTeam?: string; // Home team name
  awayTeam?: string; // Away team name
  commence_time?: string; // Game start time
  // Add new props for direct linking
  sids?: Record<string, string>; // Map of bookmaker key to SID
  links?: Record<string, string>; // Map of bookmaker key to deep link
  // Add prop for selected bet type (over, under, or both)
  betType?: "over" | "under" | "both";
}

export function ShareButton({
  player,
  line,
  statType,
  marketKey,
  selectedBooks,
  odds,
  sportId = "default", // Default sport ID if none provided
  eventId, // Event ID for refreshing
  homeTeam,
  awayTeam,
  commence_time,
  sids = {}, // Default empty SIDs
  links = {}, // Default empty links
  betType = "both", // Default to sharing both over and under
}: ShareButtonProps) {
  const router = useRouter();
  const [isSharing, setIsSharing] = useState(false);
  
  // Debug logging in development mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('ShareButton rendered with props:', {
        player,
        line,
        statType,
        sportId,
        betType,
        eventId: eventId || '(not provided)',
        homeTeam: homeTeam || '(not provided)',
        awayTeam: awayTeam || '(not provided)',
        commence_time: commence_time || '(not provided)',
        selectedBooksCount: selectedBooks.length,
        hasOdds: Array.isArray(odds) && odds.length > 0
      });
    }
  }, [player, line, statType, sportId, betType, eventId, homeTeam, awayTeam, commence_time, selectedBooks, odds]);

  const handleShare = async () => {
    try {
      setIsSharing(true);
      
      // Filter the odds data to only include selected bookmakers
      const filteredBookmakers = odds.filter(bookmaker => 
        selectedBooks.includes(bookmaker.key)
      ).map(bookmaker => {
        // Create a copy of the bookmaker to modify
        const bookmakerCopy = {...bookmaker};
        
        // If we only want to share specific bet types, filter the outcomes
        if (betType !== "both" && bookmakerCopy.markets) {
          bookmakerCopy.markets = bookmakerCopy.markets.map((market: any) => {
            if (market.key === marketKey && market.outcomes) {
              // Only keep outcomes that match the selected bet type
              const filteredOutcomes = market.outcomes.filter((outcome: any) => {
                if (betType === "over") {
                  return outcome.name === "Over";
                } else if (betType === "under") {
                  return outcome.name === "Under";
                }
                return true; // Keep all outcomes if betType is "both"
              });
              
              return {
                ...market,
                outcomes: filteredOutcomes
              };
            }
            return market;
          });
        }
        
        return bookmakerCopy;
      });

      // Extract SIDs and links for the filtered bookmakers
      const bookmakerSids: Record<string, string> = {};
      const bookmakerLinks: Record<string, string> = {};
      
      // Only copy the SIDs and links that correspond to the selected bet type
      if (betType === "both" || betType === "over") {
        // Copy over SIDs
        Object.entries(sids).forEach(([key, value]) => {
          if (key.endsWith('_over')) {
            bookmakerSids[key] = value;
          }
        });
        
        // Copy over links
        Object.entries(links).forEach(([key, value]) => {
          if (key.endsWith('_over')) {
            bookmakerLinks[key] = value;
          }
        });
      }
      
      if (betType === "both" || betType === "under") {
        // Copy under SIDs
        Object.entries(sids).forEach(([key, value]) => {
          if (key.endsWith('_under')) {
            bookmakerSids[key] = value;
          }
        });
        
        // Copy under links
        Object.entries(links).forEach(([key, value]) => {
          if (key.endsWith('_under')) {
            bookmakerLinks[key] = value;
          }
        });
      }
      
      // Extract any additional SIDs and links from the bookmaker data
      filteredBookmakers.forEach(bookmaker => {
        // If the bookmaker has markets, look for SIDs in outcomes
        if (bookmaker.markets) {
          const market = bookmaker.markets.find((m: any) => m.key === marketKey);
          if (market && market.outcomes) {
            // Find Over/Under outcomes for this line based on bet type
            if (betType === "both" || betType === "over") {
              const overOutcome = market.outcomes.find((o: any) => o.name === "Over" && o.point === line);
              if (overOutcome && overOutcome.sid) {
                bookmakerSids[`${bookmaker.key}_over`] = overOutcome.sid;
              }
              if (overOutcome && overOutcome.link) {
                bookmakerLinks[`${bookmaker.key}_over`] = overOutcome.link;
              }
            }
            
            if (betType === "both" || betType === "under") {
              const underOutcome = market.outcomes.find((o: any) => o.name === "Under" && o.point === line);
              if (underOutcome && underOutcome.sid) {
                bookmakerSids[`${bookmaker.key}_under`] = underOutcome.sid;
              }
              if (underOutcome && underOutcome.link) {
                bookmakerLinks[`${bookmaker.key}_under`] = underOutcome.link;
              }
            }
          }
        }
      });
      
      // Prepare the data to send to the API
      const shareData = {
        player,
        line,
        statType,
        marketKey,
        bookmakers: filteredBookmakers,
        sportId,
        eventId, // Include event ID for refreshing
        // Include team and game time information if available
        homeTeam,
        awayTeam,
        commence_time,
        sids: bookmakerSids,
        links: bookmakerLinks,
        // Include the bet type so the share page knows what to display
        betType,
        // Store the selected bookmakers to ensure refresh consistency
        selectedBooks: selectedBooks
      };
      
      // Log the share data for debugging
      console.log('ShareButton - Data being sent to API:', {
        player: shareData.player,
        line: shareData.line,
        statType: shareData.statType,
        sportId: shareData.sportId,
        betType: shareData.betType,
        eventId: shareData.eventId || '(not provided)',
        homeTeam: shareData.homeTeam,
        awayTeam: shareData.awayTeam,
        commence_time: shareData.commence_time,
        hasBookmakers: Array.isArray(shareData.bookmakers) && shareData.bookmakers.length > 0
      });
      
      // Call the server API to store the data
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shareData),
      });

      if (!response.ok) {
        throw new Error('Failed to create share link');
      }

      // Get the share ID from the response
      const { shareId } = await response.json();
      
      // Navigate to the share page with the ID
      router.push(`/share/${shareId}`);
    } catch (error) {
      console.error("Error sharing prop:", error);
      // Todo: Add error toast here
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            disabled={isSharing}
          >
            <Share2 className={`h-4 w-4 ${isSharing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Share {betType !== "both" ? betType : ""} prop</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Share {betType !== "both" ? betType : ""} prop</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 