"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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
        window.addEventListener("resize", checkScroll);
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
        {/* Left Scroll Button */}
        {canScrollLeft && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-sm"
            onClick={() => handleScroll("left")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto scrollbar-hide py-2 px-2 -mx-2"
        >
          {sports.map((sport) => (
            <button
              key={sport.id}
              data-sport-id={sport.id}
              className={cn(
                "flex flex-col items-center justify-center min-w-[72px] px-2 py-2 rounded-lg transition-colors",
                selectedSport === sport.id
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted/50"
              )}
              onClick={() => onSelectSport(sport.id)}
            >
              <SportIcon sport={sport.id} size="md" />
              <span className="mt-1 text-xs font-medium truncate max-w-[70px] text-center">
                {sport.name}
              </span>
            </button>
          ))}
        </div>

        {/* Right Scroll Button */}
        {canScrollRight && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-sm"
            onClick={() => handleScroll("right")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Desktop View - Grid Layout */}
      <div className="hidden sm:grid grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {sports.map((sport) => (
          <button
            key={sport.id}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-lg transition-colors",
              selectedSport === sport.id
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted/50"
            )}
            onClick={() => onSelectSport(sport.id)}
          >
            <SportIcon sport={sport.id} size="lg" />
            <span className="mt-2 text-sm font-medium">{sport.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
