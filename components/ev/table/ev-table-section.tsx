"use client"

import { useEffect, useMemo, useState } from "react"
import { EvFilterBar, type EvFilters } from "@/components/ev/filters"
import { EvTable } from "@/components/ev/table/ev-table"
import { EvTableLoading } from "@/components/ev/table/ev-loading"
import { EvFiltersModal } from "@/components/ev/filters-modal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, TrendingUp, Target } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { sportsbooks } from "@/data/sportsbooks"
import { motion } from "framer-motion"

type HighEvBet = {
  player_id: number
  description: string
  team: string
  sport?: string
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
}

interface Props {
  initialMinEv?: number
}

export function EvTableSection({ initialMinEv = 3 }: Props) {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [filters, setFilters] = useState<EvFilters>({
    query: "",
    sport: "all",
    minEv: initialMinEv,
    selectedBooks: sportsbooks.filter((b) => b.isActive).map((b) => b.id),
    selectedLeagues: ["mlb", "nfl", "ncaaf", "wnba", "nba"],
    minOdds: null,
    maxOdds: 200,
    mode: "prematch",
    bankroll: 1000,
    kellyPercent: 50
  })
  const [data, setData] = useState<HighEvBet[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [openFilters, setOpenFilters] = useState(false)

  const [refreshIndex, setRefreshIndex] = useState(0)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams()
        if (filters.minEv) params.set("min_ev", String(filters.minEv))
        params.set("limit", "500")
        const res = await fetch(`/api/positive-ev/high-ev-pct?${params.toString()}`, { cache: "no-store" })
        if (!res.ok) throw new Error(`Request failed (${res.status})`)
        const body = await res.json()
        if (!active) return
        setData(body.items || [])
      } catch (e: any) {
        if (!active) return
        setError(e?.message || "Failed to load")
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [filters.minEv, refreshIndex])

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase()
    return (data || []).filter((i) => {
      // league filter
      if (filters.selectedLeagues.length && !filters.selectedLeagues.includes((i.sport || "").toLowerCase()))
        return false
      // sportsbook filter
      if (filters.selectedBooks.length && i.best_book) {
        const norm = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "")
        const allowed = new Set(filters.selectedBooks.map(norm))
        if (!allowed.has(norm(i.best_book))) return false
      }
      // odds range filter
      if (typeof filters.maxOdds === "number" && typeof i.best_price === "number" && i.best_price > filters.maxOdds)
        return false
      if (typeof filters.minOdds === "number" && typeof i.best_price === "number" && i.best_price < filters.minOdds)
        return false
      // hide started games in prematch mode
      if (filters.mode !== 'live') {
        const start = i.commence_time ? new Date(i.commence_time).getTime() : 0
        if (start && start < Date.now()) return false
      }
      // sport quick filter
      if (filters.sport !== "all" && (i.sport || "").toLowerCase() !== filters.sport) return false
      if (!q) return true
      return (
        (i.description || "").toLowerCase().includes(q) ||
        (i.team || "").toLowerCase().includes(q) ||
        (i.market || "").toLowerCase().includes(q)
      )
    })
  }, [data, filters])

  return (
    <div className="rounded-xl border bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-slate-950/80 dark:to-slate-900/80 backdrop-blur-sm border-gray-200 dark:border-slate-800 shadow-lg overflow-hidden">
      {/* Header Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="hidden sm:block p-3 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">High EV Opportunities</h2>
            <p className="text-muted-foreground">Live positive expected value bets across all sportsbooks</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            </motion.div>
            <Badge
              variant="secondary"
              className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
            >
              Live Data
            </Badge>
          </div>
        </div>

        {/* Stats Row */}
        {!loading && data && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-xl p-4 border border-blue-200/50 dark:border-blue-800/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{filtered.length}</div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">Opportunities</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-800/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {filtered.length > 0 ? `${Math.max(...filtered.map((f) => f.ev_pct)).toFixed(1)}%` : "0%"}
                  </div>
                  <div className="text-sm text-emerald-600 dark:text-emerald-400">Max EV</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 rounded-xl p-4 border border-purple-200/50 dark:border-purple-800/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-purple-600 dark:text-purple-400">EV</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {filtered.length > 0
                      ? `${(filtered.reduce((sum, f) => sum + f.ev_pct, 0) / filtered.length).toFixed(1)}%`
                      : "0%"}
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">Avg EV</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Controls */}
      <div className="px-3 sm:px-6 pb-3 sm:pb-0">
        <div className="flex items-center justify-between gap-3 flex-wrap bg-gradient-to-r from-muted/30 to-muted/10 rounded-xl p-3 sm:p-4 border border-border/50">
          <EvFilterBar value={filters} onChange={setFilters} preMatchCount={filtered.length} liveCount={0} />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setRefreshIndex((i) => i + 1)}
              className="inline-flex items-center gap-2 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-900/80 border-border/50"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpenFilters(true)}
              className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-900/80 border-border/50"
            >
              Filters
            </Button>
          </div>
        </div>
      </div>

      <EvFiltersModal
        open={openFilters}
        onOpenChange={setOpenFilters}
        value={filters}
        onChange={setFilters}
      />

      {/* Content */}
      <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
        {loading && <EvTableLoading />}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl p-4">
            <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="bg-muted/30 rounded-xl p-8 text-center border border-border/50">
            <div className="text-muted-foreground">No results found. Try adjusting your filters.</div>
          </div>
        )}
        {!loading && !error && filtered.length > 0 && (
          <EvTable items={filtered} bankroll={filters.bankroll} kellyPercent={filters.kellyPercent} />
        )}
      </div>
    </div>
  )
}
