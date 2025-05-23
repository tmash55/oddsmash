import HitRateDashboardV2 from "@/components/hit-rates/v2/hit-rate-dashboard-v2"

export const metadata = {
  title: "Hit Rates | OddSmash",
  description: "View player hit rates for sports betting props",
}

export default function HitRatesPage() {
  return (
    <div className="w-full min-h-screen bg-background">
      {/* Mobile-first approach with no horizontal padding on small screens */}
      <div className="px-0 sm:px-4 md:px-6 lg:container lg:mx-auto py-4 sm:py-6 md:py-8">
        {/* Responsive heading with smaller text and padding on mobile */}
        <h1 className="text-2xl sm:text-3xl font-bold px-4 sm:px-0 mb-4 sm:mb-6">Hit Rates Dashboard</h1>

        {/* Hit Rate Dashboard - full width on mobile */}
        <div className="mt-2 sm:mt-4 md:mt-8">
          <HitRateDashboardV2 />
        </div>
      </div>
    </div>
  )
}
