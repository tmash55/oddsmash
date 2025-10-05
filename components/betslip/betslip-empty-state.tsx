"use client"

import { motion } from "framer-motion"
import { Plus, Receipt } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface BetslipEmptyStateProps {
  onCreateBetslip: () => void
  isCreating: boolean
  isMobile?: boolean
}

export function BetslipEmptyState({ onCreateBetslip, isCreating, isMobile = false }: BetslipEmptyStateProps) {
  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 px-6 text-center"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
          <Receipt className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">No betslips yet</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 max-w-sm leading-relaxed">
          Create your first betslip to start organizing your player props and bets
        </p>
        <div className="flex flex-col items-center gap-4 w-full max-w-sm">
          <Button
            size="lg"
            onClick={onCreateBetslip}
            disabled={isCreating}
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create First Betslip
          </Button>
          <Button variant="outline" size="lg" asChild className="w-full h-12 border-2 bg-transparent">
            <a href="/mlb/props">Browse Props</a>
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 shadow-xl">
        <CardContent className="flex flex-col items-center justify-center py-24 px-8 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-3xl flex items-center justify-center mb-8 shadow-lg">
            <Receipt className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="font-bold text-3xl mb-4 text-gray-900 dark:text-white">No betslips yet</h3>
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-10 max-w-md leading-relaxed">
            Create your first betslip to start organizing your player props and bets
          </p>
          <div className="flex items-center gap-4">
            <Button
              size="lg"
              onClick={onCreateBetslip}
              disabled={isCreating}
              className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create First Betslip
            </Button>
            <Button variant="outline" size="lg" asChild className="h-12 px-8 border-2 bg-transparent">
              <a href="/mlb/props">Browse Props</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
