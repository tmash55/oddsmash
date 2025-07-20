"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Eye, Brain, Zap, Smartphone, TrendingUp, DollarSign } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"

// Value proposition data
const valueProps = [
  {
    icon: <Eye className="h-6 w-6" />,
    title: "See Every Book's Line Instantly",
    description: "Compare odds across all major sportsbooks in one place. No more app switching.",
    color: "from-blue-500/10 to-blue-600/5",
    iconBg: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
    stat: "15+ Books",
    statLabel: "Compared",
  },
  {
    icon: <Brain className="h-6 w-6" />,
    title: "Find the Sharpest Edges",
    description: "Our EV calculator identifies profitable bets using advanced market analysis.",
    color: "from-purple-500/10 to-purple-600/5",
    iconBg: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
    stat: "14.2%",
    statLabel: "Better Odds",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "One-Click Betslip Integration",
    description: "Automatically add your picks to supported sportsbooks with a single click.",
    color: "from-amber-500/10 to-amber-600/5",
    iconBg: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
    stat: "1-Click",
    statLabel: "Betting",
  },
  {
    icon: <Smartphone className="h-6 w-6" />,
    title: "Modern & Mobile Friendly",
    description: "Fast, responsive interface optimized for every device and screen size.",
    color: "from-emerald-500/10 to-emerald-600/5",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
    stat: "100%",
    statLabel: "Mobile Ready",
  },
]

export function ValuePropositionGrid() {
  const [isVisible, setIsVisible] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Set visibility for animations when component mounts
  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-slate-50 via-white to-slate-100/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800/50 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] dark:bg-grid-white/[0.05]" />

      <div className="container relative px-4 mx-auto max-w-7xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <div className="inline-flex items-center px-4 py-2 mb-6 rounded-full bg-slate-900/5 dark:bg-slate-100/5 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm">
            <TrendingUp className="w-4 h-4 mr-2 text-slate-600 dark:text-slate-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Why Choose OddSmash</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Built for{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              serious bettors
            </span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Every feature is designed to give you an edge and maximize your betting value
          </p>
        </motion.div>

        {/* Value Props Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 md:mb-16">
          {valueProps.map((prop, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card className="p-6 h-full border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:border-slate-300/50 dark:hover:border-slate-700/50 transition-all duration-300 hover:shadow-lg">
                <div className="flex items-start justify-between mb-4">
                  <div className={cn("p-3 rounded-xl", prop.iconBg)}>{prop.icon}</div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{prop.stat}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{prop.statLabel}</div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{prop.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{prop.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bottom Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center"
        >
          <Card className="inline-flex items-center px-6 py-4 border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <DollarSign className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="text-sm text-slate-600 dark:text-slate-400">Average savings per $1,000 bet</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  <span className="text-emerald-600 dark:text-emerald-400">$142.60</span>
                </div>
              </div>
            </div>
          </Card>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 max-w-md mx-auto">
            Based on analysis of 50,000+ bets comparing best available odds vs. average market odds
          </p>
        </motion.div>
      </div>
    </section>
  )
}
