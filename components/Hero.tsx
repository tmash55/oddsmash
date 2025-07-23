"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Star, TrendingUp, BarChart3, Target, Sparkles, ArrowRight, Play, Users, Award, Zap } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/20 pb-24 md:pb-32">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 dark:bg-blue-400/5 rounded-full blur-3xl"
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
          className="absolute top-1/2 right-1/3 w-48 h-48 bg-green-500/10 dark:bg-green-400/5 rounded-full blur-3xl"
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
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <motion.div
            className="space-y-8 text-center lg:text-left"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex justify-center lg:justify-start"
            >
              <Badge
                variant="secondary"
                className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50"
              >
                <Zap className="w-4 h-4 mr-2" />
                Advanced Betting Analytics
              </Badge>
            </motion.div>

            {/* Main Heading */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent">
                  Take Control of Your
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Betting Strategy
                </span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                OddSmash offers a seamless, powerful experience for analyzing player props. Instant comparisons,
                optimized selections, and premium analytics tools.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <Button
                size="lg"
                className="h-14 px-8 text-base font-semibold rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 group"
                asChild
              >
                <Link href="/sign-up">
                  Get started now
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="h-14 px-8 text-base font-semibold rounded-2xl border-2 bg-background/50 backdrop-blur-sm hover:bg-muted/50 transition-all duration-300 group"
                asChild
              >
                <Link href="#demo">
                  <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Watch Demo
                </Link>
              </Button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <div className="flex items-center justify-center lg:justify-start gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>Trusted by thousands of bettors</span>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm font-semibold">4.9</span>
                <Badge variant="outline" className="text-xs">
                  <Award className="w-3 h-3 mr-1" />
                  Top Rated
                </Badge>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Dashboard Preview */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            {/* Main Dashboard Card */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-background/80 to-muted/20 backdrop-blur-xl border-2 border-border/50 shadow-2xl">
              <CardContent className="p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Smash Dashboard</h3>
                      <p className="text-sm text-muted-foreground">Real-time analytics</p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                  >
                    Live
                  </Badge>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/50">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Win Rate</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">73.2%</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">+5.3% this week</div>
                  </div>

                  <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200/50 dark:border-green-800/50">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">Profit</span>
                    </div>
                    <div className="text-2xl font-bold text-green-900 dark:text-green-100">+$2,847</div>
                    <div className="text-xs text-green-600 dark:text-green-400">+12.4% ROI</div>
                  </div>
                </div>

                {/* Placeholder for GIF */}
                <div className="relative h-48 rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 border-2 border-dashed border-muted-foreground/20 flex items-center justify-center group hover:border-muted-foreground/40 transition-colors">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Your looping GIF goes here</p>
                      <p className="text-xs text-muted-foreground/70">Interactive analytics preview</p>
                    </div>
                  </div>

                  {/* Animated border */}
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2 border-blue-500/20"
                    animate={{
                      borderColor: ["rgba(59, 130, 246, 0.2)", "rgba(147, 51, 234, 0.2)", "rgba(59, 130, 246, 0.2)"],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                  />
                </div>

                {/* Bottom Action */}
                <div className="mt-6 pt-6 border-t border-border/50">
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-medium"
                    asChild
                  >
                    <Link href="/mlb/odds/player-props">
                      Start Analyzing Props
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Floating Elements */}
            <motion.div
              className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg"
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              <Award className="w-8 h-8 text-white" />
            </motion.div>

            <motion.div
              className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg"
              animate={{
                y: [0, 10, 0],
                rotate: [0, -5, 0],
              }}
              transition={{
                duration: 5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 2,
              }}
            >
              <TrendingUp className="w-6 h-6 text-white" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
