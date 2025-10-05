"use client"

import { motion } from "framer-motion"
import { Receipt, BarChart3, Zap, Target } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { BetslipStats, FilterMode } from "@/types/betslip"

interface BetslipStatsCardsProps {
  stats: BetslipStats
  filterMode: FilterMode
  onStatsClick: (type: "total" | "ready" | "active") => void
}

export function BetslipStatsCards({ stats, filterMode, onStatsClick }: BetslipStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
              <Card
                className={cn(
                  "p-6 transition-all duration-300 cursor-pointer border-0 shadow-lg hover:shadow-xl",
                  filterMode === "all"
                    ? "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 ring-2 ring-blue-500 shadow-blue-500/25"
                    : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800",
                )}
                onClick={() => onStatsClick("total")}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                    <Receipt className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalBetslips}</p>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Betslips</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click to view all betslips in your collection</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div whileHover={{ scale: 1.02, y: -2 }}>
              <Card className="p-6 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 cursor-help border-0 shadow-lg hover:shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalSelections}</p>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Selections</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Total number of bets across all betslips</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
              <Card
                className={cn(
                  "p-6 transition-all duration-300 cursor-pointer border-0 shadow-lg hover:shadow-xl",
                  filterMode === "ready"
                    ? "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 ring-2 ring-purple-500 shadow-purple-500/25"
                    : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800",
                )}
                onClick={() => onStatsClick("ready")}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.betslipsWithSelections}</p>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ready to Compare</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click to view betslips with selections ready for odds comparison</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
              <Card
                className={cn(
                  "p-6 transition-all duration-300 cursor-pointer border-0 shadow-lg hover:shadow-xl",
                  filterMode === "active"
                    ? "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 ring-2 ring-orange-500 shadow-orange-500/25"
                    : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800",
                )}
                onClick={() => onStatsClick("active")}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.activeSelectionCount}</p>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Cart</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click to view your current active betslip</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
