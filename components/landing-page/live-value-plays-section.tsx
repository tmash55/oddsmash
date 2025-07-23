"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, TrendingUp, Pause, Play, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import Image from "next/image"

// Type definition for value play data
interface ValuePlay {
  sport: string
  player_id: number
  description: string
  team: string
  market: string
  side: string
  line: string
  avg_odds: number
  ev: number
  avg_decimal: number
  value_pct: number
  best_book: string
  best_price: number
  event_id: string
  commence_time: string
  sources: {
    [key: string]: {
      sid: string
      link: string | null
      price: number
    }
  }
}

const formatOdds = (price: number) => {
  return price >= 100 ? `+${price}` : `${price}`
}

const getSportIcon = (sport: string) => {
  const icons = {
    mlb: "⚾",
    nba: "🏀",
    nfl: "🏈",
    nhl: "🏒",
    wnba: "🏀",
  }
  return icons[sport as keyof typeof icons] || "🏆"
}

const getBookColor = (book: string) => {
  const colors = {
    fanduel: "from-blue-500 to-blue-600",
    draftkings: "from-orange-500 to-red-500",
    "hard rock bet": "from-gray-700 to-gray-800",
    caesars: "from-yellow-500 to-yellow-600",
    betmgm: "from-green-500 to-green-600",
    fanatics: "from-purple-500 to-purple-600",
    "espn bet": "from-red-500 to-red-600",
    novig: "from-blue-400 to-blue-500",
    pinnacle: "from-gray-600 to-gray-700",
    "bally bet": "from-red-600 to-red-700",
    betrivers: "from-orange-600 to-red-600",
  }
  return colors[book as keyof typeof colors] || "from-gray-500 to-gray-600"
}

const getBookLogo = (book: string) => {
  const logos = {
    fanduel: "/images/sports-books/fanduel.png",
    draftkings: "/images/sports-books/draftkings.png",
    "hard rock bet": "/images/sports-books/hardrockbet.png",
    caesars: "/images/sports-books/caesars.png",
    betmgm: "/images/sports-books/betmgm.png",
    fanatics: "/images/sports-books/fanatics.png",
    "espn bet": "/images/sports-books/espnbet.png",
    novig: "/images/sports-books/novig.png",
    pinnacle: "/images/sports-books/pinnacle.png",
    "bally bet": "/images/sports-books/ballybet.png",
    betrivers: "/images/sports-books/betrivers.png",
  }
  return logos[book.toLowerCase() as keyof typeof logos] || null
}

// Format market display: "Over 0.5 Doubles" instead of "Doubles Over 0.5"
const formatMarketDisplay = (market: string, side: string, line: string) => {
  const capitalizedSide = side.charAt(0).toUpperCase() + side.slice(1).toLowerCase()
  return `${capitalizedSide} ${line} ${market}`
}

export function LiveValuePlaysSection() {
  const [isPaused, setIsPaused] = useState(false)
  const [valuePlays, setValuePlays] = useState<ValuePlay[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentMobileIndex, setCurrentMobileIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  // Auto-rotate for mobile
  useEffect(() => {
    if (!isMobile || valuePlays.length === 0) return

    const interval = setInterval(() => {
      setCurrentMobileIndex((prev) => (prev + 1) % valuePlays.length)
    }, 5000) // Change card every 5 seconds

    return () => clearInterval(interval)
  }, [isMobile, valuePlays.length])

  useEffect(() => {
    const fetchValuePlays = async () => {
      try {
        setError(null)
        const response = await fetch("/api/landing/top-ev")
        if (!response.ok) {
          throw new Error("Failed to fetch value plays")
        }
        const { data } = await response.json()
        if (Array.isArray(data)) {
          setValuePlays(data)
        }
      } catch (error) {
        console.error("Error fetching value plays:", error)
        setError(error instanceof Error ? error.message : "Failed to fetch value plays")
      } finally {
        setIsLoading(false)
      }
    }

    fetchValuePlays()
    // Refresh data every 60 seconds
    const interval = setInterval(fetchValuePlays, 60000)
    return () => clearInterval(interval)
  }, [])

  // Triple the plays for seamless infinite scroll
  const triplePlaysList = [...valuePlays, ...valuePlays, ...valuePlays]

  const nextMobileCard = () => {
    setCurrentMobileIndex((prev) => (prev + 1) % valuePlays.length)
  }

  const prevMobileCard = () => {
    setCurrentMobileIndex((prev) => (prev - 1 + valuePlays.length) % valuePlays.length)
  }

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-br from-green-50/30 via-background to-blue-50/30 dark:from-green-950/10 dark:via-background dark:to-blue-950/10 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5" />
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-green-500/10 dark:bg-green-400/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-500/10 dark:bg-blue-400/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16"
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </motion.div>
            <Badge
              variant="secondary"
              className="bg-gradient-to-r from-green-100 to-blue-100 text-green-700 dark:from-green-900/30 dark:to-blue-900/30 dark:text-green-300 border-0"
            >
              Live Updates
            </Badge>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4">
            <span className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">
              Live Value Plays
            </span>
          </h2>
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto">
            Odds that beat the market right now
          </p>
        </motion.div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12 text-red-500">{error}</div>
      ) : valuePlays.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          No value plays available at the moment
        </div>
      ) : (
        <>
          {/* Desktop View - Horizontal Scroll */}
          <div className="relative overflow-hidden mb-12 hidden md:block">
            {/* Gradient overlays */}
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background via-background/80 to-transparent z-10" />

            {/* Pause/Play Control */}
            <div className="absolute top-4 right-4 z-20">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="w-10 h-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 border border-border/50"
              >
                {isPaused ? (
                  <Play className="w-4 h-4 text-gray-700 dark:text-gray-300 ml-0.5" />
                ) : (
                  <Pause className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                )}
              </button>
            </div>

            {/* Scrolling container */}
            <div className="flex overflow-hidden py-8">
              <motion.div
                className="flex gap-6 items-center"
                animate={
                  isPaused
                    ? {}
                    : {
                        x: [0, -100 * valuePlays.length - 6 * valuePlays.length],
                      }
                }
                transition={{
                  x: {
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "loop",
                    duration: 35,
                    ease: "linear",
                  },
                }}
              >
                {triplePlaysList.map((play, index) => (
                  <motion.div
                    key={`${play.player_id}-${play.market}-${index}`}
                    className="flex-shrink-0 w-80 group cursor-pointer"
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="group relative flex h-full w-80 flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-xl border border-border/30 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-green-500/30">
                      {/* Main Content */}
                      <div className="p-6 flex flex-col h-full">
                        {/* Header with Value Badge - Repositioned */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                            <div className="h-10 w-10 rounded-lg bg-muted/30 flex items-center justify-center text-lg opacity-70 flex-shrink-0">
                              {getSportIcon(play.sport)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-foreground text-lg truncate">{play.description}</div>
                              <div className="text-sm text-muted-foreground truncate">{play.team}</div>
                            </div>
                          </div>
                          {/* Value Badge - Now positioned to not overlap */}
                          <div className="flex-shrink-0">
                            <Badge className="font-bold text-lg px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg border-0">
                              +{Math.round(play.value_pct)}%
                            </Badge>
                          </div>
                        </div>

                        {/* Market - Updated Format */}
                        <div className="text-sm text-muted-foreground mb-6 opacity-80">
                          {formatMarketDisplay(play.market, play.side, play.line)}
                        </div>

                        {/* Price - Primary Focus */}
                        <div className="mb-6 flex-1 flex items-center gap-3">
                          <div className="text-4xl font-black text-foreground">{formatOdds(play.best_price)}</div>
                          {getBookLogo(play.best_book) ? (
                            <div className="relative h-8 w-24">
                              <Image
                                src={getBookLogo(play.best_book)! || "/placeholder.svg"}
                                alt={play.best_book}
                                fill
                                className="object-contain opacity-80"
                              />
                            </div>
                          ) : (
                            <span className="text-sm font-medium text-muted-foreground">{play.best_book}</span>
                          )}
                        </div>

                        {/* Enhanced Odds Comparison */}
                        <div className="mt-auto pt-4 border-t border-border/20">
                          {/* Remove logo from here since it's now by the odds */}
                          <div className="flex items-center justify-center gap-3 bg-muted/20 rounded-lg p-3">
                            <div className="text-center">
                              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                {formatOdds(play.best_price)}
                              </div>
                              <div className="text-xs text-muted-foreground">Best</div>
                            </div>
                            <div className="text-muted-foreground font-bold text-sm">VS</div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-muted-foreground">
                                {formatOdds(Math.round(play.avg_odds))}
                              </div>
                              <div className="text-xs text-muted-foreground">Avg</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>

          {/* Mobile View - Swipeable Cards */}
          <div className="md:hidden mb-12 px-4">
            <div className="relative">
              {/* Card Container */}
              <div className="overflow-hidden rounded-2xl h-80">
                <AnimatePresence mode="wait">
                  {valuePlays.length > 0 && (
                    <motion.div
                      key={currentMobileIndex}
                      initial={{ x: 300, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -300, opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                        duration: 0.5,
                      }}
                      className="absolute inset-0 w-full"
                    >
                      <div className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-xl border border-border/30 shadow-lg">
                        <div className="p-6 flex flex-col h-full">
                          {/* Header with Value Badge - Mobile */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                              <div className="h-12 w-12 rounded-xl bg-muted/30 flex items-center justify-center text-xl opacity-70 flex-shrink-0">
                                {getSportIcon(valuePlays[currentMobileIndex].sport)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-foreground text-xl truncate">
                                  {valuePlays[currentMobileIndex].description}
                                </div>
                                <div className="text-sm text-muted-foreground truncate">
                                  {valuePlays[currentMobileIndex].team}
                                </div>
                              </div>
                            </div>
                            {/* Value Badge - Mobile */}
                            <div className="flex-shrink-0">
                              <Badge className="font-bold text-xl px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-xl border-0">
                                +{Math.round(valuePlays[currentMobileIndex].value_pct)}%
                              </Badge>
                            </div>
                          </div>

                          {/* Market - Mobile */}
                          <div className="text-sm text-muted-foreground mb-6 opacity-80">
                            {formatMarketDisplay(
                              valuePlays[currentMobileIndex].market,
                              valuePlays[currentMobileIndex].side,
                              valuePlays[currentMobileIndex].line,
                            )}
                          </div>

                          {/* Price - Main Focus Mobile */}
                          <div className="mb-6 flex-1 flex items-center justify-center gap-4">
                            <div className="text-5xl font-black text-foreground">
                              {formatOdds(valuePlays[currentMobileIndex].best_price)}
                            </div>
                            {getBookLogo(valuePlays[currentMobileIndex].best_book) ? (
                              <div className="relative h-8 w-24">
                                <Image
                                  src={getBookLogo(valuePlays[currentMobileIndex].best_book)! || "/placeholder.svg"}
                                  alt={valuePlays[currentMobileIndex].best_book}
                                  fill
                                  className="object-contain opacity-80"
                                />
                              </div>
                            ) : (
                              <span className="text-sm font-medium text-muted-foreground">
                                {valuePlays[currentMobileIndex].best_book}
                              </span>
                            )}
                          </div>

                          {/* Enhanced Odds Comparison - Mobile */}
                          <div className="mt-auto pt-4 border-t border-border/20">
                            {/* Remove logo section since it's now by the odds */}
                            <div className="flex items-center justify-center gap-4 bg-muted/20 rounded-lg p-4">
                              <div className="text-center">
                                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                                  {formatOdds(valuePlays[currentMobileIndex].best_price)}
                                </div>
                                <div className="text-xs text-muted-foreground">Best</div>
                              </div>
                              <div className="text-muted-foreground font-bold text-lg">VS</div>
                              <div className="text-center">
                                <div className="text-xl font-bold text-muted-foreground">
                                  {formatOdds(Math.round(valuePlays[currentMobileIndex].avg_odds))}
                                </div>
                                <div className="text-xs text-muted-foreground">Avg</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Navigation Controls */}
              <div className="flex justify-between mt-4">
                <motion.button
                  onClick={prevMobileCard}
                  className="w-10 h-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 border border-border/50"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </motion.button>

                {/* Indicators */}
                <div className="flex items-center gap-2">
                  {valuePlays.slice(0, 5).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentMobileIndex(idx)}
                      className={`rounded-full transition-all duration-200 ${
                        idx === currentMobileIndex
                          ? "w-3 h-3 bg-orange-500"
                          : "w-2 h-2 bg-muted hover:bg-muted-foreground/30"
                      }`}
                    />
                  ))}
                  {valuePlays.length > 5 && (
                    <span className="text-xs text-muted-foreground">+{valuePlays.length - 5}</span>
                  )}
                </div>

                <motion.button
                  onClick={nextMobileCard}
                  className="w-10 h-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 border border-border/50"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </motion.button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bottom CTA */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center"
        >
          <Button
            size="lg"
            className="group h-14 rounded-2xl bg-gradient-to-r from-green-600 to-blue-600 px-8 sm:px-10 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:from-green-700 hover:to-blue-700"
            asChild
          >
            <Link href="/mlb/odds/player-props?market=home+runs">
              <TrendingUp className="mr-2 h-5 w-5" />
              View the Smash Screen
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
