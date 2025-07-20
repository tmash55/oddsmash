import { notFound } from "next/navigation"
import { validateSport } from "@/lib/utils"
import HitRateDashboardV2 from "@/components/hit-rates/v2/hit-rate-dashboard-v2"

interface HitRatesPageProps {
  params: {
    sport: string
  }
}

export default function HitRatesPage({ params }: HitRatesPageProps) {
  const sport = params.sport.toUpperCase()
  
  // Validate sport parameter
  if (!validateSport(sport)) {
    notFound()
  }

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="mt-2 sm:mt-4 md:mt-8">
        <HitRateDashboardV2 sport={sport} />
      </div>
    </div>
  )
} 