import { notFound } from "next/navigation"
import { validateSport } from "@/lib/utils"
import HitSheetsDashboard from "@/components/hit-sheets/hit-sheets-dashboard"

interface HitSheetsPageProps {
  params: {
    sport: string
  }
}

export default function HitSheetsPage({ params }: HitSheetsPageProps) {
  const sport = params.sport.toUpperCase()
  
  // Validate sport parameter
  if (!validateSport(sport)) {
    notFound()
  }

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="mt-2 sm:mt-4 md:mt-8">
        <HitSheetsDashboard sport={sport} />
      </div>
    </div>
  )
} 