"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Clock,
  Eye,
  Search,
  History,
  Scan,
  FileText,
  RefreshCw,
  TrendingUp,
  Target,
  Zap,
  BarChart3,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth/auth-provider"
import { useBetslipHistory, type BetslipSelection } from "@/hooks/use-betslip-history"
import { useUrlState } from "@/hooks/use-url-state"
import { useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"

// URL state interface
interface HistoryUrlState {
  page: number
  search: string
  type: "all" | "scanned" | "created"
  status: "all" | "active" | "settled" | "void"
}

const defaultUrlState: HistoryUrlState = {
  page: 1,
  search: "",
  type: "all",
  status: "all",
}

export default function HistoryPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // URL state management
  const { state: urlState, updateState } = useUrlState(defaultUrlState, { replace: true })

  // Query parameters for API
  const queryParams = useMemo(
    () => ({
      page: urlState.page,
      limit: 20,
      type: urlState.type,
      status: urlState.status,
      search: urlState.search || undefined,
    }),
    [urlState],
  )

  // Fetch data with TanStack Query
  const { data, isLoading, isFetching, isError, error, refetch } = useBetslipHistory(queryParams)

  // Handle filter changes
  const handleSearchChange = (search: string) => {
    updateState({ search, page: 1 }) // Reset to page 1 when searching
  }

  const handleTypeChange = (type: "all" | "scanned" | "created") => {
    updateState({ type, page: 1 })
  }

  const handleStatusChange = (status: "all" | "active" | "settled" | "void") => {
    updateState({ status, page: 1 })
  }

  const handlePageChange = (page: number) => {
    updateState({ page })
  }

  // Manual refresh
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["betslipHistory"] })
    refetch()
  }

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800"
      case "settled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800"
      case "void":
        return "bg-slate-100 text-slate-800 dark:bg-slate-800/50 dark:text-slate-300 border-slate-200 dark:border-slate-700"
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800/50 dark:text-slate-300 border-slate-200 dark:border-slate-700"
    }
  }

  const getTypeIcon = (type: string) => {
    return type === "scanned" ? <Scan className="h-4 w-4" /> : <FileText className="h-4 w-4" />
  }

  const getTypeColor = (type: string) => {
    return type === "scanned"
      ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800"
      : "bg-slate-100 text-slate-800 dark:bg-slate-800/50 dark:text-slate-300 border-slate-200 dark:border-slate-700"
  }

  const formatMarketName = (market: string) => {
    return market.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const formatBetSelection = (selection: BetslipSelection) => {
    if (selection.selection) {
      // Finalized betslip - show selection (Over/Under)
      return `${selection.selection} ${selection.line}`
    } else {
      // Scanned betslip - show bet_type (over/under)
      return `${selection.bet_type.charAt(0).toUpperCase() + selection.bet_type.slice(1)} ${selection.line}`
    }
  }

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-6">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-6 w-48" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
                <Skeleton className="h-9 w-20" />
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <Skeleton className="h-4 w-32 mb-3" />
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-3/4" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card className="border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <History className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Sign in required</h3>
            <p className="text-slate-600 dark:text-slate-400">Please sign in to view your betslip history.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const betslips = data?.data.betslips || []
  const pagination = data?.data.pagination
  const summary = data?.data.summary

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800/50">
      <div className="absolute inset-0 bg-grid-white/[0.02] dark:bg-grid-white/[0.05]" />

      <div className="container max-w-7xl mx-auto py-8 px-4 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">Betslip History</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              View and manage all your scanned and created betslips
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
            className="gap-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 bg-transparent"
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            Refresh
          </Button>
        </motion.div>

        {/* Summary Stats */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <Card className="border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
                    <BarChart3 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{summary.totalBetslips}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Total Betslips</div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <Scan className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{summary.scannedCount}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Scanned</div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
                    <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{summary.createdCount}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Created</div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{summary.activeCount}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Active</div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="mb-8 border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search betslips..."
                      value={urlState.search}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-10 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Select value={urlState.type} onValueChange={handleTypeChange}>
                    <SelectTrigger className="w-full sm:w-40 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="scanned">
                        <div className="flex items-center gap-2">
                          <Scan className="h-4 w-4" />
                          Scanned
                        </div>
                      </SelectItem>
                      <SelectItem value="created">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Created
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={urlState.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-full sm:w-40 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="settled">Settled</SelectItem>
                      <SelectItem value="void">Void</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-6"
        >
          {isLoading ? (
            <LoadingSkeleton />
          ) : isError ? (
            <Card className="border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30 w-fit mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Error loading betslips</h3>
                <div className="text-red-600 dark:text-red-400 mb-6">{error?.message}</div>
                <Button
                  onClick={handleRefresh}
                  className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : betslips.length === 0 ? (
            <Card className="border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 w-fit mx-auto mb-4">
                  <History className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No betslips found</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                  {urlState.search || urlState.type !== "all" || urlState.status !== "all"
                    ? "Try adjusting your filters to see more results."
                    : "You haven't created or scanned any betslips yet. Get started by scanning your first betslip!"}
                </p>
                {!urlState.search && urlState.type === "all" && urlState.status === "all" && (
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      asChild
                      className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900"
                    >
                      <Link href="/betslip-scanner">
                        <Scan className="h-4 w-4 mr-2" />
                        Scan Betslip
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      asChild
                      className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 bg-transparent"
                    >
                      <Link href="/parlay-builder">
                        <FileText className="h-4 w-4 mr-2" />
                        Create Betslip
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            betslips.map((betslip, index) => (
              <motion.div
                key={betslip.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Card className="border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-600">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1 min-w-0">
                          {/* Title and Type */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800">
                                {getTypeIcon(betslip.type)}
                              </div>
                              <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                                {betslip.title}
                              </h3>
                            </div>
                          </div>

                          {/* Badges */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={cn("capitalize border", getTypeColor(betslip.type))}>
                              {betslip.type}
                            </Badge>

                            <Badge className={cn("capitalize border", getStatusColor(betslip.status))}>
                              {betslip.status}
                            </Badge>

                            {betslip.isPublic && (
                              <Badge
                                variant="outline"
                                className="text-green-600 border-green-600 dark:text-green-400 dark:border-green-400"
                              >
                                Public
                              </Badge>
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400 flex-wrap">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              <span>
                                {betslip.totalSelections} selection{betslip.totalSelections !== 1 ? "s" : ""}
                              </span>
                            </div>

                            {betslip.sportsbook && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-medium">
                                  {betslip.sportsbook}
                                </span>
                              </div>
                            )}

                            {betslip.scanConfidence && (
                              <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                <span className="text-xs">{Math.round(betslip.scanConfidence * 100)}% confidence</span>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{formatDate(betslip.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 bg-transparent"
                          >
                            <Link href={`/betslip/${betslip.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </Button>
                        </div>
                      </div>

                      {/* Selections Preview */}
                      {betslip.selections && betslip.selections.length > 0 && (
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Preview ({betslip.selections.length} selection{betslip.selections.length !== 1 ? "s" : ""}
                              )
                            </h4>
                            <div className="space-y-2">
                              {betslip.selections.slice(0, 3).map((selection, index) => (
                                <div
                                  key={selection.id}
                                  className="flex items-center justify-between text-sm p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/50 dark:border-slate-700/50"
                                >
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    <span className="font-medium text-slate-900 dark:text-white truncate">
                                      {selection.player_name}
                                    </span>
                                    <span className="text-slate-500 dark:text-slate-400 truncate">
                                      {formatMarketName(selection.market)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs whitespace-nowrap ml-2">
                                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded font-medium">
                                      {formatBetSelection(selection)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                              {betslip.selections.length > 3 && (
                                <div className="text-xs text-slate-500 dark:text-slate-400 text-center py-2 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                                  +{betslip.selections.length - 3} more selection
                                  {betslip.selections.length - 3 !== 1 ? "s" : ""}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 flex justify-center"
          >
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrev || isFetching}
                className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Previous
              </Button>

              <div className="flex items-center gap-2 px-4">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNext || isFetching}
                className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Next
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
