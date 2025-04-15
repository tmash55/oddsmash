"use client";

import { useState, useEffect, useCallback } from "react";
import { sports, type Game, type ParlayLeg } from "@/data/sports-data";
import { SportSelector } from "./sport-selector";
import { GameCard } from "./game-card";
import { BetslipButton } from "./betslip-button";
import { Betslip } from "./betslip";
import { toast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useSportsbookPreferences } from "@/hooks/use-sportsbook-preferences";
import { formatOdds } from "@/lib/utils";
// First, add the import for the GameFilters component at the top of the file
import { GameFilters } from "./game-filters";

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

// Define a type for the date filter
type DateFilterType = "today" | "tomorrow" | "week" | "all";

// Add this near the top where we define interfaces
interface MarketOutcome {
  id: string;
  name: string;
  price: number;
  point?: number;
  sid?: string;
  link?: string;
}

export function ParlayBuilder() {
  const [selectedSport, setSelectedSport] = useState("baseball_mlb");
  const [games, setGames] = useState<Game[]>([]);
  const [selectedLegs, setSelectedLegs] = useState<ParlayLeg[]>([]);
  const [isBetslipOpen, setIsBetslipOpen] = useState(false);
  const [activeSportsbook, setActiveSportsbook] = useState("draftkings");
  const [dateFilter, setDateFilter] = useState<DateFilterType>("today");
  const [oddsFormat, setOddsFormat] = useState<"american" | "decimal">(
    "american"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allGames, setAllGames] = useState<Record<string, Game[]>>({});
  const [playerPropsData, setPlayerPropsData] = useState<Record<string, any>>(
    {}
  );
  // Add a new state for filtered games
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);

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

  // Add this effect to ensure we always have an active sport selected
  useEffect(() => {
    // Check if the currently selected sport is active
    const currentSport = sports.find((s) => s.id === selectedSport);
    if (currentSport && currentSport.active === false) {
      // Find the first active sport
      const firstActiveSport = sports.find((s) => s.active !== false);
      if (firstActiveSport) {
        setSelectedSport(firstActiveSport.id);
      }
    }
  }, [selectedSport, sports]);

  // Handle sport selection
  const handleSportSelect = (sportId: string) => {
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
    // Add debug logging

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
      links: {},
      sids: {},
      line: null,
      team: event.home_team,
    };

    const awaySpread: any = {
      id: `spread-away-${event.id}`,
      type: "spread",
      name: "Spread",
      selection: event.away_team,
      odds: {},
      links: {},
      sids: {},
      line: null,
      team: event.away_team,
    };

    Object.keys(bookmakerData).forEach((key) => {
      const bookmaker = bookmakerData[key];
      const spreadMarket =
        bookmaker.markets.spreads ||
        bookmaker.markets.spread ||
        bookmaker.markets.run_line ||
        bookmaker.markets.runline;

      if (!spreadMarket) return;

      const outcomes = spreadMarket.outcomes;

      // Try to match outcomes to home and away teams
      const homeOutcome = outcomes.find((o: any) => o.name === event.home_team);
      const awayOutcome = outcomes.find((o: any) => o.name === event.away_team);

      // Prefer team name match
      if (homeOutcome) {
        homeSpread.odds[key] = homeOutcome.price;
        homeSpread.line = homeOutcome.point;
        if (homeOutcome.sid) homeSpread.sids[key] = homeOutcome.sid;
        if (homeOutcome.link) homeSpread.links[key] = homeOutcome.link;
      }

      if (awayOutcome) {
        awaySpread.odds[key] = awayOutcome.price;
        awaySpread.line = awayOutcome.point;
        if (awayOutcome.sid) awaySpread.sids[key] = awayOutcome.sid;
        if (awayOutcome.link) awaySpread.links[key] = awayOutcome.link;
      }

      // If name match fails, fallback to position-based mapping
      if (!homeOutcome || !awayOutcome) {
        if (outcomes.length === 2) {
          console.warn(`Fallback to outcome order for spread on ${key}`);

          const [first, second] = outcomes;

          // If home isn't assigned yet
          if (!homeOutcome) {
            homeSpread.odds[key] = first.price;
            homeSpread.line = first.point;
            if (first.sid) homeSpread.sids[key] = first.sid;
            if (first.link) homeSpread.links[key] = first.link;
          }

          // If away isn't assigned yet
          if (!awayOutcome) {
            awaySpread.odds[key] = second.price;
            awaySpread.line = second.point;
            if (second.sid) awaySpread.sids[key] = second.sid;
            if (second.link) awaySpread.links[key] = second.link;
          }
        } else {
          console.warn(`Spread market from ${key} does not have 2 outcomes.`);
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
    // For NHL games, we need to swap home and away teams
    const isNHL = selectedSport === "icehockey_nhl";
    const homeTeam = isNHL ? event.away_team : event.home_team;
    const awayTeam = isNHL ? event.home_team : event.away_team;

    const homeMoneyline: any = {
      id: `ml-home-${event.id}`,
      type: "moneyline",
      name: "Moneyline",
      selection: homeTeam,
      odds: {},
      links: {}, // Add links object
      sids: {}, // Store SIDs for each sportsbook
      team: homeTeam,
    };

    const awayMoneyline: any = {
      id: `ml-away-${event.id}`,
      type: "moneyline",
      name: "Moneyline",
      selection: awayTeam,
      odds: {},
      links: {}, // Add links object
      sids: {}, // Store SIDs for each sportsbook
      team: awayTeam,
    };

    // Extract moneyline odds from bookmakers
    Object.keys(bookmakerData).forEach((key) => {
      const bookmaker = bookmakerData[key];
      if (bookmaker.markets.h2h) {
        // For NHL games, we need to swap which team we look for in the outcomes
        const homeOutcome = bookmaker.markets.h2h.outcomes.find(
          (o: any) => o.name === homeTeam
        );
        const awayOutcome = bookmaker.markets.h2h.outcomes.find(
          (o: any) => o.name === awayTeam
        );

        if (homeOutcome) {
          homeMoneyline.odds[key] = homeOutcome.price;
          // Store SID and link if available
          if (homeOutcome.sid) {
            homeMoneyline.sids[key] = homeOutcome.sid;
          }
          if (homeOutcome.link) {
            homeMoneyline.links[key] = homeOutcome.link;
          }
        }

        if (awayOutcome) {
          awayMoneyline.odds[key] = awayOutcome.price;
          // Store SID and link if available
          if (awayOutcome.sid) {
            awayMoneyline.sids[key] = awayOutcome.sid;
          }
          if (awayOutcome.link) {
            awayMoneyline.links[key] = awayOutcome.link;
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
      links: {}, // Add links object
      sids: {}, // Store SIDs for each sportsbook
      line: 0,
    };

    const underTotal: any = {
      id: `total-under-${event.id}`,
      type: "total",
      name: "Total",
      selection: "Under",
      odds: {},
      links: {}, // Add links object
      sids: {}, // Store SIDs for each sportsbook
      line: 0,
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
          // Store SID and link if available
          if (overOutcome.sid) {
            overTotal.sids[key] = overOutcome.sid;
          }
          if (overOutcome.link) {
            overTotal.links[key] = overOutcome.link;
          }
        }

        if (underOutcome) {
          underTotal.odds[key] = underOutcome.price;
          underTotal.line = underOutcome.point;
          // Store SID and link if available
          if (underOutcome.sid) {
            underTotal.sids[key] = underOutcome.sid;
          }
          if (underOutcome.link) {
            underTotal.links[key] = underOutcome.link;
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
      const response = await fetch(
        `/api/events/${gameId}/props?sport=${sportId}&markets=${marketKey}&bookmakers=${selectedSportsbooks.join(
          ","
        )}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch player props: ${response.statusText}`);
      }

      const data = await response.json();

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

  // Add this function to the ParlayBuilder component
  const checkForExistingPlayerSelection = (
    playerName: string,
    marketType: string
  ) => {
    // Check if there's already a selection for this player and market type
    return selectedLegs.some((leg) => {
      // Only check player props
      if (leg.type !== "player-prop" || !leg.propData) return false;

      // Check if this is the same player
      if (leg.propData.player !== playerName) return false;

      // Check if this is the same market type (normalized to remove _alternate suffix)
      const legMarketNormalized = leg.propData.market.replace("_alternate", "");
      return legMarketNormalized === marketType;
    });
  };

  // Add or remove a leg from the parlay
  const toggleLeg = async (
    game: Game,
    marketId: string,
    selection: string | any,
    sportsbookId: string
  ) => {
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
        // Get the player name and normalized market key
        const playerName =
          selection.player || selection.propIdentifiers?.player;
        const marketKey =
          selection.marketKey || selection.propIdentifiers?.market;
        const normalizedMarketKey = marketKey.replace("_alternate", "");

        // Find and remove any existing legs for the same player and market type
        // This ensures only one line per player per market type
        const updatedLegs = selectedLegs.filter((leg) => {
          if (leg.type !== "player-prop" || !leg.propData) return true;

          // If this is the same player and same market type (normalized), remove it
          const legMarketNormalized = leg.propData.market.replace(
            "_alternate",
            ""
          );
          return !(
            leg.propData.player === playerName &&
            legMarketNormalized === normalizedMarketKey
          );
        });

        // Add the leg with the player prop data
        const propSid = selection.sid || selection.propIdentifiers?.sid;
        // Encode # to %23 in the SID if it exists
        const encodedSid = propSid ? propSid.replace(/#/g, "%23") : propSid;

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
          sid: encodedSid, // Use the encoded SID
          // Add additional data for odds comparison
          propData: {
            player: playerName,
            market: marketKey,
            line: selection.line || selection.propIdentifiers?.line,
            betType: selection.betType || selection.propIdentifiers?.betType,
            sportId: game.sportId,
            sid: encodedSid, // Use the same encoded SID
          },
        };

        // Log odds from all selected sportsbooks

        // Fetch player props data for all sportsbooks if we don't have it yet
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
                }
              }
            });
          }
        }

        // Set the updated legs with the new leg added
        setSelectedLegs([...updatedLegs, newLeg]);
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
          link: market.links?.[sportsbookId], // Store the link if available
        };

        selectedSportsbooks.forEach((sportsbook) => {
          const odds = market.odds?.[sportsbook];
          const sid = market.sids?.[sportsbook];
        });

        setSelectedLegs((prev) => [...prev, newLeg]);
      }

      // Calculate and log potential parlay odds
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
  const logState = useCallback(() => {}, [selectedLegs, playerPropsData]);

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
  };

  // Add this helper function near the other formatting functions
  const formatDateForDebug = (date: Date): string => {
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Add a useEffect to filter games based on dateFilter
  useEffect(() => {
    if (!games.length) {
      setFilteredGames([]);
      return;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    let filtered;
    switch (dateFilter) {
      case "today":
        filtered = games.filter((game) => {
          const gameDate = new Date(game.startTime);
          const isToday = gameDate >= today && gameDate < tomorrow;
          if (isToday) {
          }
          return isToday;
        });
        break;
      case "tomorrow":
        filtered = games.filter((game) => {
          const gameDate = new Date(game.startTime);
          const nextDay = new Date(tomorrow);
          nextDay.setDate(nextDay.getDate() + 1);
          const isTomorrow = gameDate >= tomorrow && gameDate < nextDay;
          if (isTomorrow) {
          }
          return isTomorrow;
        });
        break;
      case "week":
        filtered = games.filter((game) => {
          const gameDate = new Date(game.startTime);
          const isThisWeek = gameDate >= today && gameDate < nextWeek;
          if (isThisWeek) {
          }
          return isThisWeek;
        });
        break;
      case "all":
      default:
        filtered = games;
        break;
    }

    setFilteredGames(filtered);
  }, [games, dateFilter]);

  return (
    <div className="relative bg-background sm:rounded-lg sm:border p-0 sm:p-4 w-full max-w-full overflow-hidden">
      <div className="mb-3 sm:mb-6">
        <SportSelector
          sports={sports}
          selectedSport={selectedSport}
          onSelectSport={handleSportSelect}
        />
      </div>

      {/* Filters and Controls */}
      <GameFilters
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        oddsFormat={oddsFormat}
        setOddsFormat={setOddsFormat}
        selectedSportsbooks={selectedSportsbooks}
        activeSportsbook={activeSportsbook}
        setActiveSportsbook={setActiveSportsbook}
      />
      {/* Main column headers - only show on desktop */}
      <div className="hidden sm:grid grid-cols-4 mb-4 px-2">
        <div className="col-span-1 font-medium text-muted-foreground">
          {dateFilter === "today"
            ? "TODAY'S GAMES"
            : dateFilter === "tomorrow"
            ? "TOMORROW'S GAMES"
            : dateFilter === "week"
            ? "THIS WEEK'S GAMES"
            : dateFilter === "all"
            ? "ALL GAMES"
            : "GAMES"}
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
          {filteredGames.length === 0 ? (
            <div className="bg-card rounded-lg border p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No Games Available</h3>
              <p className="text-muted-foreground">
                {games.length > 0
                  ? `There are no games available for ${
                      dateFilter === "today"
                        ? "today"
                        : dateFilter === "tomorrow"
                        ? "tomorrow"
                        : dateFilter === "week"
                        ? "this week"
                        : dateFilter === "all"
                        ? "all"
                        : dateFilter
                    }.`
                  : `There are no games available for ${
                      sports.find((s) => s.id === selectedSport)?.name ||
                      selectedSport
                    } at
                the moment.`}
              </p>
            </div>
          ) : (
            filteredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                activeSportsbook={activeSportsbook}
                onSelectMarket={toggleLeg}
                isMarketSelected={isMarketSelected}
                formatGameTime={formatGameTime}
                formatGameDate={formatGameDate}
                displayOdds={displayOdds}
                onSelectSportsbook={setActiveSportsbook}
                selectedSportsbooks={selectedSportsbooks}
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
