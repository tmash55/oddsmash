"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArbitrageFilterBar, type ArbFilters } from "@/components/arbitrage/filters"
import { useArbitrage } from "@/hooks/use-arbitrage"
import { ArbitrageTableNew } from "@/components/arbitrage/table-new"
import { ArbLoading } from "@/components/arbitrage/arb-loading"
import { TrendingUp, Zap, Target, RefreshCw, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SlidersHorizontal } from "lucide-react"
import { ArbFiltersModal } from "@/components/arbitrage/arb-filters-modal"
import { sportsbooks } from "@/data/sportsbooks"
import { useArbitragePreferences } from "@/contexts/preferences-context"

export function ArbitrageSection() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Use the new preferences provider
  const { filters, updateFilters, isLoading: preferencesLoading } = useArbitragePreferences()
  
  // Use a ref to track if we're currently saving to prevent circular updates
  const isSavingRef = useRef(false)
  
  // Local state for filters - initialize once when preferences load
  const [localFilters, setLocalFilters] = useState<ArbFilters>(() => ({
    query: "",
    minArb: 0,
    maxArb: 20,
    selectedBooks: []
  }))
  
  // Initialize local state from preferences once they load
  const [hasInitialized, setHasInitialized] = useState(false)
  
  useEffect(() => {
    if (!preferencesLoading && !hasInitialized) {
      setLocalFilters({
        query: filters.searchQuery,
        minArb: filters.minArb,
        maxArb: filters.maxArb || 20,
        selectedBooks: filters.selectedBooks
      })
      setHasInitialized(true)
    }
  }, [preferencesLoading, hasInitialized, filters])

  // Sync localFilters when underlying preferences change (e.g., from profile page)
  useEffect(() => {
    if (hasInitialized && !isSavingRef.current) {
      setLocalFilters(prev => ({
        query: filters.searchQuery,
        minArb: filters.minArb,
        maxArb: filters.maxArb || 20,
        selectedBooks: filters.selectedBooks
      }))
    }
  }, [filters.selectedBooks, filters.minArb, filters.maxArb, filters.searchQuery, hasInitialized])

  // Simple debounced save for search query only (ROI values saved in modal)
  useEffect(() => {
    if (!hasInitialized || isSavingRef.current) return

    const timeoutId = setTimeout(async () => {
      isSavingRef.current = true
      try {
        // Guard: skip if unchanged to avoid redundant writes
        if (filters.searchQuery !== localFilters.query) {
          console.log('[ArbitrageSection] Persist searchQuery ->', localFilters.query)
          await updateFilters({
            searchQuery: localFilters.query
          })
        }
      } catch (error) {
        console.error('Failed to save search query:', error)
      } finally {
        isSavingRef.current = false
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [localFilters.query, updateFilters, hasInitialized])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { data, isLoading, refetch, isFetching } = useArbitrage({ minArb: localFilters.minArb })
  
  // Initialize mode from URL parameter
  const [mode, setMode] = useState<"prematch" | "live">(() => {
    const modeParam = searchParams.get("mode")
    return modeParam === "live" ? "live" : "prematch"
  })

  // Update URL when mode changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (mode === "live") {
      params.set("mode", "live")
    } else {
      params.delete("mode") // Default to prematch, no param needed
    }
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [mode, router, searchParams])

  const rows = useMemo(() => {
    const startTime = performance.now()
    const items = data?.items || []
    
    // Early return if no data
    if (items.length === 0) return []
    
    const now = Date.now()
    let result = items

    // Optimize filtering with early returns and combined operations
    result = result.filter((r) => {
      // Combined mode and time filtering for better performance
      if (mode === "live") {
        if (r.is_live !== true) return false
        // For live events, be more lenient as they could be ongoing
        if (r.start_time) {
          const t = Date.parse(r.start_time)
          if (Number.isFinite(t) && t < now - 24 * 60 * 60 * 1000) return false
        }
      } else {
        if (r.is_live === true) return false
        // Time filter for pre-match mode
        if (r.start_time) {
          const t = Date.parse(r.start_time)
          if (Number.isFinite(t) && t < now) return false
        }
      }

      // Early arbitrage percentage filtering (most selective)
      if (localFilters.minArb > 0 || (localFilters.maxArb && localFilters.maxArb < 50)) {
        const arb = Number(r.arb_percentage) || 0
        if (arb < localFilters.minArb || (localFilters.maxArb && arb > localFilters.maxArb)) {
          return false
        }
      }

      return true
    })

    // Sportsbook filter: exclude rows if either side uses a deselected book
    if (localFilters.selectedBooks?.length) {
      const normalize = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "")
      const allowedSet = new Set(localFilters.selectedBooks.map(normalize))
      
      result = result.filter((r) => {
        const overOk = !r.over_book || allowedSet.has(normalize(r.over_book))
        const underOk = !r.under_book || allowedSet.has(normalize(r.under_book))
        return overOk && underOk
      })
    }

    // Search filter (most expensive, do last)
    if (!localFilters.query) return result
    const q = localFilters.query.toLowerCase()
    const filtered = result.filter(
      (r) =>
        (r.game || "").toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q) ||
        (r.market_key || "").toLowerCase().includes(q) ||
        (r.over_book || "").toLowerCase().includes(q) ||
        (r.under_book || "").toLowerCase().includes(q),
    )
    
    const processingTime = performance.now() - startTime
    if (processingTime > 50) {
      console.warn(`[ARBITRAGE SECTION] Slow filtering: ${processingTime.toFixed(2)}ms for ${filtered.length} items`)
    }
    
    return filtered
  }, [data, localFilters, mode])

  // Calculate filtered counts for each mode
  const modeCounts = useMemo(() => {
    const items = data?.items || []
    const now = Date.now()
    
    // Apply same filtering logic as in rows calculation but separate by mode
    let prematchItems = items.filter(item => item.is_live !== true)
    let liveItems = items.filter(item => item.is_live === true)
    
    // Apply time filtering
    prematchItems = prematchItems.filter((r) => {
      if (!r.start_time) return true
      const t = Date.parse(r.start_time)
      return Number.isFinite(t) ? t >= now : true
    })
    
    liveItems = liveItems.filter((r) => {
      if (!r.start_time) return true
      const t = Date.parse(r.start_time)
      return Number.isFinite(t) ? t >= now - 24 * 60 * 60 * 1000 : true
    })
    
    // Apply sportsbook filtering to both
    if (localFilters.selectedBooks?.length) {
      const normalize = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "")
      const allowed = new Set(localFilters.selectedBooks.map(normalize))
      
      const applySportsbookFilter = (items: any[]) => items.filter((r) => {
        const overOk = !r.over_book || allowed.has(normalize(r.over_book))
        const underOk = !r.under_book || allowed.has(normalize(r.under_book))
        return overOk && underOk
      })
      
      prematchItems = applySportsbookFilter(prematchItems)
      liveItems = applySportsbookFilter(liveItems)
    }
    
    // Apply arbitrage percentage filtering to both
    if (localFilters.minArb > 0 || (localFilters.maxArb && localFilters.maxArb < 50)) {
      const applyArbFilter = (items: any[]) => items.filter((r) => {
        const arb = Number(r.arb_percentage) || 0
        const minOk = arb >= localFilters.minArb
        const maxOk = !localFilters.maxArb || arb <= localFilters.maxArb
        return minOk && maxOk
      })
      
      prematchItems = applyArbFilter(prematchItems)
      liveItems = applyArbFilter(liveItems)
    }

    // Apply search filtering to both
    if (localFilters.query) {
      const q = localFilters.query.toLowerCase()
      const applySearchFilter = (items: any[]) => items.filter((r) =>
        (r.game || "").toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q) ||
        (r.market_key || "").toLowerCase().includes(q) ||
        (r.over_book || "").toLowerCase().includes(q) ||
        (r.under_book || "").toLowerCase().includes(q)
      )
      
      prematchItems = applySearchFilter(prematchItems)
      liveItems = applySearchFilter(liveItems)
    }
    
    return { 
      prematchCount: prematchItems.length, 
      liveCount: liveItems.length 
    }
  }, [data?.items, localFilters])

  const bestArb = useMemo(() => {
    if (!rows.length) return 0
    return Math.max(...rows.map((r) => r.arb_percentage || 0))
  }, [rows])

  return (
    <div className="rounded-xl border bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-slate-900/95 dark:to-slate-950/95 backdrop-blur-sm border-gray-200 dark:border-slate-700 shadow-lg dark:shadow-2xl overflow-hidden">
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
            {/* Performance Metrics for VC Monitoring */}
            {data?.metadata && (
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-sm text-white/80">API</span>
                </div>
                <span className="text-lg font-bold">{data.metadata.totalTime}ms</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Controls */}
        <div className="flex items-center justify-between gap-3 flex-wrap bg-gradient-to-r from-muted/30 to-muted/10 rounded-xl p-3 sm:p-4 border border-border/50">
          <ArbitrageFilterBar
            value={localFilters}
            onChange={setLocalFilters}
            mode={mode}
            onModeChange={setMode}
            preMatchCount={modeCounts.prematchCount}
            liveCount={modeCounts.liveCount}
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
              size="sm"
              onClick={() => setFiltersOpen(true)}
              className="px-3 py-2 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-900/80 border-border/50"
              title="Filters & Settings"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ArbFiltersModal open={filtersOpen} onOpenChange={setFiltersOpen} />
        {isLoading ? <ArbLoading /> : <ArbitrageTableNew data={rows} mode={mode} />}
      </div>
    </div>
  )
}
