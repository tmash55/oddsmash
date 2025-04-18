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
  ChevronDown,
  ChevronLeft,
  Search,
  X,
  User,
  Trophy,
  TrendingUp,
  Zap,
  ArrowRight,
  Receipt,
} from "lucide-react";
import {
  SPORT_MARKETS,
  getMarketsForSport,
  getDefaultMarket,
} from "@/lib/constants/markets";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
import { ActiveSportsbookSelector } from "./active-sportsbook-selector";
import { sportsbooks } from "@/data/sportsbooks";
import { useMediaQuery } from "@/hooks/use-media-query";

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
  // Add these new props
  betslipCount?: number;
  onOpenBetslip?: () => void;
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
  betslipCount = 0,
  onOpenBetslip,
}: PlayerPropsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerProps, setPlayerProps] = useState<any[]>([]);
  const [activeMarket, setActiveMarket] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [propData, setPropData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"player" | "game">("player");
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  // Separate expansion states for each section
  const [overLinesExpanded, setOverLinesExpanded] = useState(true);
  const [overUnderExpanded, setOverUnderExpanded] = useState(true);

  // Initial number of players to show
  const initialPlayersToShow = 5;

  // Add this near the top with other state variables
  const [playersToShow, setPlayersToShow] = useState(initialPlayersToShow);

  // Add this near the top of the component with other state variables
  const isMobile = useMediaQuery("(max-width: 640px)");
  const [lastActiveSportsbook, setLastActiveSportsbook] =
    useState<string>(activeSportsbook);

  // Add this near the top of the component, after the state declarations
  useEffect(() => {
    // Log props for debugging betslipCount
  }, [betslipCount, onOpenBetslip]);

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
      // Clear any cached data for NCAAB to ensure fresh load
      setPropData(null);

      // If we already have an active market, trigger a fresh fetch
      if (activeMarket) {
        setLoading(true);
        setPlayerProps([]);

        // Small delay to ensure state updates before fetch
        const timer = setTimeout(() => {
          fetchPlayerProps();
        }, 100);

        return () => clearTimeout(timer);
      }
    }
  }, [open, sportId]);

  // Reset expansion states when market changes
  useEffect(() => {
    setOverLinesExpanded(true);
    setOverUnderExpanded(true);
  }, [activeMarket]);

  // Fetch player props from the API
  const fetchPlayerProps = async () => {
    if (!game || !sportId) {
      setLoading(false);
      return;
    }

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
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

      // Add a cache key to prevent redundant API calls - include the sportsbook in the cache key
      const cacheKey = `${game.id}-${marketsToFetch.join(
        "-"
      )}-${activeSportsbook}`;

      // Check if we already have this data in memory
      if (propData && propData._cacheKey === cacheKey) {
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

      const response = await fetch(apiUrl);

      clearTimeout(timeoutId); // Clear timeout once we get a response

      if (!response.ok) {
        throw new Error(`Failed to fetch player props: ${response.statusText}`);
      }

      const data = await response.json();

      // Log the structure of the data to help debug

      // Add cache key to the data
      data._cacheKey = cacheKey;

      // Store the full API response for later use
      setPropData(data);

      // Process the data to extract player props
      const processedProps = processPlayerProps(data, marketsToFetch);
      setPlayerProps(processedProps);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("Error fetching player props:", err);
      setError(err.message || "Failed to load player props");
      setPlayerProps([]);
    } finally {
      clearTimeout(timeoutId);
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
    if (!bookmaker) {
      return [];
    }

    // Special handling for empty markets
    if (!bookmaker.markets || bookmaker.markets.length === 0) {
      return [];
    }

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

        // Log the number of players found

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
    const filtered = Object.keys(groupedProps).filter((player) =>
      player.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Create a map to store player importance scores
    const playerScores = new Map<string, number>();

    // Calculate importance score for each player
    filtered.forEach((player) => {
      const props = groupedProps[player];
      if (!props || props.length === 0) return;

      // Get the highest line value for this player
      const highestLine = Math.max(...props.map((p) => p.line));

      // Get the number of different lines for this player
      const lineCount = new Set(props.map((p) => p.line)).size;

      // Calculate a score based on line count and highest value
      // This prioritizes players with more options and higher lines
      const score = lineCount * 10 + highestLine;

      playerScores.set(player, score);
    });

    // Sort players by their importance score (descending)
    return filtered
      .filter((player) => playerScores.has(player))
      .sort((a, b) => (playerScores.get(b) || 0) - (playerScores.get(a) || 0));
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

    onSelectProp(selectedProp);
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

  // Get player first name and last name
  const getPlayerNames = (fullName: string) => {
    const parts = fullName.split(" ");
    if (parts.length === 1) return { firstName: parts[0], lastName: "" };

    const lastName = parts.pop() || "";
    const firstName = parts.join(" ");

    return { firstName, lastName };
  };

  // Add this function after the getPlayerNames function to sort players by importance
  const getTopPlayers = (players: string[], count = 5) => {
    return players.slice(0, count);
  };

  // Render a player row with horizontally scrollable options - DraftKings style
  const renderPlayerRow = (player: string, index: number) => {
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
        className="py-2 border-b border-muted/40 last:border-b-0"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
        <div className="flex items-center">
          {/* Player info - fixed on the left */}
          <div className="flex items-center gap-2 min-w-[120px] pr-2">
            <Avatar className="h-8 w-8 border bg-gradient-to-br from-primary/5 to-accent/20">
              <AvatarImage src={getPlayerAvatar(player)} alt={player} />
              <AvatarFallback>{player.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium text-sm leading-tight">
                {firstName}
              </span>
              <span className="font-medium text-sm leading-tight">
                {lastName}
              </span>
            </div>
          </div>

          {/* Scrollable odds section */}
          <div
            className="overflow-x-auto hide-scrollbar flex-1"
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
                      "flex-none h-12 w-16 flex flex-col items-center justify-center border rounded-md",
                      isSelected
                        ? "bg-[hsl(var(--primary))] border-[hsl(var(--primary))] shadow-sm"
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
                        isSelected ? "text-primary-foreground/90" : ""
                      )}
                    >
                      {line}+
                    </div>
                    <div
                      className={cn(
                        "text-xs font-semibold",
                        isSelected
                          ? "text-primary-foreground/90 font-bold"
                          : "text-blue-500 font-bold"
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

  // Render a player's Over/Under odds for standard lines - DraftKings style
  const renderPlayerOverUnderRow = (player: string, index: number) => {
    const props = groupedProps[player];

    // Filter out alternate lines and get only the standard line for this market type
    const standardProp = props.find((p) => !p.isAlternate);

    if (!standardProp || (!standardProp.overOdds && !standardProp.underOdds))
      return null;

    const { firstName, lastName } = getPlayerNames(player);

    // Create unique IDs for checking if these props are selected
    const overPropId = `${game.id}-${standardProp.market}-${player}-${standardProp.line}-Over`;
    const underPropId = `${game.id}-${standardProp.market}-${player}-${standardProp.line}-Under`;

    const isOverSelected = isMarketSelected
      ? isMarketSelected(game.id, overPropId)
      : false;
    const isUnderSelected = isMarketSelected
      ? isMarketSelected(game.id, underPropId)
      : false;

    return (
      <motion.div
        key={`${player}-ou`}
        className="py-2 border-b border-muted/40 last:border-b-0"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
        <div className="flex items-center">
          {/* Player info - fixed on the left */}
          <div className="flex items-center gap-2 w-[120px] pr-2">
            <Avatar className="h-8 w-8 border bg-gradient-to-br from-primary/5 to-accent/20">
              <AvatarImage src={getPlayerAvatar(player)} alt={player} />
              <AvatarFallback>{player.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium text-sm leading-tight">
                {firstName}
              </span>
              <span className="font-medium text-sm leading-tight">
                {lastName}
              </span>
            </div>
          </div>
          
          {/* Over/Under buttons */}
          <div className="grid grid-cols-2 gap-2 flex-1">
            {/* Over Button */}
            <motion.button
              onClick={() => handleSelectProp(standardProp, true)}
              className={cn(
                "h-10 flex items-center justify-between px-3 border rounded-md",
                isOverSelected
                  ? "bg-[hsl(var(--primary))] border-[hsl(var(--primary))] shadow-sm"
                  : "bg-card/50 hover:bg-accent/50 transition-colors"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={!standardProp.overOdds}
            >
              <div className="flex items-center gap-1">
                <ChevronUp className="h-3 w-3" />
                <span className="text-xs font-medium">
                  O {standardProp.line}
                </span>
              </div>
              <span
                className={cn(
                  "text-xs font-semibold",
                  isOverSelected
                    ? "text-primary-foreground/90 font-bold"
                    : "text-blue-500 font-bold"
                )}
              >
                {standardProp.overOdds
                  ? displayOdds(standardProp.overOdds)
                  : "N/A"}
              </span>
            </motion.button>

            {/* Under Button */}
            <motion.button
              onClick={() => handleSelectProp(standardProp, false)}
              className={cn(
                "h-10 flex items-center justify-between px-3 border rounded-md",
                isUnderSelected
                  ? "bg-[hsl(var(--primary))] border-[hsl(var(--primary))] shadow-sm"
                  : "bg-card/50 hover:bg-accent/50 transition-colors"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={!standardProp.underOdds}
            >
              <div className="flex items-center gap-1">
                <ChevronDown className="h-3 w-3" />
                <span className="text-xs font-medium">
                  U {standardProp.line}
                </span>
              </div>
              <span
                className={cn(
                  "text-xs font-semibold",
                  isUnderSelected
                    ? "text-primary-foreground/90 font-bold"
                    : "text-blue-500 font-bold"
                )}
              >
                {standardProp.underOdds
                  ? displayOdds(standardProp.underOdds)
                  : "N/A"}
              </span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  };

  // Content height to maintain consistent dialog size
  const contentMinHeight = "min-h-[400px]";

  // Add logging in the main component to verify props are being passed correctly
  // Add this right before the isMobile conditional return

  // Make sure we're explicitly passing the betslip props to the mobile component
  // Update the PlayerPropsModalMobile component props to ensure betslip props are passed correctly

  // Add a floating betslip button for mobile
  const FloatingBetslipButton = () => {
    // Add more logging to debug the betslipCount

    // Only show on mobile and when onOpenBetslip is available
    if (!isMobile || !onOpenBetslip) return null;

    // Always show the button when the modal is open on mobile
    return (
      <motion.div
        className="fixed bottom-4 right-4 z-50"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
      >
        <Button
          size="lg"
          className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg flex items-center justify-center"
          onClick={() => {
            onOpenChange(false); // Close the dialog
            setTimeout(() => {
              if (onOpenBetslip) onOpenBetslip(); // Open the betslip
            }, 100);
          }}
        >
          <Receipt className="h-6 w-6" />
          {betslipCount > 0 ? (
            <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
              {betslipCount}
            </span>
          ) : (
            <span className="sr-only">View Betslip</span>
          )}
        </Button>
      </motion.div>
    );
  };

  // Desktop view
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] sm:max-w-[800px] md:max-w-[900px] lg:max-w-[1000px] p-0 max-h-[90vh] flex flex-col overflow-hidden rounded-xl">
          {/* DialogHeader */}
          <DialogHeader className="px-3 py-2 border-b bg-gradient-to-r from-primary/5 to-accent/10">
            <div className="flex items-center justify-between w-full">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-8 w-8 flex items-center justify-center hover:bg-muted"
                  onClick={() => onOpenChange(false)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Back</span>
                </Button>
              )}

              <div className="flex flex-col items-center space-y-1 mx-auto">
                <DialogTitle className="text-base flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-secondary" />
                  Player Props
                </DialogTitle>
                <Badge
                  variant="outline"
                  className="text-xs py-0 h-5 bg-background/50 backdrop-blur-sm"
                >
                  {game?.homeTeam?.name} vs {game?.awayTeam?.name}
                </Badge>
              </div>

              {isMobile ? (
                <div className="w-8 h-8"></div> // Empty div for alignment
              ) : null}
            </div>

            <div className="mt-1 flex justify-center md:justify-end">
              <ActiveSportsbookSelector
                selectedSportsbooks={selectedSportsbooks}
                activeSportsbook={activeSportsbook}
                onSelectSportsbook={onSelectSportsbook}
              />
            </div>
          </DialogHeader>

          {/* Rest of the dialog content remains the same */}
          <div className="px-3 py-1.5 border-b sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
            {/* Tabs and search content */}
            <Tabs
              value={activeTab}
              onValueChange={(value: any) => setActiveTab(value)}
              className="mb-1.5"
            >
              <TabsList className="grid w-full grid-cols-2 h-7">
                <TabsTrigger
                  value="player"
                  className="flex items-center gap-1 text-xs py-0.5"
                >
                  <User className="h-3 w-3" />
                  <span>Player Props</span>
                </TabsTrigger>
                <TabsTrigger
                  value="game"
                  className="flex items-center gap-1 text-xs py-0.5"
                >
                  <Trophy className="h-3 w-3" />
                  <span>Game Props</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex gap-1.5 mb-1.5">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                  <Search className="h-3 w-3 text-muted-foreground" />
                </div>
                <Input
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-6 pr-6 w-full h-7 text-xs"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute inset-y-0 right-0 flex items-center pr-2 h-full"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              <Select
                value={activeMarket}
                onValueChange={(value) => {
                  setActiveMarket(value);

                  // Clear existing data when changing markets
                  setPlayerProps([]);
                  setLoading(true);
                  setPropData(null);

                  // Force a re-fetch by adding a timestamp to break cache
                  const timestamp = Date.now();
                }}
              >
                <SelectTrigger className="w-[130px] h-7 text-xs hover:text-foreground focus:text-foreground">
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
          <div
            className={`flex-1 overflow-y-auto px-2 py-1.5 ${contentMinHeight}`}
          >
            {/* Same content as in the mobile view */}
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
                                              src={
                                                sb.logo || "/placeholder.svg"
                                              }
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
                      {/* Over Lines Section with its own expand/collapse */}
                      <div className="mb-4">
                        <motion.div
                          className="mb-2 bg-gradient-to-r from-primary/5 to-accent/10 p-2 rounded-lg flex justify-between items-center"
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div>
                            <h3 className="text-xs font-medium flex items-center">
                              <span className="bg-secondary/20 text-primary rounded-full w-4 h-4 inline-flex items-center justify-center mr-1">
                                <TrendingUp className="h-2.5 w-2.5" />
                              </span>
                              {getCurrentMarketName()} Over Lines
                            </h3>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Swipe horizontally to see more options
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs hover:text-foreground focus:text-foreground"
                            onClick={() =>
                              setOverLinesExpanded(!overLinesExpanded)
                            }
                          >
                            {overLinesExpanded ? (
                              <ChevronUp className="h-3 w-3 mr-1" />
                            ) : (
                              <ChevronDown className="h-3 w-3 mr-1" />
                            )}
                            {overLinesExpanded ? "Collapse" : "Expand"}
                          </Button>
                        </motion.div>

                        {overLinesExpanded && (
                          <div className="space-y-0.5">
                            <AnimatePresence>
                              {(() => {
                                // If searching, show all matching players
                                if (searchQuery) {
                                  return filteredPlayers.map((player, index) =>
                                    renderPlayerRow(player, index)
                                  );
                                }

                                // Otherwise, show only top players based on playersToShow state
                                return getTopPlayers(
                                  filteredPlayers,
                                  playersToShow
                                ).map((player, index) =>
                                  renderPlayerRow(player, index)
                                );
                              })()}
                            </AnimatePresence>
                          </div>
                        )}

                        {/* View more/less button for Over Lines */}
                        {!searchQuery &&
                          filteredPlayers.length > initialPlayersToShow &&
                          overLinesExpanded && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: 0.2 }}
                            >
                              <Button
                                variant="outline"
                                className="w-full mt-2 h-7 text-xs bg-gradient-to-r from-background to-card/50 hover:from-card/30 hover:to-card/70 hover:text-foreground"
                                onClick={() => {
                                  // Toggle between showing initial count and all players
                                  setPlayersToShow(
                                    playersToShow === initialPlayersToShow
                                      ? filteredPlayers.length
                                      : initialPlayersToShow
                                  );
                                }}
                              >
                                {playersToShow === initialPlayersToShow ? (
                                  <>
                                    View{" "}
                                    {filteredPlayers.length -
                                      initialPlayersToShow}{" "}
                                    More Players
                                  </>
                                ) : (
                                  <>Show Less</>
                                )}
                              </Button>
                            </motion.div>
                          )}
                      </div>

                      {/* Over/Under Section with its own expand/collapse */}
                      <div>
                        <motion.div
                          className="mb-2 bg-gradient-to-r from-primary/5 to-accent/10 p-2 rounded-lg flex justify-between items-center"
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 }}
                        >
                          <div>
                            <h3 className="text-xs font-medium flex items-center">
                              <span className="bg-secondary/20 text-primary rounded-full w-4 h-4 inline-flex items-center justify-center mr-1">
                                <ArrowRight className="h-2.5 w-2.5" />
                              </span>
                              {getCurrentMarketName()} Over/Under
                            </h3>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Standard lines with both over and under odds
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs hover:text-foreground focus:text-foreground"
                            onClick={() =>
                              setOverUnderExpanded(!overUnderExpanded)
                            }
                          >
                            {overUnderExpanded ? (
                              <ChevronUp className="h-3 w-3 mr-1" />
                            ) : (
                              <ChevronDown className="h-3 w-3 mr-1" />
                            )}
                            {overUnderExpanded ? "Collapse" : "Expand"}
                          </Button>
                        </motion.div>

                        {overUnderExpanded && (
                          <div className="space-y-0.5">
                            <AnimatePresence>
                              {(() => {
                                // If searching, show all matching players
                                if (searchQuery) {
                                  return filteredPlayers.map((player, index) =>
                                    renderPlayerOverUnderRow(player, index)
                                  );
                                }

                                // Otherwise, show only top players based on playersToShow state
                                return getTopPlayers(
                                  filteredPlayers,
                                  playersToShow
                                ).map((player, index) =>
                                  renderPlayerOverUnderRow(player, index)
                                );
                              })()}
                            </AnimatePresence>
                          </div>
                        )}

                        {/* View more/less button for Over/Under */}
                        {!searchQuery &&
                          filteredPlayers.length > initialPlayersToShow &&
                          overUnderExpanded && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: 0.2 }}
                            >
                              <Button
                                variant="outline"
                                className="w-full mt-2 h-7 text-xs bg-gradient-to-r from-background to-card/50 hover:from-card/30 hover:to-card/70 hover:text-foreground"
                                onClick={() => {
                                  // Toggle between showing initial count and all players
                                  setPlayersToShow(
                                    playersToShow === initialPlayersToShow
                                      ? filteredPlayers.length
                                      : initialPlayersToShow
                                  );
                                }}
                              >
                                {playersToShow === initialPlayersToShow ? (
                                  <>
                                    View{" "}
                                    {filteredPlayers.length -
                                      initialPlayersToShow}{" "}
                                    More Players
                                  </>
                                ) : (
                                  <>Show Less</>
                                )}
                              </Button>
                            </motion.div>
                          )}
                      </div>
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

      {/* Floating betslip button for mobile */}
      <FloatingBetslipButton />
    </>
  );
}
