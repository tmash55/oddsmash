"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, TrendingUp, Pause, Play, ChevronLeft, ChevronRight, Zap } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import Image from "next/image"

// Sportsbook data
const sportsbooks = [
  { name: "DraftKings", logo: "/images/sports-books/draftkings.png" },
  { name: "FanDuel", logo: "/images/sports-books/fanduel.png" },
  { name: "BetMGM", logo: "/images/sports-books/betmgm.png" },
  { name: "BetRivers", logo: "/images/sports-books/betrivers.png" },
  { name: "Caesars", logo: "/images/sports-books/caesars.png" },
  { name: "BallyBet", logo: "/images/sports-books/ballybet.png" },
  { name: "ESPN Bet", logo: "/images/sports-books/espnbet.png" },
  { name: "Fanatics", logo: "/images/sports-books/fanatics.png" },
  { name: "Hard Rock Bet", logo: "/images/sports-books/hardrockbet.png" },
  { name: "NoVig", logo: "/images/sports-books/novig.png" },
  { name: "Pinnacle", logo: "/images/sports-books/pinnacle.png" },
]

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
  avg_american: number
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

const formatMarketDisplay = (market: string, side: string, line: string) => {
  const capitalizedSide = side.charAt(0).toUpperCase() + side.slice(1).toLowerCase()
  return `${capitalizedSide} ${line} ${market}`
}

export function LiveValueShowcase() {
  const [isPaused, setIsPaused] = useState(false)
  const [valuePlays, setValuePlays] = useState<ValuePlay[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentMobileIndex, setCurrentMobileIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Auto-rotate for mobile
  useEffect(() => {
    if (!isMobile || valuePlays.length === 0) return

    const interval = setInterval(() => {
      setCurrentMobileIndex((prev) => (prev + 1) % valuePlays.length)
    }, 4000)

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
          setLastUpdated(new Date())
        }
      } catch (error) {
        console.error("Error fetching value plays:", error)
        setError(error instanceof Error ? error.message : "Failed to fetch value plays")
      } finally {
        setIsLoading(false)
      }
    }

    fetchValuePlays()
    const interval = setInterval(fetchValuePlays, 1800000) // Update every 30 minutes
    return () => clearInterval(interval)
  }, [])

  // Extended arrays for seamless scrolling
  const extendedSportsbooks = [...sportsbooks, ...sportsbooks, ...sportsbooks, ...sportsbooks]
  const extendedValuePlays = [...valuePlays, ...valuePlays, ...valuePlays, ...valuePlays, ...valuePlays]

  const nextMobileCard = () => {
    setCurrentMobileIndex((prev) => (prev + 1) % valuePlays.length)
  }

  const prevMobileCard = () => {
    setCurrentMobileIndex((prev) => (prev - 1 + valuePlays.length) % valuePlays.length)
  }

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-br from-emerald-50/50 via-background to-blue-50/30 dark:from-emerald-950/20 dark:via-background dark:to-blue-950/10 relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-400/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-500/10 dark:bg-blue-400/5 rounded-full blur-3xl" />

      {/* Floating elements for visual interest */}
      <motion.div
        className="absolute top-20 left-10 w-4 h-4 bg-emerald-400 rounded-full opacity-20"
        animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-40 right-20 w-3 h-3 bg-blue-400 rounded-full opacity-30"
        animate={{ y: [0, 15, 0], x: [0, -15, 0] }}
        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 2 }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              <Zap className="w-6 h-6 text-emerald-500" />
            </motion.div>
            <Badge
              variant="secondary"
              className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 dark:from-emerald-900/30 dark:to-teal-900/30 dark:text-emerald-400 border-0 text-sm font-semibold px-4 py-2"
            >
              Live Market Data
            </Badge>
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}>
              <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-lg"></div>
            </motion.div>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            <span className="bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Live Value Plays
            </span>
          </h2>

          <p className="text-xl sm:text-2xl text-muted-foreground max-w-4xl mx-auto mb-4">
            Real odds that beat the market across{" "}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">10+ sportsbooks</span>
          </p>

          {/* Live update indicator */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              className="w-2 h-2 bg-emerald-500 rounded-full"
            />
            <span>Updated {Math.floor((Date.now() - lastUpdated.getTime()) / 1000)}s ago</span>
          </div>
        </motion.div>
      </div>

      {/* Sportsbooks Ticker - Top */}
      <div className="relative overflow-hidden mb-12 -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background via-background/80 to-transparent z-10" />

        <div className="flex overflow-hidden py-4">
          <motion.div
            className="flex gap-8 items-center"
            animate={
              isPaused
                ? {}
                : {
                    x: [`-${sportsbooks.length * 160}px`, 0], // Moving right to left
                  }
            }
            transition={{
              x: {
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
                duration: 25, // Faster for sportsbooks
                ease: "linear",
              },
            }}
          >
            {extendedSportsbooks.map((sportsbook, index) => (
              <motion.div
                key={`${sportsbook.name}-${index}`}
                className="flex-shrink-0 w-24 h-12 relative group cursor-pointer"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-full h-full relative bg-white/80 dark:bg-gray-900/80 rounded-lg shadow-sm border border-border/30 p-2 group-hover:shadow-md group-hover:border-border/60 transition-all duration-300 backdrop-blur-sm">
                  <Image
                    src={sportsbook.logo || "/placeholder.svg"}
                    alt={`${sportsbook.name} logo`}
                    fill
                    className="object-contain p-1 opacity-80 group-hover:opacity-100 transition-opacity"
                    sizes="96px"
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full mb-4"
          />
          <p className="text-muted-foreground">Loading live value plays...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12 text-red-500">{error}</div>
      ) : valuePlays.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          No value plays available at the moment
        </div>
      ) : (
        <>
          {/* Desktop View - Value Plays Scrolling Opposite Direction */}
          <div className="relative overflow-hidden mb-12 hidden md:block -mx-4 sm:-mx-6 lg:-mx-8">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background via-background/80 to-transparent z-10" />

            {/* Enhanced Pause/Play Control */}
            <div className="absolute top-4 right-4 z-20">
              <motion.button
                onClick={() => setIsPaused(!isPaused)}
                className="w-12 h-12 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 border border-border/50 group"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {isPaused ? (
                  <Play className="w-5 h-5 text-gray-700 dark:text-gray-300 ml-0.5 group-hover:text-emerald-600" />
                ) : (
                  <Pause className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-emerald-600" />
                )}
              </motion.button>
            </div>

            {/* Value Plays Scrolling Container */}
            <div className="flex overflow-hidden py-8">
              <motion.div
                className="flex gap-6 items-center"
                animate={
                  isPaused
                    ? {}
                    : {
                        x: [0, `-${100 / 3}%`], // Moving left to right (opposite direction)
                      }
                }
                transition={{
                  x: {
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "loop",
                    duration: 60, // Slower for value plays
                    ease: "linear",
                  },
                }}
              >
                {extendedValuePlays.map((play, index) => (
                  <motion.div
                    key={`${play.player_id}-${play.market}-${index}`}
                    className="flex-shrink-0 w-80 group cursor-pointer"
                    whileHover={{ scale: 1.03, y: -4 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <div className="group relative flex h-full w-80 flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-xl border border-border/30 shadow-lg transition-all duration-300 hover:shadow-2xl hover:border-emerald-300/50 hover:bg-gradient-to-br hover:from-emerald-50/10 hover:to-card/90">
                      {/* Subtle glow effect on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-blue-500/0 group-hover:from-emerald-500/5 group-hover:to-blue-500/5 transition-all duration-300 rounded-2xl" />

                      <div className="p-6 flex flex-col h-full relative z-10">
                        {/* Header with Enhanced Value Badge */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                            <div className="h-10 w-10 rounded-lg bg-muted/30 flex items-center justify-center text-lg opacity-70 flex-shrink-0 group-hover:bg-emerald-100/50 transition-colors">
                              {getSportIcon(play.sport)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-foreground text-lg truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                                {play.description}
                              </div>
                              <div className="text-sm text-muted-foreground truncate">{play.team}</div>
                            </div>
                          </div>
                          <motion.div className="flex-shrink-0" whileHover={{ scale: 1.1 }}>
                            <Badge className="font-bold text-lg px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg border-0 group-hover:from-emerald-400 group-hover:to-teal-500 transition-all">
                              +{Math.round(play.value_pct)}%
                            </Badge>
                          </motion.div>
                        </div>

                        {/* Market */}
                        <div className="text-sm text-muted-foreground mb-6 opacity-80">
                          {formatMarketDisplay(play.market, play.side, play.line)}
                        </div>

                        {/* Enhanced Price Display */}
                        <div className="mb-6 flex-1 flex items-center justify-center gap-3">
                          <div className="text-4xl font-black text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {formatOdds(play.best_price)}
                          </div>
                          {getBookLogo(play.best_book) ? (
                            <div className="relative h-8 w-24 opacity-80 group-hover:opacity-100 transition-opacity">
                              <Image
                                src={getBookLogo(play.best_book)! || "/placeholder.svg"}
                                alt={play.best_book}
                                fill
                                className="object-contain"
                              />
                            </div>
                          ) : (
                            <span className="text-sm font-medium text-muted-foreground">{play.best_book}</span>
                          )}
                        </div>

                        {/* Enhanced Odds Comparison */}
                        <div className="mt-auto pt-4 border-t border-border/20">
                          <div className="flex items-center justify-center gap-3 bg-muted/20 group-hover:bg-emerald-50/30 dark:group-hover:bg-emerald-950/20 rounded-lg p-3 transition-colors">
                            <div className="text-center">
                              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                {formatOdds(play.best_price)}
                              </div>
                              <div className="text-xs text-muted-foreground">Best</div>
                            </div>
                            <div className="text-muted-foreground font-bold text-sm">VS</div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-muted-foreground">
                                {formatOdds(Math.round(play.avg_american))}
                              </div>
                              <div className="text-xs text-muted-foreground">Average</div>
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

          {/* Mobile View - Enhanced Swipeable Cards */}
          <div className="md:hidden mb-12 px-4">
            <div className="relative">
              <div className="overflow-hidden rounded-2xl h-96">
                <AnimatePresence mode="wait">
                  {valuePlays.length > 0 && (
                    <motion.div
                      key={currentMobileIndex}
                      initial={{ x: 300, opacity: 0, scale: 0.9 }}
                      animate={{ x: 0, opacity: 1, scale: 1 }}
                      exit={{ x: -300, opacity: 0, scale: 0.9 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                        duration: 0.6,
                      }}
                      className="absolute inset-0 w-full"
                    >
                      <div className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-xl border border-border/30 shadow-xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5" />

                        <div className="p-6 flex flex-col h-full relative z-10">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                              <div className="h-12 w-12 rounded-xl bg-emerald-100/50 dark:bg-emerald-900/30 flex items-center justify-center text-xl flex-shrink-0">
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
                            <motion.div
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                            >
                              <Badge className="font-bold text-xl px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl border-0">
                                +{Math.round(valuePlays[currentMobileIndex].value_pct)}%
                              </Badge>
                            </motion.div>
                          </div>

                          <div className="text-sm text-muted-foreground mb-6 opacity-80">
                            {formatMarketDisplay(
                              valuePlays[currentMobileIndex].market,
                              valuePlays[currentMobileIndex].side,
                              valuePlays[currentMobileIndex].line,
                            )}
                          </div>

                          <div className="mb-6 flex-1 flex flex-col items-center justify-center gap-4">
                            <div className="text-5xl font-black text-emerald-600 dark:text-emerald-400">
                              {formatOdds(valuePlays[currentMobileIndex].best_price)}
                            </div>
                            {getBookLogo(valuePlays[currentMobileIndex].best_book) ? (
                              <div className="relative h-8 w-24">
                                <Image
                                  src={getBookLogo(valuePlays[currentMobileIndex].best_book)! || "/placeholder.svg"}
                                  alt={valuePlays[currentMobileIndex].best_book}
                                  fill
                                  className="object-contain"
                                />
                              </div>
                            ) : (
                              <span className="text-sm font-medium text-muted-foreground">
                                {valuePlays[currentMobileIndex].best_book}
                              </span>
                            )}
                          </div>

                          <div className="mt-auto pt-4 border-t border-border/20">
                            <div className="flex items-center justify-center gap-4 bg-emerald-50/30 dark:bg-emerald-950/20 rounded-lg p-4">
                              <div className="text-center">
                                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                  {formatOdds(valuePlays[currentMobileIndex].best_price)}
                                </div>
                                <div className="text-xs text-muted-foreground">Best</div>
                              </div>
                              <div className="text-muted-foreground font-bold text-lg">VS</div>
                              <div className="text-center">
                                <div className="text-xl font-bold text-muted-foreground">
                                  {formatOdds(Math.round(valuePlays[currentMobileIndex].avg_american))}
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

              {/* Enhanced Navigation Controls */}
              <div className="flex justify-between items-center mt-6">
                <motion.button
                  onClick={prevMobileCard}
                  className="w-12 h-12 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 border border-border/50"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </motion.button>

                <div className="flex items-center gap-2">
                  {valuePlays.slice(0, 5).map((_, idx) => (
                    <motion.button
                      key={idx}
                      onClick={() => setCurrentMobileIndex(idx)}
                      className={`rounded-full transition-all duration-200 ${
                        idx === currentMobileIndex
                          ? "w-4 h-4 bg-emerald-500"
                          : "w-3 h-3 bg-muted hover:bg-muted-foreground/30"
                      }`}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    />
                  ))}
                  {valuePlays.length > 5 && (
                    <span className="text-xs text-muted-foreground ml-2">+{valuePlays.length - 5}</span>
                  )}
                </div>

                <motion.button
                  onClick={nextMobileCard}
                  className="w-12 h-12 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 border border-border/50"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ChevronRight className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </motion.button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Enhanced Bottom CTA */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-30">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center"
        >
          <div className="mb-6">
            <p className="text-lg text-muted-foreground mb-2">Join our exclusive founders beta</p>
            <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                className="w-2 h-2 bg-emerald-500 rounded-full"
              />
              <span className="font-medium">Help shape the future of sports betting</span>
            </div>
          </div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="lg"
              className="group h-16 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-700 hover:via-emerald-600 hover:to-teal-700 px-10 sm:px-12 text-lg font-bold text-white shadow-xl transition-all duration-300 hover:shadow-2xl relative overflow-hidden"
              asChild
            >
              <Link href="/mlb/odds/player-props?market=home+runs" className="relative z-10">
                <TrendingUp className="mr-3 h-6 w-6" />
                Start Finding Value Plays
                <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-1" />
                {/* Animated background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
              </Link>
            </Button>
          </motion.div>

          <p className="text-sm text-muted-foreground mt-4">Free founders access • Shape the platform</p>
        </motion.div>
      </div>
    </section>
  )
}
