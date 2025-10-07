'use client'

import React, { useState, useEffect } from 'react'
import { Filter, X, Percent, TrendingUp, Clock, BarChart3 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EVFilters, SUPPORTED_SPORTS, SUPPORTED_SCOPES } from '@/types/ev-types'

interface EVFiltersModalProps {
  filters: EVFilters
  onFiltersChange: (filters: Partial<EVFilters>) => void
}

export function EVFiltersModal({ filters, onFiltersChange }: EVFiltersModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState<EVFilters>(filters)

  // Sync local filters with props when modal opens or filters change
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters, isOpen])

  const handleSave = () => {
    onFiltersChange(localFilters)
    setIsOpen(false)
  }

  const handleReset = () => {
    const defaultFilters: EVFilters = {
      sports: ['nfl'],
      scope: ['pregame'],
      min_ev: 2,
      limit: 50,
      sort_by: 'ev_percentage',
      sort_direction: 'desc'
    }
    setLocalFilters(defaultFilters)
  }

  const handlePresetEV = (minEV: number) => {
    setLocalFilters(prev => ({ ...prev, min_ev: minEV }))
  }

  const handlePresetLimit = (limit: number) => {
    setLocalFilters(prev => ({ ...prev, limit }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
          aria-label="Advanced filters"
        >
          <Filter className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] mx-4 p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            EV Filters & Settings
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 max-h-[calc(90vh-120px)] overflow-y-auto">
          <Tabs defaultValue="filters" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="filters" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </TabsTrigger>
              <TabsTrigger value="ev-range" className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                EV Range
              </TabsTrigger>
              <TabsTrigger value="display" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Display
              </TabsTrigger>
            </TabsList>

            {/* Basic Filters Tab */}
            <TabsContent value="filters" className="space-y-6">
              {/* Sports Selection */}
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                  Sports
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {SUPPORTED_SPORTS.map(sport => (
                    <label key={sport} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={localFilters.sports?.includes(sport) || false}
                        onChange={(e) => {
                          const sports = localFilters.sports || []
                          if (e.target.checked) {
                            setLocalFilters(prev => ({ ...prev, sports: [...sports, sport] }))
                          } else {
                            setLocalFilters(prev => ({ ...prev, sports: sports.filter(s => s !== sport) }))
                          }
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 uppercase">
                        {sport}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Scopes Selection */}
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                  Game Scope
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {SUPPORTED_SCOPES.map(scope => (
                    <label key={scope} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={localFilters.scope?.includes(scope) || false}
                        onChange={(e) => {
                          const newScope = localFilters.scope || ''
                          if (e.target.checked) {
                            setLocalFilters(prev => ({ ...prev, scope}))
                          } else {
                            setLocalFilters(prev => ({ ...prev, scope : ''}))
                          }
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                        {scope}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                  Sort By
                </Label>
                <div className="grid grid-cols-1 gap-3">
                  <select
                    value={localFilters.sort_by || 'ev_percentage'}
                    onChange={(e) => setLocalFilters(prev => ({ ...prev, sort_by: e.target.value as any }))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="ev_percentage">EV Percentage</option>
                    <option value="best_odds">Best Odds</option>
                    <option value="start">Game Time</option>
                    <option value="market">Market</option>
                  </select>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="sort_direction"
                        value="desc"
                        checked={localFilters.sort_direction === 'desc'}
                        onChange={() => setLocalFilters(prev => ({ ...prev, sort_direction: 'desc' }))}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Descending</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="sort_direction"
                        value="asc"
                        checked={localFilters.sort_direction === 'asc'}
                        onChange={() => setLocalFilters(prev => ({ ...prev, sort_direction: 'asc' }))}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Ascending</span>
                    </label>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* EV Range Tab */}
            <TabsContent value="ev-range" className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                  Minimum EV Percentage
                </Label>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Percent className="h-4 w-4 text-gray-500" />
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={localFilters.min_ev || ''}
                      onChange={(e) => setLocalFilters(prev => ({ 
                        ...prev, 
                        min_ev: e.target.value ? parseFloat(e.target.value) : undefined 
                      }))}
                      placeholder="e.g. 2.5"
                      className="flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  
                  {/* Quick Presets */}
                  <div>
                    <Label className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">Quick Presets</Label>
                    <div className="flex flex-wrap gap-2">
                      {[0, 1, 2, 3, 5, 10, 15, 20].map(preset => (
                        <Button
                          key={preset}
                          variant={localFilters.min_ev === preset ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePresetEV(preset)}
                          className="text-xs px-3 py-1"
                        >
                          {preset}%
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Display Tab */}
            <TabsContent value="display" className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                  Results Per Page
                </Label>
                <div className="space-y-4">
                  <select
                    value={localFilters.limit || 50}
                    onChange={(e) => setLocalFilters(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={10}>10 results</option>
                    <option value={25}>25 results</option>
                    <option value={50}>50 results</option>
                    <option value={100}>100 results</option>
                    <option value={200}>200 results</option>
                    <option value={500}>500 results</option>
                  </select>
                  
                  {/* Quick Presets */}
                  <div>
                    <Label className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">Quick Presets</Label>
                    <div className="flex flex-wrap gap-2">
                      {[25, 50, 100, 200].map(preset => (
                        <Button
                          key={preset}
                          variant={localFilters.limit === preset ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePresetLimit(preset)}
                          className="text-xs px-3 py-1"
                        >
                          {preset}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Future: Auto-refresh settings */}
              <div className="opacity-50 pointer-events-none">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                  Auto-Refresh (Coming Soon)
                </Label>
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Enable auto-refresh</span>
                  </div>
                  <Switch disabled />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleReset}
              className="text-sm"
            >
              Reset to Defaults
            </Button>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

