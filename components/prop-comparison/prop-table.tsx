"use client";

import React from "react";

import { useState, useRef, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Zap,
  RefreshCw,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface PropComparisonTableProps {
  sport?: string;
  propType?: string;
  onPropTypeChange?: (propType: string) => void;
}

// Helper function to convert market label to URL-friendly format
const marketLabelToUrl = (label: string): string => {
  // Special case for PRA
  if (
    label === "PTS+REB+AST" ||
    label === "Points+Rebounds+Assists" ||
    label === "Pts+Reb+Ast"
  ) {
    return "pra";
  }

  // Replace + with -plus- and convert to lowercase with spaces as dashes
  return label.toLowerCase().replace(/\+/g, "-plus-").replace(/\s+/g, "-");
};

// Update the findMarketByUrlName function
const findMarketByUrlName = (
  markets: any[],
  urlName: string
): any | undefined => {
  // Special case for PRA
  if (urlName === "pra") {
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
    return urlLabel === urlName;
  });

  if (directMatch) {
    return directMatch;
  }

  // If no direct match, try replacing - with + to handle legacy URLs
  return markets.find((m) => {
    const normalizedLabel = m.label.toLowerCase().replace(/\s+/g, "-");
    const normalizedUrlName = urlName.replace(/-plus-/g, "+");
    return normalizedLabel === normalizedUrlName;
  });
};

export function PropComparisonTable({
  sport = "baseball_mlb",
  propType,
  onPropTypeChange,
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

  // Get initial player type from localStorage or prop type
  const getInitialPlayerType = (): "batter" | "pitcher" => {
    // First try to get from localStorage if in baseball
    if (sport === "baseball_mlb" && typeof window !== 'undefined') {
      const savedPlayerType = localStorage.getItem('baseball_playerType');
      if (savedPlayerType === 'pitcher' || savedPlayerType === 'batter') {
        return savedPlayerType as "pitcher" | "batter";
      }
    }
    
    // Fall back to determining from prop type
    if (propType && sport === "baseball_mlb") {
      const markets = getMarketsForSport(sport);
      const market = findMarketByUrlName(markets, propType);
      
      if (market) {
        const apiKey = market.apiKey.toLowerCase();
        // If it's a pitcher market, set initial player type to pitcher
        if (apiKey.startsWith("pitcher_") || apiKey.includes("strikeout")) {
          return "pitcher";
        }
      }
    }
    return "batter";
  };

  // Determine initial player type
  const [playerType, setPlayerType] = useState<"batter" | "pitcher">(getInitialPlayerType());
  
  // Update statType when propType changes
  useEffect(() => {
    if (propType) {
      const markets = getMarketsForSport(sport);
      const market = findMarketByUrlName(markets, propType);
      if (market) {
        setStatType(market.value);
        
        // Also update player type based on the market
        if (sport === "baseball_mlb") {
          const apiKey = market.apiKey.toLowerCase();
          const isPitcherMarket = apiKey.startsWith("pitcher_") || apiKey.includes("strikeout");
          if (isPitcherMarket && playerType !== "pitcher") {
            setPlayerType("pitcher");
          } else if (!isPitcherMarket && playerType !== "batter") {
            setPlayerType("batter");
          }
        }
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

  const [showType, setShowType] = useState<"both" | "over" | "under">("over");
  
  // Add a custom setter for playerType that also updates the statType appropriately
  const handlePlayerTypeChange = (newPlayerType: "batter" | "pitcher") => {
    // Don't proceed if player type isn't changing or if sport isn't baseball
    if (playerType === newPlayerType || sport !== "baseball_mlb") {
      return;
    }
    
    setPlayerType(newPlayerType);
    
    // Get available stat types for the new player type
    const newStatTypes = getMarketsForSport(sport).filter((market) => {
      const apiKey = market.apiKey.toLowerCase();
      const marketLabel = market.label.toLowerCase();
      
      if (newPlayerType === "pitcher") {
        // Include markets that start with "pitcher_" OR contain "strikeout" for pitchers
        return (
          apiKey.startsWith("pitcher_") || 
          apiKey.includes("strikeout") || 
          marketLabel.includes("strikeout")
        );
      } else {
        // For batters, exclude pitcher-specific markets and strikeouts
        return (
          apiKey.startsWith("batter_") &&
          !apiKey.includes("strikeout") &&
          !marketLabel.includes("strikeout")
        );
      }
    });
    
    // Always switch to the first available market for the new player type
    // This ensures a clean transition between player types
    if (newStatTypes.length > 0) {
      handleStatTypeChange(newStatTypes[0].value);
    }
  };
  
  // Persist player type to localStorage when it changes
  useEffect(() => {
    if (sport === "baseball_mlb" && typeof window !== 'undefined') {
      localStorage.setItem('baseball_playerType', playerType);
      
      // If player type changed but we need to update the URL/market
      const currentMarkets = getMarketsForSport(sport).filter(market => {
        const apiKey = market.apiKey.toLowerCase();
        const marketLabel = market.label.toLowerCase();
        
        if (playerType === "pitcher") {
          return (
            apiKey.startsWith("pitcher_") || 
            apiKey.includes("strikeout") || 
            marketLabel.includes("strikeout")
          );
        } else {
          return (
            apiKey.startsWith("batter_") &&
            !apiKey.includes("strikeout") &&
            !marketLabel.includes("strikeout")
          );
        }
      });
      
      // Check if current statType is valid for this player type
      const isStatTypeValid = currentMarkets.some(m => m.value === statType);
      
      // If not valid, switch to the first valid market
      if (!isStatTypeValid && currentMarkets.length > 0 && onPropTypeChange) {
        handleStatTypeChange(currentMarkets[0].value);
      }
    }
  }, [playerType, sport, statType, onPropTypeChange]);

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
  const [mobileView, setMobileView] = useState<"all" | "best">("best");

  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");

  // Get available stat types for the current sport and player type
  const statTypes = useMemo(() => {
    const markets = getMarketsForSport(sport);

    if (sport === "baseball_mlb") {
      return markets.filter((market) => {
        const apiKey = market.apiKey.toLowerCase();
        const marketLabel = market.label.toLowerCase();
        
        if (playerType === "pitcher") {
          // Include markets that start with "pitcher_" OR contain "strikeout" for pitchers
          return (
            apiKey.startsWith("pitcher_") || 
            apiKey.includes("strikeout") || 
            marketLabel.includes("strikeout")
          );
        } else {
          // For batters, exclude pitcher-specific markets and strikeouts
          return (
            apiKey.startsWith("batter_") &&
            !apiKey.includes("strikeout") &&
            !marketLabel.includes("strikeout")
          );
        }
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

  // Refresh data manually
  const handleRefresh = () => {
    fetchPlayerProps(true);
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

  // Find all bookmakers with the best odds for a specific line and bet type
  const findAllBookmakersWithBestOdds = (
    prop: PlayerProp,
    marketKey: string,
    betType: "Over" | "Under",
    line?: number
  ) => {
    const bestOddsResult = findBestOdds(prop, marketKey, betType, line);
    if (!bestOddsResult) return [];

    const bestOdds = bestOddsResult.odds;
    const bestLine = line !== undefined ? line : bestOddsResult.line;
    const bookmakers: string[] = [];

    // Find all bookmakers that have the same best odds
    prop.bookmakers.forEach((bookmaker) => {
      const market = bookmaker.markets.find((m) => m.key === marketKey);
      if (!market) return;

      const outcome = market.outcomes.find(
        (o) => o.name === betType && o.point === bestLine
      );
      if (outcome && outcome.price === bestOdds) {
        bookmakers.push(bookmaker.key);
      }
    });

    return bookmakers;
  };

  // Find best odds for current player
  const getBestOddsInfo = (player: PlayerProp) => {
    const marketKey = getMarketApiKey(sport, statType);
    const bestOver = findBestOdds(player, marketKey, "Over");
    const bestUnder = findBestOdds(player, marketKey, "Under");

    // Find all sportsbooks with the same best odds
    const booksWithBestOverOdds = findAllBookmakersWithBestOdds(
      player,
      marketKey,
      "Over"
    );
    const booksWithBestUnderOdds = findAllBookmakersWithBestOdds(
      player,
      marketKey,
      "Under"
    );

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

  // Calculate average odds for a player and line
  const getAverageOdds = (
    player: PlayerProp,
    line: number,
    betType: "Over" | "Under"
  ) => {
    const marketKey = getMarketApiKey(sport, statType);
    let totalDecimalOdds = 0;
    let count = 0;

    // Convert American odds to decimal odds for accurate averaging
    const americanToDecimal = (americanOdds: number): number => {
      if (americanOdds >= 0) {
        return americanOdds / 100 + 1;
      } else {
        return 100 / Math.abs(americanOdds) + 1;
      }
    };

    // Convert decimal odds back to American
    const decimalToAmerican = (decimalOdds: number): number => {
      if (decimalOdds >= 2) {
        return Math.round((decimalOdds - 1) * 100);
      } else {
        return Math.round(-100 / (decimalOdds - 1));
      }
    };

    player.bookmakers.forEach((bookmaker) => {
      const market = bookmaker.markets.find((m) => m.key === marketKey);
      if (market) {
        const outcome = market.outcomes.find(
          (o) => o.name === betType && o.point === line
        );
        if (outcome) {
          totalDecimalOdds += americanToDecimal(outcome.price);
          count++;
        }
      }
    });

    if (count === 0) return null;

    // Calculate average in decimal odds
    const averageDecimal = totalDecimalOdds / count;
    // Convert back to American odds
    const averageAmerican = decimalToAmerican(averageDecimal);

    return {
      odds: averageAmerican,
      formatted: formatAmericanOdds(averageAmerican),
    };
  };

  // Render a clickable odds button
  const renderOddsButton = (
    outcome: Outcome | null | undefined,
    isBest: boolean,
    bookmakerKey: string
  ) => {
    const hasLink = outcome && outcome.link;

    return (
      <div
        className={cn(
          "flex items-center justify-center p-1.5 rounded-md border text-sm",
          isBest ? "bg-primary/10 border-primary" : "border-border",
          !outcome && "opacity-40",
          hasLink && "hover:bg-accent/80 cursor-pointer transition-colors"
        )}
        onClick={() => hasLink && handleBetClick(outcome, bookmakerKey)}
        role={hasLink ? "button" : undefined}
        tabIndex={hasLink ? 0 : undefined}
      >
        <span
          className={cn(
            "font-medium",
            isBest ? "text-primary" : "text-foreground" // Use consistent text color
          )}
        >
          {outcome ? formatAmericanOdds(outcome.price) : "-"}
        </span>
        {hasLink && (
          <ExternalLink className="h-3 w-3 text-muted-foreground ml-1" />
        )}
      </div>
    );
  };

  // Track expanded lines in mobile view
  const [expandedLines, setExpandedLines] = useState<Record<string, boolean>>(
    {}
  );

  // Toggle line expansion
  const toggleLineExpansion = (line: number) => {
    setExpandedLines((prev) => ({
      ...prev,
      [line]: !prev[line],
    }));
  };

  // Get top 4 sportsbooks for mobile view
  const getTopSportsbooks = (player: PlayerProp, line: number) => {
    const marketKey = getMarketApiKey(sport, statType);

    // First, get all sportsbooks that have odds for this line
    const availableSportsbooks = selectedSportsbooks.filter((bookmaker) => {
      const bookmakerData = player.bookmakers.find((b) => b.key === bookmaker);
      if (!bookmakerData) return false;

      const market = bookmakerData.markets.find((m) => m.key === marketKey);
      if (!market) return false;

      const hasOver = market.outcomes.some(
        (o) => o.name === "Over" && o.point === line
      );
      const hasUnder = market.outcomes.some(
        (o) => o.name === "Under" && o.point === line
      );

      return hasOver || hasUnder;
    });

    // If we have 4 or fewer, return all of them
    if (availableSportsbooks.length <= 4) {
      return availableSportsbooks;
    }

    // Otherwise, find the best odds for over and under
    const overOdds = new Map<string, number>();
    const underOdds = new Map<string, number>();

    availableSportsbooks.forEach((bookmaker) => {
      const bookmakerData = player.bookmakers.find((b) => b.key === bookmaker);
      if (!bookmakerData) return;

      const market = bookmakerData.markets.find((m) => m.key === marketKey);
      if (!market) return;

      const overOutcome = market.outcomes.find(
        (o) => o.name === "Over" && o.point === line
      );
      const underOutcome = market.outcomes.find(
        (o) => o.name === "Under" && o.point === line
      );

      if (overOutcome) {
        overOdds.set(bookmaker, overOutcome.price);
      }
      if (underOutcome) {
        underOdds.set(bookmaker, underOutcome.price);
      }
    });

    // Sort by best odds
    const sortedByOverOdds = Array.from(overOdds.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([key]) => key);
    const sortedByUnderOdds = Array.from(underOdds.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([key]) => key);

    // Combine the best from both lists, prioritizing those that appear in both
    const combined = new Set<string>();

    // First add sportsbooks that have both over and under odds
    for (const book of availableSportsbooks) {
      if (overOdds.has(book) && underOdds.has(book)) {
        combined.add(book);
        if (combined.size >= 4) break;
      }
    }

    // Then add the best over odds
    for (const book of sortedByOverOdds) {
      combined.add(book);
      if (combined.size >= 4) break;
    }

    // Then add the best under odds
    for (const book of sortedByUnderOdds) {
      combined.add(book);
      if (combined.size >= 4) break;
    }

    // Finally, add any remaining sportsbooks if we still don't have 4
    for (const book of availableSportsbooks) {
      combined.add(book);
      if (combined.size >= 4) break;
    }

    return Array.from(combined).slice(0, 4);
  };

  // Render the mobile card view
  const renderMobileView = () => {
    if (!currentPlayer) return null;

    const marketKey = getMarketApiKey(sport, statType);
    const bestOddsInfo = getBestOddsInfo(currentPlayer);

    // Get all unique lines for this player
    const allLines = new Set<number>();
    currentPlayer.bookmakers.forEach((bookmaker) => {
      const market = bookmaker.markets.find((m) => m.key === marketKey);
      if (market) {
        market.outcomes.forEach((outcome) => {
          allLines.add(outcome.point);
        });
      }
    });

    // Sort lines in ascending order
    const sortedLines = Array.from(allLines).sort((a, b) => a - b);

    // Find the standard line (most common)
    const lineFrequency = new Map<number, number>();
    currentPlayer.bookmakers.forEach((bookmaker) => {
      const market = bookmaker.markets.find((m) => m.key === marketKey);
      if (market) {
        market.outcomes.forEach((outcome) => {
          const count = lineFrequency.get(outcome.point) || 0;
          lineFrequency.set(outcome.point, count + 1);
        });
      }
    });

    let standardLine = 0;
    let maxCount = 0;
    lineFrequency.forEach((count, line) => {
      if (count > maxCount) {
        maxCount = count;
        standardLine = line;
      }
    });

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
            or logo.
          </p>
        </div>

        <div className="text-center mb-4">
          <h3 className="font-bold text-lg">{currentPlayer.player}</h3>
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
        {/* Mobile view tabs */}
        <Tabs defaultValue="best" className="mb-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="best" onClick={() => setMobileView("best")}>
              Best Odds
            </TabsTrigger>
            <TabsTrigger value="all" onClick={() => setMobileView("all")}>
              All Sportsbooks
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Mobile view content */}
        <div className="space-y-4">
          {sortedLines.map((line) => {
            const isStandardLine = line === standardLine;
            const averageOver = getAverageOdds(currentPlayer, line, "Over");
            const averageUnder = getAverageOdds(currentPlayer, line, "Under");
            const bestOver = findBestOdds(
              currentPlayer,
              marketKey,
              "Over",
              line
            );
            const bestUnder = findBestOdds(
              currentPlayer,
              marketKey,
              "Under",
              line
            );

            // Find all bookmakers with the best odds
            const bestOverBookmakers = findAllBookmakersWithBestOdds(
              currentPlayer,
              marketKey,
              "Over",
              line
            );
            const bestUnderBookmakers = findAllBookmakersWithBestOdds(
              currentPlayer,
              marketKey,
              "Under",
              line
            );

            // Determine which sportsbooks to show
            const displaySportsbooks =
              mobileView === "best"
                ? getTopSportsbooks(currentPlayer, line)
                : selectedSportsbooks;

            return (
              <div key={line} className="border rounded-lg overflow-hidden">
                <div
                  className="bg-muted/30 p-3 border-b flex justify-between items-center cursor-pointer"
                  onClick={() => toggleLineExpansion(line)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{line}</span>
                    {isStandardLine && (
                      <Badge variant="outline" className="text-xs">
                        Standard Line
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {expandedLines[line] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </div>
                </div>

                {/* Best odds summary (always visible) */}
                <div
                  className={cn(
                    "p-3 border-b",
                    showType === "both"
                      ? "grid grid-cols-2 gap-3"
                      : "flex justify-center"
                  )}
                >
                  {(showType === "both" || showType === "over") && (
                    <div className="border rounded-lg p-2 bg-muted/10 w-full max-w-[200px]">
                      <div className="flex items-center gap-1 mb-2">
                        <ChevronUp className="h-3 w-3 text-primary" />
                        <span className="text-xs font-medium">Best Over</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">
                          {bestOver ? formatAmericanOdds(bestOver.odds) : "-"}
                        </span>
                        <div className="flex items-center gap-1">
                          {bestOverBookmakers.map((bookmakerKey) => (
                            <div
                              key={bookmakerKey}
                              className="w-5 h-5 relative"
                            >
                              <img
                                src={
                                  sportsbooks.find(
                                    (sb) => sb.id === bookmakerKey
                                  )?.logo || "/placeholder.svg"
                                }
                                alt={bookmakerKey}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {(showType === "both" || showType === "under") && (
                    <div className="border rounded-lg p-2 bg-muted/10 w-full max-w-[200px]">
                      <div className="flex items-center gap-1 mb-2">
                        <ChevronDown className="h-3 w-3 text-red-500" />
                        <span className="text-xs font-medium">Best Under</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">
                          {bestUnder ? formatAmericanOdds(bestUnder.odds) : "-"}
                        </span>
                        <div className="flex items-center gap-1">
                          {bestUnderBookmakers.map((bookmakerKey) => (
                            <div
                              key={bookmakerKey}
                              className="w-5 h-5 relative"
                            >
                              <img
                                src={
                                  sportsbooks.find(
                                    (sb) => sb.id === bookmakerKey
                                  )?.logo || "/placeholder.svg"
                                }
                                alt={bookmakerKey}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {expandedLines[line] && (
                  <div className="p-3 grid grid-cols-2 gap-3">
                    {displaySportsbooks.map((bookmaker) => {
                      const bookmakerData = currentPlayer.bookmakers.find(
                        (b) => b.key === bookmaker
                      );
                      if (!bookmakerData) return null;

                      const market = bookmakerData.markets.find(
                        (m) => m.key === marketKey
                      );
                      if (!market) return null;

                      const overOutcome = market.outcomes.find(
                        (o) => o.name === "Over" && o.point === line
                      );
                      const underOutcome = market.outcomes.find(
                        (o) => o.name === "Under" && o.point === line
                      );

                      // If neither outcome exists, don't render this sportsbook
                      if (!overOutcome && !underOutcome) return null;

                      // Find if this book has any best odds for this line
                      const isOverBest = bestOverBookmakers.includes(bookmaker);
                      const isUnderBest =
                        bestUnderBookmakers.includes(bookmaker);

                      const book = sportsbooks.find(
                        (sb) => sb.id === bookmaker
                      );
                      if (!book) return null;

                      // Check if any outcomes have deeplinks
                      const hasAnyDeeplinks =
                        (overOutcome && hasDeeplink(overOutcome)) ||
                        (underOutcome && hasDeeplink(underOutcome));

                      return (
                        <div
                          key={bookmaker}
                          className={cn(
                            "border rounded-lg p-2",
                            (isOverBest || isUnderBest) && "border-primary/30"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 relative">
                              <img
                                src={book.logo || "/placeholder.svg"}
                                alt={book.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <span className="text-xs font-medium truncate">
                              {book.name}
                            </span>
                            {hasAnyDeeplinks && (
                              <Zap className="h-3 w-3 text-primary" />
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {(showType === "both" || showType === "over") && (
                              <div>
                                <div className="flex items-center mb-1">
                                  <ChevronUp className="h-3 w-3 text-primary mr-1" />
                                  <span className="text-xs">Over</span>
                                </div>
                                <div
                                  className={cn(
                                    "flex items-center justify-center p-1.5 rounded-md border text-sm",
                                    isOverBest
                                      ? "bg-primary/10 border-primary"
                                      : "border-border",
                                    !overOutcome && "opacity-40",
                                    hasDeeplink(overOutcome) &&
                                      "hover:bg-accent/80 cursor-pointer"
                                  )}
                                  onClick={() =>
                                    hasDeeplink(overOutcome) &&
                                    handleBetClick(overOutcome, bookmaker)
                                  }
                                >
                                  <span
                                    className={cn(
                                      "font-medium",
                                      isOverBest
                                        ? "text-primary"
                                        : "text-foreground"
                                    )}
                                  >
                                    {overOutcome
                                      ? formatAmericanOdds(overOutcome.price)
                                      : "-"}
                                  </span>
                                </div>
                              </div>
                            )}

                            {(showType === "both" || showType === "under") && (
                              <div>
                                <div className="flex items-center mb-1">
                                  <ChevronDown className="h-3 w-3 text-red-500 mr-1" />
                                  <span className="text-xs">Under</span>
                                </div>
                                <div
                                  className={cn(
                                    "flex items-center justify-center p-1.5 rounded-md border text-sm",
                                    isUnderBest
                                      ? "bg-primary/10 border-primary"
                                      : "border-border",
                                    !underOutcome && "opacity-40",
                                    hasDeeplink(underOutcome) &&
                                      "hover:bg-accent/80 cursor-pointer"
                                  )}
                                  onClick={() =>
                                    hasDeeplink(underOutcome) &&
                                    handleBetClick(underOutcome, bookmaker)
                                  }
                                >
                                  <span
                                    className={cn(
                                      "font-medium",
                                      isUnderBest
                                        ? "text-primary"
                                        : "text-foreground"
                                    )}
                                  >
                                    {underOutcome
                                      ? formatAmericanOdds(underOutcome.price)
                                      : "-"}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Track expanded players
  const [expandedPlayers, setExpandedPlayers] = useState<
    Record<string, boolean>
  >({});

  // Toggle player expansion
  const togglePlayerExpansion = (playerId: string) => {
    setExpandedPlayers((prev) => ({
      ...prev,
      [playerId]: !prev[playerId],
    }));
  };

  // Render the desktop table view with improved layout
  const renderDesktopTable = () => {
    // Get all unique lines across all players
    const allLines = new Set<number>();
    filteredProps.forEach((prop) => {
      prop.bookmakers.forEach((bookmaker) => {
        const market = bookmaker.markets.find(
          (m) => m.key === getMarketApiKey(sport, statType)
        );
        if (market) {
          market.outcomes.forEach((outcome) => {
            allLines.add(outcome.point);
          });
        }
      });
    });

    // Sort lines in ascending order
    const sortedLines = Array.from(allLines).sort((a, b) => a - b);

    // For each player, find their standard line (most common line)
    const standardLines = new Map<string, number>();
    filteredProps.forEach((prop) => {
      const lineFrequency = new Map<number, number>();

      prop.bookmakers.forEach((bookmaker) => {
        const market = bookmaker.markets.find(
          (m) => m.key === getMarketApiKey(sport, statType)
        );
        if (market) {
          market.outcomes.forEach((outcome) => {
            const count = lineFrequency.get(outcome.point) || 0;
            lineFrequency.set(outcome.point, count + 1);
          });
        }
      });

      // Find the most frequent line
      let maxCount = 0;
      let standardLine = 0;

      lineFrequency.forEach((count, line) => {
        if (count > maxCount) {
          maxCount = count;
          standardLine = line;
        }
      });

      standardLines.set(prop.player, standardLine);
    });

    return (
      <div className="overflow-x-auto relative">
        
        <div className="max-h-[80vh] overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-30 bg-card">
              <tr className="border-b">
                <th className="text-left p-4 font-medium text-sm sticky left-0 z-20 bg-card">Player</th>
                <th className="text-center p-4 font-medium text-sm w-24">Line</th>
                <th className="text-center p-4 font-medium text-sm w-24">Type</th>
                <th className="text-center p-4 font-medium text-sm w-28">
                  Best Odds
                </th>
                <th className="text-center p-4 font-medium text-sm w-28">
                  Avg Odds
                </th>
                {!isTablet &&
                  selectedSportsbooks.map((bookmaker) => {
                    const book = sportsbooks.find((sb) => sb.id === bookmaker);
                    return (
                      <th
                        key={bookmaker}
                        className="text-center p-4 w-32 z-20 bg-card"
                      >
                        <div className="flex items-center justify-center">
                          <div className="w-6 h-6">
                            <img
                              src={book?.logo || "/placeholder.svg"}
                              alt={book?.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>
                      </th>
                    );
                  })}
              </tr>
            </thead>
            <tbody>
              {filteredProps.map((prop) => {
                const marketKey = getMarketApiKey(sport, prop.statType);
                const playerId = prop.player;
                const isExpanded = expandedPlayers[playerId] || false;
                const standardLine = standardLines.get(playerId) || 0;

                // Find best odds for each line and all bookmakers with those odds
                const bestOddsPerLine = new Map<
                  number,
                  {
                    over: { odds: number; bookmakers: string[] };
                    under: { odds: number; bookmakers: string[] };
                  }
                >();

                sortedLines.forEach((line) => {
                  const overBookmakers = findAllBookmakersWithBestOdds(
                    prop,
                    marketKey,
                    "Over",
                    line
                  );
                  const underBookmakers = findAllBookmakersWithBestOdds(
                    prop,
                    marketKey,
                    "Under",
                    line
                  );

                  // Get the best odds values
                  let overOdds = Number.NEGATIVE_INFINITY;
                  let underOdds = Number.NEGATIVE_INFINITY;

                  if (overBookmakers.length > 0) {
                    const bookmaker = prop.bookmakers.find(
                      (b) => b.key === overBookmakers[0]
                    );
                    if (bookmaker) {
                      const market = bookmaker.markets.find(
                        (m) => m.key === marketKey
                      );
                      if (market) {
                        const outcome = market.outcomes.find(
                          (o) => o.name === "Over" && o.point === line
                        );
                        if (outcome) overOdds = outcome.price;
                      }
                    }
                  }

                  if (underBookmakers.length > 0) {
                    const bookmaker = prop.bookmakers.find(
                      (b) => b.key === underBookmakers[0]
                    );
                    if (bookmaker) {
                      const market = bookmaker.markets.find(
                        (m) => m.key === marketKey
                      );
                      if (market) {
                        const outcome = market.outcomes.find(
                          (o) => o.name === "Under" && o.point === line
                        );
                        if (outcome) underOdds = outcome.price;
                      }
                    }
                  }

                  bestOddsPerLine.set(line, {
                    over: { odds: overOdds, bookmakers: overBookmakers },
                    under: { odds: underOdds, bookmakers: underBookmakers },
                  });
                });

                // Determine which lines to show based on expanded state
                // When expanded, show all lines except the standard line (since it's already in the header)
                const linesToShow = isExpanded
                  ? sortedLines.filter((line) => line !== standardLine)
                  : [];

                // Calculate average odds for standard line
                const averageOverStandard = getAverageOdds(
                  prop,
                  standardLine,
                  "Over"
                );
                const averageUnderStandard = getAverageOdds(
                  prop,
                  standardLine,
                  "Under"
                );

                // Get best odds for standard line
                const bestOddsStandard = bestOddsPerLine.get(standardLine);

                return (
                  <React.Fragment key={playerId}>
                    {/* Player header row with standard line odds */}
                    <tr
                      className="border-b bg-muted/30 hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => togglePlayerExpansion(playerId)}
                    >
                      <td className="p-4 sticky left-0 bg-muted/30 z-10 group-hover:bg-accent/50">
                        <div className="font-medium flex items-center">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 mr-2" />
                          ) : (
                            <ChevronUp className="h-4 w-4 mr-2" />
                          )}
                          {prop.player}
                        </div>
                        {!isExpanded && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Click to expand alt lines
                          </div>
                        )}
                      </td>
                      <td className="text-center p-4 font-medium">
                        {standardLine}
                      </td>
                      <td className="text-center p-4">
                        <div className="flex flex-col gap-1">
                          {(showType === "both" || showType === "over") && (
                            <div className="flex items-center justify-center">
                              <ChevronUp className="h-3 w-3 text-primary mr-1" />
                              <span className="text-xs">Over</span>
                            </div>
                          )}
                          {(showType === "both" || showType === "under") && (
                            <div className="flex items-center justify-center">
                              <ChevronDown className="h-3 w-3 text-red-500 mr-1" />
                              <span className="text-xs">Under</span>
                            </div>
                          )}
                        </div>
                      </td>
                      {/* Best odds column (moved before Average) */}
                      <td className="text-center p-2">
                        <div className="flex flex-col gap-1">
                          {(showType === "both" || showType === "over") && (
                            <div className="flex items-center justify-center p-1 rounded-md border text-xs bg-primary/10 border-primary">
                              <span className="font-medium text-primary">
                                {bestOddsStandard &&
                                bestOddsStandard.over.odds >
                                  Number.NEGATIVE_INFINITY
                                  ? formatAmericanOdds(bestOddsStandard.over.odds)
                                  : "-"}
                              </span>
                              <div className="flex ml-1">
                                {bestOddsStandard &&
                                  bestOddsStandard.over.bookmakers.map(
                                    (bookmakerKey) => (
                                      <div
                                        key={bookmakerKey}
                                        className="w-4 h-4 -ml-1 first:ml-0"
                                      >
                                        <img
                                          src={
                                            sportsbooks.find(
                                              (sb) => sb.id === bookmakerKey
                                            )?.logo || "/placeholder.svg"
                                          }
                                          alt={bookmakerKey}
                                          className="w-full h-full object-contain"
                                        />
                                      </div>
                                    )
                                  )}
                              </div>
                            </div>
                          )}
                          {(showType === "both" || showType === "under") && (
                            <div className="flex items-center justify-center p-1 rounded-md border text-xs bg-primary/10 border-primary">
                              <span className="font-medium text-primary">
                                {bestOddsStandard &&
                                bestOddsStandard.under.odds >
                                  Number.NEGATIVE_INFINITY
                                  ? formatAmericanOdds(
                                      bestOddsStandard.under.odds
                                    )
                                  : "-"}
                              </span>
                              <div className="flex ml-1">
                                {bestOddsStandard &&
                                  bestOddsStandard.under.bookmakers.map(
                                    (bookmakerKey) => (
                                      <div
                                        key={bookmakerKey}
                                        className="w-4 h-4 -ml-1 first:ml-0"
                                      >
                                        <img
                                          src={
                                            sportsbooks.find(
                                              (sb) => sb.id === bookmakerKey
                                            )?.logo || "/placeholder.svg"
                                          }
                                          alt={bookmakerKey}
                                          className="w-full h-full object-contain"
                                        />
                                      </div>
                                    )
                                  )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      {/* Average odds column */}
                      <td className="text-center p-2">
                        <div className="flex flex-col gap-1">
                          {(showType === "both" || showType === "over") && (
                            <div className="flex items-center justify-center p-1 rounded-md border text-xs bg-muted/10">
                              <span className="font-medium">
                                {averageOverStandard
                                  ? averageOverStandard.formatted
                                  : "-"}
                              </span>
                            </div>
                          )}
                          {(showType === "both" || showType === "under") && (
                            <div className="flex items-center justify-center p-1 rounded-md border text-xs bg-muted/10">
                              <span className="font-medium">
                                {averageUnderStandard
                                  ? averageUnderStandard.formatted
                                  : "-"}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      {/* Individual sportsbook columns (only on desktop) */}
                      {!isTablet &&
                        selectedSportsbooks.map((bookmaker) => {
                          const bookmakerData = prop.bookmakers.find(
                            (b) => b.key === bookmaker
                          );
                          const market = bookmakerData?.markets.find(
                            (m) => m.key === marketKey
                          );
                          const overOutcome = market?.outcomes.find(
                            (o) => o.name === "Over" && o.point === standardLine
                          );
                          const underOutcome = market?.outcomes.find(
                            (o) => o.name === "Under" && o.point === standardLine
                          );
                          const bestOdds = bestOddsPerLine.get(standardLine);
                          const isOverBest =
                            bestOdds &&
                            bestOdds.over.bookmakers.includes(bookmaker);
                          const isUnderBest =
                            bestOdds &&
                            bestOdds.under.bookmakers.includes(bookmaker);

                          return (
                            <td key={bookmaker} className="text-center p-2">
                              <div className="flex flex-col gap-1">
                                {(showType === "both" || showType === "over") && (
                                  <div
                                    className={cn(
                                      "flex items-center justify-center p-1 rounded-md border text-xs",
                                      isOverBest
                                        ? "bg-primary/10 border-primary"
                                        : "border-border",
                                      !overOutcome && "opacity-40",
                                      hasDeeplink(overOutcome) &&
                                        "hover:bg-accent/80 cursor-pointer"
                                    )}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      hasDeeplink(overOutcome) &&
                                        handleBetClick(overOutcome, bookmaker);
                                    }}
                                  >
                                    <span
                                      className={cn(
                                        "font-medium",
                                        isOverBest
                                          ? "text-primary"
                                          : "text-foreground"
                                      )}
                                    >
                                      {overOutcome
                                        ? formatAmericanOdds(overOutcome.price)
                                        : "-"}
                                    </span>
                                  </div>
                                )}
                                {(showType === "both" ||
                                  showType === "under") && (
                                  <div
                                    className={cn(
                                      "flex items-center justify-center p-1 rounded-md border text-xs",
                                      isUnderBest
                                        ? "bg-primary/10 border-primary"
                                        : "border-border",
                                      !underOutcome && "opacity-40",
                                      hasDeeplink(underOutcome) &&
                                        "hover:bg-accent/80 cursor-pointer"
                                    )}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      hasDeeplink(underOutcome) &&
                                        handleBetClick(underOutcome, bookmaker);
                                    }}
                                  >
                                    <span
                                      className={cn(
                                        "font-medium",
                                        isUnderBest
                                          ? "text-primary"
                                          : "text-foreground"
                                      )}
                                    >
                                      {underOutcome
                                        ? formatAmericanOdds(underOutcome.price)
                                        : "-"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                    </tr>

                    {/* Player data rows */}
                    {linesToShow.map((line) => {
                      // Check if this player has this line
                      let hasLine = false;
                      prop.bookmakers.forEach((bookmaker) => {
                        const market = bookmaker.markets.find(
                          (m) => m.key === marketKey
                        );
                        if (market) {
                          const hasOver = market.outcomes.some(
                            (o) => o.name === "Over" && o.point === line
                          );
                          const hasUnder = market.outcomes.some(
                            (o) => o.name === "Under" && o.point === line
                          );
                          if (hasOver || hasUnder) hasLine = true;
                        }
                      });

                      if (!hasLine) return null;

                      // Check if over/under outcomes exist for this line
                      let hasOverOutcome = false;
                      let hasUnderOutcome = false;

                      prop.bookmakers.forEach((bookmaker) => {
                        const market = bookmaker.markets.find(
                          (m) => m.key === marketKey
                        );
                        if (market) {
                          const overExists = market.outcomes.some(
                            (o) => o.name === "Over" && o.point === line
                          );
                          const underExists = market.outcomes.some(
                            (o) => o.name === "Under" && o.point === line
                          );
                          if (overExists) hasOverOutcome = true;
                          if (underExists) hasUnderOutcome = true;
                        }
                      });

                      // Calculate average odds for this line
                      const averageOver = getAverageOdds(prop, line, "Over");
                      const averageUnder = getAverageOdds(prop, line, "Under");

                      // Get best odds for this line
                      const bestOddsForLine = bestOddsPerLine.get(line);

                      // Only render rows if outcomes exist
                      return (
                        <React.Fragment key={`${playerId}-${line}`}>
                          {hasOverOutcome &&
                            (showType === "both" || showType === "over") && (
                              <tr className="border-b hover:bg-accent/50 transition-colors">
                                <td className="p-4 pl-8 sticky left-0 z-10 bg-card hover:bg-accent/50">
                                  <div className="font-medium">{prop.player}</div>
                                </td>
                                <td className="text-center p-4 font-medium">
                                  {line}
                                </td>
                                <td className="text-center p-4">
                                  <div className="flex items-center justify-center">
                                    <ChevronUp className="h-4 w-4 text-primary mr-1" />
                                    <span>Over</span>
                                  </div>
                                </td>
                                {/* Best odds column (moved before Average) */}
                                <td className="text-center p-2">
                                  <div className="flex items-center justify-center p-1 rounded-md border text-xs bg-primary/10 border-primary">
                                    <span className="font-medium text-primary">
                                      {bestOddsForLine &&
                                      bestOddsForLine.over.odds >
                                        Number.NEGATIVE_INFINITY
                                        ? formatAmericanOdds(
                                            bestOddsForLine.over.odds
                                          )
                                        : "-"}
                                    </span>
                                    <div className="flex ml-1">
                                      {bestOddsForLine &&
                                        bestOddsForLine.over.bookmakers.map(
                                          (bookmakerKey) => (
                                            <div
                                              key={bookmakerKey}
                                              className="w-4 h-4 -ml-1 first:ml-0"
                                            >
                                              <img
                                                src={
                                                  sportsbooks.find(
                                                    (sb) => sb.id === bookmakerKey
                                                  )?.logo || "/placeholder.svg"
                                                }
                                                alt={bookmakerKey}
                                                className="w-full h-full object-contain"
                                              />
                                            </div>
                                          )
                                        )}
                                    </div>
                                  </div>
                                </td>
                                {/* Average odds column */}
                                <td className="text-center p-2">
                                  <div className="flex items-center justify-center p-1 rounded-md border text-xs bg-muted/10">
                                    <span className="font-medium">
                                      {averageOver ? averageOver.formatted : "-"}
                                    </span>
                                  </div>
                                </td>
                                {/* Individual sportsbook columns (only on desktop) */}
                                {!isTablet &&
                                  selectedSportsbooks.map((bookmaker) => {
                                    const bookmakerData = prop.bookmakers.find(
                                      (b) => b.key === bookmaker
                                    );
                                    const market = bookmakerData?.markets.find(
                                      (m) => m.key === marketKey
                                    );
                                    const outcome = market?.outcomes.find(
                                      (o) => o.name === "Over" && o.point === line
                                    );
                                    const isBest =
                                      bestOddsForLine &&
                                      bestOddsForLine.over.bookmakers.includes(
                                        bookmaker
                                      );

                                    return (
                                      <td
                                        key={bookmaker}
                                        className="text-center p-2"
                                      >
                                        {renderOddsButton(
                                          outcome,
                                          isBest,
                                          bookmaker
                                        )}
                                      </td>
                                    );
                                  })}
                              </tr>
                            )}
                          {hasUnderOutcome &&
                            (showType === "both" || showType === "under") && (
                              <tr className="border-b hover:bg-accent/50 transition-colors">
                                {showType === "both" && hasOverOutcome ? (
                                  <td className="p-4 pl-8 opacity-0 sticky left-0 z-10 bg-card hover:bg-accent/50">
                                    <div className="font-medium">
                                      {prop.player}
                                    </div>
                                  </td>
                                ) : (
                                  <td className="p-4 pl-8 sticky left-0 z-10 bg-card hover:bg-accent/50">
                                    <div className="font-medium">
                                      {prop.player}
                                    </div>
                                  </td>
                                )}
                                <td className="text-center p-4 font-medium">
                                  {showType === "both" && hasOverOutcome ? (
                                    <span className="opacity-0">{line}</span>
                                  ) : (
                                    line
                                  )}
                                </td>
                                <td className="text-center p-4">
                                  <div className="flex items-center justify-center">
                                    <ChevronDown className="h-4 w-4 text-red-500 mr-1" />
                                    <span>Under</span>
                                  </div>
                                </td>
                                {/* Best odds column (moved before Average) */}
                                <td className="text-center p-2">
                                  <div className="flex items-center justify-center p-1 rounded-md border text-xs bg-primary/10 border-primary">
                                    <span className="font-medium text-primary">
                                      {bestOddsForLine &&
                                      bestOddsForLine.under.odds >
                                        Number.NEGATIVE_INFINITY
                                        ? formatAmericanOdds(
                                            bestOddsForLine.under.odds
                                          )
                                        : "-"}
                                    </span>
                                    <div className="flex ml-1">
                                      {bestOddsForLine &&
                                        bestOddsForLine.under.bookmakers.map(
                                          (bookmakerKey) => (
                                            <div
                                              key={bookmakerKey}
                                              className="w-4 h-4 -ml-1 first:ml-0"
                                            >
                                              <img
                                                src={
                                                  sportsbooks.find(
                                                    (sb) => sb.id === bookmakerKey
                                                  )?.logo || "/placeholder.svg"
                                                }
                                                alt={bookmakerKey}
                                                className="w-full h-full object-contain"
                                              />
                                            </div>
                                          )
                                        )}
                                    </div>
                                  </div>
                                </td>
                                {/* Average odds column */}
                                <td className="text-center p-2">
                                  <div className="flex items-center justify-center p-1 rounded-md border text-xs bg-muted/10">
                                    <span className="font-medium">
                                      {averageUnder
                                        ? averageUnder.formatted
                                        : "-"}
                                    </span>
                                  </div>
                                </td>
                                {/* Individual sportsbook columns (only on desktop) */}
                                {!isTablet &&
                                  selectedSportsbooks.map((bookmaker) => {
                                    const bookmakerData = prop.bookmakers.find(
                                      (b) => b.key === bookmaker
                                    );
                                    const market = bookmakerData?.markets.find(
                                      (m) => m.key === marketKey
                                    );
                                    const outcome = market?.outcomes.find(
                                      (o) =>
                                        o.name === "Under" && o.point === line
                                    );
                                    const isBest =
                                      bestOddsForLine &&
                                      bestOddsForLine.under.bookmakers.includes(
                                        bookmaker
                                      );

                                    return (
                                      <td
                                        key={bookmaker}
                                        className="text-center p-2"
                                      >
                                        {renderOddsButton(
                                          outcome,
                                          isBest,
                                          bookmaker
                                        )}
                                      </td>
                                    );
                                  })}
                              </tr>
                            )}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                );
              })}
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
            setStatType={handleStatTypeChange}
            showType={showType}
            setShowType={setShowType}
            playerType={playerType}
            setPlayerType={handlePlayerTypeChange}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />
        </div>
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
        renderDesktopTable()
      )}
    </div>
  );
}
