"use client"

import { Input } from "@/components/ui/input"
import { Search, Lock } from "lucide-react"

export interface ArbFilters {
  query: string
  minArb: number
  selectedBooks: string[]
}

interface Props {
  value: ArbFilters
  onChange: (next: ArbFilters) => void
  mode?: "prematch" | "live"
  onModeChange?: (mode: "prematch" | "live") => void
  preMatchCount?: number
  liveCount?: number
}

export function ArbitrageFilterBar({ value, onChange, mode = "prematch", onModeChange, preMatchCount = 0, liveCount = 0 }: Props) {
  const update = (patch: Partial<ArbFilters>) => onChange({ ...value, ...patch })

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Mode toggle */}
      <div className="flex items-center rounded-2xl border px-1 py-1 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
        <button
          type="button"
          className={`px-3 py-1.5 rounded-xl text-sm font-medium ${mode !== 'live' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow' : 'text-slate-600 dark:text-slate-300'}`}
          onClick={() => onModeChange?.('prematch')}
        >
          Pre-Match <span className="ml-1 tabular-nums">{preMatchCount}</span>
        </button>
        <button
          type="button"
          disabled
          className="px-3 py-1.5 rounded-xl text-sm font-medium text-slate-400 dark:text-slate-500 inline-flex items-center gap-1"
          title="Live opportunities coming soon"
        >
          Live <Lock className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Search */}
      <div className="w-[260px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search player/team"
            value={value.query}
            onChange={(e) => update({ query: e.target.value })}
            className="pl-10"
          />
        </div>
      </div>
    </div>
  )
}
