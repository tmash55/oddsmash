"use client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Loader2,
  ChevronUp,
  ChevronDown,
  Search,
  X,
  User,
  Trophy,
  Plus,
  TrendingUp,
  Zap,
  ArrowRight,
  Receipt,
} from "lucide-react";
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
import { motion, AnimatePresence } from "framer-motion";
import { ActiveSportsbookSelector } from "./active-sportsbook-selector";
import { sportsbooks } from "@/data/sportsbooks";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { useRef } from "react";

interface PlayerPropsModalMobileProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: any;
  sportId: string;
  activeSportsbook: string;
  onSelectProp: (prop: any) => void;
  displayOdds: (odds: number) => string;
  isMarketSelected?: (gameId: string, marketId: string) => boolean;
  onSelectSportsbook: (id: string) => void;
  selectedSportsbooks: string[];
  betslipCount?: number;
  onOpenBetslip?: () => void;
  // Pass all the processed data and state from the parent
  loading: boolean;
  error: string | null;
  playerProps: any[];
  activeMarket: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  propData: any;
  activeTab: "player" | "game";
  setActiveTab: (tab: "player" | "game") => void;
  overLinesExpanded: boolean;
  setOverLinesExpanded: (expanded: boolean) => void;
  overUnderExpanded: boolean;
  setOverUnderExpanded: (expanded: boolean) => void;
  availableMarkets: any[];
  setActiveMarket: (market: string) => void;
  fetchPlayerProps: () => void;
  groupedProps: Record<string, any[]>;
  filteredPlayers: string[];
  handleSelectProp: (prop: any, isOver: boolean) => void;
  getUniqueLines: (props: any[]) => number[];
  getPlayerAvatar: (name: string) => string;
  getPlayerNames: (name: string) => { firstName: string; lastName: string };
  getTopPlayers: (players: string[], count?: number) => string[];
  getCurrentMarketName: () => string;
}

export function PlayerPropsModalMobile({
  open,
  onOpenChange,
  game,
  sportId,
  activeSportsbook,
  onSelectProp,
  displayOdds,
  isMarketSelected,
  onSelectSportsbook,
  selectedSportsbooks,
  betslipCount = 0,
  onOpenBetslip,
  // State and data props
  loading,
  error,
  playerProps,
  activeMarket,
  searchQuery,
  setSearchQuery,
  propData,
  activeTab,
  setActiveTab,
  overLinesExpanded,
  setOverLinesExpanded,
  overUnderExpanded,
  setOverUnderExpanded,
  availableMarkets,
  setActiveMarket,
  fetchPlayerProps,
  groupedProps,
  filteredPlayers,
  handleSelectProp,
  getUniqueLines,
  getPlayerAvatar,
  getPlayerNames,
  getTopPlayers,
  getCurrentMarketName,
}: PlayerPropsModalMobileProps) {
  // Number of initial players to show before expanding
  const initialPlayersToShow = 3;

  // Clear search query
  const clearSearch = () => {
    setSearchQuery("");
  };

  // Content height to maintain consistent dialog size
  const contentMinHeight = "min-h-[400px]";

  // Create a ref to track if we're handling a betslip click
  const betslipClickRef = useRef(false);

  // Handle betslip button click
  const handleBetslipClick = () => {
    console.log("Betslip button clicked");

    if (onOpenBetslip) {
      // Set the ref to true to indicate we're handling a betslip click
      betslipClickRef.current = true;

      // First close the modal
      onOpenChange(false);

      // Use a small timeout to ensure the modal closing animation completes
      setTimeout(() => {
        // Open the betslip
        onOpenBetslip();

        // Reset the ref
        betslipClickRef.current = false;
      }, 100);
    }
  };

  // Render a player row with horizontally scrollable options
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
        className="py-1.5 border-b border-muted/40 last:border-b-0"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <Avatar className="h-7 w-7 border bg-gradient-to-br from-primary/5 to-primary/20">
            <AvatarImage src={getPlayerAvatar(player)} alt={player} />
            <AvatarFallback>{player.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex flex-col">
              <span className="font-medium text-xs leading-tight">
                {firstName}
              </span>
              <span className="font-medium text-xs leading-tight">
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
            <div className="flex gap-0.5 min-w-max">
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
                      "flex-none h-12 w-12 flex flex-col items-center justify-center border rounded-md",
                      isSelected
                        ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-primary shadow-sm"
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

  // Render a player's Over/Under odds for standard lines
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
        className="py-1.5 border-b border-muted/40 last:border-b-0"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <Avatar className="h-7 w-7 border bg-gradient-to-br from-primary/5 to-primary/20">
            <AvatarImage src={getPlayerAvatar(player)} alt={player} />
            <AvatarFallback>{player.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex flex-col">
              <span className="font-medium text-xs leading-tight">
                {firstName}
              </span>
              <span className="font-medium text-xs leading-tight">
                {lastName}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-1 mt-1">
          {/* Over Button */}
          <motion.button
            onClick={() => handleSelectProp(standardProp, true)}
            className={cn(
              "flex-1 h-10 flex items-center justify-between px-3 border rounded-md",
              isOverSelected
                ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-primary shadow-sm"
                : "bg-background/50 hover:bg-accent/50 transition-colors"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={!standardProp.overOdds}
          >
            <div className="flex items-center gap-1">
              <ChevronUp className="h-3 w-3" />
              <span className="text-xs font-medium">O {standardProp.line}</span>
            </div>
            <span
              className={cn(
                "text-xs font-semibold",
                isOverSelected
                  ? "text-primary-foreground"
                  : standardProp.overOdds > 0
                  ? "text-green-500"
                  : "text-red-500"
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
              "flex-1 h-10 flex items-center justify-between px-3 border rounded-md",
              isUnderSelected
                ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-primary shadow-sm"
                : "bg-background/50 hover:bg-accent/50 transition-colors"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={!standardProp.underOdds}
          >
            <div className="flex items-center gap-1">
              <ChevronDown className="h-3 w-3" />
              <span className="text-xs font-medium">U {standardProp.line}</span>
            </div>
            <span
              className={cn(
                "text-xs font-semibold",
                isUnderSelected
                  ? "text-primary-foreground"
                  : standardProp.underOdds > 0
                  ? "text-green-500"
                  : "text-red-500"
              )}
            >
              {standardProp.underOdds
                ? displayOdds(standardProp.underOdds)
                : "N/A"}
            </span>
          </motion.button>
        </div>
      </motion.div>
    );
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(newOpen) => {
        // Only call onOpenChange if we're not handling a betslip click
        if (!betslipClickRef.current) {
          onOpenChange(newOpen);
        }
      }}
    >
      <SheetContent
        side="bottom"
        className="p-0 h-[100vh] flex flex-col overflow-hidden rounded-t-xl max-h-none"
        style={{ height: "100dvh" }}
      >
        {/* Header */}
        <SheetHeader className="px-3 py-2 border-b bg-gradient-to-r from-primary/5 to-primary/10 flex-col">
          <div className="flex items-center justify-between w-full">
            <SheetClose className="rounded-full h-8 w-8 flex items-center justify-center hover:bg-muted">
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </SheetClose>

            <div className="flex flex-col items-center">
              <div className="text-base flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-primary" />
                Player Props
              </div>
              <Badge
                variant="outline"
                className="text-xs py-0 h-5 bg-background/50 backdrop-blur-sm"
              >
                {game?.homeTeam?.name} vs {game?.awayTeam?.name}
              </Badge>
            </div>

            <div className="w-8 h-8">{/* Empty div for alignment */}</div>
          </div>

          <div className="mt-1">
            <ActiveSportsbookSelector
              selectedSportsbooks={selectedSportsbooks}
              activeSportsbook={activeSportsbook}
              onSelectSportsbook={onSelectSportsbook}
            />
          </div>
        </SheetHeader>

        {/* Tabs and Search */}
        <div className="px-3 py-1.5 border-b sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
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
              }}
            >
              <SelectTrigger className="w-[130px] h-7 text-xs">
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

        {/* Main content area with native scrolling - add pb-20 to ensure content isn't hidden behind the footer */}
        <div
          className={`flex-1 overflow-y-auto px-2 py-1.5 pb-20 ${contentMinHeight}`}
        >
          {/* Same content as before */}
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
                    fetchPlayerProps();
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
                    {/* Over Lines Section with its own expand/collapse */}
                    <div className="mb-4">
                      <motion.div
                        className="mb-2 bg-gradient-to-r from-primary/5 to-primary/10 p-1.5 rounded-lg flex justify-between items-center"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div>
                          <h3 className="text-xs font-medium flex items-center">
                            <span className="bg-primary/20 text-primary rounded-full w-4 h-4 inline-flex items-center justify-center mr-1">
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
                          className="h-6 px-2 text-xs"
                          onClick={() =>
                            setOverLinesExpanded(!overLinesExpanded)
                          }
                        >
                          {overLinesExpanded ? (
                            <ChevronUp className="h-3 w-3 mr-1" />
                          ) : (
                            <Plus className="h-3 w-3 mr-1" />
                          )}
                          {overLinesExpanded ? "Collapse" : "Expand"}
                        </Button>
                      </motion.div>

                      <div className="space-y-0.5">
                        <AnimatePresence>
                          {(() => {
                            // If searching, show all matching players
                            if (searchQuery) {
                              return filteredPlayers.map((player, index) =>
                                renderPlayerRow(player, index)
                              );
                            }

                            // If expanded, show all players (in the same order)
                            if (overLinesExpanded) {
                              return filteredPlayers.map((player, index) =>
                                renderPlayerRow(player, index)
                              );
                            }

                            // Otherwise, show only top players (first N players in the same order)
                            return getTopPlayers(filteredPlayers).map(
                              (player, index) => renderPlayerRow(player, index)
                            );
                          })()}
                        </AnimatePresence>
                      </div>

                      {/* View more/less button for Over Lines */}
                      {!searchQuery &&
                        filteredPlayers.length > initialPlayersToShow && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                          >
                            <Button
                              variant="outline"
                              className="w-full mt-2 h-7 text-xs bg-gradient-to-r from-background to-muted/50 hover:from-muted/30 hover:to-muted/70"
                              onClick={() =>
                                setOverLinesExpanded(!overLinesExpanded)
                              }
                            >
                              {overLinesExpanded ? (
                                <>
                                  <ChevronUp className="h-3 w-3 mr-1.5" />
                                  Show Less
                                </>
                              ) : (
                                <>
                                  <Plus className="h-3 w-3 mr-1.5" />
                                  View{" "}
                                  {filteredPlayers.length -
                                    getTopPlayers(filteredPlayers).length}{" "}
                                  More Players
                                </>
                              )}
                            </Button>
                          </motion.div>
                        )}
                    </div>

                    {/* Over/Under Section with its own expand/collapse */}
                    <div>
                      <motion.div
                        className="mb-2 bg-gradient-to-r from-primary/5 to-primary/10 p-1.5 rounded-lg flex justify-between items-center"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                      >
                        <div>
                          <h3 className="text-xs font-medium flex items-center">
                            <span className="bg-primary/20 text-primary rounded-full w-4 h-4 inline-flex items-center justify-center mr-1">
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
                          className="h-6 px-2 text-xs"
                          onClick={() =>
                            setOverUnderExpanded(!overUnderExpanded)
                          }
                        >
                          {overUnderExpanded ? (
                            <ChevronUp className="h-3 w-3 mr-1" />
                          ) : (
                            <Plus className="h-3 w-3 mr-1" />
                          )}
                          {overUnderExpanded ? "Collapse" : "Expand"}
                        </Button>
                      </motion.div>

                      <div className="space-y-0.5">
                        <AnimatePresence>
                          {(() => {
                            // If searching, show all matching players
                            if (searchQuery) {
                              return filteredPlayers.map((player, index) =>
                                renderPlayerOverUnderRow(player, index)
                              );
                            }

                            // If expanded, show all players (in the same order)
                            if (overUnderExpanded) {
                              return filteredPlayers.map((player, index) =>
                                renderPlayerOverUnderRow(player, index)
                              );
                            }

                            // Otherwise, show only top players (first N players in the same order)
                            return getTopPlayers(filteredPlayers).map(
                              (player, index) =>
                                renderPlayerOverUnderRow(player, index)
                            );
                          })()}
                        </AnimatePresence>
                      </div>

                      {/* View more/less button for Over/Under */}
                      {!searchQuery &&
                        filteredPlayers.length > initialPlayersToShow && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                          >
                            <Button
                              variant="outline"
                              className="w-full mt-2 h-7 text-xs bg-gradient-to-r from-background to-muted/50 hover:from-muted/30 hover:to-muted/70"
                              onClick={() =>
                                setOverUnderExpanded(!overUnderExpanded)
                              }
                            >
                              {overUnderExpanded ? (
                                <>
                                  <ChevronUp className="h-3 w-3 mr-1.5" />
                                  Show Less
                                </>
                              ) : (
                                <>
                                  <Plus className="h-3 w-3 mr-1.5" />
                                  View{" "}
                                  {filteredPlayers.length -
                                    getTopPlayers(filteredPlayers).length}{" "}
                                  More Players
                                </>
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

        {/* Always show SheetFooter to prevent layout shifts */}
        <div className="sticky bottom-0 left-0 right-0 z-50 mt-auto">
          <SheetFooter className="p-3 border-t bg-background shadow-lg">
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 rounded-lg"
              onClick={handleBetslipClick}
            >
              <Receipt className="mr-2 h-5 w-5" />
              Betslip {betslipCount > 0 ? `(${betslipCount})` : ""}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
