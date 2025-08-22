"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { sportsbooks } from "@/data/sportsbooks"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Plus, MoreHorizontal, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"

type HighEvBet = {
  player_id: number
  description: string
  team: string
  market: string
  line: string | number
  side: string
  ev_pct: number
  fair_odds?: number
  best_book?: string
  best_price?: number
  event_id?: string
  commence_time?: string
  pointer?: string
  // New optional fields for richer display
  home_team?: string
  away_team?: string
  link?: string
  sid?: string
}

interface Props {
  items: HighEvBet[]
}

export function EvTable({ items }: Props) {
  const isMobile = useMediaQuery("(max-width: 768px)")

  const [sortField, setSortField] = useState<null | "time" | "ev">(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const { mapById, mapByNormId, mapByNormName } = useMemo(() => {
    const mapById = new Map<string, { name: string; logo: string }>()
    const mapByNormId = new Map<string, { name: string; logo: string }>()
    const mapByNormName = new Map<string, { name: string; logo: string }>()
    const normalize = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "")
    sportsbooks.forEach((sb) => {
      const entry = { name: sb.name, logo: sb.logo }
      mapById.set(sb.id, entry)
      mapByNormId.set(normalize(sb.id), entry)
      mapByNormName.set(normalize(sb.name), entry)
    })
    return { mapById, mapByNormId, mapByNormName }
  }, [])

  const findBook = (bestBook?: string) => {
    if (!bestBook) return undefined
    const normalize = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "")
    const direct = mapById.get(bestBook)
    if (direct) return direct
    const norm = normalize(bestBook)
    return mapByNormId.get(norm) || mapByNormName.get(norm)
  }

  const findBookFull = (bestBook?: string) => {
    if (!bestBook) return undefined
    const normalize = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "")
    const norm = normalize(bestBook)
    return sportsbooks.find((sb) => normalize(sb.id) === norm || normalize(sb.name) === norm)
  }

  const sortedItems = useMemo(() => {
    if (sortField === "time") {
      const parseTime = (s?: string) => (s ? new Date(s).getTime() : 0)
      const factor = sortDirection === "asc" ? 1 : -1
      return [...items].sort((a, b) => (parseTime(a.commence_time) - parseTime(b.commence_time)) * factor)
    }
    if (sortField === "ev") {
      const factor = sortDirection === "asc" ? 1 : -1
      return [...items].sort((a, b) => ((a.ev_pct || 0) - (b.ev_pct || 0)) * factor)
    }
    return items
  }, [items, sortField, sortDirection])

  const toggleTimeSort = () => {
    if (sortField !== "time") {
      setSortField("time")
      setSortDirection("asc")
    } else {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
    }
  }

  const toggleEvSort = () => {
    if (sortField !== "ev") {
      setSortField("ev")
      setSortDirection("desc")
    } else {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
    }
  }

  const renderMarket = (item: HighEvBet) => {
    const side = (item.side || "").toLowerCase()
    const sideLabel = side === "over" ? "Over" : side === "under" ? "Under" : item.side || ""
    const lineStr = typeof item.line === "string" ? item.line : Number(item.line).toFixed(1)
    return (
      <Badge
        variant="secondary"
        className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-medium px-3 py-1"
      >
        {sideLabel} {lineStr} {item.market}
      </Badge>
    )
  }

  const americanToDecimal = (odds: number): number => (odds >= 0 ? 1 + odds / 100 : 1 + 100 / Math.abs(odds))
  const americanToProb = (odds: number): number =>
    odds >= 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100)

  const formatOdds = (odds?: number) => (typeof odds === "number" ? (odds > 0 ? `+${odds}` : String(odds)) : "—")

  // Format like: Sat, Aug 23 at 10:05 PM
  const formatCommence = (iso?: string) => {
    if (!iso) return ""
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ""
    const day = d.toLocaleString("en-US", { weekday: "short" })
    const month = d.toLocaleString("en-US", { month: "short" })
    const dayNum = d.getDate()
    const time = d.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    return `${day}, ${month} ${dayNum} at ${time}`
  }

  const formatMatchup = (item: HighEvBet) => {
    const away = (item.away_team || "").trim()
    const home = (item.home_team || "").trim()
    if (away && home) return `${away} @ ${home}`
    return item.team || ""
  }

  // Kelly settings
  const BANKROLL = 1000
  const KELLY_MULTIPLIER = 0.5 // Half-Kelly for risk-adjusted stake

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-950/80 dark:to-slate-950/40 backdrop-blur-xl border-border/50 shadow-xl",
        isMobile && "-mx-4 border-x-0 rounded-none",
      )}
    >
      <div className="relative h-[70vh] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-30 bg-gradient-to-r from-white/95 to-white/90 dark:from-slate-950/95 dark:to-slate-950/90 backdrop-blur-xl border-b border-border/50 shadow-sm">
            <TableRow className="hover:bg-transparent border-border/50 divide-x divide-border/30">
              {isMobile ? (
                <>
                  <TableHead className="w-[45%] bg-gradient-to-r from-white/95 to-white/90 dark:from-slate-950/95 dark:to-slate-950/90 text-foreground font-semibold sticky top-0">
                    Selection
                  </TableHead>
                  <TableHead className="w-[20%] text-center bg-gradient-to-r from-white/95 to-white/90 dark:from-slate-950/95 dark:to-slate-950/90 text-foreground font-semibold sticky top-0">
                    Event
                  </TableHead>
                  <TableHead className="w-[20%] text-center bg-gradient-to-r from-white/95 to-white/90 dark:from-slate-950/95 dark:to-slate-950/90 text-foreground font-semibold sticky top-0">
                    EV%
                  </TableHead>
                  <TableHead className="w-[15%] text-right bg-gradient-to-r from-white/95 to-white/90 dark:from-slate-950/95 dark:to-slate-950/90 text-foreground font-semibold sticky top-0 pr-3">
                    Actions
                  </TableHead>
                </>
              ) : (
                <>
                  <TableHead className="w-[90px] text-center bg-gradient-to-r from-white/95 to-white/90 dark:from-slate-950/95 dark:to-slate-950/90 text-foreground font-semibold sticky top-0">
                    <div className="flex items-center justify-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>EV%</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        onClick={toggleEvSort}
                        title="Sort by EV%"
                      >
                        {sortField === "ev" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </TableHead>
                  <TableHead className="w-[240px] bg-gradient-to-r from-white/95 to-white/90 dark:from-slate-950/95 dark:to-slate-950/90 text-foreground font-semibold sticky top-0">
                    <div className="flex items-center justify-between gap-1">
                      <span>Event</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        onClick={toggleTimeSort}
                        title="Sort by start time"
                      >
                        {sortField === "time" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </TableHead>
                  <TableHead className="w-[320px] bg-gradient-to-r from-white/95 to-white/90 dark:from-slate-950/95 dark:to-slate-950/90 text-foreground font-semibold sticky top-0">
                    Selection
                  </TableHead>
                  <TableHead className="w-[220px] bg-gradient-to-r from-white/95 to-white/90 dark:from-slate-950/95 dark:to-slate-950/90 text-foreground font-semibold sticky top-0">
                    Best Book
                  </TableHead>
                  <TableHead className="w-[120px] text-center bg-gradient-to-r from-white/95 to-white/90 dark:from-slate-950/95 dark:to-slate-950/90 text-foreground font-semibold sticky top-0">
                    Fair Odds
                  </TableHead>
                  <TableHead className="w-[120px] text-center bg-gradient-to-r from-white/95 to-white/90 dark:from-slate-950/95 dark:to-slate-950/90 text-foreground font-semibold sticky top-0">
                    Probability
                  </TableHead>
                  <TableHead className="w-[130px] text-center bg-gradient-to-r from-white/95 to-white/90 dark:from-slate-950/95 dark:to-slate-950/90 text-foreground font-semibold sticky top-0">
                    Stake (Kelly)
                  </TableHead>
                  <TableHead className="w-[110px] text-right bg-gradient-to-r from-white/95 to-white/90 dark:from-slate-950/95 dark:to-slate-950/90 text-foreground font-semibold sticky top-0 pr-3">
                    Actions
                  </TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.map((item, index) => {
              const book = findBook(item.best_book)
              if (isMobile) {
                return (
                  <motion.tr
                    key={`${item.player_id}-${item.market}-${item.line}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-border/50 divide-x divide-border/30 hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="py-4">
                      <div className="space-y-2">
                        <div className="font-medium text-sm text-foreground">{item.description}</div>
                        <div>{renderMarket(item)}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-xs py-4">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">{formatMatchup(item)}</div>
                        <div className="text-xs text-muted-foreground">{formatCommence(item.commence_time)}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <div className="inline-flex items-center justify-center px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 shadow-sm min-w-[72px]">
                        <span className="text-base font-bold text-white">{item.ev_pct.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-3 py-4">
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-sm"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </TableCell>
                  </motion.tr>
                )
              }

              return (
                <motion.tr
                  key={`${item.player_id}-${item.market}-${item.line}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="border-border/50 hover:bg-gradient-to-r hover:from-muted/20 hover:to-muted/10 transition-all duration-200 divide-x divide-border/30"
                >
                  {/* EV% */}
                  <TableCell className="text-center py-4">
                    <div className="inline-flex items-center justify-center px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 shadow-sm min-w-[72px]">
                      <span className="text-base font-bold text-white">{item.ev_pct.toFixed(1)}%</span>
                    </div>
                  </TableCell>

                  {/* Event (matchup + time) */}
                  <TableCell className="text-sm py-4">
                    <div className="space-y-1">
                      <div className="font-medium text-foreground">{formatMatchup(item)}</div>
                      <div className="text-xs text-muted-foreground">{formatCommence(item.commence_time)}</div>
                    </div>
                  </TableCell>

                  {/* Selection (Player + Market) */}
                  <TableCell className="py-4">
                    <div className="space-y-2">
                      <div className="font-medium text-foreground">{item.description}</div>
                      <div>{renderMarket(item)}</div>
                    </div>
                  </TableCell>

                  {/* Best Book */}
                  <TableCell className="py-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        {book && (
                          <Image
                            src={book.logo || "/placeholder.svg"}
                            alt={book.name}
                            width={24}
                            height={24}
                            className="object-contain"
                          />
                        )}
                        <div>
                          <div className="font-medium text-foreground">{book?.name || item.best_book}</div>
                          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {formatOdds(item.best_price)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const full = findBookFull(item.best_book)
                          const href = item.link || full?.url
                          const label = item.link ? "Open" : href ? "Site" : "Site"
                          if (href) {
                            return (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 hover:underline text-blue-600 dark:text-blue-400 text-sm font-medium"
                              >
                                <ExternalLink className="h-4 w-4" />
                                {label}
                              </a>
                            )
                          }
                          return (
                            <span className="opacity-60 inline-flex items-center gap-1 text-sm">
                              <ExternalLink className="h-4 w-4" />
                              {label}
                            </span>
                          )
                        })()}
                      </div>
                    </div>
                  </TableCell>

                  {/* Fair Odds */}
                  <TableCell className="text-center text-sm py-4">
                    {typeof item.fair_odds === "number" ? (
                      <div className="font-medium text-foreground">{formatOdds(item.fair_odds as number)}</div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Probability */}
                  <TableCell className="text-center text-sm py-4">
                    {typeof item.fair_odds === "number" ? (
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      >
                        {Math.round(americanToProb(item.fair_odds as number) * 100)}%
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Stake (Kelly) */}
                  <TableCell className="text-center py-4">
                    {(() => {
                      const hasFair = typeof item.fair_odds === "number"
                      const hasBest = typeof item.best_price === "number"
                      if (!hasBest || !hasFair) return <span className="text-sm text-muted-foreground">—</span>
                      const p = americanToProb(item.fair_odds as number)
                      const d = americanToDecimal(item.best_price as number)
                      const b = d - 1
                      const q = 1 - p
                      const fFull = b !== 0 ? (b * p - q) / b : 0
                      const fAdj = Math.max(0, fFull) * KELLY_MULTIPLIER
                      const stake = fAdj * BANKROLL
                      return (
                        <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                          ${Math.round(stake)}
                        </div>
                      )
                    })()}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right pr-3 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-sm"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                      <Button size="sm" variant="outline" className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  )
}
