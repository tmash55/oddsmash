"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SportIcon } from "../sport-icon";

interface Sport {
  id: string;
  name: string;
  icon?: string;
}

interface SportSelectorProps {
  sports: Sport[];
  selectedSport: string;
  onSelectSport: (sportId: string) => void;
}

export function SportSelector({
  sports,
  selectedSport,
  onSelectSport,
}: SportSelectorProps) {
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
      hockey_nhl: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      nhl: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      icehockey_nhl: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      golf_pga: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      pga: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      soccer_epl: "text-purple-500 bg-purple-500/10 border-purple-500/20",
      epl: "text-purple-500 bg-purple-500/10 border-purple-500/20",
      tennis_atp: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
      atp: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
    };

    return colorMap[sportId] || "text-primary bg-primary/10 border-primary/20";
  }, []);

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

  return (
    <div className="relative">
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
          {sports.map((sport) => (
            <motion.button
              key={sport.id}
              data-sport-id={sport.id}
              className={cn(
                "flex flex-col items-center justify-center min-w-[80px] px-3 py-3 rounded-xl transition-all mx-1",
                selectedSport === sport.id
                  ? getSportColor(sport.id)
                  : "hover:bg-muted/70 border border-transparent"
              )}
              onClick={() => onSelectSport(sport.id)}
              whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
            >
              <div
                className={cn(
                  "relative",
                  selectedSport === sport.id &&
                    `after:content-[''] after:absolute after:-bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full ${
                      getSportColor(sport.id).split(" ")[0]
                    }`
                )}
              >
                <SportIcon
                  sport={sport.id}
                  size="md"
                  className={
                    selectedSport === sport.id
                      ? getSportColor(sport.id).split(" ")[0]
                      : ""
                  }
                />
              </div>
              <span
                className={cn(
                  "mt-2 text-xs font-medium truncate max-w-[70px] text-center",
                  selectedSport === sport.id ? "font-semibold" : ""
                )}
              >
                {sport.name}
              </span>
            </motion.button>
          ))}
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
      <div className="hidden sm:grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 p-1">
        {sports.map((sport) => (
          <motion.button
            key={sport.id}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-xl transition-all",
              selectedSport === sport.id
                ? getSportColor(sport.id)
                : "hover:bg-muted/70 border border-transparent"
            )}
            onClick={() => onSelectSport(sport.id)}
            whileHover={{
              y: -3,
              backgroundColor:
                selectedSport === sport.id ? undefined : "rgba(0,0,0,0.05)",
              transition: { duration: 0.15 },
            }}
            whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
          >
            <div
              className={cn(
                "relative",
                selectedSport === sport.id &&
                  `after:content-[''] after:absolute after:-bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full ${
                    getSportColor(sport.id).split(" ")[0]
                  }`
              )}
            >
              <SportIcon
                sport={sport.id}
                size="lg"
                className={
                  selectedSport === sport.id
                    ? getSportColor(sport.id).split(" ")[0]
                    : ""
                }
              />
            </div>
            <span
              className={cn(
                "mt-2 text-sm font-medium",
                selectedSport === sport.id ? "font-semibold" : ""
              )}
            >
              {sport.name}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
