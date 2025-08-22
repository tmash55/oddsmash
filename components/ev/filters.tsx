"use client"

import { useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Lock } from "lucide-react"

export interface EvFilters {
	query: string
	sport: string | "all"
	minEv: number
	// Advanced filters
	selectedBooks: string[] // sportsbook ids
	selectedLeagues: string[] // ['mlb','nfl','ncaaf','wnba','nba']
	minOdds?: number | null // American odds
	maxOdds?: number | null // American odds
	mode?: "prematch" | "live"
	maxEv?: number | null // EV% upper bound; null means no max
}

interface Props {
	value: EvFilters
	onChange: (next: EvFilters) => void
	preMatchCount?: number
	liveCount?: number
}

export function EvFilterBar({ value, onChange, preMatchCount = 0, liveCount = 0 }: Props) {
	const update = (patch: Partial<EvFilters>) => onChange({ ...value, ...patch })
	return (
		<div className="flex flex-wrap items-center gap-3">
			{/* Mode toggle */}
			<div className="flex items-center rounded-2xl border px-1 py-1 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
				<button
					type="button"
					className={`px-3 py-1.5 rounded-xl text-sm font-medium ${value.mode !== 'live' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow' : 'text-slate-600 dark:text-slate-300'}`}
					onClick={() => update({ mode: 'prematch' })}
				>
					Pre-Match <span className="ml-1 tabular-nums">{preMatchCount}</span>
				</button>
				<button
					type="button"
					disabled
					className="px-3 py-1.5 rounded-xl text-sm font-medium text-slate-400 dark:text-slate-500 inline-flex items-center gap-1"
					title="Live EV plays coming soon"
				>
					Live <Lock className="w-3.5 h-3.5" />
				</button>
			</div>

			<div className="w-[260px]">
				<Input
					placeholder="Search player/team"
					value={value.query}
					onChange={(e) => update({ query: e.target.value })}
				/>
			</div>
		</div>
	)
}


