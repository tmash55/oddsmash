"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Suspense } from "react"
import { PropComparisonDashboardV2 } from "@/components/prop-comparison/v2/prop-comparison-dashboard-v2"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { SUPPORTED_MARKETS } from "@/lib/constants/markets"
import { PropsNavigation } from "@/components/props/props-navigation"
import { usePathname } from "next/navigation"

interface PropsPageProps {
  params: {
    sport: string
  }
  searchParams: {
    market?: string
  }
}

// Loading skeleton component
function PropsPageSkeleton() {
  return (
    <Card>
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-[400px]" />
      </div>
    </Card>
  )
}

export default function PropsPage({ params, searchParams }: PropsPageProps) {
  const { sport } = params
  const { market } = searchParams
  const router = useRouter()
  const pathname = usePathname()

  // Extract the current category from the URL path using pathname
  // URL pattern is /[sport]/odds/[category]
  const currentCategory = pathname.split("/").slice(-1)[0].split("?")[0]

  // Redirect to default market if none specified
  useEffect(() => {
    if (!market) {
      const defaultMarket = SUPPORTED_MARKETS[sport]?.[0]
      if (defaultMarket) {
        router.push(`/${sport}/odds/player-props?market=${encodeURIComponent(defaultMarket)}`)
      }
    }
  }, [sport, market, router])

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {sport.toUpperCase()} {market || 'Player Props'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1 max-w-[85ch]">
              Compare player prop odds across sportsbooks and find the best value bets.
            </p>
          </div>
        </div>
      </div>

      {/* Props Navigation */}
      <div className="mb-6">
        <PropsNavigation 
          currentSport={sport}
          currentMarket={market}
          currentCategory={currentCategory}
        />
      </div>
      
      {/* Dashboard Content */}
      <Suspense fallback={<PropsPageSkeleton />}>
        <PropComparisonDashboardV2 sport={sport} />
      </Suspense>
    </div>
  )
}
