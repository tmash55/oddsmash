import { ParlayBuilder } from "@/components/parlay-builder/parlay-builder";

export default function ParlayBuilderPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="relative">
        <main className="container py-8 md:py-12">
          <div className="mx-auto max-w-6xl space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">
                Parlay Builder
              </h1>
              <p className="text-muted-foreground">
                Build custom parlays and compare odds across sportsbooks to
                maximize your potential payout.
              </p>
            </div>

            <ParlayBuilder />

            <div className="bg-card rounded-lg border shadow-sm p-6 space-y-4">
              <h2 className="text-xl font-bold">About Parlay Builder</h2>
              <p className="text-muted-foreground">
                Our Parlay Builder tool helps you create custom parlays and find
                the best odds across all major sportsbooks. Select your bets,
                compare the odds, and place your parlay with the sportsbook
                offering the highest payout.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">How to Use</h3>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Select a sport and browse available games</li>
                    <li>Add bets to your betslip by clicking on the odds</li>
                    <li>View your betslip to see potential payouts</li>
                    <li>Compare parlay odds across different sportsbooks</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Benefits</h3>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Find the best parlay odds in seconds</li>
                    <li>Discover odds boosts and promotions</li>
                    <li>Save your favorite parlays for later</li>
                    <li>Track your parlay performance over time</li>
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
