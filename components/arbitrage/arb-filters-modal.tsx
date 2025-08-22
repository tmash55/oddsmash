"use client"

import { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { sportsbooks } from "@/data/sportsbooks"
import { motion } from "framer-motion"
import Image from "next/image"
import { Check, SlidersHorizontal, Sparkles } from "lucide-react"
import type { ArbFilters } from "@/components/arbitrage/filters"

interface Props {
  open: boolean
  onOpenChange: (next: boolean) => void
  value: ArbFilters
  onChange: (next: ArbFilters) => void
}

const ALL_LEAGUES = ["mlb", "nfl", "ncaaf", "wnba", "nba"]

export function ArbFiltersModal({ open, onOpenChange, value, onChange }: Props) {
  const [draft, setDraft] = useState<ArbFilters>(value)

  const activeBooks = useMemo(() => sportsbooks.filter((b) => b.isActive), [])

  const apply = () => {
    onChange(draft)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden border-0 shadow-2xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-emerald-600 via-cyan-600 to-blue-600 text-white px-6 py-6">
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent"></div>
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/20">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <DialogHeader>
                <DialogTitle className="text-white text-xl font-bold">Arbitrage Filters</DialogTitle>
              </DialogHeader>
              <p className="text-white/90 text-sm mt-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Narrow down opportunities
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
        <Tabs defaultValue="books" className="w-full">
          <TabsList className="grid grid-cols-3 w-full sticky top-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm z-10 border-b border-gray-200/50 dark:border-slate-800/50 rounded-none h-12">
            <TabsTrigger value="books" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white font-medium">Books</TabsTrigger>
            <TabsTrigger value="odds" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white font-medium">Odds</TabsTrigger>
            <TabsTrigger value="arb" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white font-medium">Min Arb%</TabsTrigger>
          </TabsList>

          {/* Books Tab */}
          <TabsContent value="books" className="space-y-6 p-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-slate-200">Select Sportsbooks</h3>
                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">Choose which books to include</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 border-emerald-200 dark:border-emerald-800 hover:from-emerald-100 hover:to-emerald-200"
                  onClick={() => setDraft({ ...draft, selectedBooks: activeBooks.map((b) => b.id) })}
                >
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDraft({ ...draft, selectedBooks: [] })}>
                  Clear
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {activeBooks.map((book) => {
                const checked = draft.selectedBooks.includes(book.id)
                return (
                  <motion.button
                    key={book.id}
                    type="button"
                    className={`relative p-5 rounded-2xl border-2 min-h-[110px] text-left transition-all duration-200 ${
                      checked
                        ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 ring-2 ring-emerald-500/20 shadow-lg"
                        : "border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md"
                    }`}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const next = new Set(draft.selectedBooks)
                      if (checked) next.delete(book.id)
                      else next.add(book.id)
                      setDraft({ ...draft, selectedBooks: Array.from(next) })
                    }}
                  >
                    <div className="flex flex-col items-center gap-3 h-full justify-center">
                      <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl shadow-sm flex items-center justify-center border border-gray-200 dark:border-gray-600">
                        <Image src={book.logo || "/placeholder.svg"} alt={book.name} width={28} height={28} className="object-contain" />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-slate-200 text-center leading-tight">{book.name}</span>
                    </div>
                    {checked && (
                      <motion.div
                        className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        <Check className="w-4 h-4" />
                      </motion.div>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </TabsContent>

          {/* Odds Tab */}
          <TabsContent value="odds" className="space-y-6 p-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-slate-200">Odds Range</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">Set American odds thresholds</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl border bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-slate-900/50 dark:to-slate-800/50 backdrop-blur-sm border-blue-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">MAX</span>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-900 dark:text-slate-200">Maximum American Odds</Label>
                    <p className="text-xs text-gray-600 dark:text-slate-400">Filter out odds above this value</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <Slider min={-1000} max={2000} step={10} value={[typeof (draft as any).maxOdds === "number" ? (draft as any).maxOdds : 200]} onValueChange={([v]) => setDraft({ ...(draft as any), maxOdds: v })} className="w-full" />
                </div>
              </div>
              <div className="p-6 rounded-2xl border bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-slate-900/50 dark:to-slate-800/50 backdrop-blur-sm border-purple-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <span className="text-purple-600 dark:text-purple-400 font-bold text-sm">MIN</span>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-900 dark:text-slate-200">Minimum American Odds</Label>
                    <p className="text-xs text-gray-600 dark:text-slate-400">Filter out odds below this value</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <Slider min={-1000} max={1000} step={10} value={[typeof (draft as any).minOdds === "number" ? (draft as any).minOdds : -1000]} onValueChange={([v]) => setDraft({ ...(draft as any), minOdds: v })} className="w-full" />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Min Arb Tab */}
          <TabsContent value="arb" className="space-y-6 p-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-slate-200">Arbitrage Threshold</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">Minimum Arb% to display</p>
            </div>
            <div className="p-6 rounded-2xl border bg-gradient-to-br from-emerald-50/50 to-green-50/50 dark:from-slate-900/50 dark:to-slate-800/50 backdrop-blur-sm border-emerald-200/50 dark:border-slate-700/50">
              <div className="space-y-4">
                <Slider min={0} max={100} step={1} value={[draft.minArb]} onValueChange={([v]) => setDraft({ ...draft, minArb: v })} className="w-full" />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200/50 dark:border-slate-800/50 bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-950/50 backdrop-blur-sm sticky bottom-0">
          <Button
            variant="outline"
            onClick={() => {
              setDraft(value)
              onOpenChange(false)
            }}
            className="px-6"
          >
            Cancel
          </Button>
          <Button onClick={apply} className="px-6 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-lg">
            Apply Filters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


