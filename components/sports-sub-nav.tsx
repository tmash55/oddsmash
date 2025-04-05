"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { SportLogo } from "@/components/sport-logo";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useState, useEffect } from "react";
import { sports } from "@/data/sports-data";
import { getUrlPath } from "@/data/sport-mappings";

type SportsSubNavProps = {
  baseRoute: "player-props" | "hit-rates" | "parlay-builder" | "tracker";
  className?: string;
};

export function SportsSubNav({ baseRoute, className }: SportsSubNavProps) {
  const pathname = usePathname();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Map sports colors - we could move this to sports-data.ts in the future
  const sportColors: Record<string, string> = {
    baseball_mlb: "text-red-500 bg-red-500/10 border-red-500/20",
    basketball_nba: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    basketball_ncaab: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    hockey_nhl: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    icehockey_nhl: "text-blue-500 bg-blue-500/10 border-blue-500/20", // Support both formats
    americanfootball_nfl: "text-green-500 bg-green-500/10 border-green-500/20",
  };

  // Filter active sports only
  const activeSports = sports.filter((sport) => sport.active !== false);

  // Helper to check if a sport is active
  const isSportActive = (sportId: string) => {
    const urlPath = getUrlPath(sportId);
    return pathname?.includes(`/${urlPath}/`) || false;
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
    <div className={cn("bg-background border-b border-border/40", className)}>
      <div className="container px-4 py-1 relative">
        {/* Gradient masks for scroll indication on mobile */}
        <div
          className="absolute left-4 top-1 bottom-1 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none sm:hidden"
          style={{ opacity: canScrollLeft ? 1 : 0, transition: "opacity 0.2s" }}
        />
        <div
          className="absolute right-4 top-1 bottom-1 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none sm:hidden"
          style={{
            opacity: canScrollRight ? 1 : 0,
            transition: "opacity 0.2s",
          }}
        />

        {/* Left Scroll Button - Mobile Only */}
        <AnimatePresence>
          {canScrollLeft && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 sm:hidden"
            >
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7 rounded-full shadow-sm border border-border/50"
                onClick={() => handleScroll("left")}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Scroll Button - Mobile Only */}
        <AnimatePresence>
          {canScrollRight && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 sm:hidden"
            >
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7 rounded-full shadow-sm border border-border/50"
                onClick={() => handleScroll("right")}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable Nav Container */}
        <nav
          ref={scrollContainerRef}
          className="flex overflow-x-auto hide-scrollbar"
        >
          {activeSports.map((sport) => {
            const isActive = isSportActive(sport.id);
            const urlPath = getUrlPath(sport.id);
            const sportColor =
              sportColors[sport.id]?.split(" ")[0] || "text-primary"; // Get just the text color class

            return (
              <Link
                key={sport.id}
                href={`/${urlPath}/${baseRoute}`}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors rounded-md mx-1 relative",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <SportLogo
                    sport={sport.id}
                    size="xs"
                    className={isActive ? sportColor : ""}
                  />
                </div>
                <span>{sport.name}</span>
                {isActive && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    layoutId="activeIndicator"
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
