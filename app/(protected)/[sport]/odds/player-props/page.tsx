"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Suspense } from "react"
import { PropComparisonDashboardV2 } from "@/components/prop-comparison/v2/prop-comparison-dashboard-v2"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { SUPPORTED_MARKETS } from "@/lib/constants/markets"

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
        <Suspense fallback={<PropsPageSkeleton />}>
          <PropComparisonDashboardV2 sport={sport} />
        </Suspense>
  )
}
