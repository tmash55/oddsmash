"use client"

import { notFound } from "next/navigation"
import HitRateDashboardV2 from "@/components/hit-rates/v2/hit-rate-dashboard-v2"

interface HitRatesPageProps {
  params: {
    sport: string
  }
}

const validSports = ["mlb", "nba", "nfl", "nhl"]

export default function HitRatesPage({ params }: HitRatesPageProps) {
  const sport = params.sport.toLowerCase()
  
  // Validate sport parameter
  if (!validSports.includes(sport)) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <HitRateDashboardV2 sport={sport.toUpperCase()} />
    </div>
  )
} 