"use client"

import { motion } from "framer-motion"
import { Target } from "lucide-react"
import { Button } from "@/components/ui/button"

export function BetslipFAB() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
      className="fixed bottom-6 right-6 lg:hidden"
    >
      <Button
        size="lg"
        asChild
        className="rounded-full w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl shadow-blue-500/25 border-0"
      >
        <a href="/mlb/props">
          <Target className="h-7 w-7 text-white" />
        </a>
      </Button>
    </motion.div>
  )
}
