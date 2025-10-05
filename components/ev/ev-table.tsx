'use client'

import React, { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, ExternalLink, TrendingUp, Clock, Users } from 'lucide-react'
import { 
  EVPlay, 
  isPlayerEVPlay, 
  formatOdds, 
  formatEVPercentage, 
  getMarketLabel,
  EVExpansionData 
} from '@/types/ev-types'

interface EVTableProps {
  data: EVPlay[]
  loading?: boolean
  onRowExpand?: (play: EVPlay) => void
  expandedRows?: Record<string, EVExpansionData>
  onOddsClick?: (play: EVPlay) => void
  className?: string
}

export function EVTable({ 
  data, 
  loading = false, 
  onRowExpand,
  expandedRows = {},
  onOddsClick,
  className = '' 
}: EVTableProps) {
  const [sortField, setSortField] = useState<keyof EVPlay>('ev_percentage')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Sort data
  const sortedData = useMemo(() => {
    if (!data.length) return []

    return [...data].sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      // Handle special sorting for dates and numbers
      if (sortField === 'start') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      return sortDirection === 'desc' ? -comparison : comparison
    })
  }, [data, sortField, sortDirection])

  const handleSort = (field: keyof EVPlay) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const handleRowClick = (play: EVPlay) => {
    onRowExpand?.(play)
  }

  const formatTimeUntilStart = (startTime: string) => {
    const start = new Date(startTime)
    const now = new Date()
    const diffMs = start.getTime() - now.getTime()
    
    if (diffMs < 0) return 'Live'
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diffHours > 24) {
      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays}d ${diffHours % 24}h`
    }
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`
    }
    
    return `${diffMinutes}m`
  }

  const SortableHeader = ({ 
    field, 
    children, 
    className: headerClassName = '' 
  }: { 
    field: keyof EVPlay
    children: React.ReactNode
    className?: string 
  }) => (
    <th
      onClick={() => handleSort(field)}
      className={`px-4 py-3 text-xs font-semibold text-gray-900 dark:text-slate-100 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700/30 transition-colors ${headerClassName}`}
    >
      <div className="flex items-center justify-center space-x-1">
        <span>{children}</span>
        {sortField === field && (
          sortDirection === 'desc' ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />
        )}
      </div>
    </th>
  )

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900/90 rounded-lg border border-gray-200 dark:border-slate-600 overflow-hidden shadow-lg dark:shadow-xl">
        <div className="animate-pulse">
          <div className="h-14 bg-gray-100 dark:bg-slate-800/60 rounded-t-lg border-b border-gray-200 dark:border-slate-600"></div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-50 dark:bg-slate-800/40 border-b border-gray-100 dark:border-slate-700/50 flex items-center px-4 space-x-4">
              <div className="w-16 h-8 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
              </div>
              <div className="w-20 h-6 bg-gray-200 dark:bg-slate-700 rounded"></div>
              <div className="w-16 h-6 bg-gray-200 dark:bg-slate-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="bg-white dark:bg-slate-900/90 rounded-lg border border-gray-200 dark:border-slate-600 shadow-lg dark:shadow-xl p-12">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 dark:bg-slate-700/60 rounded-full flex items-center justify-center">
            <TrendingUp className="h-8 w-8 text-gray-400 dark:text-slate-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-3">No EV Plays Found</h3>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
            Try adjusting your filters or check back later for new opportunities. EV plays are updated in real-time as odds change.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-slate-900/90 rounded-lg border border-gray-200 dark:border-slate-600 overflow-hidden shadow-lg dark:shadow-xl ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-600">
          <thead className="bg-gray-50 dark:bg-slate-800/60">
            <tr className="border-b border-gray-200 dark:border-slate-600">
              <SortableHeader field="ev_percentage" className="text-center">EV %</SortableHeader>
              <SortableHeader field="market" className="text-center">Market</SortableHeader>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-900 dark:text-slate-100 uppercase tracking-wider">
                Player/Game
              </th>
              <SortableHeader field="line" className="text-center">Line</SortableHeader>
              <SortableHeader field="best_odds" className="text-center">Best Odds</SortableHeader>
              <SortableHeader field="fair_odds" className="text-center">Fair Odds</SortableHeader>
              <SortableHeader field="best_book" className="text-center">Book</SortableHeader>
              <SortableHeader field="start" className="text-center">Game Time</SortableHeader>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-900 dark:text-slate-100 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900/90 divide-y divide-gray-200 dark:divide-slate-600">
            {sortedData.map((play, index) => {
              const isExpanded = expandedRows[play.id] !== undefined
              const rowBgClass = index % 2 === 0 ? 'bg-white dark:bg-slate-900/90' : 'bg-gray-50 dark:bg-slate-800/40'
              
              return (
                <React.Fragment key={play.id}>
                  <tr 
                    className={`${rowBgClass} hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer border-b border-gray-200 dark:border-slate-600`}
                    onClick={() => handleRowClick(play)}
                  >
                    {/* EV Percentage */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center">
                        <span className={`text-lg font-bold px-3 py-1 rounded-full ${
                          play.ev_percentage >= 10 
                            ? 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30' 
                            : play.ev_percentage >= 5 
                            ? 'text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/30'
                            : 'text-gray-900 dark:text-slate-100 bg-gray-100 dark:bg-slate-700/40'
                        }`}>
                          {formatEVPercentage(play.ev_percentage)}
                        </span>
                      </div>
                    </td>

                    {/* Market */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                        {getMarketLabel(play.market)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400 uppercase font-medium mt-1 px-2 py-1 bg-gray-100 dark:bg-slate-700/40 rounded-full inline-block">
                        {play.side}
                      </div>
                    </td>

                    {/* Player/Game Info */}
                    <td className="px-4 py-4 text-center">
                      {isPlayerEVPlay(play) ? (
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                            {play.player_name}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-slate-300 mt-1">
                            {play.position} - {play.team}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                            {play.away} @ {play.home}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-slate-300 mt-1">
                            Game Total
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Line */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-semibold text-gray-900 dark:text-slate-100 px-2 py-1 bg-gray-100 dark:bg-slate-700/40 rounded-md">
                        {play.side === 'over' ? 'o' : 'u'}{play.line}
                      </span>
                    </td>

                    {/* Best Odds */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-bold text-green-700 dark:text-green-300 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-md">
                        {formatOdds(play.best_odds)}
                      </span>
                    </td>

                    {/* Fair Odds */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-medium text-gray-600 dark:text-slate-400 px-2 py-1 bg-gray-100 dark:bg-slate-700/40 rounded-md">
                        {formatOdds(play.fair_odds)}
                      </span>
                    </td>

                    {/* Best Book */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-semibold text-gray-900 dark:text-slate-100 capitalize px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md">
                        {play.best_book}
                      </span>
                    </td>

                    {/* Game Time */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center text-sm text-gray-600 dark:text-slate-300">
                        <Clock className="h-3 w-3 mr-1" />
                        <span className="font-medium">{formatTimeUntilStart(play.start)}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onOddsClick?.(play)
                          }}
                          className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors"
                          title="Place bet"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                        {onRowExpand && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRowClick(play)
                            }}
                            className="p-2 text-gray-600 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200 bg-gray-50 dark:bg-slate-700/40 hover:bg-gray-100 dark:hover:bg-slate-600/40 rounded-md transition-colors"
                            title={isExpanded ? "Collapse details" : "Expand details"}
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expansion Row */}
                  {isExpanded && expandedRows[play.id] && (
                    <tr className="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-600">
                      <td colSpan={9} className="px-4 py-6">
                        <div className="bg-white dark:bg-slate-900/90 rounded-lg p-4 border border-gray-200 dark:border-slate-600 shadow-sm">
                          <div className="flex items-center text-sm text-gray-600 dark:text-slate-300 mb-4 font-medium">
                            <Users className="h-4 w-4 mr-2" />
                            All Available Sportsbooks
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-4">
                            {expandedRows[play.id].all_books.map((book, bookIndex) => (
                              <div 
                                key={bookIndex}
                                className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-900 rounded-lg border border-gray-200 dark:border-slate-600 p-3 text-center shadow-sm hover:shadow-md transition-shadow"
                              >
                                <div className="font-semibold text-sm capitalize text-gray-900 dark:text-slate-100 mb-1">{book.book}</div>
                                <div className="text-lg font-bold text-green-700 dark:text-green-300 mb-1">
                                  {formatOdds(book.odds)}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-slate-400 px-2 py-1 bg-gray-200 dark:bg-slate-700/60 rounded-full">
                                  {book.side === 'over' ? 'o' : 'u'}{book.line}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Market Stats */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-slate-600">
                            <div className="text-center">
                              <div className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide font-medium mb-1">Total Books</div>
                              <div className="text-lg font-bold text-gray-900 dark:text-slate-100">{expandedRows[play.id].market_stats.total_books}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide font-medium mb-1">Best Odds</div>
                              <div className="text-lg font-bold text-green-700 dark:text-green-300">
                                {formatOdds(expandedRows[play.id].market_stats.best_odds)}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide font-medium mb-1">Worst Odds</div>
                              <div className="text-lg font-bold text-red-700 dark:text-red-300">
                                {formatOdds(expandedRows[play.id].market_stats.worst_odds)}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide font-medium mb-1">Spread</div>
                              <div className="text-lg font-bold text-gray-900 dark:text-slate-100">
                                {expandedRows[play.id].market_stats.odds_spread}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

