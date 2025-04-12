"use client";

import { useState, useEffect } from "react";
import { ParlayBuilder } from "@/components/parlay-builder/parlay-builder";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Info,
  Calculator,
  Zap,
  TrendingUp,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Menu,
} from "lucide-react";
import { StateSelector } from "@/components/state-selector";
import { SportsbookSelector } from "@/components/sportsbook-selector";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function ParlayBuilderPage() {
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

  return (
    <div className="flex min-h-screen flex-col overflow-hidden">
      <div className="relative w-full max-w-full">
        {/* Mobile-optimized header with collapsible sections */}
        <div className="container py-4 md:py-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Parlay Builder
                </h1>
                <p className="text-sm md:text-base text-muted-foreground mt-1">
                  Build custom parlays and find the best odds
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
                  <Calculator className="h-4 w-4" />
                  <AlertTitle>
                    Compare Parlay Odds Across Sportsbooks
                  </AlertTitle>
                  <AlertDescription className="text-sm">
                    Our free parlay builder helps you find the best odds for
                    your bets. Create custom parlays with selections from
                    multiple games and sports, then compare payouts across
                    DraftKings, FanDuel, BetMGM, and more.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mt-4">
                  <div className="bg-card rounded-lg border p-3 md:p-4 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">
                        Build Custom Parlays
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Create parlays across multiple games
                      </p>
                    </div>
                  </div>

                  <div className="bg-card rounded-lg border p-3 md:p-4 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">
                        Find Best Parlay Odds
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Compare payouts across sportsbooks
                      </p>
                    </div>
                  </div>

                  <div className="bg-card rounded-lg border p-3 md:p-4 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">
                        Same Game Parlay Builder
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Create and compare SGP odds
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Parlay Builder Component - Full Width on Mobile */}
        <div className="w-full px-0 mx-auto sm:container">
          <ParlayBuilder />
        </div>

        {/* Collapsible Details Section - Hidden by default on mobile */}
        <div className="container mt-6 md:mt-8 mb-8 md:mb-12">
          {isMobile ? (
            <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
              <Button
                variant="ghost"
                className="w-full flex items-center justify-between p-4 h-auto"
                onClick={() => setShowDetails(!showDetails)}
              >
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-base">
                    About Our Parlay Builder
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
                          Our free parlay builder helps you create custom
                          parlays and find the best odds across DraftKings,
                          FanDuel, BetMGM, and other major sportsbooks. By
                          comparing parlay odds in one place, you can quickly
                          identify which sportsbook offers the highest potential
                          payout for your exact parlay.
                        </p>

                        <div className="space-y-3">
                          <h3 className="text-base font-semibold">
                            How to Use Our Parlay Builder
                          </h3>
                          <ul className="list-disc list-inside text-xs text-muted-foreground space-y-2">
                            <li>
                              <span className="font-medium text-foreground">
                                Select a Sport:
                              </span>{" "}
                              Choose from NBA, NFL, MLB, NHL, and more
                            </li>
                            <li>
                              <span className="font-medium text-foreground">
                                Add Selections:
                              </span>{" "}
                              Click on odds to add them to your betslip
                            </li>
                            <li>
                              <span className="font-medium text-foreground">
                                Compare Odds:
                              </span>{" "}
                              See which sportsbook offers the best payout
                            </li>
                            <li>
                              <span className="font-medium text-foreground">
                                Place Your Bet:
                              </span>{" "}
                              Click to open your parlay at the chosen sportsbook
                            </li>
                          </ul>
                        </div>

                        <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                          <h4 className="font-medium text-sm mb-1">
                            Same Game Parlay (SGP) Odds
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            SGPs are calculated differently by each sportsbook
                            based on their correlation models. While our tool
                            provides estimated SGP odds, the actual odds may
                            vary slightly at each sportsbook.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            // Desktop version - full content always visible
            <div className="bg-card rounded-lg border shadow-sm p-4 md:p-6 space-y-5 md:space-y-6">
              <h2 className="text-xl md:text-2xl font-bold">
                About Our Parlay Builder & Odds Comparison Tool
              </h2>

              <div className="space-y-4">
                <p className="text-sm md:text-base text-muted-foreground">
                  Our free parlay builder helps you create custom parlays and
                  find the best odds across DraftKings, FanDuel, BetMGM, and
                  other major sportsbooks. By comparing parlay odds in one
                  place, you can quickly identify which sportsbook offers the
                  highest potential payout for your exact parlay.
                </p>

                <div className="grid gap-5 md:gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">
                      How to Use Our Parlay Builder
                    </h3>
                    <ul className="list-disc list-inside text-xs md:text-sm text-muted-foreground space-y-2">
                      <li>
                        <span className="font-medium text-foreground">
                          Select a Sport:
                        </span>{" "}
                        Choose from NBA, NFL, MLB, NHL, and more
                      </li>
                      <li>
                        <span className="font-medium text-foreground">
                          Add Selections to Your Parlay:
                        </span>{" "}
                        Click on odds to add them to your betslip
                      </li>
                      <li>
                        <span className="font-medium text-foreground">
                          Compare Parlay Odds:
                        </span>{" "}
                        See which sportsbook offers the best payout
                      </li>
                      <li>
                        <span className="font-medium text-foreground">
                          Create Same Game Parlays:
                        </span>{" "}
                        Add multiple selections from the same game
                      </li>
                      <li>
                        <span className="font-medium text-foreground">
                          Place Your Bet:
                        </span>{" "}
                        Click directly to open your parlay at the chosen
                        sportsbook
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">
                      Why Compare Parlay Odds?
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Different sportsbooks offer different odds for the same
                      parlay. For example, a 3-leg parlay might pay +600 at one
                      sportsbook but +650 at another. On a $100 bet, that&apos;s
                      a $50 difference in potential profit!
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Our parlay odds comparison tool makes it easy to find the
                      best value for your bets, helping you maximize your
                      potential returns without having to manually check
                      multiple sportsbooks.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-5 md:pt-6">
                <h3 className="text-lg font-semibold mb-3">
                  Same Game Parlay (SGP) Odds
                </h3>
                <div className="bg-primary/5 p-3 md:p-4 rounded-lg border border-primary/20 flex flex-col sm:flex-row items-start gap-3">
                  <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Important Note About SGP Odds:
                      </span>{" "}
                      Same Game Parlays are calculated differently by each
                      sportsbook based on their correlation models. For example,
                      a parlay combining &quot;Over Total Points&quot; with
                      &quot;Team to Win&quot; might receive reduced odds because
                      these outcomes are correlated.
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-2">
                      While our tool provides estimated SGP odds, the actual
                      odds may vary slightly at each sportsbook. However, the
                      relative comparison between sportsbooks remains valuable
                      for finding the best value.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-5 md:pt-6">
                <h3 className="text-lg font-semibold mb-3">
                  Popular Parlay Types
                </h3>
                <div className="grid gap-2 md:gap-4 grid-cols-2 sm:grid-cols-3">
                  <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                    <h4 className="font-medium text-sm md:text-base">
                      Multi-Sport Parlays
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Combine bets across different sports
                    </p>
                  </div>
                  <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                    <h4 className="font-medium text-sm md:text-base">
                      Same Game Parlays
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Multiple bets from a single game
                    </p>
                  </div>
                  <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                    <h4 className="font-medium text-sm md:text-base">
                      Player Prop Parlays
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Combine player performance bets
                    </p>
                  </div>
                  <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                    <h4 className="font-medium text-sm md:text-base">
                      Moneyline Parlays
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Combine straight-up winner picks
                    </p>
                  </div>
                  <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                    <h4 className="font-medium text-sm md:text-base">
                      Spread + Total Parlays
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Combine point spreads with over/unders
                    </p>
                  </div>
                  <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                    <h4 className="font-medium text-sm md:text-base">
                      Cross-Game Parlays
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Bets from multiple different games
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-5 md:pt-6">
                <h3 className="text-lg font-semibold mb-3">
                  DraftKings vs FanDuel Parlay Odds Comparison
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground mb-4">
                  DraftKings and FanDuel often have different odds for the same
                  parlay. Our tool makes it easy to compare these major
                  sportsbooks side-by-side, along with other books like BetMGM,
                  Caesars, and more. This helps you find which sportsbook
                  consistently offers the best value for your parlays.
                </p>

                <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                  <div className="bg-card p-3 rounded-lg border">
                    <h4 className="font-medium mb-1 text-sm md:text-base">
                      Maximize Parlay Value
                    </h4>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Find which sportsbook offers the highest payout for your
                      exact parlay combination.
                    </p>
                  </div>
                  <div className="bg-card p-3 rounded-lg border">
                    <h4 className="font-medium mb-1 text-sm md:text-base">
                      Build Parlays Across Sports
                    </h4>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Create parlays that combine bets from different sports and
                      leagues in one place.
                    </p>
                  </div>
                  <div className="bg-card p-3 rounded-lg border">
                    <h4 className="font-medium mb-1 text-sm md:text-base">
                      Same Game Parlay Builder
                    </h4>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Build SGPs and compare how different sportsbooks price the
                      same combination.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
