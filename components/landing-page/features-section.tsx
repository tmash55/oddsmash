import {
  BarChart3,
  Calendar,
  Check,
  DollarSign,
  LineChart,
  PieChart,
  Search,
} from "lucide-react";
import { GradientBackground } from "../ui/gradient-background";
import { SectionTransition } from "../ui/section-transition";
import { ScrollFade } from "../ui/scroll-fade";

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative bg-muted/50 py-16 md:py-24 lg:py-32 overflow-hidden"
    >
      <GradientBackground className="opacity-30" />
      <SectionTransition position="top" className="z-10" />
      <div className="container space-y-16">
        <ScrollFade>
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Powerful Tools for Smarter Betting
            </h2>
            <p className="max-w-[85%] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Our suite of betting tools helps you find the best odds, track
              promotions, and make more informed decisions.
            </p>
          </div>
        </ScrollFade>
        <ScrollFade>
          <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
            <div className="relative overflow-hidden rounded-lg border bg-background p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div className="mt-4 space-y-2">
                <h3 className="text-xl font-bold">Player Prop Comparison</h3>
                <p className="text-muted-foreground">
                  Compare over/under lines for player props across major
                  sportsbooks with alternate lines and odds highlighted.
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Best odds highlighted</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Alternate lines with odds</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Advanced filtering options</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-background p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div className="mt-4 space-y-2">
                <h3 className="text-xl font-bold">Promo Calendar</h3>
                <p className="text-muted-foreground">
                  Weekly calendar view of recurring promos from major
                  sportsbooks with visual badges and tags per day.
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Visual promo badges</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Filter by book or sport</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Set reminders for favorite promos</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-background p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <PieChart className="h-6 w-6 text-primary" />
              </div>
              <div className="mt-4 space-y-2">
                <h3 className="text-xl font-bold">Parlay Builder</h3>
                <p className="text-muted-foreground">
                  Custom interface to build a parlay just like on a sportsbook
                  with real-time odds comparison across all books.
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Add multiple legs</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Real-time parlay odds</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Highlight books with highest payout</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-background p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <div className="mt-4 space-y-2">
                <h3 className="text-xl font-bold">Advanced Filters</h3>
                <p className="text-muted-foreground">
                  Filter by sport, stat type, time frame, and more to find
                  exactly what you&apos;re looking for.
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Sport-specific filters</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Stat type selection</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Time-based filtering</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-background p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <LineChart className="h-6 w-6 text-primary" />
              </div>
              <div className="mt-4 space-y-2">
                <h3 className="text-xl font-bold">Historical Trends</h3>
                <p className="text-muted-foreground">
                  View historical performance data and trends to make more
                  informed betting decisions.
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Player performance history</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Historical hit rates</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Matchup-specific trends</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-background p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div className="mt-4 space-y-2">
                <h3 className="text-xl font-bold">Value Finder</h3>
                <p className="text-muted-foreground">
                  Automatically identify the best value bets based on odds
                  discrepancies across sportsbooks.
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Odds discrepancy alerts</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Value bet recommendations</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Personalized value thresholds</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </ScrollFade>
      </div>
      <SectionTransition position="bottom" className="z-10" />
    </section>
  );
}
