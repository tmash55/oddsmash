"use client"

import HitSheetsDashboard from "@/components/hit-sheets/hit-sheets-dashboard"


export default function QuickHitsPage() {
  return (
    <div className="w-full min-h-screen bg-background">

        {/* Hit Rate Dashboard - full width on mobile */}
        <div className="mt-2 sm:mt-4 md:mt-8">

            <HitSheetsDashboard />

        </div>
      </div>
  )
  
}   