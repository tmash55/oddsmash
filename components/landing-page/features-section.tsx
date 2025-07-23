"use client"

import React from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  BarChart3,
  Target,
  Camera,
  ShoppingCart,
  Zap,
  Upload,
  Scan,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Grid3X3,
  Table,
} from "lucide-react"

const features = [
  {
    id: "smashboard",
    icon: BarChart3,
    title: "SmashBoard",
    subtitle: "Real-time Odds. Smash-Worthy Insights.",
    description: "Compare player props across sportsbooks with built-in EV analysis and smart filters.",
    badge: "Live Odds",
    color: "from-blue-500 to-cyan-500",
    size: "large",
    hasAnimation: true,
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
    hasAnimation: true,
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
    hasAnimation: true,
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
    hasAnimation: true,
    imageAspect: "aspect-[16/10]",
  },
]

// Enhanced SmashBoard Animation - Table and Card Views
const SmashBoardAnimation = () => {
  const [currentView, setCurrentView] = React.useState(0) // 0 = table, 1 = cards
  const [currentPage, setCurrentPage] = React.useState(0)
  const [isMobile, setIsMobile] = React.useState(false)

  const players = [
    {
      name: "Aaron Judge",
      team: "NYY",
      time: "6:08 PM",
      opponent: "vs TOR",
      avatar: "👨🏻",
      teamLogo: "⚾",
      lines: {
        over: {
          line: "O 0.5",
          bestOdds: "+260",
          avgOdds: "+230",
          value: "+9.1%",
          valueColor: "text-green-400",
          bestBook: "Bally Bet",
        },
        under: {
          line: "U -258",
          bestOdds: "U -290",
          avgOdds: "U",
          value: "+3.2%",
          valueColor: "text-green-400",
          bestBook: "Novig",
        },
      },
      books: [
        { name: "DK", over: "+230", under: "-", logo: "🟠" },
        { name: "FD", over: "+220", under: "-", logo: "🔵" },
        { name: "MG", over: "+250", under: "-300", logo: "🟢" },
        { name: "CS", over: "+245", under: "-", logo: "🟡" },
        { name: "BR", over: "+210", under: "-", logo: "🟣" },
        { name: "BB", over: "+260", under: "-275", logo: "🔴" },
      ],
    },
    {
      name: "Abraham Toro",
      team: "BOS",
      time: "6:06 PM",
      opponent: "vs PHI",
      avatar: "👨🏽",
      teamLogo: "⚾",
      lines: {
        over: {
          line: "O 0.5",
          bestOdds: "+850",
          avgOdds: "+689",
          value: "+20.5%",
          valueColor: "text-emerald-400",
          bestBook: "BetMGM",
        },
        under: {
          line: "U -1270",
          bestOdds: "U -1411",
          avgOdds: "U",
          value: "+0.7%",
          valueColor: "text-green-400",
          bestBook: "Novig",
        },
      },
      books: [
        { name: "DK", over: "+650", under: "-", logo: "🟠" },
        { name: "FD", over: "+800", under: "-1600", logo: "🔵" },
        { name: "MG", over: "+850", under: "-", logo: "🟢" },
        { name: "CS", over: "+550", under: "-", logo: "🟡" },
        { name: "BR", over: "+600", under: "-1400", logo: "🟣" },
        { name: "BB", over: "+680", under: "-", logo: "🔴" },
      ],
    },
    {
      name: "Adael Amador",
      team: "COL",
      time: "2:11 PM",
      opponent: "vs STL",
      avatar: "👨🏽",
      teamLogo: "⚾",
      lines: {
        over: {
          line: "O 0.5",
          bestOdds: "+1200",
          avgOdds: "+915",
          value: "+28.1%",
          valueColor: "text-emerald-400",
          bestBook: "DraftKings",
        },
        under: {
          line: "U -2000",
          bestOdds: "U -2277",
          avgOdds: "U",
          value: "+0.6%",
          valueColor: "text-green-400",
          bestBook: "BetMGM",
        },
      },
      books: [
        { name: "DK", over: "+1200", under: "-", logo: "🟠" },
        { name: "FD", over: "+900", under: "-", logo: "🔵" },
        { name: "MG", over: "+950", under: "-2000", logo: "🟢" },
        { name: "CS", over: "+750", under: "-", logo: "🟡" },
        { name: "BR", over: "+900", under: "-2800", logo: "🟣" },
        { name: "BB", over: "+1000", under: "-", logo: "🔴" },
      ],
    },
    {
      name: "Adam Frazier",
      team: "PIT",
      time: "1:21 PM",
      opponent: "vs CHC",
      avatar: "👨🏻",
      teamLogo: "⚾",
      lines: {
        over: {
          line: "O 0.5",
          bestOdds: "+900",
          avgOdds: "+765",
          value: "+15.5%",
          valueColor: "text-green-400",
          bestBook: "FanDuel",
        },
        under: {
          line: "U -1289",
          bestOdds: "U -1666",
          avgOdds: "U",
          value: "+1.7%",
          valueColor: "text-green-400",
          bestBook: "Novig",
        },
      },
      books: [
        { name: "DK", over: "+650", under: "-", logo: "🟠" },
        { name: "FD", over: "+900", under: "-1600", logo: "🔵" },
        { name: "MG", over: "+825", under: "-", logo: "🟢" },
        { name: "CS", over: "+700", under: "-", logo: "🟡" },
        { name: "BR", over: "+800", under: "-2500", logo: "🟣" },
        { name: "BB", over: "+900", under: "-", logo: "🔴" },
      ],
    },
    {
      name: "Addison Barger",
      team: "TOR",
      time: "6:08 PM",
      opponent: "vs NYY",
      avatar: "👨🏻",
      teamLogo: "⚾",
      lines: {
        over: {
          line: "O 0.5",
          bestOdds: "+500",
          avgOdds: "+500",
          value: "0%",
          valueColor: "text-gray-400",
          bestBook: "FanDuel",
        },
        under: { line: "U -", bestOdds: "U -", avgOdds: "U", value: "0%", valueColor: "text-gray-400", bestBook: "-" },
      },
      books: [
        { name: "DK", over: "-", under: "-", logo: "🟠" },
        { name: "FD", over: "+500", under: "-", logo: "🔵" },
        { name: "MG", over: "-", under: "-", logo: "🟢" },
        { name: "CS", over: "-", under: "-", logo: "🟡" },
        { name: "BR", over: "-", under: "-", logo: "🟣" },
        { name: "BB", over: "-", under: "-", logo: "🔴" },
      ],
    },
    {
      name: "Adolis Garcia",
      team: "TEX",
      time: "7:05 PM",
      opponent: "vs OAK",
      avatar: "👨🏽",
      teamLogo: "⚾",
      lines: {
        over: {
          line: "O 0.5",
          bestOdds: "+390",
          avgOdds: "+347",
          value: "+9.5%",
          valueColor: "text-green-400",
          bestBook: "FanDuel",
        },
        under: {
          line: "U -450",
          bestOdds: "U -533",
          avgOdds: "U",
          value: "+2.9%",
          valueColor: "text-green-400",
          bestBook: "BetMGM",
        },
      },
      books: [
        { name: "DK", over: "+310", under: "-", logo: "🟠" },
        { name: "FD", over: "+390", under: "-", logo: "🔵" },
        { name: "MG", over: "+350", under: "-450", logo: "🟢" },
        { name: "CS", over: "+360", under: "-", logo: "🟡" },
        { name: "BR", over: "+390", under: "-600", logo: "🟣" },
        { name: "BB", over: "+375", under: "-", logo: "🔴" },
      ],
    },
    {
      name: "Alec Burleson",
      team: "STL",
      time: "2:11 PM",
      opponent: "vs COL",
      avatar: "👨🏻",
      teamLogo: "⚾",
      lines: {
        over: {
          line: "O 0.5",
          bestOdds: "+326",
          avgOdds: "+290",
          value: "+9.1%",
          valueColor: "text-green-400",
          bestBook: "FanDuel",
        },
        under: {
          line: "U -375",
          bestOdds: "U -424",
          avgOdds: "U",
          value: "+2.5%",
          valueColor: "text-green-400",
          bestBook: "BetMGM",
        },
      },
      books: [
        { name: "DK", over: "+285", under: "-", logo: "🟠" },
        { name: "FD", over: "+326", under: "-", logo: "🔵" },
        { name: "MG", over: "+290", under: "-375", logo: "🟢" },
        { name: "CS", over: "+270", under: "-", logo: "🟡" },
        { name: "BR", over: "+285", under: "-500", logo: "🟣" },
        { name: "BB", over: "+325", under: "-", logo: "🔴" },
      ],
    },
    {
      name: "Alex Bregman",
      team: "HOU",
      time: "7:10 PM",
      opponent: "vs LAA",
      avatar: "👨🏻",
      teamLogo: "⚾",
      lines: {
        over: {
          line: "O 0.5",
          bestOdds: "+280",
          avgOdds: "+245",
          value: "+11.2%",
          valueColor: "text-green-400",
          bestBook: "Bally Bet",
        },
        under: {
          line: "U -320",
          bestOdds: "U -380",
          avgOdds: "U",
          value: "+4.1%",
          valueColor: "text-green-400",
          bestBook: "Novig",
        },
      },
      books: [
        { name: "DK", over: "+240", under: "-", logo: "🟠" },
        { name: "FD", over: "+250", under: "-350", logo: "🔵" },
        { name: "MG", over: "+245", under: "-320", logo: "🟢" },
        { name: "CS", over: "+235", under: "-", logo: "🟡" },
        { name: "BR", over: "+260", under: "-400", logo: "🟣" },
        { name: "BB", over: "+280", under: "-", logo: "🔴" },
      ],
    },
    {
      name: "Anthony Rizzo",
      team: "NYY",
      time: "6:08 PM",
      opponent: "vs TOR",
      avatar: "👨🏻",
      teamLogo: "⚾",
      lines: {
        over: {
          line: "O 0.5",
          bestOdds: "+450",
          avgOdds: "+380",
          value: "+15.8%",
          valueColor: "text-green-400",
          bestBook: "DraftKings",
        },
        under: {
          line: "U -550",
          bestOdds: "U -650",
          avgOdds: "U",
          value: "+2.8%",
          valueColor: "text-green-400",
          bestBook: "Caesars",
        },
      },
      books: [
        { name: "DK", over: "+450", under: "-", logo: "🟠" },
        { name: "FD", over: "+380", under: "-600", logo: "🔵" },
        { name: "MG", over: "+400", under: "-550", logo: "🟢" },
        { name: "CS", over: "+360", under: "-650", logo: "🟡" },
        { name: "BR", over: "+420", under: "-700", logo: "🟣" },
        { name: "BB", over: "+440", under: "-", logo: "🔴" },
      ],
    },
  ]

  // Check if mobile
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  React.useEffect(() => {
    const interval = setInterval(() => {
      const playersPerPage = isMobile ? 3 : 6
      setCurrentPage((prev) => (prev + 1) % Math.ceil(players.length / playersPerPage))
    }, 4000)
    return () => clearInterval(interval)
  }, [currentView, isMobile])

  // Toggle between views - different timing for mobile vs desktop
  React.useEffect(() => {
    const viewInterval = setInterval(
      () => {
        setCurrentView((prev) => (prev + 1) % 2)
        setCurrentPage(0) // Reset page when switching views
      },
      isMobile ? 6000 : 8000,
    ) // Faster cycling on mobile
    return () => clearInterval(viewInterval)
  }, [isMobile])

  // Update the visible players calculation
  const playersPerPageTable = isMobile ? 3 : 6
  const playersPerPageCards = 6 // Always show 6 cards (2 rows of 3)
  const playersPerPage = currentView === 0 ? playersPerPageTable : playersPerPageCards
  const startIndex = currentPage * playersPerPage
  const visiblePlayers = players.slice(startIndex, startIndex + playersPerPage)

  // Table View
  const TableView = () => (
    <div className="space-y-2">
      {/* Table Header with Sportsbook Initials */}
      <div className="grid grid-cols-12 gap-1 text-[7px] text-blue-300/70 font-medium border-b border-blue-800/30 pb-1">
        <div className="col-span-3">Player</div>
        <div className="col-span-1">Line</div>
        <div className="col-span-2">Best</div>
        <div className="col-span-1">Value%</div>
        <div className="col-span-5 grid grid-cols-6 gap-0.5 text-center">
          <span>DK</span>
          <span>FD</span>
          <span>MG</span>
          <span>CS</span>
          <span>BR</span>
          <span>BB</span>
        </div>
      </div>

      {/* Player Rows */}
      <div className="space-y-1">
        {visiblePlayers.map((player, index) => (
          <motion.div
            key={`${player.name}-${currentPage}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="space-y-0.5"
          >
            {/* Over Line */}
            <div className="grid grid-cols-12 gap-1 items-center bg-gradient-to-r from-blue-900/20 to-cyan-900/20 rounded-md p-1.5 border border-blue-500/10">
              {/* Player Info */}
              <div className="col-span-3 flex items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[8px] flex-shrink-0">
                  {player.avatar}
                </div>
                <div className="min-w-0">
                  <div className="text-[8px] text-blue-200 font-medium truncate">{player.name}</div>
                  <div className="text-[6px] text-blue-300/60 truncate">
                    {player.team} {player.time}
                  </div>
                </div>
              </div>

              {/* Line */}
              <div className="col-span-1">
                <div className="text-[8px] text-blue-200 font-medium">{player.lines.over.line}</div>
              </div>

              {/* Best Odds */}
              <div className="col-span-2">
                <motion.div
                  className="text-[9px] font-bold text-green-400"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, delay: index * 0.5 }}
                >
                  {player.lines.over.bestOdds}
                </motion.div>
                <div className="text-[6px] text-blue-300/60">{player.lines.over.bestBook}</div>
              </div>

              {/* Value % */}
              <div className="col-span-1">
                <motion.div
                  className={`text-[8px] font-bold ${player.lines.over.valueColor}`}
                  animate={{
                    textShadow: [
                      "0 0 0px rgba(34, 197, 94, 0)",
                      "0 0 4px rgba(34, 197, 94, 0.6)",
                      "0 0 0px rgba(34, 197, 94, 0)",
                    ],
                  }}
                  transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, delay: index * 0.3 }}
                >
                  {player.lines.over.value}
                </motion.div>
              </div>

              {/* Sportsbooks */}
              <div className="col-span-5 grid grid-cols-6 gap-0.5">
                {player.books.map((book, i) => (
                  <motion.div
                    key={i}
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 + i * 0.05 }}
                  >
                    <div className={`text-[7px] font-bold ${book.over !== "-" ? "text-green-300" : "text-gray-500"}`}>
                      {book.over}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Under Line */}
            <div className="grid grid-cols-12 gap-1 items-center bg-gradient-to-r from-red-900/10 to-orange-900/10 rounded-md p-1.5 border border-red-500/10">
              <div className="col-span-3"></div>
              <div className="col-span-1">
                <div className="text-[8px] text-red-200 font-medium">{player.lines.under.line}</div>
              </div>
              <div className="col-span-2">
                <div className="text-[9px] font-bold text-red-300">{player.lines.under.bestOdds}</div>
                <div className="text-[6px] text-red-300/60">{player.lines.under.bestBook}</div>
              </div>
              <div className="col-span-1">
                <div className={`text-[8px] font-bold ${player.lines.under.valueColor}`}>
                  {player.lines.under.value}
                </div>
              </div>
              <div className="col-span-5 grid grid-cols-6 gap-0.5">
                {player.books.map((book, i) => (
                  <div key={i} className="text-center">
                    <div className={`text-[7px] font-bold ${book.under !== "-" ? "text-red-300" : "text-gray-500"}`}>
                      {book.under}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )

  // Card View - Always 3 columns
  const CardView = () => (
    <div className="grid grid-cols-3 gap-2">
      {visiblePlayers.map((player, index) => (
        <motion.div
          key={`card-${player.name}-${currentPage}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-lg p-2 border border-gray-700/50"
        >
          {/* Player Header */}
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] flex-shrink-0">
              {player.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[9px] text-white font-medium truncate">{player.name}</div>
              <div className="text-[7px] text-gray-400">Home Runs</div>
              <div className="text-[7px] text-gray-400">
                {player.team} • {player.time}
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <button className="bg-green-600/80 text-white text-[6px] px-1.5 py-0.5 rounded text-center font-medium">
                + Over
              </button>
              <button className="bg-red-600/80 text-white text-[6px] px-1.5 py-0.5 rounded text-center font-medium">
                + Under
              </button>
            </div>
          </div>

          {/* Line Selector */}
          <div className="mb-2">
            <div className="bg-gray-700/50 rounded px-2 py-1 text-[7px] text-gray-300 text-center">Line: 0.5</div>
          </div>

          {/* Over/Under Cards */}
          <div className="grid grid-cols-2 gap-1 mb-2">
            {/* Over */}
            <div className="bg-green-600/20 border border-green-500/30 rounded p-1.5">
              <div className="text-[7px] text-green-300 mb-1">Over</div>
              <div className="text-[12px] font-bold text-green-400">{player.lines.over.bestOdds}</div>
              <div className="text-[6px] text-green-300/80">{player.lines.over.bestBook}</div>
              <div className="text-[6px] text-green-300/60 mt-1">
                Avg: {player.lines.over.avgOdds} Value: {player.lines.over.value}
              </div>
            </div>

            {/* Under */}
            <div className="bg-red-600/20 border border-red-500/30 rounded p-1.5">
              <div className="text-[7px] text-red-300 mb-1">Under</div>
              <div className="text-[12px] font-bold text-red-400">{player.lines.under.bestOdds}</div>
              <div className="text-[6px] text-red-300/80">{player.lines.under.bestBook}</div>
              <div className="text-[6px] text-red-300/60 mt-1">
                Avg: {player.lines.over.avgOdds} Value: {player.lines.under.value}
              </div>
            </div>
          </div>

          {/* Compare Button */}
          <button className="w-full bg-gray-700/50 text-gray-300 text-[7px] py-1 rounded hover:bg-gray-600/50 transition-colors">
            📊 Compare All Odds
          </button>
        </motion.div>
      ))}
    </div>
  )

  return (
    <div className="absolute inset-0 p-3">
      {/* View Toggle Indicator */}
      <div className="absolute top-1 left-1 flex items-center gap-1">
        <motion.div
          className={`w-4 h-4 rounded flex items-center justify-center ${
            currentView === 0 ? "bg-blue-500/30" : "bg-gray-600/30"
          }`}
          animate={{ scale: currentView === 0 ? 1.1 : 1 }}
        >
          <Table className="w-2 h-2 text-blue-300" />
        </motion.div>
        <motion.div
          className={`w-4 h-4 rounded flex items-center justify-center ${
            currentView === 1 ? "bg-blue-500/30" : "bg-gray-600/30"
          }`}
          animate={{ scale: currentView === 1 ? 1.1 : 1 }}
        >
          <Grid3X3 className="w-2 h-2 text-blue-300" />
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="pt-6">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {currentView === 0 ? <TableView /> : <CardView />}
        </motion.div>
      </div>

      {/* Live Update Indicators */}
      <div className="absolute top-1 right-1 flex items-center gap-1">
        <motion.div
          className="w-1 h-1 bg-green-400 rounded-full"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        />
        <span className="text-[6px] text-green-400 font-medium">Live</span>
      </div>

      {/* Page indicators - Update calculation */}
      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
        {Array.from({ length: Math.ceil(players.length / playersPerPage) }).map((_, idx) => (
          <div
            key={idx}
            className={`w-1 h-1 rounded-full transition-all duration-300 ${
              idx === currentPage ? "bg-blue-400" : "bg-blue-900/30"
            }`}
          />
        ))}
      </div>

      {/* Props count indicator - Update count */}
      <div className="absolute bottom-1 left-1 text-[6px] text-blue-400/60">
        {currentView === 0 ? "Table" : "Cards"} • {players.length * 2} props
      </div>
    </div>
  )
}

// Fixed Hit Rate Animation with Bigger Charts and No Icon Overlap
const HitRateAnimation = () => {
  const [currentView, setCurrentView] = React.useState(0)
  const views = [
    {
      title: "Last 10 Games",
      data: [
        { game: "BUF", result: "✓", value: 85 },
        { game: "MIA", result: "✗", value: 25 },
        { game: "NYJ", result: "✓", value: 90 },
        { game: "LV", result: "✓", value: 75 },
        { game: "DEN", result: "✓", value: 95 },
      ],
      percentage: "73%",
      trend: "up",
    },
    {
      title: "Home vs Away",
      data: [
        { game: "Home", result: "✓", value: 82 },
        { game: "Away", result: "✓", value: 64 },
      ],
      percentage: "82% H | 64% A",
      trend: "neutral",
    },
    {
      title: "vs Top Defenses",
      data: [
        { game: "SF", result: "✓", value: 45 },
        { game: "BAL", result: "✗", value: 20 },
        { game: "PIT", result: "✓", value: 70 },
        { game: "CLE", result: "✓", value: 55 },
      ],
      percentage: "58%",
      trend: "down",
    },
  ]

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentView((prev) => (prev + 1) % views.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const currentData = views[currentView]

  return (
    <div className="absolute inset-0 p-3">
      {/* Remove the target icon from here since it's already in the main card */}

      {/* Main content area with more space for bigger charts */}
      <div className="flex flex-col h-full">
        {/* Title */}
        <motion.div
          key={`title-${currentView}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4"
        >
          <div className="text-[11px] text-green-300 font-medium">{currentData.title}</div>
        </motion.div>

        {/* Bar Chart - Made Much Bigger */}
        <div className="flex-1 flex items-end justify-center gap-3 mb-6 px-1">
          {currentData.data.map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-1 max-w-[24px]">
              <motion.div
                className={`w-full rounded-t-md shadow-lg ${
                  item.result === "✓"
                    ? "bg-gradient-to-t from-green-500 to-green-400"
                    : "bg-gradient-to-t from-red-500 to-red-400"
                }`}
                style={{ minHeight: "12px" }}
                initial={{ height: "12pxpx" }}
                animate={{ height: `${Math.max((item.value / 100) * 60, 12)}px` }}
                transition={{
                  duration: 1.2,
                  delay: i * 0.15,
                  ease: "easeOut",
                }}
              />
              <span className="text-[9px] text-green-300/90 font-medium text-center leading-tight">{item.game}</span>
            </div>
          ))}
        </div>

        {/* Percentage Display */}
        <motion.div
          key={`percentage-${currentView}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div
            className={`text-xl font-bold ${
              currentData.trend === "up"
                ? "text-green-400"
                : currentData.trend === "down"
                  ? "text-red-400"
                  : "text-blue-400"
            }`}
          >
            {currentData.percentage}
          </div>
          <div className="text-[9px] text-green-300/70">Hit Rate</div>
        </motion.div>
      </div>

      {/* Trend indicator - repositioned to not overlap */}
      <motion.div
        className={`absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center ${
          currentData.trend === "up"
            ? "bg-green-500/20 text-green-400"
            : currentData.trend === "down"
              ? "bg-red-500/20 text-red-400"
              : "bg-blue-500/20 text-blue-400"
        }`}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
      >
        <TrendingUp className={`w-2 h-2 ${currentData.trend === "down" ? "rotate-180" : ""}`} />
      </motion.div>

      {/* View indicators */}
      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
        {views.map((_, idx) => (
          <div
            key={idx}
            className={`w-1 h-1 rounded-full transition-all duration-300 ${
              idx === currentView ? "bg-green-400" : "bg-green-900/30"
            }`}
          />
        ))}
      </div>
    </div>
  )
}

// Enhanced Scanner Animation with better positioning
const ScannerAnimation = () => {
  const [scanStep, setScanStep] = React.useState(0)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setScanStep((prev) => (prev + 1) % 5)
    }, 1800)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="absolute inset-0 p-4">
      {/* Static camera icon moved to avoid overlap */}
      <div className="absolute top-2 left-2 w-6 h-6 bg-purple-500/20 rounded-md flex items-center justify-center">
        <Camera className="w-3 h-3 text-purple-400" />
      </div>

      {/* Main animation area with more space */}
      <div className="flex flex-col items-center justify-center h-full pt-4">
        {/* Upload state */}
        {scanStep === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-3"
          >
            <motion.div
              className="w-12 h-12 border-2 border-dashed border-purple-400/50 rounded-lg flex items-center justify-center mx-auto"
              animate={{
                borderColor: ["rgba(168, 85, 247, 0.5)", "rgba(168, 85, 247, 0.8)", "rgba(168, 85, 247, 0.5)"],
              }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              <Upload className="w-6 h-6 text-purple-400" />
            </motion.div>
            <div className="text-xs text-purple-300 font-medium">Drop Screenshot</div>
          </motion.div>
        )}

        {/* Scanning state */}
        {scanStep === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-3">
            <motion.div
              className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <Scan className="w-6 h-6 text-purple-400" />
            </motion.div>
            <div className="text-xs text-purple-300 font-medium">Scanning Lines...</div>
            {/* Scanning progress bar */}
            <div className="w-16 h-1 bg-purple-900/30 rounded-full mx-auto overflow-hidden">
              <motion.div
                className="h-full bg-purple-400"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        )}

        {/* Processing/Comparing state */}
        {scanStep === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-3">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 bg-purple-400 rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.6, delay: i * 0.2, repeat: Number.POSITIVE_INFINITY }}
                  />
                ))}
              </div>
            </div>
            <div className="text-xs text-purple-300 font-medium">Comparing Odds...</div>
          </motion.div>
        )}

        {/* Analyzing state */}
        {scanStep === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-3">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto">
              <motion.div
                animate={{ rotate: [0, 180, 360] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              >
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </motion.div>
            </div>
            <div className="text-xs text-purple-300 font-medium">Finding Best Value...</div>
          </motion.div>
        )}

        {/* Results state */}
        {scanStep === 4 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-3"
          >
            <motion.div
              className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mx-auto"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5 }}
            >
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </motion.div>
            <div className="text-xs text-emerald-300 font-medium">Best Odds Found!</div>
            <div className="text-xs text-emerald-400 font-bold">MGM +12% EV</div>
          </motion.div>
        )}
      </div>

      {/* Progress indicator */}
      <div className="absolute bottom-2 left-4 right-4 flex justify-center gap-1">
        {[0, 1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`w-1 h-1 rounded-full transition-all duration-300 ${
              step <= scanStep ? "bg-purple-400" : "bg-purple-900/30"
            }`}
          />
        ))}
      </div>
    </div>
  )
}

// Enhanced Smart Betslip Animation - Mobile Optimized (4 selections instead of 5)
const SmartBetslipAnimation = () => {
  const [activeStep, setActiveStep] = React.useState(0)
  const [showComparison, setShowComparison] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)

  // Check if mobile
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const nflBets = [
    {
      player: "Patrick Mahomes",
      prop: "Passing Yards",
      line: "O 274.5",
      odds: "+105",
      book: "DK",
      team: "KC",
    },
    {
      player: "Saquon Barkley",
      prop: "Anytime TD",
      line: "Yes",
      odds: "-125",
      book: "FD",
      team: "PHI",
    },
    {
      player: "CeeDee Lamb",
      prop: "Receiving Yards",
      line: "O 82.5",
      odds: "+110",
      book: "MG",
      team: "DAL",
    },
    {
      player: "Josh Allen",
      prop: "Rush + Pass TDs",
      line: "O 2.5",
      odds: "+140",
      book: "CS",
      team: "BUF",
    },
    {
      player: "Travis Kelce",
      prop: "Receptions",
      line: "O 5.5",
      odds: "-110",
      book: "BR",
      team: "KC",
    },
  ]

  // Mobile gets 4 selections, desktop gets 5
  const displayBets = isMobile ? nflBets.slice(0, 4) : nflBets

  // Fixed: Ordered from highest to lowest odds
  const comparisonData = [
    { book: "BetMGM", odds: "+1334", rank: 1, value: 1334 },
    { book: "Caesars", odds: "+1298", rank: 2, value: 1298 },
    { book: "DraftKings", odds: "+1247", rank: 3, value: 1247 },
    { book: "FanDuel", odds: "+1189", rank: 4, value: 1189 },
  ].sort((a, b) => b.value - a.value) // Ensure highest to lowest

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (activeStep < 6) {
        setActiveStep((prev) => prev + 1)
      } else {
        // Reset cycle
        setActiveStep(0)
        setShowComparison(false)
      }

      if (activeStep === 5) {
        setShowComparison(true)
      }
    }, 1800)
    return () => clearInterval(interval)
  }, [activeStep])

  return (
    <div className="absolute inset-0 p-4">
      {/* Static shopping cart icon - repositioned to avoid overlap */}
      <div className="absolute top-2 left-2 w-5 h-5 bg-orange-500/20 rounded-md flex items-center justify-center">
        <ShoppingCart className="w-3 h-3 text-orange-400" />
      </div>

      {!showComparison ? (
        <>
          {/* Building Phase with more space */}
          <div className="space-y-1.5 mb-4 pt-6">
            {displayBets.slice(0, Math.min(activeStep + 1, displayBets.length)).map((bet, i) => (
              <motion.div
                key={i}
                className={`flex justify-between items-center bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1.5 border transition-all duration-500 ${
                  i <= activeStep ? "border-orange-400/30 opacity-100" : "border-transparent opacity-40"
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{
                  opacity: i <= activeStep ? 1 : 0.4,
                  x: 0,
                  scale: i === activeStep ? 1.02 : 1,
                }}
                transition={{
                  delay: 0.2,
                  duration: 0.5,
                }}
              >
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full flex-shrink-0" />
                    <span className="text-[9px] text-orange-200 font-medium truncate">{bet.player}</span>
                    <span className="text-[7px] text-orange-300/60 flex-shrink-0">{bet.team}</span>
                  </div>
                  <div className="text-[8px] text-orange-300/80 truncate">
                    {bet.prop} {bet.line}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  <span className="text-[9px] text-emerald-300 font-bold">{bet.odds}</span>
                  <span className="text-[7px] text-orange-300/60">{bet.book}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Status Messages */}
          {activeStep >= 3 && activeStep < 5 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-2">
              <div className="text-[9px] text-orange-300/80 font-medium">
                {activeStep === 3 && "Adding selections..."}
                {activeStep === 4 && "Building parlay..."}
              </div>
            </motion.div>
          )}

          {activeStep === 5 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-2">
              <div className="text-[9px] text-orange-300/80 font-medium">Comparing across sportsbooks...</div>
              <div className="flex justify-center gap-1 mt-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 h-1 bg-orange-400 rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.6, delay: i * 0.2, repeat: Number.POSITIVE_INFINITY }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Current Payout */}
          <motion.div
            className="absolute bottom-6 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] px-2 py-1 rounded-lg shadow-lg"
            animate={{
              scale: activeStep >= 2 ? [1, 1.05, 1] : 1,
            }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            <div className="flex items-center gap-1">
              <DollarSign className="w-2.5 h-2.5" />
              <span className="font-bold">{isMobile ? "+987" : "+1247"}</span>
            </div>
          </motion.div>
        </>
      ) : (
        <>
          {/* Comparison Results Phase - Ordered Highest to Lowest */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full flex flex-col pt-6"
          >
            <div className="text-center mb-3">
              <div className="text-[9px] text-emerald-300 font-medium">Best Odds Found!</div>
            </div>

            <div className="space-y-1.5 flex-1">
              {comparisonData.map((result, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex justify-between items-center px-2 py-1.5 rounded-lg ${
                    i === 0 ? "bg-emerald-500/20 border border-emerald-400/30" : "bg-white/5 border border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`text-[8px] font-bold w-3 h-3 rounded-full flex items-center justify-center ${
                        i === 0 ? "bg-emerald-400 text-black" : "bg-orange-400/20 text-orange-300"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <span className="text-[9px] text-orange-200 font-medium">{result.book}</span>
                  </div>
                  <span className={`text-[10px] font-bold ${i === 0 ? "text-emerald-300" : "text-orange-300"}`}>
                    {result.odds}
                  </span>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="absolute bottom-6 right-4 bg-emerald-500 text-white text-[10px] px-2 py-1 rounded-lg shadow-lg"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
            >
              <div className="flex items-center gap-1">
                <span className="font-bold">{isMobile ? "+$65" : "+$87"} Better</span>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}

      {/* Progress indicator */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
        {[0, 1, 2, 3, 4, 5].map((step) => (
          <div
            key={step}
            className={`w-1 h-1 rounded-full transition-all duration-300 ${
              step <= activeStep ? "bg-orange-400" : "bg-orange-900/30"
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export default function LandingFeaturesSection() {
  return (
    <section className="py-16 sm:py-24 bg-background relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 dark:from-blue-950/10 dark:via-transparent dark:to-purple-950/10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-r from-blue-500/3 to-purple-500/3 dark:from-blue-400/3 dark:to-purple-400/3 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 sm:mb-20"
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <Zap className="w-5 h-5 text-blue-500" />
            </motion.div>
            <Badge
              variant="secondary"
              className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 dark:from-blue-900/30 dark:to-purple-900/30 dark:text-blue-300 border-0"
            >
              Powerful Tools
            </Badge>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Bet Smarter
            </span>
          </h2>
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Four game-changing tools that give you the edge. Compare odds, track performance, scan betslips, and build
            winning strategies — all in one platform.
          </p>
        </motion.div>

        {/* Enhanced Bento Grid Features */}
        <div className="grid grid-cols-1 lg:grid-cols-4 lg:grid-rows-2 gap-6 sm:gap-8">
          {/* SmashBoard - Large Feature with Table and Card Views */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="lg:col-span-2 lg:row-span-2"
          >
            <Card className="group h-full bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border-2 border-border/50 hover:border-blue-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-blue-400/10 overflow-hidden">
              <CardContent className="p-0 h-full flex flex-col">
                <div className="relative aspect-[16/10] lg:aspect-[16/12] bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-400/10 dark:to-cyan-400/10 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />

                  <SmashBoardAnimation />

                  <Badge className="absolute top-6 right-6 bg-blue-500/90 text-white backdrop-blur-sm border-0 shadow-lg">
                    Live Odds
                  </Badge>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold text-foreground mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      SmashBoard
                    </h3>
                    <p className="text-lg font-semibold text-muted-foreground mb-4">
                      Real-time Odds. Smash-Worthy Insights.
                    </p>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Compare player props across sportsbooks with built-in EV analysis and smart filters. Your ultimate
                      command center for finding value.
                    </p>
                  </div>
                  <motion.div
                    className="mt-6 flex items-center text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-500"
                    whileHover={{ x: 5 }}
                  >
                    <span className="text-base font-semibold">Explore SmashBoard</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Hit Rate Tracker - Fixed Icon Overlap */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-1 lg:row-span-1"
          >
            <Card className="group h-full bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border-2 border-border/50 hover:border-green-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/10 dark:hover:shadow-green-400/10 overflow-hidden">
              <CardContent className="p-0 h-full flex flex-col">
                <div className="relative aspect-square bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-400/10 dark:to-emerald-400/10">
                  {/* Single target icon positioned to not overlap */}
                  <div className="absolute top-3 left-3 w-6 h-6 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Target className="w-3 h-3 text-green-400" />
                  </div>

                  <HitRateAnimation />

                  <Badge className="absolute top-4 right-4 bg-green-500/90 text-white backdrop-blur-sm border-0 shadow-lg text-xs">
                    Data Driven
                  </Badge>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                      Hit Rate Tracker
                    </h3>
                    <p className="text-sm font-semibold text-muted-foreground mb-3">How Hot Is That Player?</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Track player performance with full context and alternate lines.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Betslip Scanner - Fixed Positioning */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-1 lg:row-span-1"
          >
            <Card className="group h-full bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border-2 border-border/50 hover:border-purple-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 dark:hover:shadow-purple-400/10 overflow-hidden">
              <CardContent className="p-0 h-full flex flex-col">
                <div className="relative aspect-square bg-gradient-to-br from-purple-500/10 to-violet-500/10 dark:from-purple-400/10 dark:to-violet-400/10">
                  <ScannerAnimation />

                  <Badge className="absolute top-4 right-4 bg-purple-500/90 text-white backdrop-blur-sm border-0 shadow-lg text-xs">
                    AI Powered
                  </Badge>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      Betslip Scanner
                    </h3>
                    <p className="text-sm font-semibold text-muted-foreground mb-3">
                      Scan Any Betslip. Find Better Odds.
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Upload screenshots and let AI extract bets, compare odds instantly.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Smart Betslip - Mobile Optimized */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="lg:col-span-2 lg:row-span-1"
          >
            <Card className="group h-full bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border-2 border-border/50 hover:border-orange-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/10 dark:hover:shadow-orange-400/10 overflow-hidden">
              <CardContent className="p-0 h-full flex flex-col lg:flex-row">
                <div className="relative aspect-[16/10] lg:aspect-square lg:w-56 bg-gradient-to-br from-orange-500/10 to-red-500/10 dark:from-orange-400/10 dark:to-red-400/10 flex-shrink-0">
                  <SmartBetslipAnimation />

                  <Badge className="absolute top-4 right-4 bg-orange-500/90 text-white backdrop-blur-sm border-0 shadow-lg text-xs">
                    Smart Builder
                  </Badge>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      Smart Betslip
                    </h3>
                    <p className="text-lg font-semibold text-muted-foreground mb-4">
                      Build Your Bets. Boost Your Edge.
                    </p>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Cart-style builder that compares legs and parlays across all sportsbooks for maximum payout.
                    </p>
                  </div>
                  <motion.div
                    className="mt-6 flex items-center text-orange-600 dark:text-orange-400 opacity-0 group-hover:opacity-100 transition-all duration-500"
                    whileHover={{ x: 5 }}
                  >
                    <span className="text-base font-semibold">Try Smart Betslip</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
