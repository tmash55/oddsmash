"use client"

import HitRateDashboardV2 from "@/components/hit-rates/v2/hit-rate-dashboard-v2"
import { AuthGate } from "@/components/auth/auth-gate"

export default function HitRatesPage() {
  return (
    <div className="w-full min-h-screen bg-background">

        {/* Hit Rate Dashboard - full width on mobile */}
        <div className="mt-2 sm:mt-4 md:mt-8">

            <HitRateDashboardV2 />

        </div>
      </div>
  )
}
