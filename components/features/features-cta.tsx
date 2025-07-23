"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Crown, BarChart3, Target, Camera, Zap } from "lucide-react"
import Link from "next/link"

const stats = [
  { label: "Sportsbooks", value: "10+", icon: BarChart3, color: "from-blue-500 to-cyan-500" },
  { label: "Markets Tracked", value: "50+", icon: Target, color: "from-green-500 to-emerald-500" },
  { label: "Daily Scans", value: "1000+", icon: Camera, color: "from-purple-500 to-violet-500" },
  { label: "Props Compared Monthly", value: "100K+", icon: Zap, color: "from-orange-500 to-red-500" },
]

export function FeaturesCTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center space-y-8"
        >
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 border border-gray-200 dark:bg-gradient-to-br dark:from-emerald-500/20 dark:to-green-500/20 dark:border dark:border-white/10 flex items-center justify-center mx-auto">
            <Crown className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>

          {/* Content */}
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
              Ready to Join the{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                Founders Beta?
              </span>
            </h2>
            <p className="text-lg sm:text-xl max-w-2xl mx-auto text-gray-600 dark:text-white/70">
              Get free access to all features while we're in beta. Help shape the future of sports betting tools and
              lock in exclusive founder pricing.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  className="text-center group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <div
                    className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
                  >
                    <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">{stat.value}</div>
                  <div className="text-sm sm:text-base text-gray-500 dark:text-white/60 font-medium">{stat.label}</div>
                </motion.div>
              )
            })}
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              asChild
            >
              <Link href="/sign-up">
                <Crown className="w-5 h-5 mr-2" />
                Join Founders Beta
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-4 text-lg border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-white/20 dark:text-white dark:hover:bg-white/10 bg-transparent"
              asChild
            >
              <Link href="/features">Explore Features</Link>
            </Button>
          </div>

          {/* Trust indicators - Updated for Beta */}
          <div className="text-sm text-gray-400 dark:text-white/50 space-y-2">
            <p>✓ Completely free during beta • ✓ All features included • ✓ Founder perks when we launch</p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Beta now live</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
