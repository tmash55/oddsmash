import { ReactNode } from "react"
import { createClient } from "@/libs/supabase/server"

export default async function BetslipScannerLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Betslip Scanner</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          Please create a free account or log in to use the Betslip Scanner.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <a
            href="/sign-up?redirectTo=/betslip-scanner"
            className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Create free account
          </a>
          <a
            href="/sign-in?redirectTo=/betslip-scanner"
            className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Log in
          </a>
        </div>
        <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">
          Only available for MLB markets — more coming soon.
        </p>
      </div>
    )
  }

  return <>{children}</>
}










