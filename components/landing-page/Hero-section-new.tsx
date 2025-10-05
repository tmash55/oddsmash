"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Crown, ArrowRight, Target, TrendingUp, Zap, DollarSign, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

export function HeroSectionNew() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const MotionDiv = isMobile ? "div" : motion.div

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/30 px-4 py-16">
      {/* Background Gradient Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-emerald-400/20 to-blue-500/20 dark:from-emerald-400/10 dark:to-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-pink-500/20 dark:from-purple-400/10 dark:to-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-r from-blue-400/20 to-emerald-500/20 dark:from-blue-400/10 dark:to-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        {/* Top Badge */}
        <MotionDiv
          className="mb-8"
          {...(!isMobile && {
            initial: { opacity: 0, y: -20 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.6 },
          })}
        >
          <Badge
            variant="secondary"
            className="px-4 py-2 text-sm font-medium bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background/90 transition-colors"
          >
            <Zap className="w-4 h-4 mr-2 text-emerald-500" />
            Founders Beta Access
          </Badge>
        </MotionDiv>

        {/* Main Heading */}
        <MotionDiv
          className="mb-6"
          {...(!isMobile && {
            initial: { opacity: 0, y: 30 },
            animate: { opacity: 1, y: 0 },
            transition: { delay: 0.2, duration: 0.8 },
          })}
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-tight">
            Stop Wasting Time.
            <br />
            <span className="bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Start Smashing Odds.
            </span>
          </h1>
        </MotionDiv>

        {/* Subtitle */}
        <MotionDiv
          className="mb-10"
          {...(!isMobile && {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { delay: 0.4, duration: 0.6 },
          })}
        >
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            The AI-powered betslip scanner that empowers bettors of all levels to find the best odds and maximize
            profits instantly.
          </p>
        </MotionDiv>

        {/* CTA Button */}
        <MotionDiv
          className="mb-16"
          {...(!isMobile && {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { delay: 0.6, duration: 0.6 },
          })}
        >
          <Button
            size="lg"
            className="h-14 px-8 text-lg font-semibold rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
            asChild
          >
            <Link href="/sign-up" className="inline-flex items-center">
              <Crown className="w-5 h-5 mr-3" />
              <span>Join The Founders</span>
              <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </Button>
        </MotionDiv>

        {/* Floating UI Elements */}
        <div className="relative">
          {/* Main Scanner Interface */}
          <MotionDiv
            className="relative mx-auto w-full max-w-md md:max-w-lg"
            {...(!isMobile && {
              initial: { opacity: 0, scale: 0.9 },
              animate: { opacity: 1, scale: 1 },
              transition: { delay: 0.8, duration: 0.8 },
            })}
          >
            <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center">
                    <Target className="w-3 h-3 text-white" />
                  </div>
                  <div className="w-8 h-2 bg-muted rounded-full" />
                </div>
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-muted rounded-full" />
                  <div className="w-1 h-1 bg-muted rounded-full" />
                  <div className="w-1 h-1 bg-muted rounded-full" />
                </div>
              </div>

              {/* Profile Section */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">OS</span>
                </div>
                <div className="flex-1">
                  <div className="w-24 h-3 bg-muted rounded-full mb-1" />
                  <div className="w-16 h-2 bg-muted/60 rounded-full" />
                </div>
              </div>

              {/* Chat Messages */}
              <div className="space-y-3">
                <div className="bg-blue-500/10 dark:bg-blue-500/20 rounded-lg p-3 ml-8">
                  <p className="text-sm text-foreground">Scan this betslip for better odds?</p>
                </div>
                <div className="bg-emerald-500/10 dark:bg-emerald-500/20 rounded-lg p-3 mr-8">
                  <p className="text-sm text-foreground">Found +15% better odds!</p>
                </div>
                <div className="bg-purple-500/10 dark:bg-purple-500/20 rounded-lg p-3 ml-8">
                  <p className="text-sm text-foreground">Check this out 🎯</p>
                </div>
              </div>

              {/* Scanner Demo Area */}
              <div className="mt-4 aspect-[4/3] bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl flex items-center justify-center border border-border/30">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mb-3 mx-auto">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-sm text-muted-foreground">AI Scanner Active</p>
                </div>
              </div>
            </div>
          </MotionDiv>

          {/* Floating Elements */}
          {!isMobile && (
            <>
              {/* Odds Comparison Card */}
              <motion.div
                className="absolute -left-8 top-8 bg-background/90 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-lg"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2, duration: 0.6 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium text-foreground">Best Odds</span>
                </div>
                <div className="text-2xl font-bold text-emerald-500">+240</div>
                <div className="text-xs text-muted-foreground">vs +185 avg</div>
              </motion.div>

              {/* Profit Calculator */}
              <motion.div
                className="absolute -right-8 top-16 bg-background/90 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-lg"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4, duration: 0.6 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-foreground">Profit</span>
                </div>
                <div className="text-2xl font-bold text-blue-500">$127</div>
                <div className="text-xs text-muted-foreground">+$42 extra</div>
              </motion.div>

              {/* Stats Card */}
              <motion.div
                className="absolute -left-12 bottom-8 bg-background/90 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-lg"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6, duration: 0.6 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-foreground">Win Rate</span>
                </div>
                <div className="text-2xl font-bold text-purple-500">73%</div>
                <div className="text-xs text-muted-foreground">This week</div>
              </motion.div>

              {/* Success Notification */}
              <motion.div
                className="absolute -right-12 bottom-12 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-3 shadow-lg"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.8, duration: 0.6 }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Odds Updated!</span>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
