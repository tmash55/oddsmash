"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Upload, Zap, Target, ArrowRight, CheckCircle, Scan, Camera } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

const steps = [
  {
    number: "1",
    title: "Upload",
    description: "Drag & drop or paste your screenshot",
    icon: Upload,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-gradient-to-br from-blue-50/80 to-blue-100/80 dark:from-blue-950/50 dark:to-blue-900/50",
  },
  {
    number: "2",
    title: "Scan",
    description: "Our AI parses your lines instantly",
    icon: Zap,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-gradient-to-br from-purple-50/80 to-purple-100/80 dark:from-purple-950/50 dark:to-purple-900/50",
  },
  {
    number: "3",
    title: "Best Odds",
    description: "See the top book + EV in real time",
    icon: Target,
    color: "from-green-500 to-green-600",
    bgColor: "bg-gradient-to-br from-green-50/80 to-green-100/80 dark:from-green-950/50 dark:to-green-900/50",
  },
]

// Live Scanner Demo Animation
const LiveScannerDemo = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [isScanning, setIsScanning] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentStep < 4) {
        setCurrentStep((prev) => prev + 1)
        if (currentStep === 1) {
          setIsScanning(true)
          setTimeout(() => setIsScanning(false), 2000)
        }
      } else {
        setCurrentStep(0)
        setIsScanning(false)
      }
    }, 2500)
    return () => clearInterval(interval)
  }, [currentStep])

  return (
    <div className="relative h-80 bg-gradient-to-br from-gray-900/95 to-gray-800/95 rounded-2xl border-2 border-gray-700/50 overflow-hidden backdrop-blur-xl">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-green-500/20" />
      </div>

      {/* Step 0: Upload State */}
      {currentStep === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute inset-0 flex flex-col items-center justify-center"
        >
          <motion.div
            className="w-20 h-20 border-3 border-dashed border-blue-400/60 rounded-2xl flex items-center justify-center mb-6"
            animate={{
              borderColor: ["rgba(96, 165, 250, 0.6)", "rgba(96, 165, 250, 0.9)", "rgba(96, 165, 250, 0.6)"],
            }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            <Upload className="w-10 h-10 text-blue-400" />
          </motion.div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-2">Drop Your Screenshot</h3>
            <p className="text-gray-400">Any sportsbook, any format</p>
          </div>
        </motion.div>
      )}

      {/* Step 1: Scanning State */}
      {currentStep === 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex flex-col items-center justify-center"
        >
          <motion.div
            className="w-20 h-20 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 border border-purple-400/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <Scan className="w-10 h-10 text-purple-400" />
          </motion.div>
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-white mb-2">AI Scanning Lines...</h3>
            <p className="text-gray-400">Extracting bet information</p>
          </div>
          {/* Progress Bar */}
          <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      )}

      {/* Step 2: Processing State */}
      {currentStep === 2 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex flex-col items-center justify-center"
        >
          <div className="w-20 h-20 bg-yellow-500/20 rounded-2xl flex items-center justify-center mb-6 border border-yellow-400/30">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-yellow-400 rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 0.8, delay: i * 0.2, repeat: Number.POSITIVE_INFINITY }}
                />
              ))}
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-2">Comparing Odds...</h3>
            <p className="text-gray-400">Checking 15+ sportsbooks</p>
          </div>
        </motion.div>
      )}

      {/* Step 3: Results State */}
      {currentStep === 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute inset-0 flex flex-col items-center justify-center"
        >
          <motion.div
            className="w-20 h-20 bg-green-500/20 rounded-2xl flex items-center justify-center mb-6 border border-green-400/30"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.6 }}
          >
            <CheckCircle className="w-10 h-10 text-green-400" />
          </motion.div>
          <div className="text-center space-y-3">
            <h3 className="text-xl font-bold text-white">Best Odds Found!</h3>
            <div className="bg-green-500/20 border border-green-400/30 rounded-lg px-6 py-3">
              <div className="text-2xl font-bold text-green-400">BetMGM +12% EV</div>
              <div className="text-sm text-green-300">Your parlay pays $145 more</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Live indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <motion.div
          className="w-2 h-2 bg-green-400 rounded-full"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        />
        <span className="text-xs text-green-400 font-medium">Live Demo</span>
      </div>

      {/* Step indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        {[0, 1, 2, 3].map((step) => (
          <div
            key={step}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              step <= currentStep ? "bg-blue-400" : "bg-gray-600"
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export function HowItWorksSection() {
  return (
    <section className="py-16 sm:py-24 bg-gradient-to-br from-purple-50/30 via-background to-blue-50/30 dark:from-purple-950/10 dark:via-background dark:to-blue-950/10 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5" />
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-purple-500/10 dark:bg-purple-400/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-500/10 dark:bg-blue-400/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Enhanced Header */}
        <motion.div
          className="text-center space-y-6 mb-16 sm:mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <Camera className="w-5 h-5 text-purple-500" />
            </motion.div>
            <Badge
              variant="secondary"
              className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 dark:from-purple-900/30 dark:to-blue-900/30 dark:text-purple-300 border-0"
            >
              AI Powered
            </Badge>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4">
            How It Works in{" "}
            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              3 Seconds
            </span>
          </h2>
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            From screenshot to smarter bet in a click. Watch our AI work its magic.
          </p>
        </motion.div>

        {/* Live Demo Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-16 sm:mb-20"
        >
          <LiveScannerDemo />
        </motion.div>

        {/* Enhanced Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-16">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <Card
                className={`h-full overflow-hidden ${step.bgColor} backdrop-blur-xl border-2 border-border/50 hover:border-opacity-70 transition-all duration-500 hover:shadow-2xl group-hover:scale-[1.02]`}
              >
                <CardContent className="p-8 text-center space-y-6 relative h-full flex flex-col">
                  {/* Step Number Badge */}
                  <div className="absolute top-4 left-4">
                    <div className="w-8 h-8 rounded-full bg-white/20 dark:bg-gray-900/20 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-sm font-bold text-foreground">{step.number}</span>
                    </div>
                  </div>

                  {/* Icon with Enhanced Animation */}
                  <div className="flex-1 flex items-center justify-center">
                    <motion.div
                      className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-xl`}
                      whileHover={{
                        scale: 1.1,
                        rotate: [0, -5, 5, 0],
                        transition: { duration: 0.3 },
                      }}
                      animate={{
                        boxShadow: [
                          "0 10px 30px rgba(0,0,0,0.1)",
                          "0 15px 40px rgba(0,0,0,0.2)",
                          "0 10px 30px rgba(0,0,0,0.1)",
                        ],
                      }}
                      transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                    >
                      <step.icon className="w-10 h-10 text-white" />
                    </motion.div>
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-foreground group-hover:scale-105 transition-transform">
                      {step.title}
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>

                  {/* Hover Effect Overlay - Made Much More Subtle */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-white/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none"
                    initial={false}
                  />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Enhanced CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-lg text-muted-foreground mb-6">Ready to try it yourself?</p>
            </div>
            <Button
              size="lg"
              className="h-16 px-10 text-lg font-bold rounded-3xl bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 hover:from-purple-700 hover:via-blue-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-3xl hover:shadow-purple-500/25 transition-all duration-500 group relative overflow-hidden"
              asChild
            >
              <Link href="/betslip-scanner">
                {/* Animated background */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatDelay: 2,
                    ease: "easeInOut",
                  }}
                />
                <span className="relative z-10">Try the Scanner Now</span>
                <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform relative z-10" />
              </Link>
            </Button>

            {/* Trust indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Works with any sportsbook</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Instant results</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>100% free to try</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
