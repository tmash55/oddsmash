"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { Check, ChevronDown, Info, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { sportsbooks } from "@/data/sportsbooks";
import { motion } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";

interface ActiveSportsbookSelectorProps {
  selectedSportsbooks: string[];
  activeSportsbook: string;
  onSelectSportsbook: (id: string) => void;
  className?: string;
}

export function ActiveSportsbookSelector({
  selectedSportsbooks,
  activeSportsbook,
  onSelectSportsbook,
  className,
}: ActiveSportsbookSelectorProps) {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 640px)");
  const tooltipButtonRef = useRef<HTMLButtonElement>(null);

  // Find the active sportsbook details
  const activeSportsbookDetails = sportsbooks.find(
    (sb) => sb.id === activeSportsbook
  );

  // Handle tooltip click for mobile
  const handleTooltipClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMobile) {
      setIsTooltipOpen((prev) => !prev);
    }
  };

  // Auto-close tooltip after 5 seconds on mobile
  useEffect(() => {
    if (isMobile && isTooltipOpen) {
      const timer = setTimeout(() => {
        setIsTooltipOpen(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isMobile, isTooltipOpen]);

  // Close tooltip when clicking outside
  useEffect(() => {
    if (isMobile && isTooltipOpen) {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          tooltipButtonRef.current &&
          !tooltipButtonRef.current.contains(e.target as Node)
        ) {
          setIsTooltipOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isMobile, isTooltipOpen]);

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              className={cn(
                "flex items-center gap-2 border-border/60 bg-background/80 hover:bg-background/90 hover:border-primary/30 transition-all duration-200",
                isMobile ? "h-10 px-3 w-full justify-between" : "h-9 px-3",
                className
              )}
            >
              <div className="w-5 h-5 relative">
                {activeSportsbookDetails?.logo && (
                  <img
                    src={activeSportsbookDetails.logo || "/placeholder.svg"}
                    alt={activeSportsbookDetails.name}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              <span
                className={cn(
                  "font-medium truncate",
                  isMobile
                    ? "text-sm flex-1 text-left"
                    : "text-sm max-w-[100px]"
                )}
              >
                {activeSportsbookDetails?.name || "Select Sportsbook"}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </Button>
          </motion.div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={isMobile ? "center" : "start"}
          className={cn(
            "p-1",
            isMobile ? "w-[90vw] max-w-[350px]" : "w-[220px]"
          )}
        >
          <div className="py-1.5 px-2 text-xs font-medium text-muted-foreground border-b mb-1">
            Select Sportsbook
          </div>
          <div className={cn(isMobile ? "max-h-[40vh] overflow-y-auto" : "")}>
            {selectedSportsbooks.map((sbId) => {
              const sb = sportsbooks.find((s) => s.id === sbId);
              if (!sb) return null;

              const isActive = activeSportsbook === sb.id;

              return (
                <motion.div
                  key={sb.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <DropdownMenuItem
                    className={cn(
                      "flex items-center gap-2 cursor-pointer rounded-md transition-colors duration-150",
                      isMobile ? "py-3 px-3 my-1" : "py-2 px-2 my-0.5",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted"
                    )}
                    onClick={() => onSelectSportsbook(sb.id)}
                  >
                    <div className="w-5 h-5 relative">
                      {sb.logo && (
                        <img
                          src={sb.logo || "/placeholder.svg"}
                          alt={sb.name}
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                    <span className="flex-1 truncate">{sb.name}</span>
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 15,
                        }}
                      >
                        <Check className="h-4 w-4 text-primary" />
                      </motion.div>
                    )}
                  </DropdownMenuItem>
                </motion.div>
              );
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <TooltipProvider>
        <Tooltip open={isTooltipOpen} onOpenChange={setIsTooltipOpen}>
          <TooltipTrigger asChild>
            <motion.div
              whileHover={{ scale: isMobile ? 1 : 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button
                ref={tooltipButtonRef}
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-full transition-colors duration-200",
                  isMobile
                    ? "h-10 w-10 active:text-primary/70"
                    : "h-8 w-8 hover:text-primary/70"
                )}
                onClick={handleTooltipClick}
              >
                <Info
                  className={cn(
                    "text-primary/80",
                    isMobile ? "h-5 w-5" : "h-4 w-4"
                  )}
                />
                <span className="sr-only">Help</span>
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent
            side={isMobile ? "bottom" : "right"}
            className={cn(
              "rounded-lg border border-primary/20 bg-popover shadow-lg",
              isMobile ? "max-w-[300px] p-3" : "max-w-[280px] p-4"
            )}
            sideOffset={isMobile ? 10 : 5}
          >
            <div className="flex gap-2 items-start">
              <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1 text-popover-foreground">
                  Sportsbook Selection
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Select which sportsbook to display odds from. You can change
                  your preferred sportsbooks in settings.
                </p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
