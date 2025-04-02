"use client";

import { useState, useEffect, useCallback } from "react";
import { sports, type Game, type ParlayLeg } from "@/data/sports-data";
import { SportSelector } from "./sport-selector";
import { GameCard } from "./game-card";
import { BetslipButton } from "./betslip-button";
import { Betslip } from "./betslip";
import { ActiveSportsbookSelector } from "./active-sportsbook-selector";
import { toast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Calendar, Filter, SortAsc, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSportsbookPreferences } from "@/hooks/use-sportsbook-preferences";
import { formatOdds } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { SportsbookSelector } from "../sportsbook-selector";

// Define a type for the API event response
interface ApiEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: any[];
}

export function ParlayBuilder() {
  const [selectedSport, setSelectedSport] = useState("baseball_mlb");
  const [games, setGames] = useState<Game[]>([]);
  const [selectedLegs, setSelectedLegs] = useState<ParlayLeg[]>([]);
  const [isBetslipOpen, setIsBetslipOpen] = useState(false);
  const [activeSportsbook, setActiveSportsbook] = useState("draftkings");
  const [dateFilter, setDateFilter] = useState("today");
  const [oddsFormat, setOddsFormat] = useState<"american" | "decimal">(
    "american"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allGames, setAllGames] = useState<Record<string, Game[]>>({});
  const [playerPropsData, setPlayerPropsData] = useState<Record<string, any>>(
    {}
  );

  // Get user's selected sportsbooks from hook
  const { selectedSportsbooks } = useSportsbookPreferences();

  // Set initial active sportsbook from preferences if available
  useEffect(() => {
    if (
      selectedSportsbooks.length > 0 &&
      !selectedSportsbooks.includes(activeSportsbook)
    ) {
      setActiveSportsbook(selectedSportsbooks[0]);
    }
  }, [selectedSportsbooks, activeSportsbook]);

  // Add this near the top of the ParlayBuilder component, after the state declarations
  useEffect(() => {
    console.log(
      "ParlayBuilder - User's selected sportsbooks:",
      selectedSportsbooks
    );
  }, [selectedSportsbooks]);

  // Handle sport selection
  const handleSportSelect = (sportId: string) => {
    console.log(`Selected sport: ${sportId}`);
    setSelectedSport(sportId);
    // No longer clearing selections when changing sports
    // Instead, we'll show the games for the selected sport
    if (allGames[sportId]) {
      setGames(allGames[sportId]);
      setIsLoading(false);
    } else {
      // If we haven't loaded this sport yet, fetch it
      setGames([]);
      setIsLoading(true);
      setError(null);
    }
  };

  // Load events when sport changes
  useEffect(() => {
    async function fetchEvents() {
      // If we already have this sport's games, no need to fetch again
      if (allGames[selectedSport] && allGames[selectedSport].length > 0) {
        setGames(allGames[selectedSport]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log(`Fetching events for sport: ${selectedSport}`);

        // Use the user's selected sportsbooks
        const bookmakers = selectedSportsbooks.join(",");

        const response = await fetch(
          `/api/parlay-builder?sport=${selectedSport}&bookmakers=${bookmakers}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `Failed to fetch events: ${response.statusText}`
          );
        }

        const data = await response.json();

        // Check if we have events data in the response
        if (!data.events || !Array.isArray(data.events)) {
          throw new Error("Invalid response format");
        }

        console.log(
          `Received ${data.events.length} events for ${selectedSport}`
        );

        // Convert API events to our Game format
        const formattedGames = data.events.map((event: any) =>
          formatEventToGame(event)
        );

        // Store in our allGames object and set current games
        setAllGames((prev) => ({
          ...prev,
          [selectedSport]: formattedGames,
        }));
        setGames(formattedGames);
      } catch (err: any) {
        console.error("Error fetching events:", err);
        setError(
          err.message || "Failed to load events. Please try again later."
        );
        setGames([]);
      } finally {
        setIsLoading(false);
      }
    }

    if (selectedSport) {
      fetchEvents();
    }
  }, [selectedSport, selectedSportsbooks, allGames]);

  // Function to convert API event to our Game format
  const formatEventToGame = (event: any): Game => {
    // Extract bookmakers data for odds
    const bookmakerData: { [key: string]: any } = {};

    // Process bookmakers data if available
    if (event.bookmakers && Array.isArray(event.bookmakers)) {
      event.bookmakers.forEach((bookmaker: any) => {
        bookmakerData[bookmaker.key] = {
          key: bookmaker.key,
          title: bookmaker.title,
          markets: {},
          sid: bookmaker.sid || null, // Store the SID if available
        };

        // Process markets
        bookmaker.markets.forEach((market: any) => {
          bookmakerData[bookmaker.key].markets[market.key] = {
            key: market.key,
            outcomes: market.outcomes,
            sid: market.sid || null, // Store the market SID if available
          };
        });
      });
    }

    // Create the game object
    const game: Game = {
      id: event.id,
      sportId: selectedSport,
      startTime: event.commence_time,
      status: "scheduled",
      homeTeam: {
        id: `home-${event.id}`,
        name: event.home_team,
        abbreviation: getTeamAbbreviation(event.home_team),
        logo: `/placeholder.svg?height=40&width=40`,
        record: "",
      },
      awayTeam: {
        id: `away-${event.id}`,
        name: event.away_team,
        abbreviation: getTeamAbbreviation(event.away_team),
        logo: `/placeholder.svg?height=40&width=40`,
        record: "",
      },
      markets: {
        spread: createSpreadMarkets(event, bookmakerData),
        moneyline: createMoneylineMarkets(event, bookmakerData),
        total: createTotalMarkets(event, bookmakerData),
      },
      bookmakerData: bookmakerData, // Store the raw bookmaker data for debugging
    };

    return game;
  };

  // Helper function to create spread markets
  const createSpreadMarkets = (
    event: any,
    bookmakerData: { [key: string]: any }
  ): any[] => {
    const homeSpread: any = {
      id: `spread-home-${event.id}`,
      type: "spread",
      name: "Spread",
      selection: event.home_team,
      odds: {},
      line: 0,
      team: event.home_team,
      sids: {}, // Store SIDs for each sportsbook
    };

    const awaySpread: any = {
      id: `spread-away-${event.id}`,
      type: "spread",
      name: "Spread",
      selection: event.away_team,
      odds: {},
      line: 0,
      team: event.away_team,
      sids: {}, // Store SIDs for each sportsbook
    };

    // Extract spread odds from bookmakers
    Object.keys(bookmakerData).forEach((key) => {
      const bookmaker = bookmakerData[key];
      // Check for alternative market keys for spreads
      const spreadMarket =
        bookmaker.markets.spreads ||
        bookmaker.markets.spread ||
        bookmaker.markets.run_line;
      if (spreadMarket) {
        const homeOutcome = spreadMarket.outcomes.find(
          (o: any) => o.name === event.home_team
        );
        const awayOutcome = spreadMarket.outcomes.find(
          (o: any) => o.name === event.away_team
        );

        if (homeOutcome) {
          homeSpread.odds[key] = homeOutcome.price;
          homeSpread.line = homeOutcome.point;
          // Store SID if available
          if (homeOutcome.sid) {
            homeSpread.sids[key] = homeOutcome.sid;
          } else if (spreadMarket.sid) {
            homeSpread.sids[key] = spreadMarket.sid;
          } else if (bookmaker.sid) {
            homeSpread.sids[key] = bookmaker.sid;
          }
        }

        if (awayOutcome) {
          awaySpread.odds[key] = awayOutcome.price;
          awaySpread.line = awayOutcome.point;
          // Store SID if available
          if (awayOutcome.sid) {
            awaySpread.sids[key] = awayOutcome.sid;
          } else if (spreadMarket.sid) {
            awaySpread.sids[key] = spreadMarket.sid;
          } else if (bookmaker.sid) {
            awaySpread.sids[key] = bookmaker.sid;
          }
        }
      }
    });

    return [homeSpread, awaySpread];
  };

  // Helper function to create moneyline markets
  const createMoneylineMarkets = (
    event: any,
    bookmakerData: { [key: string]: any }
  ): any[] => {
    const homeMoneyline: any = {
      id: `ml-home-${event.id}`,
      type: "moneyline",
      name: "Moneyline",
      selection: event.home_team,
      odds: {},
      team: event.home_team,
      sids: {}, // Store SIDs for each sportsbook
    };

    const awayMoneyline: any = {
      id: `ml-away-${event.id}`,
      type: "moneyline",
      name: "Moneyline",
      selection: event.away_team,
      odds: {},
      team: event.away_team,
      sids: {}, // Store SIDs for each sportsbook
    };

    // Extract moneyline odds from bookmakers
    Object.keys(bookmakerData).forEach((key) => {
      const bookmaker = bookmakerData[key];
      if (bookmaker.markets.h2h) {
        const homeOutcome = bookmaker.markets.h2h.outcomes.find(
          (o: any) => o.name === event.home_team
        );
        const awayOutcome = bookmaker.markets.h2h.outcomes.find(
          (o: any) => o.name === event.away_team
        );

        if (homeOutcome) {
          homeMoneyline.odds[key] = homeOutcome.price;
          // Store SID if available
          if (homeOutcome.sid) {
            homeMoneyline.sids[key] = homeOutcome.sid;
          } else if (bookmaker.markets.h2h.sid) {
            homeMoneyline.sids[key] = bookmaker.markets.h2h.sid;
          } else if (bookmaker.sid) {
            homeMoneyline.sids[key] = bookmaker.sid;
          }
        }

        if (awayOutcome) {
          awayMoneyline.odds[key] = awayOutcome.price;
          // Store SID if available
          if (awayOutcome.sid) {
            awayMoneyline.sids[key] = awayOutcome.sid;
          } else if (bookmaker.markets.h2h.sid) {
            awayMoneyline.sids[key] = bookmaker.markets.h2h.sid;
          } else if (bookmaker.sid) {
            awayMoneyline.sids[key] = bookmaker.sid;
          }
        }
      }
    });

    return [homeMoneyline, awayMoneyline];
  };

  // Helper function to create total markets
  const createTotalMarkets = (
    event: any,
    bookmakerData: { [key: string]: any }
  ): any[] => {
    const overTotal: any = {
      id: `total-over-${event.id}`,
      type: "total",
      name: "Total",
      selection: "Over",
      odds: {},
      line: 0,
      sids: {}, // Store SIDs for each sportsbook
    };

    const underTotal: any = {
      id: `total-under-${event.id}`,
      type: "total",
      name: "Total",
      selection: "Under",
      odds: {},
      line: 0,
      sids: {}, // Store SIDs for each sportsbook
    };

    // Extract total odds from bookmakers
    Object.keys(bookmakerData).forEach((key) => {
      const bookmaker = bookmakerData[key];
      // Check for alternative market keys for totals
      const totalMarket =
        bookmaker.markets.totals ||
        bookmaker.markets.total ||
        bookmaker.markets.over_under;
      if (totalMarket) {
        const overOutcome = totalMarket.outcomes.find(
          (o: any) => o.name === "Over"
        );
        const underOutcome = totalMarket.outcomes.find(
          (o: any) => o.name === "Under"
        );

        if (overOutcome) {
          overTotal.odds[key] = overOutcome.price;
          overTotal.line = overOutcome.point;
          // Store SID if available
          if (overOutcome.sid) {
            overTotal.sids[key] = overOutcome.sid;
          } else if (totalMarket.sid) {
            overTotal.sids[key] = totalMarket.sid;
          } else if (bookmaker.sid) {
            overTotal.sids[key] = bookmaker.sid;
          }
        }

        if (underOutcome) {
          underTotal.odds[key] = underOutcome.price;
          underTotal.line = underOutcome.point;
          // Store SID if available
          if (underOutcome.sid) {
            underTotal.sids[key] = underOutcome.sid;
          } else if (totalMarket.sid) {
            underTotal.sids[key] = totalMarket.sid;
          } else if (bookmaker.sid) {
            underTotal.sids[key] = bookmaker.sid;
          }
        }
      }
    });

    return [overTotal, underTotal];
  };

  // Helper function to get team abbreviation
  const getTeamAbbreviation = (teamName: string): string => {
    // This is a simple implementation - in a real app, you'd have a mapping of team names to abbreviations
    const words = teamName.split(" ");
    if (words.length === 1) {
      return words[0].substring(0, 3).toUpperCase();
    }
    return words[words.length - 1].substring(0, 3).toUpperCase();
  };

  // Fetch player props data for a specific event and market
  const fetchPlayerPropsData = async (
    gameId: string,
    sportId: string,
    marketKey: string
  ) => {
    const cacheKey = `${gameId}-${marketKey}`;

    // Check if we already have this data cached
    if (playerPropsData[cacheKey]) {
      return playerPropsData[cacheKey];
    }

    try {
      console.log(
        `Fetching player props for game ${gameId}, market ${marketKey}`
      );
      const response = await fetch(
        `/api/events/${gameId}/props?sport=${sportId}&markets=${marketKey}&bookmakers=${selectedSportsbooks.join(
          ","
        )}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch player props: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`Received player props data:`, data);

      // Cache the data
      setPlayerPropsData((prev) => ({
        ...prev,
        [cacheKey]: data,
      }));

      return data;
    } catch (error) {
      console.error("Error fetching player props data:", error);
      return null;
    }
  };

  // Check if a new leg conflicts with existing legs
  const checkForConflicts = (
    game: Game,
    marketId: string,
    selection: string | any,
    isPlayerProp: boolean
  ): boolean => {
    // For player props
    if (isPlayerProp) {
      const propData = typeof selection === "object" ? selection : null;
      if (!propData) return false;

      // Check for conflicting player props (same player, same market, same line, opposite bet type)
      return selectedLegs.some((leg) => {
        if (leg.gameId !== game.id || !leg.propData) return false;

        const sameProp =
          leg.propData.player ===
            (propData.player || propData.propIdentifiers?.player) &&
          leg.propData.market ===
            (propData.marketKey || propData.propIdentifiers?.market) &&
          leg.propData.line ===
            (propData.line || propData.propIdentifiers?.line);

        const oppositeSelection =
          (leg.propData.betType === "Over" &&
            (propData.betType === "Under" ||
              propData.propIdentifiers?.betType === "Under")) ||
          (leg.propData.betType === "Under" &&
            (propData.betType === "Over" ||
              propData.propIdentifiers?.betType === "Over"));

        return sameProp && oppositeSelection;
      });
    }

    // For standard markets
    let market: any;
    Object.values(game.markets).forEach((marketGroup) => {
      if (Array.isArray(marketGroup)) {
        const found = marketGroup.find((m) => m.id === marketId);
        if (found) market = found;
      }
    });

    if (!market) return false;

    // Check for conflicting standard markets
    return selectedLegs.some((leg) => {
      if (leg.gameId !== game.id) return false;

      // Find the market for this leg
      let legMarket: any;
      Object.values(game.markets).forEach((marketGroup) => {
        if (Array.isArray(marketGroup)) {
          const found = marketGroup.find((m) => m.id === leg.marketId);
          if (found) legMarket = found;
        }
      });

      if (!legMarket) return false;

      // Check for same market type but different selection
      if (market.type === "total" && legMarket.type === "total") {
        // For totals, check if one is Over and one is Under with the same line
        return (
          market.line === legMarket.line &&
          ((market.selection === "Over" && legMarket.selection === "Under") ||
            (market.selection === "Under" && legMarket.selection === "Over"))
        );
      }

      if (
        (market.type === "spread" && legMarket.type === "spread") ||
        (market.type === "moneyline" && legMarket.type === "moneyline")
      ) {
        // For spreads and moneylines, check if they're for the same game but different teams
        return market.team !== legMarket.team;
      }

      return false;
    });
  };

  // Add or remove a leg from the parlay
  const toggleLeg = async (
    game: Game,
    marketId: string,
    selection: string | any,
    sportsbookId: string
  ) => {
    console.log("toggleLeg called with:", {
      game,
      marketId,
      selection,
      sportsbookId,
    });

    // Check if this is a player prop (selection is an object with player prop data)
    const isPlayerProp =
      typeof selection === "object" &&
      (selection.propIdentifiers || selection.type === "player-prop");

    // Find the market for standard markets
    let market: any;
    if (!isPlayerProp) {
      Object.values(game.markets).forEach((marketGroup) => {
        if (Array.isArray(marketGroup)) {
          const found = marketGroup.find((m) => m.id === marketId);
          if (found) market = found;
        }
      });
    }

    // For player props, create a unique ID
    let propId = "";
    if (isPlayerProp) {
      propId = `${game.id}-${selection.marketKey}-${selection.player}-${selection.line}-${selection.betType}`;
    }

    // Check if this leg already exists
    const existingLegIndex = selectedLegs.findIndex((leg) => {
      if (isPlayerProp) {
        return (
          leg.id === propId ||
          (leg.gameId === game.id &&
            leg.propData &&
            leg.propData.player === selection.player &&
            leg.propData.market === selection.marketKey &&
            leg.propData.line === selection.line &&
            leg.propData.betType === selection.betType)
        );
      } else {
        return leg.gameId === game.id && leg.marketId === marketId;
      }
    });

    if (existingLegIndex >= 0) {
      // Remove the leg
      console.log(
        "ParlayBuilder - Removing leg:",
        selectedLegs[existingLegIndex]
      );
      setSelectedLegs((prev) => prev.filter((_, i) => i !== existingLegIndex));
    } else {
      // Check for conflicts with existing legs
      const hasConflict = checkForConflicts(
        game,
        marketId,
        selection,
        isPlayerProp
      );

      if (hasConflict) {
        toast({
          title: "Selection not allowed",
          description:
            "You cannot select both sides of the same market in a parlay.",
          variant: "destructive",
        });
        return;
      }

      // For player props
      if (isPlayerProp) {
        console.log("Processing player prop selection:", selection);

        // Add the leg with the player prop data
        const newLeg: ParlayLeg = {
          id: propId,
          gameId: game.id,
          marketId: propId, // Use the unique ID as the marketId
          selection: selection.selection,
          odds: selection.odds,
          sportsbookId: sportsbookId,
          type: "player-prop",
          description: `${game.homeTeam.abbreviation} vs ${game.awayTeam.abbreviation}: ${selection.selection}`,
          line: selection.line,
          sid: selection.sid, // Add SID if available
          // Add additional data for odds comparison
          propData: {
            player: selection.player || selection.propIdentifiers?.player,
            market: selection.marketKey || selection.propIdentifiers?.market,
            line: selection.line || selection.propIdentifiers?.line,
            betType: selection.betType || selection.propIdentifiers?.betType,
            sportId: game.sportId,
            sid: selection.sid || selection.propIdentifiers?.sid, // Add SID to propData
          },
        };

        console.log("ParlayBuilder - Adding player prop leg:", newLeg);

        // Log odds from all selected sportsbooks
        console.log("Player Prop Odds Comparison:");

        // Fetch player props data for all sportsbooks if we don't have it yet
        const marketKey =
          selection.marketKey || selection.propIdentifiers?.market;
        if (marketKey) {
          const propsData = await fetchPlayerPropsData(
            game.id,
            game.sportId,
            marketKey
          );

          if (propsData) {
            // Log odds for each sportsbook
            selectedSportsbooks.forEach((sportsbook) => {
              const bookmaker = propsData.bookmakers.find(
                (b: any) => b.key === sportsbook
              );
              if (bookmaker) {
                const market = bookmaker.markets.find(
                  (m: any) => m.key === marketKey
                );
                if (market) {
                  // Find the outcome with exact line match
                  const outcome = market.outcomes.find((o: any) => {
                    return (
                      o.description === newLeg.propData.player &&
                      o.name === newLeg.propData.betType &&
                      o.point === newLeg.propData.line
                    );
                  });

                  if (outcome) {
                    console.log(
                      `  ${sportsbook}: ${formatOdds(outcome.price)} (Line: ${
                        outcome.point
                      }) ${outcome.sid ? `SID: ${outcome.sid}` : ""}`
                    );
                  } else {
                    console.log(`  ${sportsbook}: No exact line match`);
                  }
                } else {
                  console.log(`  ${sportsbook}: Market not found`);
                }
              } else {
                console.log(`  ${sportsbook}: Bookmaker not found`);
              }
            });
          }
        }

        setSelectedLegs((prev) => [...prev, newLeg]);
      } else {
        // Standard market handling (spreads, moneylines, totals)
        if (!market) return;

        // Add the leg
        const newLeg: ParlayLeg = {
          id: `${game.id}-${marketId}`,
          gameId: game.id,
          marketId: marketId,
          selection: selection,
          odds: market.odds?.[sportsbookId] ?? 0,
          sportsbookId: sportsbookId,
          type: market.type,
          description: `${game.homeTeam.abbreviation} vs ${game.awayTeam.abbreviation}: ${selection}`,
          line: market.line ?? 0,
          sid: market.sids?.[sportsbookId], // Store the SID if available
        };

        console.log("ParlayBuilder - Adding leg:", newLeg);
        console.log("ParlayBuilder - Using sportsbook:", sportsbookId);

        // Log odds from all selected sportsbooks
        console.log("Standard Market Odds Comparison:");
        selectedSportsbooks.forEach((sportsbook) => {
          const odds = market.odds?.[sportsbook];
          const sid = market.sids?.[sportsbook];
          if (odds !== undefined) {
            console.log(
              `  ${sportsbook}: ${formatOdds(odds)} (Line: ${
                market.line || "N/A"
              }) ${sid ? `SID: ${sid}` : ""}`
            );
          } else {
            console.log(`  ${sportsbook}: Not available`);
          }
        });

        setSelectedLegs((prev) => [...prev, newLeg]);
      }

      // Calculate and log potential parlay odds
      if (selectedLegs.length > 0) {
        console.log("Potential Parlay Odds (after adding this leg):");
        // This is just a placeholder - the actual calculation happens in the Betslip component
        console.log(
          "  Check Betslip component for full parlay odds calculation"
        );
      }
    }
  };

  // Check if a market is selected
  const isMarketSelected = (gameId: string, marketId: string) => {
    return selectedLegs.some(
      (leg) => leg.gameId === gameId && leg.marketId === marketId
    );
  };

  // Format date for display
  const formatGameTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  // Format date for display
  const formatGameDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Add a function to convert American odds to decimal
  const americanToDecimal = (odds: number | undefined | null): number => {
    if (odds === undefined || odds === null) {
      return 0;
    }

    if (odds > 0) {
      return Number.parseFloat((odds / 100 + 1).toFixed(2));
    } else {
      return Number.parseFloat((100 / Math.abs(odds) + 1).toFixed(2));
    }
  };

  // Add a function to format odds based on the selected format
  const displayOdds = (odds: number | undefined | null): string => {
    if (odds === undefined || odds === null) {
      return "-";
    }

    if (oddsFormat === "american") {
      return formatOdds(odds);
    } else {
      return americanToDecimal(odds).toString();
    }
  };

  // Get all games for the betslip
  const getAllGames = () => {
    return Object.values(allGames).flat();
  };

  // Debug function to log the current state
  const logState = useCallback(() => {
    console.log("Current state:", {
      selectedLegs,
      playerPropsData,
      games: getAllGames(),
    });
  }, [selectedLegs, playerPropsData]);

  // Add a debug button in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Press Ctrl+D to log debug info
        if (e.ctrlKey && e.key === "d") {
          logState();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [logState]);

  // Add this function to the ParlayBuilder component
  // Place it where the other handler functions are defined

  // Clear all legs from the betslip
  const clearAllLegs = () => {
    setSelectedLegs([]);
    console.log("Cleared all legs from betslip");
  };

  return (
    <div className="relative bg-background rounded-lg border p-0 sm:p-4">
      <div className="mb-3 sm:mb-6">
        <SportSelector
          sports={sports}
          selectedSport={selectedSport}
          onSelectSport={handleSportSelect}
        />
      </div>

      {/* Main column headers - only show on desktop */}
      <div className="hidden sm:grid grid-cols-4 mb-4 px-2">
        <div className="col-span-1 font-medium text-muted-foreground">
          {dateFilter.toUpperCase()}
        </div>
        <div className="col-span-3 grid grid-cols-3">
          <div className="text-center font-medium text-muted-foreground">
            SPREAD
          </div>
          <div className="text-center font-medium text-muted-foreground">
            MONEYLINE
          </div>
          <div className="text-center font-medium text-muted-foreground">
            TOTAL
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="mb-3">
        {/* Mobile View - Compact Controls */}
        <div className="flex flex-col space-y-2 sm:hidden">
          <div className="flex items-center justify-between px-2">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[110px] h-8 text-xs">
                <Calendar className="mr-1 h-3 w-3" />
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="tomorrow">Tomorrow</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <Filter className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <SortAsc className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between px-2">
            <div className="flex items-center border rounded-md overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-none h-8 px-2 text-xs",
                  oddsFormat === "american" ? "bg-primary/10" : ""
                )}
                onClick={() => setOddsFormat("american")}
              >
                American
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-none h-8 px-2 text-xs",
                  oddsFormat === "decimal" ? "bg-primary/10" : ""
                )}
                onClick={() => setOddsFormat("decimal")}
              >
                Decimal
              </Button>
            </div>

            <ActiveSportsbookSelector
              selectedSportsbooks={selectedSportsbooks}
              activeSportsbook={activeSportsbook}
              onSelectSportsbook={setActiveSportsbook}
            />
          </div>
        </div>

        {/* Desktop View - Horizontal */}
        <div className="hidden sm:flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[130px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="tomorrow">Tomorrow</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" className="h-10">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>

            <Button variant="outline" size="sm" className="h-10">
              <SortAsc className="mr-2 h-4 w-4" />
              Sort
            </Button>

            <div className="flex items-center border rounded-md overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-none h-10",
                  oddsFormat === "american" ? "bg-primary/10" : ""
                )}
                onClick={() => setOddsFormat("american")}
              >
                American
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-none h-10",
                  oddsFormat === "decimal" ? "bg-primary/10" : ""
                )}
                onClick={() => setOddsFormat("decimal")}
              >
                Decimal
              </Button>
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

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">
            Loading events for{" "}
            {sports.find((s) => s.id === selectedSport)?.name || selectedSport}
            ...
          </span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-destructive/10 text-destructive rounded-lg border border-destructive p-4 text-center">
          <p className="font-medium">{error}</p>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => {
              setIsLoading(true);
              setError(null);
              // Retry fetching events
              const bookmakers = selectedSportsbooks.join(",");
              fetch(
                `/api/parlay-builder?sport=${selectedSport}&bookmakers=${bookmakers}`
              )
                .then((res) => res.json())
                .then((data) => {
                  const formattedGames = data.events.map((event: any) =>
                    formatEventToGame(event)
                  );
                  setAllGames((prev) => ({
                    ...prev,
                    [selectedSport]: formattedGames,
                  }));
                  setGames(formattedGames);
                  setIsLoading(false);
                })
                .catch((err) => {
                  console.error("Error retrying fetch:", err);
                  setError("Failed to load events. Please try again later.");
                  setIsLoading(false);
                });
            }}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Games list */}
      {!isLoading && !error && (
        <div className="space-y-3">
          {games.length === 0 ? (
            <div className="bg-card rounded-lg border p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No Games Available</h3>
              <p className="text-muted-foreground">
                There are no games available for{" "}
                {sports.find((s) => s.id === selectedSport)?.name ||
                  selectedSport}{" "}
                at the moment.
              </p>
            </div>
          ) : (
            games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                activeSportsbook={activeSportsbook}
                onSelectMarket={toggleLeg}
                isMarketSelected={isMarketSelected}
                formatGameTime={formatGameTime}
                formatGameDate={formatGameDate}
                displayOdds={displayOdds}
              />
            ))
          )}
        </div>
      )}

      {/* Debug button in development */}
      {process.env.NODE_ENV === "development" && (
        <Button
          variant="outline"
          size="sm"
          className="absolute bottom-2 right-2 opacity-50 hover:opacity-100"
          onClick={logState}
        >
          Debug
        </Button>
      )}

      {/* Betslip floating button */}
      {selectedLegs.length > 0 && (
        <BetslipButton
          legsCount={selectedLegs.length}
          onClick={() => setIsBetslipOpen(true)}
        />
      )}

      {/* Betslip drawer */}
      <Betslip
        open={isBetslipOpen}
        onOpenChange={setIsBetslipOpen}
        legs={selectedLegs}
        onRemoveLeg={(legId) => {
          setSelectedLegs((prev) => prev.filter((leg) => leg.id !== legId));
        }}
        onClearAll={clearAllLegs}
        games={getAllGames()}
        displayOdds={displayOdds}
        playerPropsData={playerPropsData}
      />
    </div>
  );
}
