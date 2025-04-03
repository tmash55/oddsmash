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
}

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
}: PlayerPropsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerProps, setPlayerProps] = useState<any[]>([]);
  const [activeMarket, setActiveMarket] = useState<string>("");
  const [hasFetched, setHasFetched] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [propData, setPropData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"player" | "game">("player");
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(
    new Set()
  );
  const isMobile = useMediaQuery("(max-width: 640px)");

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

  // Fetch player props when the modal opens
  useEffect(() => {
    if (open && game && activeMarket && !hasFetched) {
      console.log("Fetching props for", { game, activeMarket });
      fetchPlayerProps();
      setHasFetched(true);
    }
  }, [open, game, activeMarket]);

  // Fetch player props from the API
  const fetchPlayerProps = async () => {
    if (!game || !sportId) return;

    setLoading(true);
    setError(null);

    try {
      // Find the market API key
      const market = availableMarkets.find((m) => m.value === activeMarket);
      if (!market) {
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
        }, markets ${marketsToFetch.join(",")}`
      );

      // Add a cache key to prevent redundant API calls
      const cacheKey = `${game.id}-${marketsToFetch.join("-")}`;

      // Check if we already have this data in memory
      if (propData && propData._cacheKey === cacheKey) {
        console.log("Using cached prop data for:", cacheKey);
        // Process the data to extract player props
        const processedProps = processPlayerProps(propData, marketsToFetch);
        setPlayerProps(processedProps);
        setLoading(false);
        return;
      }

      // Fetch player props from your existing API
      const response = await fetch(
        `/api/events/${
          game.id
        }/props?sport=${sportId}&markets=${marketsToFetch.join(
          ","
        )}&bookmakers=${activeSportsbook}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch player props: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Received player props data:", data);

      // Add cache key to the data
      data._cacheKey = cacheKey;

      // Store the full API response for later use
      setPropData(data);

      // Process the data to extract player props
      const processedProps = processPlayerProps(data, marketsToFetch);
      setPlayerProps(processedProps);
    } catch (err: any) {
      console.error("Error fetching player props:", err);
      setError(err.message || "Failed to load player props");
      setPlayerProps([]);
    } finally {
      setLoading(false);
    }
  };

  // Process the API response to extract player props
  const processPlayerProps = (data: any, marketKeys: string[]) => {
    if (!data || !data.bookmakers || data.bookmakers.length === 0) {
      return [];
    }

    const props: any[] = [];

    // Find the active sportsbook data
    const bookmaker = data.bookmakers.find(
      (b: any) => b.key === activeSportsbook
    );
    if (!bookmaker) return [];

    // Process each market
    bookmaker.markets.forEach((market: any) => {
      if (marketKeys.includes(market.key)) {
        // Group outcomes by player and line
        const playerOutcomes = new Map<string, any[]>();

        market.outcomes.forEach((outcome: any) => {
          // Extract player name
          const playerName = outcome.description || outcome.name;

          if (!playerOutcomes.has(playerName)) {
            playerOutcomes.set(playerName, []);
          }

          playerOutcomes.get(playerName)?.push({
            ...outcome,
            marketKey: market.key,
          });
        });

        // Create prop objects for each player
        playerOutcomes.forEach((outcomes, player) => {
          // Find over/under outcomes for each line
          const lines = new Set(outcomes.map((o) => o.point));

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
      }
    });

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
    };

    console.log("Selected player prop:", selectedProp);
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

  // Calculate average for a player (placeholder)
  // const getPlayerAverage = (player: string) => {
  //   // This would normally come from your data
  //   // For now, just generate a random number between 10 and 30
  //   return (Math.random() * 20 + 10).toFixed(1)
  // }

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
      <div key={player} className="py-2 border-b">
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
              {overOptions.map(({ line, prop }) => {
                // Create a unique ID for this prop to check if it's selected
                const propId = `${game.id}-${prop.market}-${player}-${line}-Over`;
                const isSelected = isMarketSelected
                  ? isMarketSelected(game.id, propId)
                  : false;

                return (
                  <button
                    key={`${player}-${line}-over`}
                    onClick={() => handleSelectProp(prop, true)}
                    className={cn(
                      "flex-none h-14 w-14 flex flex-col items-center justify-center border rounded",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-background/50 hover:bg-accent/50 transition-colors",
                      prop.isAlternate && !isSelected && "border-dashed"
                    )}
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
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] md:max-w-[900px] lg:max-w-[1000px] p-0 max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="px-3 py-2 border-b">
          <div className="flex flex-col items-center space-y-1">
            <DialogTitle className="text-base">Player Props</DialogTitle>
            <Badge variant="outline" className="text-xs py-0 h-5">
              {game?.homeTeam?.name} vs {game?.awayTeam?.name}
            </Badge>
          </div>
        </DialogHeader>

        <div className="px-3 py-2 border-b">
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

            <Select value={activeMarket} onValueChange={setActiveMarket}>
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
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm">Loading props...</span>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 text-destructive rounded-lg border border-destructive p-3 text-center">
              <p className="font-medium text-sm">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 text-xs h-7"
                onClick={fetchPlayerProps}
              >
                Retry
              </Button>
            </div>
          ) : activeTab === "player" ? (
            <div>
              {filteredPlayers.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground text-sm">
                    {searchQuery
                      ? "No matching players found"
                      : "No props available"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-1">
                    <h3 className="text-sm font-medium">
                      {getCurrentMarketName()} Over Lines
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Swipe horizontally to see more options
                    </p>
                  </div>

                  {/* Show initial players or all if searching */}
                  {(searchQuery
                    ? filteredPlayers
                    : filteredPlayers.slice(0, initialPlayersToShow)
                  ).map((player) => renderPlayerRow(player))}

                  {/* View more button */}
                  {!searchQuery &&
                    filteredPlayers.length > initialPlayersToShow && (
                      <Button
                        variant="outline"
                        className="w-full mt-2 h-7 text-xs"
                        onClick={() =>
                          setExpandedPlayers(new Set(filteredPlayers))
                        }
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        View {filteredPlayers.length -
                          initialPlayersToShow}{" "}
                        More Players
                      </Button>
                    )}

                  {/* Show expanded players */}
                  {!searchQuery && expandedPlayers.size > 0 && (
                    <div className="mt-2">
                      {filteredPlayers
                        .slice(initialPlayersToShow)
                        .filter((player) => expandedPlayers.has(player))
                        .map((player) => renderPlayerRow(player))}

                      {expandedPlayers.size > 0 && (
                        <Button
                          variant="outline"
                          className="w-full mt-2 h-7 text-xs"
                          onClick={() => setExpandedPlayers(new Set())}
                        >
                          <ChevronUp className="h-3 w-3 mr-1" />
                          Show Less
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground text-sm">
                Game props coming soon
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
