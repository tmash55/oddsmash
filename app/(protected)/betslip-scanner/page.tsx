import { ScannerDashboard } from "@/components/betslip-scanner/scanner-dashboard"

export default function BetslipScannerPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
        Only available for MLB markets — more coming soon.
      </div>
      <ScannerDashboard />
    </div>
  )
}

export const metadata = {
  title: "Betslip Scanner | OddsSmash",
  description:
    "Upload any betslip screenshot and compare odds across all major sportsbooks. Extract picks from social media parlays and recreate them with the best available lines.",
}