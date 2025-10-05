"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { sportsbooks } from "@/data/sportsbooks"
import { motion } from "framer-motion"
import Image from "next/image"
import { Check, SlidersHorizontal, Sparkles, Percent } from "lucide-react"
import { useArbitragePreferences } from "@/contexts/preferences-context"

interface Props {
  open: boolean
  onOpenChange: (next: boolean) => void
}

export function ArbFiltersModal({ open, onOpenChange }: Props) {
  const activeBooks = useMemo(() => sportsbooks.filter((b) => b.isActive), [])
  const allBookIds = useMemo(() => activeBooks.map((b) => b.id), [activeBooks])
  
  // Use the preferences context directly
  const { filters, updateFilters, isLoading } = useArbitragePreferences()
  
  // Simple local state that syncs immediately with database
  const [minRoi, setMinRoi] = useState(0)
  const [maxRoi, setMaxRoi] = useState(20)
  const [totalBetAmount, setTotalBetAmount] = useState(200)
  const [totalBetAmountInput, setTotalBetAmountInput] = useState('200')

  // Debounce timers
  const debounceRef = useRef<{ min?: number; max?: number; total?: number }>({})

  // Initialize from preferences when they load
  useEffect(() => {
    if (!isLoading && filters) {
      setMinRoi(filters.minArb ?? 0)
      setMaxRoi(filters.maxArb ?? 20)
      const amount = (filters as any).totalBetAmount ?? 200
      setTotalBetAmount(amount)
      setTotalBetAmountInput(amount.toString())
    }
  }, [isLoading, filters])

  // Sportsbook handlers
  const handleSelectAll = async () => {
    if (!filters) return
    await updateFilters({ selectedBooks: allBookIds })
  }

  const handleClear = async () => {
    if (!filters) return
    await updateFilters({ selectedBooks: [] })
  }

  const handleToggleBook = async (bookId: string) => {
    if (!filters) return
    const currentBooks = filters.selectedBooks
    const isSelected = currentBooks.includes(bookId)
    
    const newBooks = isSelected 
      ? currentBooks.filter(id => id !== bookId)
      : [...currentBooks, bookId]
    
    await updateFilters({ selectedBooks: newBooks })
  }

  // ROI handlers - immediate save to database
  const handleMinRoiChange = async (value: string) => {
    const numValue = Math.max(0, Math.min(50, Number(value) || 0))
    setMinRoi(numValue)
    // Debounce DB write
    if (debounceRef.current.min) window.clearTimeout(debounceRef.current.min)
    debounceRef.current.min = window.setTimeout(async () => {
      try {
        if (filters && filters.minArb === numValue) return
        console.log('[ArbFiltersModal] Persist minArb ->', numValue)
        await updateFilters({ minArb: numValue })
      } catch (error) {
        console.error('Failed to save min ROI:', error)
      }
    }, 500)
  }

  const handleMaxRoiChange = async (value: string) => {
    const numValue = Math.max(1, Math.min(100, Number(value) || 20))
    setMaxRoi(numValue)
    // Debounce DB write
    if (debounceRef.current.max) window.clearTimeout(debounceRef.current.max)
    debounceRef.current.max = window.setTimeout(async () => {
      try {
        if (filters && filters.maxArb === numValue) return
        console.log('[ArbFiltersModal] Persist maxArb ->', numValue)
        await updateFilters({ maxArb: numValue })
      } catch (error) {
        console.error('Failed to save max ROI:', error)
      }
    }, 500)
  }

  const handleTotalBetAmountChange = (value: string) => {
    // Always update the input display value immediately
    setTotalBetAmountInput(value)
    
    // Update the actual state and save for any valid number >= 0
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      setTotalBetAmount(numValue)
      if (debounceRef.current.total) window.clearTimeout(debounceRef.current.total)
      debounceRef.current.total = window.setTimeout(() => {
        console.log('[ArbFiltersModal] Persist totalBetAmount ->', numValue)
        updateFilters({ totalBetAmount: numValue }).catch(error => {
          console.error('Failed to save total bet amount:', error)
        })
      }, 400)
    }
  }

  const handleTotalBetAmountBlur = async () => {
    const numValue = parseFloat(totalBetAmountInput)
    
    if (totalBetAmountInput === '' || isNaN(numValue)) {
      // If field is empty or invalid, set to default
      const defaultValue = 200
      setTotalBetAmount(defaultValue)
      setTotalBetAmountInput(defaultValue.toString())
      try {
        await updateFilters({ totalBetAmount: defaultValue })
      } catch (error) {
        console.error('Failed to save default total bet amount:', error)
      }
    } else if (numValue < 0) {
      // If user entered a negative value, set to 0
      setTotalBetAmount(0)
      setTotalBetAmountInput('0')
      try {
        await updateFilters({ totalBetAmount: 0 })
      } catch (error) {
        console.error('Failed to save minimum total bet amount:', error)
      }
    } else {
      // Valid value (including 0), make sure both states are in sync
      setTotalBetAmount(numValue)
      try {
        await updateFilters({ totalBetAmount: numValue })
      } catch (error) {
        console.error('Failed to save total bet amount:', error)
      }
    }
  }

  // Preset handlers
  const handlePreset = async (minVal: number, maxVal: number) => {
    setMinRoi(minVal)
    setMaxRoi(maxVal)
    try {
      await updateFilters({ minArb: minVal, maxArb: maxVal })
    } catch (error) {
      console.error('Failed to save preset:', error)
    }
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
          <TabsList className="grid grid-cols-2 w-full sticky top-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm z-10 border-b border-gray-200/50 dark:border-slate-800/50 rounded-none h-12">
            <TabsTrigger value="books" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white font-medium">Books</TabsTrigger>
            <TabsTrigger value="arb" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white font-medium">ROI %</TabsTrigger>
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
                  onClick={handleSelectAll}
                >
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={handleClear}>
                  Clear
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {activeBooks.map((book) => {
                const checked = filters?.selectedBooks?.includes(book.id) || false
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
                    onClick={() => handleToggleBook(book.id)}
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


          {/* Arb Range Tab */}
          <TabsContent value="arb" className="space-y-6 p-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-slate-200 mb-2">ROI %</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400 mb-6">Set minimum and maximum ROI percentages for your results.</p>
            </div>
            
            {/* Simple Input Boxes */}
            <div className="p-6 rounded-2xl border bg-gradient-to-br from-gray-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50 backdrop-blur-sm border-gray-200/50 dark:border-slate-700/50">
              <div className="grid grid-cols-2 gap-6">
                {/* Min ROI Input */}
                <div className="space-y-2">
                  <Label htmlFor="min-roi" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Minimum ROI %
                  </Label>
                  <div className="relative">
                    <Input
                      id="min-roi"
                      type="number"
                      min="0"
                      max="50"
                      step="0.1"
                      value={minRoi}
                      onChange={(e) => handleMinRoiChange(e.target.value)}
                      className="pr-8 text-center font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0"
                    />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Hide opportunities below this percentage
                  </p>
                </div>

                {/* Max ROI Input */}
                <div className="space-y-2">
                  <Label htmlFor="max-roi" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Maximum ROI %
                  </Label>
                  <div className="relative">
                    <Input
                      id="max-roi"
                      type="number"
                      min="1"
                      max="100"
                      step="0.1"
                      value={maxRoi}
                      onChange={(e) => handleMaxRoiChange(e.target.value)}
                      className="pr-8 text-center font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="20"
                    />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Hide opportunities above this percentage
                  </p>
                </div>
              </div>

              {/* Total Bet Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="total-bet-amount" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total Bet Amount
                </Label>
                <div className="relative">
                  <Input
                    id="total-bet-amount"
                    type="number"
                    min="0"
                    step="10"
                    value={totalBetAmountInput}
                    onChange={(e) => handleTotalBetAmountChange(e.target.value)}
                    onBlur={handleTotalBetAmountBlur}
                    className="pl-8 pr-4 py-2 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="200"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">$</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Default total amount to distribute between both sides
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Presets</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Current: {minRoi.toFixed(1)}% - {maxRoi.toFixed(1)}%
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreset(0, 20)}
                    className="text-xs"
                  >
                    All (0% - 20%)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreset(1, 15)}
                    className="text-xs"
                  >
                    Quality (1% - 15%)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreset(2, 10)}
                    className="text-xs"
                  >
                    Conservative (2% - 10%)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreset(5, 50)}
                    className="text-xs"
                  >
                    High Only (5%+)
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        </div>

        {/* Simple Footer */}
        <div className="flex justify-end items-center gap-3 p-6 border-t border-gray-200/50 dark:border-slate-800/50 bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-950/50 backdrop-blur-sm sticky bottom-0">
          <Button
            onClick={() => onOpenChange(false)}
            className="px-6 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-lg"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


