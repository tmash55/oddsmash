import { PropComparisonTable } from "@/components/prop-comparison/prop-table";
import { SportsSubNav } from "@/components/sports-sub-nav";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, TrendingUp, DollarSign, Zap, Search } from "lucide-react";
import { StateSelector } from "@/components/state-selector";
import { SportsbookSelector } from "@/components/sportsbook-selector";
import type { Metadata } from "next";

interface PlayerPropsPageProps {
  params: {
    sport: string;
  };
}

// Generate dynamic metadata for SEO
export async function generateMetadata({
  params,
}: PlayerPropsPageProps): Promise<Metadata> {
  const sportDisplayNames: { [key: string]: string } = {
    nba: "NBA",
    ncaab: "NCAAB",
    mlb: "MLB",
    nhl: "NHL",
    nfl: "NFL",
  };

  const sportName = sportDisplayNames[params.sport] || "Sports";

  return {
    title: `${sportName} Player Prop Comparison | Best Odds Across All Sportsbooks`,
    description: `Compare ${sportName} player prop odds across DraftKings, FanDuel, BetMGM and more. Find the best lines and odds for player props with our free comparison tool.`,
    keywords: `player prop comparison, best odds for player props, compare player prop lines, ${sportName} player props, prop bet finder, betting odds comparison tool, shop player prop lines, DraftKings vs FanDuel player props`,
  };
}

export default function PlayerPropsPage({ params }: PlayerPropsPageProps) {
  // Map route param to API sport key
  const sportMap: { [key: string]: string } = {
    nba: "basketball_nba",
    ncaab: "basketball_ncaab",
    mlb: "baseball_mlb",
    nhl: "icehockey_nhl",
    nfl: "americanfootball_nfl",
  };

  const sport = sportMap[params.sport] || "basketball_nba";

  // Get display name for the sport
  const getSportDisplayName = (sportKey: string) => {
    const displayNames: { [key: string]: string } = {
      basketball_nba: "NBA",
      basketball_ncaab: "NCAAB",
      baseball_mlb: "MLB",
      icehockey_nhl: "NHL",
      americanfootball_nfl: "NFL",
    };
    return displayNames[sportKey] || "NBA";
  };

  const sportDisplayName = getSportDisplayName(sport);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="relative">
        {/* Add the SportsSubNav component */}
        <SportsSubNav baseRoute="player-props" />

        <main className="container py-6 md:py-12">
          <div className="mx-auto max-w-6xl space-y-6 md:space-y-8">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    {sportDisplayName} Player Prop Comparison Tool
                  </h1>
                  <p className="text-muted-foreground mt-1 text-sm md:text-base">
                    Free odds comparison for player props across all major
                    sportsbooks
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StateSelector />
                  <SportsbookSelector />
                </div>
              </div>

              <Alert className="bg-primary/5 border-primary/20">
                <Search className="h-4 w-4" />
                <AlertTitle>Find the Best Player Prop Odds</AlertTitle>
                <AlertDescription className="text-sm">
                  Our free player prop comparison tool helps you shop for the
                  best lines and odds across DraftKings, FanDuel, BetMGM, and
                  more. Line shopping is essential for serious bettors looking
                  to maximize value.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mt-4 md:mt-6">
                <div className="bg-card rounded-lg border p-3 md:p-4 flex flex-col items-center text-center">
                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2 md:mb-3">
                    <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <h3 className="font-medium mb-1 text-sm md:text-base">
                    Compare Player Prop Lines
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Instantly compare player prop odds across all major
                    sportsbooks
                  </p>
                </div>

                <div className="bg-card rounded-lg border p-3 md:p-4 flex flex-col items-center text-center">
                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2 md:mb-3">
                    <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <h3 className="font-medium mb-1 text-sm md:text-base">
                    Shop for Best Odds
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Find the best value for over/under player props with one
                    click
                  </p>
                </div>

                <div className="bg-card rounded-lg border p-3 md:p-4 flex flex-col items-center text-center">
                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2 md:mb-3">
                    <Zap className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <h3 className="font-medium mb-1 text-sm md:text-base">
                    DraftKings vs FanDuel
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Compare player prop odds between DraftKings, FanDuel, and
                    other sportsbooks
                  </p>
                </div>
              </div>
            </div>

            <PropComparisonTable sport={sport} />

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

                <div className="grid gap-5 md:gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">
                      How to Use Our Player Prop Comparison Tool
                    </h3>
                    <ul className="list-disc list-inside text-xs md:text-sm text-muted-foreground space-y-2">
                      <li>
                        <span className="font-medium text-foreground">
                          Select a Game:
                        </span>{" "}
                        Choose from upcoming {sportDisplayName} games to compare
                        player props
                      </li>
                      <li>
                        <span className="font-medium text-foreground">
                          Choose a Stat Type:
                        </span>{" "}
                        Compare points, rebounds, assists, and other player prop
                        markets
                      </li>
                      <li>
                        <span className="font-medium text-foreground">
                          Shop for Best Lines:
                        </span>{" "}
                        Highlighted cells show the best available odds across
                        sportsbooks
                      </li>
                      <li>
                        <span className="font-medium text-foreground">
                          Compare Over/Under Props:
                        </span>{" "}
                        Toggle between over, under, or both views
                      </li>
                      <li>
                        <span className="font-medium text-foreground">
                          Place Your Bet:
                        </span>{" "}
                        Click directly on any odds to open that sportsbook with
                        your selected bet
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">
                      Why Shop for Player Prop Lines?
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Finding the best odds for your player prop bets can
                      significantly impact your long-term profitability. For
                      example, getting +115 instead of +105 on a $100 bet means
                      an extra $10 in profit when you win.
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Even more valuable is finding different lines across
                      sportsbooks. Getting Over 22.5 Points at one book when
                      others offer 23.5 gives you a massive edge that can be the
                      difference between winning and losing.
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Our free betting odds comparison tool makes this process
                      effortless by showing you all available options in one
                      place.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-5 md:pt-6">
                <h3 className="text-lg font-semibold mb-3">
                  Popular {sportDisplayName} Player Props to Compare
                </h3>
                <div className="grid gap-2 md:gap-4 grid-cols-2 sm:grid-cols-3">
                  {sport === "basketball_nba" ||
                  sport === "basketball_ncaab" ? (
                    <>
                      <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                        <h4 className="font-medium text-sm md:text-base">
                          Points
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Total points scored by a player
                        </p>
                      </div>
                      <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                        <h4 className="font-medium text-sm md:text-base">
                          Rebounds
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Total rebounds grabbed by a player
                        </p>
                      </div>
                      <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                        <h4 className="font-medium text-sm md:text-base">
                          Assists
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Total assists recorded by a player
                        </p>
                      </div>
                      <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                        <h4 className="font-medium text-sm md:text-base">
                          PRA (Points+Rebounds+Assists)
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Combined total of points, rebounds and assists
                        </p>
                      </div>
                      <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                        <h4 className="font-medium text-sm md:text-base">
                          Three Pointers
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Total three-point shots made
                        </p>
                      </div>
                      <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                        <h4 className="font-medium text-sm md:text-base">
                          Steals + Blocks
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Combined defensive stats
                        </p>
                      </div>
                    </>
                  ) : sport === "baseball_mlb" ? (
                    <>
                      <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                        <h4 className="font-medium text-sm md:text-base">
                          Strikeouts
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Total strikeouts by a pitcher
                        </p>
                      </div>
                      <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                        <h4 className="font-medium text-sm md:text-base">
                          Hits
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Total hits by a batter
                        </p>
                      </div>
                      <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                        <h4 className="font-medium text-sm md:text-base">
                          Home Runs
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Total home runs hit by a player
                        </p>
                      </div>
                      <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                        <h4 className="font-medium text-sm md:text-base">
                          Bases
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Total bases recorded by a player
                        </p>
                      </div>
                      <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                        <h4 className="font-medium text-sm md:text-base">
                          RBIs
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Runs batted in by a player
                        </p>
                      </div>
                      <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                        <h4 className="font-medium text-sm md:text-base">
                          Pitcher Outs
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Total outs recorded by a pitcher
                        </p>
                      </div>
                    </>
                  ) : sport === "icehockey_nhl" ? (
                    <>
                      <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                        <h4 className="font-medium text-sm md:text-base">
                          Points
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Goals + assists by a player
                        </p>
                      </div>
                      <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                        <h4 className="font-medium text-sm md:text-base">
                          Shots on Goal
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Total shots on goal by a player
                        </p>
                      </div>
                      <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                        <h4 className="font-medium text-sm md:text-base">
                          Goals
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Total goals scored by a player
                        </p>
                      </div>
                      <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                        <h4 className="font-medium text-sm md:text-base">
                          Assists
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Total assists by a player
                        </p>
                      </div>
                      <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                        <h4 className="font-medium text-sm md:text-base">
                          Saves
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Total saves by a goaltender
                        </p>
                      </div>
                      <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                        <h4 className="font-medium text-sm md:text-base">
                          Blocked Shots
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Total shots blocked by a player
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                        <h4 className="font-medium text-sm md:text-base">
                          Passing Yards
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Total passing yards by a quarterback
                        </p>
                      </div>
                      <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                        <h4 className="font-medium text-sm md:text-base">
                          Rushing Yards
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Total rushing yards by a player
                        </p>
                      </div>
                      <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                        <h4 className="font-medium text-sm md:text-base">
                          Receiving Yards
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Total receiving yards by a player
                        </p>
                      </div>
                      <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                        <h4 className="font-medium text-sm md:text-base">
                          Touchdowns
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Total touchdowns scored by a player
                        </p>
                      </div>
                      <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                        <h4 className="font-medium text-sm md:text-base">
                          Completions
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Total pass completions by a quarterback
                        </p>
                      </div>
                      <div className="bg-accent/20 p-2 md:p-3 rounded-md">
                        <h4 className="font-medium text-sm md:text-base">
                          Receptions
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Total catches by a receiver
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-primary/5 p-3 md:p-4 rounded-lg border border-primary/20 mt-4 md:mt-6 flex flex-col sm:flex-row items-start gap-3">
                <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium mb-1 text-sm md:text-base">
                    Compare DraftKings vs FanDuel Player Props
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Our free betting tool lets you compare player prop odds
                    between DraftKings, FanDuel, BetMGM, and other sportsbooks.
                    We automatically customize sportsbook links based on your
                    selected state, ensuring you're directed to the correct
                    state-specific version of each sportsbook when placing bets.
                  </p>
                </div>
              </div>

              <div className="border-t pt-5 md:pt-6">
                <h3 className="text-lg font-semibold mb-3">
                  Why Use Our Free Player Prop Comparison Tool?
                </h3>
                <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                  <div className="bg-card p-3 rounded-lg border">
                    <h4 className="font-medium mb-1 text-sm md:text-base">
                      Find Value in Player Props
                    </h4>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Quickly identify the best odds and lines for any player
                      prop bet across all major sportsbooks.
                    </p>
                  </div>
                  <div className="bg-card p-3 rounded-lg border">
                    <h4 className="font-medium mb-1 text-sm md:text-base">
                      Save Time Line Shopping
                    </h4>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Compare player prop odds in seconds instead of manually
                      checking multiple sportsbooks.
                    </p>
                  </div>
                  <div className="bg-card p-3 rounded-lg border">
                    <h4 className="font-medium mb-1 text-sm md:text-base">
                      Bet Smarter, Not Harder
                    </h4>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Make more informed betting decisions by seeing all
                      available options before placing your bets.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
