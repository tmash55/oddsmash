"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  SPORT_MARKETS,
  getMarketsForSport,
  getDefaultMarket,
} from "@/lib/constants/markets";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

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
  const tabsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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

  // Check if tabs can be scrolled
  useEffect(() => {
    const checkScroll = () => {
      if (tabsRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
      }
    };

    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [open, activeMarket]);

  // Scroll tabs left or right
  const scrollTabs = (direction: "left" | "right") => {
    if (tabsRef.current) {
      const scrollAmount = 200; // Adjust as needed
      const newScrollLeft =
        direction === "left"
          ? tabsRef.current.scrollLeft - scrollAmount
          : tabsRef.current.scrollLeft + scrollAmount;

      tabsRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
    }
  };

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

  // Render a prop card
  const renderPropCard = (prop: any) => {
    const showOver = showType === "both" || showType === "over";
    const showUnder = showType === "both" || showType === "under";

    return (
      <Card key={prop.id} className="overflow-hidden">
        <CardContent className="p-3">
          <div className="font-medium mb-1">{prop.player}</div>
          <div className="text-sm text-muted-foreground mb-2">
            {prop.marketName} {prop.line}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {showOver && (
              <Button
                onClick={() => handleSelectProp(prop, true)}
                className={cn(
                  "flex justify-between items-center",
                  prop.overOdds > 0 ? "text-green-500" : "text-blue-500"
                )}
                disabled={!prop.overOdds}
              >
                <div className="flex items-center">
                  <ChevronUp className="h-4 w-4 mr-1" />
                  <span>Over</span>
                </div>
                <span>{displayOdds(prop.overOdds)}</span>
              </Button>
            )}

            {showUnder && (
              <Button
                onClick={() => handleSelectProp(prop, false)}
                className={cn(
                  "flex justify-between items-center",
                  prop.underOdds > 0 ? "text-green-500" : "text-blue-500"
                )}
                disabled={!prop.underOdds}
              >
                <div className="flex items-center">
                  <ChevronDown className="h-4 w-4 mr-1" />
                  <span>Under</span>
                </div>
                <span>{displayOdds(prop.underOdds)}</span>
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
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Player Props</DialogTitle>
          <div className="text-sm text-muted-foreground mt-1">
            {game?.homeTeam?.name} vs {game?.awayTeam?.name}
          </div>
        </DialogHeader>

        <div className="px-6 py-2 border-b">
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <div className="relative flex-1 flex items-center">
              {canScrollLeft && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-0 z-10 h-8 w-8 bg-background/80 backdrop-blur-sm"
                  onClick={() => scrollTabs("left")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}

              <div className="w-full overflow-hidden">
                <Tabs
                  value={activeMarket}
                  onValueChange={setActiveMarket}
                  className="w-full"
                >
                  <div ref={tabsRef} className="overflow-x-auto scrollbar-hide">
                    <TabsList className="w-max flex whitespace-nowrap px-2">
                      {availableMarkets.map((market) => (
                        <TabsTrigger
                          key={market.value}
                          value={market.value}
                          className="flex-shrink-0"
                        >
                          {market.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                </Tabs>
              </div>

              {canScrollRight && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 z-10 h-8 w-8 bg-background/80 backdrop-blur-sm"
                  onClick={() => scrollTabs("right")}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex items-center w-full sm:w-auto">
              <Input
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div className="mt-2">
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

        <ScrollArea className="flex-1 p-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredProps.map(renderPropCard)}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
