"use client"

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Filter, Check } from 'lucide-react'
import { useOddsPreferences } from '@/contexts/preferences-context'
import { getAllActiveSportsbooks } from '@/data/sportsbooks'
import { Switch } from '@/components/ui/switch'

interface OddsFiltersProps {
  className?: string
}

export function OddsFilters({ className = '' }: OddsFiltersProps) {
  const { preferences, updatePreferences, isLoading } = useOddsPreferences()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedBooks, setSelectedBooks] = useState<string[]>([])
  const [includeAlternates, setIncludeAlternates] = useState(false)
  const [columnHighlighting, setColumnHighlighting] = useState(true)
  const [showBestLine, setShowBestLine] = useState(true)
  const [showAverageLine, setShowAverageLine] = useState(true)

  const allSportsbooks = getAllActiveSportsbooks()

  useEffect(() => {
    if (!isLoading && preferences) {
      setSelectedBooks(preferences.selectedBooks)
      setIncludeAlternates(preferences.includeAlternates)
      setColumnHighlighting(preferences.columnHighlighting)
      setShowBestLine(preferences.showBestLine)
      setShowAverageLine(preferences.showAverageLine)
    }
  }, [isLoading, preferences])

  const handleToggleSportsbook = async (sportsbookId: string) => {
    const currentBooks = selectedBooks
    const isCurrentlySelected = currentBooks.includes(sportsbookId)
    
    let newBooks: string[]
    if (isCurrentlySelected) {
      newBooks = currentBooks.filter(id => id !== sportsbookId)
    } else {
      newBooks = [...currentBooks, sportsbookId]
    }
    
    setSelectedBooks(newBooks)

    try {
      await updatePreferences({ selectedBooks: newBooks })
    } catch (error) {
      console.error('Failed to update sportsbook preferences:', error)
    }
  }
  
  const handleSelectAll = async () => {
    const allBookIds = allSportsbooks.map(sb => sb.id)
    setSelectedBooks(allBookIds)
    await updatePreferences({ selectedBooks: allBookIds })
  }
  
  const handleClearAll = async () => {
    setSelectedBooks([])
    await updatePreferences({ selectedBooks: [] })
  }

  const handleIncludeAlternatesToggle = async (value: boolean) => {
    setIncludeAlternates(value)
    await updatePreferences({ includeAlternates: value })
  }

  const handleColumnHighlightingToggle = async (value: boolean) => {
    setColumnHighlighting(value)
    await updatePreferences({ columnHighlighting: value })
  }

  const handleShowBestLineToggle = async (value: boolean) => {
    setShowBestLine(value)
    await updatePreferences({ showBestLine: value })
  }

  const handleShowAverageLineToggle = async (value: boolean) => {
    setShowAverageLine(value)
    await updatePreferences({ showAverageLine: value })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`px-3 py-2 ${className}`}
          title="Filter & Settings"
        >
          <Filter className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Filters & Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Settings Toggles - Mobile Optimized */}
          <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">Include Alternate Lines</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Show alternate lines when expanding a player or game (fetches extra data per event).
                </div>
              </div>
              <Switch
                checked={includeAlternates}
                onCheckedChange={handleIncludeAlternatesToggle}
                className="self-start sm:self-center sm:ml-4"
              />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">Column Highlighting</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Highlight the best odds with green backgrounds in the odds table.
                </div>
              </div>
              <Switch
                checked={columnHighlighting}
                onCheckedChange={handleColumnHighlightingToggle}
                className="self-start sm:self-center sm:ml-4"
              />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">Show Best Line Column</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Display the best line column showing the optimal odds from your selected sportsbooks.
                </div>
              </div>
              <Switch
                checked={showBestLine}
                onCheckedChange={handleShowBestLineToggle}
                className="self-start sm:self-center sm:ml-4"
              />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">Show Average Line Column</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Display the average line column showing market consensus from your selected sportsbooks.
                </div>
              </div>
              <Switch
                checked={showAverageLine}
                onCheckedChange={handleShowAverageLineToggle}
                className="self-start sm:self-center sm:ml-4"
              />
            </div>
          </div>

          {/* Sportsbook Selection Section */}
          <div className="pt-2">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Select which sportsbooks to display in the odds table. Your preferences will be saved across all betting tools.
            </div>
            
            {/* Action buttons - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs flex-1 sm:flex-none"
              >
                Select All ({allSportsbooks.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="text-xs flex-1 sm:flex-none"
              >
                Clear All
              </Button>
            </div>
            
            {/* Sportsbook grid - Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allSportsbooks
                .sort((a, b) => (b.priority || 0) - (a.priority || 0))
                .map((sportsbook) => {
                  const isSelected = selectedBooks.includes(sportsbook.id)
                  
                  return (
                    <div
                      key={sportsbook.id}
                      onClick={() => handleToggleSportsbook(sportsbook.id)}
                      className={`
                        relative p-3 rounded-lg border cursor-pointer transition-all touch-manipulation
                        ${isSelected 
                          ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' 
                          : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 active:bg-gray-50 dark:active:bg-gray-700'
                        }
                      `}
                    >
                      {/* Selection indicator */}
                      <div className={`
                        absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center
                        ${isSelected 
                          ? 'border-blue-500 bg-blue-500' 
                          : 'border-gray-300 dark:border-gray-600'
                        }
                      `}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      
                      {/* Sportsbook info */}
                      <div className="flex items-center space-x-3 pr-6">
                        {sportsbook.image?.light && (
                          <img
                            src={sportsbook.image.light}
                            alt={sportsbook.name}
                            className="w-8 h-8 object-contain flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {sportsbook.name}
                          </div>
                          {sportsbook.priority && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Priority: {sportsbook.priority}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
            
            {/* Selected count */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
                {selectedBooks.length} of {allSportsbooks.length} sportsbooks selected
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
