import { PropComparisonTable } from "@/components/prop-comparison/prop-table";
import { GradientBackground } from "@/components/ui/gradient-background";

interface PlayerPropsPageProps {
  params: {
    sport: string;
  };
}

export default function PlayerPropsPage({ params }: PlayerPropsPageProps) {
  // Map route param to API sport key
  const sportMap: { [key: string]: string } = {
    nba: "basketball_nba",
    ncaab: "basketball_ncaab",
    mlb: "baseball_mlb",
    nhl: "hockey_nhl",
    nfl: "americanfootball_nfl",
  };

  const sport = sportMap[params.sport] || "basketball_nba";

  return (
    <div className="flex min-h-screen flex-col">
      <div className="relative">
        <GradientBackground />

        <main className="container py-8 md:py-12">
          <div className="mx-auto max-w-6xl space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">
                Player Prop Comparison
              </h1>
              <p className="text-muted-foreground">
                Compare player prop odds across major sportsbooks to find the
                best value for your bets.
              </p>
            </div>

            <PropComparisonTable sport={sport} />

            <div className="bg-card rounded-lg border shadow-sm p-6 space-y-4">
              <h2 className="text-xl font-bold">About Prop Comparison</h2>
              <p className="text-muted-foreground">
                Our Prop Comparison tool helps you find the best odds for player
                props across all major sportsbooks. We highlight the best
                available odds to help you maximize your potential returns.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">How to Use</h3>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>
                      Select the stat type you&apos;re interested in (Points,
                      Rebounds, etc.)
                    </li>
                    <li>Toggle between Over, Under, or Both views</li>
                    <li>
                      Look for highlighted cells indicating the best available
                      odds
                    </li>
                    <li>Compare lines and odds across different sportsbooks</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Benefits</h3>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Find the best odds for any player prop</li>
                    <li>Identify line shopping opportunities</li>
                    <li>Make more informed betting decisions</li>
                    <li>Save time by having all odds in one place</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
