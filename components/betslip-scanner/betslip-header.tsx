"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { RefreshCw, Share2, Eye, EyeOff, Upload, Copy, MessageCircle, BarChart3 } from 'lucide-react'

interface BetslipHeaderProps {
  betslip: any
  isOwner: boolean
  isPublicState: boolean
  isRefreshing: boolean
  isUpdatingPrivacy: boolean
  canRefresh: () => boolean
  getTimeUntilNextRefresh: () => number
  formatTimeRemaining: (ms: number) => string
  handleRefreshOdds: () => void
  handleTogglePrivacy: () => void
  handleCopyLink: () => void
  shareToTwitter: () => void
  shareToReddit: () => void
}

export function BetslipHeader({
  betslip,
  isOwner,
  isPublicState,
  isRefreshing,
  isUpdatingPrivacy,
  canRefresh,
  getTimeUntilNextRefresh,
  formatTimeRemaining,
  handleRefreshOdds,
  handleTogglePrivacy,
  handleCopyLink,
  shareToTwitter,
  shareToReddit,
}: BetslipHeaderProps) {
  return (
    <div className="mb-4">
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-4 shadow-lg">
        {/* Mobile-First Layout */}
        <div className="space-y-4">
          {/* Title Section - Improved Visual Hierarchy */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-sm">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  Bet Slip Scanner
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {betslip.updated_at ? (() => {
                      const updateTime = new Date(betslip.updated_at);
                      const now = new Date();
                      const diffMs = now.getTime() - updateTime.getTime();
                      const diffMins = Math.floor(diffMs / 60000);
                      const diffHours = Math.floor(diffMs / 3600000);
                      const diffDays = Math.floor(diffMs / 86400000);
                      
                      if (diffMins < 1) return 'Just updated';
                      if (diffMins < 60) return `Updated ${diffMins}m ago`;
                      if (diffHours < 24) return `Updated ${diffHours}h ago`;
                      if (diffDays < 7) return `Updated ${diffDays}d ago`;
                      
                      return `Updated ${updateTime.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}`;
                    })() : 'Recently scanned'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* New Scan - Enhanced Touch Target */}
            <Button
              variant="default"
              size="default"
              onClick={() => window.location.href = "/betslip-scanner"}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-11 px-4 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Upload className="h-4 w-4 mr-2" />
              <span className="font-semibold">New Scan</span>
            </Button>
          </div>

          {/* Subtle Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent"></div>

          {/* Action Buttons Row - Enhanced Touch Targets */}
          <div className="flex items-center justify-between gap-3 -mt-1">
            <div className="flex items-center gap-3 flex-1">
              {/* Refresh Button - Larger Touch Target */}
              {isOwner && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="default"
                      onClick={handleRefreshOdds}
                      disabled={isRefreshing || !canRefresh()}
                      className="h-11 flex-1 sm:flex-none hover:bg-blue-50 dark:hover:bg-blue-950/30 border-gray-300 dark:border-gray-600"
                    >
                      <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''} sm:mr-2`} />
                      <span className="hidden sm:inline font-medium">
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isRefreshing 
                      ? 'Refreshing odds for all selections...'
                      : canRefresh() 
                        ? 'Refresh odds for all selections'
                        : `Wait ${formatTimeRemaining(getTimeUntilNextRefresh())} before refreshing again`
                    }
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Privacy Toggle - Larger Touch Target */}
              {isOwner && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="default"
                      onClick={handleTogglePrivacy}
                      disabled={isUpdatingPrivacy}
                      className="h-11 flex-1 sm:flex-none hover:bg-gray-50 dark:hover:bg-gray-900 border-gray-300 dark:border-gray-600"
                    >
                      {isPublicState ? <Eye className="h-5 w-5 sm:mr-2" /> : <EyeOff className="h-5 w-5 sm:mr-2" />}
                      <span className="hidden sm:inline font-medium">
                        {isPublicState ? 'Make Private' : 'Make Public'}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isPublicState ? 'Make this betslip private' : 'Share this betslip publicly'}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Share Button - Enhanced Touch Target */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="default" className="h-11 shrink-0 hover:bg-gray-50 dark:hover:bg-gray-900 border-gray-300 dark:border-gray-600">
                  <Share2 className="h-5 w-5 sm:mr-2" />
                  <span className="hidden sm:inline font-medium">Share</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={shareToTwitter}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Share to Twitter
                </DropdownMenuItem>
                <DropdownMenuItem onClick={shareToReddit}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Share to Reddit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  )
}