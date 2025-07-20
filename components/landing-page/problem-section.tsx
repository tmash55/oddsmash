"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Smartphone, Clock, DollarSign, AlertCircle, CheckCircle, Zap, Target, TrendingUp } from "lucide-react"
import { Card } from "@/components/ui/card"

const problemPoints = [
  {
    icon: <Clock className="h-5 w-5" />,
    text: "Tired of copy-pasting long parlays into every sportsbook?",
    highlight: "copy-pasting long parlays",
  },
  {
    icon: <DollarSign className="h-5 w-5" />,
    text: "Not sure which book gives you the best value?",
    highlight: "best value",
  },
  {
    icon: <AlertCircle className="h-5 w-5" />,
    text: "Confused by bots that only compare one book?",
    highlight: "only compare one book",
  },
]

const beforeSteps = [
  { app: "DraftKings", time: "2 min", status: "checking" },
  { app: "FanDuel", time: "2 min", status: "checking" },
  { app: "BetMGM", time: "2 min", status: "checking" },
  { app: "Caesars", time: "2 min", status: "checking" },
]

export function ProblemSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeView, setActiveView] = useState<"before" | "after">("before")
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Auto-switch between before/after views
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveView((prev) => (prev === "before" ? "after" : "before"))
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Animate steps in "before" view
  useEffect(() => {
    if (activeView === "before") {
      const interval = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % beforeSteps.length)
      }, 800)
      return () => clearInterval(interval)
    }
  }, [activeView])

  return (
    <section className="relative py-16 sm:py-24 bg-slate-50 dark:bg-slate-900/50">
      <div className="container px-4 mx-auto max-w-7xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-6">
            Sportsbooks want you to guess. <br />
            <span className="bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
              We want you to win.
            </span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Stop wasting time manually checking every sportsbook. There's a better way.
          </p>
        </motion.div>

        {/* Before/After Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-16"
        >
          {/* Before OddSmash */}
          <Card className="relative overflow-hidden border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-full bg-red-500/10">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Before OddSmash</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">The old way (painful)</p>
                </div>
              </div>

              <div className="space-y-4">
                {beforeSteps.map((step, index) => (
                  <motion.div
                    key={step.app}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 ${
                      activeView === "before" && index === currentStep
                        ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                        : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-4 w-4 text-slate-500" />
                      <span className="font-medium text-slate-900 dark:text-slate-100">{step.app}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500 dark:text-slate-400">{step.time}</span>
                      {activeView === "before" && index === currentStep && (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                          className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full"
                        />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Total time: 8+ minutes</span>
                </div>
                <p className="text-sm text-red-500 dark:text-red-400 mt-1">And you still might miss the best line!</p>
              </div>
            </div>
          </Card>

          {/* After OddSmash */}
          <Card className="relative overflow-hidden border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-full bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">After OddSmash</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">The smart way (effortless)</p>
                </div>
              </div>

              <div className="space-y-4">
                <AnimatePresence mode="wait">
                  {activeView === "after" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between p-4 rounded-lg border border-purple-300 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20">
                        <div className="flex items-center gap-3">
                          <Target className="h-4 w-4 text-purple-500" />
                          <span className="font-medium text-slate-900 dark:text-slate-100">Scan betslip</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500 dark:text-slate-400">2 sec</span>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg border border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                        <div className="flex items-center gap-3">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span className="font-medium text-slate-900 dark:text-slate-100">Compare all books</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500 dark:text-slate-400">Instant</span>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg border border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                        <div className="flex items-center gap-3">
                          <Zap className="h-4 w-4 text-green-500" />
                          <span className="font-medium text-slate-900 dark:text-slate-100">Find best payout</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500 dark:text-slate-400">Instant</span>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Zap className="h-4 w-4" />
                  <span className="font-medium">Total time: 10 seconds</span>
                </div>
                <p className="text-sm text-green-500 dark:text-green-400 mt-1">Guaranteed best line, every time!</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* View Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex justify-center mb-16"
        >
          <div className="flex items-center gap-2 p-1 bg-slate-200 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setActiveView("before")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeView === "before"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              Before
            </button>
            <button
              onClick={() => setActiveView("after")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeView === "after"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              After
            </button>
          </div>
        </motion.div>

        {/* Problem Points */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">Sound familiar?</h3>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              These are the problems every serious bettor faces daily
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {problemPoints.map((point, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
              >
                <Card className="p-6 h-full border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                      {point.icon}
                    </div>
                    <div>
                      <p className="text-slate-900 dark:text-slate-100 leading-relaxed">
                        {point.text.split(point.highlight).map((part, i, arr) => (
                          <span key={i}>
                            {part}
                            {i < arr.length - 1 && (
                              <span className="font-semibold text-purple-600 dark:text-purple-400">
                                {point.highlight}
                              </span>
                            )}
                          </span>
                        ))}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
