"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { FilterMode } from "@/types/betslip"

interface BetslipFilterIndicatorProps {
  filterMode: FilterMode
  filteredCount: number
  totalCount: number
  onClearFilter: () => void
  isMobile?: boolean
}

export function BetslipFilterIndicator({
  filterMode,
  filteredCount,
  totalCount,
  onClearFilter,
  isMobile = false,
}: BetslipFilterIndicatorProps) {
  if (filterMode === "all") return null

  const filterText = filterMode === "ready" ? "Ready to Compare" : "Current Betslip"

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`flex items-center justify-between mb-6 p-4 rounded-2xl border shadow-sm ${
          isMobile
            ? "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-lg mx-2"
            : "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          <span
            className={`text-sm font-semibold ${
              isMobile ? "text-gray-900 dark:text-white" : "text-blue-700 dark:text-blue-300"
            }`}
          >
            Showing: {filterText}
            <span
              className={`ml-2 ${isMobile ? "text-gray-500 dark:text-gray-400" : "text-blue-600 dark:text-blue-400"}`}
            >
              ({filteredCount} of {totalCount})
            </span>
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilter}
          className={`text-sm ${isMobile ? "h-8 px-3" : "hover:bg-blue-100 dark:hover:bg-blue-900/30"}`}
        >
          <X className="h-4 w-4 mr-1" />
          Show All
        </Button>
      </motion.div>
    </AnimatePresence>
  )
}
