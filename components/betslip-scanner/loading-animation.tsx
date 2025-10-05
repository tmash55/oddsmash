"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Sparkles, TrendingUp, Search, FileText, BarChart3, Clock, Zap } from "lucide-react"

interface LoadingAnimationProps {
  stage: "ocr" | "parsing" | "fetching" | "complete"
  progress?: number
  selections?: Array<{
    player: string
    market: string
    odds: string
  }>
  estimatedTime?: number // in seconds
}

const stages = [
  {
    id: "ocr",
    title: "Reading Betslip",
    subtitle: "Scanning your image with AI vision...",
    color: "from-blue-500 to-cyan-500",
    textColor: "text-blue-500 dark:text-blue-400",
    icon: FileText,
    tips: ["High quality images work best", "Make sure text is clearly visible"],
  },
  {
    id: "parsing",
    title: "Extracting Selections",
    subtitle: "AI is identifying your picks...",
    color: "from-purple-500 to-pink-500",
    textColor: "text-purple-500 dark:text-purple-400",
    icon: Search,
    tips: ["Looking for player names and bet types", "Parsing odds and game information"],
  },
  {
    id: "fetching",
    title: "Comparing Odds",
    subtitle: "Searching across 10+ sportsbooks...",
    color: "from-green-500 to-emerald-500",
    textColor: "text-green-500 dark:text-green-400",
    icon: BarChart3,
    tips: ["Finding the best prices", "Checking for promotions and bonuses"],
  },
  {
    id: "complete",
    title: "Complete",
    subtitle: "Ready to view results!",
    color: "from-emerald-500 to-green-500",
    textColor: "text-emerald-500 dark:text-emerald-400",
    icon: Check,
    tips: [],
  },
]

export default function LoadingAnimation({
  stage,
  progress = 0,
  selections = [],
  estimatedTime = 30,
}: LoadingAnimationProps) {
  const [dots, setDots] = useState("")
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [currentTip, setCurrentTip] = useState(0)

  const currentStage = stages.find((s) => s.id === stage) || stages[0]
  const CurrentIcon = currentStage.icon

  // Animate dots
  useEffect(() => {
    if (stage === "complete") return
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return ""
        return prev + "."
      })
    }, 500)
    return () => clearInterval(interval)
  }, [stage])

  // Track time elapsed
  useEffect(() => {
    if (stage === "complete") return
    const interval = setInterval(() => {
      setTimeElapsed((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [stage])

  // Rotate tips
  useEffect(() => {
    if (currentStage.tips.length === 0) return
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % currentStage.tips.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [currentStage.tips.length])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <motion.div
              animate={{
                rotate: stage !== "complete" ? 360 : 0,
                scale: stage !== "complete" ? [1, 1.1, 1] : 1,
              }}
              transition={{
                rotate: { duration: 3, repeat: stage !== "complete" ? Number.POSITIVE_INFINITY : 0, ease: "linear" },
                scale: { duration: 2, repeat: stage !== "complete" ? Number.POSITIVE_INFINITY : 0, ease: "easeInOut" },
              }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl blur-sm"></div>
              <div className="relative p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Betslip Scanner</h1>
          </motion.div>

          <motion.div
            key={currentStage.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <motion.div
                animate={{
                  scale: stage !== "complete" ? [1, 1.1, 1] : 1,
                }}
                transition={{
                  duration: 2,
                  repeat: stage !== "complete" ? Number.POSITIVE_INFINITY : 0,
                  ease: "easeInOut",
                }}
                className={`p-4 rounded-2xl bg-gradient-to-r ${currentStage.color} shadow-lg`}
              >
                <CurrentIcon className="w-6 h-6 text-white" />
              </motion.div>
            </div>
            <h2 className={`text-xl font-semibold ${currentStage.textColor} mb-2`}>
              {currentStage.title}
              {stage !== "complete" && <span className="inline-block w-8 text-left">{dots}</span>}
            </h2>
            <p className="text-slate-600 dark:text-slate-400">{currentStage.subtitle}</p>
          </motion.div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-center items-center gap-2 sm:gap-4">
            {stages.slice(0, -1).map((stageItem, index) => {
              const isActive = stages.findIndex((s) => s.id === stage) >= index
              const isCompleted = stages.findIndex((s) => s.id === stage) > index
              const isCurrent = stages.findIndex((s) => s.id === stage) === index

              return (
                <div key={stageItem.id} className="flex items-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{
                      scale: isActive ? 1 : 0.8,
                      opacity: isActive ? 1 : 0.5,
                    }}
                    transition={{ duration: 0.3 }}
                    className={`
                      w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative
                      ${
                        isCompleted
                          ? "bg-green-500 border-green-500 shadow-lg shadow-green-500/25"
                          : isActive
                            ? `bg-gradient-to-r ${stageItem.color} border-transparent shadow-lg`
                            : "bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    ) : (
                      <stageItem.icon
                        className={`w-5 h-5 sm:w-6 sm:h-6 ${isActive ? "text-white" : "text-slate-400"}`}
                      />
                    )}
                    {/* Pulse effect for current stage */}
                    {isCurrent && stage !== "complete" && (
                      <motion.div
                        className={`absolute inset-0 rounded-full bg-gradient-to-r ${stageItem.color} opacity-30`}
                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                      />
                    )}
                  </motion.div>
                  {index < stages.length - 2 && (
                    <div
                      className={`
                        w-8 sm:w-16 h-1 mx-1 sm:mx-2 transition-all duration-500 rounded-full
                        ${isCompleted ? "bg-green-500" : "bg-slate-200 dark:bg-slate-700"}
                      `}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
            <motion.div
              className={`h-full bg-gradient-to-r ${currentStage.color} shadow-lg`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between items-center mt-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">{Math.round(progress)}% complete</span>
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500">
                <Clock className="w-3 h-3" />
                <span>{formatTime(timeElapsed)}</span>
              </div>
            </div>
            <span className={`text-sm font-medium ${currentStage.textColor} flex items-center gap-1`}>
              {stage === "complete" ? (
                <>
                  <Check className="w-4 h-4" />
                  Complete
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Processing...
                </>
              )}
            </span>
          </div>
        </div>

        {/* Tips Section */}
        {currentStage.tips.length > 0 && stage !== "complete" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                >
                  💡
                </motion.div>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Tip</span>
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentTip}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm text-blue-600 dark:text-blue-400 text-center"
                >
                  {currentStage.tips[currentTip]}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-3 gap-3 sm:gap-4 text-center mb-8"
        >
          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
            <motion.div
              className="text-xl sm:text-2xl font-bold text-blue-500 dark:text-blue-400 mb-1"
              animate={{ scale: selections.length > 0 ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.5 }}
            >
              {selections.length}
            </motion.div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Selections</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
            <motion.div
              className="text-xl sm:text-2xl font-bold text-purple-500 dark:text-purple-400 mb-1"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              10+
            </motion.div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Sportsbooks</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
            <motion.div
              className="text-xl sm:text-2xl font-bold text-green-500 dark:text-green-400 mb-1 flex items-center justify-center"
              animate={{ rotate: progress > 50 ? [0, 10, -10, 0] : 0 }}
              transition={{ duration: 1, repeat: progress > 50 ? Number.POSITIVE_INFINITY : 0 }}
            >
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.div>
            <div className="text-xs text-slate-600 dark:text-slate-400">AI Analysis</div>
          </div>
        </motion.div>

        {/* Selection Preview Cards */}
        <AnimatePresence>
          {selections.length > 0 && stage === "fetching" && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="space-y-3 mb-8"
            >
              <h3 className="text-center text-sm font-medium text-slate-600 dark:text-slate-400 mb-4 flex items-center justify-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <Search className="w-4 h-4" />
                </motion.div>
                Found {selections.length} selection{selections.length !== 1 ? "s" : ""}
              </h3>
              {selections.slice(0, 3).map((selection, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-100 truncate text-sm sm:text-base">
                      {selection.player}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">{selection.market}</p>
                  </div>
                  <div className="text-right">
                    <motion.span
                      className={`font-bold text-sm sm:text-base ${currentStage.textColor}`}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: index * 0.2 }}
                    >
                      {selection.odds}
                    </motion.span>
                  </div>
                </motion.div>
              ))}
              {selections.length > 3 && (
                <div className="text-center text-sm text-slate-500 dark:text-slate-400">
                  +{selections.length - 3} more selection{selections.length - 3 !== 1 ? "s" : ""}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Completion Message */}
        {stage === "complete" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 shadow-lg"
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                rotate: { duration: 0.6, repeat: 2 },
                scale: { duration: 0.8, repeat: 1 },
              }}
              className="text-4xl mb-3"
            >
              🎉
            </motion.div>
            <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-2">Analysis Complete!</h3>
            <p className="text-green-700 dark:text-green-300 mb-4 text-sm sm:text-base">
              Your betslip has been scanned and odds compared across {selections.length} selection
              {selections.length !== 1 ? "s" : ""}
            </p>
            <div className="text-sm text-green-600 dark:text-green-400 flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Completed in {formatTime(timeElapsed)}</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
