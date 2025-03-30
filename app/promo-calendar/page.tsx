import { PromoCalendar } from "@/components/promo-calendar/calendar";
import { GradientBackground } from "@/components/ui/gradient-background";

export default function PromoCalendarPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="relative">
        <GradientBackground />

        <main className="container py-8 md:py-12">
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">
                Sportsbook Promotions
              </h1>
              <p className="text-muted-foreground">
                Stay up to date with the latest promotions from all major
                sportsbooks. Never miss a valuable offer again.
              </p>
            </div>

            <PromoCalendar />

            <div className="bg-card rounded-lg border shadow-sm p-6 space-y-4">
              <h2 className="text-xl font-bold">About Our Promo Calendar</h2>
              <p className="text-muted-foreground">
                Our Promo Calendar helps you track and compare promotions across
                all major sportsbooks. We update this calendar daily to ensure
                you have access to the most current offers.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">How to Use</h3>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Browse promotions by date using the calendar view</li>
                    <li>Filter by sportsbook to find specific offers</li>
                    <li>Click on any promotion to view full details</li>
                    <li>Copy promo codes with a single click</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Benefits</h3>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Never miss a valuable promotion</li>
                    <li>Compare offers across multiple sportsbooks</li>
                    <li>Plan your betting strategy around the best promos</li>
                    <li>Save time by having all offers in one place</li>
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
