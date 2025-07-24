"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Target, Crown, Clock, Share2, TrendingUp, ArrowRight, Zap } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/20 pt-12 md:pt-16 pb-16">
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-400/5 rounded-full blur-3xl"
          animate={{
            x: [0, 40, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 15,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 dark:bg-blue-400/5 rounded-full blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, 25, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 18,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 4,
          }}
        />
        <motion.div
          className="absolute top-1/2 right-1/3 w-64 h-64 bg-purple-500/10 dark:bg-purple-400/5 rounded-full blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 12,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 8,
          }}
        />
      </div>

      <div className="container relative z-10 px-4 md:px-6 lg:px-8 max-w-7xl">
        {/* Hero Content */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[80vh]">
          {/* Left Column - Text Content */}
          <motion.div
            className="text-center lg:text-left space-y-6 lg:pr-8"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Main Heading */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold tracking-tight text-foreground leading-tight">
                Stop Wasting Time.
                <br />
                <span className="bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                  Start Smashing Odds.
                </span>
              </h1>

              <div className="text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-2xl lg:max-w-none">
                <p>Scan any betslip—compare every book in seconds.</p>
              </div>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="relative group"
            >
              <Button
                size="lg"
                className="h-14 md:h-16 px-8 md:px-10 text-base md:text-lg font-bold rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
                asChild
              >
                <Link href="/sign-up" className="inline-flex items-center">
                  <Crown className="w-5 h-5 md:w-6 md:h-6 mr-3" />
                  <span>Join The Founders</span>
                  <ArrowRight className="w-5 h-5 md:w-6 md:h-6 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Right Column - Device Mockups */}
          <motion.div
            className="relative lg:pl-8"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <div className="relative flex items-center justify-center lg:justify-end min-h-[500px] lg:min-h-[600px]">
              {/* Desktop Mockup */}
              <motion.div
                className="relative z-10 w-full max-w-[520px] lg:max-w-[580px]"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl lg:rounded-3xl p-2 lg:p-3 shadow-2xl">
                  <div className="bg-black rounded-xl lg:rounded-2xl overflow-hidden">
                    {/* Browser Bar */}
                    <div className="bg-gray-800 px-4 py-3 flex items-center gap-2">
                      <div className="flex gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                      <div className="flex-1 bg-gray-700 rounded-md px-3 py-1 ml-4">
                        <div className="text-xs text-gray-400">oddsmash.com/dashboard</div>
                      </div>
                    </div>

                    {/* Desktop Content */}
                    <div className="aspect-[16/10] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-6 lg:p-8 relative">
                      <div className="text-center text-gray-400 mb-6">
                        <div className="text-3xl lg:text-4xl mb-4">📊</div>
                        <div className="text-lg lg:text-xl font-medium text-gray-300">SmashBoard Analytics</div>
                        <div className="text-sm lg:text-base opacity-60">Real-time odds comparison</div>
                      </div>

                      {/* Floating UI Elements */}
                      <motion.div
                        className="absolute top-6 right-6 w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                      >
                        <Target className="w-4 h-4 text-emerald-400" />
                      </motion.div>

                      <motion.div
                        className="absolute bottom-6 left-6 w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 1 }}
                      >
                        <TrendingUp className="w-3 h-3 text-blue-400" />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Mobile Mockup */}
              <motion.div
                className="absolute right-[-20px] lg:right-[-30px] bottom-0 lg:bottom-8 z-20 w-[200px] lg:w-[240px]"
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
              >
                <div className="relative">
                  {/* iPhone Frame */}
                  <div className="bg-gray-900 rounded-[2rem] lg:rounded-[2.5rem] p-2 lg:p-3 shadow-2xl">
                    <div className="bg-black rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden">
                      {/* Status Bar */}
                      <div className="bg-gray-900 px-4 lg:px-6 py-2 lg:py-3 flex justify-between items-center text-white text-xs lg:text-sm">
                        <span className="font-medium">3:00</span>
                        <div className="flex items-center gap-1 lg:gap-2">
                          <div className="flex gap-1">
                            <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 bg-white rounded-full"></div>
                            <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 bg-white rounded-full"></div>
                            <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 bg-white/50 rounded-full"></div>
                          </div>
                          <div className="w-5 h-2.5 lg:w-6 lg:h-3 border border-white/50 rounded-sm">
                            <div className="w-3 h-1.5 lg:w-4 lg:h-2 bg-white rounded-sm m-0.5"></div>
                          </div>
                        </div>
                      </div>

                      {/* Mobile App Content */}
                      <div className="aspect-[9/16] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-4 lg:p-6 relative">
                        <div className="text-center text-gray-400 mb-4">
                          <div className="text-2xl lg:text-3xl mb-3">📱</div>
                          <div className="text-sm lg:text-base font-medium text-gray-300">Betslip Scanner</div>
                          <div className="text-xs lg:text-sm opacity-60">AI-Powered Analysis</div>
                        </div>

                        {/* Mobile floating elements */}
                        <motion.div
                          className="absolute top-8 lg:top-12 left-4 lg:left-6 w-5 h-5 lg:w-6 lg:h-6 bg-emerald-500/30 rounded-full flex items-center justify-center"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                        >
                          <Zap className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-emerald-400" />
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {/* External floating elements */}
                  <motion.div
                    className="absolute -top-4 lg:-top-6 -left-4 lg:-left-6 w-6 h-6 lg:w-8 lg:h-8 bg-emerald-500/20 rounded-full flex items-center justify-center"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  >
                    <Zap className="w-3 h-3 lg:w-4 lg:h-4 text-emerald-400" />
                  </motion.div>

                  <motion.div
                    className="absolute -bottom-4 lg:-bottom-6 -right-4 lg:-right-6 w-5 h-5 lg:w-6 lg:h-6 bg-purple-500/20 rounded-full flex items-center justify-center"
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 1 }}
                  >
                    <Target className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-purple-400" />
                  </motion.div>
                </div>
              </motion.div>
            </div>
            {/* Micro-features section - Below devices */}
            <motion.div
              className="mt-16 lg:mt-20 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
            >
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-4 md:gap-8 text-sm md:text-base text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <span>Free account in 10 seconds</span>
                </div>
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-blue-500" />
                  <span>Works on X, Discord & screenshots</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  <span>Live hit-rate overlays</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
