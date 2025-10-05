"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface BetslipScrollIndicatorProps {
  totalItems: number
  currentIndex: number
  onScrollToIndex: (index: number) => void
}

export function BetslipScrollIndicator({ totalItems, currentIndex, onScrollToIndex }: BetslipScrollIndicatorProps) {
  if (totalItems <= 1) return null

  return (
    <div className="flex justify-center mt-6">
      <div className="flex gap-2 p-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-lg">
        {Array.from({ length: totalItems }).map((_, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onScrollToIndex(index)}
            className={cn(
              "relative transition-all duration-300 ease-out rounded-full",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2",
              currentIndex === index
                ? "w-8 h-4 bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg"
                : "w-4 h-4 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500",
            )}
            aria-label={`Go to betslip ${index + 1}${currentIndex === index ? " (current)" : ""}`}
          >
            {currentIndex === index && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-white/30 rounded-full"
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
