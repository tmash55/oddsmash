"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ExternalLink, Zap } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMediaQuery } from "@/hooks/use-media-query";
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
import {
  getMarketsForSport,
  getDefaultMarket,
  getMarketApiKey,
} from "@/lib/constants/markets";
import { FilterControls } from "./filter-controls";
import { useRouter, usePathname } from "next/navigation";

interface PropComparisonTableProps {
  sport?: string;
  propType?: string; // Add this prop
  onPropTypeChange?: (propType: string) => void; // Add this callback
}

// Helper function to convert market label to URL-friendly format
const marketLabelToUrl = (label: string): string => {
  console.log("PropTable marketLabelToUrl input:", label);

  // Special case for PRA
  if (
    label === "PTS+REB+AST" ||
    label === "Points+Rebounds+Assists" ||
    label === "Pts+Reb+Ast"
  ) {
    console.log("PropTable marketLabelToUrl output (special case):", "pra");
    return "pra";
  }

  // Replace + with -plus- and convert to lowercase with spaces as dashes
  const result = label
    .toLowerCase()
    .replace(/\+/g, "-plus-")
    .replace(/\s+/g, "-");
  console.log("PropTable marketLabelToUrl output:", result);
  return result;
};

// Update the findMarketByUrlName function
const findMarketByUrlName = (
  markets: any[],
  urlName: string
): any | undefined => {
  console.log("findMarketByUrlName checking:", urlName);

  // Special case for PRA
  if (urlName === "pra") {
    console.log("Special case for PRA");
    return markets.find(
      (m) =>
        m.label === "PTS+REB+AST" ||
        m.label === "Points+Rebounds+Assists" ||
        m.label === "Pts+Reb+Ast"
    );
  }

  // Try direct match first
  const directMatch = markets.find((m) => {
    const urlLabel = marketLabelToUrl(m.label);
    const matches = urlLabel === urlName;
    console.log(
      `Checking market: ${m.label} (URL: ${urlLabel}) - Match: ${matches}`
    );
    return matches;
  });

  if (directMatch) {
    console.log("Found direct match:", directMatch.label);
    return directMatch;
  }

  // If no direct match, try replacing - with + to handle legacy URLs
  console.log("No direct match, trying legacy format");
  const legacyMatch = markets.find((m) => {
    const normalizedLabel = m.label.toLowerCase().replace(/\s+/g, "-");
    const normalizedUrlName = urlName.replace(/-plus-/g, "+");
    const matches = normalizedLabel === normalizedUrlName;
    console.log(
      `Checking legacy format: ${normalizedLabel} vs ${normalizedUrlName} - Match: ${matches}`
    );
    return matches;
  });

  if (legacyMatch) {
    console.log("Found legacy match:", legacyMatch.label);
  } else {
    console.log("No match found for:", urlName);
  }

  return legacyMatch;
};

export function PropComparisonTable({
  sport = "baseball_mlb",
  propType, // Accept propType from URL
  onPropTypeChange, // Accept callback for prop type changes
}: PropComparisonTableProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Initialize statType from propType if provided, otherwise use default
  const [statType, setStatType] = useState(() => {
    if (propType) {
      // Map URL-friendly propType to API statType
      const markets = getMarketsForSport(sport);
      const market = findMarketByUrlName(markets, propType);
      return market?.value || getDefaultMarket(sport);
    }
    return getDefaultMarket(sport);
  });

  // Update statType when propType changes
  useEffect(() => {
    if (propType) {
      const markets = getMarketsForSport(sport);
      const market = findMarketByUrlName(markets, propType);
      if (market) {
        setStatType(market.value);
      }
    }
  }, [propType, sport]);

  // Custom statType setter that also calls onPropTypeChange
  const handleStatTypeChange = (newStatType: string) => {
    setStatType(newStatType);

    if (onPropTypeChange) {
      // Find the market to get the label
      const markets = getMarketsForSport(sport);
      const market = markets.find((m) => m.value === newStatType);
      if (market) {
        // Convert label to URL-friendly format
        const urlPropType = marketLabelToUrl(market.label);
        onPropTypeChange(urlPropType);
      }
    }
  };

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
  const { selectedSportsbooks, userState, formatSportsbookUrl } =
    useSportsbookPreferences();

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
    if (sport === "baseball_mlb" && statTypes.length > 0) {
      const isCurrentValid = statTypes.some(
        (market) => market.value === statType
      );
      if (!isCurrentValid) {
        handleStatTypeChange(statTypes[0].value);
      }
    }
    // Only run when statTypes updates
  }, [statTypes]);

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

  // Function to check if an outcome has a deeplink
  const hasDeeplink = (outcome?: Outcome) => {
    return outcome && outcome.link && outcome.link.length > 0;
  };

  // Function to handle clicking on a betting line
  const handleBetClick = (outcome?: Outcome, bookmakerKey?: string) => {
    if (!outcome || !outcome.link || !bookmakerKey) return;

    // Find the sportsbook
    const sportsbook = sportsbooks.find((sb) => sb.id === bookmakerKey);
    if (!sportsbook) return;

    let betUrl = outcome.link;

    // Check if this sportsbook requires state information
    if (sportsbook.requiresState) {
      // For sportsbooks that need state in the URL
      if (bookmakerKey === "betmgm") {
        // Replace {state} in the URL with the user's state
        betUrl = betUrl.replace(/{state}/g, userState.toLowerCase());
      } else if (bookmakerKey === "betrivers") {
        // Handle BetRivers specific URL format
        // Extract event ID and other parameters if they exist in the link
        const eventIdMatch = betUrl.match(/#event\/(\d+)/);
        const couponMatch = betUrl.match(/\?coupon=([^|]+)\|([^|]+)\|([^&]+)/);

        const params: Record<string, string> = {};
        if (eventIdMatch && eventIdMatch[1]) {
          params.eventId = eventIdMatch[1];
        }

        if (couponMatch) {
          params.pickType = couponMatch[1];
          params.selectionId = couponMatch[2];
          params.wagerAmount = couponMatch[3];
        }

        // Use the formatSportsbookUrl helper from the hook
        betUrl = formatSportsbookUrl(bookmakerKey, params);
      } else if (
        bookmakerKey === "williamhill_us" ||
        bookmakerKey === "hardrockbet"
      ) {
        // Handle other sportsbooks that might need state information
        // This is a placeholder - implement specific logic as needed
        betUrl = betUrl.replace(/{state}/g, userState.toLowerCase());
      }
    }

    // Open the URL in a new tab
    window.open(betUrl, "_blank", "noopener,noreferrer");
  };

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

  // Add a ref for the slider
  const sliderRef = useRef<HTMLDivElement>(null);

  // Add this useEffect to scroll to the active player when it changes
  useEffect(() => {
    if (sliderRef.current && isMobile) {
      const slider = sliderRef.current;
      const activeItem = slider.children[activePlayerIndex] as HTMLElement;

      if (activeItem) {
        // Calculate the scroll position to center the active item
        const scrollLeft =
          activeItem.offsetLeft -
          slider.offsetWidth / 2 +
          activeItem.offsetWidth / 2;
        slider.scrollTo({ left: scrollLeft, behavior: "smooth" });
      }
    }
  }, [activePlayerIndex, isMobile]);

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

    // Find all sportsbooks with the same best odds
    const booksWithBestOverOdds = selectedSportsbooks.filter((book) => {
      const bookmaker = player.bookmakers.find((b) => b.key === book);
      if (!bookmaker) return false;

      const market = bookmaker.markets.find((m) => m.key === marketKey);
      if (!market) return false;

      const overOutcome = market.outcomes.find(
        (o) => o.name === "Over" && o.point === bestOver?.line
      );

      return overOutcome && overOutcome.price === bestOver?.odds;
    });

    const booksWithBestUnderOdds = selectedSportsbooks.filter((book) => {
      const bookmaker = player.bookmakers.find((b) => b.key === book);
      if (!bookmaker) return false;

      const market = bookmaker.markets.find((m) => m.key === marketKey);
      if (!market) return false;

      const underOutcome = market.outcomes.find(
        (o) => o.name === "Under" && o.point === bestUnder?.line
      );

      return underOutcome && underOutcome.price === bestUnder?.odds;
    });

    return {
      over: {
        sportsbooks: booksWithBestOverOdds.map((id) =>
          sportsbooks.find((sb) => sb.id === id)
        ),
        line: bestOver?.line || 0,
        odds: formatAmericanOdds(bestOver?.odds || 0),
      },
      under: {
        sportsbooks: booksWithBestUnderOdds.map((id) =>
          sportsbooks.find((sb) => sb.id === id)
        ),
        line: bestUnder?.line || 0,
        odds: formatAmericanOdds(bestUnder?.odds || 0),
      },
    };
  };

  // Render a clickable odds button
  const renderOddsButton = (
    outcome: Outcome | null | undefined,
    isOver: boolean,
    line: number,
    isBest: boolean,
    bookmakerKey: string
  ) => {
    const hasLink = outcome && outcome.link;

    return (
      <div
        className={cn(
          "flex items-center justify-between p-1.5 rounded-md border text-sm",
          isBest ? "bg-primary/10 border-primary text-primary-foreground" : "",
          !outcome && "opacity-40",
          hasLink && "hover:bg-accent/80 cursor-pointer transition-colors"
        )}
        onClick={() => hasLink && handleBetClick(outcome, bookmakerKey)}
        role={hasLink ? "button" : undefined}
        tabIndex={hasLink ? 0 : undefined}
      >
        <div className="flex items-center gap-1">
          {isOver ? (
            <ChevronUp className="h-3 w-3 text-primary" />
          ) : (
            <ChevronDown className="h-3 w-3 text-red-500" />
          )}
          <span
            className={cn(
              isBest ? "text-primary font-medium" : "text-foreground"
            )}
          >
            {line}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className={cn(
              "font-medium",
              outcome
                ? outcome.price > 0
                  ? "text-primary"
                  : "text-red-500"
                : "text-muted-foreground"
            )}
          >
            {outcome ? formatAmericanOdds(outcome.price) : "-"}
          </span>
          {hasLink && (
            <div className="flex items-center">
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render the mobile card view
  const renderMobileView = () => {
    if (!currentPlayer) return null;

    const marketKey = getMarketApiKey(sport, statType);
    const bestOddsInfo = getBestOddsInfo(currentPlayer);

    return (
      <div className="p-4">
        {/* Explanation of Zap icon */}
        <div className="mb-4 p-3 bg-muted/30 rounded-lg border text-sm">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-4 w-4 text-primary" />
            <p className="font-medium">Deeplink Available</p>
          </div>
          <p className="text-muted-foreground text-xs">
            Sportsbooks with the{" "}
            <Zap className="h-3 w-3 text-primary inline-block mx-0.5" /> icon
            support direct linking to pre-fill your bet slip. Click on the odds
            or logo to open.
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            Note: Mobile deeplinking is a work in progress and may not work on
            all devices.
          </p>
        </div>

        <div className="text-center mb-4">
          <h3 className="font-bold text-lg">{currentPlayer.player}</h3>
          <p className="text-sm text-muted-foreground">{currentPlayer.team}</p>
        </div>

        {/* Player selection slider */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">Select a player:</p>
            <p className="text-xs text-muted-foreground">
              {activePlayerIndex + 1} of {filteredProps.length}
            </p>
          </div>
          <div className="relative">
            <div
              ref={sliderRef}
              className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin scrollbar-track-transparent"
              style={{ scrollBehavior: "smooth" }}
            >
              {filteredProps.map((prop, index) => (
                <div
                  key={prop.player}
                  className={cn(
                    "border rounded-md p-3 cursor-pointer flex-shrink-0 min-w-[120px] snap-start",
                    index === activePlayerIndex
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  )}
                  onClick={() => setActivePlayerIndex(index)}
                >
                  <p className="font-medium truncate">{prop.player}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Best Odds Summary - Condensed horizontal version */}
        <motion.div
          className="flex justify-between mb-4 p-2 bg-muted/30 rounded-lg border"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-1">
            <ChevronUp className="h-3.5 w-3.5 text-[hsl(var(--emerald-green))]" />
            <span className="text-xs font-medium">
              Over {bestOddsInfo.over.line}
            </span>
            <span className="text-xs font-bold text-primary">
              {bestOddsInfo.over.odds}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <ChevronDown className="h-3.5 w-3.5 text-red-500" />
            <span className="text-xs font-medium">
              Under {bestOddsInfo.under.line}
            </span>
            <span className="text-xs font-bold text-red-500">
              {bestOddsInfo.under.odds}
            </span>
          </div>
        </motion.div>

        {/* Best Sportsbooks Logos */}
        <div className="mb-4">
          <div className="flex justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Best Over Odds:
              </p>
              <div className="flex items-center gap-2">
                {bestOddsInfo.over.sportsbooks.length > 0 ? (
                  bestOddsInfo.over.sportsbooks.map(
                    (book) =>
                      book && (
                        <TooltipProvider key={book.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center hover:bg-primary/10 cursor-pointer transition-colors relative"
                                onClick={() => {
                                  // Find the outcome with the best odds for this book
                                  const bookmaker =
                                    currentPlayer.bookmakers.find(
                                      (b) => b.key === book.id
                                    );
                                  if (!bookmaker) return;

                                  const market = bookmaker.markets.find(
                                    (m) => m.key === marketKey
                                  );
                                  if (!market) return;

                                  const overOutcome = market.outcomes.find(
                                    (o) =>
                                      o.name === "Over" &&
                                      o.point === bestOddsInfo.over.line
                                  );

                                  if (overOutcome && overOutcome.link) {
                                    handleBetClick(overOutcome, book.id);
                                  }
                                }}
                              >
                                <img
                                  src={book.logo || "/placeholder.svg"}
                                  alt={book.name}
                                  className="w-6 h-6 object-contain"
                                />
                                {/* Check if this book has a deeplink for the best over odds */}
                                {(() => {
                                  const bookmaker =
                                    currentPlayer.bookmakers.find(
                                      (b) => b.key === book.id
                                    );
                                  if (!bookmaker) return null;

                                  const market = bookmaker.markets.find(
                                    (m) => m.key === marketKey
                                  );
                                  if (!market) return null;

                                  const overOutcome = market.outcomes.find(
                                    (o) =>
                                      o.name === "Over" &&
                                      o.point === bestOddsInfo.over.line
                                  );

                                  return hasDeeplink(overOutcome) ? (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center">
                                      <Zap className="w-2 h-2 text-white dark:text-secondary" />
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{book.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(() => {
                                  const bookmaker =
                                    currentPlayer.bookmakers.find(
                                      (b) => b.key === book.id
                                    );
                                  if (!bookmaker)
                                    return "No deeplink available";

                                  const market = bookmaker.markets.find(
                                    (m) => m.key === marketKey
                                  );
                                  if (!market) return "No deeplink available";

                                  const overOutcome = market.outcomes.find(
                                    (o) =>
                                      o.name === "Over" &&
                                      o.point === bestOddsInfo.over.line
                                  );

                                  return hasDeeplink(overOutcome)
                                    ? "Click to open bet slip"
                                    : "No deeplink available";
                                })()}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )
                  )
                ) : (
                  <span className="text-xs text-muted-foreground">
                    None available
                  </span>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Best Under Odds:
              </p>
              <div className="flex items-center gap-2">
                {bestOddsInfo.under.sportsbooks.length > 0 ? (
                  bestOddsInfo.under.sportsbooks.map(
                    (book) =>
                      book && (
                        <TooltipProvider key={book.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center hover:bg-primary/10 cursor-pointer transition-colors relative"
                                onClick={() => {
                                  // Find the outcome with the best odds for this book
                                  const bookmaker =
                                    currentPlayer.bookmakers.find(
                                      (b) => b.key === book.id
                                    );
                                  if (!bookmaker) return;

                                  const market = bookmaker.markets.find(
                                    (m) => m.key === marketKey
                                  );
                                  if (!market) return;

                                  const underOutcome = market.outcomes.find(
                                    (o) =>
                                      o.name === "Under" &&
                                      o.point === bestOddsInfo.under.line
                                  );

                                  if (underOutcome && underOutcome.link) {
                                    handleBetClick(underOutcome, book.id);
                                  }
                                }}
                              >
                                <img
                                  src={book.logo || "/placeholder.svg"}
                                  alt={book.name}
                                  className="w-6 h-6 object-contain"
                                />
                                {/* Check if this book has a deeplink for the best under odds */}
                                {(() => {
                                  const bookmaker =
                                    currentPlayer.bookmakers.find(
                                      (b) => b.key === book.id
                                    );
                                  if (!bookmaker) return null;

                                  const market = bookmaker.markets.find(
                                    (m) => m.key === marketKey
                                  );
                                  if (!market) return null;

                                  const underOutcome = market.outcomes.find(
                                    (o) =>
                                      o.name === "Under" &&
                                      o.point === bestOddsInfo.under.line
                                  );

                                  return hasDeeplink(underOutcome) ? (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center">
                                      <Zap className="w-2 h-2 text-white dark:text-secondary" />
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{book.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(() => {
                                  const bookmaker =
                                    currentPlayer.bookmakers.find(
                                      (b) => b.key === book.id
                                    );
                                  if (!bookmaker)
                                    return "No deeplink available";

                                  const market = bookmaker.markets.find(
                                    (m) => m.key === marketKey
                                  );
                                  if (!market) return "No deeplink available";

                                  const underOutcome = market.outcomes.find(
                                    (o) =>
                                      o.name === "Under" &&
                                      o.point === bestOddsInfo.under.line
                                  );

                                  return hasDeeplink(underOutcome)
                                    ? "Click to open bet slip"
                                    : "No deeplink available";
                                })()}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )
                  )
                ) : (
                  <span className="text-xs text-muted-foreground">
                    None available
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* All Sportsbook Odds - Grid Layout */}
        <div className="grid grid-cols-2 gap-3">
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

              const book = sportsbooks.find((sb) => sb.id === bookmaker);

              // Find if this book has any best odds
              const hasBestOver = bestOddsInfo.over.sportsbooks.some(
                (sb) => sb?.id === bookmaker
              );
              const hasBestUnder = bestOddsInfo.under.sportsbooks.some(
                (sb) => sb?.id === bookmaker
              );
              const hasBestOdds = hasBestOver || hasBestUnder;

              // Check if any outcomes have deeplinks
              const hasAnyDeeplinks = outcomes.some(hasDeeplink);

              return (
                <motion.div
                  key={bookmaker}
                  className={cn(
                    "border rounded-lg p-3 bg-card",
                    hasBestOdds && "border-primary/30"
                  )}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 relative">
                      <img
                        src={book?.logo || "/placeholder.svg"}
                        alt={book?.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-xs font-medium truncate">
                      {book?.name}
                    </span>
                    {hasAnyDeeplinks && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Zap className="h-3 w-3 text-primary" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Deeplinks available</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {Array.from(lines).map((line) => {
                      const over = overOutcomes.find((o) => o.point === line);
                      const under = underOutcomes.find((o) => o.point === line);

                      const isOverBest =
                        bestOddsInfo.over.sportsbooks.some(
                          (sb) => sb?.id === bookmaker
                        ) && over?.point === bestOddsInfo.over.line;
                      const isUnderBest =
                        bestOddsInfo.under.sportsbooks.some(
                          (sb) => sb?.id === bookmaker
                        ) && under?.point === bestOddsInfo.under.line;

                      return (
                        <div key={line} className="flex gap-1">
                          {(showType === "both" || showType === "over") && (
                            <div
                              className={cn(
                                "flex-1 flex items-center justify-between p-1 rounded-md border text-xs",
                                isOverBest
                                  ? "bg-primary/10 border-primary"
                                  : "border-border",
                                !over && "opacity-40",
                                hasDeeplink(over) &&
                                  "hover:bg-accent/80 cursor-pointer"
                              )}
                              onClick={() =>
                                hasDeeplink(over) &&
                                handleBetClick(over, bookmaker)
                              }
                              role={hasDeeplink(over) ? "button" : undefined}
                            >
                              <span
                                className={isOverBest ? "text-primary" : ""}
                              >
                                {line}
                              </span>
                              <div className="flex items-center">
                                <span
                                  className={
                                    over?.price && over.price > 0
                                      ? "text-primary"
                                      : "text-red-500"
                                  }
                                >
                                  {over ? formatAmericanOdds(over.price) : "-"}
                                </span>
                              </div>
                            </div>
                          )}

                          {(showType === "both" || showType === "under") && (
                            <div
                              className={cn(
                                "flex-1 flex items-center justify-between p-1 rounded-md border text-xs",
                                isUnderBest
                                  ? "bg-primary/10 border-primary"
                                  : "border-border",
                                !under && "opacity-40",
                                hasDeeplink(under) &&
                                  "hover:bg-accent/80 cursor-pointer"
                              )}
                              onClick={() =>
                                hasDeeplink(under) &&
                                handleBetClick(under, bookmaker)
                              }
                              role={hasDeeplink(under) ? "button" : undefined}
                            >
                              <span
                                className={isUnderBest ? "text-primary" : ""}
                              >
                                {line}
                              </span>
                              <div className="flex items-center">
                                <span
                                  className={
                                    under?.price && under.price > 0
                                      ? "text-primary"
                                      : "text-red-500"
                                  }
                                >
                                  {under
                                    ? formatAmericanOdds(under.price)
                                    : "-"}
                                </span>
                              </div>
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
                                      showType === "over") &&
                                      renderOddsButton(
                                        overOutcome,
                                        true,
                                        line,
                                        isOverBest,
                                        bookmaker
                                      )}

                                    {(showType === "both" ||
                                      showType === "under") &&
                                      renderOddsButton(
                                        underOutcome,
                                        false,
                                        line,
                                        isUnderBest,
                                        bookmaker
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
          <GameSelector onGameSelect={setSelectedEventId} sport={sport} />
          <FilterControls
            sport={sport}
            statType={statType}
            setStatType={handleStatTypeChange} // Use the custom handler
            showType={showType}
            setShowType={setShowType}
            playerType={playerType}
            setPlayerType={setPlayerType}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />
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
                                      showType === "over") &&
                                      renderOddsButton(
                                        overOutcome,
                                        true,
                                        line,
                                        isOverBest,
                                        bookmaker
                                      )}

                                    {(showType === "both" ||
                                      showType === "under") &&
                                      renderOddsButton(
                                        underOutcome,
                                        false,
                                        line,
                                        isUnderBest,
                                        bookmaker
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
