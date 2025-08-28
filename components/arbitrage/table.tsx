"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { sportsbooks } from "@/data/sportsbooks"
import type { Sportsbook as SportsbookType } from "@/data/sportsbooks"
import type { ArbitrageOpportunity } from "@/hooks/use-arbitrage"
import { useMemo, useState } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { motion } from "framer-motion"
import { TrendingUp, Calculator, DollarSign, Clock, ArrowUpDown, Zap, ExternalLink, Hand } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"

function formatPct(n: number) {
  return `${(n ?? 0).toFixed(2)}%`
}

function formatDate(date?: string) {
  if (!date) return "TBD"
  try {
    const d = new Date(date)
    return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
  } catch {
    return "TBD"
  }
}

// Robust sportsbook matching similar to EV Table
const normalize = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "")
const SB_BY_ID = new Map<string, SportsbookType>()
const SB_BY_NORM_ID = new Map<string, SportsbookType>()
const SB_BY_NORM_NAME = new Map<string, SportsbookType>()
;(() => {
  sportsbooks.forEach((sb) => {
    SB_BY_ID.set(sb.id, sb as any)
    SB_BY_NORM_ID.set(normalize(sb.id), sb as any)
    SB_BY_NORM_NAME.set(normalize(sb.name), sb as any)
  })
})()

function findBook(book?: string) {
  if (!book) return undefined
  const direct = SB_BY_ID.get(book)
  if (direct) return direct
  const norm = normalize(book)
  return SB_BY_NORM_ID.get(norm) || SB_BY_NORM_NAME.get(norm)
}

function getSportsbookUrlById(bookId?: string): string | undefined {
  const book = findBook(bookId)
  if (!book) return undefined
  // Prefer affiliate link when available
  if (book.affiliate && book.affiliateLink) return book.affiliateLink
  if (!book.url) return undefined
  // Replace optional {state} placeholders with a sensible default if required
  const requiresState = (book as any).requiresState
  return requiresState ? book.url.replace(/\{state\}/g, "nj") : book.url
}

function buildDeepLink(base?: string, sid?: string): string | undefined {
  if (!base) return undefined
  if (!sid) return base
  try {
    const url = new URL(base)
    if (!url.searchParams.get("sid")) {
      url.searchParams.set("sid", sid)
    }
    return url.toString()
  } catch {
    // Fall back to base if invalid URL
    return base
  }
}

function getMobileAppLink(bookId?: string, sid?: string): string | undefined {
  const book = findBook(bookId)
  if (!book?.appLinkTemplate || !sid) return undefined
  try {
    return book.appLinkTemplate.replace(/\{sid\}/g, sid)
  } catch {
    return undefined
  }
}

function formatOdds(odds: number) {
  return odds > 0 ? `+${odds}` : String(odds)
}

function toCurrency(n: number) {
  return `$${n.toFixed(2)}`
}

// Helper function to format market display with line
function formatMarketWithLine(marketKey: string, line: string | number, side: "over" | "under") {
  const market = marketKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  const sideText = side === "over" ? "Over" : "Under"
  const lineStr = typeof line === "string" ? line : String(line)
  return `${sideText} ${lineStr} ${market}`
}

interface Props {
  data: ArbitrageOpportunity[]
}

export function ArbitrageTable({ data }: Props) {
  const { toast } = useToast()
  const isMobile = useMediaQuery("(max-width: 1024px)")
  const [stakes, setStakes] = useState<Record<string, { over: number; under: number }>>({})
  const [stakeInputs, setStakeInputs] = useState<Record<string, { over: string; under: string }>>({})

  type SortColumn = "arb" | "event"
  const [sortBy, setSortBy] = useState<SortColumn>("arb")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const WARNING_ARB_THRESHOLD = 10

  const rows = useMemo(() => {
    const now = Date.now()
    const filtered = (data || []).filter((r) => {
      if (!r.start_time) return true
      const t = Date.parse(r.start_time)
      return Number.isFinite(t) ? t >= now : true
    })

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "arb") {
        const aVal = Number(a.arb_percentage) || 0
        const bVal = Number(b.arb_percentage) || 0
        return sortDir === "asc" ? aVal - bVal : bVal - aVal
      }
      // event sort by start_time
      const aTime = Date.parse(a.start_time || "")
      const bTime = Date.parse(b.start_time || "")
      const aHas = Number.isFinite(aTime)
      const bHas = Number.isFinite(bTime)
      if (!aHas && !bHas) return 0
      if (!aHas) return 1
      if (!bHas) return -1
      return sortDir === "asc" ? aTime - bTime : bTime - aTime
    })

    return sorted
  }, [data, sortBy, sortDir])

  const getKey = (r: ArbitrageOpportunity) => `${r.event_id}-${r.market_key}-${r.line}-${r.over_book}-${r.under_book}`

  const getStake = (r: ArbitrageOpportunity) => {
    const key = getKey(r)
    const existing = stakes[key]
    if (existing) return existing

    // Default: anchor higher percentage side at $100 and scale the other proportionally
    const overStakePct = Math.max(0, (r.over_stake_pct ?? 50) / 100)
    const underStakePct = Math.max(0, (r.under_stake_pct ?? 50) / 100)
    const highIsOver = overStakePct >= underStakePct
    const highPct = highIsOver ? overStakePct : underStakePct
    const lowPct = highIsOver ? underStakePct : overStakePct
    const highAmt = 100
    const lowAmt = highPct > 0 ? (lowPct / highPct) * 100 : 0

    return {
      over: Math.round((highIsOver ? highAmt : lowAmt) * 100) / 100,
      under: Math.round((highIsOver ? lowAmt : highAmt) * 100) / 100,
    }
  }

  const getStakeInputValues = (r: ArbitrageOpportunity) => {
    const key = getKey(r)
    const existing = stakeInputs[key]
    if (existing) return existing
    const s = getStake(r)
    return { over: s.over.toFixed(2), under: s.under.toFixed(2) }
  }

  const updateStake = (r: ArbitrageOpportunity, which: "over" | "under", value: number) => {
    const key = getKey(r)

    // Get the stake percentages from the API
    const overStakePct = (r.over_stake_pct ?? 50) / 100
    const underStakePct = (r.under_stake_pct ?? 50) / 100

    if (which === "over") {
      const totalBet = value / (overStakePct || 1)
      const underAmount = Math.round(totalBet * underStakePct * 100) / 100

      setStakes((prev) => ({
        ...prev,
        [key]: {
          over: value,
          under: underAmount,
        },
      }))

      setStakeInputs((prev) => ({
        ...prev,
        [key]: {
          over: (prev[key]?.over ?? String(value)),
          under: underAmount.toFixed(2),
        },
      }))
    } else if (which === "under") {
      const totalBet = value / (underStakePct || 1)
      const overAmount = Math.round(totalBet * overStakePct * 100) / 100

      setStakes((prev) => ({
        ...prev,
        [key]: {
          over: overAmount,
          under: value,
        },
      }))

      setStakeInputs((prev) => ({
        ...prev,
        [key]: {
          over: overAmount.toFixed(2),
          under: (prev[key]?.under ?? String(value)),
        },
      }))
    }
  }

  const handleStakeChange = (r: ArbitrageOpportunity, which: "over" | "under", str: string) => {
    const key = getKey(r)
    setStakeInputs((prev) => ({
      ...prev,
      [key]: {
        over: which === "over" ? str : (prev[key]?.over ?? getStake(r).over.toFixed(2)),
        under: which === "under" ? str : (prev[key]?.under ?? getStake(r).under.toFixed(2)),
      },
    }))

    const numeric = parseFloat(str)
    if (!Number.isFinite(numeric)) return
    updateStake(r, which, Math.max(0, numeric))
  }

  const handleStakeBlur = (r: ArbitrageOpportunity, which: "over" | "under") => {
    const key = getKey(r)
    const current = stakeInputs[key] ?? getStakeInputValues(r)
    const str = (which === "over" ? current.over : current.under) || "0"
    const numeric = Math.max(0, parseFloat(str) || 0)
    updateStake(r, which, numeric)
    setStakeInputs((prev) => ({
      ...prev,
      [key]: {
        over: (which === "over" ? numeric : (stakes[key]?.over ?? getStake(r).over)).toFixed(2),
        under: (which === "under" ? numeric : (stakes[key]?.under ?? getStake(r).under)).toFixed(2),
      },
    }))
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-slate-950/80 dark:to-slate-900/80 backdrop-blur-sm border-gray-200 dark:border-slate-800 p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-gray-500 dark:text-slate-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200 mb-2">
              No Arbitrage Opportunities Found
            </h3>
            <p className="text-gray-600 dark:text-slate-400 text-sm">
              Try adjusting your filters or check back later for new opportunities.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-slate-950/80 dark:to-slate-900/80 backdrop-blur-sm border-gray-200 dark:border-slate-800 shadow-lg overflow-hidden">
      <div className="relative max-h-[75vh] sm:max-h-[70vh] overflow-auto text-[12.5px] sm:text-[14px]">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-gradient-to-r from-white/95 to-gray-50/95 dark:from-slate-950/95 dark:to-slate-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-slate-800">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[100px] text-center font-semibold text-gray-900 dark:text-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    if (sortBy === "arb") {
                      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                    } else {
                      setSortBy("arb")
                      setSortDir("desc")
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 hover:opacity-80"
                >
                  <TrendingUp className="w-4 h-4" />
                  Arb %
                  <ArrowUpDown
                    className={`w-3.5 h-3.5 ${sortBy === "arb" ? "opacity-100" : "opacity-40"} ${sortBy === "arb" && sortDir === "asc" ? "rotate-180" : ""}`}
                  />
                </button>
              </TableHead>
              <TableHead className="w-[280px] font-semibold text-gray-900 dark:text-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    if (sortBy === "event") {
                      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                    } else {
                      setSortBy("event")
                      setSortDir("asc")
                    }
                  }}
                  className="w-full flex items-center gap-2 hover:opacity-80"
                >
                  <Clock className="w-4 h-4" />
                  Event
                  <ArrowUpDown
                    className={`w-3.5 h-3.5 ${sortBy === "event" ? "opacity-100" : "opacity-40"} ${sortBy === "event" && sortDir === "asc" ? "rotate-180" : ""}`}
                  />
                </button>
              </TableHead>
              <TableHead className="w-[220px] font-semibold text-gray-900 dark:text-slate-200">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4" />
                  Market
                </div>
              </TableHead>
              <TableHead className="w-[300px] font-semibold text-gray-900 dark:text-slate-200">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Books & Odds
                </div>
              </TableHead>
              <TableHead className="w-[200px] text-center font-semibold text-gray-900 dark:text-slate-200">
                <div className="flex items-center justify-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Bet Size
                </div>
              </TableHead>
              <TableHead className="w-[140px] text-center font-semibold text-gray-900 dark:text-slate-200">
                <div className="flex items-center justify-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Profit
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => {
              const over = findBook(row.over_book)
              const under = findBook(row.under_book)
              const stake = getStake(row)
              const inputVals = getStakeInputValues(row)
              const totalStake = stake.over + stake.under
              const profit = (Number(row.arb_percentage) / 100) * totalStake

              return (
                <motion.tr
                  key={getKey(row)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="border-b border-gray-200 dark:border-slate-800 hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-white/50 dark:hover:from-slate-900/50 dark:hover:to-slate-950/50 transition-all duration-200"
                >
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold px-3 py-2 text-sm shadow-md">
                        +{formatPct(row.arb_percentage)}
                      </Badge>
                      {Number(row.arb_percentage) > WARNING_ARB_THRESHOLD && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toast({
                                    title: "High arbitrage value detected",
                                    description: "Odds might be incorrect or stale. Please verify on the sportsbooks.",
                                  })
                                }}
                                aria-label="High arb values warning"
                                className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-400/15 text-yellow-400 border border-yellow-400/40 ring-1 ring-yellow-400/30"
                              >
                                <Hand className="w-3.5 h-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              High arb values, odds might be incorrect.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {row.description && (
                        <span className="font-semibold text-gray-900 dark:text-slate-200">{row.description}</span>
                      )}
                      {(row.game || !row.description) && (
                        <span className="text-sm text-gray-700 dark:text-slate-300">{row.game || row.description}</span>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-gray-500 dark:text-slate-400" />
                        <span className="text-xs text-gray-500 dark:text-slate-400">{formatDate(row.start_time)}</span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-gray-900 dark:text-slate-200">{row.market_key}</span>
                      <Badge
                        variant="outline"
                        className="w-fit text-xs bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                      >
                        Line {row.line}
                      </Badge>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 border border-gray-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900 dark:text-slate-200 text-sm">
                            {formatMarketWithLine(row.market_key, row.line, "over")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 dark:text-slate-200">
                            {formatOdds(row.over_odds)}
                          </span>
                          {over?.logo && (
                            <Image
                              src={over.logo || "/placeholder.svg"}
                              alt={over.name}
                              width={22}
                              height={22}
                              className="object-contain"
                            />
                          )}
                          {(() => {
                            const appHref = isMobile ? getMobileAppLink(row.over_book, (row as any).over_sid) : undefined
                            const deep = !appHref ? buildDeepLink((row as any).over_link, (row as any).over_sid) : undefined
                            const href = appHref || deep || getSportsbookUrlById(row.over_book)
                            if (!href) return null
                            return (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-1 inline-flex items-center justify-center w-7 h-7 rounded-md border border-blue-200 text-blue-600 hover:text-blue-700 hover:border-blue-300 bg-white dark:bg-slate-900"
                              title="Open sportsbook"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            )
                          })()}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 border border-gray-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900 dark:text-slate-200 text-sm">
                            {formatMarketWithLine(row.market_key, row.line, "under")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 dark:text-slate-200">
                            {formatOdds(row.under_odds)}
                          </span>
                          {under?.logo && (
                            <Image
                              src={under.logo || "/placeholder.svg"}
                              alt={under.name}
                              width={22}
                              height={22}
                              className="object-contain"
                            />
                          )}
                          {(() => {
                            const appHref = isMobile ? getMobileAppLink(row.under_book, (row as any).under_sid) : undefined
                            const deep = !appHref ? buildDeepLink((row as any).under_link, (row as any).under_sid) : undefined
                            const href = appHref || deep || getSportsbookUrlById(row.under_book)
                            if (!href) return null
                            return (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-1 inline-flex items-center justify-center w-7 h-7 rounded-md border border-blue-200 text-blue-600 hover:text-blue-700 hover:border-blue-300 bg-white dark:bg-slate-900"
                              title="Open sportsbook"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <Input
                          className="w-[120px] text-center pl-8 h-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-gray-200 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-400 rounded-lg"
                          type="text"
                          inputMode="decimal"
                          value={inputVals.over}
                          onChange={(e) => handleStakeChange(row, "over", e.target.value)}
                          onBlur={() => handleStakeBlur(row, "over")}
                          placeholder="Over"
                        />
                      </div>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <Input
                          className="w-[120px] text-center pl-8 h-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-gray-200 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-400 rounded-lg"
                          type="text"
                          inputMode="decimal"
                          value={inputVals.under}
                          onChange={(e) => handleStakeChange(row, "under", e.target.value)}
                          onBlur={() => handleStakeBlur(row, "under")}
                          placeholder="Under"
                        />
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                        Total: ${totalStake.toFixed(2)}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold px-4 py-2 text-lg shadow-md">
                        {toCurrency(profit)}
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-slate-400">
                        {((profit / totalStake) * 100).toFixed(1)}% ROI
                      </span>
                    </div>
                  </TableCell>
                </motion.tr>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
