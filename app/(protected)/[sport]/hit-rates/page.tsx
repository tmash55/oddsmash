"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import HitRateDashboardV4 from "@/components/hit-rates/v4/hit-rate-dashboard-v4"
import { SPORT_CONFIGS, type SupportedSport, type SportMarket } from "@/types/sports"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"
import FeedbackButton from "@/components/shared/FeedbackButton"
import { HitRatesNavigation } from "@/components/hit-rates/hit-rates-navigation"

interface HitRatesPageProps {
  params: {
    sport: string
  }
  searchParams: {
    market?: string
  }
}

// Loading skeleton component
function HitRatesPageSkeleton() {
  return (
    <Card>
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-6 w-[300px]" />
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-[500px] w-full" />
        </div>
      </div>
    </Card>
  )
}

function HitRatesPageContent({ params, searchParams }: HitRatesPageProps) {
  const router = useRouter()
  const sport = params.sport as SupportedSport
  const sportConfig = SPORT_CONFIGS[sport]

  // Validate sport parameter
  if (!sportConfig) {
    notFound()
  }

  // Show coming soon page for inactive sports
  if (!sportConfig.isActive) {
    return (
      <div className="w-full">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {sportConfig.name} Hit Rates
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1 max-w-[85ch]">
                {sportConfig.comingSoonMessage}
              </p>
            </div>
          </div>
        </div>

        {/* Sports Navigation */}
        <div className="mb-6">
          <HitRatesNavigation currentSport={sport} />
        </div>
        
        {/* Coming Soon Content */}
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="p-4 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/20 dark:to-orange-800/20 mb-6">
            <TrendingUp className="h-12 w-12 text-orange-600 dark:text-orange-400 mx-auto" />
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">
            We're working hard to bring you comprehensive hit rate analysis for {sportConfig.name}.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500 max-w-md">
            Check back soon for player statistics, hit rate trends, and advanced analytics!
          </p>
        </div>
      </div>
    )
  }

  // Handle market parameter from search params
  let market: SportMarket
  const marketParam = searchParams.market

  if (marketParam) {
    // Decode market from search params (e.g., "home+runs" -> "Home Runs")
    const decodedMarket = decodeURIComponent(marketParam.replace(/\+/g, ' '))
    
    // Validate market parameter
    const isValidMarket = sportConfig.markets.some(m => 
      m.value.toLowerCase() === decodedMarket.toLowerCase() ||
      m.label.toLowerCase() === decodedMarket.toLowerCase()
    )
    
    if (!isValidMarket) {
      // Redirect to default market if invalid market provided
      const defaultMarket = sportConfig.defaultMarket
      const encodedDefaultMarket = encodeURIComponent(defaultMarket).replace(/%20/g, '+')
      router.replace(`/${sport}/hit-rates?market=${encodedDefaultMarket}`)
      return <HitRatesPageSkeleton />
    }

    // Find the exact market value
    const marketConfig = sportConfig.markets.find(m => 
      m.value.toLowerCase() === decodedMarket.toLowerCase() ||
      m.label.toLowerCase() === decodedMarket.toLowerCase()
    )
    market = marketConfig?.value as SportMarket
  } else {
    // No market specified, redirect to default market
    const defaultMarket = sportConfig.defaultMarket
    const encodedDefaultMarket = encodeURIComponent(defaultMarket).replace(/%20/g, '+')
    router.replace(`/${sport}/hit-rates?market=${encodedDefaultMarket}`)
    return <HitRatesPageSkeleton />
  }

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {sportConfig.name} {market}
              <span className="ml-2 text-base font-normal text-slate-500 dark:text-slate-400">V4</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1 max-w-[85ch]">
              Analyze {market.toLowerCase()} {sportConfig.statTerminology.hitRate.toLowerCase()} for {sportConfig.name} players.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FeedbackButton toolName={`${sport}_hit_rates_v4`} />
          </div>
        </div>
      </div>

      {/* Sports Navigation */}
      <div className="mb-6">
        <HitRatesNavigation currentSport={sport} />
      </div>
      
      {/* Dashboard Content */}
      <HitRateDashboardV4 sport={sport} />
    </div>
  )
}

export default function HitRatesPage(props: HitRatesPageProps) {
  return (
    <Suspense fallback={<HitRatesPageSkeleton />}>
      <HitRatesPageContent {...props} />
    </Suspense>
  )
} 