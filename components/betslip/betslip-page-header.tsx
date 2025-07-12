"use client"

import { motion } from "framer-motion"
import { Plus, Receipt, Target, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { BetslipStats } from "@/types/betslip"

interface BetslipPageHeaderProps {
  stats: BetslipStats
  isCreating: boolean
  onCreateBetslip: () => void
  canCreateBetslip: boolean
}

export function BetslipPageHeader({ stats, isCreating, onCreateBetslip, canCreateBetslip }: BetslipPageHeaderProps) {
  return (
    <>
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-800/60 lg:hidden">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Receipt className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Betslips
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">Organize and compare your bets</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {stats.activeSelectionCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-full border border-green-200 dark:border-green-800 shadow-sm"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                    {stats.activeSelectionCount}
                  </span>
                </motion.div>
              )}

              <Button
                size="sm"
                onClick={onCreateBetslip}
                disabled={!canCreateBetslip || isCreating}
                className="h-9 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg"
              >
                {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                New
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl shadow-purple-500/25">
                  <Receipt className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                    My Betslips
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                    Organize and compare your betting selections
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {stats.activeSelectionCount > 0 && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-2xl border border-green-200 dark:border-green-800 shadow-sm"
                  >
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                      In Cart: {stats.activeSelectionCount} item{stats.activeSelectionCount !== 1 ? "s" : ""}
                    </span>
                  </motion.div>
                )}

                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="h-12 px-6 border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 bg-transparent"
                >
                  <a href="/mlb/props">
                    <Target className="h-5 w-5 mr-2" />
                    Browse Props
                  </a>
                </Button>

                <Button
                  onClick={onCreateBetslip}
                  disabled={!canCreateBetslip || isCreating}
                  size="lg"
                  className="h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/25"
                >
                  {isCreating ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Plus className="h-5 w-5 mr-2" />}
                  New Betslip
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
