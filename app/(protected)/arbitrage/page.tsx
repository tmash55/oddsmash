"use client"

import { Suspense } from "react"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArbitrageSection } from "@/components/arbitrage/section"

export const dynamic = 'force-dynamic'

function PositiveEvSkeleton() {
	return (
		<Card>
			<div className="p-4 space-y-4">
				<Skeleton className="h-8 w-[200px]" />
				<Skeleton className="h-[400px]" />
			</div>
		</Card>
	)
}

export default function PositiveEvPage() {
	return (
		<div className="w-full">
			{/* Page Header */}
			<div className="mb-6">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div>
						<h1 className="text-3xl font-bold text-slate-900 dark:text-white">Arbitrage</h1>
						<p className="text-slate-600 dark:text-slate-400 mt-1 max-w-[85ch]">
							Arbitrage is a betting strategy that involves taking advantage of different odds on the same event from different sportsbooks.
						</p>
					</div>
				</div>
			</div>

			{/* Dashboard Content */}
			<Suspense fallback={<PositiveEvSkeleton />}>
				<ArbitrageSection />
			</Suspense>
		</div>
	)
}