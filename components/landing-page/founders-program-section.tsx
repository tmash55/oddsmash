"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Crown, Zap, Users, Gift, TrendingUp, Star } from "lucide-react"
import Link from "next/link"

const founderPerks = [
  {
    icon: TrendingUp,
    title: "Lifetime Founders Discount",
    description: "Lock in exclusive pricing when we launch Pro features",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Zap,
    title: "Early Access to New Features",
    description: "First to try Data Duel, advanced analytics, and more",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Users,
    title: "Direct Product Feedback",
    description: "Shape the future of OddSmash with exclusive feedback sessions",
    color: "from-purple-500 to-violet-500",
  },
  {
    icon: Gift,
    title: "Exclusive Founder Perks",
    description: "Special swag, referral bonuses, and VIP community access",
    color: "from-orange-500 to-red-500",
  },
]

export function FoundersProgramSection() {
  return (
    <section className="py-16 sm:py-24 bg-gradient-to-br from-gray-900 via-gray-900 to-black relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-purple-900/10" />
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <Crown className="w-6 h-6 text-yellow-500" />
            </motion.div>
            <Badge
              variant="secondary"
              className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 dark:from-yellow-900/30 dark:to-orange-900/30 dark:text-yellow-300 border-0"
            >
              Limited Beta
            </Badge>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Join the{" "}
            <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              OddSmash Founders
            </span>
          </h2>

          <p className="text-xl sm:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-8">
            All features are free during our beta. Help us shape the product, unlock exclusive perks, and lock in
            lifetime Founder pricing when we go live.
          </p>

          {/* Beta Status */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-medium">Beta Now Live</span>
            </div>
            <div className="w-px h-4 bg-gray-600"></div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-gray-400">Limited Spots Available</span>
            </div>
          </div>
        </motion.div>

        {/* Founder Perks Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
          {founderPerks.map((perk, index) => {
            const Icon = perk.icon
            return (
              <motion.div
                key={perk.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="h-full bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 group">
                  <CardContent className="p-6 text-center">
                    <div
                      className={`w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-r ${perk.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{perk.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{perk.description}</p>
                  </CardContent>
                </Card>
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
          <Card className="max-w-2xl mx-auto bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border-2 border-yellow-500/20 shadow-2xl">
            <CardContent className="p-8 sm:p-12">
              <div className="mb-6">
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 px-4 py-2 text-sm font-semibold mb-4">
                  🚀 Beta Access
                </Badge>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">Ready to Join the Founders?</h3>
                <p className="text-gray-300 leading-relaxed mb-8">
                  Create your free account now and get instant access to all beta features. No waitlist, no delays—start
                  finding value plays immediately.
                </p>
              </div>

              <div className="space-y-4">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-14 px-8 sm:px-12 text-base font-semibold rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl hover:shadow-yellow-500/25 transition-all duration-300 group"
                  asChild
                >
                  <Link href="/sign-up">
                    <Crown className="w-5 h-5 mr-2" />
                    Create Free Founder Account
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>

                <p className="text-xs text-gray-500">
                  No credit card required • Instant access • All features included
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-gray-400">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 border-2 border-gray-900 flex items-center justify-center text-white text-xs font-bold"
                  >
                    {i}
                  </div>
                ))}
              </div>
              <span className="text-sm">500+ Founders already joined</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm">Early feedback has been incredible</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
