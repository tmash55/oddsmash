"use client"

import { useMemo, useState } from "react"
import { ArbitrageFilterBar, type ArbFilters } from "@/components/arbitrage/filters"
import { useArbitrage } from "@/hooks/use-arbitrage"
import { ArbitrageTable } from "@/components/arbitrage/table"
import { ArbLoading } from "@/components/arbitrage/arb-loading"
import { TrendingUp, Zap, Target, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SlidersHorizontal } from "lucide-react"
import { ArbFiltersModal } from "@/components/arbitrage/arb-filters-modal"
import { sportsbooks } from "@/data/sportsbooks"

export function ArbitrageSection() {
  const defaultBooks = sportsbooks.filter((b) => b.isActive).map((b) => b.id)
  const [filters, setFilters] = useState<ArbFilters>({ query: "", minArb: 0, selectedBooks: defaultBooks })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { data, isLoading, refetch, isFetching } = useArbitrage({ minArb: filters.minArb })
  const [mode, setMode] = useState<"prematch" | "live">("prematch")

  const rows = useMemo(() => {
    const items = data?.items || []
    const now = Date.now()
    let result = items

    // Time filter for pre-match mode
    if (mode !== "live") {
      result = result.filter((r) => {
        if (!r.start_time) return true
        const t = Date.parse(r.start_time)
        return Number.isFinite(t) ? t >= now : true
      })
    }

    // Sportsbook filter: exclude rows if either side uses a deselected book
    if (filters.selectedBooks?.length) {
      const normalize = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "")
      const allowed = new Set(filters.selectedBooks.map(normalize))
      result = result.filter((r) => {
        const overOk = !r.over_book || allowed.has(normalize(r.over_book))
        const underOk = !r.under_book || allowed.has(normalize(r.under_book))
        return overOk && underOk
      })
    }

    // Search filter
    if (!filters.query) return result
    const q = filters.query.toLowerCase()
    return result.filter(
      (r) =>
        (r.game || "").toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q) ||
        (r.market_key || "").toLowerCase().includes(q) ||
        (r.over_book || "").toLowerCase().includes(q) ||
        (r.under_book || "").toLowerCase().includes(q),
    )
  }, [data, filters, mode])

  const bestArb = useMemo(() => {
    if (!rows.length) return 0
    return Math.max(...rows.map((r) => r.arb_percentage || 0))
  }, [rows])

  return (
    <div className="rounded-xl border bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-slate-950/80 dark:to-slate-900/80 backdrop-blur-sm border-gray-200 dark:border-slate-800 shadow-lg overflow-hidden">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 text-white px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shadow-md backdrop-blur-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Arbitrage Opportunities</h2>
              <p className="text-white/80 text-sm">Risk-free profit opportunities</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span className="text-sm text-white/80">Found</span>
              </div>
              <span className="text-2xl font-bold">{rows.length}</span>
            </div>
            {bestArb > 0 && (
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm text-white/80">Best</span>
                </div>
                <span className="text-2xl font-bold">+{bestArb.toFixed(2)}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Controls */}
        <div className="flex items-center justify-between gap-3 flex-wrap bg-gradient-to-r from-muted/30 to-muted/10 rounded-xl p-3 sm:p-4 border border-border/50">
          <ArbitrageFilterBar
            value={filters}
            onChange={setFilters}
            mode={mode}
            onModeChange={setMode}
            preMatchCount={rows.length}
            liveCount={0}
          />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-900/80 border-border/50"
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={() => setFiltersOpen(true)}
              className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-900/80 border-border/50"
            >
              Filters
            </Button>
          </div>
        </div>
        <ArbFiltersModal open={filtersOpen} onOpenChange={setFiltersOpen} value={filters} onChange={setFilters} />
        {isLoading ? <ArbLoading /> : <ArbitrageTable data={rows} />}
      </div>
    </div>
  )
}
