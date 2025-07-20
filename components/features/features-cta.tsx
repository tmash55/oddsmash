"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from 'lucide-react'

export function FeaturesCTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl" />
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
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 border border-gray-200 dark:bg-gradient-to-br dark:from-blue-500/20 dark:to-purple-500/20 dark:border dark:border-white/10 flex items-center justify-center mx-auto">
            <Sparkles className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>

          {/* Content */}
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
              Ready to Start{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Smashing Lines?
              </span>
            </h2>
            <p className="text-lg sm:text-xl max-w-2xl mx-auto text-gray-600 dark:text-white/70">
              Join thousands of smart bettors who use OddSmash to find better odds, track player performance, and build
              winning strategies.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
            {[
              { value: "50K+", label: "Active Users" },
              { value: "2M+", label: "Bets Analyzed" },
              { value: "15%", label: "Avg. ROI Boost" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 dark:text-white/60">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-medium"
            >
              Start Your Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-4 text-lg border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
            >
              View Pricing
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="text-sm text-gray-400 dark:text-white/50 space-y-2">
            <p>✓ No credit card required • ✓ 7-day free trial • ✓ Cancel anytime</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
