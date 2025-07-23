"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Upload, ArrowRight, RotateCcw, Copy, HelpCircle } from "lucide-react"
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
    legs: [
      "Aaron Judge HR O/U 0.5",
      "LeBron James Pts O/U 25.5",
      "Connor McDavid Goals O/U 0.5",
      "Shohei Ohtani K's O/U 7.5",
    ],
  },
  {
    book: "MGM",
    logo: "MG",
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
        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Pain */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-muted-foreground">
                Hate juggling apps?
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Four sportsbooks. One parlay. A thousand clicks.
              </p>
            </div>

            {/* Pain Points - Unified Icons */}
            <div className="space-y-4 text-muted-foreground">
              <div className="flex items-center gap-3">
                <RotateCcw className="w-6 h-6 text-muted-foreground/70" />
                <span>Switching between DraftKings, FanDuel, MGM…</span>
              </div>
              <div className="flex items-center gap-3">
                <Copy className="w-6 h-6 text-muted-foreground/70" />
                <span>Copy-pasting each parlay leg</span>
              </div>
              <div className="flex items-center gap-3">
                <HelpCircle className="w-6 h-6 text-muted-foreground/70" />
                <span>Still guessing which book pays best?</span>
              </div>
            </div>

            {/* Scrolling Carousel */}
            <div className="relative">
              <Card className="overflow-hidden bg-gradient-to-br from-background/80 to-muted/20 backdrop-blur-sm border-2 border-border/50 shadow-lg">
                <CardContent className="p-0">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentParlay}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.5 }}
                      className="p-6"
                    >
                      {/* Book Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg bg-gradient-to-br ${parlayData[currentParlay].color} flex items-center justify-center shadow-lg`}
                          >
                            <span className="text-white font-bold text-sm">{parlayData[currentParlay].logo}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold">{parlayData[currentParlay].book}</h3>
                            <p className="text-sm text-muted-foreground">4-Leg Parlay</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {parlayData[currentParlay].payout}
                          </div>
                          <div className="text-xs text-muted-foreground">Potential Payout</div>
                        </div>
                      </div>

                      {/* Parlay Legs */}
                      <div className="space-y-3">
                        {parlayData[currentParlay].legs.map((leg, index) => (
                          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                            <span className="text-sm font-medium">{leg}</span>
                            <span className="text-xs text-muted-foreground">-110</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </CardContent>
              </Card>

              {/* Enhanced Carousel Controls */}
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={prevParlay}
                  className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-border shadow-sm hover:shadow-md opacity-50 hover:opacity-100 transition-all duration-200 flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex gap-3">
                  {parlayData.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentParlay(index)}
                      className={`rounded-full transition-all duration-200 ${
                        index === currentParlay
                          ? "w-3 h-3 bg-gradient-to-r from-green-500 to-purple-500"
                          : "w-2 h-2 bg-muted hover:bg-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={nextParlay}
                  className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-border shadow-sm hover:shadow-md opacity-50 hover:opacity-100 transition-all duration-200 flex items-center justify-center"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Right - Solution */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Meet the Betslip Scanner
                </span>
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Upload any screenshot—get your best book + EV instantly.
              </p>

              {/* CTA moved up */}
              <Button
                size="lg"
                className="w-full h-14 text-base font-semibold rounded-2xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl hover:shadow-green-500/25 transition-all duration-300 group"
                asChild
              >
                <Link href="/betslip-scanner">
                  Try the Scanner
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>

            {/* Enhanced Scanner Preview */}
            <Card className="overflow-hidden bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-4 border-green-400/50 dark:border-green-600/50 shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  {/* Upload State */}
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                    <Upload className="w-8 h-8 text-white" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">Best Odds: MGM +12% EV</h3>
                    <p className="text-sm text-green-600 dark:text-green-400">Your parlay pays $145 more at MGM</p>
                  </div>

                  {/* Process Steps */}
                  <div className="flex justify-between text-xs text-green-600/70 dark:text-green-400/70 pt-4 border-t border-green-200/50 dark:border-green-800/50">
                    <span className="font-medium">1. Upload</span>
                    <span className="font-medium">2. Scan</span>
                    <span className="font-medium">3. Best Odds</span>
                  </div>
                </div>
              </CardContent>
            </Card>
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
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-muted-foreground">
                Hate juggling apps?
              </h2>
              <p className="text-lg text-muted-foreground">Four sportsbooks. One parlay. A thousand clicks.</p>
            </div>

            {/* Mobile Carousel - Swipeable */}
            <div className="relative">
              <Card className="overflow-hidden bg-gradient-to-br from-background/80 to-muted/20 backdrop-blur-sm border-2 border-border/50 shadow-lg">
                <CardContent className="p-0">
                  <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                    {parlayData.map((parlay, index) => (
                      <div key={index} className="flex-none w-full snap-start p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg bg-gradient-to-br ${parlay.color} flex items-center justify-center`}
                            >
                              <span className="text-white font-bold text-xs">{parlay.logo}</span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm">{parlay.book}</h3>
                              <p className="text-xs text-muted-foreground">4-Leg Parlay</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-green-600 dark:text-green-400">{parlay.payout}</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {parlay.legs.slice(0, 2).map((leg, legIndex) => (
                            <div key={legIndex} className="text-xs text-muted-foreground">
                              {leg}
                            </div>
                          ))}
                          <div className="text-xs text-muted-foreground/60">+ 2 more legs</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
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
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Meet the Betslip Scanner
                </span>
              </h2>
              <p className="text-lg text-muted-foreground">Upload any screenshot—get your best book + EV instantly.</p>
            </div>

            <Button
              size="lg"
              className="w-full h-14 text-base font-semibold rounded-2xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl hover:shadow-green-500/25 transition-all duration-300 group"
              asChild
            >
              <Link href="/betslip-scanner">
                Try the Scanner
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>

            <Card className="overflow-hidden bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-4 border-green-400/50 dark:border-green-600/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-green-700 dark:text-green-300">Best Odds: MGM +12% EV</h3>
                    <p className="text-sm text-green-600 dark:text-green-400">Your parlay pays $145 more</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
