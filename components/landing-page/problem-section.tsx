"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import {
  Upload,
  ArrowRight,
  Clock,
  Smartphone,
  MousePointer,
  Zap,
  CheckCircle,
  AlertCircle,
  Timer,
  TrendingUp,
  Target,
  BarChart3,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

// Mock parlay data for different sportsbooks
const parlayData = [
  {
    book: "DraftKings",
    logo: "DK",
    color: "from-orange-500 to-red-500",
    payout: "+1247",
    legs: [
      "Aaron Judge HR O/U 0.5",
      "LeBron James Pts O/U 25.5",
      "Connor McDavid Goals O/U 0.5",
      "Shohei Ohtani K's O/U 7.5",
    ],
  },
  {
    book: "FanDuel",
    logo: "FD",
    color: "from-blue-500 to-blue-600",
    payout: "+1189",
    legs: ["Aaron Judge HR O/U 0.5", "Connor McDavid Goals O/U 0.5", "Shohei Ohtani K's O/U 7.5"],
  },
  {
    book: "MGM",
    logo: "MGM",
    color: "from-green-500 to-green-600",
    payout: "+1334",
    legs: [
      "Aaron Judge HR O/U 0.5",
      "LeBron James Pts O/U 25.5",
      "Connor McDavid Goals O/U 0.5",
      "Shohei Ohtani K's O/U 7.5",
    ],
  },
]

// Manual Process Animation
const ManualProcessAnimation = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [checkedBooks, setCheckedBooks] = useState<string[]>([])

  const sportsbooks = [
    { name: "DraftKings", logo: "DK", checked: false },
    { name: "FanDuel", logo: "FD", checked: false },
    { name: "BetMGM", logo: "MGM", checked: false },
    { name: "ESPN", logo: "ESPN", checked: false },
    { name: "BetRivers", logo: "BR", checked: false },
  ]

  const steps = [
    { app: "DraftKings", logo: "DK", color: "from-orange-500 to-red-500", payout: "+1247", time: 90 },
    { app: "FanDuel", logo: "FD", color: "from-blue-500 to-blue-600", payout: "+1189", time: 75 },
    { app: "MGM", logo: "MGM", color: "from-green-500 to-green-600", payout: "+1334", time: 85 },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        const next = (prev + 1) % (steps.length + 1)
        if (next === 0) {
          setTimeElapsed(0)
          setCheckedBooks([]) // Reset checklist
        } else if (next <= steps.length) {
          // Add current book to checked list
          setCheckedBooks((prev) => [...prev, steps[next - 1].app])
        }
        return next
      })
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  // Timer animation - Make it go SUPER fast to show time waste
  useEffect(() => {
    if (currentStep < steps.length) {
      const timer = setInterval(() => {
        setTimeElapsed((prev) => prev + 3) // Changed from +1 to +3 for 3x speed
      }, 50) // Changed from 100ms to 50ms for 2x frequency = 6x total speed
      return () => clearInterval(timer)
    }
  }, [currentStep])

  return (
    <div className="relative h-80 bg-gradient-to-br from-red-50/80 to-orange-50/80 dark:from-red-950/30 dark:to-orange-950/30 rounded-2xl border-2 border-red-200/50 dark:border-red-800/30 overflow-hidden">
      {/* Frustrated Timer */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-100/80 dark:bg-red-900/50 px-3 py-1.5 rounded-full">
        <Timer className="w-4 h-4 text-red-600 dark:text-red-400" />
        <span className="text-sm font-bold text-red-700 dark:text-red-300">
          {Math.floor(timeElapsed / 10)}.{timeElapsed % 10}s
        </span>
      </div>

      {/* Manual Process Steps */}
      {currentStep < steps.length && (
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute inset-0 flex flex-col items-center justify-center p-6"
        >
          {/* Checklist - positioned on the left */}
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/10 dark:bg-gray-900/20 backdrop-blur-sm rounded-lg p-3 border border-red-200/30 dark:border-red-800/30">
            <div className="text-xs text-red-700 dark:text-red-300 font-semibold mb-2">Manual Checklist:</div>
            <div className="space-y-1.5">
              {sportsbooks.map((book, idx) => {
                const isChecked = checkedBooks.includes(book.name)
                const isCurrentlyChecking =
                  currentStep > 0 && currentStep <= steps.length && steps[currentStep - 1].app === book.name

                return (
                  <motion.div
                    key={book.name}
                    className={`flex items-center gap-2 text-xs transition-all duration-300 ${
                      isCurrentlyChecking
                        ? "text-red-600 dark:text-red-400 font-medium"
                        : isChecked
                          ? "text-red-500 dark:text-red-400"
                          : "text-red-400/60 dark:text-red-500/60"
                    }`}
                    animate={isCurrentlyChecking ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.5, repeat: isCurrentlyChecking ? Number.POSITIVE_INFINITY : 0 }}
                  >
                    <motion.div
                      className={`w-3 h-3 rounded border flex items-center justify-center ${
                        isChecked
                          ? "bg-red-500 border-red-500"
                          : isCurrentlyChecking
                            ? "border-red-500 bg-red-500/20"
                            : "border-red-300 dark:border-red-600"
                      }`}
                      animate={isChecked ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      {isChecked && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <CheckCircle className="w-2 h-2 text-white" />
                        </motion.div>
                      )}
                      {isCurrentlyChecking && !isChecked && (
                        <motion.div
                          className="w-1.5 h-1.5 bg-red-500 rounded-full"
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY }}
                        />
                      )}
                    </motion.div>
                    <span className="truncate">{book.logo}</span>
                  </motion.div>
                )
              })}
            </div>

            {/* Progress indicator */}
            <div className="mt-2 pt-2 border-t border-red-200/30 dark:border-red-800/30">
              <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                {checkedBooks.length}/{sportsbooks.length} checked
              </div>
            </div>
          </div>
          {/* Phone Animation */}
          <motion.div
            className="relative mb-6"
            animate={{
              rotate: [0, -2, 2, 0],
              y: [0, -2, 0],
            }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            <div className="w-20 h-32 bg-gray-800 rounded-2xl border-4 border-gray-700 flex flex-col items-center justify-center relative overflow-hidden">
              {/* App Screen */}
              <motion.div
                className={`w-16 h-24 bg-gradient-to-br ${steps[currentStep].color} rounded-lg flex flex-col items-center justify-center`}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
              >
                <div className="text-white font-bold text-xs mb-1">{steps[currentStep].logo}</div>
                <div className="text-white text-[10px] font-bold">{steps[currentStep].payout}</div>
              </motion.div>
            </div>

            {/* Clicking Animation */}
            <motion.div
              className="absolute -right-2 -top-2"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY }}
            >
              <MousePointer className="w-6 h-6 text-red-500" />
            </motion.div>
          </motion.div>

          {/* Current App Info */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold text-red-700 dark:text-red-300">Checking {steps[currentStep].app}...</h3>
            <p className="text-sm text-red-600 dark:text-red-400">Manually entering each leg</p>

            {/* Loading dots */}
            <div className="flex justify-center gap-1 mt-3">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-red-500 rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.6, delay: i * 0.2, repeat: Number.POSITIVE_INFINITY }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Final Comparison Step */}
      {currentStep === steps.length && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute inset-0 flex flex-col items-center justify-center p-6"
        >
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold text-red-700 dark:text-red-300">Still comparing...</h3>
            <p className="text-sm text-red-600 dark:text-red-400">
              After {Math.floor(timeElapsed / 10)} seconds of manual work
            </p>
            <p className="text-xs text-red-500 dark:text-red-400 font-medium">(Real process takes 5+ minutes!)</p>
            <div className="text-xs text-red-500 dark:text-red-400 mt-3">
              Best: MGM +1334 (but was it worth the time?)
            </div>
          </div>
        </motion.div>
      )}

      {/* Progress Steps */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        {[...steps, { final: true }].map((_, idx) => (
          <div
            key={idx}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              idx <= currentStep ? "bg-red-500" : "bg-red-200 dark:bg-red-800"
            }`}
          />
        ))}
      </div>
    </div>
  )
}

// Enhanced Scanner Solution Animation
const ScannerSolutionAnimation = () => {
  const [scanStep, setScanStep] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setScanStep((prev) => {
        const next = (prev + 1) % 5 // Added one more step for insights
        if (next === 0) setTimeElapsed(0)
        return next
      })
    }, 1800)
    return () => clearInterval(interval)
  }, [])

  // Fast timer for scanner
  useEffect(() => {
    if (scanStep < 4) {
      const timer = setInterval(() => {
        setTimeElapsed((prev) => prev + 1)
      }, 50) // Much faster than manual
      return () => clearInterval(timer)
    }
  }, [scanStep])

  return (
    <div className="relative h-80 bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-950/30 dark:to-emerald-950/30 rounded-2xl border-2 border-green-200/50 dark:border-green-800/30 overflow-hidden">
      {/* Fast Timer */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-green-100/80 dark:bg-green-900/50 px-3 py-1.5 rounded-full">
        <Zap className="w-4 h-4 text-green-600 dark:text-green-400" />
        <span className="text-sm font-bold text-green-700 dark:text-green-300">
          {Math.floor(timeElapsed / 20)}.{Math.floor((timeElapsed % 20) / 2)}s
        </span>
      </div>

      {/* Upload Step */}
      {scanStep === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center p-6"
        >
          <motion.div
            className="w-20 h-20 border-3 border-dashed border-green-400/60 rounded-2xl flex items-center justify-center mb-6"
            animate={{
              borderColor: ["rgba(74, 222, 128, 0.6)", "rgba(74, 222, 128, 0.9)", "rgba(74, 222, 128, 0.6)"],
            }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            <Upload className="w-10 h-10 text-green-500" />
          </motion.div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-green-700 dark:text-green-300">Drop Screenshot</h3>
            <p className="text-sm text-green-600 dark:text-green-400">From any sportsbook or social media</p>
          </div>
        </motion.div>
      )}

      {/* Scanning Step */}
      {scanStep === 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center p-6"
        >
          <motion.div
            className="w-20 h-20 bg-green-500/20 rounded-2xl flex items-center justify-center mb-6 border border-green-400/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <Zap className="w-10 h-10 text-green-500" />
          </motion.div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-green-700 dark:text-green-300">AI Scanning...</h3>
            <p className="text-sm text-green-600 dark:text-green-400">Extracting all bet information</p>
          </div>
        </motion.div>
      )}

      {/* Comparing Step */}
      {scanStep === 2 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center p-6"
        >
          <div className="w-20 h-20 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 border border-blue-400/30">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-blue-500 rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 0.6, delay: i * 0.2, repeat: Number.POSITIVE_INFINITY }}
                />
              ))}
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-green-700 dark:text-green-300">Comparing 15+ Books</h3>
            <p className="text-sm text-green-600 dark:text-green-400">Finding best odds instantly</p>
          </div>
        </motion.div>
      )}

      {/* Analyzing Insights Step */}
      {scanStep === 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center p-6"
        >
          <div className="w-20 h-20 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 border border-purple-400/30">
            <motion.div
              animate={{ rotate: [0, 180, 360] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >
              <BarChart3 className="w-10 h-10 text-purple-500" />
            </motion.div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-green-700 dark:text-green-300">Analyzing Value & Hit Rates</h3>
            <p className="text-sm text-green-600 dark:text-green-400">Adding smart insights</p>
          </div>
        </motion.div>
      )}

      {/* Enhanced Results Step */}
      {scanStep === 4 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center p-6"
        >
          <motion.div
            className="w-20 h-20 bg-green-500/20 rounded-2xl flex items-center justify-center mb-6 border border-green-400/30"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.6 }}
          >
            <CheckCircle className="w-10 h-10 text-green-500" />
          </motion.div>
          <div className="text-center space-y-3">
            <h3 className="text-lg font-bold text-green-700 dark:text-green-300">Complete Analysis Ready!</h3>
            <div className="bg-green-500/20 border border-green-400/30 rounded-lg px-4 py-3 space-y-2">
              <div className="text-xl font-bold text-green-600 dark:text-green-400">MGM +1334</div>
              <div className="text-sm text-green-600 dark:text-green-400">+$87 better than average</div>
              <div className="flex items-center justify-center gap-4 text-xs text-green-600 dark:text-green-400">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+12% EV</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  <span>73% Hit Rate</span>
                </div>
              </div>
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">
              Total time: {Math.floor(timeElapsed / 20)}.{Math.floor((timeElapsed % 20) / 2)} seconds
            </div>
          </div>
        </motion.div>
      )}

      {/* Progress Steps */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        {[0, 1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              step <= scanStep ? "bg-green-500" : "bg-green-200 dark:bg-green-800"
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export function PainSolutionSection() {
  const [currentParlay, setCurrentParlay] = useState(0)

  // Auto-rotate through parlays
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentParlay((prev) => (prev + 1) % parlayData.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const nextParlay = () => {
    setCurrentParlay((prev) => (prev + 1) % parlayData.length)
  }

  const prevParlay = () => {
    setCurrentParlay((prev) => (prev - 1 + parlayData.length) % parlayData.length)
  }

  return (
    <section className="py-20 bg-gradient-to-br from-muted/20 to-background">
      <div className="container px-4 md:px-6">
        {/* Enhanced Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Badge
            variant="secondary"
            className="bg-gradient-to-r from-red-100 to-orange-100 text-red-700 dark:from-red-900/30 dark:to-orange-900/30 dark:text-red-300 border-0 mb-4"
          >
            The Problem
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            <span className="text-muted-foreground">Stop Wasting</span>{" "}
            <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              5+ Minutes
            </span>{" "}
            <span className="text-muted-foreground">Per Bet</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Checking odds across multiple sportsbooks is painful. We built a better way.
          </p>
        </motion.div>

        {/* Desktop Layout - Side by Side Comparison */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-12 items-stretch mb-16">
          {/* Left - The Manual Pain */}
          <motion.div
            className="space-y-6 flex flex-col"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-2xl font-bold text-red-700 dark:text-red-300">The Manual Way</h3>
              </div>
              <div className="h-12 flex items-start">
                <p className="text-muted-foreground">
                  Open 3+ apps, manually enter each bet leg, compare odds, calculate best payout...
                </p>
              </div>
            </div>

            <ManualProcessAnimation />

            {/* Pain Points */}
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-red-500" />
                <span>5+ minutes per parlay comparison</span>
              </div>
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-red-500" />
                <span>Switching between 3+ different apps</span>
              </div>
              <div className="flex items-center gap-3">
                <MousePointer className="w-5 h-5 text-red-500" />
                <span>Manually entering each bet leg</span>
              </div>
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span>No value insights or hit rate data</span>
              </div>
            </div>
          </motion.div>

          {/* Right - The Scanner Solution */}
          <motion.div
            className="space-y-6 flex flex-col"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-green-700 dark:text-green-300">The OddSmash Way</h3>
              </div>
              <div className="h-12 flex items-start">
                <p className="text-muted-foreground">
                  Screenshot any betslip, upload it, get instant comparison plus value insights, hit rates, and smart
                  analysis across 10+ sportsbooks.
                </p>
              </div>
            </div>

            <ScannerSolutionAnimation />

            {/* Solution Benefits */}
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-green-500" />
                <span>Results in under 15 seconds</span>
              </div>
              <div className="flex items-center gap-3">
                <Upload className="w-5 h-5 text-green-500" />
                <span>Works with screenshots from anywhere</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Compares 10+ sportsbooks instantly</span>
              </div>
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span>Shows EV, hit rates & value insights</span>
              </div>
            </div>

            {/* CTA */}
            <Button
              size="lg"
              className="w-full h-14 text-base font-semibold rounded-2xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl hover:shadow-green-500/25 transition-all duration-300 group"
              asChild
            >
              <Link href="/betslip-scanner">
                Try the Scanner Now
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden space-y-12">
          {/* Pain - Mobile */}
          <motion.div
            className="text-center space-y-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-red-700 dark:text-red-300">The Manual Way</h3>
              <p className="text-muted-foreground">Opening multiple apps, manually entering bets, comparing odds...</p>
            </div>

            <ManualProcessAnimation />

            <div className="text-center text-sm text-red-600 dark:text-red-400 font-medium">
              This takes 5+ minutes every single time
            </div>
          </motion.div>

          {/* Solution - Mobile */}
          <motion.div
            className="text-center space-y-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-green-700 dark:text-green-300">The OddSmash Way</h3>
              <p className="text-muted-foreground">
                Screenshot, upload, get instant results plus value insights, hit rates, and smart analysis across 15+
                sportsbooks.
              </p>
            </div>

            <ScannerSolutionAnimation />

            <div className="text-center text-sm text-green-600 dark:text-green-400 font-medium">
              Complete analysis in under 15 seconds
            </div>

            <Button
              size="lg"
              className="w-full h-14 text-base font-semibold rounded-2xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl hover:shadow-green-500/25 transition-all duration-300 group"
              asChild
            >
              <Link href="/betslip-scanner">
                Try the Scanner Now
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Bottom Stats */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">5+ min</div>
              <div className="text-sm text-muted-foreground">Manual comparison time</div>
              <div className="text-xs text-red-500 dark:text-red-400 mt-1">Just basic odds comparison</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">VS</div>
              <div className="text-sm text-muted-foreground">The painful way</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">15 sec</div>
              <div className="text-sm text-muted-foreground">OddSmash scanner time</div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">Plus EV, hit rates & insights!</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
