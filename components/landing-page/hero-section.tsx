"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import {
  BarChart3,
  Target,
  Sparkles,
  Crown,
  Activity,
  LineChart,
  Home,
  Bell,
  Search,
  Clock,
  Share2,
  TrendingUp,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/20 pt-24 md:pt-32 pb-20">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 dark:bg-primary/5 rounded-full blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 12,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 dark:bg-purple-400/5 rounded-full blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, 20, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 15,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 3,
          }}
        />
        <motion.div
          className="absolute top-1/2 right-1/3 w-48 h-48 bg-primary/10 dark:bg-primary/5 rounded-full blur-3xl"
          animate={{
            x: [0, 25, 0],
            y: [0, -15, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 6,
          }}
        />
      </div>

      <div className="container relative z-10 px-4 md:px-6">
        {/* Hero Content - Centered */}
        <motion.div
          className="text-center space-y-8 mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Main Heading */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl mx-auto">
              <span className="bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent">
                Stop Wasting Time.
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary via-blue-600 to-primary bg-clip-text text-transparent">
                Start Smashing Odds.
              </span>
            </h1>

            <div className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              <p>Scan any betslip. Compare every book in seconds.</p>
              <p>Never miss value.</p>
            </div>

            {/* Beta Micro-copy */}
            <motion.div
              className="pt-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <p className="text-sm text-muted-foreground/60 max-w-2xl mx-auto">
                Currently in closed beta — all features free for early adopters
              </p>
            </motion.div>
          </motion.div>

          {/* Enhanced Premium CTA Button - Clean Version */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="relative group"
          >
            <Button
              size="lg"
              className="relative h-16 md:h-18 px-10 md:px-12 text-lg font-black rounded-3xl bg-emerald-400 hover:bg-emerald-300 text-black shadow-[0_6px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_25px_rgba(16,185,129,0.4)] transition-all duration-500 border-0 overflow-hidden"
              asChild
            >
              <Link href="/sign-up" className="inline-flex items-center relative z-10">
                {/* Refined shimmer effect - Only on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/0 group-hover:via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatDelay: 3,
                    ease: "easeInOut",
                  }}
                />

                {/* Softened pulsing dot - Slower and more subtle */}
                <motion.div
                  className="w-2 h-2 bg-purple-500 rounded-full mr-3 shadow-lg opacity-60"
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.6, 0.8, 0.6],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                />

                <span className="relative z-10 font-black">Join the Founders Beta</span>

                {/* Enhanced BETA pill - Hover-triggered glow */}
                <motion.div
                  className="ml-4 relative"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <Badge className="bg-purple-500 hover:bg-purple-400 text-white text-[10px] font-black px-3 py-1.5 border-0 shadow-lg uppercase tracking-wider transition-all duration-300">
                    <motion.span
                      className="group-hover:animate-pulse"
                      animate={{
                        textShadow: [
                          "0 0 0px rgba(255,255,255,0)",
                          "0 0 4px rgba(255,255,255,0.6)",
                          "0 0 0px rgba(255,255,255,0)",
                        ],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                    >
                      Beta
                    </motion.span>
                  </Badge>
                </motion.div>

                {/* Refined animated arrow - Gentler motion */}
                <motion.div
                  className="ml-3"
                  animate={{
                    x: [0, 2, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                >
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
                </motion.div>
              </Link>
            </Button>
          </motion.div>

          {/* Feature Bullets */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-6 md:gap-8 text-sm text-muted-foreground mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground/70" />
              <span>Free account in 10 seconds</span>
            </div>
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-muted-foreground/70" />
              <span>Works on X, Discord & screenshots</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground/70" />
              <span>Live hit-rate overlays</span>
            </div>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            className="space-y-4 hidden sm:block"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
          >
            <div className="flex items-center justify-center gap-2">
              <div className="text-sm text-muted-foreground max-w-md mx-auto text-center">
                <span className="font-medium">"Saved me 10 mins per parlay!"</span>
                <span className="text-muted-foreground/70"> — @SharpBettor</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Dashboard Preview - Full Width */}
        <motion.div
          className="w-full max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.8 }}
        >
          <Card className="overflow-hidden bg-gradient-to-br from-background/90 to-muted/30 backdrop-blur-xl border-2 border-border/50 shadow-2xl drop-shadow-xl">
            <CardContent className="p-0">
              {/* Dashboard Header */}
              <div className="flex items-center justify-between p-6 border-b border-border/50 bg-muted/20">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                      <Target className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="font-semibold text-lg">OddSmash</span>
                  </div>
                  <div className="hidden md:block">
                    <span className="text-sm text-muted-foreground">Trading / Dashboard</span>
                    <h2 className="font-semibold">Main Dashboard</h2>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  <Search className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>

              <div className="grid lg:grid-cols-4 min-h-[500px]">
                {/* Sidebar */}
                <div className="hidden lg:block bg-muted/10 border-r border-border/50 p-4">
                  <nav className="space-y-2">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 text-primary">
                      <Home className="w-4 h-4" />
                      <span className="font-medium">Dashboard</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <BarChart3 className="w-4 h-4 text-muted-foreground" />
                      <span>Props</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <LineChart className="w-4 h-4 text-muted-foreground" />
                      <span>Analytics</span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        New
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <Activity className="w-4 h-4 text-muted-foreground" />
                      <span>Hit Rates</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <Crown className="w-4 h-4 text-muted-foreground" />
                      <span>Trackers</span>
                    </div>
                  </nav>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-2 p-6 space-y-6">
                  {/* Balance Section */}
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-sm text-muted-foreground">Balance</span>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          1D
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          7D
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          1M
                        </Badge>
                        <Badge variant="default" className="text-xs">
                          1Y
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2 mb-6">
                      <span className="text-3xl font-bold">$2,847.32</span>
                      <span className="text-primary text-sm font-medium">+47.3%</span>
                    </div>

                    {/* Scanner Upload State - Updated with primary colors */}
                    <div className="h-48 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 border-2 border-primary/20 dark:border-primary/30 flex flex-col items-center justify-center group hover:border-primary/30 dark:hover:border-primary/40 transition-colors relative overflow-hidden">
                      {/* Upload State */}
                      <div className="text-center space-y-3">
                        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                          <span className="text-2xl">📸</span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-primary">Upload a screenshot</p>
                          <p className="text-xs text-primary/80">Drag & drop or click to scan</p>
                        </div>
                      </div>

                      {/* Step indicators at bottom */}
                      <div className="absolute bottom-3 left-3 right-3 flex justify-between text-xs text-primary/70">
                        <span className="font-medium">1. Upload</span>
                        <span className="opacity-50">2. Scan</span>
                        <span className="opacity-50">3. Best Odds</span>
                      </div>

                      {/* Subtle animation hint */}
                      <motion.div
                        className="absolute inset-0 rounded-xl border-2 border-primary/30"
                        animate={{
                          borderColor: [
                            "hsl(var(--primary) / 0.3)",
                            "hsl(var(--primary) / 0.1)",
                            "hsl(var(--primary) / 0.3)",
                          ],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                        }}
                      />
                    </div>
                  </div>

                  {/* Props Section */}
                  <div>
                    <h3 className="font-semibold mb-4">Top Props</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <span className="text-xs font-bold text-orange-600 dark:text-orange-400">⚾</span>
                          </div>
                          <div>
                            <div className="font-medium text-sm">Aaron Judge</div>
                            <div className="text-xs text-muted-foreground">Home Runs O/U 0.5</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-sm">+125</div>
                          <div className="text-xs text-primary">73% hit rate</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">🏀</span>
                          </div>
                          <div>
                            <div className="font-medium text-sm">LeBron James</div>
                            <div className="text-xs text-muted-foreground">Points O/U 25.5</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-sm">-110</div>
                          <div className="text-xs text-primary">68% hit rate</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Sidebar */}
                <div className="hidden lg:block bg-muted/10 border-l border-border/50 p-4">
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-4">Quick Actions</h3>
                      <div className="space-y-3">
                        <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                          <Target className="w-4 h-4 mr-2" />
                          Smash Screen
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Scanner
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                          <Activity className="w-4 h-4 mr-2" />
                          Hit Rates
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-4">Recent Activity</h3>
                      <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                          <div className="text-sm font-medium text-primary">Win</div>
                          <div className="text-xs text-primary/80">Judge HR +125</div>
                        </div>
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-800/50">
                          <div className="text-sm font-medium text-red-700 dark:text-red-300">Loss</div>
                          <div className="text-xs text-red-600 dark:text-red-400">Ohtani K&apos;s -110</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
