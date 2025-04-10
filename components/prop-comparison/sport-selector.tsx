"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { SportLogo } from "../sport-logo";

interface Sport {
  id: string;
  name: string;
  icon?: string;
  isOffSeason?: boolean;
  active?: boolean;
}

interface SportSelectorProps {
  sports: Sport[];
  selectedSport: string;
  onSelectSport?: (sportId: string) => void;
}

export function SportSelector({
  sports,
  selectedSport,
  onSelectSport,
}: SportSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Function to get the sport color
  const getSportColor = useCallback((sportId: string): string => {
    const colorMap: Record<string, string> = {
      basketball_nba: "text-orange-500 bg-orange-500/10 border-orange-500/20",
      nba: "text-orange-500 bg-orange-500/10 border-orange-500/20",
      baseball_mlb: "text-red-500 bg-red-500/10 border-red-500/20",
      mlb: "text-red-500 bg-red-500/10 border-red-500/20",
      americanfootball_nfl:
        "text-green-500 bg-green-500/10 border-green-500/20",
      nfl: "text-green-500 bg-green-500/10 border-green-500/20",
      icehockey_nhl: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      nhl: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      basketball_ncaab: "text-purple-500 bg-purple-500/10 border-purple-500/20",
      ncaab: "text-purple-500 bg-purple-500/10 border-purple-500/20",
      golf_pga: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      pga: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      soccer_epl: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
      epl: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
      tennis_atp: "text-pink-500 bg-pink-500/10 border-pink-500/20",
      atp: "text-pink-500 bg-pink-500/10 border-pink-500/20",
    };

    return colorMap[sportId] || "text-primary bg-primary/10 border-primary/20";
  }, []);

  // Handle sport selection and URL change
  const handleSelectSport = (sportId: string) => {
    // Call the provided onSelectSport callback if it exists
    if (onSelectSport) {
      onSelectSport(sportId);
    }

    // Navigate to the sport's player props page
    router.push(`/${sportId}/player-props`);
  };

  // Check if we can scroll left or right
  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 1
      );
    }
  };

  // Scroll to the selected sport
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const selectedElement = container.querySelector(
        `[data-sport-id="${selectedSport}"]`
      ) as HTMLElement;
      if (selectedElement) {
        // Calculate the scroll position to center the selected element
        const containerWidth = container.clientWidth;
        const elementLeft = selectedElement.offsetLeft;
        const elementWidth = selectedElement.offsetWidth;
        const scrollPosition =
          elementLeft - containerWidth / 2 + elementWidth / 2;

        container.scrollTo({
          left: scrollPosition,
          behavior: "smooth",
        });
      }
    }
  }, [selectedSport]);

  // Add scroll event listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScroll();
      container.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);

      return () => {
        container.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, []);

  // Handle scroll buttons
  const handleScroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 200;
      const newScrollLeft =
        direction === "left"
          ? container.scrollLeft - scrollAmount
          : container.scrollLeft + scrollAmount;

      container.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
    }
  };

  // Check if the selected sport is in off-season
  const isSelectedSportOffSeason = useCallback(() => {
    const sport = sports.find((s) => s.id === selectedSport);
    return sport?.isOffSeason || false;
  }, [selectedSport, sports]);

  // Render sport button with optional off-season indicator
  const renderSportButton = (sport: Sport, isMobile = false) => {
    const isOffSeason = sport.isOffSeason;
    const isSelected = selectedSport === sport.id;
    const sportColor = getSportColor(sport.id);

    const buttonContent = (
      <motion.button
        key={sport.id}
        data-sport-id={sport.id}
        className={cn(
          "flex flex-col items-center justify-center",
          isMobile ? "min-w-[80px] px-3 py-3 mx-1" : "p-3",
          "rounded-xl transition-all relative",
          "border",
          isSelected
            ? `${sportColor} shadow-sm`
            : "hover:bg-muted/70 border-transparent hover:border-muted-foreground/10"
        )}
        onClick={() => handleSelectSport(sport.id)}
        whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
        whileHover={
          isMobile
            ? { y: -2, transition: { duration: 0.15 } }
            : {
                y: -3,
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                transition: { duration: 0.15 },
              }
        }
      >
        <div className="relative">
          {/* Sport Logo/Icon */}
          <div
            className={cn(
              "flex items-center justify-center",
              "rounded-full p-2",
              "w-10 h-10", // Add fixed dimensions
              isSelected ? sportColor : "bg-muted/30"
            )}
          >
            <SportLogo
              sport={sport.id}
              size={isMobile ? "sm" : "md"}
              className={
                isSelected ? sportColor.split(" ")[0] : "text-foreground/80"
              }
            />
          </div>

          {/* Off-season indicator */}
          {isOffSeason && (
            <div className="absolute -top-1 -right-1">
              <Badge
                variant="outline"
                className="h-5 w-5 p-0 flex items-center justify-center rounded-full bg-amber-500 border-amber-500"
              >
                <Info className="h-3 w-3 text-white" />
              </Badge>
            </div>
          )}

          {/* Selected indicator dot */}
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: `var(--${
                  sportColor.split("-")[1].split("/")[0]
                })`,
              }}
            />
          )}
        </div>

        <span
          className={cn(
            "mt-2",
            isMobile ? "text-xs truncate max-w-[70px] text-center" : "text-sm",
            "font-medium",
            isSelected ? "font-semibold" : ""
          )}
        >
          {sport.name}
        </span>
      </motion.button>
    );

    if (isOffSeason) {
      return (
        <TooltipProvider key={sport.id}>
          <Tooltip>
            <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
            <TooltipContent>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-amber-500" />
                <span>{sport.name} is currently in off-season</span>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return buttonContent;
  };

  return (
    <div className="relative">
      {/* Off-season message when a sport in off-season is selected */}
      {isSelectedSportOffSeason() && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2"
        >
          <Calendar className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-700 dark:text-amber-400">
              {sports.find((s) => s.id === selectedSport)?.name} is currently in
              off-season
            </p>
            <p className="text-sm text-muted-foreground">
              No events are currently available. Please check back during the
              regular season or select another sport.
            </p>
          </div>
        </motion.div>
      )}

      {/* Mobile View - Horizontal Scrollable List */}
      <div className="relative sm:hidden">
        {/* Gradient masks for scroll indication */}
        <div
          className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"
          style={{ opacity: canScrollLeft ? 1 : 0, transition: "opacity 0.2s" }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"
          style={{
            opacity: canScrollRight ? 1 : 0,
            transition: "opacity 0.2s",
          }}
        />

        {/* Left Scroll Button */}
        <AnimatePresence>
          {canScrollLeft && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20"
            >
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-full shadow-md border border-border/50"
                onClick={() => handleScroll("left")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto scrollbar-hide py-3 px-4 -mx-2 relative"
        >
          {sports
            .filter((sport) => sport.active !== false)
            .map((sport) => renderSportButton(sport, true))}
        </div>

        {/* Right Scroll Button */}
        <AnimatePresence>
          {canScrollRight && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20"
            >
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-full shadow-md border border-border/50"
                onClick={() => handleScroll("right")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop View - Grid Layout */}
      <div className="hidden sm:grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 p-1">
        {sports
          .filter((sport) => sport.active !== false)
          .map((sport) => renderSportButton(sport))}
      </div>
    </div>
  );
}
