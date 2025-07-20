"use client"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { RefreshCw, Share2, Eye, EyeOff, Upload, Copy, MessageCircle, Scan, Clock } from "lucide-react"

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
    <div className="mb-6">
      <TooltipProvider>
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-0 shadow-xl rounded-3xl p-6 sm:p-8">
          {/* Header Content */}
          <div className="space-y-6">
            {/* Title Section - Modern Layout */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <Scan className="h-6 w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Betslip Analysis</h1>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                      {betslip.updated_at
                        ? (() => {
                            const updateTime = new Date(betslip.updated_at)
                            const now = new Date()
                            const diffMs = now.getTime() - updateTime.getTime()
                            const diffMins = Math.floor(diffMs / 60000)
                            const diffHours = Math.floor(diffMs / 3600000)
                            const diffDays = Math.floor(diffMs / 86400000)

                            if (diffMins < 1) return "Just updated"
                            if (diffMins < 60) return `${diffMins}m ago`
                            if (diffHours < 24) return `${diffHours}h ago`
                            if (diffDays < 7) return `${diffDays}d ago`

                            return updateTime.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          })()
                        : "Recently scanned"}
                    </span>
                  </div>
                </div>
              </div>

              {/* New Scan Button - Enhanced */}
              <Button
                onClick={() => (window.location.href = "/betslip-scanner")}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white h-12 px-6 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
              >
                <Upload className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">New Scan</span>
                <span className="sm:hidden">Scan</span>
              </Button>
            </div>

            {/* Action Buttons - Mobile Optimized */}
            <div className="flex items-center gap-3">
              {/* Owner Actions */}
              {isOwner && (
                <>
                  {/* Refresh Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={handleRefreshOdds}
                        disabled={isRefreshing || !canRefresh()}
                        className="h-11 flex-1 sm:flex-none sm:min-w-[120px] border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-transparent"
                      >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""} sm:mr-2`} />
                        <span className="hidden sm:inline font-medium">
                          {isRefreshing ? "Refreshing..." : "Refresh"}
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isRefreshing
                        ? "Refreshing odds for all selections..."
                        : canRefresh()
                          ? "Refresh odds for all selections"
                          : "Refresh cooldown active - please wait before refreshing again"}
                    </TooltipContent>
                  </Tooltip>

                  {/* Privacy Toggle */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={handleTogglePrivacy}
                        disabled={isUpdatingPrivacy}
                        className="h-11 flex-1 sm:flex-none sm:min-w-[120px] border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-transparent"
                      >
                        {isPublicState ? <Eye className="h-4 w-4 sm:mr-2" /> : <EyeOff className="h-4 w-4 sm:mr-2" />}
                        <span className="hidden sm:inline font-medium">
                          {isUpdatingPrivacy ? "Updating..." : isPublicState ? "Make Private" : "Make Public"}
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isPublicState
                        ? "Make this betslip private (only you can view)"
                        : "Make this betslip public (shareable with others)"}
                    </TooltipContent>
                  </Tooltip>
                </>
              )}

              {/* Share Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-11 flex-1 sm:flex-none sm:min-w-[100px] border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-transparent"
                  >
                    <Share2 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline font-medium">Share</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-xl"
                >
                  <DropdownMenuItem
                    onClick={handleCopyLink}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Copy className="h-4 w-4 mr-3" />
                    Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={shareToTwitter}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <MessageCircle className="h-4 w-4 mr-3" />
                    Share to Twitter
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={shareToReddit}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <MessageCircle className="h-4 w-4 mr-3" />
                    Share to Reddit
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Status Indicators - Only show if actively processing */}
            {(isRefreshing || isUpdatingPrivacy) && (
              <div className="flex items-center gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                {isRefreshing && (
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">Refreshing odds...</span>
                  </div>
                )}
                {isUpdatingPrivacy && (
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">Updating privacy...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </TooltipProvider>
    </div>
  )
}
