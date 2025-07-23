"use client"

import React from "react"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, BarChart3, Target, Camera, ShoppingCart, Zap, Play, Upload, Scan, CheckCircle } from "lucide-react"

const features = [
  {
    id: "smashboard",
    icon: BarChart3,
    title: "SmashBoard",
    subtitle: "Real-time Odds. Smash-Worthy Insights.",
    description: "Compare player props across sportsbooks with built-in EV analysis and smart filters.",
    badge: "Live Odds",
    color: "from-blue-500 to-cyan-500",
    size: "large",
    hasAnimation: true,
    imageAspect: "aspect-[16/10]",
  },
  {
    id: "hit-rate",
    icon: Target,
    title: "Hit Rate Tracker",
    subtitle: "How Hot Is That Player?",
    description: "Track player performance with full context and alternate lines.",
    badge: "Data Driven",
    color: "from-green-500 to-emerald-500",
    size: "medium",
    hasAnimation: false,
    imageAspect: "aspect-square",
  },
  {
    id: "scanner",
    icon: Camera,
    title: "Betslip Scanner",
    subtitle: "Scan Any Betslip. Find Better Odds.",
    description: "Upload screenshots and let AI extract bets, compare odds instantly.",
    badge: "AI Powered",
    color: "from-purple-500 to-violet-500",
    size: "medium",
    hasAnimation: true,
    imageAspect: "aspect-square",
  },
  {
    id: "smart-betslip",
    icon: ShoppingCart,
    title: "Smart Betslip",
    subtitle: "Build Your Bets. Boost Your Edge.",
    description: "Cart-style builder that compares legs and parlays across all sportsbooks for maximum payout.",
    badge: "Smart Builder",
    color: "from-orange-500 to-red-500",
    size: "large",
    hasAnimation: true,
    imageAspect: "aspect-[16/10]",
  },
]

// Animation components for each feature
const SmashBoardAnimation = () => (
  <div className="absolute inset-0 p-4">
    {/* Animated chart bars */}
    <div className="flex items-end justify-center gap-2 h-full">
      {[40, 65, 45, 80, 55, 70].map((height, i) => (
        <motion.div
          key={i}
          className="bg-gradient-to-t from-blue-400 to-cyan-400 rounded-t-sm opacity-60"
          style={{ width: "12px" }}
          initial={{ height: "20%" }}
          animate={{ height: `${height}%` }}
          transition={{
            duration: 2,
            delay: i * 0.2,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
    {/* Floating EV indicators */}
    <motion.div
      className="absolute top-4 right-4 bg-green-500 text-white text-xs px-2 py-1 rounded-full"
      animate={{ y: [-2, 2, -2] }}
      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
    >
      +12% EV
    </motion.div>
  </div>
)

const ScannerAnimation = () => {
  const [scanStep, setScanStep] = React.useState(0)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setScanStep((prev) => (prev + 1) % 4)
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
      {/* Upload state */}
      {scanStep === 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <Upload className="w-8 h-8 text-purple-400 mx-auto mb-2" />
          <div className="text-xs text-purple-300">Upload Screenshot</div>
        </motion.div>
      )}

      {/* Scanning state */}
      {scanStep === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <Scan className="w-8 h-8 text-purple-400 mx-auto mb-2" />
          </motion.div>
          <div className="text-xs text-purple-300">Scanning...</div>
        </motion.div>
      )}

      {/* Processing state */}
      {scanStep === 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <div className="flex gap-1 mb-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-purple-400 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, delay: i * 0.2, repeat: Number.POSITIVE_INFINITY }}
              />
            ))}
          </div>
          <div className="text-xs text-purple-300">Processing...</div>
        </motion.div>
      )}

      {/* Results state */}
      {scanStep === 3 && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <div className="text-xs text-green-300">Best Odds Found!</div>
        </motion.div>
      )}
    </div>
  )
}

const SmartBetslipAnimation = () => (
  <div className="absolute inset-0 p-4">
    {/* Animated bet legs being added */}
    <div className="space-y-2">
      {[
        { name: "Judge HR", odds: "+125", delay: 0 },
        { name: "LeBron Pts", odds: "-110", delay: 1 },
        { name: "McDavid Goal", odds: "+180", delay: 2 },
      ].map((bet, i) => (
        <motion.div
          key={i}
          className="flex justify-between items-center bg-white/10 rounded px-2 py-1"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            delay: bet.delay,
            duration: 0.5,
            repeat: Number.POSITIVE_INFINITY,
            repeatDelay: 3,
          }}
        >
          <span className="text-xs text-orange-200">{bet.name}</span>
          <span className="text-xs text-green-300">{bet.odds}</span>
        </motion.div>
      ))}
    </div>

    {/* Animated payout calculation */}
    <motion.div
      className="absolute bottom-4 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded"
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
    >
      +1247 Payout
    </motion.div>
  </div>
)

export default function LandingFeaturesSection() {
  return (
    <section className="py-16 sm:py-24 bg-background relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 dark:from-blue-950/10 dark:via-transparent dark:to-purple-950/10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-r from-blue-500/3 to-purple-500/3 dark:from-blue-400/3 dark:to-purple-400/3 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 sm:mb-20"
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <Zap className="w-5 h-5 text-blue-500" />
            </motion.div>
            <Badge
              variant="secondary"
              className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 dark:from-blue-900/30 dark:to-purple-900/30 dark:text-blue-300 border-0"
            >
              Powerful Tools
            </Badge>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Bet Smarter
            </span>
          </h2>
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Four game-changing tools that give you the edge. Compare odds, track performance, scan betslips, and build
            winning strategies — all in one platform.
          </p>
        </motion.div>

        {/* Enhanced Bento Grid Features */}
        <div className="grid grid-cols-1 lg:grid-cols-4 lg:grid-rows-2 gap-6 sm:gap-8">
          {/* SmashBoard - Large Feature with Animation */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="lg:col-span-2 lg:row-span-2"
          >
            <Card className="group h-full bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border-2 border-border/50 hover:border-blue-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-blue-400/10 overflow-hidden">
              <CardContent className="p-0 h-full flex flex-col">
                {/* Animated Image Area */}
                <div className="relative aspect-[16/10] lg:aspect-[16/12] bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-400/10 dark:to-cyan-400/10 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />

                  {/* Static Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl flex items-center justify-center shadow-xl">
                      <BarChart3 className="w-10 h-10 text-white" />
                    </div>
                  </div>

                  {/* Animated Content Overlay */}
                  <SmashBoardAnimation />

                  {/* Enhanced Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <motion.div
                      className="w-16 h-16 bg-white/95 dark:bg-gray-900/95 rounded-full flex items-center justify-center backdrop-blur-sm shadow-xl"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Play className="w-6 h-6 text-gray-900 dark:text-white ml-1" />
                    </motion.div>
                  </div>

                  <Badge className="absolute top-6 right-6 bg-blue-500/90 text-white backdrop-blur-sm border-0 shadow-lg">
                    Live Odds
                  </Badge>
                </div>

                {/* Enhanced Content */}
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold text-foreground mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      SmashBoard
                    </h3>
                    <p className="text-lg font-semibold text-muted-foreground mb-4">
                      Real-time Odds. Smash-Worthy Insights.
                    </p>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Compare player props across sportsbooks with built-in EV analysis and smart filters. Your ultimate
                      command center for finding value.
                    </p>
                  </div>
                  <motion.div
                    className="mt-6 flex items-center text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-500"
                    whileHover={{ x: 5 }}
                  >
                    <span className="text-base font-semibold">Explore SmashBoard</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Hit Rate Tracker - Medium Feature */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-1 lg:row-span-1"
          >
            <Card className="group h-full bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border-2 border-border/50 hover:border-green-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/10 dark:hover:shadow-green-400/10 overflow-hidden">
              <CardContent className="p-0 h-full flex flex-col">
                <div className="relative aspect-square bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-400/10 dark:to-emerald-400/10">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-xl"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <Target className="w-8 h-8 text-white" />
                    </motion.div>
                  </div>
                  <Badge className="absolute top-4 right-4 bg-green-500/90 text-white backdrop-blur-sm border-0 shadow-lg text-xs">
                    Data Driven
                  </Badge>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                      Hit Rate Tracker
                    </h3>
                    <p className="text-sm font-semibold text-muted-foreground mb-3">How Hot Is That Player?</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Track player performance with full context and alternate lines.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Betslip Scanner - Medium Feature with Animation */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-1 lg:row-span-1"
          >
            <Card className="group h-full bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border-2 border-border/50 hover:border-purple-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 dark:hover:shadow-purple-400/10 overflow-hidden">
              <CardContent className="p-0 h-full flex flex-col">
                <div className="relative aspect-square bg-gradient-to-br from-purple-500/10 to-violet-500/10 dark:from-purple-400/10 dark:to-violet-400/10">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-violet-500 rounded-2xl flex items-center justify-center shadow-xl">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  {/* Scanner Animation Overlay */}
                  <ScannerAnimation />

                  <Badge className="absolute top-4 right-4 bg-purple-500/90 text-white backdrop-blur-sm border-0 shadow-lg text-xs">
                    AI Powered
                  </Badge>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      Betslip Scanner
                    </h3>
                    <p className="text-sm font-semibold text-muted-foreground mb-3">
                      Scan Any Betslip. Find Better Odds.
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Upload screenshots and let AI extract bets, compare odds instantly.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Smart Betslip - Large Feature with Animation */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="lg:col-span-2 lg:row-span-1"
          >
            <Card className="group h-full bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border-2 border-border/50 hover:border-orange-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/10 dark:hover:shadow-orange-400/10 overflow-hidden">
              <CardContent className="p-0 h-full flex flex-col lg:flex-row">
                <div className="relative aspect-[16/10] lg:aspect-square lg:w-56 bg-gradient-to-br from-orange-500/10 to-red-500/10 dark:from-orange-400/10 dark:to-red-400/10 flex-shrink-0">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-xl">
                      <ShoppingCart className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  {/* Smart Betslip Animation Overlay */}
                  <SmartBetslipAnimation />

                  <Badge className="absolute top-4 right-4 bg-orange-500/90 text-white backdrop-blur-sm border-0 shadow-lg text-xs">
                    Smart Builder
                  </Badge>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      Smart Betslip
                    </h3>
                    <p className="text-lg font-semibold text-muted-foreground mb-4">
                      Build Your Bets. Boost Your Edge.
                    </p>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Cart-style builder that compares legs and parlays across all sportsbooks for maximum payout.
                    </p>
                  </div>
                  <motion.div
                    className="mt-6 flex items-center text-orange-600 dark:text-orange-400 opacity-0 group-hover:opacity-100 transition-all duration-500"
                    whileHover={{ x: 5 }}
                  >
                    <span className="text-base font-semibold">Try Smart Betslip</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
