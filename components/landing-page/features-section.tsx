"use client"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, BarChart3, Target, Camera, ShoppingCart, Zap, TrendingUp, Play } from "lucide-react"
import Link from "next/link"

const features = [
  {
    id: "smashboard",
    icon: BarChart3,
    title: "SmashBoard",
    subtitle: "Real-time Odds. Smash-Worthy Insights.",
    description: "Compare player props across sportsbooks with built-in EV analysis and smart filters.",
    badge: "Live Odds",
    color: "from-blue-500 to-cyan-500",
    size: "large", // Takes up more space in bento grid
    imageAspect: "aspect-[16/10]",
  },
  {
    id: "hit-rate",
    icon: Target,
    title: "Hit Rate Tracker",
    subtitle: "How Hot Is That Player?",
    description: "Track player performance with full context and alternate lines.",
    badge: "Data Driven",
    color: "from-green-500 to-emerald-500",
    size: "medium",
    imageAspect: "aspect-square",
  },
  {
    id: "scanner",
    icon: Camera,
    title: "Betslip Scanner",
    subtitle: "Scan Any Betslip. Find Better Odds.",
    description: "Upload screenshots and let AI extract bets, compare odds instantly.",
    badge: "AI Powered",
    color: "from-purple-500 to-violet-500",
    size: "medium",
    imageAspect: "aspect-square",
  },
  {
    id: "smart-betslip",
    icon: ShoppingCart,
    title: "Smart Betslip",
    subtitle: "Build Your Bets. Boost Your Edge.",
    description: "Cart-style builder that compares legs and parlays across all sportsbooks for maximum payout.",
    badge: "Smart Builder",
    color: "from-orange-500 to-red-500",
    size: "large",
    imageAspect: "aspect-[16/10]",
  },
]

export default function LandingFeaturesSection() {
  return (
    <section className="py-16 sm:py-24 bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-950/20 dark:via-transparent dark:to-purple-950/20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-400/5 dark:to-purple-400/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-blue-500" />
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              Powerful Tools
            </Badge>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Bet Smarter
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            Four game-changing tools that give you the edge. Compare odds, track performance, scan betslips, and build
            winning strategies — all in one platform.
          </p>
        </motion.div>

        {/* Bento Grid Features */}
        <div className="grid grid-cols-1 lg:grid-cols-4 lg:grid-rows-3 gap-4 sm:gap-6 mb-12 sm:mb-16">
          {/* SmashBoard - Large Feature (spans 2 columns, 2 rows) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-2 lg:row-span-2"
          >
            <Card className="group h-full bg-card/50 backdrop-blur-sm border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 dark:hover:shadow-blue-400/10 overflow-hidden">
              <CardContent className="p-0 h-full flex flex-col">
                {/* Image Placeholder */}
                <div className="relative aspect-[16/10] lg:aspect-[16/12] bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-400/10 dark:to-cyan-400/10 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                      <BarChart3 className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  {/* Play button overlay for future video */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 bg-white/90 dark:bg-gray-900/90 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Play className="w-5 h-5 text-gray-900 dark:text-white ml-0.5" />
                    </div>
                  </div>
                  <Badge className="absolute top-4 right-4 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    Live Odds
                  </Badge>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      SmashBoard
                    </h3>
                    <p className="text-base font-medium text-muted-foreground mb-3">
                      Real-time Odds. Smash-Worthy Insights.
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Compare player props across sportsbooks with built-in EV analysis and smart filters. Your ultimate
                      command center for finding value.
                    </p>
                  </div>

                  <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-sm font-medium">Explore SmashBoard</span>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Hit Rate Tracker - Medium Feature */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-1 lg:row-span-1"
          >
            <Card className="group h-full bg-card/50 backdrop-blur-sm border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10 dark:hover:shadow-green-400/10 overflow-hidden">
              <CardContent className="p-0 h-full flex flex-col">
                {/* Image Placeholder */}
                <div className="relative aspect-square bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-400/10 dark:to-emerald-400/10">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <Badge className="absolute top-3 right-3 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs">
                    Data Driven
                  </Badge>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                      Hit Rate Tracker
                    </h3>
                    <p className="text-sm font-medium text-muted-foreground mb-2">How Hot Is That Player?</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Track player performance with full context and alternate lines.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Betslip Scanner - Medium Feature */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-1 lg:row-span-1"
          >
            <Card className="group h-full bg-card/50 backdrop-blur-sm border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 dark:hover:shadow-purple-400/10 overflow-hidden">
              <CardContent className="p-0 h-full flex flex-col">
                {/* Image Placeholder */}
                <div className="relative aspect-square bg-gradient-to-br from-purple-500/10 to-violet-500/10 dark:from-purple-400/10 dark:to-violet-400/10">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <Badge className="absolute top-3 right-3 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs">
                    AI Powered
                  </Badge>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      Betslip Scanner
                    </h3>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Scan Any Betslip. Find Better Odds.
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Upload screenshots and let AI extract bets, compare odds instantly.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Smart Betslip - Large Feature (spans 2 columns, 1 row) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-2 lg:row-span-1"
          >
            <Card className="group h-full bg-card/50 backdrop-blur-sm border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10 dark:hover:shadow-orange-400/10 overflow-hidden">
              <CardContent className="p-0 h-full flex flex-col lg:flex-row">
                {/* Image Placeholder */}
                <div className="relative aspect-[16/10] lg:aspect-square lg:w-48 bg-gradient-to-br from-orange-500/10 to-red-500/10 dark:from-orange-400/10 dark:to-red-400/10 flex-shrink-0">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                      <ShoppingCart className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <Badge className="absolute top-3 right-3 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 text-xs">
                    Smart Builder
                  </Badge>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      Smart Betslip
                    </h3>
                    <p className="text-base font-medium text-muted-foreground mb-3">
                      Build Your Bets. Boost Your Edge.
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Cart-style builder that compares legs and parlays across all sportsbooks for maximum payout.
                    </p>
                  </div>

                  <div className="mt-4 flex items-center text-orange-600 dark:text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-sm font-medium">Try Smart Betslip</span>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 mb-12 sm:mb-16"
        >
          {[
            { label: "Sportsbooks", value: "15+", icon: BarChart3 },
            { label: "Markets Tracked", value: "50+", icon: Target },
            { label: "Daily Scans", value: "1000+", icon: Camera },
            { label: "Active Users", value: "10K+", icon: TrendingUp },
          ].map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium">{stat.label}</div>
              </div>
            )
          })}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-2xl p-6 sm:p-8 border border-blue-200/50 dark:border-blue-800/30">
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3">Ready to explore all features?</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Dive deeper into each tool and see how they work together to give you the ultimate betting advantage.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Link href="/features">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 sm:px-8"
                >
                  Explore All Features
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button variant="outline" size="lg" className="px-6 sm:px-8 bg-transparent">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
