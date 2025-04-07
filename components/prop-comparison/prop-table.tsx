"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Info,
  ArrowLeft,
  ArrowRight,
  Search,
  SortAsc,
  RefreshCw,
  Clock,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { sportsbooks } from "@/data/sportsbooks";
import { GameSelector } from "./game-selector";
import {
  type GameOdds,
  type Market,
  type Outcome,
  type PlayerProp,
  type Bookmaker,
  findBestOdds,
  formatAmericanOdds,
} from "@/lib/odds-api";
import { useSportsbookPreferences } from "@/hooks/use-sportsbook-preferences";
import { SportsbookSelector } from "@/components/sportsbook-selector";
import {
  getMarketsForSport,
  getDefaultMarket,
  getMarketApiKey,
} from "@/lib/constants/markets";

export function PropComparisonTable({
  sport = "basketball_nba",
}: {
  sport?: string;
}) {
  const [statType, setStatType] = useState(getDefaultMarket(sport));
  const [showType, setShowType] = useState<"both" | "over" | "under">("both");
  const [playerType, setPlayerType] = useState<"batter" | "pitcher">("batter");
  const [activeSportsbook, setActiveSportsbook] = useState("draftkings");
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "best-odds">("name");
  const [showPlayerSelector, setShowPlayerSelector] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [gameData, setGameData] = useState<GameOdds | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiUsage, setApiUsage] = useState<{
    remaining: number;
    used: number;
  } | null>(null);
  const [cacheStatus, setCacheStatus] = useState<{
    hit: boolean;
    lastUpdated: string | null;
  }>({
    hit: false,
    lastUpdated: null,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const { selectedSportsbooks } = useSportsbookPreferences();

  const isMobile = useMediaQuery("(max-width: 768px)");

  // Get available stat types for the current sport and player type
  const statTypes = useMemo(() => {
    const markets = getMarketsForSport(sport);

    if (sport === "baseball_mlb") {
      return markets.filter((market) => {
        const apiKey = market.apiKey.toLowerCase();
        return playerType === "pitcher"
          ? apiKey.startsWith("pitcher_")
          : apiKey.startsWith("batter_");
      });
    }

    return markets;
  }, [sport, playerType]);

  // Get current market
  const currentMarket = useMemo(() => {
    return getMarketsForSport(sport).find((m) => m.value === statType);
  }, [sport, statType]);

  // Determine if alternate lines are available
  const hasAlternateLines = currentMarket?.hasAlternates || false;

  // Update stat type when player type changes
  useEffect(() => {
    if (sport === "baseball_mlb") {
      const validMarket = statTypes.find((market) => market.value === statType);
      if (!validMarket && statTypes.length > 0) {
        setStatType(statTypes[0].value);
      }
    }
  }, [playerType, sport, statTypes, statType]);

  // Helper function to get default stat type for a sport
  function getDefaultStatType(sport: string) {
    switch (sport) {
      case "baseball_mlb":
        return "Strikeouts";
      case "hockey_nhl":
        return "Points";
      default:
        return "Points";
    }
  }

  // Fetch player props when event is selected
  const fetchPlayerProps = async (refresh = false) => {
    if (!selectedEventId) return;

    try {
      setLoading(true);
      if (refresh) setIsRefreshing(true);
      let data;

      const standardMarket = getMarketApiKey(sport, statType, false);
      const shouldFetchAlternate =
        currentMarket?.hasAlternates ||
        currentMarket?.alwaysFetchAlternate ||
        statType === "batter_hits" ||
        statType === "batter_home_runs";

      if (shouldFetchAlternate) {
        // If market has alternates or should always fetch both, fetch both markets in a single call
        const alternateMarket = getMarketApiKey(sport, statType, true);
        const markets = `${standardMarket},${alternateMarket}`;

        console.log("Fetching markets:", {
          markets,
          sport,
          selectedSportsbooks,
        });

        const response = await fetch(
          `/api/events/${selectedEventId}/props?sport=${sport}&markets=${markets}&bookmakers=${selectedSportsbooks.join(
            ","
          )}`
        );

        if (!response.ok) throw new Error("Failed to fetch props");

        const responseData = await response.json();

        // Get cache and API usage from response
        const cacheHit = response.headers.get("x-cache") === "HIT";
        const lastUpdated = response.headers.get("x-last-updated");
        setCacheStatus({
          hit: cacheHit,
          lastUpdated: lastUpdated,
        });

        const remaining = response.headers.get("x-requests-remaining");
        const used = response.headers.get("x-requests-used");
        if (remaining && used) {
          setApiUsage({
            remaining: Number.parseInt(remaining),
            used: Number.parseInt(used),
          });
        }

        // Combine markets for each bookmaker
        data = {
          ...responseData,
          bookmakers: responseData.bookmakers.map((book: Bookmaker) => {
            const standardMarkets = book.markets.filter(
              (m) => !m.key.includes("alternate")
            );
            const alternateMarkets = book.markets.filter((m) =>
              m.key.includes("alternate")
            );

            // If there are no standard markets but there are alternate markets,
            // use the alternate markets as the base
            if (standardMarkets.length === 0 && alternateMarkets.length > 0) {
              return {
                ...book,
                markets: alternateMarkets.map((alternateMarket: Market) => ({
                  ...alternateMarket,
                  key: alternateMarket.key.replace("_alternate", ""), // Use standard key for consistency
                })),
              };
            }

            // Otherwise, merge alternate markets into standard markets
            return {
              ...book,
              markets: standardMarkets.map((standardMarket: Market) => {
                const alternateMarket = alternateMarkets.find(
                  (m) => m.key.replace("_alternate", "") === standardMarket.key
                );
                if (!alternateMarket) return standardMarket;

                // Combine outcomes, removing duplicates
                const allOutcomes = [...standardMarket.outcomes];
                alternateMarket.outcomes.forEach(
                  (alternateOutcome: Outcome) => {
                    const isDuplicate = allOutcomes.some(
                      (o) =>
                        o.name === alternateOutcome.name &&
                        o.point === alternateOutcome.point &&
                        o.description === alternateOutcome.description
                    );
                    if (!isDuplicate) {
                      allOutcomes.push(alternateOutcome);
                    }
                  }
                );

                // Sort outcomes by point value for consistent display
                allOutcomes.sort((a, b) => a.point - b.point);

                return {
                  ...standardMarket,
                  outcomes: allOutcomes,
                };
              }),
            };
          }),
        };
      } else {
        // If no alternates, fetch only standard market
        console.log("Fetching standard market:", {
          market: standardMarket,
          sport,
          selectedSportsbooks,
        });

        const response = await fetch(
          `/api/events/${selectedEventId}/props?sport=${sport}&markets=${standardMarket}&bookmakers=${selectedSportsbooks.join(
            ","
          )}`
        );

        if (!response.ok) throw new Error("Failed to fetch props");

        data = await response.json();

        // Get cache and API usage from response
        const cacheHit = response.headers.get("x-cache") === "HIT";
        const lastUpdated = response.headers.get("x-last-updated");
        setCacheStatus({
          hit: cacheHit,
          lastUpdated: lastUpdated,
        });

        const remaining = response.headers.get("x-requests-remaining");
        const used = response.headers.get("x-requests-used");
        if (remaining && used) {
          setApiUsage({
            remaining: Number.parseInt(remaining),
            used: Number.parseInt(used),
          });
        }
      }

      setGameData(data);
    } catch (error) {
      console.error("Error fetching props:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch player props when event is selected
  useEffect(() => {
    fetchPlayerProps();
  }, [selectedEventId, statType, selectedSportsbooks, sport, currentMarket]);

  // Transform API data into player props format
  const playerProps = useMemo(() => {
    if (!gameData) return [];

    const props: PlayerProp[] = [];
    const standardMarketKey = getMarketApiKey(sport, statType, false);
    const alternateMarketKey = getMarketApiKey(sport, statType, true);

    gameData.bookmakers.forEach((bookmaker) => {
      // Find both standard and alternate markets
      const standardMarket = bookmaker.markets.find(
        (m) => m.key === standardMarketKey
      );
      const alternateMarket = bookmaker.markets.find(
        (m) => m.key === alternateMarketKey
      );

      if (!standardMarket && !alternateMarket) {
        return;
      }

      // Combine outcomes from both markets
      const allOutcomes = [
        ...(standardMarket?.outcomes || []),
        ...(alternateMarket?.outcomes || []),
      ];

      if (allOutcomes.length === 0) {
        return;
      }

      // Group outcomes by player
      const playerOutcomes = new Map<string, Outcome[]>();
      allOutcomes.forEach((outcome) => {
        if (!outcome.description) {
          return;
        }

        const outcomes = playerOutcomes.get(outcome.description) || [];
        // Only add if not a duplicate
        const isDuplicate = outcomes.some(
          (o) =>
            o.name === outcome.name &&
            o.point === outcome.point &&
            o.description === outcome.description
        );
        if (!isDuplicate) {
          outcomes.push(outcome);
        }
        playerOutcomes.set(outcome.description, outcomes);
      });

      // Create prop objects
      playerOutcomes.forEach((outcomes, player) => {
        // Sort outcomes by point value
        outcomes.sort((a, b) => a.point - b.point);

        const existingProp = props.find((p) => p.player === player);
        const overOutcome = outcomes.find((o) => o.name === "Over");

        if (existingProp) {
          existingProp.bookmakers.push({
            key: bookmaker.key,
            title: bookmaker.title,
            last_update: bookmaker.last_update,
            markets: [
              {
                key: standardMarketKey, // Use standard key for consistency
                outcomes: outcomes,
              },
            ],
          });
        } else {
          props.push({
            player,
            team: gameData.home_team,
            statType,
            line: overOutcome?.point || 0,
            bookmakers: [
              {
                key: bookmaker.key,
                title: bookmaker.title,
                last_update: bookmaker.last_update,
                markets: [
                  {
                    key: standardMarketKey, // Use standard key for consistency
                    outcomes: outcomes,
                  },
                ],
              },
            ],
          });
        }
      });
    });

    return props;
  }, [gameData, statType, sport]);

  // Filter props by search query
  const filteredProps = useMemo(() => {
    let filtered = playerProps;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (prop) =>
          prop.player.toLowerCase().includes(query) ||
          (prop.team && prop.team.toLowerCase().includes(query))
      );
    }

    // Sort the filtered props
    if (sortBy === "name") {
      filtered.sort((a, b) => a.player.localeCompare(b.player));
    } else if (sortBy === "best-odds") {
      filtered.sort((a, b) => {
        const marketKey = getMarketApiKey(sport, statType);
        const aBestOver = findBestOdds(a, marketKey, "Over");
        const bBestOver = findBestOdds(b, marketKey, "Over");
        // Sort by best odds (higher is better)
        return (bBestOver?.odds || 0) - (aBestOver?.odds || 0);
      });
    }

    return filtered;
  }, [playerProps, searchQuery, sortBy, statType, sport]);

  // Determine which sportsbooks to show based on screen size
  const visibleSportsbooks = isMobile
    ? sportsbooks.slice(0, 3) // Show fewer on mobile
    : sportsbooks;

  // Handle navigation for mobile card view
  const nextPlayer = () => {
    if (activePlayerIndex < filteredProps.length - 1) {
      setActivePlayerIndex(activePlayerIndex + 1);
    }
  };

  const prevPlayer = () => {
    if (activePlayerIndex > 0) {
      setActivePlayerIndex(activePlayerIndex - 1);
    }
  };

  // Get the current player for mobile view
  const currentPlayer = filteredProps[activePlayerIndex];

  // Find best odds for current player
  const getBestOddsInfo = (player: PlayerProp) => {
    const marketKey = getMarketApiKey(sport, statType);
    const bestOver = findBestOdds(player, marketKey, "Over");
    const bestUnder = findBestOdds(player, marketKey, "Under");

    const overSportsbook = sportsbooks.find(
      (sb) => sb.id === bestOver?.bookmaker
    );
    const underSportsbook = sportsbooks.find(
      (sb) => sb.id === bestUnder?.bookmaker
    );

    return {
      over: {
        sportsbook: overSportsbook,
        line: bestOver?.line || 0,
        odds: formatAmericanOdds(bestOver?.odds || 0),
      },
      under: {
        sportsbook: underSportsbook,
        line: bestUnder?.line || 0,
        odds: formatAmericanOdds(bestUnder?.odds || 0),
      },
    };
  };

  // Render the mobile card view
  const renderMobileView = () => {
    if (!currentPlayer) return null;

    const marketKey = getMarketApiKey(sport, statType);
    const bestOver = findBestOdds(currentPlayer, marketKey, "Over");
    const bestUnder = findBestOdds(currentPlayer, marketKey, "Under");

    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevPlayer}
            disabled={activePlayerIndex === 0}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <h3 className="font-bold">{currentPlayer.player}</h3>
            <p className="text-sm text-muted-foreground">
              {currentPlayer.team}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={nextPlayer}
            disabled={activePlayerIndex === filteredProps.length - 1}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Best Odds Summary */}
        <motion.div
          className="grid grid-cols-2 gap-4 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-4 bg-primary/5 rounded-lg border">
            <div className="flex items-center gap-1 mb-2">
              <ChevronUp className="h-4 w-4 text-[hsl(var(--emerald-green))]" />
              <span className="font-medium">Best Over</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {bestOver && (
                  <>
                    <div className="w-4 h-4">
                      <img
                        src={
                          sportsbooks.find((sb) => sb.id === bestOver.bookmaker)
                            ?.logo || "/placeholder.svg"
                        }
                        alt={
                          sportsbooks.find((sb) => sb.id === bestOver.bookmaker)
                            ?.name
                        }
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span>{bestOver.line}</span>
                  </>
                )}
              </div>
              <span
                className={cn(
                  "font-bold",
                  bestOver && bestOver.odds > 0
                    ? "text-[hsl(var(--emerald-green))]"
                    : "text-[hsl(var(--dark-pastel-red))]"
                )}
              >
                {bestOver ? formatAmericanOdds(bestOver.odds) : "-"}
              </span>
            </div>
          </div>

          <div className="p-4 bg-primary/5 rounded-lg border">
            <div className="flex items-center gap-1 mb-2">
              <ChevronDown className="h-4 w-4 text-[hsl(var(--dark-pastel-red))]" />
              <span className="font-medium">Best Under</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {bestUnder && (
                  <>
                    <div className="w-4 h-4">
                      <img
                        src={
                          sportsbooks.find(
                            (sb) => sb.id === bestUnder.bookmaker
                          )?.logo || "/placeholder.svg"
                        }
                        alt={
                          sportsbooks.find(
                            (sb) => sb.id === bestUnder.bookmaker
                          )?.name
                        }
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span>{bestUnder.line}</span>
                  </>
                )}
              </div>
              <span
                className={cn(
                  "font-bold",
                  bestUnder && bestUnder.odds > 0
                    ? "text-[hsl(var(--emerald-green))]"
                    : "text-[hsl(var(--dark-pastel-red))]"
                )}
              >
                {bestUnder ? formatAmericanOdds(bestUnder.odds) : "-"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* All Sportsbook Odds */}
        <div className="space-y-4">
          <AnimatePresence>
            {selectedSportsbooks.map((bookmaker, index) => {
              const bookmakerData = currentPlayer.bookmakers.find(
                (b) => b.key === bookmaker
              );
              if (!bookmakerData) return null;

              const market = bookmakerData.markets.find(
                (m) => m.key === marketKey
              );
              if (!market) return null;

              const outcomes = market.outcomes;
              const overOutcomes = outcomes.filter((o) => o.name === "Over");
              const underOutcomes = outcomes.filter((o) => o.name === "Under");

              // Group outcomes by line for alternate markets
              const lines = new Set(outcomes.map((o) => o.point));

              const isOverBest =
                bestOver?.bookmaker === bookmaker &&
                bestOver?.line === overOutcomes[0]?.point &&
                bestOver?.odds === overOutcomes[0]?.price;

              const isUnderBest =
                bestUnder?.bookmaker === bookmaker &&
                bestUnder?.line === underOutcomes[0]?.point &&
                bestUnder?.odds === underOutcomes[0]?.price;

              const book = sportsbooks.find((sb) => sb.id === bookmaker);

              return (
                <motion.div
                  key={bookmaker}
                  className="border rounded-lg p-4 bg-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6">
                      <img
                        src={book?.logo || "/placeholder.svg"}
                        alt={book?.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="font-medium">{book?.name}</span>
                  </div>

                  <div className="space-y-3">
                    {Array.from(lines).map((line) => {
                      const over = overOutcomes.find((o) => o.point === line);
                      const under = underOutcomes.find((o) => o.point === line);
                      const isOverBest =
                        bestOver?.bookmaker === bookmaker &&
                        bestOver?.line === over?.point &&
                        bestOver?.odds === over?.price;
                      const isUnderBest =
                        bestUnder?.bookmaker === bookmaker &&
                        bestUnder?.line === under?.point &&
                        bestUnder?.odds === under?.price;

                      return (
                        <div key={line} className="border-b last:border-0 py-1">
                          {(showType === "both" || showType === "over") && (
                            <div
                              className={cn(
                                "flex items-center justify-between p-1.5 rounded-md border text-sm",
                                isOverBest
                                  ? "bg-primary/10 border-primary"
                                  : "",
                                !over && "opacity-40"
                              )}
                            >
                              <div className="flex items-center gap-1">
                                <ChevronUp className="h-3 w-3 text-[hsl(var(--emerald-green))]" />
                                <span>{line}</span>
                              </div>
                              <span
                                className={cn(
                                  "font-medium",
                                  over
                                    ? over.price > 0
                                      ? "text-[hsl(var(--emerald-green))]"
                                      : "text-[hsl(var(--dark-pastel-red))]"
                                    : "text-muted-foreground"
                                )}
                              >
                                {over ? formatAmericanOdds(over.price) : "-"}
                              </span>
                            </div>
                          )}

                          {(showType === "both" || showType === "under") && (
                            <div
                              className={cn(
                                "flex items-center justify-between p-1.5 rounded-md border text-sm mt-2",
                                isUnderBest
                                  ? "bg-primary/10 border-primary"
                                  : "",
                                !under && "opacity-40"
                              )}
                            >
                              <div className="flex items-center gap-1">
                                <ChevronDown className="h-3 w-3 text-[hsl(var(--dark-pastel-red))]" />
                                <span>{line}</span>
                              </div>
                              <span
                                className={cn(
                                  "font-medium",
                                  under
                                    ? under.price > 0
                                      ? "text-[hsl(var(--emerald-green))]"
                                      : "text-[hsl(var(--dark-pastel-red))]"
                                    : "text-muted-foreground"
                                )}
                              >
                                {under ? formatAmericanOdds(under.price) : "-"}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  // Render the desktop table view
  const renderTableView = () => {
    return (
      <div className="max-h-[90vh] overflow-auto">
        <div className="overflow-x-auto">
          <table className="w-full relative">
            <thead className="sticky top-0 z-10 bg-card border-b">
              <tr>
                <th className="text-left p-4 bg-card">Player</th>
                {selectedSportsbooks.map((bookmaker) => {
                  const book = sportsbooks.find((sb) => sb.id === bookmaker);
                  return (
                    <th key={bookmaker} className="text-center p-4 bg-card">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-6 h-6">
                          <img
                            src={book?.logo || "/placeholder.svg"}
                            alt={book?.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="text-xs">{book?.name}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredProps.map((prop, index) => {
                  const marketKey = getMarketApiKey(sport, prop.statType);

                  // Get all unique lines across all bookmakers for this player
                  const allLines = new Set<number>();
                  prop.bookmakers.forEach((bookmaker) => {
                    const market = bookmaker.markets.find(
                      (m) => m.key === marketKey
                    );
                    if (market) {
                      market.outcomes.forEach((outcome) => {
                        allLines.add(outcome.point);
                      });
                    }
                  });

                  // Sort lines in ascending order
                  const sortedLines = Array.from(allLines).sort(
                    (a, b) => a - b
                  );

                  // Find best odds for each line
                  const bestOddsPerLine = new Map<
                    number,
                    { over: number; under: number }
                  >();
                  sortedLines.forEach((line) => {
                    let bestOver = Number.NEGATIVE_INFINITY;
                    let bestUnder = Number.NEGATIVE_INFINITY;

                    prop.bookmakers.forEach((bookmaker) => {
                      const market = bookmaker.markets.find(
                        (m) => m.key === marketKey
                      );
                      if (market) {
                        const over = market.outcomes.find(
                          (o) => o.name === "Over" && o.point === line
                        );
                        const under = market.outcomes.find(
                          (o) => o.name === "Under" && o.point === line
                        );
                        if (over) bestOver = Math.max(bestOver, over.price);
                        if (under) bestUnder = Math.max(bestUnder, under.price);
                      }
                    });

                    bestOddsPerLine.set(line, {
                      over: bestOver,
                      under: bestUnder,
                    });
                  });

                  return (
                    <motion.tr
                      key={prop.player}
                      className="border-b hover:bg-accent/50"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                    >
                      <td className="p-4">{prop.player}</td>
                      {selectedSportsbooks.map((bookmaker) => {
                        const bookmakerData = prop.bookmakers.find(
                          (b) => b.key === bookmaker
                        );
                        const bookmakerMarket = bookmakerData?.markets.find(
                          (m) => m.key === marketKey
                        );

                        return (
                          <td key={bookmaker} className="text-center p-2">
                            <div className="flex flex-col gap-1">
                              {sortedLines.map((line) => {
                                const overOutcome =
                                  bookmakerMarket?.outcomes.find(
                                    (o: Outcome) =>
                                      o.name === "Over" && o.point === line
                                  );
                                const underOutcome =
                                  bookmakerMarket?.outcomes.find(
                                    (o: Outcome) =>
                                      o.name === "Under" && o.point === line
                                  );
                                const bestOdds = bestOddsPerLine.get(line);
                                const isOverBest =
                                  overOutcome &&
                                  bestOdds &&
                                  overOutcome.price === bestOdds.over;
                                const isUnderBest =
                                  underOutcome &&
                                  bestOdds &&
                                  underOutcome.price === bestOdds.under;

                                return (
                                  <div
                                    key={line}
                                    className="border-b last:border-0 py-1"
                                  >
                                    {(showType === "both" ||
                                      showType === "over") && (
                                      <div
                                        className={cn(
                                          "flex items-center justify-between p-1.5 rounded-md border text-sm",
                                          isOverBest
                                            ? "bg-primary/10 border-primary"
                                            : "",
                                          !overOutcome && "opacity-40"
                                        )}
                                      >
                                        <div className="flex items-center gap-1">
                                          <ChevronUp className="h-3 w-3 text-[hsl(var(--emerald-green))]" />
                                          <span>{line}</span>
                                        </div>
                                        <span
                                          className={cn(
                                            "font-medium",
                                            overOutcome
                                              ? overOutcome.price > 0
                                                ? "text-[hsl(var(--emerald-green))]"
                                                : "text-[hsl(var(--dark-pastel-red))]"
                                              : "text-muted-foreground"
                                          )}
                                        >
                                          {overOutcome
                                            ? formatAmericanOdds(
                                                overOutcome.price
                                              )
                                            : "-"}
                                        </span>
                                      </div>
                                    )}

                                    {(showType === "both" ||
                                      showType === "under") && (
                                      <div
                                        className={cn(
                                          "flex items-center justify-between p-1.5 rounded-md border text-sm mt-2",
                                          isUnderBest
                                            ? "bg-primary/10 border-primary"
                                            : "",
                                          !underOutcome && "opacity-40"
                                        )}
                                      >
                                        <div className="flex items-center gap-1">
                                          <ChevronDown className="h-3 w-3 text-[hsl(var(--dark-pastel-red))]" />
                                          <span>{line}</span>
                                        </div>
                                        <span
                                          className={cn(
                                            "font-medium",
                                            underOutcome
                                              ? underOutcome.price > 0
                                                ? "text-[hsl(var(--emerald-green))]"
                                                : "text-[hsl(var(--dark-pastel-red))]"
                                              : "text-muted-foreground"
                                          )}
                                        >
                                          {underOutcome
                                            ? formatAmericanOdds(
                                                underOutcome.price
                                              )
                                            : "-"}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        );
                      })}
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
      <div className="sticky top-0 z-20 bg-card">
        <div className="p-4 border-b flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Player Props Comparison</h2>
            <div className="flex items-center gap-4">
              {apiUsage && (
                <div className="text-sm text-muted-foreground">
                  API Calls: {apiUsage.used} /{" "}
                  {apiUsage.used + apiUsage.remaining}
                </div>
              )}
              {cacheStatus.lastUpdated && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            cacheStatus.hit
                              ? "bg-[hsl(var(--emerald-green))]"
                              : "bg-[hsl(var(--maximum-yellow))]"
                          )}
                        />
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(cacheStatus.lastUpdated).toLocaleTimeString()}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Last updated at{" "}
                        {new Date(cacheStatus.lastUpdated).toLocaleString()}
                      </p>
                      <p>Cache status: {cacheStatus.hit ? "HIT" : "MISS"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchPlayerProps(true)}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={cn("h-3 w-3 mr-1", isRefreshing && "animate-spin")}
                />
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
              <SportsbookSelector />
            </div>
          </div>

          <GameSelector onGameSelect={setSelectedEventId} sport={sport} />

          <div className="flex flex-col sm:flex-row gap-4">
            {sport === "baseball_mlb" && (
              <div className="flex items-center gap-2">
                <Tabs
                  value={playerType}
                  onValueChange={(value: "batter" | "pitcher") =>
                    setPlayerType(value)
                  }
                >
                  <TabsList>
                    <TabsTrigger value="batter">Batter Props</TabsTrigger>
                    <TabsTrigger value="pitcher">Pitcher Props</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Select
                value={statType}
                onValueChange={(value) => {
                  setStatType(value);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select stat type" />
                </SelectTrigger>
                <SelectContent>
                  {statTypes.map((stat) => (
                    <SelectItem key={stat.value} value={stat.value}>
                      {stat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Select the type of player prop to compare</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex items-center gap-2">
              <Tabs
                value={showType}
                onValueChange={(value: "both" | "over" | "under") =>
                  setShowType(value)
                }
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="both">Both</TabsTrigger>
                  <TabsTrigger value="over">Over</TabsTrigger>
                  <TabsTrigger value="under">Under</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-[200px] pl-8"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <SortAsc className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortBy("name")}>
                    Sort by Name
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("best-odds")}>
                    Sort by Best Odds
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Sportsbook header row - kept outside the scrollable area */}
        {!isMobile && (
          <div className="border-b bg-card sticky top-[201px] z-10">
            <div className="flex">
              <div className="text-left p-4 min-w-[200px] font-medium">
                Player
              </div>
              {selectedSportsbooks.map((bookmaker) => {
                const book = sportsbooks.find((sb) => sb.id === bookmaker);
                return (
                  <div key={bookmaker} className="text-center p-4 flex-1">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-6 h-6">
                        <img
                          src={book?.logo || "/placeholder.svg"}
                          alt={book?.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-xs font-medium">{book?.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-t-primary border-muted rounded-full animate-spin mb-4"></div>
          <p className="text-muted-foreground">Loading player props...</p>
        </div>
      ) : filteredProps.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground min-h-[300px] flex items-center justify-center">
          <p>
            No player props available. Select a game or try a different stat
            type.
          </p>
        </div>
      ) : isMobile ? (
        renderMobileView()
      ) : (
        <div className="max-h-[calc(90vh-16rem)] overflow-auto">
          <div className="min-w-full">
            <AnimatePresence>
              {filteredProps.map((prop, index) => {
                const marketKey = getMarketApiKey(sport, prop.statType);

                // Get all unique lines across all bookmakers for this player
                const allLines = new Set<number>();
                prop.bookmakers.forEach((bookmaker) => {
                  const market = bookmaker.markets.find(
                    (m) => m.key === marketKey
                  );
                  if (market) {
                    market.outcomes.forEach((outcome) => {
                      allLines.add(outcome.point);
                    });
                  }
                });

                // Sort lines in ascending order
                const sortedLines = Array.from(allLines).sort((a, b) => a - b);

                // Find best odds for each line
                const bestOddsPerLine = new Map<
                  number,
                  { over: number; under: number }
                >();
                sortedLines.forEach((line) => {
                  let bestOver = Number.NEGATIVE_INFINITY;
                  let bestUnder = Number.NEGATIVE_INFINITY;

                  prop.bookmakers.forEach((bookmaker) => {
                    const market = bookmaker.markets.find(
                      (m) => m.key === marketKey
                    );
                    if (market) {
                      const over = market.outcomes.find(
                        (o) => o.name === "Over" && o.point === line
                      );
                      const under = market.outcomes.find(
                        (o) => o.name === "Under" && o.point === line
                      );
                      if (over) bestOver = Math.max(bestOver, over.price);
                      if (under) bestUnder = Math.max(bestUnder, under.price);
                    }
                  });

                  bestOddsPerLine.set(line, {
                    over: bestOver,
                    under: bestUnder,
                  });
                });

                return (
                  <motion.div
                    key={prop.player}
                    className="border-b hover:bg-accent/50 transition-colors duration-200"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                  >
                    <div className="flex">
                      <div className="text-left p-4 min-w-[200px]">
                        <span className="font-medium">{prop.player}</span>
                      </div>
                      {selectedSportsbooks.map((bookmaker) => {
                        const bookmakerData = prop.bookmakers.find(
                          (b) => b.key === bookmaker
                        );
                        const bookmakerMarket = bookmakerData?.markets.find(
                          (m) => m.key === marketKey
                        );

                        return (
                          <div key={bookmaker} className="flex-1 p-4">
                            <div className="space-y-2">
                              {sortedLines.map((line) => {
                                const overOutcome =
                                  bookmakerMarket?.outcomes.find(
                                    (o: Outcome) =>
                                      o.name === "Over" && o.point === line
                                  );
                                const underOutcome =
                                  bookmakerMarket?.outcomes.find(
                                    (o: Outcome) =>
                                      o.name === "Under" && o.point === line
                                  );
                                const bestOdds = bestOddsPerLine.get(line);
                                const isOverBest =
                                  overOutcome &&
                                  bestOdds &&
                                  overOutcome.price === bestOdds.over;
                                const isUnderBest =
                                  underOutcome &&
                                  bestOdds &&
                                  underOutcome.price === bestOdds.under;

                                return (
                                  <div
                                    key={line}
                                    className="border-b last:border-0 py-1"
                                  >
                                    {(showType === "both" ||
                                      showType === "over") && (
                                      <div
                                        className={cn(
                                          "flex items-center justify-between p-1.5 rounded-md border text-sm",
                                          isOverBest
                                            ? "bg-primary/10 border-primary"
                                            : "",
                                          !overOutcome && "opacity-40"
                                        )}
                                      >
                                        <div className="flex items-center gap-1">
                                          <ChevronUp className="h-3 w-3 text-[hsl(var(--emerald-green))]" />
                                          <span>{line}</span>
                                        </div>
                                        <span
                                          className={cn(
                                            "font-medium",
                                            overOutcome
                                              ? overOutcome.price > 0
                                                ? "text-[hsl(var(--emerald-green))]"
                                                : "text-[hsl(var(--dark-pastel-red))]"
                                              : "text-muted-foreground"
                                          )}
                                        >
                                          {overOutcome
                                            ? formatAmericanOdds(
                                                overOutcome.price
                                              )
                                            : "-"}
                                        </span>
                                      </div>
                                    )}

                                    {(showType === "both" ||
                                      showType === "under") && (
                                      <div
                                        className={cn(
                                          "flex items-center justify-between p-1.5 rounded-md border text-sm mt-2",
                                          isUnderBest
                                            ? "bg-primary/10 border-primary"
                                            : "",
                                          !underOutcome && "opacity-40"
                                        )}
                                      >
                                        <div className="flex items-center gap-1">
                                          <ChevronDown className="h-3 w-3 text-[hsl(var(--dark-pastel-red))]" />
                                          <span>{line}</span>
                                        </div>
                                        <span
                                          className={cn(
                                            "font-medium",
                                            underOutcome
                                              ? underOutcome.price > 0
                                                ? "text-[hsl(var(--emerald-green))]"
                                                : "text-[hsl(var(--dark-pastel-red))]"
                                              : "text-muted-foreground"
                                          )}
                                        >
                                          {underOutcome
                                            ? formatAmericanOdds(
                                                underOutcome.price
                                              )
                                            : "-"}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
