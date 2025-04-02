"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ChevronUp,
  ChevronDown,
  Search,
  X,
  Filter,
  ChevronDownIcon,
} from "lucide-react";
import {
  SPORT_MARKETS,
  getMarketsForSport,
  getDefaultMarket,
} from "@/lib/constants/markets";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useMediaQuery } from "@/hooks/use-media-query";

interface PlayerPropsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: any;
  sportId: string;
  activeSportsbook: string;
  onSelectProp: (prop: any) => void;
  displayOdds: (odds: number) => string;
}

export function PlayerPropsModal({
  open,
  onOpenChange,
  game,
  sportId,
  activeSportsbook,
  onSelectProp,
  displayOdds,
}: PlayerPropsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerProps, setPlayerProps] = useState<any[]>([]);
  const [activeMarket, setActiveMarket] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showType, setShowType] = useState<"both" | "over" | "under">("both");
  const [propData, setPropData] = useState<any>(null); // Store the full API response
  const [showFilters, setShowFilters] = useState(false);
  const isMobile = useMediaQuery("(max-width: 640px)");

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
    if (open && game) {
      fetchPlayerProps();
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

      console.log(
        `Fetching player props for game ${game.id}, market ${market.apiKey}`
      );

      // Fetch player props from your existing API
      const response = await fetch(
        `/api/events/${game.id}/props?sport=${sportId}&markets=${market.apiKey}&bookmakers=${activeSportsbook}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch player props: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Received player props data:", data);

      // Store the full API response for later use
      setPropData(data);

      // Process the data to extract player props
      const processedProps = processPlayerProps(data, market.apiKey);
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
  const processPlayerProps = (data: any, marketKey: string) => {
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
      if (market.key === marketKey) {
        // Group outcomes by player and line
        const playerOutcomes = new Map<string, any[]>();

        market.outcomes.forEach((outcome: any) => {
          // Extract player name
          const playerName = outcome.description || outcome.name;

          if (!playerOutcomes.has(playerName)) {
            playerOutcomes.set(playerName, []);
          }

          playerOutcomes.get(playerName)?.push(outcome);
        });

        // Create prop objects for each player
        playerOutcomes.forEach((outcomes, player) => {
          // Find over/under outcomes for each line
          const lines = new Set(outcomes.map((o) => o.point));

          lines.forEach((line) => {
            const overOutcome = outcomes.find(
              (o) => o.name === "Over" && o.point === line
            );
            const underOutcome = outcomes.find(
              (o) => o.name === "Under" && o.point === line
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
      .find((m) => m.apiKey === key);

    return market ? market.label : key;
  };

  // Get current market display name
  const getCurrentMarketName = () => {
    const market = availableMarkets.find((m) => m.value === activeMarket);
    return market ? market.label : "Select Market";
  };

  // Filter props by search query
  const filteredProps = playerProps.filter((prop) =>
    prop.player.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle selecting a prop
  const handleSelectProp = (prop: any, isOver: boolean) => {
    // Find the market API key
    const market = availableMarkets.find((m) => m.value === activeMarket);
    if (!market) return;

    // Get the outcome to extract SID if available
    const outcome = isOver ? prop.overOutcome : prop.underOutcome;
    const sid = outcome?.sid || null;

    // Create a prop object with all necessary data for odds comparison
    const selectedProp = {
      id: prop.id,
      player: prop.player,
      selection: `${prop.player} ${isOver ? "Over" : "Under"} ${prop.line}`,
      odds: isOver ? prop.overOdds : prop.underOdds,
      type: "player-prop",
      marketKey: market.apiKey,
      line: prop.line,
      betType: isOver ? "Over" : "Under",
      sid: sid, // Add SID if available
      // Include the full game data and prop data for odds comparison
      fullGameData: game,
      fullPropData: propData,
      // Add specific identifiers for finding this prop in other sportsbooks
      propIdentifiers: {
        player: prop.player,
        market: market.apiKey,
        line: prop.line,
        betType: isOver ? "Over" : "Under",
        sid: sid, // Add SID to identifiers too
      },
    };

    console.log("Selected player prop:", selectedProp);
    onSelectProp(selectedProp);
    // We're not closing the modal here anymore
  };

  // Clear search query
  const clearSearch = () => {
    setSearchQuery("");
  };

  // Render a prop card
  const renderPropCard = (prop: any) => {
    const showOver = showType === "both" || showType === "over";
    const showUnder = showType === "both" || showType === "under";

    return (
      <Card
        key={prop.id}
        className="overflow-hidden border border-border/60 hover:border-border"
      >
        <CardHeader className="p-3 pb-0">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-sm">{prop.player}</h4>
              <div className="flex items-center mt-1">
                <Badge variant="secondary" className="font-normal text-xs">
                  {prop.marketName} {prop.line}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-2">
          <div className="grid grid-cols-2 gap-2">
            {showOver && (
              <Button
                onClick={() => handleSelectProp(prop, true)}
                variant={prop.overOdds > 0 ? "outline" : "outline"}
                className={cn(
                  "h-auto py-2 justify-between items-center border border-border/60 hover:border-border",
                  prop.overOdds > 0
                    ? "hover:bg-green-500/10"
                    : "hover:bg-blue-500/10"
                )}
                disabled={!prop.overOdds}
              >
                <div className="flex items-center">
                  <ChevronUp
                    className={cn(
                      "h-4 w-4 mr-1",
                      prop.overOdds > 0 ? "text-green-500" : "text-blue-500"
                    )}
                  />
                  <span className="font-medium">Over</span>
                </div>
                <span
                  className={cn(
                    "font-semibold",
                    prop.overOdds > 0 ? "text-green-500" : "text-blue-500"
                  )}
                >
                  {displayOdds(prop.overOdds)}
                </span>
              </Button>
            )}

            {showUnder && (
              <Button
                onClick={() => handleSelectProp(prop, false)}
                variant={prop.underOdds > 0 ? "outline" : "outline"}
                className={cn(
                  "h-auto py-2 justify-between items-center border border-border/60 hover:border-border",
                  prop.underOdds > 0
                    ? "hover:bg-green-500/10"
                    : "hover:bg-blue-500/10"
                )}
                disabled={!prop.underOdds}
              >
                <div className="flex items-center">
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 mr-1",
                      prop.underOdds > 0 ? "text-green-500" : "text-blue-500"
                    )}
                  />
                  <span className="font-medium">Under</span>
                </div>
                <span
                  className={cn(
                    "font-semibold",
                    prop.underOdds > 0 ? "text-green-500" : "text-blue-500"
                  )}
                >
                  {displayOdds(prop.underOdds)}
                </span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] md:max-w-[900px] lg:max-w-[1000px] p-0 max-h-[90vh] flex flex-col">
        <DialogHeader className="p-6 pb-2 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>Player Props</DialogTitle>
            <Badge variant="outline" className="ml-2">
              {getCurrentMarketName()}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {game?.homeTeam?.name} vs {game?.awayTeam?.name}
          </div>
        </DialogHeader>

        <div className="px-6 py-3 border-b">
          {/* Market Selector Dropdown */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto justify-between"
                >
                  <span>{getCurrentMarketName()}</span>
                  <ChevronDownIcon className="ml-2 h-4 w-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-[200px] max-h-[300px] overflow-y-auto"
              >
                {availableMarkets.map((market) => (
                  <DropdownMenuItem
                    key={market.value}
                    className={cn(
                      "cursor-pointer",
                      activeMarket === market.value &&
                        "bg-primary/10 font-medium"
                    )}
                    onClick={() => setActiveMarket(market.value)}
                  >
                    {market.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex-1 relative w-full">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 w-full"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 h-full"
                  onClick={clearSearch}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <Button
              variant={showFilters ? "default" : "outline"}
              size="icon"
              className="sm:hidden"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Filter Controls - Always visible on desktop, toggleable on mobile */}
          <div className={cn("sm:block", !showFilters && "hidden")}>
            <Tabs
              value={showType}
              onValueChange={(value: any) => setShowType(value)}
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="both">Both</TabsTrigger>
                <TabsTrigger value="over">Over</TabsTrigger>
                <TabsTrigger value="under">Under</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* This div is the container for the scrollable content */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full max-h-[calc(90vh-200px)]">
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading props...</span>
                </div>
              ) : error ? (
                <div className="bg-destructive/10 text-destructive rounded-lg border border-destructive p-4 text-center">
                  <p className="font-medium">{error}</p>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={fetchPlayerProps}
                  >
                    Retry
                  </Button>
                </div>
              ) : filteredProps.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? "No matching players found"
                      : "No props available"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProps.map(renderPropCard)}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
