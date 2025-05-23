import { Metadata } from "next"
import QuickHitsDashboard from "@/components/quick-hits/quick-hits-dashboard"

export const metadata: Metadata = {
  title: "Quick Hits",
  description: "Fast access to popular hit rate functions and data sets",
}

export default function QuickHitsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <QuickHitsDashboard />
    </div>
  )
} 