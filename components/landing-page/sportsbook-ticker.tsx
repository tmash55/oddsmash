"use client"

import { motion } from "framer-motion"
import Image from "next/image"

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

export function SportsbookTicker() {
  // Calculate the width of one complete set
  const logoWidth = 128 // w-32 = 128px
  const gapWidth = 48 // gap-12 = 48px
  const totalWidth = sportsbooks.length * (logoWidth + gapWidth)

  // Create enough copies to ensure seamless loop
  const extendedLogos = [...sportsbooks, ...sportsbooks, ...sportsbooks, ...sportsbooks]

  return (
    <section className="py-12 bg-gradient-to-br from-muted/10 via-background to-muted/10 border-y border-border/50">
      <div className="container px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Supported Sportsbooks
          </p>
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Compare odds across{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              10+ platforms
            </span>
          </h3>
          <p className="text-muted-foreground">All major sportsbooks in one place</p>
        </div>
      </div>

      {/* Full-width scrolling section */}
      <div className="relative overflow-hidden">
        {/* Subtle gradient overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background via-background/80 to-transparent z-10" />

        {/* Scrolling container */}
        <div className="flex overflow-hidden py-8">
          <motion.div
            className="flex gap-12 items-center"
            animate={{
              x: [-totalWidth, 0],
            }}
            transition={{
              x: {
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
                duration: 30,
                ease: "linear",
              },
            }}
            style={{
              width: `${totalWidth * 4}px`, // Ensure container is wide enough
            }}
          >
            {extendedLogos.map((sportsbook, index) => (
              <motion.div
                key={`${sportsbook.name}-${index}`}
                className="flex-shrink-0 w-32 h-16 relative group cursor-pointer"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-full h-full relative bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-border/50 p-3 group-hover:shadow-lg group-hover:border-border transition-all duration-300">
                  <Image
                    src={sportsbook.logo || "/placeholder.svg"}
                    alt={`${sportsbook.name} logo`}
                    fill
                    className="object-contain p-1"
                    sizes="128px"
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="container px-4 md:px-6 mt-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">More sportsbooks added regularly</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">Live odds comparison</span>
          </div>
        </div>
      </div>
    </section>
  )
}
