import { notFound } from "next/navigation"
import HitRateDashboardV4 from "@/components/hit-rates/v4/hit-rate-dashboard-v4"
import { SPORT_CONFIGS, type SupportedSport, type SportMarket } from "@/types/sports"

interface Props {
  params: {
    sport: string
    market: string
  }
}

export default function HitRatesPage({ params }: Props) {
  const sport = params.sport as SupportedSport
  const sportConfig = SPORT_CONFIGS[sport]

  // Validate sport parameter
  if (!sportConfig) {
    notFound()
  }

  // Validate market parameter
  const decodedMarket = decodeURIComponent(params.market)
  const isValidMarket = sportConfig.markets.some(m => m.value === decodedMarket)
  if (!isValidMarket) {
    notFound()
  }

  const market = decodedMarket as SportMarket

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="mt-2 sm:mt-4 md:mt-8">
        <HitRateDashboardV4 sport={sport} market={market} />
      </div>
    </div>
  )
}

// Generate static params for supported sports and their markets
export function generateStaticParams() {
  return Object.entries(SPORT_CONFIGS)
    .filter(([_, config]) => config.isActive)
    .flatMap(([sport, config]) => 
      config.markets.map(market => ({
        sport,
        market: encodeURIComponent(market.value)
      }))
    )
} 