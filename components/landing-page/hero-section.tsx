"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, ArrowRight, Zap, Lock, Smartphone, CheckCircle, TrendingUp, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"

// Live odds data for ticker
const liveOdds = [
  { game: "Lakers O/U 47.5", book: "FanDuel", odds: "+110", type: "best" },
  { game: "Warriors -3.5", book: "DraftKings", odds: "-105", type: "value" },
  { game: "Celtics ML", book: "BetMGM", odds: "+125", type: "best" },
  { game: "Heat O/U 215.5", book: "Caesars", odds: "+108", type: "value" },
]

// Testimonials for rotation
const testimonials = [
  { text: "I cut my research time from 10 minutes to 10 seconds!", author: "Mike R." },
  { text: "Found $200 in missed value in my first week using this.", author: "Sarah K." },
  { text: "Never betting without scanning my slip first again.", author: "Alex T." },
  { text: "This tool pays for itself with just one better line.", author: "Jordan M." },
]

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [currentOdds, setCurrentOdds] = useState(0)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Rotate odds ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentOdds((prev) => (prev + 1) % liveOdds.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800/50">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] dark:bg-grid-white/[0.05]" />

      <div className="container relative px-4 py-16 sm:py-24 mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -30 }}
            transition={{ duration: 0.6 }}
            className="text-left"
          >
            {/* Badge - moved above headline */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.95 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center px-4 py-2 mb-8 rounded-full bg-slate-900/5 dark:bg-slate-100/5 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm"
            >
              <Zap className="w-4 h-4 mr-2 text-green-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Instant Betslip Analysis</span>
            </motion.div>

            {/* Main headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-8 text-slate-900 dark:text-slate-100">
              Stop Wasting Time. <br />
              <span className="bg-gradient-to-r from-green-600 to-green-600 bg-clip-text text-transparent">
                Start Smashing Odds.
              </span>
            </h1>

            {/* Simplified subheadline with more spacing */}
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed font-medium">
              Scan your slip. Compare every book in seconds. Never miss value.
            </p>

            {/* CTA Buttons with enhanced styling */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button
                asChild
                size="lg"
                className="text-base font-medium px-8 h-12 bg-slate-900 hover:bg-slate-800 text-white border-0 group relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Link href="/betslip-scanner">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-slate-800 to-slate-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  />
                  <motion.div
                    className="absolute inset-0 bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    animate={{
                      boxShadow: [
                        "0 0 0 0 rgba(34, 197, 94, 0)",
                        "0 0 0 4px rgba(34, 197, 94, 0.1)",
                        "0 0 0 0 rgba(34, 197, 94, 0)",
                      ],
                    }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  />
                  <span className="relative z-10 flex items-center">
                    <Search className="mr-2 h-4 w-4" />🔍 Try the Betslip Scanner
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-base font-medium px-8 h-12 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 group bg-transparent"
              >
                <Link href="/odds-screen">
                  Explore Odds Screen
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>

            {/* Refined trust signals */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 10 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <Lock className="h-4 w-4 text-green-500" />
                <span>No signup. No paywall.</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <Zap className="h-4 w-4 text-green-500" />
                <span>Works on X, Discord, or your own slip.</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <Smartphone className="h-4 w-4 text-green-500" />
                <span>Mobile & desktop ready.</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Demo Visual */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 30 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative w-full lg:w-auto"
          >
            <Card className="overflow-hidden border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <div className="relative w-full aspect-[4/3] overflow-hidden">
                {/* Placeholder for demo GIF */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-500/20 to-green-500/20" />
                <Image
                  src="/placeholder.svg?height=400&width=600&text=Betslip Scanner Demo"
                  alt="Demo of betslip scanner showing screenshot upload and odds comparison"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 600px"
                  priority
                />

                {/* Demo flow overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-lg p-6 text-center max-w-sm mx-4">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold">
                        1
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                      <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">
                        2
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                        3
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-medium">Upload</span> → <span className="font-medium">Scan</span> →{" "}
                      <span className="font-medium">Compare</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Demo description */}
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="font-medium text-slate-900 dark:text-slate-100">Live Demo</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Watch our scanner instantly identify picks and show the best odds with EV calculations.
                </p>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Live Odds Ticker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
              <TrendingUp className="h-4 w-4" />
              <span>Live Odds Updates</span>
            </div>
          </div>

          <Card className="bg-slate-50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentOdds}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-4 text-slate-900 dark:text-slate-100">
                  <span className="text-lg font-medium">{liveOdds[currentOdds].game}</span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                  <span className="text-green-600 dark:text-green-400 font-bold">
                    Best at {liveOdds[currentOdds].odds}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">on {liveOdds[currentOdds].book}</span>
                  <div className="px-2 py-1 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-medium">
                    {liveOdds[currentOdds].type === "best" ? "BEST LINE" : "VALUE"}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Rotating Testimonial */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 max-w-2xl mx-auto text-center"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTestimonial}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 rounded-lg p-6 backdrop-blur-sm"
            >
              <div className="flex items-center justify-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-lg text-slate-900 dark:text-slate-100 font-medium mb-3">
                &quot;{testimonials[currentTestimonial].text}&quot;
              </blockquote>
              <cite className="text-slate-500 dark:text-slate-400 text-sm">
                — {testimonials[currentTestimonial].author}
              </cite>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}