"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Search, DollarSign, ExternalLink, ArrowRight, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useMediaQuery } from "@/hooks/use-media-query"

export function HowItWorks() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Steps data with modern styling
  const steps = [
    {
      icon: <Search className="h-6 w-6" />,
      title: "Compare Props or Parlays",
      description: "Instantly see odds from all major sportsbooks in one place",
      stat: "15+ Sportsbooks",
      color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      accentColor: "text-blue-500",
      borderColor: "border-blue-200 dark:border-blue-800",
    },
    {
      icon: <DollarSign className="h-6 w-6" />,
      title: "Choose the Best Odds",
      description: "Find the highest payouts and best lines with highlighted values",
      stat: "14.2% Better Odds",
      color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      accentColor: "text-emerald-500",
      borderColor: "border-emerald-200 dark:border-emerald-800",
    },
    {
      icon: <ExternalLink className="h-6 w-6" />,
      title: "Auto-Add to Betslip",
      description: "One click sends you directly to the sportsbook with your bet ready",
      stat: "1-Click Betting",
      color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      accentColor: "text-amber-500",
      borderColor: "border-amber-200 dark:border-amber-800",
    },
  ]

  // Intersection Observer to trigger animations when section is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 },
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current)
      }
    }
  }, [])

  // Auto-advance steps for animation
  useEffect(() => {
    if (!isVisible) return

    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [isVisible, steps.length])

  return (
    <section
      ref={containerRef}
      className="py-16 md:py-24 bg-gradient-to-br from-slate-50 via-white to-slate-100/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800/50 relative overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern bg-[length:20px_20px] md:bg-[length:30px_30px] opacity-5 dark:opacity-10"></div>
        {/* Subtle gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container relative z-10 px-4 mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center px-4 py-2 mb-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            <TrendingUp className="w-4 h-4 mr-2 text-emerald-500" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Simple 3-Step Process</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-slate-900 dark:text-slate-100"
          >
            How It Works
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
          >
            Get better odds in three simple steps — no account required
          </motion.p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto mb-12 md:mb-16">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{
                opacity: isVisible ? 1 : 0,
                y: isVisible ? 0 : 30,
                scale: activeStep === index ? 1.02 : 1,
              }}
              transition={{
                duration: 0.5,
                delay: 0.3 + index * 0.1,
                scale: { duration: 0.3 },
              }}
              className={cn(
                "relative rounded-2xl border bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 md:p-8 transition-all duration-300 hover:shadow-lg",
                activeStep === index
                  ? cn("shadow-xl", step.borderColor)
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
              )}
            >
              {/* Step number */}
              <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-sm font-bold text-slate-700 dark:text-slate-300 shadow-sm">
                {index + 1}
              </div>

              {/* Icon */}
              <div
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-slate-200 dark:border-slate-700",
                  step.color,
                )}
              >
                <div className={step.accentColor}>{step.icon}</div>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-slate-100">{step.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{step.description}</p>
                </div>

                {/* Stat badge */}
                <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className={cn("text-sm font-semibold", step.accentColor)}>{step.stat}</span>
                </div>
              </div>

              {/* Connection line for desktop */}
              {!isMobile && index < steps.length - 1 && (
                <div className="absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-slate-300 to-transparent dark:from-slate-600 hidden md:block"></div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center px-6 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-slate-600 dark:text-slate-400">
              Save an average of <span className="font-bold text-emerald-500">$142.60</span> per $1000 bet
            </span>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center"
        >
          <Button
            asChild
            size={isMobile ? "lg" : "lg"}
            className="group bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Link href="/mlb/props">
              Try It Now
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
