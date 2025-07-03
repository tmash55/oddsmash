"use client"

import { notFound } from "next/navigation"
import HitSheetsDashboard from "@/components/hit-sheets/hit-sheets-dashboard"

interface HitSheetsPageProps {
  params: {
    sport: string
  }
}

export default function HitSheetsPage({ params }: HitSheetsPageProps) {
  const sport = params.sport.toLowerCase()
  
  // Only allow MLB hit sheets
  if (sport !== "mlb") {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <HitSheetsDashboard/>
    </div>
  )
} 