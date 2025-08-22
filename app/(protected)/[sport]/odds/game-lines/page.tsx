"use client"

import { GameLinesDashboardV2 } from "@/components/prop-comparison/v2/game-lines/game-lines-dashboard-v2"
import { PropsNavigation } from "@/components/props/props-navigation"
import { usePathname, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface GameLinesPageProps {
  params: {
    sport: string
  }
}

export default function GameLinesPage({ params }: GameLinesPageProps) {
  const { sport } = params
  const pathname = usePathname()
  const currentCategory = pathname.split("/").slice(-1)[0].split("?")[0]
  const searchParams = useSearchParams()
  const marketParam = (searchParams?.get("market") || "").toLowerCase()

  const formatMarket = (m?: string) => {
    const key = (m || "").toLowerCase()
    const map: Record<string, string> = {
      h2h: "Moneyline",
      spreads: "Spreads",
      totals: "Totals",
    }
    if (map[key]) return map[key]
    if (!key) return "Game Lines"
    return key
      .replace(/[-_]/g, " ")
      .split(" ")
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
      .join(" ")
  }

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {sport.toUpperCase()} {formatMarket(marketParam)}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1 max-w-[85ch]">
              Compare moneyline, spread, and totals across sportsbooks.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mb-6">
        <PropsNavigation currentSport={sport} currentCategory={currentCategory} />
      </div>

      {/* Dashboard */}
      <GameLinesDashboardV2 sport={sport} />
    </div>
  )
} 