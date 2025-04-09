"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Target, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMediaQuery } from "@/hooks/use-media-query";

export function StickyCTABanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Show the banner after scrolling down a bit
  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 60% of the viewport height
      const scrollThreshold = window.innerHeight * 0.6;

      if (window.scrollY > scrollThreshold && !isDismissed) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isDismissed]);

  // Check if the banner was previously dismissed (using localStorage)
  useEffect(() => {
    const bannerDismissed = localStorage.getItem("ctaBannerDismissed");
    if (bannerDismissed === "true") {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    // Store the dismissal in localStorage so it stays dismissed on page refresh
    localStorage.setItem("ctaBannerDismissed", "true");
  };

  // Reset dismissal after 24 hours
  useEffect(() => {
    const resetDismissal = () => {
      localStorage.removeItem("ctaBannerDismissed");
      setIsDismissed(false);
    };

    // Check if we should reset (once per component mount is enough)
    const lastDismissed = localStorage.getItem("ctaBannerDismissedTime");
    if (lastDismissed) {
      const dismissedTime = Number.parseInt(lastDismissed, 10);
      const currentTime = new Date().getTime();
      const hoursSinceDismissed =
        (currentTime - dismissedTime) / (1000 * 60 * 60);

      if (hoursSinceDismissed > 24) {
        resetDismissal();
      }
    }

    // When dismissing, also store the current time
    if (isDismissed) {
      localStorage.setItem(
        "ctaBannerDismissedTime",
        new Date().getTime().toString()
      );
    }
  }, [isDismissed]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6",
            "bg-gradient-to-r from-background/95 to-background/95 backdrop-blur-md",
            "border-t border-primary/20 shadow-lg"
          )}
        >
          <div className="container mx-auto">
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-0 right-0 md:-top-2 md:-right-2 p-1 rounded-full bg-background/80 border border-border hover:bg-accent/80 transition-colors"
                aria-label="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Content */}
              <div className="text-center md:text-left">
                <h2 className="text-xl md:text-2xl font-bold mb-1">
                  Start Building Smarter Parlays Today
                </h2>
                <p className="text-sm md:text-base text-muted-foreground">
                  No sign-up required. Just better odds.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Button
                  asChild
                  size={isMobile ? "default" : "lg"}
                  className="group"
                >
                  <Link href="//mlb/player-props">
                    <Search className="mr-2 h-4 w-4" />
                    Compare Props
                    <ArrowRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size={isMobile ? "default" : "lg"}
                  className="group border-primary/20 bg-primary/5 hover:bg-primary/10"
                >
                  <Link href="/parlay-builder">
                    <Target className="mr-2 h-4 w-4" />
                    Build a Parlay
                    <ArrowRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
