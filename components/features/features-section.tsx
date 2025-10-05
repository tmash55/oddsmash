"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from 'lucide-react'
import type { ReactNode } from "react"

interface FeatureSectionProps {
  headline: string
  subheading: string
  description: string
  icon: ReactNode
  badge?: string
  reverse?: boolean
  features?: string[]
  ctaText?: string
  ctaAction?: () => void
}

export function FeatureSection({
  headline,
  subheading,
  description,
  icon,
  badge,
  reverse = false,
  features = [],
  ctaText = "Try It Now",
  ctaAction,
}: FeatureSectionProps) {
  return (
    <section className="py-16 sm:py-24 bg-gray-50/50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${reverse ? "lg:grid-flow-col-dense" : ""}`}>
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: reverse ? 50 : -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className={`space-y-6 ${reverse ? "lg:col-start-2" : ""}`}
          >
            {/* Badge */}
            {badge && (
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30 px-3 py-1 text-sm font-medium"
              >
                {badge}
              </Badge>
            )}

            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 border border-gray-200 dark:bg-gradient-to-br dark:from-blue-500/20 dark:to-purple-500/20 dark:border dark:border-white/10 flex items-center justify-center">
              {icon}
            </div>

            {/* Headlines */}
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
                {headline}
              </h2>
              <p className="text-xl text-blue-600 dark:text-blue-400 font-medium">{subheading}</p>
              <p className="text-lg text-gray-600 dark:text-white/70 leading-relaxed">{description}</p>
            </div>

            {/* Feature List */}
            {features.length > 0 && (
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                    <span className="text-gray-700 dark:text-white/80">{feature}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* CTA */}
            <div>
              <Button
                size="lg"
                onClick={ctaAction}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 font-medium"
              >
                {ctaText}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>

          {/* Media Placeholder */}
          <motion.div
            initial={{ opacity: 0, x: reverse ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className={`${reverse ? "lg:col-start-1" : ""}`}
          >
            <div className="aspect-video rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 dark:bg-gradient-to-br dark:from-white/5 dark:to-white/10 dark:border dark:border-white/10 flex items-center justify-center backdrop-blur-xl shadow-2xl">
              <div className="text-center space-y-4">
                <div className="bg-white/50 dark:bg-white/10 rounded-xl px-6 py-4">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">Coming Soon!</p>
                  <p className="text-sm text-gray-600 dark:text-white/60 mt-2">
                    Feature preview video in development
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
