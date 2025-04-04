"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ChevronUp,
  Search,
  X,
  User,
  Trophy,
  Plus,
  ArrowRight,
} from "lucide-react";
import {
  SPORT_MARKETS,
  getMarketsForSport,
  getDefaultMarket,
} from "@/lib/constants/markets";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
// First, add the import for the ActiveSportsbookSelector component
import { ActiveSportsbookSelector } from "./active-sportsbook-selector";
import { sportsbooks } from "@/data/sportsbooks";

// Update the PlayerPropsModalProps interface to include onSelectSportsbook
interface PlayerPropsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: any;
  sportId: string;
  activeSportsbook: string;
  onSelectProp: (prop: any) => void;
  displayOdds: (odds: number) => string;
  onCheckExistingSelection?: (
    playerName: string,
    marketType: string
  ) => boolean;
  isMarketSelected?: (gameId: string, marketId: string) => boolean;
  onSelectSportsbook: (id: string) => void;
  selectedSportsbooks: string[];
}

// Update the function parameters to include the new props
export function PlayerPropsModal({
  open,
  onOpenChange,
  game,
  sportId,
  activeSportsbook,
  onSelectProp,
  displayOdds,
  onCheckExistingSelection,
  isMarketSelected,
  onSelectSportsbook,
  selectedSportsbooks,
}: PlayerPropsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerProps, setPlayerProps] = useState<any[]>([]);
  const [activeMarket, setActiveMarket] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [propData, setPropData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"player" | "game">("player");
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(
    new Set()
  );
  const isMobile = useMediaQuery("(max-width: 640px)");
  const [lastActiveSportsbook, setLastActiveSportsbook] =
    useState<string>(activeSportsbook);

  // Initial number of players to show
  const initialPlayersToShow = 8;

  // Get available markets for this sport
  const availableMarkets = getMarketsForSport(sportId);

  // Set initial active market based on sport
  useEffect(() => {
    if (availableMarkets.length > 0) {
      // Set default market based on sport
      const defaultMarket = getDefaultMarket(sportId);
      setActiveMarket(defaultMarket || availableMarkets[0].value);
    }
  }, [sportId, availableMarkets]);

  // Track sportsbook changes
  useEffect(() => {
    // If the sportsbook has changed, we need to refresh the data
    if (activeSportsbook !== lastActiveSportsbook) {
      console.log(
        `Sportsbook changed from ${lastActiveSportsbook} to ${activeSportsbook}, refreshing data`
      );

      // Clear existing data
      setPropData(null);
      setPlayerProps([]);
      setError(null); // Clear any previous errors

      // Update the last active sportsbook immediately
      setLastActiveSportsbook(activeSportsbook);

      // If the modal is open, fetch new data
      if (open && game && activeMarket) {
        setLoading(true);

        // Fetch immediately instead of using setTimeout
        console.log("Fetching new data for changed sportsbook");
        fetchPlayerProps().catch((err) => {
          console.error("Error fetching props after sportsbook change:", err);
          setError("Failed to load props for this sportsbook");
          setLoading(false);
        });
      }
    }
  }, [activeSportsbook, lastActiveSportsbook, open, game, activeMarket]);

  // Fetch player props when the modal opens or market changes
  useEffect(() => {
    if (open && game && activeMarket) {
      console.log("Fetching props for", {
        game,
        activeMarket,
        activeSportsbook,
      });

      // Reset state before fetching new data
      setPlayerProps([]);
      setError(null);

      // Add a small delay to ensure state is reset before fetching
      // This helps prevent stale data issues
      const timer = setTimeout(() => {
        fetchPlayerProps();
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [open, game, activeMarket]);

  // Add this new useEffect after the other useEffects to force a refresh when sportId changes
  // This will help with NCAAB specifically
  useEffect(() => {
    // This effect specifically handles sport changes (like NBA to NCAAB)
    if (open && sportId && sportId.includes("ncaab")) {
      console.log("NCAAB detected, ensuring fresh data load");

      // Clear any cached data for NCAAB to ensure fresh load
      setPropData(null);

      // If we already have an active market, trigger a fresh fetch
      if (activeMarket) {
        setLoading(true);
        setPlayerProps([]);

        // Small delay to ensure state updates before fetch
        const timer = setTimeout(() => {
          console.log("Forcing fresh NCAAB data fetch");
          fetchPlayerProps();
        }, 100);

        return () => clearTimeout(timer);
      }
    }
  }, [open, sportId]);

  // Fetch player props from the API
  const fetchPlayerProps = async () => {
    if (!game || !sportId) {
      setLoading(false);
      return;
    }

    console.log(
      `Starting fetch for ${activeSportsbook}, market: ${activeMarket}`
    );

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log("Fetch timeout reached");
      setLoading(false);
      setError("Request timed out. Please try again.");
    }, 15000);

    try {
      setLoading(true);
      setError(null);

      // Clear existing player props to avoid showing stale data
      setPlayerProps([]);

      // Find the market API key
      const market = availableMarkets.find((m) => m.value === activeMarket);
      if (!market) {
        clearTimeout(timeoutId);
        throw new Error("Market not found");
      }

      // Determine if we should fetch alternate markets too
      const marketsToFetch = [market.apiKey];

      // If this market has alternates, fetch them too
      if (market.hasAlternates && market.alternateKey) {
        marketsToFetch.push(market.alternateKey);
      }

      console.log(
        `Fetching player props for game ${
          game.id
        }, sport: ${sportId}, markets: ${marketsToFetch.join(
          ","
        )}, sportsbook: ${activeSportsbook}`
      );

      // Add a cache key to prevent redundant API calls - include the sportsbook in the cache key
      const cacheKey = `${game.id}-${marketsToFetch.join(
        "-"
      )}-${activeSportsbook}`;

      // Check if we already have this data in memory
      if (propData && propData._cacheKey === cacheKey) {
        console.log("Using cached prop data for:", cacheKey);
        // Process the data to extract player props
        const processedProps = processPlayerProps(propData, marketsToFetch);
        setPlayerProps(processedProps);
        clearTimeout(timeoutId);
        setLoading(false);
        return;
      }

      // Fetch player props from your existing API
      const apiUrl = `/api/events/${
        game.id
      }/props?sport=${sportId}&markets=${marketsToFetch.join(
        ","
      )}&bookmakers=${activeSportsbook}`;
      console.log("API URL:", apiUrl);

      const response = await fetch(apiUrl);

      clearTimeout(timeoutId); // Clear timeout once we get a response

      if (!response.ok) {
        throw new Error(`Failed to fetch player props: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Received player props data:", data);

      // Log the structure of the data to help debug
      console.log("Data structure:", {
        hasBookmakers: !!data.bookmakers,
        bookmakerCount: data.bookmakers?.length || 0,
        firstBookmaker: data.bookmakers?.[0]?.key || "none",
        marketsInFirstBookmaker: data.bookmakers?.[0]?.markets?.length || 0,
      });

      // Add cache key to the data
      data._cacheKey = cacheKey;

      // Store the full API response for later use
      setPropData(data);

      // Process the data to extract player props
      const processedProps = processPlayerProps(data, marketsToFetch);
      console.log(`Processed ${processedProps.length} player props`);
      setPlayerProps(processedProps);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("Error fetching player props:", err);
      setError(err.message || "Failed to load player props");
      setPlayerProps([]);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      console.log(`Fetch completed for ${activeSportsbook}`);
    }
  };

  // Process the API response to extract player props
  const processPlayerProps = (data: any, marketKeys: string[]) => {
    console.log("Processing player props data:", {
      hasData: !!data,
      hasBookmakers: data?.bookmakers?.length > 0,
      marketKeys,
      sportId, // Log the sport ID to help debug NCAAB issues
      activeSportsbook, // Log the active sportsbook
    });

    if (!data || !data.bookmakers || data.bookmakers.length === 0) {
      console.log("No bookmakers data found");
      return [];
    }

    const props: any[] = [];

    // Find the active sportsbook data
    const bookmaker = data.bookmakers.find(
      (b: any) => b.key === activeSportsbook
    );
    if (!bookmaker) {
      console.log(
        `Active sportsbook ${activeSportsbook} not found in data. Available bookmakers:`,
        data.bookmakers.map((b: any) => b.key).join(", ")
      );
      return [];
    }

    console.log(
      `Found bookmaker ${bookmaker.key} with ${
        bookmaker.markets?.length || 0
      } markets`
    );

    // Special handling for empty markets
    if (!bookmaker.markets || bookmaker.markets.length === 0) {
      console.log(`No markets found for ${activeSportsbook}`);
      return [];
    }

    // Process each market
    bookmaker.markets.forEach((market: any) => {
      console.log(
        `Processing market: ${market.key}, outcomes: ${
          market.outcomes?.length || 0
        }`
      );

      if (marketKeys.includes(market.key)) {
        // Group outcomes by player and line
        const playerOutcomes = new Map<string, any[]>();

        market.outcomes.forEach((outcome: any) => {
          // Extract player name
          const playerName = outcome.description || outcome.name;
          console.log(
            `Found outcome for player: ${playerName}, type: ${outcome.name}, point: ${outcome.point}`
          );

          if (!playerOutcomes.has(playerName)) {
            playerOutcomes.set(playerName, []);
          }

          playerOutcomes.get(playerName)?.push({
            ...outcome,
            marketKey: market.key,
          });
        });

        // Log the number of players found
        console.log(`Found ${playerOutcomes.size} players with outcomes`);

        // Create prop objects for each player
        playerOutcomes.forEach((outcomes, player) => {
          // Find over/under outcomes for each line
          const lines = new Set(outcomes.map((o) => o.point));
          console.log(`Player ${player} has ${lines.size} different lines`);

          lines.forEach((line) => {
            const overOutcome = outcomes.find(
              (o) =>
                o.name === "Over" &&
                o.point === line &&
                o.marketKey === market.key
            );
            const underOutcome = outcomes.find(
              (o) =>
                o.name === "Under" &&
                o.point === line &&
                o.marketKey === market.key
            );

            if (overOutcome || underOutcome) {
              props.push({
                id: `${game.id}-${market.key}-${player}-${line}`,
                player,
                market: market.key,
                marketName: getMarketDisplayName(market.key),
                line,
                overOdds: overOutcome?.price,
                underOdds: underOutcome?.price,
                gameId: game.id,
                // Add additional data for odds comparison
                overOutcome,
                underOutcome,
                // Add flag to identify if this is an alternate market
                isAlternate: market.key.includes("_alternate"),
              });
            }
          });
        });
      } else {
        console.log(
          `Market ${market.key} not in requested markets: ${marketKeys.join(
            ", "
          )}`
        );
      }
    });

    console.log(
      `Returning ${props.length} processed props for ${activeSportsbook}`
    );
    return props;
  };

  // Get display name for market
  const getMarketDisplayName = (key: string) => {
    const market = Object.values(SPORT_MARKETS)
      .flat()
      .find((m) => m.apiKey === key || m.alternateKey === key);

    if (market) {
      // If this is an alternate market, add "Alt" to the label
      if (key.includes("_alternate")) {
        return `${market.label} (Alt)`;
      }
      return market.label;
    }

    return key;
  };

  // Get current market display name
  const getCurrentMarketName = () => {
    const market = availableMarkets.find((m) => m.value === activeMarket);
    return market ? market.label : "Select Market";
  };

  // Group props by player
  const groupedProps = useMemo(() => {
    const grouped: Record<string, any[]> = {};

    playerProps.forEach((prop) => {
      if (!grouped[prop.player]) {
        grouped[prop.player] = [];
      }
      grouped[prop.player].push(prop);
    });

    // Sort each player's props by line value and whether it's an alternate
    Object.keys(grouped).forEach((player) => {
      grouped[player].sort((a, b) => {
        // First sort by whether it's an alternate market
        if (a.isAlternate !== b.isAlternate) {
          return a.isAlternate ? 1 : -1; // Standard markets first
        }
        // Then sort by line value
        return a.line - b.line;
      });
    });

    return grouped;
  }, [playerProps]);

  // Filter players by search query
  const filteredPlayers = useMemo(() => {
    return Object.keys(groupedProps)
      .filter((player) =>
        player.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort();
  }, [groupedProps, searchQuery]);

  // Handle selecting a prop
  const handleSelectProp = (prop: any, isOver: boolean) => {
    // Find the market API key
    const market = availableMarkets.find((m) => m.value === activeMarket);
    if (!market) return;

    // Get the outcome to extract SID if available
    const outcome = isOver ? prop.overOutcome : prop.underOutcome;
    const sid = outcome?.sid || null;

    // Normalize the market key by removing "_alternate" suffix if present
    const normalizedMarketKey = prop.market.replace("_alternate", "");

    // Check if this player already has a selection for this market type
    // We need to check this with the game's parent component that tracks all selections
    const hasExistingSelection = checkForExistingPlayerSelection(
      prop.player,
      normalizedMarketKey
    );

    if (hasExistingSelection) {
      // Show a toast or alert that this selection is not allowed
      toast({
        title: "Selection not allowed",
        description: `You already have a ${getCurrentMarketName()} selection for ${
          prop.player
        }`,
        variant: "destructive",
      });
      return;
    }

    // Create a prop object with all necessary data for odds comparison
    const selectedProp = {
      id: prop.id,
      player: prop.player,
      selection: `${prop.player} ${isOver ? "Over" : "Under"} ${prop.line}`,
      odds: isOver ? prop.overOdds : prop.underOdds,
      type: "player-prop",
      marketKey: prop.market, // Use the actual market key from the prop
      normalizedMarketKey, // Add the normalized key for easier comparison
      line: prop.line,
      betType: isOver ? "Over" : "Under",
      sid: sid, // Add SID if available
      // Include the full game data and prop data for odds comparison
      fullGameData: game,
      fullPropData: propData,
      // Add specific identifiers for finding this prop in other sportsbooks
      propIdentifiers: {
        player: prop.player,
        market: prop.market, // Use the actual market key from the prop
        normalizedMarket: normalizedMarketKey, // Add normalized market key
        line: prop.line,
        betType: isOver ? "Over" : "Under",
        sid: sid, // Add SID to identifiers too
      },
      // Add a flag to indicate this prop already has data loaded
      dataLoaded: true,
      // Add the sportsbook ID
      sportsbookId: activeSportsbook,
    };

    console.log("Selected player prop:", selectedProp);

    // Remove the success toast

    onSelectProp(selectedProp);
    // We're not closing the modal here anymore
  };

  // Add this function to check for existing selections
  // This is a placeholder - the actual implementation will depend on how you track selections
  const checkForExistingPlayerSelection = (
    playerName: string,
    normalizedMarketKey: string
  ) => {
    // Since we're now allowing multiple lines for the same player and market type,
    // we'll always return false to allow the selection
    return false;
  };

  // Clear search query
  const clearSearch = () => {
    setSearchQuery("");
  };

  // Get unique line values for a player
  const getUniqueLines = (playerProps: any[]) => {
    // Fix the Set iteration issue by using Array.from instead of spread operator
    return Array.from(new Set(playerProps.map((prop) => prop.line))).sort(
      (a, b) => a - b
    );
  };

  // Get player avatar placeholder
  const getPlayerAvatar = (playerName: string) => {
    return `/placeholder.svg?height=40&width=40&text=${playerName.charAt(0)}`;
  };

  // Toggle player expansion
  const togglePlayerExpansion = (player: string) => {
    setExpandedPlayers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(player)) {
        newSet.delete(player);
      } else {
        newSet.add(player);
      }
      return newSet;
    });
  };

  // Get player first name and last name
  const getPlayerNames = (fullName: string) => {
    const parts = fullName.split(" ");
    if (parts.length === 1) return { firstName: parts[0], lastName: "" };

    const lastName = parts.pop() || "";
    const firstName = parts.join(" ");

    return { firstName, lastName };
  };

  // Render a player row with horizontally scrollable options
  const renderPlayerRow = (player: string) => {
    const props = groupedProps[player];
    const lines = getUniqueLines(props);

    // Get only the over options
    const overOptions = lines
      .map((line) => {
        const prop = props.find((p) => p.line === line);
        if (!prop || !prop.overOdds) return null;
        return { line, prop };
      })
      .filter(Boolean);

    if (overOptions.length === 0) return null;

    const { firstName, lastName } = getPlayerNames(player);

    return (
      <motion.div
        key={player}
        className="py-2 border-b"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <Avatar className="h-8 w-8 border">
            <AvatarImage src={getPlayerAvatar(player)} alt={player} />
            <AvatarFallback>{player.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex flex-col">
              <span className="font-medium text-sm leading-tight">
                {firstName}
              </span>
              <span className="font-medium text-sm leading-tight">
                {lastName}
              </span>
            </div>
          </div>
        </div>

        <div className="relative">
          <div
            className="overflow-x-auto hide-scrollbar"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div className="flex gap-1 min-w-max">
              {overOptions.map(({ line, prop }, index) => {
                // Create a unique ID for this prop to check if it's selected
                const propId = `${game.id}-${prop.market}-${player}-${line}-Over`;
                const isSelected = isMarketSelected
                  ? isMarketSelected(game.id, propId)
                  : false;

                return (
                  <motion.button
                    key={`${player}-${line}-over`}
                    onClick={() => handleSelectProp(prop, true)}
                    className={cn(
                      "flex-none h-14 w-14 flex flex-col items-center justify-center border rounded",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-background/50 hover:bg-accent/50 transition-colors",
                      prop.isAlternate && !isSelected && "border-dashed"
                    )}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
                  >
                    <div
                      className={cn(
                        "text-xs font-medium",
                        isSelected ? "text-primary-foreground" : ""
                      )}
                    >
                      {line}+
                    </div>
                    <div
                      className={cn(
                        "text-xs font-semibold",
                        isSelected
                          ? "text-primary-foreground"
                          : prop.overOdds > 0
                          ? "text-green-500"
                          : "text-red-500"
                      )}
                    >
                      {displayOdds(prop.overOdds)}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Content height to maintain consistent dialog size
  const contentMinHeight = "min-h-[400px]";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] md:max-w-[900px] lg:max-w-[1000px] p-0 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Update the DialogHeader section to use the ActiveSportsbookSelector */}
        <DialogHeader className="px-3 py-2 border-b bg-gradient-to-r from-background to-muted/30">
          <div className="flex flex-col items-center space-y-1">
            <DialogTitle className="text-base">Player Props</DialogTitle>
            <Badge
              variant="outline"
              className="text-xs py-0 h-5 bg-background/50 backdrop-blur-sm"
            >
              {game?.homeTeam?.name} vs {game?.awayTeam?.name}
            </Badge>
            <div className="mt-1">
              <ActiveSportsbookSelector
                selectedSportsbooks={selectedSportsbooks}
                activeSportsbook={activeSportsbook}
                onSelectSportsbook={onSelectSportsbook}
              />
            </div>
          </div>
        </DialogHeader>

        <div className="px-3 py-2 border-b sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
          <Tabs
            value={activeTab}
            onValueChange={(value: any) => setActiveTab(value)}
            className="mb-2"
          >
            <TabsList className="grid w-full grid-cols-2 h-8">
              <TabsTrigger
                value="player"
                className="flex items-center gap-1 text-xs py-1"
              >
                <User className="h-3 w-3" />
                <span>Player Props</span>
              </TabsTrigger>
              <TabsTrigger
                value="game"
                className="flex items-center gap-1 text-xs py-1"
              >
                <Trophy className="h-3 w-3" />
                <span>Game Props</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                <Search className="h-3 w-3 text-muted-foreground" />
              </div>
              <Input
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-6 pr-6 w-full h-8 text-xs"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute inset-y-0 right-0 flex items-center pr-2 h-full"
                  onClick={clearSearch}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            <Select
              value={activeMarket}
              onValueChange={(value) => {
                console.log("Market changed to:", value);
                setActiveMarket(value);

                // Clear existing data when changing markets
                setPlayerProps([]);
                setLoading(true);
                setPropData(null);

                // Force a re-fetch by adding a timestamp to break cache
                const timestamp = Date.now();
                console.log(`Forcing re-fetch at ${timestamp}`);
              }}
            >
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Select prop type" />
              </SelectTrigger>
              <SelectContent>
                {availableMarkets.map((market) => (
                  <SelectItem
                    key={market.value}
                    value={market.value}
                    className="text-xs"
                  >
                    {market.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main content area with native scrolling */}
        <div className={`flex-1 overflow-y-auto px-3 py-2 ${contentMinHeight}`}>
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                className="flex flex-col items-center justify-center h-full py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1.5,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                  }}
                >
                  <Loader2 className="h-8 w-8 text-primary" />
                </motion.div>
                {/* Update the loading text to use the sportsbook name */}
                <motion.span
                  className="mt-3 text-sm text-muted-foreground"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {(() => {
                    const sb = sportsbooks.find(
                      (s) => s.id === activeSportsbook
                    );
                    return `Loading ${getCurrentMarketName()} props for ${
                      sb?.name || activeSportsbook
                    }...`;
                  })()}
                </motion.span>

                {/* Add a cancel button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setLoading(false);
                    setError("Request cancelled");
                  }}
                >
                  Cancel
                </Button>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                className="bg-destructive/10 text-destructive rounded-lg border border-destructive p-4 text-center my-8"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <p className="font-medium text-sm">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 text-xs h-7"
                  onClick={fetchPlayerProps}
                >
                  Retry
                </Button>
              </motion.div>
            ) : activeTab === "player" ? (
              <motion.div
                key="player-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {filteredPlayers.length === 0 ? (
                  <motion.div
                    className="text-center py-8"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {searchQuery ? (
                      <p className="text-muted-foreground text-sm">
                        No matching players found
                      </p>
                    ) : loading ? (
                      <p className="text-muted-foreground text-sm">
                        Loading props...
                      </p>
                    ) : error ? (
                      <div className="space-y-2">
                        <p className="text-destructive text-sm">{error}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchPlayerProps()}
                          className="mt-2"
                        >
                          Retry
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-muted-foreground text-sm">
                          {(() => {
                            const sb = sportsbooks.find(
                              (s) => s.id === activeSportsbook
                            );
                            return `No ${getCurrentMarketName()} props available from ${
                              sb?.name || activeSportsbook
                            }`;
                          })()}
                        </p>

                        {/* Show alternative sportsbooks if available */}
                        {selectedSportsbooks.length > 1 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium mb-2">
                              Try another sportsbook:
                            </p>
                            <div className="flex flex-wrap justify-center gap-2">
                              {selectedSportsbooks
                                .filter((id) => id !== activeSportsbook)
                                .map((sbId) => {
                                  const sb = sportsbooks.find(
                                    (s) => s.id === sbId
                                  );
                                  if (!sb) return null;

                                  return (
                                    <Button
                                      key={sb.id}
                                      variant="outline"
                                      size="sm"
                                      className="flex items-center gap-1.5"
                                      onClick={() => {
                                        console.log(
                                          `Switching to sportsbook: ${sb.id}`
                                        );
                                        // Clear any existing data and errors before switching
                                        setPropData(null);
                                        setPlayerProps([]);
                                        setError(null);
                                        // Set loading state before switching
                                        setLoading(true);
                                        // Switch the sportsbook - this will trigger the useEffect
                                        onSelectSportsbook(sb.id);
                                      }}
                                    >
                                      <div className="w-4 h-4 relative">
                                        {sb.logo && (
                                          <img
                                            src={sb.logo || "/placeholder.svg"}
                                            alt={sb.name}
                                            className="w-full h-full object-contain"
                                          />
                                        )}
                                      </div>
                                      <span>{sb.name}</span>
                                    </Button>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <>
                    <motion.div
                      className="mb-3 bg-muted/30 p-2 rounded-lg"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h3 className="text-sm font-medium flex items-center">
                        <span className="bg-primary/10 text-primary rounded-full w-5 h-5 inline-flex items-center justify-center mr-1.5">
                          <ArrowRight className="h-3 w-3" />
                        </span>
                        {getCurrentMarketName()} Over Lines
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Swipe horizontally to see more options
                      </p>
                    </motion.div>

                    {/* Show initial players or all if searching */}
                    <AnimatePresence>
                      {(searchQuery
                        ? filteredPlayers
                        : expandedPlayers.size > 0
                        ? filteredPlayers
                        : filteredPlayers.slice(0, initialPlayersToShow)
                      ).map((player) => renderPlayerRow(player))}
                    </AnimatePresence>

                    {/* View more/less button */}
                    {!searchQuery && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                      >
                        {expandedPlayers.size > 0 ? (
                          <Button
                            variant="outline"
                            className="w-full mt-4 h-9 text-xs"
                            onClick={() => setExpandedPlayers(new Set())}
                          >
                            <ChevronUp className="h-3 w-3 mr-1.5" />
                            Show Less
                          </Button>
                        ) : (
                          filteredPlayers.length > initialPlayersToShow && (
                            <Button
                              variant="outline"
                              className="w-full mt-4 h-9 text-xs bg-gradient-to-r from-background to-muted/50 hover:from-muted/30 hover:to-muted/70"
                              onClick={() =>
                                setExpandedPlayers(new Set(filteredPlayers))
                              }
                            >
                              <Plus className="h-3 w-3 mr-1.5" />
                              View{" "}
                              {filteredPlayers.length -
                                initialPlayersToShow}{" "}
                              More Players
                            </Button>
                          )
                        )}
                      </motion.div>
                    )}
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="game-content"
                className="text-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-muted-foreground text-sm">
                  Game props coming soon
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
