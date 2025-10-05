"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"

export function EvTableLoading() {
  return (
    <div className="rounded-xl border bg-white/80 dark:bg-slate-950/50 backdrop-blur-sm border-gray-200 dark:border-slate-800 shadow-lg overflow-hidden">
      {/* Enhanced Header Actions Skeleton */}
      <div className="flex items-center justify-between gap-4 p-4 border-b border-gray-200 dark:border-slate-800 bg-gradient-to-r from-gray-50/80 to-white/80 dark:from-slate-900/80 dark:to-slate-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            <Skeleton className="h-10 w-[280px] rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600" />
          </motion.div>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.2 }}
          >
            <Skeleton className="h-10 w-[140px] rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600 hidden md:block" />
          </motion.div>
        </div>
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.4 }}
          >
            <Skeleton className="h-10 w-[100px] rounded-xl bg-gradient-to-r from-emerald-200 to-emerald-300 dark:from-emerald-800 dark:to-emerald-700" />
          </motion.div>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.6 }}
          >
            <Skeleton className="h-10 w-[100px] rounded-xl bg-gradient-to-r from-blue-200 to-blue-300 dark:from-blue-800 dark:to-blue-700" />
          </motion.div>
        </div>
      </div>

      {/* Enhanced Table Header Skeleton */}
      <div className="hidden md:grid grid-cols-[100px,140px,300px,240px,240px,160px,140px,120px] gap-0 divide-x divide-gray-200 dark:divide-slate-800 bg-gradient-to-r from-white/90 to-gray-50/90 dark:from-slate-950/90 dark:to-slate-900/90 backdrop-blur-sm px-4 py-3 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-10">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: i * 0.1 }}
            className="flex items-center justify-center px-2"
          >
            <Skeleton className="h-5 w-full rounded-lg bg-gradient-to-r from-gray-300 to-gray-400 dark:from-slate-600 dark:to-slate-500" />
          </motion.div>
        ))}
      </div>

      {/* Enhanced Rows Skeleton with Staggered Animation */}
      <div className="max-h-[65vh] overflow-auto">
        {Array.from({ length: 10 }).map((_, rowIdx) => (
          <motion.div
            key={rowIdx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: rowIdx * 0.1 }}
            className="grid md:grid-cols-[100px,140px,300px,240px,240px,160px,140px,120px] grid-cols-3 gap-0 px-4 py-4 border-b border-gray-200 dark:border-slate-800 divide-x divide-gray-200 dark:divide-slate-800 hover:bg-gray-50/50 dark:hover:bg-slate-900/50 transition-colors"
          >
            {/* EV% Badge Skeleton */}
            <div className="hidden md:flex items-center justify-center">
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: rowIdx * 0.1 }}
              >
                <Skeleton className="h-7 w-18 rounded-full bg-gradient-to-r from-emerald-200 to-emerald-300 dark:from-emerald-800 dark:to-emerald-700" />
              </motion.div>
            </div>

            {/* Stake Skeleton (desktop) */}
            <div className="hidden md:flex items-center justify-center">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: rowIdx * 0.1 + 0.2,
                }}
              >
                <Skeleton className="h-7 w-24 rounded-full bg-gradient-to-r from-blue-200 to-blue-300 dark:from-blue-800 dark:to-blue-700" />
              </motion.div>
            </div>

            {/* Player / Event Skeleton */}
            <div className="col-span-2 md:col-span-1 flex items-center gap-3 px-2">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: rowIdx * 0.1 + 0.3,
                }}
              >
                <Skeleton className="h-12 w-12 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600" />
              </motion.div>
              <div className="flex flex-col gap-2 flex-1">
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                    delay: rowIdx * 0.1 + 0.4,
                  }}
                >
                  <Skeleton className="h-4 w-44 rounded-lg bg-gradient-to-r from-gray-300 to-gray-400 dark:from-slate-600 dark:to-slate-500" />
                </motion.div>
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                    delay: rowIdx * 0.1 + 0.5,
                  }}
                >
                  <Skeleton className="h-3 w-32 rounded-lg bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600" />
                </motion.div>
              </div>
            </div>

            {/* Market Skeleton */}
            <div className="hidden md:flex items-center px-2">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: rowIdx * 0.1 + 0.6,
                }}
                className="flex-1"
              >
                <Skeleton className="h-4 w-48 rounded-lg bg-gradient-to-r from-purple-200 to-purple-300 dark:from-purple-800 dark:to-purple-700" />
              </motion.div>
            </div>

            {/* Best Book Skeleton */}
            <div className="hidden md:flex items-center gap-3 px-2">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: rowIdx * 0.1 + 0.7,
                }}
              >
                <Skeleton className="h-6 w-6 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600" />
              </motion.div>
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: rowIdx * 0.1 + 0.8,
                }}
              >
                <Skeleton className="h-4 w-28 rounded-lg bg-gradient-to-r from-gray-300 to-gray-400 dark:from-slate-600 dark:to-slate-500" />
              </motion.div>
            </div>

            {/* Fair Value Skeleton */}
            <div className="hidden md:flex flex-col gap-2 px-2">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: rowIdx * 0.1 + 0.9,
                }}
              >
                <Skeleton className="h-4 w-24 rounded-lg bg-gradient-to-r from-orange-200 to-orange-300 dark:from-orange-800 dark:to-orange-700" />
              </motion.div>
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: rowIdx * 0.1 + 1.0,
                }}
              >
                <Skeleton className="h-3 w-32 rounded-lg bg-gradient-to-r from-orange-200 to-orange-300 dark:from-orange-800 dark:to-orange-700" />
              </motion.div>
            </div>

            {/* Stake Skeleton (mobile) */}
            <div className="md:hidden flex items-center justify-center">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: rowIdx * 0.1 + 0.2,
                }}
              >
                <Skeleton className="h-7 w-24 rounded-full bg-gradient-to-r from-blue-200 to-blue-300 dark:from-blue-800 dark:to-blue-700" />
              </motion.div>
            </div>

            {/* Actions Skeleton */}
            <div className="hidden md:flex items-center justify-end gap-2 px-2">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: rowIdx * 0.1 + 1.1,
                }}
              >
                <Skeleton className="h-8 w-14 rounded-lg bg-gradient-to-r from-green-200 to-green-300 dark:from-green-800 dark:to-green-700" />
              </motion.div>
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: rowIdx * 0.1 + 1.2,
                }}
              >
                <Skeleton className="h-8 w-14 rounded-lg bg-gradient-to-r from-red-200 to-red-300 dark:from-red-800 dark:to-red-700" />
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Loading Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-gradient-to-r from-gray-50/80 to-white/80 dark:from-slate-900/80 dark:to-slate-950/80 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Loading profitable opportunities...
          </span>
        </div>
      </div>
    </div>
  )
}
