"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Zap, TrendingUp, Camera, ShoppingCart } from 'lucide-react'

export function FeaturesHero() {
  const scrollToFeature = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const features = [
    { icon: Zap, label: "SmashBoard", color: "blue", id: "smashboard" },
    { icon: TrendingUp, label: "Hit Rate Tracker", color: "green", id: "hit-rate-tracker" },
    { icon: Camera, label: "Betslip Scanner", color: "purple", id: "betslip-scanner" },
    { icon: ShoppingCart, label: "Smart Betslip", color: "orange", id: "smart-betslip" },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center space-y-8">
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30 px-4 py-2 text-sm font-medium"
            >
              🚀 Powered by AI & Real-Time Data
            </Badge>
          </motion.div>

          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-4"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white">
              Every Tool You Need to{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Smash the Books
              </span>
            </h1>
            <p className="text-lg sm:text-xl max-w-3xl mx-auto text-gray-600 dark:text-white/70">
              From real-time odds comparison to AI-powered betslip analysis, OddSmash gives you the edge you need to bet
              smarter and win more.
            </p>
          </motion.div>

          {/* Feature Icons Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto"
          >
            {features.map((feature) => (
              <button
                key={feature.label}
                onClick={() => scrollToFeature(feature.id)}
                className="p-4 rounded-xl bg-white/80 backdrop-blur-xl border border-gray-200 dark:bg-white/5 dark:backdrop-blur-xl dark:border dark:border-white/10 hover:scale-105 transition-transform duration-200 cursor-pointer"
              >
                <feature.icon
                  className={`w-8 h-8 mx-auto mb-2 ${
                    feature.color === "blue"
                      ? "text-blue-600 dark:text-blue-400"
                      : feature.color === "green"
                        ? "text-green-600 dark:text-green-400"
                        : feature.color === "purple"
                          ? "text-purple-600 dark:text-purple-400"
                          : "text-orange-600 dark:text-orange-400"
                  }`}
                />
                <p className="text-sm font-medium text-gray-900 dark:text-white">{feature.label}</p>
              </button>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-medium"
            >
              Try for Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
