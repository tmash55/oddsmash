"use client";

import { useState, useEffect } from "react";
import { PropComparisonTable } from "@/components/prop-comparison/prop-table";
import { SportsSubNav } from "@/components/sports-sub-nav";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Info,
  TrendingUp,
  DollarSign,
  Zap,
  Search,
  ChevronDown,
  ChevronUp,
  Menu,
} from "lucide-react";
import { StateSelector } from "@/components/state-selector";
import { SportsbookSelector } from "@/components/sportsbook-selector";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";


// Props for the client component
export interface PlayerPropsClientProps {
  params: {
    sport: string;
    propType: string; 
  };
  sportApiValue: string;
  sportDisplayName: string; 
}

// Export the client component logic
export default function PlayerPropsClient({ params, sportApiValue, sportDisplayName }: PlayerPropsClientProps) {
  const [showIntro, setShowIntro] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // On mobile, auto-collapse the intro section after the page loads
  useEffect(() => {
    if (isMobile) {
      const timer = setTimeout(() => {
        setShowIntro(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isMobile]);

  // --- JSX structure from the original PlayerPropsDisplay component ---
  return (
    <div className="flex min-h-screen flex-col">
      <div className="relative">
        <SportsSubNav baseRoute="props" />
        <main className="container py-4 md:py-12">
          <div className="mx-auto max-w-6xl space-y-4 md:space-y-8">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                      {sportDisplayName} Player Props 
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">
                      Compare odds across all major sportsbooks
                    </p>
                  </div>
                  {isMobile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowIntro(!showIntro)}
                      className="flex-shrink-0"
                    >
                      {showIntro ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <Menu className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StateSelector />
                  <SportsbookSelector />
                </div>
              </div>

              {/* Collapsible intro section */}
              <AnimatePresence>
                {(showIntro || !isMobile) && (
                  <motion.div
                    initial={isMobile ? { height: 0, opacity: 0 } : false}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <Alert className="bg-primary/5 border-primary/20">
                      <Search className="h-4 w-4" />
                      <AlertTitle>Find the Best Player Prop Odds</AlertTitle>
                      <AlertDescription className="text-sm">
                        Our free player prop comparison tool helps you shop for
                        the best lines and odds across DraftKings, FanDuel,
                        BetMGM, and more. Line shopping is essential for serious
                        bettors looking to maximize value.
                      </AlertDescription>
                    </Alert>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mt-4">
                      <div className="bg-card rounded-lg border p-3 md:p-4 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">
                            Compare Player Prop Lines
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Instantly compare odds across sportsbooks
                          </p>
                        </div>
                      </div>
                      <div className="bg-card rounded-lg border p-3 md:p-4 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <DollarSign className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">
                            Shop for Best Odds
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Find the best value with one click
                          </p>
                        </div>
                      </div>
                      <div className="bg-card rounded-lg border p-3 md:p-4 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Zap className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">
                            One-Click Betslip
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Tap to launch sportsbook with your bet ready
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Prop Comparison Table */}
            <div className="w-full px-0 mx-auto">
              <PropComparisonTable sport={sportApiValue} propType={params.propType} /> 
            </div>

            {/* Collapsible Details Section */}
            {isMobile ? (
                <div className="bg-card rounded-lg border shadow-sm overflow-hidden mt-4">
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-between p-4 h-auto"
                  onClick={() => setShowDetails(!showDetails)}
                >
                   <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-base">
                      About Player Prop Comparison
                    </span>
                  </div>
                  {showDetails ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 space-y-5 border-t">
                          <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            Our free player prop comparison tool helps you find
                            the best odds for {sportDisplayName} player props
                            across DraftKings, FanDuel, BetMGM, and other major
                            sportsbooks. By comparing player prop lines and odds
                            in one place, you can quickly identify value and
                            maximize your potential returns.
                          </p>

                          <div className="space-y-3">
                            <h3 className="text-base font-semibold">
                              How to Use Our Comparison Tool
                            </h3>
                            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-2">
                              <li>
                                <span className="font-medium text-foreground">
                                  Select a Game:
                                </span>{" "}
                                Choose from upcoming {sportDisplayName} games
                              </li>
                              <li>
                                <span className="font-medium text-foreground">
                                  Choose a Stat Type:
                                </span>{" "}
                                Compare points, rebounds, assists, etc.
                              </li>
                              <li>
                                <span className="font-medium text-foreground">
                                  Shop for Best Lines:
                                </span>{" "}
                                Highlighted cells show the best odds
                              </li>
                              <li>
                                <span className="font-medium text-foreground">
                                  Place Your Bet:
                                </span>{" "}
                                Click directly on any odds to open that
                                sportsbook
                              </li>
                            </ul>
                          </div>
                          </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="bg-card rounded-lg border shadow-sm p-4 md:p-6 space-y-5 md:space-y-6">
                 <h2 className="text-xl md:text-2xl font-bold">
                  {sportDisplayName} Player Prop Betting Comparison
                </h2>
                 <div className="space-y-4">
                  <p className="text-sm md:text-base text-muted-foreground">
                    Our free player prop comparison tool helps you find the best
                    odds for {sportDisplayName} player props across DraftKings,
                    FanDuel, BetMGM, and other major sportsbooks. By comparing
                    player prop lines and odds in one place, you can quickly
                    identify value and maximize your potential returns on player
                    prop bets.
                  </p>
                  </div>
                   <div className="border-t pt-5 md:pt-6">
                  <h3 className="text-lg font-semibold mb-3">
                    Popular {sportDisplayName} Player Props to Compare
                  </h3>
                  <div className="grid gap-2 md:gap-4 grid-cols-2 sm:grid-cols-3">
                    {/* Conditional rendering based on sportApiValue */} 
                     {sportApiValue === "basketball_nba" ||
                    sportApiValue === "basketball_ncaab" ? (
                      <>
                        <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                            <h5 className="font-medium text-sm md:text-base">
                              Points
                            </h5>
                            <p className="text-xs text-muted-foreground">
                              Over/Under 25.5 points
                            </p>
                          </div>
                      </>
                    ) : sportApiValue === "baseball_mlb" ? (
                     <>
                        <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                            <h5 className="font-medium text-sm md:text-base">
                              Strikeouts
                            </h5>
                            <p className="text-xs text-muted-foreground">
                              Over/Under 7.5 strikeouts
                            </p>
                          </div>
                      </>
                    ) : sportApiValue === "icehockey_nhl" ? (
                     <>
                        <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                            <h5 className="font-medium text-sm md:text-base">
                              Points
                            </h5>
                            <p className="text-xs text-muted-foreground">
                              Over/Under 1.5 points
                            </p>
                          </div>
                     </>
                    ) : ( /* Assuming NFL is the default/fallback */
                      <>
                        <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                            <h5 className="font-medium text-sm md:text-base">
                              Passing Yards
                            </h5>
                            <p className="text-xs text-muted-foreground">
                              Total passing yards by a quarterback
                            </p>
                          </div>
                      </>
                     )
                     }
                    </div>
                    </div>
              </div>
            )}
          </div>
        </main> 
      </div>
    </div>
  );
} 