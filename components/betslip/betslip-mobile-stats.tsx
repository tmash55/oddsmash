"use client"

import { motion } from "framer-motion"
import { TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BetslipStats, FilterMode } from "@/types/betslip"

interface BetslipMobileStatsProps {
  stats: BetslipStats
  filterMode: FilterMode
  onStatsClick: (type: "total" | "ready" | "active") => void
}

export function BetslipMobileStats({ stats, filterMode, onStatsClick }: BetslipMobileStatsProps) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2 hide-scrollbar px-4">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onStatsClick("total")}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap transition-all duration-200 shadow-sm",
          filterMode === "all"
            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/25"
            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700",
        )}
      >
        <div className="w-2 h-2 bg-current rounded-full"></div>
        {stats.totalBetslips} Total
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onStatsClick("ready")}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap transition-all duration-200 shadow-sm",
          filterMode === "ready"
            ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-purple-500/25"
            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700",
        )}
      >
        <div className="w-2 h-2 bg-current rounded-full"></div>
        {stats.betslipsWithSelections} Ready
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onStatsClick("active")}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap transition-all duration-200 shadow-sm",
          filterMode === "active"
            ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-orange-500/25"
            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700",
        )}
      >
        <div className="w-2 h-2 bg-current rounded-full"></div>
        {stats.activeSelectionCount} In Cart
      </motion.button>

      <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
        <TrendingUp className="h-4 w-4" />
        {stats.totalSelections} Picks
      </div>
    </div>
  )
}
