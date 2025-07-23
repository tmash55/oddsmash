"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, BarChart3, Target, Camera, Zap } from "lucide-react"
import Link from "next/link"

const stats = [
  { label: "Sportsbooks", value: "10+", icon: BarChart3, color: "from-blue-500 to-cyan-500" },
  { label: "Markets Tracked", value: "50+", icon: Target, color: "from-green-500 to-emerald-500" },
  { label: "Daily Scans", value: "1000+", icon: Camera, color: "from-purple-500 to-violet-500" },
  { label: "Props Compared Monthly", value: "100K+", icon: Zap, color: "from-orange-500 to-red-500" },
]

export function StatsCTASection() {
  return (
    <section className="py-16 sm:py-20 bg-gradient-to-br from-muted/20 via-background to-muted/20 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-purple-50/20 dark:from-blue-950/10 dark:via-transparent dark:to-purple-950/10" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mb-16 sm:mb-20"
        >
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
                <div className="text-3xl sm:text-4xl font-bold text-foreground mb-2">{stat.value}</div>
                <div className="text-sm sm:text-base text-muted-foreground font-medium">{stat.label}</div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center"
        >
          <div className="bg-gradient-to-br from-blue-50/80 to-purple-50/80 dark:from-blue-950/40 dark:to-purple-950/40 rounded-3xl p-8 sm:p-12 border-2 border-blue-200/30 dark:border-blue-800/20 backdrop-blur-xl shadow-xl">
            <motion.h3
              className="text-2xl sm:text-3xl font-bold text-foreground mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              Ready to explore all features?
            </motion.h3>
            <motion.p
              className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              Dive deeper into each tool and see how they work together to give you the ultimate betting advantage.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Link href="/features">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 sm:px-10 h-14 text-base font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  Explore All Features
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 sm:px-10 h-14 text-base font-semibold rounded-2xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-2 hover:bg-white/80 dark:hover:bg-gray-900/80 transition-all duration-300"
                >
                  Start Free Trial
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
