"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { TrendingUp, Target, Zap } from "lucide-react"

export function ArbLoading() {
  return (
    <div className="rounded-xl border bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-slate-950/80 dark:to-slate-900/80 backdrop-blur-sm border-gray-200 dark:border-slate-800 shadow-lg overflow-hidden">
      {/* Enhanced Header Skeleton */}
      <div className="bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shadow-md backdrop-blur-sm">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              >
                <TrendingUp className="w-5 h-5" />
              </motion.div>
            </div>
            <div>
              <h2 className="text-xl font-bold">Arbitrage Opportunities</h2>
              <p className="text-white/80 text-sm">Scanning for risk-free profits...</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span className="text-sm text-white/80">Found</span>
              </div>
              <Skeleton className="h-8 w-12 bg-white/20" />
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="text-sm text-white/80">Best</span>
              </div>
              <Skeleton className="h-8 w-16 bg-white/20" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Filter Bar Skeleton */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Skeleton className="h-10 w-full max-w-sm bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-16 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30" />
            <Skeleton className="h-10 w-20 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30" />
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-8 w-12 bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30"
              />
            ))}
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="rounded-xl border bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-slate-950/80 dark:to-slate-900/80 backdrop-blur-sm border-gray-200 dark:border-slate-800 shadow-lg overflow-hidden">
          <div className="relative max-h-[70vh] overflow-auto">
            {/* Header Skeleton */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-white/95 to-gray-50/95 dark:from-slate-950/95 dark:to-slate-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-slate-800 p-4">
              <div className="grid grid-cols-6 gap-4">
                <Skeleton className="h-6 w-16 bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30" />
                <Skeleton className="h-6 w-20 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30" />
                <Skeleton className="h-6 w-16 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30" />
                <Skeleton className="h-6 w-24 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30" />
                <Skeleton className="h-6 w-20 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30" />
                <Skeleton className="h-6 w-16 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30" />
              </div>
            </div>

            {/* Rows Skeleton */}
            <div className="space-y-0">
              {Array.from({ length: 6 }).map((_, rowIdx) => (
                <motion.div
                  key={rowIdx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: rowIdx * 0.1 }}
                  className="grid grid-cols-6 gap-4 p-4 border-b border-gray-200 dark:border-slate-800"
                >
                  {/* Arb % */}
                  <div className="flex justify-center">
                    <Skeleton className="h-8 w-16 rounded-xl bg-gradient-to-r from-emerald-200 to-green-200 dark:from-emerald-800/50 dark:to-green-800/50" />
                  </div>

                  {/* Event */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30" />
                    <Skeleton className="h-3 w-24 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30" />
                    <Skeleton className="h-3 w-20 bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-900/30 dark:to-slate-900/30" />
                  </div>

                  {/* Market */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30" />
                    <Skeleton className="h-6 w-16 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30" />
                  </div>

                  {/* Books & Odds */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 border border-gray-200 dark:border-slate-700">
                      <Skeleton className="h-4 w-32 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-12 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30" />
                        <Skeleton className="h-5 w-5 rounded bg-gradient-to-r from-gray-200 to-slate-200 dark:from-gray-700 dark:to-slate-700" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 border border-gray-200 dark:border-slate-700">
                      <Skeleton className="h-4 w-32 bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-12 bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30" />
                        <Skeleton className="h-5 w-5 rounded bg-gradient-to-r from-gray-200 to-slate-200 dark:from-gray-700 dark:to-slate-700" />
                      </div>
                    </div>
                  </div>

                  {/* Bet Size */}
                  <div className="space-y-3 flex flex-col items-center">
                    <Skeleton className="h-10 w-28 rounded-lg bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30" />
                    <Skeleton className="h-10 w-28 rounded-lg bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30" />
                    <Skeleton className="h-3 w-20 bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-900/30 dark:to-slate-900/30" />
                  </div>

                  {/* Profit */}
                  <div className="flex flex-col items-center gap-2">
                    <Skeleton className="h-10 w-20 rounded-xl bg-gradient-to-r from-green-200 to-emerald-200 dark:from-green-800/50 dark:to-emerald-800/50" />
                    <Skeleton className="h-3 w-16 bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-900/30 dark:to-slate-900/30" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
