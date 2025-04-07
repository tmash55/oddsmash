import { ParlayBuilder } from "@/components/parlay-builder/parlay-builder";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Calculator, Zap, TrendingUp, DollarSign } from "lucide-react";
import { StateSelector } from "@/components/state-selector";
import { SportsbookSelector } from "@/components/sportsbook-selector";
import type { Metadata } from "next";

// Generate dynamic metadata for SEO
export const metadata: Metadata = {
  title: "Parlay Builder & Odds Comparison | Find the Best Parlay Odds",
  description:
    "Build custom parlays and compare odds across DraftKings, FanDuel, BetMGM and more. Our free parlay builder helps you find the best odds for your bets.",
  keywords:
    "parlay builder, compare parlay odds, best odds for parlays, DraftKings vs FanDuel parlay odds, custom parlay betting tool, same game parlay builder, parlay line shopping",
};

export default function ParlayBuilderPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-hidden">
      <div className="relative w-full max-w-full">
        {/* Header Section - Responsive for both mobile and desktop */}
        <div className="container py-6 md:py-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Parlay Builder & Odds Comparison
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mt-1">
                Build custom parlays and find the best odds across all major
                sportsbooks
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StateSelector />
              <SportsbookSelector />
            </div>
          </div>

          <Alert className="bg-primary/5 border-primary/20">
            <Calculator className="h-4 w-4" />
            <AlertTitle>Compare Parlay Odds Across Sportsbooks</AlertTitle>
            <AlertDescription className="text-sm">
              Our free parlay builder helps you find the best odds for your
              bets. Create custom parlays with selections from multiple games
              and sports, then compare payouts across DraftKings, FanDuel,
              BetMGM, and more.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mt-4">
            <div className="bg-card rounded-lg border p-3 md:p-4 flex flex-col items-center text-center">
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2 md:mb-3">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <h3 className="font-medium mb-1 text-sm md:text-base">
                Build Custom Parlays
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Create parlays with selections from multiple games and sports
              </p>
            </div>

            <div className="bg-card rounded-lg border p-3 md:p-4 flex flex-col items-center text-center">
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2 md:mb-3">
                <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <h3 className="font-medium mb-1 text-sm md:text-base">
                Find Best Parlay Odds
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Compare parlay payouts across DraftKings, FanDuel, and more
              </p>
            </div>

            <div className="bg-card rounded-lg border p-3 md:p-4 flex flex-col items-center text-center">
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2 md:mb-3">
                <Zap className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <h3 className="font-medium mb-1 text-sm md:text-base">
                Same Game Parlay Builder
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Create and compare Same Game Parlay (SGP) odds
              </p>
            </div>
          </div>
        </div>

        {/* Parlay Builder Component - Full Width on Mobile */}
        <div className="w-full px-0 mx-auto sm:container">
          <ParlayBuilder />
        </div>

        {/* About Section - Visible on both mobile and desktop */}
        <div className="container mt-6 md:mt-8 mb-8 md:mb-12">
          <div className="bg-card rounded-lg border shadow-sm p-4 md:p-6 space-y-5 md:space-y-6">
            <h2 className="text-xl md:text-2xl font-bold">
              About Our Parlay Builder & Odds Comparison Tool
            </h2>

            <div className="space-y-4">
              <p className="text-sm md:text-base text-muted-foreground">
                Our free parlay builder helps you create custom parlays and find
                the best odds across DraftKings, FanDuel, BetMGM, and other
                major sportsbooks. By comparing parlay odds in one place, you
                can quickly identify which sportsbook offers the highest
                potential payout for your exact parlay.
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
                    sportsbook but +650 at another. On a $100 bet, that's a $50
                    difference in potential profit!
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Our parlay odds comparison tool makes it easy to find the
                    best value for your bets, helping you maximize your
                    potential returns without having to manually check multiple
                    sportsbooks.
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
                    sportsbook based on their correlation models. For example, a
                    parlay combining "Over Total Points" with "Team to Win"
                    might receive reduced odds because these outcomes are
                    correlated.
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-2">
                    While our tool provides estimated SGP odds, the actual odds
                    may vary slightly at each sportsbook. However, the relative
                    comparison between sportsbooks remains valuable for finding
                    the best value.
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
        </div>
      </div>
    </div>
  );
}
