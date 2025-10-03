'use client'

import React, { useState, useMemo } from 'react'
import { TrendingUp, Filter, RefreshCw, Download } from 'lucide-react'
import { EVTable } from '@/components/ev/ev-table'
import { EVFiltersModal } from '@/components/ev/ev-filters-modal'
import { useEVPlays, useEVExpansions } from '@/hooks/use-ev-plays'
import { EVFilters, EVPlay, EVExpansionData, SUPPORTED_SPORTS, SUPPORTED_SCOPES } from '@/types/ev-types'

export default function EVPage() {
  // Filter state
  const [filters, setFilters] = useState<EVFilters>({
    sports: ['nfl'],
    scopes: ['pregame'],
    min_ev: 2,
    limit: 50,
    sort_by: 'ev_percentage',
    sort_direction: 'desc'
  })
  
  // Expanded rows state
  const [expandedRows, setExpandedRows] = useState<Record<string, EVExpansionData>>({})
  const [loadingExpansions, setLoadingExpansions] = useState<Set<string>>(new Set())
  
  // Hooks
  const { data: evData, isLoading, error, isFetching, refetch } = useEVPlays(filters)
  const { getExpansionData, prefetchExpansion } = useEVExpansions()
  
  // Extract plays from response
  const plays = evData?.data || []
  const metadata = evData?.metadata
  
  // Handle row expansion
  const handleRowExpand = async (play: EVPlay) => {
    const playId = play.id
    
    // If already expanded, collapse it
    if (expandedRows[playId]) {
      setExpandedRows(prev => {
        const next = { ...prev }
        delete next[playId]
        return next
      })
      return
    }
    
    // Check if we already have cached data
    const cachedData = getExpansionData(playId)
    if (cachedData) {
      setExpandedRows(prev => ({
        ...prev,
        [playId]: cachedData
      }))
      return
    }
    
    // Fetch expansion data
    setLoadingExpansions(prev => new Set([...prev, playId]))
    
    try {
      const params = new URLSearchParams({
        sport: play.sport,
        event_id: play.event_id,
        market: play.market,
        market_key: play.market_key,
        side: play.side,
        line: play.line.toString()
      })
      
      if ('player_id' in play && play.player_id) {
        params.set('player_id', play.player_id)
      }
      
      const response = await fetch(`/api/ev-expansion?${params.toString()}`)
      const result = await response.json()
      
      if (result.success) {
        setExpandedRows(prev => ({
          ...prev,
          [playId]: result.data
        }))
      } else {
        console.error('Failed to fetch expansion data:', result.error)
      }
    } catch (error) {
      console.error('Error fetching expansion data:', error)
    } finally {
      setLoadingExpansions(prev => {
        const next = new Set(prev)
        next.delete(playId)
        return next
      })
    }
  }
  
  // Handle odds click (would open sportsbook)
  const handleOddsClick = (play: EVPlay) => {
    console.log('Open sportsbook for:', play)
    // Implementation would open sportsbook link or add to betslip
  }
  
  // Update filters
  const updateFilters = (newFilters: Partial<EVFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    // Clear expanded rows when filters change
    setExpandedRows({})
  }
  
  // Export data (placeholder)
  const handleExport = () => {
    const dataToExport = plays.map(play => ({
      sport: play.sport,
      market: play.market,
      player: 'player_name' in play ? play.player_name : `${play.away} @ ${play.home}`,
      line: `${play.side} ${play.line}`,
      ev_percentage: play.ev_percentage,
      best_odds: play.best_odds,
      best_book: play.best_book,
      fair_odds: play.fair_odds,
      game_time: play.start
    }))
    
    const csv = [
      'Sport,Market,Player/Game,Line,EV%,Best Odds,Best Book,Fair Odds,Game Time',
      ...dataToExport.map(row => Object.values(row).join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ev-plays-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                EV Plays
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Expected value betting opportunities across all sports
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExport}
              disabled={!plays.length}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors duration-200"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      
        {/* Modern Filter Bar */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {/* Mobile Layout (< md) - Stacked */}
          <div className="block md:hidden space-y-3">
            {/* Top Row: Sports + Scope */}
            <div className="flex items-center justify-between gap-3">
              {/* Sports Selector */}
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden sm:block">Sport</span>
                <select
                  value={filters.sports?.[0] || 'nfl'}
                  onChange={(e) => updateFilters({ sports: [e.target.value] })}
                  className="px-3 py-3 text-sm font-medium bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-1 min-w-0 touch-manipulation"
                >
                  {SUPPORTED_SPORTS.map(sport => (
                    <option key={sport} value={sport}>
                      {sport.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scope Toggle */}
              <div className="flex bg-gray-200 dark:bg-gray-600 rounded-md p-0.5 flex-shrink-0">
                {SUPPORTED_SCOPES.map(scope => (
                  <button
                    key={scope}
                    onClick={() => updateFilters({ scopes: [scope] })}
                    className={`px-3 py-2 text-xs font-medium rounded transition-all touch-manipulation ${
                      filters.scopes?.includes(scope)
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 active:bg-gray-300 dark:active:bg-gray-500'
                    }`}
                  >
                    {scope.charAt(0).toUpperCase() + scope.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Row: Min EV + Results + Status + Settings */}
            <div className="flex items-center justify-between gap-3">
              {/* Min EV Input */}
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden sm:block">Min EV</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={filters.min_ev || ''}
                  onChange={(e) => updateFilters({ min_ev: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="px-3 py-3 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-1 min-w-0 touch-manipulation"
                  placeholder="2%"
                />
              </div>

              {/* Results Limit */}
              <div className="flex items-center gap-2">
                <select
                  value={filters.limit || 50}
                  onChange={(e) => updateFilters({ limit: parseInt(e.target.value) })}
                  className="px-3 py-3 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
              </div>

              {/* Status & Settings */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Refresh Indicator */}
                {isFetching && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                      Loading
                    </span>
                  </div>
                )}

                <EVFiltersModal 
                  filters={filters}
                  onFiltersChange={updateFilters}
                />
              </div>
            </div>
          </div>

          {/* Desktop Layout (>= md) - Horizontal */}
          <div className="hidden md:flex items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              {/* Sports Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sport</span>
                <select
                  value={filters.sports?.[0] || 'nfl'}
                  onChange={(e) => updateFilters({ sports: [e.target.value] })}
                  className="px-3 py-2.5 text-sm font-medium bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[80px] touch-manipulation"
                >
                  {SUPPORTED_SPORTS.map(sport => (
                    <option key={sport} value={sport}>
                      {sport.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scope Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Scope</span>
                <div className="flex bg-gray-200 dark:bg-gray-600 rounded-md p-0.5">
                  {SUPPORTED_SCOPES.map(scope => (
                    <button
                      key={scope}
                      onClick={() => updateFilters({ scopes: [scope] })}
                      className={`px-3 py-2 text-xs font-medium rounded transition-all touch-manipulation ${
                        filters.scopes?.includes(scope)
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' 
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 active:bg-gray-300 dark:active:bg-gray-500'
                      }`}
                    >
                      {scope.charAt(0).toUpperCase() + scope.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Min EV Input */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Min EV</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={filters.min_ev || ''}
                  onChange={(e) => updateFilters({ min_ev: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="px-3 py-2.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[80px] touch-manipulation"
                  placeholder="2%"
                />
              </div>

              {/* Results Limit */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Results</span>
                <select
                  value={filters.limit || 50}
                  onChange={(e) => updateFilters({ limit: parseInt(e.target.value) })}
                  className="px-3 py-2.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[80px] touch-manipulation"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
              </div>
            </div>

            {/* Settings & Status */}
            <div className="flex items-center gap-3">
              {/* Refresh Indicator */}
              {isFetching && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                    Loading EV plays...
                  </span>
                </div>
              )}

              <EVFiltersModal 
                filters={filters}
                onFiltersChange={updateFilters}
              />
            </div>
          </div>
        </div>
      
      </div>

      {/* Stats Cards */}
      {metadata && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
          <div className="bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-slate-900/95 dark:to-slate-950/95 backdrop-blur-sm border border-gray-200 dark:border-slate-700 rounded-lg p-3 sm:p-4 shadow-sm">
            <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{metadata.total_count}</div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total EV Plays</div>
          </div>
          
          <div className="bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-slate-900/95 dark:to-slate-950/95 backdrop-blur-sm border border-gray-200 dark:border-slate-700 rounded-lg p-3 sm:p-4 shadow-sm">
            <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{metadata.sports.length}</div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Active Sports</div>
          </div>
          
          <div className="bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-slate-900/95 dark:to-slate-950/95 backdrop-blur-sm border border-gray-200 dark:border-slate-700 rounded-lg p-3 sm:p-4 shadow-sm">
            <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
              {plays.length > 0 ? `${plays[0].ev_percentage.toFixed(1)}%` : '0%'}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Top EV</div>
          </div>
          
          <div className="bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-slate-900/95 dark:to-slate-950/95 backdrop-blur-sm border border-gray-200 dark:border-slate-700 rounded-lg p-3 sm:p-4 shadow-sm">
            <div className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
              {metadata.cache_hit ? 'CACHED' : 'LIVE'}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Data Source</div>
          </div>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="mb-4">
          <div className="max-w-md mx-auto">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                Unable to Load EV Plays
              </h2>
              <p className="text-red-600 dark:text-red-400 mb-4 text-sm">
                {error instanceof Error ? error.message : 'Failed to load EV plays'}
              </p>
              <button 
                onClick={() => refetch()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded-md transition-colors duration-200 font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* EV Table */}
      <EVTable
        data={plays}
        loading={isLoading}
        onRowExpand={handleRowExpand}
        expandedRows={expandedRows}
        onOddsClick={handleOddsClick}
      />
      
      {/* Loading indicator for expansions */}
      {loadingExpansions.size > 0 && (
        <div className="fixed bottom-4 right-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg shadow-lg border border-blue-500">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">Loading details...</span>
          </div>
        </div>
      )}
    </div>
  )
}

